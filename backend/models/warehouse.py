from extensions import db


class Warehouse(db.Model):

    __tablename__ = "warehouses"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    warehouse_id = db.Column(
        db.String(100),
        unique=True,
        nullable=False
    )

    warehouse_name = db.Column(
        db.String(200),
        nullable=False
    )

    district = db.Column(
        db.String(100),
        nullable=False
    )

    total_capacity = db.Column(
        db.Float,
        nullable=False
    )

    current_stock = db.Column(
        db.Float,
        nullable=False,
        default=0
    )

    def to_dict(self):

        available_capacity = (
            self.total_capacity -
            self.current_stock
        )

        return {
            "id": self.id,
            "warehouse_id": self.warehouse_id,
            "warehouse_name": self.warehouse_name,
            "district": self.district,
            "total_capacity": self.total_capacity,
            "current_stock": self.current_stock,
            "available_capacity": max(
                available_capacity,
                0
            )
        }