
import React, { useState } from "react";

const API = "http://127.0.0.1:5000/api/admin";

function AdminUploadDataset({ user, goBack }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [results, setResults] = useState({});

  const datasets = [
    {
      key: "crop_production",
      icon: "🌾",
      title: "Crop Production Dataset",
      description:
        "Historical district-wise crop production used for crop prediction.",
      fields:
        "district, crop, season, year, area, production",
    },
    {
      key: "locations",
      icon: "📍",
      title: "Location Dataset",
      description:
        "District, Mandal and Village information used for location-based planning.",
      fields:
        "district, mandal, village",
    },
    {
      key: "procurement_centers",
      icon: "🏢",
      title: "Procurement Centers Dataset",
      description:
        "Procurement center details and available capacity.",
      fields:
        "center_id, center_name, district, capacity_tons",
    },
    {
      key: "warehouses",
      icon: "🏭",
      title: "Warehouse Dataset",
      description:
        "Warehouse capacity and current stock information.",
      fields:
        "warehouse_id, warehouse_name, district, total_capacity, current_stock",
    },
    {
      key: "transport",
      icon: "🚚",
      title: "Transport Dataset",
      description:
        "Distance and transportation information used for transport-cost calculation.",
      fields:
        "village, procurement_center, distance_km",
    },
    {
      key: "procurement_history",
      icon: "📋",
      title: "Procurement History Dataset",
      description:
        "Previous farmer procurement requests and their status.",
      fields:
        "farmer, district, crop, quantity, center, status",
    },
  ];

  const uploadDataset = async (dataset, file) => {
    if (!file) return;

    setLoading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("dataset_type", dataset.key);

      const response = await fetch(
        `${API}/upload-dataset`,
        {
          method: "POST",
          headers: {
            "X-Admin-Mobile":
              user?.mobile_number || "",
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setMessage(
          `❌ ${data.message || "Dataset upload failed"}`
        );
        return;
      }

      setResults((previous) => ({
        ...previous,
        [dataset.key]: data,
      }));

      setMessage(
        `✅ ${dataset.title} uploaded successfully.`
      );
    } catch (error) {
      console.error(error);

      setMessage(
        "❌ Unable to connect to backend."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>

      <div style={styles.topBar}>
        <div>
          <h2 style={styles.heading}>
            📁 Dataset Management
          </h2>

          <p style={styles.subtitle}>
            Upload all datasets required for the
            Smart Crop Procurement system.
          </p>
        </div>

        <button
          onClick={goBack}
          style={styles.backButton}
        >
          ← Dashboard
        </button>
      </div>

      {message && (
        <div style={styles.message}>
          {message}
        </div>
      )}

      <div style={styles.infoBox}>
        <b>Important:</b>

        <p>
          Upload datasets according to their purpose.
          Crop Production is used for crop prediction,
          Location is used for village/mandal selection,
          Procurement Centers and Warehouses are used
          for capacity monitoring, and Transport data
          is used for distance/cost calculation.
        </p>
      </div>

      <div style={styles.grid}>

        {datasets.map((dataset) => (
          <div
            key={dataset.key}
            style={styles.card}
          >

            <div style={styles.icon}>
              {dataset.icon}
            </div>

            <h3 style={styles.title}>
              {dataset.title}
            </h3>

            <p style={styles.description}>
              {dataset.description}
            </p>

            <div style={styles.fields}>
              <b>Expected columns:</b>
              <br />
              {dataset.fields}
            </div>

            <label style={styles.uploadButton}>
              {loading
                ? "Uploading..."
                : "📤 Choose CSV / Excel"}

              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                disabled={loading}
                onChange={(e) =>
                  uploadDataset(
                    dataset,
                    e.target.files[0]
                  )
                }
                style={{ display: "none" }}
              />
            </label>

            {results[dataset.key] && (
              <div style={styles.result}>

                <b>✅ Uploaded</b>

                <div>
                  Records imported:{" "}
                  <strong>
                    {results[dataset.key]
                      .records_imported ??
                      results[dataset.key].count ??
                      "-"}
                  </strong>
                </div>

                {results[dataset.key]
                  .valid_rows !== undefined && (
                  <div>
                    Valid rows:{" "}
                    {results[dataset.key]
                      .valid_rows}
                  </div>
                )}

              </div>
            )}

          </div>
        ))}

      </div>

      <div style={styles.nextBox}>

        <h3>
          🚀 Next Step
        </h3>

        <p>
          After uploading all required datasets,
          use <b>Train Model</b> from the Admin
          Dashboard to train the crop prediction
          model.
        </p>

        <p>
          We will then connect these datasets to the
          Government Dashboard for crop prediction,
          warehouse capacity, procurement-center
          selection and transport-cost calculation.
        </p>

      </div>

    </div>
  );
}

const styles = {
  container: {
    width: "100%",
  },

  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    marginBottom: "25px",
    flexWrap: "wrap",
  },

  heading: {
    margin: 0,
    color: "#1f4d3a",
  },

  subtitle: {
    color: "#666",
    marginTop: "8px",
  },

  backButton: {
    padding: "10px 18px",
    border: "none",
    borderRadius: "7px",
    background: "#1f4d3a",
    color: "white",
    cursor: "pointer",
    fontWeight: "bold",
  },

  message: {
    padding: "14px",
    background: "#eaf7ee",
    color: "#246b3a",
    borderRadius: "8px",
    marginBottom: "20px",
  },

  infoBox: {
    background: "#fff8e1",
    border: "1px solid #f0d98c",
    padding: "18px",
    borderRadius: "10px",
    marginBottom: "25px",
    color: "#665500",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "22px",
  },

  card: {
    background: "white",
    padding: "24px",
    borderRadius: "12px",
    boxShadow:
      "0 3px 12px rgba(0,0,0,0.08)",
  },

  icon: {
    fontSize: "42px",
  },

  title: {
    color: "#1f4d3a",
    margin: "12px 0 8px",
  },

  description: {
    color: "#666",
    lineHeight: "1.5",
    minHeight: "50px",
  },

  fields: {
    background: "#f4f7f6",
    padding: "12px",
    borderRadius: "7px",
    fontSize: "13px",
    color: "#555",
    marginBottom: "18px",
    wordBreak: "break-word",
  },

  uploadButton: {
    display: "block",
    textAlign: "center",
    padding: "12px",
    background: "#1f4d3a",
    color: "white",
    borderRadius: "7px",
    cursor: "pointer",
    fontWeight: "bold",
  },

  result: {
    marginTop: "15px",
    padding: "12px",
    background: "#edf8f0",
    borderRadius: "7px",
    color: "#246b3a",
    fontSize: "14px",
    lineHeight: "1.7",
  },

  nextBox: {
    marginTop: "30px",
    padding: "22px",
    background: "#eaf2ff",
    borderRadius: "10px",
    color: "#234",
  },
};

export default AdminUploadDataset;

