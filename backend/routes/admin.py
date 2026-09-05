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
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score


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

            "message":
                "Admin access required"

        }), 403

    try:

        records = (
            TrainingData.query.all()
        )

        record_count = len(
            records
        )

        if record_count < 10:

            return jsonify({

                "success": False,

                "message":
                    "At least 10 training records are required",

                "records_available":
                    record_count

            }), 400

        districts = [

            str(
                record.district
            ).strip()

            for record
            in records

        ]

        crops = [

            str(
                record.crop
            ).strip()

            for record
            in records

        ]

        seasons = [

            str(
                record.season
            ).strip()

            for record
            in records

        ]

        years = [

            int(
                record.year
            )

            for record
            in records

        ]

        areas = [

            float(
                record.area
            )

            for record
            in records

        ]

        production = [

            float(
                record.production
            )

            for record
            in records

        ]

        district_encoder = LabelEncoder()

        crop_encoder = LabelEncoder()

        season_encoder = LabelEncoder()


        district_encoded = (
            district_encoder.fit_transform(
                districts
            )
        )

        crop_encoded = (
            crop_encoder.fit_transform(
                crops
            )
        )

        season_encoded = (
            season_encoder.fit_transform(
                seasons
            )
        )


        X = pd.DataFrame({

            "district":
                district_encoded,

            "crop":
                crop_encoded,

            "season":
                season_encoded,

            "year":
                years,

            "area":
                areas

        })

        y = production


        X_train, X_test, y_train, y_test = (
            train_test_split(

                X,

                y,

                test_size=0.20,

                random_state=42

            )
        )


        model = RandomForestRegressor(

            n_estimators=100,

            random_state=42,

            n_jobs=-1

        )


        model.fit(

            X_train,

            y_train

        )


        predictions = model.predict(

            X_test

        )


        mae = mean_absolute_error(

            y_test,

            predictions

        )


        r2 = r2_score(

            y_test,

            predictions

        )


        joblib.dump(

            model,

            os.path.join(

                MODELS_DIR,

                "crop_prediction_model.pkl"

            )

        )


        joblib.dump(

            district_encoder,

            os.path.join(

                MODELS_DIR,

                "district_encoder.pkl"

            )

        )


        joblib.dump(

            crop_encoder,

            os.path.join(

                MODELS_DIR,

                "crop_encoder.pkl"

            )

        )


        joblib.dump(

            season_encoder,

            os.path.join(

                MODELS_DIR,

                "season_encoder.pkl"

            )

        )


        metadata = {

            "model":
                "Random Forest",

            "records_used":
                record_count,

            "mean_absolute_error":
                float(mae),

            "r2_score":
                float(r2),

            "features": [

                "District",

                "Crop",

                "Season",

                "Year",

                "Area"

            ],

            "districts":
                list(
                    district_encoder.classes_
                ),

            "crops":
                list(
                    crop_encoder.classes_
                ),

            "seasons":
                list(
                    season_encoder.classes_
                )

        }


        metadata_path = os.path.join(

            MODELS_DIR,

            "crop_prediction_model_meta.json"

        )


        with open(

            metadata_path,

            "w",

            encoding="utf-8"

        ) as meta_file:

            json.dump(

                metadata,

                meta_file,

                indent=4

            )


        return jsonify({

            "success": True,

            "message":
                "Model trained successfully",

            "records_used":
                record_count,

            "mean_absolute_error":
                round(
                    float(mae),
                    4
                ),

            "r2_score":
                round(
                    float(r2),
                    4
                ),

            "model":
                "Random Forest"

        })

    except Exception as e:

        db.session.rollback()

        return jsonify({

            "success": False,

            "message":
                "Model training failed",

            "error":
                str(e)

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