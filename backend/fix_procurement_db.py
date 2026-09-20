import sqlite3
import shutil
from datetime import datetime

DB_PATH = "instance/smart_procurement.db"
BACKUP_PATH = "instance/smart_procurement_backup.db"

# Backup first
shutil.copy2(DB_PATH, BACKUP_PATH)
print("Database backup created:", BACKUP_PATH)

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Find existing columns
cursor.execute("PRAGMA table_info(procurement_requests)")
existing_columns = {row[1] for row in cursor.fetchall()}

print("Existing columns:", existing_columns)

columns_to_add = {
    "farmer_name": "VARCHAR(150) NOT NULL DEFAULT ''",
    "mobile_number": "VARCHAR(30)",
    "district": "VARCHAR(100)",
    "center_location": "VARCHAR(200)",
    "vehicle": "VARCHAR(100)",
    "total_cost": "FLOAT NOT NULL DEFAULT 0",
    "updated_at": "DATETIME",
}

for column_name, column_definition in columns_to_add.items():
    if column_name not in existing_columns:
        sql = (
            f"ALTER TABLE procurement_requests "
            f"ADD COLUMN {column_name} {column_definition}"
        )
        cursor.execute(sql)
        print("Added:", column_name)
    else:
        print("Already exists:", column_name)

# Existing records need a value for updated_at
cursor.execute(
    """
    UPDATE procurement_requests
    SET updated_at = COALESCE(updated_at, created_at, ?)
    """,
    (datetime.utcnow().isoformat(),)
)

conn.commit()

cursor.execute("PRAGMA table_info(procurement_requests)")
columns = cursor.fetchall()

print("\nUpdated procurement_requests columns:")
for column in columns:
    print(column)

conn.close()

print("\nProcurement database migration completed successfully.")