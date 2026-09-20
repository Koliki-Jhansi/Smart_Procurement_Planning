from flask import Blueprint, jsonify, request
import os
import pandas as pd

from extensions import db
from models.notification import Notification
from models.procurement_request import ProcurementRequest
from models.appointment import Appointment
from models.warehouse import Warehouse


procurement_request_bp = Blueprint(
    "procurement_request",
    __name__,
    url_prefix="/api/procurement-requests"
)


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


def clean_text(value):
    if value is None:
        return ""
    return str(value).strip()


def safe_float(value, default=0.0):
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def load_procurement_centers():
    if not os.path.exists(PROCUREMENT_CENTERS_CSV):
        raise FileNotFoundError(
            f"Procurement centers CSV not found: {PROCUREMENT_CENTERS_CSV}"
        )

    df = pd.read_csv(PROCUREMENT_CENTERS_CSV)

    df.columns = [
        str(column).strip().lower()
        for column in df.columns
    ]

    required = {
        "center_id",
        "center_name",
        "district",
        "capacity_tons"
    }

    missing = required.difference(
        df.columns
    )

    if missing:
        raise ValueError(
            "Missing procurement-center CSV columns: "
            + ", ".join(sorted(missing))
        )

    return df.fillna("")


def get_csv_center(center_id):
    wanted = clean_text(center_id).lower()

    if not wanted:
        return None

    df = load_procurement_centers()

    matches = df[
        df["center_id"]
        .astype(str)
        .str.strip()
        .str.lower()
        == wanted
    ]

    if matches.empty:
        return None

    return matches.iloc[0]


def get_warehouse(center_id):
    center_id = clean_text(center_id)

    warehouse = (
        Warehouse.query
        .filter_by(center_id=center_id)
        .first()
    )

    if warehouse:
        return warehouse

    return (
        Warehouse.query
        .filter_by(warehouse_id=center_id)
        .first()
    )


def get_reserved_quantity(center_id):
    return safe_float(
        (
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
                == clean_text(center_id),

                db.func.lower(
                    Appointment.status
                ).in_([
                    "booked",
                    "completion_requested"
                ])
            )
            .scalar()
        ),
        0
    )


# =========================================================
# CREATE PROCUREMENT REQUEST
# =========================================================

@procurement_request_bp.route("", methods=["POST"])
def create_procurement_request():
    try:
        data = request.get_json(silent=True) or {}

        if not data:
            return jsonify({
                "success": False,
                "message": "Request data is required."
            }), 400

        farmer_id = (
            data.get("farmer_id")
            or data.get("user_id")
            or data.get("id")
        )

        farmer_name = (
            data.get("farmer_name")
            or data.get("full_name")
            or data.get("name")
            or ""
        )

        mobile_number = (
            data.get("mobile_number")
            or data.get("mobile")
            or data.get("phone")
            or ""
        )

        district = (
            data.get("district")
            or data.get("District")
            or ""
        )

        center_id = (
            data.get("center_id")
            or data.get("procurement_center_id")
            or data.get("centerId")
            or ""
        )

        center_name = (
            data.get("center_name")
            or data.get("procurement_center_name")
            or data.get("name")
            or ""
        )

        center_district = (
            data.get("center_district")
            or data.get("procurement_center_district")
            or district
            or ""
        )

        center_location = (
            data.get("center_location")
            or data.get("location")
            or data.get("center_address")
            or ""
        )

        crop = (
            data.get("crop")
            or data.get("crop_name")
            or data.get("Crop")
            or ""
        )

        quantity = data.get("quantity")

        distance_km = (
            data.get("distance_km")
            if data.get("distance_km") is not None
            else data.get("distance")
        )

        if distance_km is None:
            distance_km = 0

        vehicle = (
            data.get("vehicle")
            or data.get("vehicle_name")
            or ""
        )

        transport_cost = (
            data.get("transport_cost")
            if data.get("transport_cost") is not None
            else data.get("total_cost")
        )

        if transport_cost is None:
            transport_cost = 0

        total_cost = (
            data.get("total_cost")
            if data.get("total_cost") is not None
            else transport_cost
        )

        if not farmer_id:
            return jsonify({
                "success": False,
                "message": "Farmer ID is required."
            }), 400

        if not farmer_name:
            return jsonify({
                "success": False,
                "message": "Farmer name is required."
            }), 400

        if not center_id:
            return jsonify({
                "success": False,
                "message": "Procurement center ID is required."
            }), 400

        if not center_name:
            return jsonify({
                "success": False,
                "message": "Procurement center is required."
            }), 400

        if not crop:
            return jsonify({
                "success": False,
                "message": "Crop is required."
            }), 400

        if quantity is None or quantity == "":
            return jsonify({
                "success": False,
                "message": "Quantity is required."
            }), 400

        try:
            farmer_id = int(farmer_id)
            quantity = float(quantity)
            distance_km = float(distance_km)
            transport_cost = float(transport_cost)
            total_cost = float(total_cost)

        except (ValueError, TypeError):
            return jsonify({
                "success": False,
                "message": "Invalid numeric data provided."
            }), 400

        if quantity <= 0:
            return jsonify({
                "success": False,
                "message":
                    "Quantity must be greater than zero."
            }), 400

        center = get_csv_center(center_id)

        if center is None:
            return jsonify({
                "success": False,
                "message":
                    "Selected procurement center is not present in the master CSV."
            }), 404

        # Use master CSV identity/capacity data.
        center_id = clean_text(center["center_id"])
        center_name = (
            clean_text(center["center_name"])
            or center_name
        )
        center_district = (
            clean_text(center["district"])
            or center_district
        )

        new_request = ProcurementRequest(
            farmer_id=farmer_id,
            farmer_name=str(farmer_name),
            mobile_number=str(mobile_number),
            district=str(district),
            center_id=str(center_id),
            center_name=str(center_name),
            center_district=str(center_district),
            center_location=str(center_location),
            crop=str(crop),
            quantity=quantity,
            distance_km=distance_km,
            vehicle=str(vehicle),
            transport_cost=transport_cost,
            total_cost=total_cost,
            status="pending"
        )

        db.session.add(new_request)
        db.session.commit()

        return jsonify({
            "success": True,
            "message":
                "Procurement request sent successfully to the Government.",
            "request": new_request.to_dict()
        }), 201

    except Exception as error:
        db.session.rollback()

        return jsonify({
            "success": False,
            "message":
                "Unable to create procurement request.",
            "error": str(error)
        }), 500


# =========================================================
# GOVERNMENT - ALL REQUESTS
# =========================================================

@procurement_request_bp.route("", methods=["GET"])
def get_procurement_requests():
    try:
        procurement_requests = (
            ProcurementRequest.query
            .order_by(
                ProcurementRequest.created_at.desc()
            )
            .all()
        )

        return jsonify({
            "success": True,
            "count": len(procurement_requests),
            "requests": [
                item.to_dict()
                for item in procurement_requests
            ]
        }), 200

    except Exception as error:
        return jsonify({
            "success": False,
            "message":
                "Unable to load procurement requests.",
            "error": str(error)
        }), 500


# =========================================================
# FARMER - OWN REQUESTS
# =========================================================

@procurement_request_bp.route(
    "/farmer/<int:farmer_id>",
    methods=["GET"]
)
def get_farmer_requests(farmer_id):
    try:
        procurement_requests = (
            ProcurementRequest.query
            .filter_by(farmer_id=farmer_id)
            .order_by(
                ProcurementRequest.created_at.desc()
            )
            .all()
        )

        return jsonify({
            "success": True,
            "count": len(procurement_requests),
            "requests": [
                item.to_dict()
                for item in procurement_requests
            ]
        }), 200

    except Exception as error:
        return jsonify({
            "success": False,
            "message":
                "Unable to load farmer requests.",
            "error": str(error)
        }), 500


@procurement_request_bp.route(
    "/<int:request_id>",
    methods=["GET"]
)
def get_single_procurement_request(request_id):
    try:
        procurement_request = db.session.get(
            ProcurementRequest,
            request_id
        )

        if not procurement_request:
            return jsonify({
                "success": False,
                "message":
                    "Procurement request not found."
            }), 404

        return jsonify({
            "success": True,
            "request":
                procurement_request.to_dict()
        }), 200

    except Exception as error:
        return jsonify({
            "success": False,
            "message":
                "Unable to load procurement request.",
            "error": str(error)
        }), 500


# =========================================================
# GOVERNMENT APPROVE / REJECT
# Approval creates appointment and reserves capacity.
# =========================================================

@procurement_request_bp.route(
    "/<int:request_id>/status",
    methods=["PUT"]
)
def update_procurement_request_status(request_id):
    try:
        data = request.get_json(silent=True) or {}

        new_status = clean_text(
            data.get("status")
        ).lower()

        status_mapping = {
            "accepted": "approved",
            "accept": "approved",
            "approved": "approved",
            "approve": "approved",
            "reject": "rejected",
            "rejected": "rejected",
            "pending": "pending"
        }

        if new_status not in status_mapping:
            return jsonify({
                "success": False,
                "message":
                    "Invalid status. Use pending, approved or rejected."
            }), 400

        final_status = status_mapping[new_status]

        procurement_request = db.session.get(
            ProcurementRequest,
            request_id
        )

        if not procurement_request:
            return jsonify({
                "success": False,
                "message":
                    "Procurement request not found."
            }), 404

        old_status = clean_text(
            procurement_request.status
        ).lower()

        if old_status == "completed":
            return jsonify({
                "success": False,
                "message":
                    "Completed procurement cannot be changed."
            }), 400

        # ---------------------------------------------
        # APPROVAL
        # ---------------------------------------------
        if final_status == "approved":
            if old_status not in ("pending", "approved"):
                return jsonify({
                    "success": False,
                    "message":
                        "Only pending requests can be approved."
                }), 400

            appointment_date = clean_text(
                data.get("appointment_date")
            )

            appointment_time = clean_text(
                data.get("appointment_time")
            )

            if not appointment_date:
                return jsonify({
                    "success": False,
                    "message":
                        "Appointment date is required for approval."
                }), 400

            if not appointment_time:
                return jsonify({
                    "success": False,
                    "message":
                        "Appointment time is required for approval."
                }), 400

            center = get_csv_center(
                procurement_request.center_id
            )

            if center is None:
                return jsonify({
                    "success": False,
                    "message":
                        "Selected procurement center is not present in the master CSV."
                }), 404

            center_id = clean_text(
                center["center_id"]
            )
            center_name = clean_text(
                center["center_name"]
            )
            district = clean_text(
                center["district"]
            )
            total_capacity = safe_float(
                center["capacity_tons"],
                0
            )

            if total_capacity <= 0:
                return jsonify({
                    "success": False,
                    "message":
                        "Procurement center capacity is not configured."
                }), 400

            warehouse = get_warehouse(
                center_id
            )

            if warehouse is None:
                warehouse = Warehouse(
                    warehouse_id=center_id,
                    center_id=center_id,
                    warehouse_name=(
                        center_name
                        or f"Procurement Center {center_id}"
                    ),
                    district=district,
                    total_capacity=total_capacity,
                    current_stock=0
                )

                db.session.add(warehouse)
                db.session.flush()

            # CSV remains authoritative for total capacity.
            warehouse.total_capacity = total_capacity
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

            existing_appointment = (
                Appointment.query
                .filter_by(
                    procurement_request_id=
                        procurement_request.id
                )
                .first()
            )

            # If this request already has an active appointment,
            # exclude its own reservation when re-validating.
            reserved_query = (
                db.session.query(
                    db.func.coalesce(
                        db.func.sum(
                            Appointment.reserved_quantity
                        ),
                        0
                    )
                )
                .filter(
                    Appointment.center_id == center_id,
                    db.func.lower(
                        Appointment.status
                    ).in_([
                        "booked",
                        "completion_requested"
                    ])
                )
            )

            if existing_appointment:
                reserved_query = reserved_query.filter(
                    Appointment.id
                    != existing_appointment.id
                )

            other_reserved = safe_float(
                reserved_query.scalar(),
                0
            )

            available = max(
                total_capacity
                - current_stock
                - other_reserved,
                0
            )

            requested_quantity = safe_float(
                procurement_request.quantity,
                0
            )

            if requested_quantity <= 0:
                return jsonify({
                    "success": False,
                    "message":
                        "Request quantity is invalid."
                }), 400

            if requested_quantity > available:
                return jsonify({
                    "success": False,
                    "message":
                        "Insufficient warehouse capacity for this request.",
                    "requested_quantity":
                        requested_quantity,
                    "total_capacity":
                        total_capacity,
                    "current_stock":
                        current_stock,
                    "reserved_capacity":
                        other_reserved,
                    "available_capacity":
                        available
                }), 400

            if existing_appointment:
                if (
                    clean_text(
                        existing_appointment.status
                    ).lower()
                    == "completed"
                ):
                    return jsonify({
                        "success": False,
                        "message":
                            "This procurement is already completed."
                    }), 400

                existing_appointment.farmer_id = (
                    procurement_request.farmer_id
                )
                existing_appointment.farmer_name = (
                    procurement_request.farmer_name
                )
                existing_appointment.center_id = center_id
                existing_appointment.center_name = (
                    center_name
                    or procurement_request.center_name
                )
                existing_appointment.crop = (
                    procurement_request.crop
                )
                existing_appointment.reserved_quantity = (
                    requested_quantity
                )
                existing_appointment.appointment_date = (
                    appointment_date
                )
                existing_appointment.appointment_time = (
                    appointment_time
                )
                existing_appointment.status = "booked"

                appointment = existing_appointment

            else:
                appointment = Appointment(
                    procurement_request_id=
                        procurement_request.id,
                    farmer_id=
                        procurement_request.farmer_id,
                    farmer_name=
                        procurement_request.farmer_name,
                    center_id=center_id,
                    center_name=(
                        center_name
                        or procurement_request.center_name
                    ),
                    crop=procurement_request.crop,
                    reserved_quantity=
                        requested_quantity,
                    appointment_date=
                        appointment_date,
                    appointment_time=
                        appointment_time,
                    status="booked"
                )

                db.session.add(appointment)

            procurement_request.status = "approved"

            if old_status != "approved":
                db.session.add(
                    Notification(
                        farmer_id=
                            procurement_request.farmer_id,
                        procurement_request_id=
                            procurement_request.id,
                        title=
                            "Procurement request approved",
                        message=(
                            f"Your {procurement_request.crop} request "
                            f"for {requested_quantity:.2f} tons at "
                            f"{center_name or procurement_request.center_name} "
                            f"was approved. Appointment: "
                            f"{appointment_date} at {appointment_time}."
                        ),
                        status="approved"
                    )
                )

            db.session.commit()

            return jsonify({
                "success": True,
                "message":
                    "Request approved, appointment booked and warehouse capacity reserved.",
                "request":
                    procurement_request.to_dict(),
                "appointment":
                    appointment.to_dict(),
                "capacity": {
                    "total_capacity":
                        total_capacity,
                    "current_stock":
                        current_stock,
                    "other_reserved":
                        other_reserved,
                    "new_reservation":
                        requested_quantity,
                    "available_after_approval":
                        max(
                            available
                            - requested_quantity,
                            0
                        )
                }
            }), 200

        # ---------------------------------------------
        # REJECTION
        # ---------------------------------------------
        if final_status == "rejected":
            if old_status != "pending":
                return jsonify({
                    "success": False,
                    "message":
                        "Only pending requests can be rejected."
                }), 400

            procurement_request.status = "rejected"

            db.session.add(
                Notification(
                    farmer_id=
                        procurement_request.farmer_id,
                    procurement_request_id=
                        procurement_request.id,
                    title=
                        "Procurement request rejected",
                    message=(
                        f"Your {procurement_request.crop} request "
                        f"for {procurement_request.quantity} tons at "
                        f"{procurement_request.center_name} was rejected."
                    ),
                    status="rejected"
                )
            )

            db.session.commit()

            return jsonify({
                "success": True,
                "message":
                    "Request rejected successfully.",
                "request":
                    procurement_request.to_dict()
            }), 200

        procurement_request.status = "pending"
        db.session.commit()

        return jsonify({
            "success": True,
            "message":
                "Request status updated successfully.",
            "request":
                procurement_request.to_dict()
        }), 200

    except Exception as error:
        db.session.rollback()

        return jsonify({
            "success": False,
            "message":
                "Unable to update request status.",
            "error": str(error)
        }), 500
