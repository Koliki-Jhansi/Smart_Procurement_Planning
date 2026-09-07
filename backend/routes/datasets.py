
from flask import Blueprint, request, jsonify

from extensions import db

from models.user import User
from models.dataset_record import DatasetRecord

from models.training_data import TrainingData

import pandas as pd


dataset_bp = Blueprint(
    "datasets",
    __name__,
    url_prefix="/api/admin/datasets"
)


# =====================================================
# ADMIN CHECK
# =====================================================

def is_admin():

    mobile_number = request.headers.get(
        "X-Admin-Mobile"
    )

    if not mobile_number:
        return None

    user = User.query.filter_by(
        mobile_number=mobile_number
    ).first()

    if not user:
        return None

    if str(user.role).strip().lower() != "admin":
        return None

    return user


# =====================================================
# REQUIRED COLUMNS
# =====================================================

REQUIRED_COLUMNS = {

    "crop_production": [
        "district",
        "crop",
        "season",
        "year",
        "area",
        "production"
    ],

    "location": [
        "district",
        "mandal",
        "village"
    ],

    "procurement_centers": [
        "center_id",
        "center_name",
        "district",
        "capacity_tons"
    ],

    "warehouses": [
        "warehouse_id",
        "warehouse_name",
        "district",
        "total_capacity"
    ],

    "transport": [
        "village",
        "center",
        "distance_km"
    ],

    "weather": [
        "district",
        "date",
        "rainfall",
        "temperature",
        "humidity"
    ],

    "soil": [
        "district",
        "soil_type",
        "ph",
        "nitrogen",
        "phosphorus",
        "potassium"
    ],

    "market_demand": [
        "district",
        "crop",
        "year",
        "msp",
        "market_price",
        "demand"
    ]
}


# =====================================================
# COLUMN ALIASES
# =====================================================

COLUMN_ALIASES = {

    "district_name": "district",

    "district": "district",

    "crop_name": "crop",

    "crop": "crop",

    "crop_year": "year",

    "year": "year",

    "area_acres": "area",

    "cultivated_area": "area",

    "area": "area",

    "production_tons": "production",

    "production_tonnes": "production",

    "production": "production",

    "mandal_name": "mandal",

    "mandal": "mandal",

    "village_name": "village",

    "village": "village",

    "center_id": "center_id",

    "procurement_center_id":
        "center_id",

    "center_name":
        "center_name",

    "procurement_center_name":
        "center_name",

    "capacity":
        "capacity_tons",

    "capacity_tons":
        "capacity_tons",

    "warehouse_id":
        "warehouse_id",

    "warehouse_name":
        "warehouse_name",

    "total_capacity":
        "total_capacity",

    "current_stock":
        "current_stock",

    "distance":
        "distance_km",

    "distance_km":
        "distance_km",

    "cost_per_km":
        "cost_per_km",

    "vehicle_type":
        "vehicle_type",

    "date":
        "date",

    "rainfall_mm":
        "rainfall",

    "rainfall":
        "rainfall",

    "temperature_c":
        "temperature",

    "temperature":
        "temperature",

    "humidity_percent":
        "humidity",

    "humidity":
        "humidity",

    "soil_type":
        "soil_type",

    "soil_ph":
        "ph",

    "ph":
        "ph",

    "n":
        "nitrogen",

    "nitrogen":
        "nitrogen",

    "p":
        "phosphorus",

    "phosphorus":
        "phosphorus",

    "k":
        "potassium",

    "potassium":
        "potassium",

    "msp":
        "msp",

    "msp_per_ton":
        "msp",

    "market_price":
        "market_price",

    "market_price_per_ton":
        "market_price",

    "demand":
        "demand"
}


# =====================================================
# CLEAN COLUMN NAMES
# =====================================================

def clean_columns(df):

    new_columns = []

    for column in df.columns:

        name = (
            str(column)
            .strip()
            .lower()
            .replace(" ", "_")
            .replace("-", "_")
        )

        new_columns.append(
            COLUMN_ALIASES.get(
                name,
                name
            )
        )

    df.columns = new_columns

    return df


# =====================================================
# READ DATASET
# =====================================================

def read_dataset(file):

    filename = (
        file.filename
        .lower()
    )

    if filename.endswith(".csv"):

        return pd.read_csv(
            file,
            low_memory=False
        )

    if filename.endswith(".xlsx"):

        return pd.read_excel(
            file
        )

    if filename.endswith(".xls"):

        return pd.read_excel(
            file
        )

    raise ValueError(
        "Only CSV, XLS and XLSX files are supported"
    )


# =====================================================
# UPLOAD DATASET
# =====================================================

@dataset_bp.route(
    "/upload",
    methods=["POST"]
)
def upload_dataset():

    admin = is_admin()

    if not admin:

        return jsonify({
            "success": False,
            "message":
                "Admin access required"
        }), 403


    dataset_type = request.form.get(
        "dataset_type"
    )

    if not dataset_type:

        return jsonify({
            "success": False,
            "message":
                "Dataset type is required"
        }), 400


    if dataset_type not in REQUIRED_COLUMNS:

        return jsonify({
            "success": False,
            "message":
                "Invalid dataset type",
            "allowed_types":
                list(REQUIRED_COLUMNS.keys())
        }), 400


    if "file" not in request.files:

        return jsonify({
            "success": False,
            "message":
                "No dataset file uploaded"
        }), 400


    file = request.files["file"]


    if not file.filename:

        return jsonify({
            "success": False,
            "message":
                "Please select a file"
        }), 400


    try:

        # =============================================
        # READ
        # =============================================

        df = read_dataset(file)


        if df.empty:

            return jsonify({
                "success": False,
                "message":
                    "Uploaded dataset is empty"
            }), 400


        original_rows = len(df)


        # =============================================
        # CLEAN COLUMNS
        # =============================================

        df = clean_columns(df)


        # =============================================
        # REMOVE DUPLICATE COLUMNS
        # =============================================

        df = df.loc[
            :,
            ~df.columns.duplicated()
        ]


        # =============================================
        # CHECK REQUIRED COLUMNS
        # =============================================

        required = REQUIRED_COLUMNS[
            dataset_type
        ]


        missing = [
            column
            for column in required
            if column not in df.columns
        ]


        if missing:

            return jsonify({

                "success": False,

                "message":
                    "Required columns are missing",

                "dataset_type":
                    dataset_type,

                "missing_columns":
                    missing,

                "available_columns":
                    list(df.columns)

            }), 400


        # =============================================
        # SELECT REQUIRED + AVAILABLE COLUMNS
        # =============================================

        selected_columns = list(
            dict.fromkeys(
                required +
                list(df.columns)
            )
        )


        selected_columns = [
            column
            for column in selected_columns
            if column in df.columns
        ]


        df = df[
            selected_columns
        ]


        # =============================================
        # REMOVE COMPLETELY EMPTY ROWS
        # =============================================

        df = df.dropna(
            how="all"
        )


        # =============================================
        # REMOVE DUPLICATES
        # =============================================

        df = df.drop_duplicates()


        # =============================================
        # REPLACE NaN
        # =============================================

        df = df.astype(
            object
        ).where(
            pd.notnull(df),
            None
        )


        # =============================================
        # CROP PRODUCTION
        # =============================================

        if dataset_type == "crop_production":

            numeric_columns = [
                "year",
                "area",
                "production"
            ]

            for column in numeric_columns:

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
                (df["area"] > 0) &
                (df["production"] >= 0)
            ]


        # =============================================
        # CONVERT DATA TO DICTIONARIES
        # =============================================

        records = (
            df.to_dict(
                orient="records"
            )
        )


        if not records:

            return jsonify({
                "success": False,
                "message":
                    "No valid records found"
            }), 400


        # =============================================
        # IMPORTANT
        # =============================================
        #
        # For crop production we also populate
        # TrainingData so the existing crop
        # prediction model can train.
        #
        # =============================================

        if dataset_type == "crop_production":

            for row in records:

                training_record = TrainingData(

                    district=str(
                        row["district"]
                    ).strip(),

                    crop=str(
                        row["crop"]
                    ).strip(),

                    season=str(
                        row["season"]
                    ).strip(),

                    year=int(
                        row["year"]
                    ),

                    area=float(
                        row["area"]
                    ),

                    production=float(
                        row["production"]
                    )
                )

                db.session.add(
                    training_record
                )


        # =============================================
        # STORE GENERIC DATASET RECORDS
        # =============================================

        source_file = file.filename


        # =============================================
        # BULK INSERT
        # =============================================

        batch = []


        for index, row in enumerate(
            records,
            start=1
        ):

            batch.append(

                DatasetRecord(

                    dataset_type=
                        dataset_type,

                    source_file=
                        source_file,

                    row_number=
                        index,

                    data=row
                )
            )


            # Commit in batches.
            #
            # This prevents one huge transaction
            # for large datasets.

            if len(batch) >= 1000:

                db.session.bulk_save_objects(
                    batch
                )

                db.session.commit()

                batch = []


        if batch:

            db.session.bulk_save_objects(
                batch
            )


        db.session.commit()


        # =============================================
        # RESPONSE
        # =============================================

        return jsonify({

            "success": True,

            "message":
                "Dataset uploaded and stored successfully",

            "dataset_type":
                dataset_type,

            "filename":
                source_file,

            "original_rows":
                int(original_rows),

            "records_imported":
                int(len(records)),

            "columns":
                list(df.columns)

        }), 201


    except Exception as e:

        db.session.rollback()

        print(
            "DATASET UPLOAD ERROR:",
            str(e)
        )

        return jsonify({

            "success": False,

            "message":
                "Dataset processing failed",

            "error":
                str(e)

        }), 500


# =====================================================
# DATASET SUMMARY
# =====================================================

@dataset_bp.route(
    "/summary",
    methods=["GET"]
)
def dataset_summary():

    admin = is_admin()

    if not admin:

        return jsonify({
            "success": False,
            "message":
                "Admin access required"
        }), 403


    try:

        result = {}


        for dataset_type in REQUIRED_COLUMNS:

            count = DatasetRecord.query.filter_by(
                dataset_type=
                    dataset_type
            ).count()


            result[
                dataset_type
            ] = count


        # Crop production is also in
        # TrainingData, but summary uses
        # DatasetRecord to avoid double counting.

        return jsonify({

            "success": True,

            "data":
                result

        })


    except Exception as e:

        return jsonify({

            "success": False,

            "message":
                "Unable to load dataset summary",

            "error":
                str(e)

        }), 500
