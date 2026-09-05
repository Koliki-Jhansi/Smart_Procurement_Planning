from extensions import db


class MarketPrice(db.Model):

    __tablename__ = "market_price"

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

    year = db.Column(
        db.Integer,
        nullable=False
    )

    msp = db.Column(
        db.Float,
        nullable=True
    )

    market_price = db.Column(
        db.Float,
        nullable=True
    )

    def to_dict(self):

        return {
            "id": self.id,
            "district": self.district,
            "crop": self.crop,
            "year": self.year,
            "msp": self.msp,
            "market_price": self.market_price
        }