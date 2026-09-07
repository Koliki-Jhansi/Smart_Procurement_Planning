from datetime import datetime

from flask import Blueprint, jsonify

from extensions import db
from models.notification import Notification


notifications_bp = Blueprint(
    "notifications",
    __name__,
    url_prefix="/api/notifications"
)


@notifications_bp.route(
    "/farmer/<int:farmer_id>",
    methods=["GET"]
)
def get_farmer_notifications(farmer_id):

    try:

        notifications = (
            Notification.query
            .filter_by(farmer_id=farmer_id)
            .order_by(Notification.created_at.desc())
            .all()
        )

        unread_count = (
            Notification.query
            .filter_by(
                farmer_id=farmer_id,
                is_read=False
            )
            .count()
        )

        return jsonify({
            "success": True,
            "count": len(notifications),
            "unread_count": unread_count,
            "notifications": [
                notification.to_dict()
                for notification in notifications
            ]
        }), 200

    except Exception as error:

        print(
            "LOAD FARMER NOTIFICATIONS ERROR:",
            str(error)
        )

        return jsonify({
            "success": False,
            "message": "Unable to load notifications.",
            "error": str(error)
        }), 500


@notifications_bp.route(
    "/<int:notification_id>/read",
    methods=["PUT"]
)
def mark_notification_read(notification_id):

    try:

        notification = db.session.get(
            Notification,
            notification_id
        )

        if not notification:

            return jsonify({
                "success": False,
                "message": "Notification not found."
            }), 404

        notification.is_read = True
        notification.read_at = datetime.utcnow()

        db.session.commit()

        return jsonify({
            "success": True,
            "notification": notification.to_dict()
        }), 200

    except Exception as error:

        db.session.rollback()

        print(
            "MARK NOTIFICATION READ ERROR:",
            str(error)
        )

        return jsonify({
            "success": False,
            "message": "Unable to update notification.",
            "error": str(error)
        }), 500


@notifications_bp.route(
    "/farmer/<int:farmer_id>/read-all",
    methods=["PUT"]
)
def mark_farmer_notifications_read(farmer_id):

    try:

        notifications = (
            Notification.query
            .filter_by(
                farmer_id=farmer_id,
                is_read=False
            )
            .all()
        )

        now = datetime.utcnow()

        for notification in notifications:
            notification.is_read = True
            notification.read_at = now

        db.session.commit()

        return jsonify({
            "success": True,
            "updated_count": len(notifications)
        }), 200

    except Exception as error:

        db.session.rollback()

        print(
            "MARK FARMER NOTIFICATIONS READ ERROR:",
            str(error)
        )

        return jsonify({
            "success": False,
            "message": "Unable to update notifications.",
            "error": str(error)
        }), 500
