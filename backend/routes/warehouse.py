from flask import Blueprint, request, jsonify

import os
import pandas as pd

from extensions import db

from models.procurement_center import ProcurementCenter
from models.warehouse import Warehouse
from models.appointment import Appointment


warehouse_bp = Blueprint(
    "warehouse",
    __name__,
    url_prefix="/api/warehouse"
)

# =========================================================
# PROCUREMENT CENTER CSV
# CSV = master source for center/district/capacity data
# Database = current stock + appointment reservations
# =========================================================

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)

PROCUREMENT_CENTERS_CSV = os.path.join(
    BASE_DIR,
    "datasets",
    "procurement_centers_ap_procurement_centers_real_wdra_1695f29d.csv"
)


# =========================================================
# HELPERS
# =========================================================

def clean_text(value):

    if value is None:
        return ""

    try:
        if pd.isna(value):
            return ""
    except Exception:
        pass

    return str(value).strip()


def safe_float(value, default=0.0):

    try:
        if value is None:
            return default

        try:
            if pd.isna(value):
                return default
        except Exception:
            pass

        return float(value)

    except (TypeError, ValueError):
        return default


def load_procurement_centers():

    if not os.path.exists(
        PROCUREMENT_CENTERS_CSV
    ):
        raise FileNotFoundError(
            "Procurement centers CSV not found: "
            + PROCUREMENT_CENTERS_CSV
        )

    dataframe = pd.read_csv(
        PROCUREMENT_CENTERS_CSV
    )

    dataframe.columns = [
        clean_text(column).lower()
        for column in dataframe.columns
    ]

    required_columns = {
        "center_id",
        "center_name",
        "district",
        "capacity_tons"
    }

    missing_columns = (
        required_columns
        - set(dataframe.columns)
    )

    if missing_columns:
        raise ValueError(
            "Procurement centers CSV is missing columns: "
            + ", ".join(
                sorted(missing_columns)
            )
        )

    dataframe = dataframe.fillna("")

    return dataframe


def row_value(row, column, default=""):

    if column not in row.index:
        return default

    value = row[column]

    if value is None:
        return default

    try:
        if pd.isna(value):
            return default
    except Exception:
        pass

    return value


def get_csv_center(center_id):

    center_id = clean_text(center_id)

    if not center_id:
        return None

    dataframe = load_procurement_centers()

    matches = dataframe[
        dataframe["center_id"]
        .astype(str)
        .str.strip()
        .str.lower()
        ==
        center_id.lower()
    ]

    if matches.empty:
        return None

    return matches.iloc[0]


def get_csv_centers_for_district(
    district
):

    district = clean_text(district)

    dataframe = load_procurement_centers()

    if not district:
        return dataframe.iloc[0:0]

    district_series = (
        dataframe["district"]
        .astype(str)
        .str.strip()
        .str.lower()
    )

    result = dataframe[
        district_series
        ==
        district.lower()
    ].copy()

    if "center_name" in result.columns:
        result = result.sort_values(
            by="center_name",
            key=lambda values:
                values.astype(str).str.lower()
        )

    return result


def get_reserved_quantity(center_id):

    if not center_id:
        return 0.0

    reserved = (
        db.session.query(
            db.func.coalesce(
                db.func.sum(
                    Appointment.reserved_quantity
                ),
                0
            )
        )
        .filter(
            Appointment.center_id
            == str(center_id),

            db.func.lower(
                Appointment.status
            ).in_([
                "booked",
                "completion_requested"
            ])
        )
        .scalar()
    )

    return safe_float(
        reserved,
        0
    )


def get_center_warehouse(center_id):

    if not center_id:
        return None

    warehouse = (
        Warehouse.query
        .filter_by(
            center_id=str(center_id)
        )
        .first()
    )

    if warehouse:
        return warehouse

    return (
        Warehouse.query
        .filter_by(
            warehouse_id=str(center_id)
        )
        .first()
    )


def get_center_capacity(center):

    center_id = clean_text(
        row_value(
            center,
            "center_id"
        )
    )

    center_capacity = safe_float(
        row_value(
            center,
            "capacity_tons",
            0
        ),
        0
    )

    warehouse = get_center_warehouse(
        center_id
    )

    # The CSV is the master source for total capacity.
    # Warehouse rows only store the changing physical stock.
    total_capacity = center_capacity

    if warehouse:
        current_stock = safe_float(
            warehouse.current_stock,
            0
        )
    else:
        current_stock = 0.0

    reserved_quantity = (
        get_reserved_quantity(
            center_id
        )
    )

    physical_available = max(
        total_capacity
        - current_stock,
        0
    )

    effective_available = max(
        total_capacity
        - current_stock
        - reserved_quantity,
        0
    )

    return {
        "warehouse":
            warehouse,

        "total_capacity":
            total_capacity,

        "current_stock":
            current_stock,

        "reserved_quantity":
            reserved_quantity,

        "physical_available":
            physical_available,

        "effective_available":
            effective_available
    }


# =========================================================
# OLD MANUAL WAREHOUSE CHECK
# PRESERVED
# =========================================================

@warehouse_bp.route(
    "/check",
    methods=["POST"]
)
def check_warehouse():

    data = request.get_json(
        silent=True
    ) or {}

    required_fields = [
        "total_capacity",
        "consumed_capacity",
        "procurement_quantity"
    ]

    missing_fields = [

        field

        for field in required_fields

        if field not in data

    ]

    if missing_fields:

        return jsonify({

            "success": False,

            "message":
                "Missing fields",

            "fields":
                missing_fields

        }), 400

    try:

        total_capacity = float(
            data["total_capacity"]
        )

        consumed_capacity = float(
            data["consumed_capacity"]
        )

        procurement_quantity = float(
            data["procurement_quantity"]
        )

        if total_capacity < 0:

            return jsonify({

                "success": False,

                "message":
                    "Total capacity cannot be negative"

            }), 400

        if consumed_capacity < 0:

            return jsonify({

                "success": False,

                "message":
                    "Consumed capacity cannot be negative"

            }), 400

        if procurement_quantity <= 0:

            return jsonify({

                "success": False,

                "message":
                    "Procurement quantity must be greater than 0"

            }), 400

        if consumed_capacity > total_capacity:

            return jsonify({

                "success": False,

                "message":
                    "Consumed capacity cannot exceed total capacity"

            }), 400

        available_capacity = (
            total_capacity
            -
            consumed_capacity
        )

        shortage = max(
            0,
            procurement_quantity
            -
            available_capacity
        )

        remaining_capacity = max(
            0,
            available_capacity
            -
            procurement_quantity
        )

        if (
            available_capacity
            >= procurement_quantity
        ):

            status = (
                "Sufficient Capacity"
            )

            recommendation = (
                "Selected warehouse has enough "
                "available capacity for this "
                "procurement quantity."
            )

            action = "ALLOCATE"

            reroute_required = False

        else:

            status = (
                "Insufficient Capacity"
            )

            recommendation = (
                "Find another procurement center "
                "with sufficient available capacity."
            )

            action = "REROUTE"

            reroute_required = True

        return jsonify({

            "success": True,

            "total_capacity":
                round(
                    total_capacity,
                    2
                ),

            "consumed_capacity":
                round(
                    consumed_capacity,
                    2
                ),

            "available_capacity":
                round(
                    available_capacity,
                    2
                ),

            "procurement_quantity":
                round(
                    procurement_quantity,
                    2
                ),

            "remaining_capacity":
                round(
                    remaining_capacity,
                    2
                ),

            "shortage":
                round(
                    shortage,
                    2
                ),

            "status":
                status,

            "action":
                action,

            "reroute_required":
                reroute_required,

            "recommendation":
                recommendation

        }), 200

    except (
        ValueError,
        TypeError
    ):

        return jsonify({

            "success": False,

            "message":
                "All capacity values must be numbers"

        }), 400


# =========================================================
# GET ALL CENTERS FOR DISTRICT
# =========================================================

@warehouse_bp.route(
    "/centers",
    methods=["GET"]
)
def get_district_centers():

    try:

        district = clean_text(
            request.args.get(
                "district"
            )
        )

        if not district:
            return jsonify({
                "success": False,
                "message":
                    "District is required."
            }), 400

        centers = (
            get_csv_centers_for_district(
                district
            )
        )

        result = []

        for _, center in centers.iterrows():

            capacity = get_center_capacity(
                center
            )

            total_capacity = (
                capacity[
                    "total_capacity"
                ]
            )

            effective_available = (
                capacity[
                    "effective_available"
                ]
            )

            if total_capacity <= 0:
                capacity_status = (
                    "Capacity Not Configured"
                )

            elif effective_available <= 0:
                capacity_status = "Full"

            elif (
                effective_available
                <= total_capacity * 0.20
            ):
                capacity_status = (
                    "Low Capacity"
                )

            else:
                capacity_status = (
                    "Available"
                )

            result.append({
                "center_id":
                    clean_text(
                        row_value(
                            center,
                            "center_id"
                        )
                    ),

                "center_name":
                    clean_text(
                        row_value(
                            center,
                            "center_name"
                        )
                    ),

                "district":
                    clean_text(
                        row_value(
                            center,
                            "district"
                        )
                    ),

                "mandal":
                    clean_text(
                        row_value(
                            center,
                            "mandal"
                        )
                    ),

                "location":
                    clean_text(
                        row_value(
                            center,
                            "location"
                        )
                    ),

                "pincode":
                    clean_text(
                        row_value(
                            center,
                            "pincode"
                        )
                    ),

                "total_capacity":
                    round(
                        total_capacity,
                        2
                    ),

                "current_stock":
                    round(
                        capacity[
                            "current_stock"
                        ],
                        2
                    ),

                "reserved_quantity":
                    round(
                        capacity[
                            "reserved_quantity"
                        ],
                        2
                    ),

                "appointment_reserved":
                    round(
                        capacity[
                            "reserved_quantity"
                        ],
                        2
                    ),

                "physical_available":
                    round(
                        capacity[
                            "physical_available"
                        ],
                        2
                    ),

                "available_capacity":
                    round(
                        effective_available,
                        2
                    ),

                "effective_available":
                    round(
                        effective_available,
                        2
                    ),

                "capacity_status":
                    capacity_status
            })

        return jsonify({
            "success": True,
            "district":
                district,
            "count":
                len(result),
            "centers":
                result
        }), 200

    except Exception as error:

        print(
            "WAREHOUSE CENTER ERROR:",
            str(error)
        )

        return jsonify({
            "success": False,
            "message":
                "Unable to load warehouse capacity.",
            "error":
                str(error)
        }), 500


# =========================================================
# DISTRICT-WISE WAREHOUSE CAPACITY
# =========================================================

@warehouse_bp.route(
    "/districts",
    methods=["GET"]
)
def get_district_capacity():

    try:

        centers = load_procurement_centers()

        district_map = {}

        center_district_map = {}

        for _, center in centers.iterrows():

            center_id = clean_text(
                row_value(
                    center,
                    "center_id"
                )
            )

            district = clean_text(
                row_value(
                    center,
                    "district"
                )
            )

            if not district:
                continue

            center_district_map[
                center_id
            ] = district

            if district not in district_map:
                district_map[district] = {
                    "district":
                        district,
                    "warehouse_count":
                        0,
                    "total_capacity":
                        0.0,
                    "current_stock":
                        0.0,
                    "reserved_capacity":
                        0.0,
                    "effective_available_capacity":
                        0.0,
                    "pending_quantity":
                        0.0,
                    "pending_requests":
                        0
                }

            capacity = get_center_capacity(
                center
            )

            item = district_map[
                district
            ]

            item[
                "warehouse_count"
            ] += 1

            item[
                "total_capacity"
            ] += safe_float(
                capacity[
                    "total_capacity"
                ]
            )

            item[
                "current_stock"
            ] += safe_float(
                capacity[
                    "current_stock"
                ]
            )

            item[
                "reserved_capacity"
            ] += safe_float(
                capacity[
                    "reserved_quantity"
                ]
            )

            item[
                "effective_available_capacity"
            ] += safe_float(
                capacity[
                    "effective_available"
                ]
            )

        # Pending appointments are shown for planning,
        # but they do not reserve capacity.
        try:

            pending_appointments = (
                Appointment.query
                .filter(
                    db.func.lower(
                        Appointment.status
                    ) == "pending"
                )
                .all()
            )

            for appointment in pending_appointments:

                appointment_center_id = (
                    clean_text(
                        getattr(
                            appointment,
                            "center_id",
                            ""
                        )
                    )
                )

                appointment_district = (
                    center_district_map.get(
                        appointment_center_id
                    )
                )

                if (
                    not appointment_district
                    or
                    appointment_district
                    not in district_map
                ):
                    continue

                pending_quantity = safe_float(
                    getattr(
                        appointment,
                        "reserved_quantity",
                        0
                    ),
                    0
                )

                district_map[
                    appointment_district
                ][
                    "pending_quantity"
                ] += pending_quantity

                district_map[
                    appointment_district
                ][
                    "pending_requests"
                ] += 1

        except Exception as pending_error:

            print(
                "PENDING APPOINTMENT SUMMARY ERROR:",
                str(pending_error)
            )

        districts = []

        total_capacity_all = 0.0
        current_stock_all = 0.0
        reserved_all = 0.0
        available_all = 0.0
        pending_all = 0.0

        for district in sorted(
            district_map.keys(),
            key=str.lower
        ):

            item = district_map[
                district
            ]

            total_capacity = safe_float(
                item[
                    "total_capacity"
                ]
            )

            current_stock = safe_float(
                item[
                    "current_stock"
                ]
            )

            reserved_capacity = safe_float(
                item[
                    "reserved_capacity"
                ]
            )

            available_capacity = safe_float(
                item[
                    "effective_available_capacity"
                ]
            )

            pending_quantity = safe_float(
                item[
                    "pending_quantity"
                ]
            )

            if total_capacity > 0:
                utilization_percentage = (
                    (
                        current_stock
                        + reserved_capacity
                    )
                    / total_capacity
                ) * 100
            else:
                utilization_percentage = 0.0

            if total_capacity <= 0:
                status = (
                    "Capacity Not Configured"
                )

            elif available_capacity <= 0:
                status = "Full"

            elif (
                available_capacity
                <= total_capacity * 0.20
            ):
                status = (
                    "High Utilization"
                )

            else:
                status = "Available"

            districts.append({
                "district":
                    district,
                "warehouse_count":
                    item[
                        "warehouse_count"
                    ],
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
                "effective_available_capacity":
                    round(
                        available_capacity,
                        2
                    ),
                "available_capacity":
                    round(
                        available_capacity,
                        2
                    ),
                "pending_quantity":
                    round(
                        pending_quantity,
                        2
                    ),
                "pending_requests":
                    item[
                        "pending_requests"
                    ],
                "utilization_percentage":
                    round(
                        utilization_percentage,
                        2
                    ),
                "status":
                    status
            })

            total_capacity_all += (
                total_capacity
            )

            current_stock_all += (
                current_stock
            )

            reserved_all += (
                reserved_capacity
            )

            available_all += (
                available_capacity
            )

            pending_all += (
                pending_quantity
            )

        return jsonify({
            "success": True,
            "districts":
                districts,
            "summary": {
                "district_count":
                    len(districts),
                "warehouse_count":
                    sum(
                        item[
                            "warehouse_count"
                        ]
                        for item
                        in districts
                    ),
                "total_capacity":
                    round(
                        total_capacity_all,
                        2
                    ),
                "current_stock":
                    round(
                        current_stock_all,
                        2
                    ),
                "reserved_capacity":
                    round(
                        reserved_all,
                        2
                    ),
                "available_capacity":
                    round(
                        available_all,
                        2
                    ),
                "pending_quantity":
                    round(
                        pending_all,
                        2
                    )
            }
        }), 200

    except Exception as error:

        print(
            "DISTRICT CAPACITY ERROR:",
            str(error)
        )

        return jsonify({
            "success": False,
            "message":
                "Unable to load district warehouse capacity.",
            "error":
                str(error)
        }), 500


# =========================================================
# PROCUREMENT CAPACITY PREDICTION / CHECK
# =========================================================

@warehouse_bp.route(
    "/predict",
    methods=["POST"]
)
def predict_warehouse_capacity():

    try:

        data = request.get_json(
            silent=True
        ) or {}

        district = clean_text(
            data.get(
                "district"
            )
        )

        quantity = safe_float(
            data.get(
                "quantity"
            ),
            0
        )

        if not district:
            return jsonify({
                "success": False,
                "message":
                    "District is required."
            }), 400

        if quantity <= 0:
            return jsonify({
                "success": False,
                "message":
                    "Procurement quantity must be greater than 0."
            }), 400

        centers = (
            get_csv_centers_for_district(
                district
            )
        )

        if centers.empty:
            return jsonify({
                "success": False,
                "message":
                    f"No procurement centers found for {district}."
            }), 404

        total_capacity = 0.0
        current_stock = 0.0
        reserved_capacity = 0.0
        available_capacity = 0.0

        for _, center in centers.iterrows():

            capacity = get_center_capacity(
                center
            )

            total_capacity += safe_float(
                capacity[
                    "total_capacity"
                ]
            )

            current_stock += safe_float(
                capacity[
                    "current_stock"
                ]
            )

            reserved_capacity += safe_float(
                capacity[
                    "reserved_quantity"
                ]
            )

            available_capacity += safe_float(
                capacity[
                    "effective_available"
                ]
            )

        can_accommodate = (
            available_capacity
            >= quantity
        )

        remaining_capacity = max(
            available_capacity
            - quantity,
            0
        )

        shortage = max(
            quantity
            - available_capacity,
            0
        )

        if can_accommodate:

            status = (
                "Sufficient Capacity"
            )

            recommendation = (
                "The district has sufficient effective "
                "warehouse capacity for the proposed procurement."
            )

        else:

            status = (
                "Insufficient Capacity"
            )

            recommendation = (
                "The proposed procurement quantity exceeds "
                "the district's effective available warehouse capacity."
            )

        return jsonify({
            "success": True,
            "district":
                district,
            "center_count":
                len(centers),
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
            "available_capacity":
                round(
                    available_capacity,
                    2
                ),
            "procurement_quantity":
                round(
                    quantity,
                    2
                ),
            "remaining_capacity":
                round(
                    remaining_capacity,
                    2
                ),
            "shortage":
                round(
                    shortage,
                    2
                ),
            "can_accommodate":
                can_accommodate,
            "status":
                status,
            "recommendation":
                recommendation
        }), 200

    except Exception as error:

        print(
            "WAREHOUSE PREDICTION ERROR:",
            str(error)
        )

        return jsonify({
            "success": False,
            "message":
                "Unable to check warehouse capacity.",
            "error":
                str(error)
        }), 500


# =========================================================
# RECORD / ADD PHYSICAL STOCK FOR A PROCUREMENT CENTER
# =========================================================

@warehouse_bp.route(
    "/center/<string:center_id>/stock",
    methods=["POST"]
)
def add_center_stock(center_id):

    try:

        data = request.get_json(
            silent=True
        ) or {}

        quantity = safe_float(
            data.get(
                "quantity"
            ),
            0
        )

        if quantity <= 0:
            return jsonify({
                "success": False,
                "message":
                    "Received quantity must be greater than 0."
            }), 400

        center = get_csv_center(
            center_id
        )

        if center is None:
            return jsonify({
                "success": False,
                "message":
                    "Procurement center not found."
            }), 404

        center_id = clean_text(
            row_value(
                center,
                "center_id"
            )
        )

        center_name = clean_text(
            row_value(
                center,
                "center_name"
            )
        )

        district = clean_text(
            row_value(
                center,
                "district"
            )
        )

        center_capacity = safe_float(
            row_value(
                center,
                "capacity_tons",
                0
            ),
            0
        )

        if center_capacity <= 0:
            return jsonify({
                "success": False,
                "message":
                    "Procurement center capacity is not configured."
            }), 400

        warehouse = get_center_warehouse(
            center_id
        )

        if warehouse is None:

            warehouse = Warehouse(
                warehouse_id=
                    center_id,
                center_id=
                    center_id,
                warehouse_name=(
                    center_name
                    or
                    f"Procurement Center {center_id}"
                ),
                district=
                    district,
                total_capacity=
                    center_capacity,
                current_stock=
                    0.0
            )

            db.session.add(
                warehouse
            )

            db.session.flush()

        # Keep DB copy synchronized with CSV master.
        warehouse.total_capacity = (
            center_capacity
        )

        warehouse.warehouse_name = (
            center_name
            or warehouse.warehouse_name
        )

        warehouse.district = (
            district
            or warehouse.district
        )

        current_stock = safe_float(
            warehouse.current_stock,
            0
        )

        new_stock = (
            current_stock
            + quantity
        )

        if new_stock > center_capacity:

            remaining_capacity = max(
                center_capacity
                - current_stock,
                0
            )

            db.session.rollback()

            return jsonify({
                "success": False,
                "message":
                    "Received quantity exceeds physical available capacity.",
                "current_stock":
                    round(
                        current_stock,
                        2
                    ),
                "physical_available_capacity":
                    round(
                        remaining_capacity,
                        2
                    )
            }), 400

        warehouse.current_stock = (
            new_stock
        )

        db.session.commit()

        capacity = get_center_capacity(
            center
        )

        return jsonify({
            "success": True,
            "message":
                "Physical procurement stock recorded successfully.",
            "center": {
                "center_id":
                    center_id,
                "center_name":
                    center_name,
                "district":
                    district,
                "total_capacity":
                    round(
                        capacity[
                            "total_capacity"
                        ],
                        2
                    ),
                "current_stock":
                    round(
                        capacity[
                            "current_stock"
                        ],
                        2
                    ),
                "reserved_quantity":
                    round(
                        capacity[
                            "reserved_quantity"
                        ],
                        2
                    ),
                "physical_available":
                    round(
                        capacity[
                            "physical_available"
                        ],
                        2
                    ),
                "available_capacity":
                    round(
                        capacity[
                            "effective_available"
                        ],
                        2
                    )
            }
        }), 200

    except Exception as error:

        db.session.rollback()

        print(
            "ADD CENTER STOCK ERROR:",
            str(error)
        )

        return jsonify({
            "success": False,
            "message":
                "Unable to record physical procurement stock.",
            "error":
                str(error)
        }), 500


# =========================================================
# SINGLE CENTER CAPACITY
# =========================================================

@warehouse_bp.route(
    "/center/<string:center_id>",
    methods=["GET"]
)
def get_single_center_capacity(
    center_id
):

    try:

        center = get_csv_center(
            center_id
        )

        if center is None:
            return jsonify({
                "success": False,
                "message":
                    "Procurement center not found."
            }), 404

        capacity = get_center_capacity(
            center
        )

        return jsonify({
            "success": True,
            "center": {
                "center_id":
                    clean_text(
                        row_value(
                            center,
                            "center_id"
                        )
                    ),
                "center_name":
                    clean_text(
                        row_value(
                            center,
                            "center_name"
                        )
                    ),
                "district":
                    clean_text(
                        row_value(
                            center,
                            "district"
                        )
                    ),
                "mandal":
                    clean_text(
                        row_value(
                            center,
                            "mandal"
                        )
                    ),
                "location":
                    clean_text(
                        row_value(
                            center,
                            "location"
                        )
                    ),
                "total_capacity":
                    round(
                        capacity[
                            "total_capacity"
                        ],
                        2
                    ),
                "current_stock":
                    round(
                        capacity[
                            "current_stock"
                        ],
                        2
                    ),
                "reserved_quantity":
                    round(
                        capacity[
                            "reserved_quantity"
                        ],
                        2
                    ),
                "available_capacity":
                    round(
                        capacity[
                            "effective_available"
                        ],
                        2
                    )
            }
        }), 200

    except Exception as error:

        print(
            "CENTER CAPACITY ERROR:",
            str(error)
        )

        return jsonify({
            "success": False,
            "message":
                "Unable to load center capacity.",
            "error":
                str(error)
        }), 500
