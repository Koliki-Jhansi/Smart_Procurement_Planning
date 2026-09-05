from flask import Blueprint, request, jsonify

warehouse_bp = Blueprint(
    "warehouse",
    __name__,
    url_prefix="/api/warehouse"
)


@warehouse_bp.route("/check", methods=["POST"])
def check_warehouse():

    data = request.get_json()

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
            "message": "Missing fields",
            "fields": missing_fields
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
                "message": "Total capacity cannot be negative"
            }), 400

        if consumed_capacity < 0:
            return jsonify({
                "success": False,
                "message": "Consumed capacity cannot be negative"
            }), 400

        if procurement_quantity < 0:
            return jsonify({
                "success": False,
                "message": "Procurement quantity cannot be negative"
            }), 400

        if consumed_capacity > total_capacity:
            return jsonify({
                "success": False,
                "message": "Consumed capacity cannot exceed total capacity"
            }), 400

        available_capacity = (
            total_capacity - consumed_capacity
        )

        remaining_capacity = (
            available_capacity - procurement_quantity
        )

        if remaining_capacity >= 0:
            status = "Sufficient Capacity"
        else:
            status = "Insufficient Capacity"

        return jsonify({
            "success": True,
            "total_capacity": total_capacity,
            "consumed_capacity": consumed_capacity,
            "available_capacity": available_capacity,
            "procurement_quantity": procurement_quantity,
            "remaining_capacity": remaining_capacity,
            "status": status
        })

    except (ValueError, TypeError):

        return jsonify({
            "success": False,
            "message": "All capacity values must be numbers"
        }), 400