from flask import Blueprint, jsonify, request

from extensions import db
from models.notification import Notification
from models.procurement_request import ProcurementRequest


# =========================================================
# BLUEPRINT
# =========================================================

procurement_request_bp = Blueprint(
    "procurement_request",
    __name__,
    url_prefix="/api/procurement-requests"
)


# =========================================================
# CREATE PROCUREMENT REQUEST
# =========================================================

@procurement_request_bp.route(
    "",
    methods=["POST"]
)
def create_procurement_request():

    try:

        data = request.get_json(
            silent=True
        ) or {}


        if not data:

            return jsonify({

                "success": False,

                "message":
                    "Request data is required."

            }), 400


        print("=" * 50)
        print("PROCUREMENT REQUEST RECEIVED")
        print(data)
        print("=" * 50)


        # =================================================
        # FARMER DETAILS
        # =================================================

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


        # =================================================
        # PROCUREMENT CENTER
        # =================================================

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


        # =================================================
        # CROP
        # =================================================

        crop = (

            data.get("crop")

            or data.get("crop_name")

            or data.get("Crop")

            or ""

        )


        quantity = data.get(
            "quantity"
        )


        # =================================================
        # TRANSPORT
        # =================================================

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


        # =================================================
        # VALIDATION
        # =================================================

        if not farmer_id:

            return jsonify({

                "success": False,

                "message":
                    "Farmer ID is required."

            }), 400


        if not farmer_name:

            return jsonify({

                "success": False,

                "message":
                    "Farmer name is required."

            }), 400


        if not center_name:

            return jsonify({

                "success": False,

                "message":
                    "Procurement center is required."

            }), 400


        if not crop:

            return jsonify({

                "success": False,

                "message":
                    "Crop is required."

            }), 400


        if quantity is None or quantity == "":

            return jsonify({

                "success": False,

                "message":
                    "Quantity is required."

            }), 400


        # =================================================
        # CONVERT VALUES
        # =================================================

        try:

            farmer_id = int(
                farmer_id
            )


            quantity = float(
                quantity
            )


            distance_km = float(
                distance_km
            )


            transport_cost = float(
                transport_cost
            )


            total_cost = float(
                total_cost
            )


        except (
            ValueError,
            TypeError
        ):

            return jsonify({

                "success": False,

                "message":
                    "Invalid numeric data provided."

            }), 400


        if quantity <= 0:

            return jsonify({

                "success": False,

                "message":
                    "Quantity must be greater than zero."

            }), 400


        # =================================================
        # CREATE DATABASE RECORD
        # =================================================

        new_request = ProcurementRequest(

            farmer_id=farmer_id,

            farmer_name=str(
                farmer_name
            ),

            mobile_number=str(
                mobile_number
            ),

            district=str(
                district
            ),

            center_id=str(
                center_id
            ),

            center_name=str(
                center_name
            ),

            center_district=str(
                center_district
            ),

            center_location=str(
                center_location
            ),

            crop=str(
                crop
            ),

            quantity=quantity,

            distance_km=distance_km,

            vehicle=str(
                vehicle
            ),

            transport_cost=transport_cost,

            total_cost=total_cost,

            status="pending"

        )


        # =================================================
        # SAVE
        # =================================================

        db.session.add(
            new_request
        )


        db.session.commit()


        print("=" * 50)
        print(
            "PROCUREMENT REQUEST CREATED:",
            new_request.id
        )
        print("=" * 50)


        return jsonify({

            "success": True,

            "message":
                "Procurement request sent successfully to the Government.",

            "request":
                new_request.to_dict()

        }), 201


    except Exception as error:


        db.session.rollback()


        print(
            "PROCUREMENT REQUEST ERROR:",
            str(error)
        )


        return jsonify({

            "success": False,

            "message":
                "Unable to create procurement request.",

            "error":
                str(error)

        }), 500


# =========================================================
# GET ALL PROCUREMENT REQUESTS
# GOVERNMENT DASHBOARD
# =========================================================

@procurement_request_bp.route(
    "",
    methods=["GET"]
)
def get_procurement_requests():

    try:


        procurement_requests = (

            ProcurementRequest.query

            .order_by(
                ProcurementRequest.created_at.desc()
            )

            .all()

        )


        request_list = [

            procurement_request.to_dict()

            for procurement_request

            in procurement_requests

        ]


        return jsonify({

            "success": True,

            "count":
                len(request_list),

            "requests":
                request_list

        }), 200


    except Exception as error:


        print(
            "LOAD PROCUREMENT REQUESTS ERROR:",
            str(error)
        )


        return jsonify({

            "success": False,

            "message":
                "Unable to load procurement requests.",

            "error":
                str(error)

        }), 500


# =========================================================
# GET REQUESTS FOR ONE FARMER
# =========================================================

@procurement_request_bp.route(
    "/farmer/<int:farmer_id>",
    methods=["GET"]
)
def get_farmer_requests(farmer_id):

    try:


        procurement_requests = (

            ProcurementRequest.query

            .filter_by(
                farmer_id=farmer_id
            )

            .order_by(
                ProcurementRequest.created_at.desc()
            )

            .all()

        )


        return jsonify({

            "success": True,

            "count":
                len(procurement_requests),

            "requests": [

                procurement_request.to_dict()

                for procurement_request

                in procurement_requests

            ]

        }), 200


    except Exception as error:


        print(
            "LOAD FARMER REQUESTS ERROR:",
            str(error)
        )


        return jsonify({

            "success": False,

            "message":
                "Unable to load farmer requests.",

            "error":
                str(error)

        }), 500


# =========================================================
# GET SINGLE REQUEST
# =========================================================

@procurement_request_bp.route(
    "/<int:request_id>",
    methods=["GET"]
)
def get_single_procurement_request(request_id):

    try:


        procurement_request = (

            db.session.get(

                ProcurementRequest,

                request_id

            )

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


        print(
            "GET PROCUREMENT REQUEST ERROR:",
            str(error)
        )


        return jsonify({

            "success": False,

            "message":
                "Unable to load procurement request.",

            "error":
                str(error)

        }), 500


# =========================================================
# UPDATE PROCUREMENT REQUEST STATUS
# =========================================================

@procurement_request_bp.route(
    "/<int:request_id>/status",
    methods=["PUT"]
)
def update_procurement_request_status(request_id):

    try:


        data = request.get_json(
            silent=True
        ) or {}


        new_status = (

            data.get("status")

            or ""

        ).strip().lower()


        # =================================================
        # ACCEPT BOTH APPROVED AND ACCEPTED
        # =================================================

        status_mapping = {

            "accepted":
                "approved",

            "accept":
                "approved",

            "approved":
                "approved",

            "approve":
                "approved",

            "reject":
                "rejected",

            "rejected":
                "rejected",

            "pending":
                "pending"

        }


        if new_status not in status_mapping:

            return jsonify({

                "success": False,

                "message":
                    "Invalid status. Use pending, approved/accepted or rejected."

            }), 400


        final_status = (

            status_mapping[
                new_status
            ]

        )


        # =================================================
        # FIND REQUEST
        # =================================================

        procurement_request = (

            db.session.get(

                ProcurementRequest,

                request_id

            )

        )


        if not procurement_request:

            return jsonify({

                "success": False,

                "message":
                    "Procurement request not found."

            }), 404


        # =================================================
        # UPDATE
        # =================================================

        old_status = (

            procurement_request.status

        )


        procurement_request.status = (

            final_status

        )


        if (
            final_status in ["approved", "rejected"]
            and final_status != old_status
        ):

            if final_status == "approved":

                title = "Procurement request approved"

                message = (
                    f"Your {procurement_request.crop} request "
                    f"for {procurement_request.quantity} tons "
                    f"at {procurement_request.center_name} was approved."
                )

            else:

                title = "Procurement request rejected"

                message = (
                    f"Your {procurement_request.crop} request "
                    f"for {procurement_request.quantity} tons "
                    f"at {procurement_request.center_name} was rejected."
                )


            db.session.add(
                Notification(
                    farmer_id=procurement_request.farmer_id,
                    procurement_request_id=procurement_request.id,
                    title=title,
                    message=message,
                    status=final_status
                )
            )


        db.session.commit()


        print("=" * 50)
        print(
            "REQUEST STATUS UPDATED"
        )
        print(
            "Request ID:",
            request_id
        )
        print(
            "Old Status:",
            old_status
        )
        print(
            "New Status:",
            final_status
        )
        print("=" * 50)


        return jsonify({

            "success": True,

            "message":
                f"Request {final_status} successfully.",

            "request":
                procurement_request.to_dict()

        }), 200


    except Exception as error:


        db.session.rollback()


        print(
            "STATUS UPDATE ERROR:",
            str(error)
        )


        return jsonify({

            "success": False,

            "message":
                "Unable to update request status.",

            "error":
                str(error)

        }), 500
