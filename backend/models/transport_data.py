from extensions import db


class TransportData(db.Model):
    __tablename__ = "transport_data"

    id = db.Column(db.Integer, primary_key=True)

    district = db.Column(db.String(100), nullable=False)
    mandal = db.Column(db.String(100), nullable=True)
    village = db.Column(db.String(100), nullable=False)

    procurement_center = db.Column(
        db.String(200),
        nullable=False
    )

    distance_km = db.Column(
        db.Float,
        nullable=False
    )

    vehicle_type = db.Column(
        db.String(100),
        nullable=True
    )

    fuel_cost_per_km = db.Column(
        db.Float,
        nullable=True
    )

    def to_dict(self):
        return {
            "id": self.id,
            "district": self.district,
            "mandal": self.mandal,
            "village": self.village,
            "procurement_center": self.procurement_center,
            "distance_km": self.distance_km,
            "vehicle_type": self.vehicle_type,
            "fuel_cost_per_km": self.fuel_cost_per_km
        }