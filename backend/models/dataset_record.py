
from datetime import datetime

from extensions import db


class DatasetRecord(db.Model):

    __tablename__ = "dataset_records"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    dataset_type = db.Column(
        db.String(100),
        nullable=False,
        index=True
    )

    source_file = db.Column(
        db.String(255),
        nullable=False
    )

    row_number = db.Column(
        db.Integer,
        nullable=False
    )

    data = db.Column(
        db.JSON,
        nullable=False
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    def to_dict(self):

        return {
            "id": self.id,
            "dataset_type":
                self.dataset_type,
            "source_file":
                self.source_file,
            "row_number":
                self.row_number,
            "data":
                self.data,
            "created_at":
                (
                    self.created_at.isoformat()
                    if self.created_at
                    else None
                )
        }
