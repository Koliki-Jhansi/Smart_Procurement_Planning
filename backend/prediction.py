from flask import Blueprint, request, jsonify

import os
import joblib
import pandas as pd


prediction_bp = Blueprint(
    "prediction",
    __name__,
    url_prefix="/api"
)


# ============================================================
# PATHS
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)

MODELS_DIR = os.path.join(
    BASE_DIR,
    "models"
)


# ============================================================
# LOAD MODEL
# ============================================================

try:
    crop_prediction_model = joblib.load(
        os.path.join(
            MODELS_DIR,
            "crop_prediction_model.pkl"
        )
    )

    district_encoder = joblib.load(
        os.path.join(
            MODELS_DIR,
            "district_encoder.pkl"
        )
    )

    crop_encoder = joblib.load(
        os.path.join(
            MODELS_DIR,
            "crop_encoder.pkl"
        )
    )

    season_encoder = joblib.load(
        os.path.join(
            MODELS_DIR,
            "season_encoder.pkl"
        )
    )

    print(" Farmer crop prediction model loaded")

except Exception as error:

    print(" Farmer prediction model loading failed")
    print(error)

    crop_prediction_model = None
    district_encoder = None
    crop_encoder = None
    season_encoder = None


# ============================================================
# NORMALIZE VALUE
# ============================================================

def find_matching_value(value, classes):

    value = str(value).strip()

    # Exact match
    if value in classes:
        return value

    # Case-insensitive match
    for item in classes:

        if str(item).strip().lower() == value.lower():
            return item

    return None


# ============================================================
# CROP PREDICTION
# ============================================================

@prediction_bp.route(
    "/predict",
    methods=["POST"]
)
def predict_crop():

    try:

        if crop_prediction_model is None:

            return jsonify({
                "success": False,
                "message": "Crop prediction model is not loaded"
            }), 500


        data = request.get_json()


        if not data:

            return jsonify({
                "success": False,
                "message": "Request data is required"
            }), 400


        district = str(
            data.get("district", "")
        ).strip()

        crop = str(
            data.get("crop", "")
        ).strip()

        season = str(
            data.get("season", "")
        ).strip()

        year = data.get("year")

        area = data.get("area")


        if not district:

            return jsonify({
                "success": False,
                "message": "District is required"
            }), 400


        if not crop:

            return jsonify({
                "success": False,
                "message": "Crop is required"
            }), 400


        if not season:

            return jsonify({
                "success": False,
                "message": "Season is required"
            }), 400


        if year is None:

            return jsonify({
                "success": False,
                "message": "Year is required"
            }), 400


        if area is None:

            return jsonify({
                "success": False,
                "message": "Area is required"
            }), 400


        try:

            year = int(year)

            area = float(area)

        except ValueError:

            return jsonify({
                "success": False,
                "message": "Year must be an integer and area must be a number"
            }), 400


        if area <= 0:

            return jsonify({
                "success": False,
                "message": "Area must be greater than zero"
            }), 400


        # ====================================================
        # FIND VALUES IN TRAINED ENCODERS
        # ====================================================

        matched_district = find_matching_value(
            district,
            district_encoder.classes_
        )

        matched_crop = find_matching_value(
            crop,
            crop_encoder.classes_
        )

        matched_season = find_matching_value(
            season,
            season_encoder.classes_
        )


        if matched_district is None:

            return jsonify({
                "success": False,
                "message": f"Unknown district: {district}",
                "available_districts": list(
                    district_encoder.classes_
                )
            }), 400


        if matched_crop is None:

            return jsonify({
                "success": False,
                "message": f"Unknown crop: {crop}",
                "available_crops": list(
                    crop_encoder.classes_
                )
            }), 400


        if matched_season is None:

            return jsonify({
                "success": False,
                "message": f"Unknown season: {season}",
                "available_seasons": list(
                    season_encoder.classes_
                )
            }), 400


        # ====================================================
        # ENCODE INPUT
        # ====================================================

        district_encoded = district_encoder.transform(
            [matched_district]
        )[0]

        crop_encoded = crop_encoder.transform(
            [matched_crop]
        )[0]

        season_encoded = season_encoder.transform(
            [matched_season]
        )[0]


        # ====================================================
        # CREATE MODEL INPUT
        # ====================================================

        features = pd.DataFrame([{

            "district":
                district_encoded,

            "crop":
                crop_encoded,

            "season":
                season_encoded,

            "year":
                year,

            "area":
                area

        }])


        # ====================================================
        # PREDICT
        # ====================================================

        prediction = crop_prediction_model.predict(
            features
        )[0]


        prediction = max(
            0,
            float(prediction)
        )


        return jsonify({

            "success": True,

            "message":
                "Crop production predicted successfully",

            "input": {

                "district":
                    matched_district,

                "crop":
                    matched_crop,

                "season":
                    matched_season,

                "year":
                    year,

                "area":
                    area

            },

            "predicted_production":
                round(
                    prediction,
                    2
                )

        }), 200


    except Exception as error:

        print(" Crop prediction error:")
        print(error)


        return jsonify({

            "success": False,

            "message":
                "Crop prediction failed",

            "error":
                str(error)

        }), 500