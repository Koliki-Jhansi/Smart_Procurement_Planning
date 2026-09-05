from extensions import db


class DemandData(db.Model):
    __tablename__ = "demand_data"

    id = db.Column(db.Integer, primary_key=True)

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

    expected_demand_tons = db.Column(
        db.Float,
        nullable=False
    )

    actual_procurement_tons = db.Column(
        db.Float,
        nullable=True
    )

    def to_dict(self):
        return {
            "id": self.id,
            "district": self.district,
            "crop": self.crop,
            "season": self.season,
            "year": self.year,
            "expected_demand_tons":
                self.expected_demand_tons,
            "actual_procurement_tons":
                self.actual_procurement_tons
        }