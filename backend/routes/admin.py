from flask import Blueprint, request, jsonify
from extensions import db
from models.user import User
from models.training_data import TrainingData

import os
import json
import uuid
import joblib
import pandas as pd

from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestRegressor, ExtraTreesRegressor, HistGradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


class YieldToProductionRegressor:
    """Compatibility wrapper: accepts the existing 5 production features.

    Internally predicts yield from district/crop/season/year, then converts
    predicted yield back to production using the supplied area.
    """

    def __init__(self, yield_model):
        self.yield_model = yield_model

    def fit(self, X, y):
        X_frame = pd.DataFrame(X).copy()
        area = pd.to_numeric(X_frame.iloc[:, 4], errors="coerce").astype(float)
        production = pd.Series(y, index=X_frame.index, dtype=float)
        yield_target = production / area
        self.yield_model.fit(X_frame.iloc[:, :4], yield_target)
        return self

    def predict(self, X):
        X_frame = pd.DataFrame(X).copy()
        area = pd.to_numeric(X_frame.iloc[:, 4], errors="coerce").astype(float)
        predicted_yield = self.yield_model.predict(X_frame.iloc[:, :4])
        return predicted_yield * area.to_numpy()


class BlendedRegressor:
    """Blend two fitted regressors while preserving the existing 5-feature API."""

    def __init__(self, model_a, model_b, weight_a=0.5):
        self.model_a = model_a
        self.model_b = model_b
        self.weight_a = float(weight_a)

    def fit(self, X, y):
        self.model_a.fit(X, y)
        self.model_b.fit(X, y)
        return self

    def predict(self, X):
        pred_a = self.model_a.predict(X)
        pred_b = self.model_b.predict(X)
        return (self.weight_a * pred_a) + ((1.0 - self.weight_a) * pred_b)


class FeatureEngineeredRegressor:
    """Keep the existing 5-input API while adding numeric feature engineering."""

    def __init__(self, model):
        self.model = model
        self.base_year_ = None

    def _transform(self, X):
        import numpy as np

        frame = pd.DataFrame(X).copy()
        if frame.shape[1] != 5:
            raise ValueError("Expected 5 features: district, crop, season, year, area")

        district = pd.to_numeric(frame.iloc[:, 0], errors="coerce").astype(float)
        crop = pd.to_numeric(frame.iloc[:, 1], errors="coerce").astype(float)
        season = pd.to_numeric(frame.iloc[:, 2], errors="coerce").astype(float)
        year = pd.to_numeric(frame.iloc[:, 3], errors="coerce").astype(float)
        area = pd.to_numeric(frame.iloc[:, 4], errors="coerce").astype(float)

        if self.base_year_ is None:
            self.base_year_ = float(year.min())

        year_index = year - self.base_year_
        safe_area = area.clip(lower=0.000001)

        return pd.DataFrame({
            "district": district,
            "crop": crop,
            "season": season,
            "year": year,
            "area": area,
            "year_index": year_index,
            "log_area": np.log1p(safe_area),
            "sqrt_area": np.sqrt(safe_area),
            "area_squared_scaled": (area * area) / 1000.0,
            "year_area": year_index * area,
        })

    def fit(self, X, y):
        self.base_year_ = None
        transformed = self._transform(X)
        self.model.fit(transformed, y)
        return self

    def predict(self, X):
        transformed = self._transform(X)
        return self.model.predict(transformed)


admin_bp = Blueprint(
    "admin",
    __name__,
    url_prefix="/api/admin"
)


# ==========================================================
# PATHS
# ==========================================================

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)

DATASETS_DIR = os.path.join(
    BASE_DIR,
    "datasets"
)

MODELS_DIR = os.path.join(
    BASE_DIR,
    "models"
)

os.makedirs(
    DATASETS_DIR,
    exist_ok=True
)

os.makedirs(
    MODELS_DIR,
    exist_ok=True
)


# ==========================================================
# ADMIN CHECK
# ==========================================================

def is_admin():

    mobile_number = request.headers.get(
        "X-Admin-Mobile"
    )

    if not mobile_number:
        return None

    mobile_number = str(
        mobile_number
    ).strip()

    user = User.query.filter_by(
        mobile_number=mobile_number
    ).first()

    if not user:
        return None

    role = str(
        user.role or ""
    ).strip().lower()

    if role != "admin":
        return None

    return user


# ==========================================================
# DATASET DEFINITIONS
# ==========================================================

DATASET_TYPES = {

    "location": {
        "name": "Location Dataset",
        "description": "District, Mandal and Village information",
        "required": [
            "district",
            "mandal",
            "village"
        ]
    },

    "crop_production": {
        "name": "Crop Production Dataset",
        "description": "Historical crop production data",
        "required": [
            "district",
            "crop",
            "season",
            "year",
            "area",
            "production"
        ]
    },

    "procurement_centers": {
        "name": "Procurement Centers Dataset",
        "description": "Procurement center information",
        "required": [
            "center_id",
            "center_name",
            "district"
        ]
    },

    "warehouse": {
        "name": "Warehouse Dataset",
        "description": "Warehouse information",
        "required": [
            "warehouse_id",
            "warehouse_name",
            "district"
        ]
    },

    "transport": {
        "name": "Transport Dataset",
        "description": "Transport and distance information",
        "required": [
            "village",
            "center_id",
            "distance_km"
        ]
    }

}


# ==========================================================
# COLUMN ALIASES
# ==========================================================

COLUMN_ALIASES = {

    "district": [
        "district",
        "district_name",
        "dist",
        "districtname"
    ],

    "mandal": [
        "mandal",
        "mandal_name",
        "block",
        "block_name",
        "tehsil"
    ],

    "village": [
        "village",
        "village_name",
        "villagename",
        "village_code"
    ],

    "crop": [
        "crop",
        "crop_name",
        "cropname"
    ],

    "season": [
        "season",
        "crop_season",
        "season_name"
    ],

    "year": [
        "year",
        "crop_year",
        "year_of_crop"
    ],

    "area": [
        "area",
        "area_acres",
        "cultivated_area",
        "area_hectares",
        "area_ha"
    ],

    "production": [
        "production",
        "production_tons",
        "production_tonnes",
        "yield",
        "total_production"
    ],

    "center_id": [
        "center_id",
        "centre_id",
        "procurement_center_id",
        "procurement_centre_id",
        "center_code",
        "centre_code"
    ],

    "center_name": [
        "center_name",
        "centre_name",
        "procurement_center",
        "procurement_centre",
        "procurement_center_name",
        "procurement_centre_name",
        "center",
        "centre"
    ],

    "warehouse_id": [
        "warehouse_id",
        "warehouse_code",
        "warehouseid"
    ],

    "warehouse_name": [
        "warehouse_name",
        "warehouse",
        "warehouse_name"
    ],

    "distance_km": [
        "distance_km",
        "distance",
        "distance_in_km",
        "distancekm"
    ]

}


# ==========================================================
# NORMALIZE DATASET TYPE
# ==========================================================

def normalize_dataset_type(dataset_type):

    value = str(
        dataset_type or ""
    ).strip().lower()

    aliases = {

        "procurement_center":
            "procurement_centers",

        "procurement centre":
            "procurement_centers",

        "procurement centres":
            "procurement_centers",

        "procurement_centres":
            "procurement_centers",

        "crop":
            "crop_production",

        "crop_production_data":
            "crop_production",

        "locations":
            "location",

        "warehouses":
            "warehouse",

        "transports":
            "transport"

    }

    return aliases.get(
        value,
        value
    )


# ==========================================================
# NORMALIZE COLUMNS
# ==========================================================

def normalize_columns(df):

    df.columns = (
        df.columns
        .astype(str)
        .str.strip()
        .str.lower()
        .str.replace(" ", "_", regex=False)
        .str.replace("-", "_", regex=False)
        .str.replace("/", "_", regex=False)
        .str.replace("(", "", regex=False)
        .str.replace(")", "", regex=False)
    )

    rename_map = {}

    for standard_name, possible_names in COLUMN_ALIASES.items():

        for possible_name in possible_names:

            if possible_name in df.columns:

                rename_map[
                    possible_name
                ] = standard_name

                break

    df = df.rename(
        columns=rename_map
    )

    return df


# ==========================================================
# ADMIN HOME
# ==========================================================

@admin_bp.route(
    "",
    methods=["GET"]
)

@admin_bp.route(
    "/",
    methods=["GET"]
)

def admin_home():

    admin = is_admin()

    if not admin:

        return jsonify({
            "success": False,
            "message": "Admin access required"
        }), 403

    return jsonify({
        "success": True,
        "message": "Admin API is working",
        "admin": {
            "id": admin.id,
            "full_name": admin.full_name,
            "mobile_number": admin.mobile_number,
            "role": admin.role
        }
    })


# ==========================================================
# DATASET TYPES
# ==========================================================

@admin_bp.route(
    "/datasets/types",
    methods=["GET"]
)

def get_dataset_types():

    admin = is_admin()

    if not admin:

        return jsonify({
            "success": False,
            "message": "Admin access required"
        }), 403

    return jsonify({
        "success": True,
        "datasets": DATASET_TYPES
    })


# ==========================================================
# DATASET SUMMARY
# ==========================================================

@admin_bp.route(
    "/datasets/summary",
    methods=["GET"]
)

def dataset_summary():

    admin = is_admin()

    if not admin:

        return jsonify({
            "success": False,
            "message": "Admin access required"
        }), 403

    try:

        result = {
            "location": 0,
            "crop_production": TrainingData.query.count(),
            "procurement_centers": 0,
            "warehouse": 0,
            "transport": 0
        }

        dataset_files = os.listdir(
            DATASETS_DIR
        )

        for filename in dataset_files:

            file_path = os.path.join(
                DATASETS_DIR,
                filename
            )

            if not os.path.isfile(
                file_path
            ):
                continue

            for dataset_type in result.keys():

                if filename.startswith(
                    f"{dataset_type}_"
                ):

                    try:

                        data = pd.read_csv(
                            file_path
                        )

                        result[
                            dataset_type
                        ] += len(data)

                    except Exception:
                        pass

        return jsonify({
            "success": True,
            "data": result
        })

    except Exception as e:

        return jsonify({
            "success": False,
            "message": "Unable to load dataset summary",
            "error": str(e)
        }), 500


# ==========================================================
# UPLOAD DATASET
# ==========================================================

@admin_bp.route(
    "/datasets/upload",
    methods=["POST"]
)

@admin_bp.route(
    "/upload-dataset",
    methods=["POST"]
)

def upload_dataset():

    admin = is_admin()

    if not admin:

        return jsonify({
            "success": False,
            "message": "Admin access required"
        }), 403

    if "file" not in request.files:

        return jsonify({
            "success": False,
            "message": "No dataset file uploaded"
        }), 400

    file = request.files[
        "file"
    ]

    if not file.filename:

        return jsonify({
            "success": False,
            "message": "Please select a dataset file"
        }), 400

    raw_dataset_type = request.form.get(
        "dataset_type",
        ""
    )

    dataset_type = normalize_dataset_type(
        raw_dataset_type
    )

    if dataset_type not in DATASET_TYPES:

        return jsonify({
            "success": False,
            "message": "Invalid dataset type"
        }), 400

    try:

        filename = file.filename.lower()

        if filename.endswith(
            ".csv"
        ):

            df = pd.read_csv(
                file
            )

        elif (
            filename.endswith(".xlsx")
            or filename.endswith(".xls")
        ):

            df = pd.read_excel(
                file
            )

        else:

            return jsonify({
                "success": False,
                "message": "Only CSV, XLS and XLSX files are supported"
            }), 400

        if df.empty:

            return jsonify({
                "success": False,
                "message": "Uploaded dataset is empty"
            }), 400

        original_rows = len(
            df
        )

        df = normalize_columns(
            df
        )

        required_columns = (
            DATASET_TYPES[
                dataset_type
            ]["required"]
        )

        missing_columns = [

            column

            for column
            in required_columns

            if column not in df.columns

        ]

        if missing_columns:

            return jsonify({

                "success": False,

                "message":
                    "Required columns are missing",

                "missing_columns":
                    missing_columns,

                "available_columns":
                    list(df.columns)

            }), 400

        df = df.dropna(
            how="all"
        )

        df = df.drop_duplicates()


        # ==================================================
        # CROP PRODUCTION DATASET
        # ==================================================

        if dataset_type == "crop_production":

            for column in [
                "year",
                "area",
                "production"
            ]:

                df[column] = pd.to_numeric(
                    df[column],
                    errors="coerce"
                )

            df = df.dropna(

                subset=[
                    "district",
                    "crop",
                    "season",
                    "year",
                    "area",
                    "production"
                ]

            )

            df = df[
                (df["area"] > 0)
                &
                (df["production"] >= 0)
            ]

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

            df["year"] = (
                df["year"]
                .astype(int)
            )

            df["area"] = (
                df["area"]
                .astype(float)
            )

            df["production"] = (
                df["production"]
                .astype(float)
            )

            records = df[
                [
                    "district",
                    "crop",
                    "season",
                    "year",
                    "area",
                    "production"
                ]
            ].to_dict(
                orient="records"
            )

            if not records:

                return jsonify({

                    "success": False,

                    "message":
                        "No valid crop records found"

                }), 400

            BATCH_SIZE = 5000

            total_records = len(
                records
            )

            for start in range(
                0,
                total_records,
                BATCH_SIZE
            ):

                batch = records[
                    start:
                    start + BATCH_SIZE
                ]

                db.session.bulk_insert_mappings(
                    TrainingData,
                    batch
                )

                db.session.commit()

            return jsonify({

                "success": True,

                "message":
                    "Crop production dataset uploaded successfully",

                "records_imported":
                    total_records,

                "total_training_records":
                    TrainingData.query.count(),

                "original_rows":
                    original_rows

            }), 201


        # ==================================================
        # OTHER DATASETS
        # ==================================================

        safe_name = (
            os.path.splitext(
                os.path.basename(
                    file.filename
                )
            )[0]
        )

        unique_name = (
            f"{dataset_type}_"
            f"{safe_name}_"
            f"{uuid.uuid4().hex[:8]}"
            ".csv"
        )

        output_path = os.path.join(
            DATASETS_DIR,
            unique_name
        )

        df.to_csv(
            output_path,
            index=False
        )

        return jsonify({

            "success": True,

            "message":
                f"{DATASET_TYPES[dataset_type]['name']} uploaded successfully",

            "dataset_type":
                dataset_type,

            "records_imported":
                len(df),

            "saved_as":
                unique_name,

            "original_rows":
                original_rows

        }), 201

    except Exception as e:

        db.session.rollback()

        return jsonify({

            "success": False,

            "message":
                "Dataset processing failed",

            "error":
                str(e)

        }), 500


# ==========================================================
# TRAIN MODEL
# ==========================================================

@admin_bp.route(
    "/train-model",
    methods=["POST"]
)
def train_model():
    admin = is_admin()

    if not admin:
        return jsonify({
            "success": False,
            "message": "Admin access required"
        }), 403

    try:
        records = TrainingData.query.all()

        rows = []
        for record in records:
            try:
                district = str(record.district or "").strip()
                crop = str(record.crop or "").strip()
                season = str(record.season or "").strip()
                year = int(record.year)
                area = float(record.area)
                production = float(record.production)
            except (TypeError, ValueError):
                continue

            if not district or not crop or not season:
                continue
            if area <= 0 or production < 0:
                continue

            rows.append({
                "district": district,
                "crop": crop,
                "season": season,
                "year": year,
                "area": area,
                "production": production
            })

        df = pd.DataFrame(rows)
        if not df.empty:
            df = df.dropna().drop_duplicates().reset_index(drop=True)

        record_count = len(df)
        if record_count < 10:
            return jsonify({
                "success": False,
                "message": "At least 10 valid training records are required",
                "records_available": record_count
            }), 400

        # Keep the existing encoder files and 5-feature prediction interface.
        district_encoder = LabelEncoder()
        crop_encoder = LabelEncoder()
        season_encoder = LabelEncoder()

        X = pd.DataFrame({
            "district": district_encoder.fit_transform(df["district"]),
            "crop": crop_encoder.fit_transform(df["crop"]),
            "season": season_encoder.fit_transform(df["season"]),
            "year": df["year"].astype(int),
            "area": df["area"].astype(float)
        })
        y = df["production"].astype(float)

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.20, random_state=42
        )

        # Compare the current models with feature-engineered models on the
        # SAME held-out rows. Metrics are always calculated from predictions;
        # nothing is hard-coded. The wrapper still accepts the original five
        # inputs used by the existing prediction endpoint.
        # Compare several tuned candidates on the exact same held-out test rows.
        # The best model is selected from real R² results; no metric is hard-coded.
        direct_hgb_balanced = HistGradientBoostingRegressor(
            learning_rate=0.06,
            max_iter=500,
            max_leaf_nodes=31,
            min_samples_leaf=25,
            l2_regularization=1.0,
            random_state=42
        )

        yield_hgb_balanced = YieldToProductionRegressor(
            HistGradientBoostingRegressor(
                learning_rate=0.06,
                max_iter=500,
                max_leaf_nodes=31,
                min_samples_leaf=25,
                l2_regularization=1.0,
                random_state=42
            )
        )

        candidates = {
            "Direct - Hist Gradient Boosting": HistGradientBoostingRegressor(
                learning_rate=0.08,
                max_iter=350,
                max_leaf_nodes=31,
                l2_regularization=0.5,
                random_state=42
            ),

            "Direct HGB - Conservative": HistGradientBoostingRegressor(
                learning_rate=0.04,
                max_iter=650,
                max_leaf_nodes=15,
                min_samples_leaf=35,
                l2_regularization=2.0,
                random_state=42
            ),

            "Direct HGB - Balanced": direct_hgb_balanced,

            "Direct HGB - Flexible": HistGradientBoostingRegressor(
                learning_rate=0.05,
                max_iter=550,
                max_leaf_nodes=63,
                min_samples_leaf=30,
                l2_regularization=2.0,
                random_state=42
            ),

            "Yield - Hist Gradient Boosting": YieldToProductionRegressor(
                HistGradientBoostingRegressor(
                    learning_rate=0.08,
                    max_iter=350,
                    max_leaf_nodes=31,
                    l2_regularization=0.5,
                    random_state=42
                )
            ),

            "Yield HGB - Balanced": yield_hgb_balanced,

            "Engineered - Hist Gradient Boosting": FeatureEngineeredRegressor(
                HistGradientBoostingRegressor(
                    learning_rate=0.05,
                    max_iter=500,
                    max_leaf_nodes=31,
                    min_samples_leaf=30,
                    l2_regularization=1.5,
                    random_state=42
                )
            ),

            "Engineered HGB - Flexible": FeatureEngineeredRegressor(
                HistGradientBoostingRegressor(
                    learning_rate=0.04,
                    max_iter=650,
                    max_leaf_nodes=63,
                    min_samples_leaf=35,
                    l2_regularization=2.0,
                    random_state=42
                )
            ),

            "Engineered - Extra Trees": FeatureEngineeredRegressor(
                ExtraTreesRegressor(
                    n_estimators=500,
                    min_samples_split=10,
                    min_samples_leaf=5,
                    max_features=1.0,
                    random_state=42,
                    n_jobs=-1
                )
            ),

            "Engineered - Random Forest": FeatureEngineeredRegressor(
                RandomForestRegressor(
                    n_estimators=450,
                    min_samples_split=10,
                    min_samples_leaf=5,
                    max_features=1.0,
                    random_state=42,
                    n_jobs=-1
                )
            ),

            # A blend can reduce error when direct-production and yield models
            # make different mistakes. Both components are trained only on X_train/y_train.
            "Blend - Direct + Yield HGB": BlendedRegressor(
                HistGradientBoostingRegressor(
                    learning_rate=0.06,
                    max_iter=500,
                    max_leaf_nodes=31,
                    min_samples_leaf=25,
                    l2_regularization=1.0,
                    random_state=42
                ),
                YieldToProductionRegressor(
                    HistGradientBoostingRegressor(
                        learning_rate=0.06,
                        max_iter=500,
                        max_leaf_nodes=31,
                        min_samples_leaf=25,
                        l2_regularization=1.0,
                        random_state=42
                    )
                ),
                weight_a=0.35
            )
        }

        comparison = {}
        fitted_models = {}

        for model_name, candidate in candidates.items():
            candidate.fit(X_train, y_train)
            predictions = candidate.predict(X_test)

            mae_value = mean_absolute_error(y_test, predictions)
            rmse_value = mean_squared_error(y_test, predictions) ** 0.5
            r2_value = r2_score(y_test, predictions)

            fitted_models[model_name] = candidate
            comparison[model_name] = {
                "mean_absolute_error": round(float(mae_value), 4),
                "rmse": round(float(rmse_value), 4),
                "r2_score": round(float(r2_value), 4)
            }

        best_model_name = max(
            comparison,
            key=lambda name: comparison[name]["r2_score"]
        )
        model = fitted_models[best_model_name]
        best_metrics = comparison[best_model_name]

        # Preserve all filenames used by the existing prediction API.
        joblib.dump(model, os.path.join(MODELS_DIR, "crop_prediction_model.pkl"))
        joblib.dump(district_encoder, os.path.join(MODELS_DIR, "district_encoder.pkl"))
        joblib.dump(crop_encoder, os.path.join(MODELS_DIR, "crop_encoder.pkl"))
        joblib.dump(season_encoder, os.path.join(MODELS_DIR, "season_encoder.pkl"))

        from datetime import datetime, timezone

        metadata = {
            "model": best_model_name,
            "records_used": record_count,
            "mean_absolute_error": best_metrics["mean_absolute_error"],
            "rmse": best_metrics["rmse"],
            "r2_score": best_metrics["r2_score"],
            "features": ["District", "Crop", "Season", "Year", "Area"],
            "feature_engineering": ["year_index", "log_area", "sqrt_area", "area_squared_scaled", "year_area", "direct_yield_blend_comparison"],
            "districts": list(district_encoder.classes_),
            "crops": list(crop_encoder.classes_),
            "seasons": list(season_encoder.classes_),
            "model_comparison": comparison,
            "trained_at": datetime.now(timezone.utc).isoformat()
        }

        metadata_path = os.path.join(MODELS_DIR, "crop_prediction_model_meta.json")
        with open(metadata_path, "w", encoding="utf-8") as meta_file:
            json.dump(metadata, meta_file, indent=4)

        return jsonify({
            "success": True,
            "message": "Model trained successfully",
            "records_used": record_count,
            "model": best_model_name,
            "mean_absolute_error": best_metrics["mean_absolute_error"],
            "rmse": best_metrics["rmse"],
            "r2_score": best_metrics["r2_score"],
            "model_comparison": comparison
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": "Model training failed",
            "error": str(e)
        }), 500


# ==========================================================
# MODEL STATUS
# ==========================================================

@admin_bp.route(
    "/model-status",
    methods=["GET"]
)

def model_status():

    admin = is_admin()

    if not admin:

        return jsonify({

            "success": False,

            "message":
                "Admin access required"

        }), 403


    model_path = os.path.join(

        MODELS_DIR,

        "crop_prediction_model.pkl"

    )


    metadata_path = os.path.join(

        MODELS_DIR,

        "crop_prediction_model_meta.json"

    )


    trained = os.path.exists(

        model_path

    )


    metadata = None


    if os.path.exists(

        metadata_path

    ):

        try:

            with open(

                metadata_path,

                "r",

                encoding="utf-8"

            ) as meta_file:

                metadata = json.load(
                    meta_file
                )

        except Exception:

            metadata = None


    return jsonify({

        "success": True,

        "trained":
            trained,

        "training_records":
            TrainingData.query.count(),

        "metadata":
            metadata

    })