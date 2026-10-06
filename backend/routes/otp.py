from flask import Blueprint, request, jsonify
import random
import time


otp_bp = Blueprint(
    "otp",
    __name__,
    url_prefix="/api/otp"
)


otp_storage = {}


OTP_EXPIRY_SECONDS = 300
OTP_LENGTH = 6


@otp_bp.route("/send", methods=["POST"])
def send_otp():

    data = request.get_json(silent=True) or {}

    mobile_number = str(
        data.get("mobile_number", "")
    ).strip()


    if not mobile_number:

        return jsonify({
            "success": False,
            "message": "Mobile number is required"
        }), 400


    if not mobile_number.isdigit():

        return jsonify({
            "success": False,
            "message": "Mobile number must contain only digits"
        }), 400


    if len(mobile_number) != 10:

        return jsonify({
            "success": False,
            "message": "Mobile number must be exactly 10 digits"
        }), 400


    otp = str(
        random.randint(100000, 999999)
    )


    otp_storage[mobile_number] = {

        "otp": otp,

        "created_at": time.time(),

        "verified": False

    }


    print("")
    print("OTP GENERATED")
    print("Mobile Number:", mobile_number)
    print("OTP:", otp)
    print("Valid For: 5 minutes")
    print("")


    return jsonify({

        "success": True,

        "message": "OTP generated successfully",

        "dev_otp": otp

    }), 200


@otp_bp.route("/verify", methods=["POST"])
def verify_otp():

    data = request.get_json(silent=True) or {}


    mobile_number = str(
        data.get("mobile_number", "")
    ).strip()


    entered_otp = str(
        data.get("otp", "")
    ).strip()


    if not mobile_number:

        return jsonify({
            "success": False,
            "message": "Mobile number is required"
        }), 400


    if not entered_otp:

        return jsonify({
            "success": False,
            "message": "OTP is required"
        }), 400


    if not entered_otp.isdigit():

        return jsonify({
            "success": False,
            "message": "OTP must contain only digits"
        }), 400


    if len(entered_otp) != OTP_LENGTH:

        return jsonify({
            "success": False,
            "message": "OTP must be 6 digits"
        }), 400


    stored_data = otp_storage.get(
        mobile_number
    )


    if not stored_data:

        return jsonify({

            "success": False,

            "message":
                "OTP not found. Please request a new OTP."

        }), 400


    current_time = time.time()


    if (

        current_time -
        stored_data["created_at"]

    ) > OTP_EXPIRY_SECONDS:


        otp_storage.pop(
            mobile_number,
            None
        )


        return jsonify({

            "success": False,

            "message":
                "OTP has expired. Please request a new OTP."

        }), 400


    if entered_otp != stored_data["otp"]:

        return jsonify({

            "success": False,

            "message":
                "Invalid OTP"

        }), 400


    stored_data["verified"] = True


    print("")
    print("OTP VERIFIED")
    print("Mobile Number:", mobile_number)
    print("")


    return jsonify({

        "success": True,

        "message":
            "OTP verified successfully",

        "verified": True,

        "mobile_number":
            mobile_number

    }), 200