from datetime import datetime
from extensions import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    full_name = db.Column(
        db.String(100),
        nullable=True
    )

    mobile_number = db.Column(
        db.String(15),
        unique=True,
        nullable=False
    )

    password_hash = db.Column(
        db.String(255),
        nullable=False
    )

    role = db.Column(
        db.String(20),
        nullable=False
    )

    farmer_id = db.Column(
        db.String(50),
        nullable=True
    )

    village = db.Column(
        db.String(100),
        nullable=True
    )

    mandal = db.Column(
        db.String(100),
        nullable=True
    )

    district = db.Column(
        db.String(100),
        nullable=True
    )

    land_area = db.Column(
        db.Float,
        nullable=True
    )

    primary_crop = db.Column(
        db.String(100),
        nullable=True
    )

    department = db.Column(
        db.String(100),
        nullable=True
    )

    designation = db.Column(
        db.String(100),
        nullable=True
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    def __repr__(self):
        return f"<User {self.mobile_number}>"
