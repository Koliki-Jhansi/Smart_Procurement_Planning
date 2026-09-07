from datetime import datetime

from extensions import db


class Notification(db.Model):
    __tablename__ = "notifications"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    farmer_id = db.Column(
        db.Integer,
        nullable=False,
        index=True
    )

    procurement_request_id = db.Column(
        db.Integer,
        db.ForeignKey("procurement_requests.id"),
        nullable=True,
        index=True
    )

    title = db.Column(
        db.String(150),
        nullable=False
    )

    message = db.Column(
        db.Text,
        nullable=False
    )

    status = db.Column(
        db.String(50),
        nullable=False
    )

    is_read = db.Column(
        db.Boolean,
        default=False,
        nullable=False,
        index=True
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False,
        index=True
    )

    read_at = db.Column(
        db.DateTime,
        nullable=True
    )

    def to_dict(self):
        return {
            "id": self.id,
            "farmer_id": self.farmer_id,
            "procurement_request_id": self.procurement_request_id,
            "request_id": self.procurement_request_id,
            "title": self.title,
            "message": self.message,
            "status": self.status,
            "is_read": self.is_read,
            "created_at": (
                self.created_at.isoformat()
                if self.created_at
                else None
            ),
            "read_at": (
                self.read_at.isoformat()
                if self.read_at
                else None
            ),
            "created_at_display": (
                self.created_at.strftime("%d-%m-%Y %I:%M:%S %p")
                if self.created_at
                else None
            )
        }
