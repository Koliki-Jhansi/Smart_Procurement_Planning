from flask import Blueprint, request, jsonify
import os
import glob
import pandas as pd
import random


# ==========================================================
# PROCUREMENT BLUEPRINT
# ==========================================================

procurement_bp = Blueprint(
    "procurement",
    __name__,
    url_prefix="/api/procurement"
)


# ==========================================================
# PATH CONFIGURATION
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


# ==========================================================
# FIND PROCUREMENT CENTERS CSV
# ==========================================================

def find_centers_file():

    files = glob.glob(
        os.path.join(
            DATASETS_DIR,
            "*procurement*center*.csv"
        )
    )

    if not files:
        return None

    return files[0]


# ==========================================================
# CLEAN VALUE
# ==========================================================

def clean_value(value, default=""):

    if value is None:
        return default

    try:

        if pd.isna(value):
            return default

    except Exception:
        pass

    value = str(value).strip()

    if value.lower() in [
        "nan",
        "none",
        "null"
    ]:
        return default

    return value


# ==========================================================
# SAFE FLOAT
# ==========================================================

def safe_float(value, default=0):

    try:

        if value is None:
            return float(default)

        if pd.isna(value):
            return float(default)

        value = str(value).strip()

        if value == "":
            return float(default)

        return float(value)

    except Exception:
        return float(default)


# ==========================================================
# TEMPORARY STABLE DISTANCE GENERATOR
# ==========================================================

def generate_random_distance(center_id):

    """
    Temporary distance generator.

    Each procurement center gets a different distance.

    The same center ID will always receive the same
    temporary distance after refreshing the frontend.
    """

    center_id = str(center_id).strip()

    random.seed(center_id)

    distance = random.uniform(
        5,
        80
    )

    return round(
        distance,
        1
    )


# ==========================================================
# GET VALUE FROM POSSIBLE COLUMN NAMES
# ==========================================================

def get_column_value(
    row,
    columns,
    default=""
):

    for column in columns:

        if column in row:

            value = clean_value(
                row.get(column),
                ""
            )

            if value != "":
                return value

    return default


# ==========================================================
# LOAD PROCUREMENT CENTERS
# ==========================================================

def load_centers():

    centers_file = find_centers_file()

    if not centers_file:

        print("")
        print("❌ Procurement centers CSV file not found")
        print("Expected folder:")
        print(DATASETS_DIR)
        print("")

        return []

    try:

        print("")
        print("==========================================")
        print("📂 PROCUREMENT CENTERS FILE")
        print("==========================================")
        print(centers_file)
        print("==========================================")

        df = pd.read_csv(
            centers_file
        )

        df.columns = [
            str(column).strip()
            for column in df.columns
        ]

        print(
            f"✅ Procurement centers loaded: {len(df)}"
        )

        print(
            "Columns:",
            df.columns.tolist()
        )

        return df.to_dict(
            orient="records"
        )

    except Exception as error:

        print(
            "❌ Error loading procurement centers:",
            str(error)
        )

        return []


# ==========================================================
# DISTRICT MATCH
# ==========================================================

def district_matches(
    center_district,
    search_district
):

    center_district = clean_value(
        center_district
    ).lower()

    search_district = clean_value(
        search_district
    ).lower()

    if not search_district:
        return True

    if center_district == search_district:
        return True

    return (
        search_district in center_district
        or center_district in search_district
    )


# ==========================================================
# CROP MATCH
# ==========================================================

def crop_matches(
    center,
    search_crop
):

    search_crop = clean_value(
        search_crop
    ).lower()

    if not search_crop:
        return True

    crop_columns = [

        "crop",
        "Crop",

        "crop_name",
        "Crop_Name",

        "supported_crops",
        "Supported_Crops",

        "recommended_for_crop",
        "Recommended_For_Crop",

        "commodity",
        "Commodity"

    ]

    crop_values = []

    for column in crop_columns:

        if column in center:

            value = clean_value(
                center.get(column)
            ).lower()

            if value:
                crop_values.append(
                    value
                )

    # Dataset does not contain crop information.
    # Therefore show procurement centers from
    # the selected district.

    if not crop_values:
        return True

    all_crops = " ".join(
        crop_values
    )

    return (
        search_crop
        in all_crops
    )


# ==========================================================
# GET PROCUREMENT CENTERS
# RETURNS MAXIMUM 5 CENTERS
# ==========================================================

@procurement_bp.route(
    "/centers",
    methods=["GET"]
)
def get_procurement_centers():

    try:

        # ==================================================
        # GET SEARCH PARAMETERS
        # ==================================================

        district = request.args.get(
            "district",
            ""
        ).strip()

        crop = request.args.get(
            "crop",
            ""
        ).strip()

        location_filter = request.args.get(
            "location",
            ""
        ).strip().lower()


        # ==================================================
        # LOAD DATASET
        # ==================================================

        centers = load_centers()


        if not centers:

            return jsonify({

                "success": True,

                "district": district,

                "crop": crop,

                "total_centers": 0,

                "showing": 0,

                "centers": [],

                "message":
                    "No procurement centers available."

            }), 200


        filtered_centers = []


        # ==================================================
        # FILTER ALL PROCUREMENT CENTERS
        # ==================================================

        for index, center in enumerate(
            centers,
            start=1
        ):


            # ==============================================
            # DISTRICT
            # ==============================================

            center_district = get_column_value(

                center,

                [
                    "district",
                    "District",
                    "district_name",
                    "District_Name"
                ]

            )


            # ==============================================
            # CENTER NAME
            # ==============================================

            center_name = get_column_value(

                center,

                [
                    "center_name",
                    "Center_Name",
                    "name",
                    "Name",
                    "Procurement_Center_Name",
                    "procurement_center_name"
                ],

                "Procurement Center"

            )


            # ==============================================
            # CENTER ID
            # ==============================================

            center_id = get_column_value(

                center,

                [
                    "id",
                    "ID",
                    "center_id",
                    "Center_ID",
                    "procurement_center_id"
                ],

                str(index)

            )


            # ==============================================
            # VILLAGE
            # ==============================================

            village = get_column_value(

                center,

                [
                    "village",
                    "Village",
                    "village_name",
                    "Village_Name"
                ]

            )


            # ==============================================
            # MANDAL
            # ==============================================

            mandal = get_column_value(

                center,

                [
                    "mandal",
                    "Mandal",
                    "mandal_name",
                    "Mandal_Name"
                ]

            )


            # ==============================================
            # LOCATION / AREA
            # ==============================================

            location = get_column_value(

                center,

                [
                    "location",
                    "Location",
                    "area",
                    "Area",
                    "address",
                    "Address"
                ]

            )


            if not location:

                if village:

                    location = village

                elif mandal:

                    location = mandal

                else:

                    location = center_district


            # ==============================================
            # CAPACITY
            # ==============================================

            total_capacity = get_column_value(

                center,

                [
                    "total_capacity",
                    "Total_Capacity",
                    "Total_Capacity_Tons",
                    "capacity",
                    "Capacity",
                    "capacity_tons"
                ],

                "0"

            )


            # ==============================================
            # CURRENT STOCK
            # ==============================================

            current_stock = get_column_value(

                center,

                [
                    "current_stock",
                    "Current_Stock",
                    "current_stock_tons"
                ],

                "0"

            )


            # ==============================================
            # AVAILABLE CAPACITY
            # ==============================================

            available_capacity = get_column_value(

                center,

                [
                    "available_capacity",
                    "Available_Capacity",
                    "available_capacity_tons",
                    "Available_Capacity_Tons"
                ],

                ""

            )


            # Calculate available capacity if it is missing

            if not available_capacity:

                available_capacity_value = (
                    safe_float(
                        total_capacity
                    )
                    -
                    safe_float(
                        current_stock
                    )
                )

                if available_capacity_value < 0:

                    available_capacity_value = 0

                available_capacity = (
                    available_capacity_value
                )


            # ==============================================
            # DISTRICT FILTER
            # ==============================================

            if not district_matches(

                center_district,

                district

            ):

                continue


            # ==============================================
            # CROP FILTER
            # ==============================================

            if not crop_matches(

                center,

                crop

            ):

                continue


            # ==============================================
            # LOCATION FILTER
            # ==============================================

            if location_filter:

                searchable_text = " ".join([

                    clean_value(
                        location
                    ).lower(),

                    clean_value(
                        village
                    ).lower(),

                    clean_value(
                        mandal
                    ).lower(),

                    clean_value(
                        center_name
                    ).lower(),

                    clean_value(
                        center_district
                    ).lower()

                ])


                if (
                    location_filter
                    not in searchable_text
                ):

                    continue


            # ==============================================
            # TEMPORARY DIFFERENT DISTANCE
            # ==============================================

            temporary_distance = (
                generate_random_distance(
                    center_id
                )
            )


            # ==============================================
            # ADD PROCUREMENT CENTER
            # ==============================================

            filtered_centers.append({

                "id":
                    str(center_id),

                "center_id":
                    str(center_id),

                "name":
                    str(center_name),

                "center_name":
                    str(center_name),

                "district":
                    str(center_district),

                "location":
                    str(location),

                "area":
                    str(location),

                "village":
                    str(village),

                "mandal":
                    str(mandal),

                "distance_km":
                    temporary_distance,

                "distance":
                    temporary_distance,

                "capacity":
                    safe_float(
                        total_capacity
                    ),

                "total_capacity":
                    safe_float(
                        total_capacity
                    ),

                "current_stock":
                    safe_float(
                        current_stock
                    ),

                "available_capacity":
                    safe_float(
                        available_capacity
                    )

            })


        # ==================================================
        # SORT BY TEMPORARY DISTANCE
        # ==================================================

        filtered_centers.sort(

            key=lambda center:

            center.get(
                "distance_km",
                0
            )

        )


        # ==================================================
        # TOTAL CENTERS FOUND
        # ==================================================

        total_found = len(
            filtered_centers
        )


        # ==================================================
        # RETURN ONLY 5 CENTERS
        # ==================================================

        filtered_centers = (
            filtered_centers[:5]
        )


        # ==================================================
        # RESPONSE
        # ==================================================

        return jsonify({

            "success": True,

            "district":
                district,

            "crop":
                crop,

            "total_centers":
                total_found,

            "showing":
                len(
                    filtered_centers
                ),

            "centers":
                filtered_centers

        }), 200


    except Exception as error:

        print("")
        print("==========================================")
        print("❌ PROCUREMENT CENTER ERROR")
        print("==========================================")
        print(
            str(error)
        )
        print("==========================================")
        print("")


        return jsonify({

            "success": False,

            "message":
                "Unable to load procurement centers.",

            "error":
                str(error)

        }), 500