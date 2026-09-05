from datetime import datetime
from extensions import db


class WeatherData(db.Model):
    __tablename__ = "weather_data"

    id = db.Column(db.Integer, primary_key=True)

    district = db.Column(db.String(100), nullable=False)
    mandal = db.Column(db.String(100), nullable=True)
    village = db.Column(db.String(100), nullable=True)

    year = db.Column(db.Integer, nullable=False)

    rainfall = db.Column(db.Float, nullable=True)
    temperature = db.Column(db.Float, nullable=True)
    humidity = db.Column(db.Float, nullable=True)

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
            "year": self.year,
            "rainfall": self.rainfall,
            "temperature": self.temperature,
            "humidity": self.humidity,
            "created_at": (
                self.created_at.isoformat()
                if self.created_at
                else None
            )
        }