from datetime import datetime
from extensions import db


class Appointment(db.Model):
    __tablename__ = "appointments"

    id = db.Column(db.Integer, primary_key=True)

    procurement_request_id = db.Column(
        db.Integer,
        nullable=False,
        unique=True,
        index=True
    )

    farmer_id = db.Column(db.Integer, nullable=False, index=True)
    farmer_name = db.Column(db.String(150), nullable=False)

    center_id = db.Column(db.String(100), nullable=False, index=True)
    center_name = db.Column(db.String(200), nullable=False)

    crop = db.Column(db.String(100), nullable=False)

    reserved_quantity = db.Column(db.Float, nullable=False, default=0)

    appointment_date = db.Column(db.String(20), nullable=True)
    appointment_time = db.Column(db.String(20), nullable=True)

    # booked -> completion_requested -> completed
    status = db.Column(
        db.String(50),
        nullable=False,
        default="booked",
        index=True
    )

    actual_received_quantity = db.Column(db.Float, nullable=True)
    farmer_completed_at = db.Column(db.DateTime, nullable=True)
    completed_at = db.Column(db.DateTime, nullable=True)

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False
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
            "procurement_request_id": self.procurement_request_id,
            "farmer_id": self.farmer_id,
            "farmer_name": self.farmer_name,
            "center_id": self.center_id,
            "center_name": self.center_name,
            "crop": self.crop,
            "reserved_quantity": float(self.reserved_quantity or 0),
            "appointment_date": self.appointment_date,
            "appointment_time": self.appointment_time,
            "status": self.status,
            "actual_received_quantity": (
                float(self.actual_received_quantity)
                if self.actual_received_quantity is not None
                else None
            ),
            "farmer_completed_at": (
                self.farmer_completed_at.isoformat()
                if self.farmer_completed_at else None
            ),
            "completed_at": (
                self.completed_at.isoformat()
                if self.completed_at else None
            ),
            "created_at": (
                self.created_at.isoformat()
                if self.created_at else None
            ),
            "updated_at": (
                self.updated_at.isoformat()
                if self.updated_at else None
            )
        }
