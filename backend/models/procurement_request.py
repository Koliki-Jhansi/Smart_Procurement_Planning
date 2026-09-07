from datetime import datetime

from extensions import db


class ProcurementRequest(db.Model):
    __tablename__ = "procurement_requests"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    farmer_id = db.Column(
        db.Integer,
        nullable=False,
        index=True
    )

    farmer_name = db.Column(
        db.String(150),
        nullable=False
    )

    mobile_number = db.Column(
        db.String(30),
        nullable=True
    )

    district = db.Column(
        db.String(100),
        nullable=True
    )

    center_id = db.Column(
        db.String(100),
        nullable=True
    )

    center_name = db.Column(
        db.String(200),
        nullable=False
    )

    center_district = db.Column(
        db.String(100),
        nullable=True
    )

    center_location = db.Column(
        db.String(200),
        nullable=True
    )

    crop = db.Column(
        db.String(100),
        nullable=False
    )

    quantity = db.Column(
        db.Float,
        nullable=False
    )

    distance_km = db.Column(
        db.Float,
        default=0,
        nullable=False
    )

    vehicle = db.Column(
        db.String(100),
        nullable=True
    )

    transport_cost = db.Column(
        db.Float,
        default=0,
        nullable=False
    )

    total_cost = db.Column(
        db.Float,
        default=0,
        nullable=False
    )

    status = db.Column(
        db.String(50),
        default="pending",
        nullable=False,
        index=True
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False,
        index=True
    )

    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    def to_dict(self):
        return {
            "id": self.id,
            "request_id": self.id,
            "farmer_id": self.farmer_id,
            "farmer_name": self.farmer_name,
            "mobile_number": self.mobile_number,
            "mobile": self.mobile_number,
            "phone": self.mobile_number,
            "district": self.district,
            "center_id": self.center_id,
            "procurement_center_id": self.center_id,
            "center_name": self.center_name,
            "procurement_center_name": self.center_name,
            "center": self.center_name,
            "center_district": self.center_district,
            "center_location": self.center_location,
            "location": self.center_location,
            "crop": self.crop,
            "crop_name": self.crop,
            "quantity": self.quantity,
            "distance_km": self.distance_km,
            "distance": self.distance_km,
            "vehicle": self.vehicle,
            "transport_cost": self.transport_cost,
            "total_cost": self.total_cost,
            "status": self.status,
            "created_at": (
                self.created_at.isoformat()
                if self.created_at
                else None
            ),
            "updated_at": (
                self.updated_at.isoformat()
                if self.updated_at
                else None
            ),
            "created_at_display": (
                self.created_at.strftime(
                    "%d-%m-%Y %I:%M:%S %p"
                )
                if self.created_at
                else None
            ),
            "updated_at_display": (
                self.updated_at.strftime(
                    "%d-%m-%Y %I:%M:%S %p"
                )
                if self.updated_at
                else None
            )
        }
