
import React, { useEffect, useState } from "react";
import AdminDatasetManagement from "./AdminDatasetManagement";

const API = "http://127.0.0.1:5000";

function AdminDashboard({ user, onLogout }) {
  const [showDatasets, setShowDatasets] = useState(false);

  const [stats, setStats] = useState({
    farmers: 0,
    government: 0,
    training_records: 0,
    procurement_centers: 0,
    warehouses: 0,
  });

  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const adminMobile =
        localStorage.getItem("admin_mobile") ||
        user?.mobile_number ||
        user?.mobile ||
        "";

      const response = await fetch(
        `${API}/api/admin/dashboard`,
        {
          method: "GET",
          headers: {
            "X-Admin-Mobile": String(adminMobile),
          },
        }
      );

      if (!response.ok) {
        console.log(
          "Dashboard API returned:",
          response.status
        );
        return;
      }

      const data = await response.json();

      if (data.success) {
        setStats({
          farmers: Number(
            data.data?.farmers || 0
          ),

          government: Number(
            data.data?.government ||
            data.data?.government_users ||
            0
          ),

          training_records: Number(
            data.data?.training_records || 0
          ),

          procurement_centers: Number(
            data.data?.procurement_centers || 0
          ),

          warehouses: Number(
            data.data?.warehouses || 0
          ),
        });
      }
    } catch (error) {
      console.error(
        "Dashboard loading error:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  // --------------------------------------------------
  // DATASET MANAGEMENT
  // --------------------------------------------------

  if (showDatasets) {
    return (
      <AdminDatasetManagement
        goBack={() => {
          setShowDatasets(false);
          loadDashboard();
        }}
      />
    );
  }

  // --------------------------------------------------
  // CARD
  // --------------------------------------------------

  const StatCard = ({
    icon,
    title,
    value,
  }) => (
    <div
      style={{
        background: "white",
        padding: "22px",
        borderRadius: "12px",
        boxShadow:
          "0 3px 12px rgba(0,0,0,0.08)",
        display: "flex",
        alignItems: "center",
        gap: "18px",
      }}
    >
      <div
        style={{
          fontSize: "38px",
        }}
      >
        {icon}
      </div>

      <div>
        <div
          style={{
            color: "#666",
            fontSize: "14px",
            marginBottom: "6px",
          }}
        >
          {title}
        </div>

        <div
          style={{
            fontSize: "28px",
            fontWeight: "bold",
          }}
        >
          {loading
            ? "..."
            : value.toLocaleString("en-IN")}
        </div>
      </div>
    </div>
  );

  // --------------------------------------------------
  // MAIN DASHBOARD
  // --------------------------------------------------

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f7fa",
        padding: "30px",
        fontFamily:
          "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "auto",
        }}
      >

        {/* HEADER */}

        <div
          style={{
            background: "white",
            padding: "25px",
            borderRadius: "12px",
            marginBottom: "25px",
            boxShadow:
              "0 3px 12px rgba(0,0,0,0.08)",
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h1
              style={{
                margin: "0 0 8px 0",
              }}
            >
              Administration Dashboard
            </h1>

            <p
              style={{
                margin: 0,
                color: "#666",
              }}
            >
              Manage datasets and machine
              learning models for Smart Crop
              Procurement.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <span>
              👤{" "}
              {user?.name ||
                user?.mobile_number ||
                "Admin"}
            </span>

            <button
              onClick={onLogout}
              style={{
                background: "#d32f2f",
                color: "white",
                border: "none",
                padding: "10px 16px",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {/* STATISTICS */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "18px",
            marginBottom: "25px",
          }}
        >
          <StatCard
            icon="👨‍🌾"
            title="Farmers"
            value={stats.farmers}
          />

          <StatCard
            icon="🏛️"
            title="Government Users"
            value={stats.government}
          />

          <StatCard
            icon="📊"
            title="Training Records"
            value={
              stats.training_records
            }
          />

          <StatCard
            icon="🏢"
            title="Procurement Centers"
            value={
              stats.procurement_centers
            }
          />

          <StatCard
            icon="🏭"
            title="Warehouses"
            value={stats.warehouses}
          />
        </div>

        {/* DATASET MANAGEMENT */}

        <div
          style={{
            background: "white",
            padding: "28px",
            borderRadius: "12px",
            boxShadow:
              "0 3px 12px rgba(0,0,0,0.08)",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              fontSize: "45px",
            }}
          >
            📁
          </div>

          <h2>
            Dataset Management
          </h2>

          <p
            style={{
              color: "#555",
              lineHeight: 1.6,
            }}
          >
            Upload all datasets required for
            the complete Smart Crop Procurement
            system from one place.
          </p>

          <p
            style={{
              color: "#777",
              fontSize: "14px",
            }}
          >
            Crop Production, Location,
            Procurement Centers, Warehouses,
            Transport, Weather, Soil, Market
            and Demand datasets are managed
            inside Dataset Management.
          </p>

          <button
            onClick={() =>
              setShowDatasets(true)
            }
            style={{
              background: "#1976d2",
              color: "white",
              border: "none",
              padding: "13px 22px",
              borderRadius: "7px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "15px",
            }}
          >
            Open Dataset Management
          </button>
        </div>

        {/* MODEL TRAINING */}

        <div
          style={{
            background: "white",
            padding: "28px",
            borderRadius: "12px",
            boxShadow:
              "0 3px 12px rgba(0,0,0,0.08)",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              fontSize: "45px",
            }}
          >
            🤖
          </div>

          <h2>
            Crop Prediction Model
          </h2>

          <p
            style={{
              color: "#555",
              lineHeight: 1.6,
            }}
          >
            Train or retrain the crop production
            prediction model using the uploaded
            historical crop-production dataset.
          </p>

          <p
            style={{
              background: "#fff8e1",
              padding: "12px",
              borderRadius: "6px",
              color: "#795548",
              fontSize: "14px",
            }}
          >
            Upload the Crop Production dataset
            first. Training records should come
            from the uploaded dataset and should
            not be displayed as a fixed number.
          </p>
        </div>

        {/* SYSTEM DATA FLOW */}

        <div
          style={{
            background: "white",
            padding: "28px",
            borderRadius: "12px",
            boxShadow:
              "0 3px 12px rgba(0,0,0,0.08)",
          }}
        >
          <h2>
            📌 Admin Data Flow
          </h2>

          <ol
            style={{
              lineHeight: 2,
              color: "#444",
            }}
          >
            <li>
              Open Dataset Management
            </li>

            <li>
              Upload Location Dataset
            </li>

            <li>
              Upload Crop Production Dataset
            </li>

            <li>
              Upload Procurement Center Dataset
            </li>

            <li>
              Upload Warehouse Dataset
            </li>

            <li>
              Upload Transport Dataset
            </li>

            <li>
              Upload Weather and Soil Dataset
            </li>

            <li>
              Upload Market and Demand Dataset
            </li>

            <li>
              Check actual record counts
            </li>

            <li>
              Train the required ML model
            </li>
          </ol>

          <button
            onClick={loadDashboard}
            style={{
              background: "#455a64",
              color: "white",
              border: "none",
              padding: "11px 20px",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            🔄 Refresh Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;

