from datetime import datetime
import os
import pandas as pd

from flask import Blueprint, jsonify, request

from extensions import db
from models.appointment import Appointment
from models.procurement_request import ProcurementRequest
from models.warehouse import Warehouse
from models.notification import Notification


appointment_bp = Blueprint(
    "appointments",
    __name__,
    url_prefix="/api/appointments"
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

    missing = required.difference(df.columns)

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


def active_reservations(center_id, exclude_appointment_id=None):
    query = (
        db.session.query(
            db.func.coalesce(
                db.func.sum(Appointment.reserved_quantity),
                0
            )
        )
        .filter(
            Appointment.center_id == clean_text(center_id),
            db.func.lower(Appointment.status).in_([
                "booked",
                "accepted",
                "completion_requested"
            ])
        )
    )

    if exclude_appointment_id is not None:
        query = query.filter(
            Appointment.id != exclude_appointment_id
        )

    return safe_float(query.scalar(), 0)


@appointment_bp.route(
    "/farmer/<int:farmer_id>",
    methods=["GET"]
)
def farmer_appointments(farmer_id):
    try:
        appointments = (
            Appointment.query
            .filter_by(farmer_id=farmer_id)
            .order_by(Appointment.created_at.desc())
            .all()
        )

        return jsonify({
            "success": True,
            "appointments": [
                appointment.to_dict()
                for appointment in appointments
            ]
        }), 200

    except Exception as error:
        return jsonify({
            "success": False,
            "message": "Unable to load appointments.",
            "error": str(error)
        }), 500


@appointment_bp.route("", methods=["GET"])
def all_appointments():
    try:
        status = clean_text(
            request.args.get("status")
        ).lower()

        query = Appointment.query

        if status:
            query = query.filter(
                db.func.lower(Appointment.status)
                == status
            )

        appointments = (
            query
            .order_by(Appointment.created_at.desc())
            .all()
        )

        return jsonify({
            "success": True,
            "appointments": [
                appointment.to_dict()
                for appointment in appointments
            ]
        }), 200

    except Exception as error:
        return jsonify({
            "success": False,
            "message": "Unable to load appointments.",
            "error": str(error)
        }), 500


@appointment_bp.route(
    "/completion-requests",
    methods=["GET"]
)
def completion_requests():
    try:
        appointments = (
            Appointment.query
            .filter(
                db.func.lower(Appointment.status)
                == "completion_requested"
            )
            .order_by(
                Appointment.farmer_completed_at.desc()
            )
            .all()
        )

        return jsonify({
            "success": True,
            "appointments": [
                appointment.to_dict()
                for appointment in appointments
            ]
        }), 200

    except Exception as error:
        return jsonify({
            "success": False,
            "message":
                "Unable to load procurement completion requests.",
            "error": str(error)
        }), 500


@appointment_bp.route(
    "/<int:appointment_id>/accept",
    methods=["PUT"]
)
def accept_appointment(appointment_id):
    try:
        appointment = db.session.get(
            Appointment,
            appointment_id
        )

        if not appointment:
            return jsonify({
                "success": False,
                "message": "Appointment not found."
            }), 404

        current_status = clean_text(
            appointment.status
        ).lower()

        if current_status == "accepted":
            return jsonify({
                "success": True,
                "message": "Appointment is already accepted.",
                "appointment": appointment.to_dict()
            }), 200

        if current_status not in ["booked", "scheduled"]:
            return jsonify({
                "success": False,
                "message":
                    "Only a Government-scheduled appointment can be accepted."
            }), 400

        appointment.status = "accepted"

        db.session.add(
            Notification(
                farmer_id=appointment.farmer_id,
                procurement_request_id=
                    appointment.procurement_request_id,
                title="Appointment accepted",
                message=(
                    f"You accepted the procurement appointment at "
                    f"{appointment.center_name} on "
                    f"{appointment.appointment_date} "
                    f"{appointment.appointment_time}."
                ),
                status="accepted"
            )
        )

        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Appointment accepted successfully.",
            "appointment": appointment.to_dict()
        }), 200

    except Exception as error:
        db.session.rollback()

        return jsonify({
            "success": False,
            "message": "Unable to accept appointment.",
            "error": str(error)
        }), 500


@appointment_bp.route(
    "/<int:appointment_id>/farmer-completed",
    methods=["PUT"]
)
def farmer_completed(appointment_id):
    try:
        appointment = db.session.get(
            Appointment,
            appointment_id
        )

        if not appointment:
            return jsonify({
                "success": False,
                "message": "Appointment not found."
            }), 404

        if clean_text(appointment.status).lower() != "accepted":
            return jsonify({
                "success": False,
                "message":
                    "Accept the appointment before marking procurement completed."
            }), 400

        appointment.status = "completion_requested"
        appointment.farmer_completed_at = datetime.utcnow()

        db.session.commit()

        return jsonify({
            "success": True,
            "message":
                "Procurement completion sent to Government for verification.",
            "appointment": appointment.to_dict()
        }), 200

    except Exception as error:
        db.session.rollback()

        return jsonify({
            "success": False,
            "message":
                "Unable to send procurement completion.",
            "error": str(error)
        }), 500


@appointment_bp.route(
    "/<int:appointment_id>/confirm",
    methods=["PUT"]
)
def confirm_procurement(appointment_id):
    try:
        data = request.get_json(silent=True) or {}

        actual_quantity = safe_float(
            data.get("actual_received_quantity"),
            -1
        )

        if actual_quantity <= 0:
            return jsonify({
                "success": False,
                "message":
                    "Actual received quantity must be greater than zero."
            }), 400

        appointment = db.session.get(
            Appointment,
            appointment_id
        )

        if not appointment:
            return jsonify({
                "success": False,
                "message": "Appointment not found."
            }), 404

        if (
            clean_text(appointment.status).lower()
            != "completion_requested"
        ):
            return jsonify({
                "success": False,
                "message":
                    "This appointment is not waiting for Government confirmation."
            }), 400

        center = get_csv_center(
            appointment.center_id
        )

        if center is None:
            return jsonify({
                "success": False,
                "message":
                    "Procurement center not found in the master CSV."
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

        # CSV is authoritative for physical capacity.
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

        other_reserved = active_reservations(
            center_id,
            exclude_appointment_id=appointment.id
        )

        maximum_receivable = max(
            total_capacity
            - current_stock
            - other_reserved,
            0
        )

        if actual_quantity > maximum_receivable:
            return jsonify({
                "success": False,
                "message":
                    "Insufficient warehouse capacity for the actual received quantity.",
                "total_capacity": total_capacity,
                "current_stock": current_stock,
                "other_reserved": other_reserved,
                "maximum_receivable": maximum_receivable
            }), 400

        warehouse.current_stock = (
            current_stock
            + actual_quantity
        )

        appointment.actual_received_quantity = (
            actual_quantity
        )
        appointment.status = "completed"
        appointment.completed_at = datetime.utcnow()

        procurement_request = db.session.get(
            ProcurementRequest,
            appointment.procurement_request_id
        )

        if procurement_request:
            procurement_request.status = "completed"

        db.session.add(
            Notification(
                farmer_id=appointment.farmer_id,
                procurement_request_id=
                    appointment.procurement_request_id,
                title="Procurement completed",
                message=(
                    f"Government confirmed {actual_quantity:.2f} tons "
                    f"of {appointment.crop} at "
                    f"{appointment.center_name}."
                ),
                status="completed"
            )
        )

        db.session.commit()

        available = max(
            total_capacity
            - safe_float(warehouse.current_stock)
            - other_reserved,
            0
        )

        return jsonify({
            "success": True,
            "message":
                "Procurement confirmed. Warehouse stock and available capacity were updated.",
            "appointment": appointment.to_dict(),
            "warehouse": {
                "center_id": center_id,
                "center_name": center_name,
                "district": district,
                "total_capacity": total_capacity,
                "current_stock":
                    safe_float(warehouse.current_stock),
                "reserved_capacity":
                    other_reserved,
                "available_capacity":
                    available
            }
        }), 200

    except Exception as error:
        db.session.rollback()

        return jsonify({
            "success": False,
            "message":
                "Unable to confirm procurement.",
            "error": str(error)
        }), 500
