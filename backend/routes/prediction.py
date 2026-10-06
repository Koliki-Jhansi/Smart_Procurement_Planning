from flask import Blueprint, request, jsonify
import joblib
import os
import numpy as np


prediction_bp = Blueprint(
    "prediction",
    __name__,
    url_prefix="/api"
)


# =====================================================
# MODEL PATH
# =====================================================

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)

MODEL_DIR = os.path.join(
    BASE_DIR,
    "models"
)


# =====================================================
# MODEL FILES
# =====================================================

MODEL_PATH = os.path.join(
    MODEL_DIR,
    "crop_prediction_model.pkl"
)

DISTRICT_ENCODER_PATH = os.path.join(
    MODEL_DIR,
    "district_encoder.pkl"
)

CROP_ENCODER_PATH = os.path.join(
    MODEL_DIR,
    "crop_encoder.pkl"
)

SEASON_ENCODER_PATH = os.path.join(
    MODEL_DIR,
    "season_encoder.pkl"
)


# =====================================================
# GLOBAL VARIABLES
# =====================================================

model = None
district_encoder = None
crop_encoder = None
season_encoder = None


# =====================================================
# LOAD MODELS
# =====================================================

def load_prediction_model():

    global model
    global district_encoder
    global crop_encoder
    global season_encoder

    model = joblib.load(
        MODEL_PATH
    )

    district_encoder = joblib.load(
        DISTRICT_ENCODER_PATH
    )

    crop_encoder = joblib.load(
        CROP_ENCODER_PATH
    )

    season_encoder = joblib.load(
        SEASON_ENCODER_PATH
    )


# =====================================================
# STARTUP
# =====================================================

try:

    load_prediction_model()

    print(" Crop prediction model loaded")

    print(
        " District classes:",
        list(district_encoder.classes_)
    )

    print(
        " Crop classes:",
        list(crop_encoder.classes_)
    )

    print(
        " Season classes:",
        list(season_encoder.classes_)
    )

except Exception as e:

    print(
        " Model loading error:",
        e
    )


# =====================================================
# MODEL STATUS ENDPOINT
# =====================================================

@prediction_bp.route("/prediction/status", methods=["GET"])
@prediction_bp.route("/predict/status", methods=["GET"])
def prediction_status():
    is_ready = bool(
        model is not None and
        district_encoder is not None and
        crop_encoder is not None and
        season_encoder is not None
    )

    return jsonify({
        "success": True,
        "model_loaded": is_ready,
        "message": (
            "Crop prediction model is ready."
            if is_ready
            else "Crop prediction model is not loaded."
        )
    }), (200 if is_ready else 503)


# =====================================================
# MATCH VALUE WITH ENCODER
# =====================================================

def match_encoder_value(
    value,
    encoder
):

    if value is None:
        return None

    value = str(value).strip()

    if not value:
        return None

    for class_value in encoder.classes_:

        if (
            str(class_value).strip().lower()
            == value.lower()
        ):

            return class_value

    return None


# =====================================================
# PREDICTION
# =====================================================

@prediction_bp.route(
    "/predict",
    methods=["POST"]
)
def predict():
    global model, district_encoder, crop_encoder, season_encoder

    if model is None or district_encoder is None or crop_encoder is None or season_encoder is None:
        try:
            load_prediction_model()
        except Exception as load_err:
            print("Model load retry failed:", load_err)
            return jsonify({
                "success": False,
                "message": "Crop prediction ML model files are not loaded or missing on the server. Please ensure the trained .pkl model files are deployed."
            }), 503

    data = request.get_json(silent=True) or {}

    print("===================================")
    print(" Prediction request:", data)

    # =================================================
    # GET INPUT
    # =================================================

    district_input = data.get("district") or data.get("District")
    crop_input = data.get("crop") or data.get("Crop")
    season_input = data.get("season") or data.get("Season")
    year = data.get("year") if data.get("year") is not None else data.get("Year")
    area = data.get("area") if data.get("area") is not None else data.get("Area")

    print(
        " District received:",
        district_input
    )

    print(
        " Crop received:",
        crop_input
    )

    print(
        " Season received:",
        season_input
    )

    # =================================================
    # REQUIRED FIELD VALIDATION
    # =================================================

    if not district_input:

        return jsonify({
            "success": False,
            "message": "District is required"
        }), 400

    if not crop_input:

        return jsonify({
            "success": False,
            "message": "Crop is required"
        }), 400

    if not season_input:

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

    # =================================================
    # MATCH WITH TRAINED VALUES
    # =================================================

    district = match_encoder_value(
        district_input,
        district_encoder
    )

    crop = match_encoder_value(
        crop_input,
        crop_encoder
    )

    season = match_encoder_value(
        season_input,
        season_encoder
    )

    print(
        " Matched district:",
        district
    )

    print(
        " Matched crop:",
        crop
    )

    print(
        " Matched season:",
        season
    )

    # =================================================
    # VALIDATE DISTRICT
    # =================================================

    if district is None:

        return jsonify({

            "success": False,

            "message":
                f"Unknown district: {district_input}",

            "available_districts":
                list(
                    district_encoder.classes_
                )

        }), 400

    # =================================================
    # VALIDATE CROP
    # =================================================

    if crop is None:

        return jsonify({

            "success": False,

            "message":
                f"Unknown crop: {crop_input}",

            "available_crops":
                list(
                    crop_encoder.classes_
                )

        }), 400

    # =================================================
    # VALIDATE SEASON
    # =================================================

    if season is None:

        return jsonify({

            "success": False,

            "message":
                f"Unknown season: {season_input}",

            "available_seasons":
                list(
                    season_encoder.classes_
                )

        }), 400

    # =================================================
    # CONVERT YEAR
    # =================================================

    try:

        year = int(year)

    except (ValueError, TypeError):

        return jsonify({

            "success": False,

            "message":
                "Year must be a valid number"

        }), 400

    # =================================================
    # CONVERT AREA
    # =================================================

    try:

        area = float(area)

    except (ValueError, TypeError):

        return jsonify({

            "success": False,

            "message":
                "Area must be a valid number"

        }), 400

    # =================================================
    # AREA VALIDATION
    # =================================================

    if area <= 0:

        return jsonify({

            "success": False,

            "message":
                "Area must be greater than 0"

        }), 400

    # =================================================
    # ENCODE VALUES
    # =================================================

    try:

        district_encoded = (
            district_encoder.transform(
                [district]
            )[0]
        )

        crop_encoded = (
            crop_encoder.transform(
                [crop]
            )[0]
        )

        season_encoded = (
            season_encoder.transform(
                [season]
            )[0]
        )

    except Exception as e:

        print(
            " Encoding error:",
            e
        )

        return jsonify({

            "success": False,

            "message":
                "Encoding failed",

            "error":
                str(e)

        }), 400

    # =================================================
    # MODEL FEATURES
    # =================================================

    features = np.array([
        [
            district_encoded,
            crop_encoded,
            season_encoded,
            year,
            area
        ]
    ])

    print(
        " Encoded features:",
        features
    )

    # =================================================
    # PREDICTION
    # =================================================

    try:

        prediction = model.predict(
            features
        )[0]

    except Exception as e:

        print(
            " Prediction error:",
            e
        )

        return jsonify({

            "success": False,

            "message":
                "Model prediction failed",

            "error":
                str(e)

        }), 500

    # =================================================
    # PREVENT NEGATIVE PRODUCTION
    # =================================================

    prediction = max(
        0,
        float(prediction)
    )

    print(
        " Predicted production:",
        prediction
    )

    print("===================================")

    # =================================================
    # RESPONSE
    # =================================================

    return jsonify({

        "success": True,

        "message":
            "Prediction successful",

        "district":
            district,

        "crop":
            crop,

        "season":
            season,

        "year":
            year,

        "area":
            area,

        "predicted_production":
            round(
                prediction,
                2
            )

    }), 200