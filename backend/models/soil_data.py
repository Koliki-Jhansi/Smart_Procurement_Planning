from datetime import datetime
from extensions import db


class SoilData(db.Model):
    __tablename__ = "soil_data"

    id = db.Column(db.Integer, primary_key=True)

    district = db.Column(db.String(100), nullable=False)
    mandal = db.Column(db.String(100), nullable=True)
    village = db.Column(db.String(100), nullable=True)

    soil_type = db.Column(db.String(100), nullable=True)

    ph = db.Column(db.Float, nullable=True)
    nitrogen = db.Column(db.Float, nullable=True)
    phosphorus = db.Column(db.Float, nullable=True)
    potassium = db.Column(db.Float, nullable=True)

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    def to_dict(self):
        return {
            "id": self.id,
            "district": self.district,
            "mandal": self.mandal,
            "village": self.village,
            "soil_type": self.soil_type,
            "ph": self.ph,
            "nitrogen": self.nitrogen,
            "phosphorus": self.phosphorus,
            "potassium": self.potassium,
            "created_at": (
                self.created_at.isoformat()
                if self.created_at
                else None
            )
        }