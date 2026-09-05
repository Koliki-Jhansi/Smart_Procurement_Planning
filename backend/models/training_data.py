from datetime import datetime
from extensions import db


class TrainingData(db.Model):
    __tablename__ = "crop_training_data"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    district = db.Column(
        db.String(100),
        nullable=False
    )

    crop = db.Column(
        db.String(100),
        nullable=False
    )

    season = db.Column(
        db.String(50),
        nullable=False
    )

    year = db.Column(
        db.Integer,
        nullable=False
    )

    area = db.Column(
        db.Float,
        nullable=False
    )

    production = db.Column(
        db.Float,
        nullable=False
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    def to_dict(self):
        return {
            "id": self.id,
            "district": self.district,
            "crop": self.crop,
            "season": self.season,
            "year": self.year,
            "area": self.area,
            "production": self.production,
            "created_at": (
                self.created_at.isoformat()
                if self.created_at
                else None
            )
        }