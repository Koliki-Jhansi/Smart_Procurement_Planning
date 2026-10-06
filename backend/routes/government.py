from flask import Blueprint, request, jsonify

from sqlalchemy import func

from extensions import db

from models.user import User
from models.procurement_request import ProcurementRequest
from models.procurement_center import ProcurementCenter
from models.warehouse import Warehouse

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

MODEL_DIR = os.path.join(
    BASE_DIR,
    "models"
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

    if os.path.exists(
        crop_model_path
    ):

        crop_model = joblib.load(
            crop_model_path
        )

        print(
            " Government: crop prediction model loaded"
        )

    if os.path.exists(
        crop_encoder_path
    ):

        crop_encoder = joblib.load(
            crop_encoder_path
        )

        print(
            " Government: crop encoder loaded"
        )

    if os.path.exists(
        district_encoder_path
    ):

        district_encoder = joblib.load(
            district_encoder_path
        )

        print(
            " Government: district encoder loaded"
        )

    if os.path.exists(
        season_encoder_path
    ):

        season_encoder = joblib.load(
            season_encoder_path
        )

        print(
            " Government: season encoder loaded"
        )

except Exception as e:

    print(
        " Government model loading error:",
        str(e)
    )


# ============================================================
# NORMALIZE DISTRICT
# ============================================================

def normalize_district(value):

    if value is None:
        return ""

    value = str(
        value
    ).strip().lower()

    district_map = {

        "guntur":
            "Guntur",

        "ananthapur":
            "Anantapur",

        "anantapur":
            "Anantapur",

        "anantapuramu":
            "Anantapur",

        "chittoor":
            "Chittoor",

        "east godavari":
            "East Godavari",

        "eastgodavari":
            "East Godavari",

        "krishna":
            "Krishna",

        "kurnool":
            "Kurnool",

        "ntr":
            "NTR",

        "nellore":
            "Nellore",

        "spsr nellore":
            "Nellore",

        "prakasam":
            "Prakasam",

        "west godavari":
            "West Godavari",

        "westgodavari":
            "West Godavari",

        "palnadu":
            "Palnadu",

        "bapatla":
            "Bapatla",

        "eluru":
            "Eluru",

        "kakinada":
            "Kakinada",

        "anakapalli":
            "Anakapalli",

        "tirupati":
            "Tirupati",

        "annamayya":
            "Annamayya",

        "nandyal":
            "Nandyal",

        "sri sathya sai":
            "Sri Sathya Sai",

        "ysr kadapa":
            "YSR Kadapa",

        "kadapa":
            "YSR Kadapa"
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
        mobile_number=str(
            mobile
        ).strip()
    ).first()

    if not user:
        return None

    if str(
        user.role
    ).lower() not in [
        "government",
        "admin"
    ]:
        return None

    return user


# ============================================================
# STORAGE DISTRICT
# ============================================================

def get_request_storage_district(
    record
):

    center_district = normalize_district(
        getattr(
            record,
            "center_district",
            ""
        )
    )

    if center_district:
        return center_district

    return normalize_district(
        getattr(
            record,
            "district",
            ""
        )
    )


# ============================================================
# DISTRICT CAPACITY CALCULATION
# ============================================================

def calculate_district_capacity(
    district,
    exclude_request_id=None
):

    district = normalize_district(
        district
    )

    warehouses = Warehouse.query.all()

    district_warehouses = [
        warehouse
        for warehouse in warehouses
        if normalize_district(
            warehouse.district
        ) == district
    ]

    total_capacity = sum(
        float(
            warehouse.total_capacity
            or 0
        )
        for warehouse
        in district_warehouses
    )

    current_stock = sum(
        float(
            warehouse.current_stock
            or 0
        )
        for warehouse
        in district_warehouses
    )

    approved_records = (
        ProcurementRequest.query
        .filter(
            func.lower(
                ProcurementRequest.status
            ) == "approved"
        )
        .all()
    )

    reserved_capacity = 0.0

    for approved in approved_records:

        if (
            exclude_request_id
            is not None
            and approved.id
            == exclude_request_id
        ):
            continue

        approved_district = (
            get_request_storage_district(
                approved
            )
        )

        if approved_district == district:

            reserved_capacity += float(
                approved.quantity or 0
            )

    physical_available = max(
        0,
        total_capacity
        - current_stock
    )

    effective_available = max(
        0,
        total_capacity
        - current_stock
        - reserved_capacity
    )

    if total_capacity > 0:

        utilization = (
            (
                current_stock
                + reserved_capacity
            )
            / total_capacity
        ) * 100

    else:

        utilization = 0

    return {

        "district":
            district,

        "warehouse_count":
            len(
                district_warehouses
            ),

        "total_capacity":
            round(
                total_capacity,
                2
            ),

        "current_stock":
            round(
                current_stock,
                2
            ),

        "reserved_capacity":
            round(
                reserved_capacity,
                2
            ),

        "physical_available_capacity":
            round(
                physical_available,
                2
            ),

        "effective_available_capacity":
            round(
                effective_available,
                2
            ),

        "utilization_percentage":
            round(
                utilization,
                2
            )
    }


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
            "message":
                "Government or admin access required"
        }), 403

    data = request.get_json(
        silent=True
    ) or {}

    district = normalize_district(
        data.get(
            "district",
            getattr(
                user,
                "district",
                ""
            )
        )
    )

    crop = str(
        data.get(
            "crop",
            ""
        )
    ).strip()

    season = str(
        data.get(
            "season",
            ""
        )
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
            "message":
                "District is required"
        }), 400

    if not crop:

        return jsonify({
            "success": False,
            "message":
                "Crop is required"
        }), 400

    if not season:

        return jsonify({
            "success": False,
            "message":
                "Season is required"
        }), 400

    try:

        year = int(
            year
        )

        area = float(
            area
        )

        previous_production = float(
            previous_production or 0
        )

    except (ValueError, TypeError):

        return jsonify({
            "success": False,
            "message":
                "Invalid numeric values"
        }), 400

    if area <= 0:

        return jsonify({
            "success": False,
            "message":
                "Area must be greater than 0"
        }), 400

    if crop_model is None:

        return jsonify({
            "success": False,
            "message":
                "Crop prediction model is not loaded"
        }), 500

    if (
        crop_encoder is None
        or district_encoder is None
        or season_encoder is None
    ):

        return jsonify({
            "success": False,
            "message":
                "Prediction encoders are not loaded"
        }), 500

    try:

        district_encoded = (
            district_encoder
            .transform(
                [district]
            )[0]
        )

        crop_encoded = (
            crop_encoder
            .transform(
                [crop]
            )[0]
        )

        season_encoded = (
            season_encoder
            .transform(
                [season]
            )[0]
        )

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

        prediction = (
            crop_model.predict(
                input_data
            )[0]
        )

        predicted_production = max(
            0,
            float(
                prediction
            )
        )

        capacity = (
            calculate_district_capacity(
                district
            )
        )

        effective_available = float(
            capacity[
                "effective_available_capacity"
            ]
        )

        if predicted_production <= 0:

            capacity_risk = "Low"

        elif (
            effective_available
            >= predicted_production
        ):

            capacity_risk = "Low"

        elif (
            effective_available
            >= predicted_production * 0.5
        ):

            capacity_risk = "Medium"

        else:

            capacity_risk = "High"

        return jsonify({

            "success":
                True,

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
                ),

            "warehouse_capacity":
                capacity,

            "capacity_risk":
                capacity_risk

        }), 200

    except ValueError as e:

        return jsonify({

            "success":
                False,

            "message":
                "Unknown district, crop or season",

            "error":
                str(e)

        }), 400

    except Exception as e:

        print(
            " Government production error:",
            str(e)
        )

        return jsonify({

            "success":
                False,

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
            "message":
                "Government or admin access required"
        }), 403

    data = request.get_json(
        silent=True
    ) or {}

    district = normalize_district(
        data.get(
            "district",
            ""
        )
    )

    predicted_production = data.get(
        "predicted_production",
        0
    )

    try:

        predicted_production = float(
            predicted_production or 0
        )

    except (ValueError, TypeError):

        return jsonify({
            "success": False,
            "message":
                "Invalid predicted production"
        }), 400

    # --------------------------------------------------------
    # NEW DATABASE-BASED MODE
    # --------------------------------------------------------

    if district:

        capacity = (
            calculate_district_capacity(
                district
            )
        )

        current_capacity = float(
            capacity[
                "total_capacity"
            ]
        )

        filled_capacity = float(
            capacity[
                "current_stock"
            ]
        )

        reserved_capacity = float(
            capacity[
                "reserved_capacity"
            ]
        )

        available_capacity = float(
            capacity[
                "effective_available_capacity"
            ]
        )

    else:

        # ----------------------------------------------------
        # OLD COMPATIBILITY MODE
        # ----------------------------------------------------

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
                "message":
                    "Invalid capacity values"
            }), 400

        reserved_capacity = 0

        available_capacity = max(
            0,
            current_capacity
            - filled_capacity
        )

    if predicted_production < 0:
        predicted_production = 0

    required_capacity = max(
        0,
        predicted_production
        - available_capacity
    )

    capacity_difference = (
        available_capacity
        - predicted_production
    )

    if (
        predicted_production
        > available_capacity
    ):

        recommendation = "increase"

        message = (
            "Predicted production is higher "
            "than the effective available "
            "warehouse capacity."
        )

        suggested_change = (
            predicted_production
            - available_capacity
        )

    elif (
        predicted_production
        < available_capacity
    ):

        recommendation = "sufficient"

        message = (
            "Effective warehouse capacity "
            "can accommodate the predicted "
            "production."
        )

        suggested_change = 0

    else:

        recommendation = "sufficient"

        message = (
            "Effective warehouse capacity "
            "exactly matches predicted production."
        )

        suggested_change = 0

    return jsonify({

        "success":
            True,

        "district":
            district,

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

        "reserved_capacity":
            round(
                reserved_capacity,
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
            "message":
                "Government or admin access required"
        }), 403

    district = request.args.get(
        "district",
        ""
    ).strip()

    query = ProcurementRequest.query

    if (
        str(
            user.role
        ).lower()
        == "government"
    ):

        user_district = normalize_district(
            getattr(
                user,
                "district",
                ""
            )
        )

        if user_district:

            query = query.filter_by(
                district=user_district
            )

    if district:

        district = normalize_district(
            district
        )

        query = query.filter_by(
            district=district
        )

    records = query.order_by(
        ProcurementRequest
        .created_at
        .desc()
    ).all()

    result = []

    for record in records:

        item = record.to_dict()

        storage_district = (
            get_request_storage_district(
                record
            )
        )

        item[
            "storage_district"
        ] = storage_district

        result.append(
            item
        )

    return jsonify({

        "success":
            True,

        "district":
            district,

        "count":
            len(
                records
            ),

        "requests":
            result

    }), 200


# ============================================================
# 4. AUTOMATIC REQUEST CAPACITY CHECK
# ============================================================

@government_bp.route(
    "/requests/<int:request_id>/check",
    methods=["POST"]
)
def check_request(
    request_id
):

    user = get_government_user()

    if not user:

        return jsonify({
            "success": False,
            "message":
                "Government or admin access required"
        }), 403

    record = db.session.get(
        ProcurementRequest,
        request_id
    )

    if not record:

        return jsonify({
            "success": False,
            "message":
                "Procurement request not found"
        }), 404

    storage_district = (
        get_request_storage_district(
            record
        )
    )

    if not storage_district:

        return jsonify({
            "success": False,
            "message":
                "Procurement center district is not available"
        }), 400

    capacity = (
        calculate_district_capacity(
            storage_district,
            exclude_request_id=record.id
        )
    )

    requested_quantity = float(
        record.quantity or 0
    )

    available_capacity = float(
        capacity[
            "effective_available_capacity"
        ]
    )

    remaining_capacity = (
        available_capacity
        - requested_quantity
    )

    can_approve = (
        requested_quantity
        <= available_capacity
    )

    response = {

        "success":
            True,

        "request_id":
            record.id,

        "request_status":
            record.status,

        "district":
            storage_district,

        "center_id":
            record.center_id,

        "center_name":
            record.center_name,

        "requested_quantity":
            round(
                requested_quantity,
                2
            ),

        "total_capacity":
            capacity[
                "total_capacity"
            ],

        "current_stock":
            capacity[
                "current_stock"
            ],

        "reserved_capacity":
            capacity[
                "reserved_capacity"
            ],

        "available_capacity":
            capacity[
                "effective_available_capacity"
            ],

        "can_approve":
            can_approve
    }

    if can_approve:

        response[
            "remaining_capacity_after_approval"
        ] = round(
            remaining_capacity,
            2
        )

        response[
            "recommendation"
        ] = "capacity_available"

        response[
            "message"
        ] = (
            "Sufficient warehouse capacity "
            "is available for this request."
        )

    else:

        response[
            "shortage"
        ] = round(
            abs(
                remaining_capacity
            ),
            2
        )

        response[
            "recommendation"
        ] = "capacity_insufficient"

        response[
            "message"
        ] = (
            "Warehouse capacity is insufficient. "
            "Consider another procurement center "
            "or reject the request."
        )

    return jsonify(
        response
    ), 200


# ============================================================
# 5. APPROVE OR REJECT PROCUREMENT REQUEST
# ============================================================

@government_bp.route(
    "/requests/<int:request_id>/decision",
    methods=["POST"]
)
def procurement_decision(
    request_id
):

    user = get_government_user()

    if not user:

        return jsonify({
            "success": False,
            "message":
                "Government or admin access required"
        }), 403

    record = db.session.get(
        ProcurementRequest,
        request_id
    )

    if not record:

        return jsonify({
            "success": False,
            "message":
                "Procurement request not found"
        }), 404

    data = request.get_json(
        silent=True
    ) or {}

    decision = str(
        data.get(
            "decision",
            ""
        )
    ).strip().lower()

    if decision not in [
        "approve",
        "reject"
    ]:

        return jsonify({
            "success": False,
            "message":
                "Decision must be approve or reject"
        }), 400

    current_status = str(
        record.status or ""
    ).strip().lower()

    if current_status not in [
        "pending",
        "approved",
        "rejected"
    ]:

        return jsonify({
            "success": False,
            "message":
                "This procurement request cannot "
                "be changed from its current status",
            "status":
                record.status
        }), 400

    # --------------------------------------------------------
    # REJECT
    # --------------------------------------------------------

    if decision == "reject":

        record.status = "rejected"

        db.session.commit()

        return jsonify({

            "success":
                True,

            "request_id":
                record.id,

            "status":
                "rejected",

            "message":
                "Procurement request rejected."

        }), 200

    # --------------------------------------------------------
    # APPROVE
    # Recalculate capacity at the exact time of approval.
    # --------------------------------------------------------

    storage_district = (
        get_request_storage_district(
            record
        )
    )

    if not storage_district:

        return jsonify({
            "success": False,
            "message":
                "Procurement center district is not available"
        }), 400

    capacity = (
        calculate_district_capacity(
            storage_district,
            exclude_request_id=record.id
        )
    )

    requested_quantity = float(
        record.quantity or 0
    )

    available_capacity = float(
        capacity[
            "effective_available_capacity"
        ]
    )

    if (
        requested_quantity
        > available_capacity
    ):

        shortage = (
            requested_quantity
            - available_capacity
        )

        return jsonify({

            "success":
                False,

            "can_approve":
                False,

            "request_id":
                record.id,

            "status":
                record.status,

            "district":
                storage_district,

            "requested_quantity":
                round(
                    requested_quantity,
                    2
                ),

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

            "message":
                "Request cannot be approved because "
                "effective warehouse capacity is insufficient."

        }), 409

    record.status = "approved"

    db.session.commit()

    remaining_capacity = (
        available_capacity
        - requested_quantity
    )

    return jsonify({

        "success":
            True,

        "can_approve":
            True,

        "request_id":
            record.id,

        "status":
            "approved",

        "district":
            storage_district,

        "requested_quantity":
            round(
                requested_quantity,
                2
            ),

        "reserved_quantity":
            round(
                requested_quantity,
                2
            ),

        "remaining_capacity_after_approval":
            round(
                remaining_capacity,
                2
            ),

        "message":
            (
                "Procurement request approved. "
                "The requested quantity is now "
                "reserved in warehouse capacity. "
                "Physical stock has not been increased."
            )

    }), 200


# ============================================================
# 6. RECOMMEND ALTERNATIVE PROCUREMENT CENTERS
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
            "message":
                "Government or admin access required"
        }), 403

    data = request.get_json(
        silent=True
    ) or {}

    district = normalize_district(
        data.get(
            "district",
            ""
        )
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
            "message":
                "Invalid quantity"
        }), 400

    if not district:

        return jsonify({
            "success": False,
            "message":
                "District is required"
        }), 400

    if required_quantity <= 0:

        return jsonify({
            "success": False,
            "message":
                "Quantity must be greater than 0"
        }), 400

    centers = (
        ProcurementCenter.query.all()
    )

    recommendations = []

    district_capacity_cache = {}

    for center in centers:

        center_district = (
            normalize_district(
                center.district
            )
        )

        if not center_district:
            continue

        if (
            center_district
            not in district_capacity_cache
        ):

            district_capacity_cache[
                center_district
            ] = (
                calculate_district_capacity(
                    center_district
                )
            )

        district_capacity = (
            district_capacity_cache[
                center_district
            ]
        )

        effective_available = float(
            district_capacity[
                "effective_available_capacity"
            ]
        )

        center_capacity = float(
            center.capacity_tons or 0
        )

        usable_capacity = min(
            center_capacity,
            effective_available
        )

        if (
            usable_capacity
            < required_quantity
        ):
            continue

        same_district = (
            center_district
            == district
        )

        priority = (
            1
            if same_district
            else 0
        )

        recommendations.append({

            "center_id":
                center.center_id,

            "center_name":
                center.center_name,

            "district":
                center_district,

            "capacity_tons":
                round(
                    center_capacity,
                    2
                ),

            "district_effective_available":
                round(
                    effective_available,
                    2
                ),

            "same_district":
                same_district,

            "priority":
                priority,

            "reason": (
                "Same district with sufficient "
                "effective warehouse capacity"
                if same_district
                else
                "Other district with sufficient "
                "effective warehouse capacity"
            )

        })

    recommendations.sort(
        key=lambda x: (
            -x[
                "priority"
            ],
            x[
                "district"
            ],
            x[
                "capacity_tons"
            ]
        )
    )

    return jsonify({

        "success":
            True,

        "requested_quantity":
            required_quantity,

        "district":
            district,

        "count":
            len(
                recommendations
            ),

        "recommendations":
            recommendations[:5]

    }), 200