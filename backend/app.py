from flask import Flask, jsonify
from flask_cors import CORS

from extensions import db

from routes.auth import auth_bp
from routes.procurement import procurement_bp
from routes.procurement_request import procurement_request_bp
from routes.admin import admin_bp
from routes.otp import otp_bp
from routes.government import government_bp
from routes.prediction import prediction_bp
from routes.transport import transport_bp
from routes.notifications import notifications_bp

# NEW
from routes.warehouse import warehouse_bp
from routes.appointment import appointment_bp


from models.user import User
from models.training_data import TrainingData
from models.procurement_center import ProcurementCenter
from models.warehouse import Warehouse
from models.location_data import LocationData
from models.transport_data import TransportData
from models.procurement_history import ProcurementHistory
from models.procurement_request import ProcurementRequest
from models.notification import Notification

# NEW
from models.appointment import Appointment


import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

database_url = os.environ.get("DATABASE_URL")
if database_url:
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql://", 1)
    app.config["SQLALCHEMY_DATABASE_URI"] = database_url
else:
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///smart_procurement.db"

app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SECRET_KEY"] = os.environ.get(
    "SECRET_KEY", "smart-procurement-production-key-change-in-env"
)

db.init_app(app)

# Ensure database tables exist automatically in production/WSGI
with app.app_context():
    try:
        db.create_all()
    except Exception as db_err:
        print("Database initialization notice:", db_err)

frontend_url = os.environ.get("FRONTEND_URL", "").strip()

local_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5175",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5001",
    "http://127.0.0.1:5001",
]

if frontend_url == "*":
    allowed_origins = "*"
elif frontend_url:
    origins_set = set(local_origins)
    for origin in frontend_url.split(","):
        cleaned = origin.strip()
        if cleaned:
            origins_set.add(cleaned)
            origins_set.add(cleaned.rstrip("/"))
    allowed_origins = list(origins_set)
else:
    allowed_origins = local_origins

CORS(
    app,
    resources={
        r"/*": {
            "origins": allowed_origins
        }
    },
    allow_headers=[
        "Content-Type",
        "X-Admin-Mobile",
        "Authorization",
        "Accept"
    ],
    methods=[
        "GET",
        "POST",
        "PUT",
        "DELETE",
        "OPTIONS",
        "PATCH"
    ]
)


app.register_blueprint(
    auth_bp
)

app.register_blueprint(
    procurement_bp
)

app.register_blueprint(
    procurement_request_bp
)

app.register_blueprint(
    admin_bp
)

app.register_blueprint(
    otp_bp
)

app.register_blueprint(
    government_bp
)

app.register_blueprint(
    prediction_bp
)

app.register_blueprint(
    notifications_bp
)

# NEW
app.register_blueprint(
    warehouse_bp
)

# NEW
app.register_blueprint(
    appointment_bp
)


app.register_blueprint(
    transport_bp
)


@app.route("/")
def home():

    return jsonify({
        "success": True,
        "message":
            "Smart Crop Procurement Planning API is running."
    })


@app.route("/api/health")
def health():

    return jsonify({
        "success": True,
        "message":
            "Backend is running."
    })


@app.route("/api")
def api_info():

    return jsonify({

        "success": True,

        "message":
            "Smart Crop Procurement Planning API",

        "endpoints": {

            "health":
                "/api/health",

            "register":
                "/api/auth/register",

            "login":
                "/api/auth/login",

            "crop_prediction":
                "/api/predict",

            "procurement_centers":
                "/api/procurement/centers",

            "create_procurement_request":
                "/api/procurement-requests",

            "get_all_procurement_requests":
                "/api/procurement-requests",

            "farmer_requests":
                "/api/procurement-requests/farmer/<farmer_id>",

            "single_procurement_request":
                "/api/procurement-requests/<request_id>",

            "update_request_status":
                "/api/procurement-requests/<request_id>/status",

            "farmer_notifications":
                "/api/notifications/farmer/<farmer_id>",

            "transport_calculation":
                "/api/transport/calculate",

            "warehouse_centers":
                "/api/warehouse/centers?district=<district>",

            "warehouse_center":
                "/api/warehouse/center/<center_id>",

            "book_appointment":
                "/api/appointments/book",

            "farmer_appointments":
                "/api/appointments/farmer/<farmer_id>",

            "center_appointments":
                "/api/appointments/center/<center_id>",

            "complete_appointment":
                "/api/appointments/<appointment_id>/complete",

            "cancel_appointment":
                "/api/appointments/<appointment_id>/cancel"
        }
    })


def create_database_tables():

    with app.app_context():

        db.create_all()

        print(
            "Database tables checked and created successfully."
        )


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    debug = os.environ.get("FLASK_DEBUG", "true").lower() in ("true", "1", "yes")

    print(f"Smart Crop Procurement Backend Started on port {port} (Debug: {debug})")

    app.run(
        host="0.0.0.0" if not debug else "127.0.0.1",
        port=port,
        debug=debug
    )