from app import app
from extensions import db
from models.user import User
from werkzeug.security import generate_password_hash


with app.app_context():

    mobile = "9999999999"
    password = "admin123"
    name = "System Admin"

    existing = User.query.filter_by(
        mobile_number=mobile
    ).first()

    if existing:
        existing.role = "admin"
        existing.password = generate_password_hash(password)

        db.session.commit()

        print("Admin user updated successfully.")

    else:
        admin = User(
            mobile_number=mobile,
            password=generate_password_hash(password),
            name=name,
            role="admin"
        )

        db.session.add(admin)
        db.session.commit()

        print("Admin user created successfully.")

    print("Mobile:", mobile)
    print("Password:", password)