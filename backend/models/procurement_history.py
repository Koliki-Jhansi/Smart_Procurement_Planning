from datetime import datetime
from extensions import db


class ProcurementHistory(db.Model):

    __tablename__ = "procurement_history"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    farmer_mobile = db.Column(
        db.String(15),
        nullable=True
    )

    district = db.Column(
        db.String(100),
        nullable=True
    )

    crop = db.Column(
        db.String(100),
        nullable=True
    )

    quantity_tons = db.Column(
        db.Float,
        nullable=True
    )

    procurement_center = db.Column(
        db.String(200),
        nullable=True
    )

    status = db.Column(
        db.String(50),
        nullable=True
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    def to_dict(self):

        return {
            "id": self.id,
            "farmer_mobile": self.farmer_mobile,
            "district": self.district,
            "crop": self.crop,
            "quantity_tons": self.quantity_tons,
            "procurement_center": self.procurement_center,
            "status": self.status,
            "created_at": (
                self.created_at.isoformat()
                if self.created_at
                else None
            )
        }