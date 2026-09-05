from extensions import db


class LocationData(db.Model):
    __tablename__ = "location_data"

    id = db.Column(db.Integer, primary_key=True)

    district = db.Column(db.String(100), nullable=False)
    mandal = db.Column(db.String(100), nullable=False)
    village = db.Column(db.String(100), nullable=False)

    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "district": self.district,
            "mandal": self.mandal,
            "village": self.village,
            "latitude": self.latitude,
            "longitude": self.longitude
        }