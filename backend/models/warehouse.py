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

    center_id = db.Column(
        db.String(100),
        unique=True,
        nullable=True,
        index=True
    )

    warehouse_name = db.Column(
        db.String(200),
        nullable=False
    )

    district = db.Column(
        db.String(100),
        nullable=False,
        index=True
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

        physical_available = (
            float(self.total_capacity or 0)
            -
            float(self.current_stock or 0)
        )

        return {
            "id":
                self.id,

            "warehouse_id":
                self.warehouse_id,

            "center_id":
                self.center_id,

            "warehouse_name":
                self.warehouse_name,

            "district":
                self.district,

            "total_capacity":
                float(self.total_capacity or 0),

            "current_stock":
                float(self.current_stock or 0),

            "available_capacity":
                max(
                    physical_available,
                    0
                )
        }