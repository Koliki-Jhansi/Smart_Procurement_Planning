import os
import joblib
import numpy as np
import pandas as pd

from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.model_selection import train_test_split, RandomizedSearchCV
from sklearn.ensemble import (
    RandomForestRegressor,
    ExtraTreesRegressor,
    HistGradientBoostingRegressor,
    RandomForestRegressor,
)
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score,
)

from extensions import db
from models.training_data import TrainingData


MODEL_DIR = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "models",
    "trained"
)

os.makedirs(MODEL_DIR, exist_ok=True)

MODEL_PATH = os.path.join(
    MODEL_DIR,
    "best_production_model.pkl"
)


def load_training_data():
    records = TrainingData.query.all()

    if not records:
        raise ValueError(
            "No training data found in crop_training_data table."
        )

    data = []

    for row in records:
        data.append({
            "district": row.district,
            "crop": row.crop,
            "season": row.season,
            "year": row.year,
            "area": row.area,
            "production": row.production,
        })

    df = pd.DataFrame(data)

    print(f"Training records loaded: {len(df)}")

    return df


def clean_training_data(df):
    df = df.copy()

    required_columns = [
        "district",
        "crop",
        "season",
        "year",
        "area",
        "production",
    ]

    df = df.dropna(subset=required_columns)

    df["district"] = (
        df["district"]
        .astype(str)
        .str.strip()
    )

    df["crop"] = (
        df["crop"]
        .astype(str)
        .str.strip()
    )

    df["season"] = (
        df["season"]
        .astype(str)
        .str.strip()
    )

    df["year"] = pd.to_numeric(
        df["year"],
        errors="coerce"
    )

    df["area"] = pd.to_numeric(
        df["area"],
        errors="coerce"
    )

    df["production"] = pd.to_numeric(
        df["production"],
        errors="coerce"
    )

    df = df.dropna()

    # Invalid agricultural records
    df = df[
        (df["area"] > 0)
        & (df["production"] >= 0)
    ]

    # -------------------------------
    # FEATURE ENGINEERING
    # -------------------------------

    # Helps model understand nonlinear area effect.
    df["log_area"] = np.log1p(df["area"])

    # Time trend
    min_year = df["year"].min()

    df["year_index"] = (
        df["year"] - min_year
    )

    print(
        f"Records after cleaning: {len(df)}"
    )

    return df


def build_preprocessor():
    categorical_features = [
        "district",
        "crop",
        "season",
    ]

    numeric_features = [
        "year",
        "year_index",
        "area",
        "log_area",
    ]

    categorical_transformer = OneHotEncoder(
        handle_unknown="ignore",
        sparse_output=False,
    )

    numeric_transformer = StandardScaler()

    preprocessor = ColumnTransformer(
        transformers=[
            (
                "categorical",
                categorical_transformer,
                categorical_features,
            ),
            (
                "numeric",
                numeric_transformer,
                numeric_features,
            ),
        ],
        remainder="drop",
    )

    return preprocessor


def calculate_metrics(
    model,
    X_test,
    y_test,
):
    predictions = model.predict(X_test)

    mae = mean_absolute_error(
        y_test,
        predictions,
    )

    mse = mean_squared_error(
        y_test,
        predictions,
    )

    rmse = np.sqrt(mse)

    r2 = r2_score(
        y_test,
        predictions,
    )

    return {
        "mae": float(mae),
        "rmse": float(rmse),
        "r2": float(r2),
    }


def train_models():
    print("=" * 60)
    print("CROP PRODUCTION MODEL TRAINING")
    print("=" * 60)

    df = load_training_data()

    df = clean_training_data(df)

    if len(df) < 100:
        raise ValueError(
            "Not enough training records."
        )

    features = [
        "district",
        "crop",
        "season",
        "year",
        "year_index",
        "area",
        "log_area",
    ]

    target = "production"

    X = df[features]

    y = df[target]

    X_train, X_test, y_train, y_test = (
        train_test_split(
            X,
            y,
            test_size=0.20,
            random_state=42,
        )
    )

    print(
        f"Training records: {len(X_train)}"
    )

    print(
        f"Testing records: {len(X_test)}"
    )

    models = {
        "Random Forest": RandomForestRegressor(
            n_estimators=300,
            max_depth=None,
            min_samples_split=4,
            min_samples_leaf=2,
            max_features=0.8,
            random_state=42,
            n_jobs=-1,
        ),

        "Extra Trees": ExtraTreesRegressor(
            n_estimators=300,
            max_depth=None,
            min_samples_split=4,
            min_samples_leaf=2,
            max_features=0.9,
            random_state=42,
            n_jobs=-1,
        ),
    }

    results = {}

    best_model = None
    best_model_name = None
    best_r2 = float("-inf")

    for name, estimator in models.items():

        print()
        print("-" * 50)
        print(f"Training: {name}")
        print("-" * 50)

        preprocessor = build_preprocessor()

        pipeline = Pipeline(
            steps=[
                (
                    "preprocessor",
                    preprocessor,
                ),
                (
                    "model",
                    estimator,
                ),
            ]
        )

        pipeline.fit(
            X_train,
            y_train,
        )

        metrics = calculate_metrics(
            pipeline,
            X_test,
            y_test,
        )

        results[name] = metrics

        print(
            f"MAE : {metrics['mae']:.3f}"
        )

        print(
            f"RMSE: {metrics['rmse']:.3f}"
        )

        print(
            f"R²  : {metrics['r2']:.4f}"
        )

        if metrics["r2"] > best_r2:
            best_r2 = metrics["r2"]
            best_model = pipeline
            best_model_name = name

    # --------------------------------
    # RANDOM FOREST PARAMETER TUNING
    # --------------------------------

    print()
    print("=" * 60)
    print("TUNING RANDOM FOREST")
    print("=" * 60)

    rf_pipeline = Pipeline(
        steps=[
            (
                "preprocessor",
                build_preprocessor(),
            ),
            (
                "model",
                RandomForestRegressor(
                    random_state=42,
                    n_jobs=-1,
                ),
            ),
        ]
    )

    parameters = {
        "model__n_estimators": [
            200,
            300,
            500,
        ],

        "model__max_depth": [
            None,
            15,
            25,
            35,
        ],

        "model__min_samples_split": [
            2,
            4,
            8,
        ],

        "model__min_samples_leaf": [
            1,
            2,
            4,
        ],

        "model__max_features": [
            0.6,
            0.8,
            1.0,
        ],
    }

    search = RandomizedSearchCV(
        estimator=rf_pipeline,
        param_distributions=parameters,
        n_iter=15,
        scoring="r2",
        cv=3,
        random_state=42,
        n_jobs=-1,
        verbose=1,
    )

    search.fit(
        X_train,
        y_train,
    )

    tuned_rf = search.best_estimator_

    tuned_metrics = calculate_metrics(
        tuned_rf,
        X_test,
        y_test,
    )

    results[
        "Tuned Random Forest"
    ] = tuned_metrics

    print()
    print("Best parameters:")

    for key, value in (
        search.best_params_.items()
    ):
        print(
            f"{key}: {value}"
        )

    print()
    print(
        f"Tuned RF MAE : "
        f"{tuned_metrics['mae']:.3f}"
    )

    print(
        f"Tuned RF RMSE: "
        f"{tuned_metrics['rmse']:.3f}"
    )

    print(
        f"Tuned RF R²  : "
        f"{tuned_metrics['r2']:.4f}"
    )

    if tuned_metrics["r2"] > best_r2:
        best_model = tuned_rf
        best_model_name = (
            "Tuned Random Forest"
        )
        best_r2 = tuned_metrics["r2"]

    # --------------------------------
    # SAVE BEST MODEL
    # --------------------------------

    joblib.dump(
        {
            "model": best_model,
            "model_name": best_model_name,
            "features": features,
            "min_year": int(
                df["year"].min()
            ),
            "metrics": results[
                best_model_name
            ],
        },
        MODEL_PATH,
    )

    print()
    print("=" * 60)
    print("MODEL TRAINING COMPLETED")
    print("=" * 60)

    print(
        f"Records Used: {len(df)}"
    )

    print(
        f"Best Model: {best_model_name}"
    )

    print(
        f"MAE: "
        f"{results[best_model_name]['mae']:.3f}"
    )

    print(
        f"RMSE: "
        f"{results[best_model_name]['rmse']:.3f}"
    )

    print(
        f"R² Score: "
        f"{results[best_model_name]['r2']:.4f}"
    )

    print(
        f"Saved Model: {MODEL_PATH}"
    )

    return {
        "success": True,
        "records_used": len(df),
        "best_model": best_model_name,
        "metrics": results[
            best_model_name
        ],
        "all_models": results,
        "model_path": MODEL_PATH,
    }


def predict_production(
    district,
    crop,
    season,
    year,
    area,
):
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(
            "Trained model not found. "
            "Train the model first."
        )

    saved = joblib.load(
        MODEL_PATH
    )

    model = saved["model"]

    min_year = saved["min_year"]

    area = float(area)
    year = int(year)

    input_data = pd.DataFrame(
        [
            {
                "district": district,
                "crop": crop,
                "season": season,
                "year": year,
                "year_index": (
                    year - min_year
                ),
                "area": area,
                "log_area": np.log1p(
                    area
                ),
            }
        ]
    )

    prediction = model.predict(
        input_data
    )[0]

    return max(
        float(prediction),
        0.0,
    )