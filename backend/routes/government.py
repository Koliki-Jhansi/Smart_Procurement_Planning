
from flask import Blueprint, request, jsonify
from models.user import User
from models.procurement_request import ProcurementRequest
from models.procurement_center import ProcurementCenter

import os
import joblib
import pandas as pd


# ============================================================
# BLUEPRINT
# ============================================================

government_bp = Blueprint(
    "government",
    __name__,
    url_prefix="/api/government"
)


# ============================================================
# MODEL PATH
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)

MODEL_DIR = os.path.abspath(
    os.path.join(
        BASE_DIR,
        "..",
        "models"
    )
)


# ============================================================
# LOAD CROP PRODUCTION MODEL
# ============================================================

crop_model = None
crop_encoder = None
district_encoder = None
season_encoder = None


try:

    crop_model_path = os.path.join(
        MODEL_DIR,
        "crop_prediction_model.pkl"
    )

    crop_encoder_path = os.path.join(
        MODEL_DIR,
        "crop_encoder.pkl"
    )

    district_encoder_path = os.path.join(
        MODEL_DIR,
        "district_encoder.pkl"
    )

    season_encoder_path = os.path.join(
        MODEL_DIR,
        "season_encoder.pkl"
    )


    if os.path.exists(crop_model_path):

        crop_model = joblib.load(
            crop_model_path
        )

        print(
            "✅ Government: crop prediction model loaded"
        )


    if os.path.exists(crop_encoder_path):

        crop_encoder = joblib.load(
            crop_encoder_path
        )

        print(
            "✅ Government: crop encoder loaded"
        )


    if os.path.exists(district_encoder_path):

        district_encoder = joblib.load(
            district_encoder_path
        )

        print(
            "✅ Government: district encoder loaded"
        )


    if os.path.exists(season_encoder_path):

        season_encoder = joblib.load(
            season_encoder_path
        )

        print(
            "✅ Government: season encoder loaded"
        )


except Exception as e:

    print(
        "⚠️ Government model loading error:",
        str(e)
    )


# ============================================================
# NORMALIZE DISTRICT
# ============================================================

def normalize_district(value):

    if value is None:
        return ""

    value = str(value).strip().lower()

    district_map = {

        "guntur": "Guntur",

        "ananthapur": "Anantapur",
        "anantapur": "Anantapur",
        "anantapuramu": "Anantapur",

        "chittoor": "Chittoor",

        "east godavari": "East Godavari",
        "eastgodavari": "East Godavari",

        "krishna": "Krishna",

        "kurnool": "Kurnool",

        "ntr": "NTR",

        "nellore": "Nellore",
        "spsr nellore": "Nellore",

        "prakasam": "Prakasam",

        "west godavari": "West Godavari",
        "westgodavari": "West Godavari"
    }

    return district_map.get(
        value,
        value.title()
    )


# ============================================================
# GOVERNMENT ACCESS CHECK
# ============================================================

def get_government_user():

    mobile = request.headers.get(
        "X-Admin-Mobile"
    )

    if not mobile:
        return None

    user = User.query.filter_by(
        mobile_number=str(mobile).strip()
    ).first()

    if not user:
        return None

    if str(user.role).lower() not in [
        "government",
        "admin"
    ]:
        return None

    return user


# ============================================================
# 1. GOVERNMENT PRODUCTION PREDICTION
# ============================================================

@government_bp.route(
    "/production",
    methods=["POST"]
)
def government_production():

    user = get_government_user()

    if not user:

        return jsonify({
            "success": False,
            "message": "Government or admin access required"
        }), 403


    data = request.get_json(
        silent=True
    ) or {}


    district = normalize_district(
        data.get(
            "district",
            getattr(user, "district", "")
        )
    )

    crop = str(
        data.get("crop", "")
    ).strip()

    season = str(
        data.get("season", "")
    ).strip()

    year = data.get(
        "year",
        2026
    )

    area = data.get(
        "area",
        0
    )

    previous_production = data.get(
        "previous_production",
        0
    )


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


    try:

        year = int(year)

        area = float(area)

        previous_production = float(
            previous_production or 0
        )

    except (ValueError, TypeError):

        return jsonify({
            "success": False,
            "message": "Invalid numeric values"
        }), 400


    if area <= 0:

        return jsonify({
            "success": False,
            "message": "Area must be greater than 0"
        }), 400


    if crop_model is None:

        return jsonify({
            "success": False,
            "message": "Crop prediction model is not loaded"
        }), 500


    try:

        district_encoded = district_encoder.transform(
            [district]
        )[0]

        crop_encoded = crop_encoder.transform(
            [crop]
        )[0]

        season_encoded = season_encoder.transform(
            [season]
        )[0]


        # ----------------------------------------------------
        # SAME INPUT STRUCTURE USED BY EXISTING CROP MODEL
        # ----------------------------------------------------

        input_data = pd.DataFrame([{

            "District":
                district_encoded,

            "Crop":
                crop_encoded,

            "Season":
                season_encoded,

            "Year":
                year,

            "Area":
                area

        }])


        prediction = crop_model.predict(
            input_data
        )[0]


        predicted_production = max(
            0,
            float(prediction)
        )


        return jsonify({

            "success": True,

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

            "previous_production":
                round(
                    previous_production,
                    2
                ),

            "predicted_production":
                round(
                    predicted_production,
                    2
                )

        }), 200


    except ValueError as e:

        return jsonify({

            "success": False,

            "message":
                "Unknown district, crop or season",

            "error":
                str(e)

        }), 400


    except Exception as e:

        print(
            "❌ Government production error:",
            str(e)
        )

        return jsonify({

            "success": False,

            "message":
                "Production prediction failed",

            "error":
                str(e)

        }), 500


# ============================================================
# 2. WAREHOUSE CAPACITY ANALYSIS
# ============================================================

@government_bp.route(
    "/warehouse-analysis",
    methods=["POST"]
)
def warehouse_analysis():

    user = get_government_user()

    if not user:

        return jsonify({
            "success": False,
            "message": "Government or admin access required"
        }), 403


    data = request.get_json(
        silent=True
    ) or {}


    try:

        predicted_production = float(
            data.get(
                "predicted_production",
                0
            )
        )

        current_capacity = float(
            data.get(
                "current_capacity",
                0
            )
        )

        filled_capacity = float(
            data.get(
                "filled_capacity",
                0
            )
        )

    except (ValueError, TypeError):

        return jsonify({
            "success": False,
            "message": "Invalid capacity values"
        }), 400


    if predicted_production < 0:
        predicted_production = 0

    if current_capacity < 0:
        current_capacity = 0

    if filled_capacity < 0:
        filled_capacity = 0


    available_capacity = max(
        0,
        current_capacity - filled_capacity
    )


    required_capacity = max(
        0,
        predicted_production - filled_capacity
    )


    capacity_difference = (
        current_capacity
        - predicted_production
    )


    if current_capacity < predicted_production:

        recommendation = "increase"

        message = (
            "Warehouse capacity is insufficient. "
            "Increase warehouse capacity."
        )

        suggested_change = (
            predicted_production
            - current_capacity
        )

    elif current_capacity > predicted_production:

        recommendation = "decrease"

        message = (
            "Warehouse capacity is higher than "
            "the predicted production."
        )

        suggested_change = (
            current_capacity
            - predicted_production
        )

    else:

        recommendation = "sufficient"

        message = (
            "Warehouse capacity is sufficient "
            "for the predicted production."
        )

        suggested_change = 0


    return jsonify({

        "success": True,

        "predicted_production":
            round(
                predicted_production,
                2
            ),

        "current_capacity":
            round(
                current_capacity,
                2
            ),

        "filled_capacity":
            round(
                filled_capacity,
                2
            ),

        "available_capacity":
            round(
                available_capacity,
                2
            ),

        "required_capacity":
            round(
                required_capacity,
                2
            ),

        "capacity_difference":
            round(
                capacity_difference,
                2
            ),

        "recommendation":
            recommendation,

        "suggested_change":
            round(
                suggested_change,
                2
            ),

        "message":
            message

    }), 200


# ============================================================
# 3. GOVERNMENT PROCUREMENT REQUESTS
# ============================================================

@government_bp.route(
    "/requests",
    methods=["GET"]
)
def government_requests():

    user = get_government_user()

    if not user:

        return jsonify({
            "success": False,
            "message": "Government or admin access required"
        }), 403


    district = request.args.get(
        "district",
        ""
    ).strip()


    query = ProcurementRequest.query


    # --------------------------------------------------------
    # GOVERNMENT USERS SEE THEIR DISTRICT
    # --------------------------------------------------------

    if str(user.role).lower() == "government":

        user_district = normalize_district(
            getattr(user, "district", "")
        )

        if user_district:

            query = query.filter_by(
                district=user_district
            )


    # --------------------------------------------------------
    # OPTIONAL DISTRICT FILTER
    # --------------------------------------------------------

    if district:

        district = normalize_district(
            district
        )

        query = query.filter_by(
            district=district
        )


    records = query.order_by(
        ProcurementRequest.created_at.desc()
    ).all()


    return jsonify({

        "success": True,

        "district":
            district,

        "count":
            len(records),

        "requests": [
            record.to_dict()
            for record in records
        ]

    }), 200


# ============================================================
# 4. CHECK WHETHER REQUEST CAN BE APPROVED
# ============================================================

@government_bp.route(
    "/requests/<int:request_id>/check",
    methods=["POST"]
)
def check_request(request_id):

    user = get_government_user()

    if not user:

        return jsonify({
            "success": False,
            "message": "Government or admin access required"
        }), 403


    record = ProcurementRequest.query.get(
        request_id
    )


    if not record:

        return jsonify({
            "success": False,
            "message": "Procurement request not found"
        }), 404


    data = request.get_json(
        silent=True
    ) or {}


    try:

        current_capacity = float(
            data.get(
                "current_capacity",
                0
            )
        )

        filled_capacity = float(
            data.get(
                "filled_capacity",
                0
            )
        )

    except (ValueError, TypeError):

        return jsonify({
            "success": False,
            "message": "Invalid warehouse capacity"
        }), 400


    available_capacity = max(
        0,
        current_capacity - filled_capacity
    )


    requested_quantity = float(
        record.quantity
    )


    if requested_quantity <= available_capacity:

        return jsonify({

            "success": True,

            "can_approve": True,

            "request_id":
                record.id,

            "requested_quantity":
                requested_quantity,

            "available_capacity":
                round(
                    available_capacity,
                    2
                ),

            "remaining_capacity_after_approval":
                round(
                    available_capacity
                    - requested_quantity,
                    2
                ),

            "recommendation":
                "approve",

            "message":
                "Sufficient warehouse capacity. "
                "Request can be approved."

        }), 200


    # --------------------------------------------------------
    # CAPACITY NOT AVAILABLE
    # --------------------------------------------------------

    shortage = (
        requested_quantity
        - available_capacity
    )


    return jsonify({

        "success": True,

        "can_approve": False,

        "request_id":
            record.id,

        "requested_quantity":
            requested_quantity,

        "available_capacity":
            round(
                available_capacity,
                2
            ),

        "shortage":
            round(
                shortage,
                2
            ),

        "recommendation":
            "reject_or_redirect",

        "message":
            "Warehouse capacity is insufficient. "
            "Consider another procurement center."

    }), 200


# ============================================================
# 5. RECOMMEND ALTERNATIVE PROCUREMENT CENTERS
# ============================================================

@government_bp.route(
    "/recommend-centers",
    methods=["POST"]
)
def recommend_centers():

    user = get_government_user()

    if not user:

        return jsonify({
            "success": False,
            "message": "Government or admin access required"
        }), 403


    data = request.get_json(
        silent=True
    ) or {}


    district = normalize_district(
        data.get("district", "")
    )


    try:

        required_quantity = float(
            data.get(
                "quantity",
                0
            )
        )

    except (ValueError, TypeError):

        return jsonify({
            "success": False,
            "message": "Invalid quantity"
        }), 400


    if not district:

        return jsonify({
            "success": False,
            "message": "District is required"
        }), 400


    if required_quantity <= 0:

        return jsonify({
            "success": False,
            "message": "Quantity must be greater than 0"
        }), 400


    # --------------------------------------------------------
    # LOAD CENTERS FROM DATABASE
    # --------------------------------------------------------

    centers = ProcurementCenter.query.all()


    recommendations = []


    for center in centers:

        center_district = normalize_district(
            center.district
        )


        capacity = float(
            center.capacity_tons or 0
        )


        # ----------------------------------------------------
        # CURRENTLY WE USE CAPACITY AS AVAILABLE CAPACITY
        # ----------------------------------------------------

        if capacity < required_quantity:
            continue


        same_district = (
            center_district == district
        )


        # Distance may not exist in the current
        # ProcurementCenter model.
        #
        # Therefore same district gets priority.
        #
        # Later we can connect the actual transport
        # calculation here.

        priority = 0

        if same_district:
            priority = 1


        recommendations.append({

            "center_id":
                center.center_id,

            "center_name":
                center.center_name,

            "district":
                center_district,

            "capacity_tons":
                round(
                    capacity,
                    2
                ),

            "same_district":
                same_district,

            "priority":
                priority,

            "reason": (
                "Same district and sufficient capacity"
                if same_district
                else
                "Other district with sufficient capacity"
            )

        })


    # --------------------------------------------------------
    # SORT
    # --------------------------------------------------------

    recommendations.sort(
        key=lambda x: (
            -x["priority"],
            x["capacity_tons"]
        )
    )


    return jsonify({

        "success": True,

        "requested_quantity":
            required_quantity,

        "district":
            district,

        "count":
            len(recommendations),

        "recommendations":
            recommendations[:5]

    }), 200

