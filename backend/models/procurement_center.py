from extensions import db


class ProcurementCenter(db.Model):

    __tablename__ = "procurement_centers"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    center_id = db.Column(
        db.String(100),
        unique=True,
        nullable=False
    )

    center_name = db.Column(
        db.String(200),
        nullable=False
    )

    district = db.Column(
        db.String(100),
        nullable=False
    )

    capacity_tons = db.Column(
        db.Float,
        nullable=False
    )

    def to_dict(self):

        return {
            "id": self.id,
            "center_id": self.center_id,
            "center_name": self.center_name,
            "district": self.district,
            "capacity_tons": self.capacity_tons
        }