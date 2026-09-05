from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash

from extensions import db
from models.user import User


auth_bp = Blueprint(
    "auth",
    __name__,
    url_prefix="/api/auth"
)


@auth_bp.route("/register", methods=["POST"])
def register():

    data = request.get_json(silent=True) or {}

    full_name = (
        data.get("name")
        or data.get("full_name")
        or ""
    ).strip()

    mobile_number = str(
        data.get("mobile_number", "")
    ).strip()

    password = str(
        data.get("password", "")
    ).strip()

    role = str(
        data.get("role", "")
    ).strip().lower()

    farmer_id = data.get("farmer_id")
    village = data.get("village")
    mandal = data.get("mandal")
    district = data.get("district")
    land_area = data.get("land_area")
    primary_crop = data.get("primary_crop")

    department = data.get("department")
    designation = data.get("designation")


    if not full_name:
        return jsonify({
            "success": False,
            "message": "Name is required"
        }), 400


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
            "message": "Mobile number must contain exactly 10 digits"
        }), 400


    if not password:
        return jsonify({
            "success": False,
            "message": "Password is required"
        }), 400


    if len(password) < 6:
        return jsonify({
            "success": False,
            "message": "Password must contain at least 6 characters"
        }), 400


    if role not in ["farmer", "government"]:
        return jsonify({
            "success": False,
            "message": "Role must be farmer or government"
        }), 400


    if role == "farmer":

        if not village:
            return jsonify({
                "success": False,
                "message": "Village is required"
            }), 400


        if not mandal:
            return jsonify({
                "success": False,
                "message": "Mandal is required"
            }), 400


        if not district:
            return jsonify({
                "success": False,
                "message": "District is required"
            }), 400


        if not primary_crop:
            return jsonify({
                "success": False,
                "message": "Primary crop is required"
            }), 400


        village = str(village).strip()
        mandal = str(mandal).strip()
        district = str(district).strip()
        primary_crop = str(primary_crop).strip()


        if farmer_id:
            farmer_id = str(farmer_id).strip()


        if land_area not in [None, ""]:

            try:
                land_area = float(land_area)

                if land_area <= 0:
                    return jsonify({
                        "success": False,
                        "message": "Land area must be greater than 0"
                    }), 400

            except (ValueError, TypeError):

                return jsonify({
                    "success": False,
                    "message": "Land area must be a valid number"
                }), 400

        else:
            land_area = None


        department = None
        designation = None


    if role == "government":

        if not department:
            return jsonify({
                "success": False,
                "message": "Department is required"
            }), 400


        if not designation:
            return jsonify({
                "success": False,
                "message": "Designation is required"
            }), 400


        department = str(department).strip()
        designation = str(designation).strip()


        farmer_id = None
        village = None
        mandal = None
        district = None
        land_area = None
        primary_crop = None


    existing_user = User.query.filter_by(
        mobile_number=mobile_number
    ).first()


    if existing_user:
        return jsonify({
            "success": False,
            "message": "Mobile number already registered"
        }), 409


    password_hash = generate_password_hash(
        password
    )


    new_user = User(
        full_name=full_name,
        mobile_number=mobile_number,
        password_hash=password_hash,
        role=role,
        farmer_id=farmer_id,
        village=village,
        mandal=mandal,
        district=district,
        land_area=land_area,
        primary_crop=primary_crop,
        department=department,
        designation=designation
    )


    try:

        db.session.add(new_user)
        db.session.commit()

    except Exception as error:

        db.session.rollback()

        print("Registration database error:", error)

        return jsonify({
            "success": False,
            "message": "Unable to create account"
        }), 500


    return jsonify({

        "success": True,

        "message": "Registration successful",

        "user": {

            "id": new_user.id,
            "full_name": new_user.full_name,
            "mobile_number": new_user.mobile_number,
            "role": new_user.role,

            "farmer_id": new_user.farmer_id,
            "village": new_user.village,
            "mandal": new_user.mandal,
            "district": new_user.district,
            "land_area": new_user.land_area,
            "primary_crop": new_user.primary_crop,

            "department": new_user.department,
            "designation": new_user.designation

        }

    }), 201


@auth_bp.route("/login", methods=["POST"])
def login():

    data = request.get_json(silent=True) or {}


    mobile_number = str(
        data.get("mobile_number", "")
    ).strip()


    password = str(
        data.get("password", "")
    ).strip()


    if not mobile_number:
        return jsonify({
            "success": False,
            "message": "Mobile number is required"
        }), 400


    if not password:
        return jsonify({
            "success": False,
            "message": "Password is required"
        }), 400


    user = User.query.filter_by(
        mobile_number=mobile_number
    ).first()


    if not user:
        return jsonify({
            "success": False,
            "message": "Invalid mobile number or password"
        }), 401


    if not check_password_hash(
        user.password_hash,
        password
    ):
        return jsonify({
            "success": False,
            "message": "Invalid mobile number or password"
        }), 401


    return jsonify({

        "success": True,

        "message": "Login successful",

        "user": {

            "id": user.id,
            "full_name": user.full_name,
            "mobile_number": user.mobile_number,
            "role": user.role,

            "farmer_id": user.farmer_id,
            "village": user.village,
            "mandal": user.mandal,
            "district": user.district,
            "land_area": user.land_area,
            "primary_crop": user.primary_crop,

            "department": user.department,
            "designation": user.designation

        }

    }), 200

