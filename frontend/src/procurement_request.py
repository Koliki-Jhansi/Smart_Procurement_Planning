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
        nullable=False
    )

    farmer_name = db.Column(
        db.String(100),
        nullable=False
    )

    farmer_mobile = db.Column(
        db.String(15),
        nullable=False
    )

    village = db.Column(
        db.String(100),
        nullable=True
    )

    district = db.Column(
        db.String(100),
        nullable=False
    )

    crop = db.Column(
        db.String(100),
        nullable=False
    )

    quantity = db.Column(
        db.Float,
        nullable=False
    )

    center_id = db.Column(
        db.String(100),
        nullable=False
    )

    center_name = db.Column(
        db.String(200),
        nullable=False
    )

    distance_km = db.Column(
        db.Float,
        nullable=True
    )

    transport_cost = db.Column(
        db.Float,
        nullable=True
    )

    total_cost = db.Column(
        db.Float,
        nullable=True
    )

    status = db.Column(
        db.String(20),
        default="pending",
        nullable=False
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    def to_dict(self):
        return {
            "id": self.id,
            "farmer_id": self.farmer_id,
            "farmer_name": self.farmer_name,
            "farmer_mobile": self.farmer_mobile,
            "village": self.village,
            "district": self.district,
            "crop": self.crop,
            "quantity": self.quantity,
            "center_id": self.center_id,
            "center_name": self.center_name,
            "distance_km": self.distance_km,
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
            )
        }