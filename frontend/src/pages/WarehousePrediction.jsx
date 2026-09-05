import React, { useState } from "react";
import axios from "axios";

const API = "http://127.0.0.1:5000";

function WarehousePrediction({ goBack }) {
  const [district, setDistrict] = useState("");
  const [quantity, setQuantity] = useState("");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handlePredict = async (e) => {
    e.preventDefault();

    setError("");
    setResult(null);

    if (!district.trim() || !quantity) {
      setError("Please enter district and quantity.");
      return;
    }

    if (Number(quantity) <= 0) {
      setError("Quantity must be greater than 0.");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${API}/api/warehouse/predict`,
        {
          district: district.trim(),
          quantity: Number(quantity),
        }
      );

      console.log(
        "Warehouse prediction:",
        response.data
      );

      setResult(response.data);
    } catch (err) {
      console.error(
        "Warehouse prediction error:",
        err
      );

      if (err.response) {
        setError(
          err.response.data?.message ||
            err.response.data?.error ||
            "Warehouse prediction failed."
        );
      } else if (err.request) {
        setError(
          "Unable to connect to server. Please make sure the Flask backend is running."
        );
      } else {
        setError(
          "Something went wrong. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------
  // HELPER TO FIND RESULT VALUES
  // --------------------------------

  const getValue = (...keys) => {
    if (!result) return null;

    for (const key of keys) {
      if (
        result[key] !== undefined &&
        result[key] !== null
      ) {
        return result[key];
      }
    }

    return null;
  };

  const availableCapacity = getValue(
    "available_capacity",
    "availableCapacity",
    "Available_Capacity"
  );

  const currentLoad = getValue(
    "current_load",
    "currentLoad",
    "Current_Load"
  );

  const totalCapacity = getValue(
    "total_capacity",
    "totalCapacity",
    "Total_Capacity"
  );

  const requiredCapacity = getValue(
    "required_capacity",
    "requiredCapacity",
    "Required_Capacity"
  );

  const warehouseName = getValue(
    "warehouse_name",
    "warehouseName",
    "Warehouse_Name"
  );

  const warehouseId = getValue(
    "warehouse_id",
    "warehouseId",
    "Warehouse_ID"
  );

  return (
    <div style={styles.dashboard}>

      {/* HEADER */}

      <header style={styles.header}>
        <div>
          <h1 style={styles.headerTitle}>
            🏭 Warehouse Prediction
          </h1>

          <p style={styles.headerSubtitle}>
            Smart Crop Procurement Planning System
          </p>
        </div>

        <button
          onClick={goBack}
          style={styles.back}
        >
          ← Back
        </button>
      </header>

      {/* MAIN */}

      <main style={styles.container}>

        <div style={styles.card}>

          <h2 style={styles.title}>
            Warehouse Capacity Prediction
          </h2>

          <p style={styles.help}>
            Estimate the warehouse capacity
            required for the selected district
            and crop quantity.
          </p>

          {/* ERROR */}

          {error && (
            <div style={styles.error}>
              ⚠️ {error}
            </div>
          )}

          {/* FORM */}

          <form onSubmit={handlePredict}>

            <label style={styles.label}>
              District
            </label>

            <input
              type="text"
              value={district}
              onChange={(e) =>
                setDistrict(e.target.value)
              }
              placeholder="Enter district"
              style={styles.input}
              disabled={loading}
            />

            <label style={styles.label}>
              Quantity (Tons)
            </label>

            <input
              type="number"
              min="0.01"
              step="0.01"
              value={quantity}
              onChange={(e) =>
                setQuantity(e.target.value)
              }
              placeholder="Enter crop quantity"
              style={styles.input}
              disabled={loading}
            />

            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.button,
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading
                ? "Calculating..."
                : "Predict Warehouse Capacity"}
            </button>

          </form>

          {/* RESULT */}

          {result && (
            <div style={styles.result}>

              <h2 style={styles.resultTitle}>
                ✅ Warehouse Prediction Result
              </h2>

              <div style={styles.infoGrid}>

                <div style={styles.infoBox}>
                  <span style={styles.icon}>
                    📍
                  </span>

                  <div>
                    <small>District</small>

                    <strong>
                      {district}
                    </strong>
                  </div>
                </div>

                <div style={styles.infoBox}>
                  <span style={styles.icon}>
                    📦
                  </span>

                  <div>
                    <small>Required Quantity</small>

                    <strong>
                      {quantity} Tons
                    </strong>
                  </div>
                </div>

                {warehouseName !== null && (
                  <div style={styles.infoBox}>
                    <span style={styles.icon}>
                      🏭
                    </span>

                    <div>
                      <small>Warehouse</small>

                      <strong>
                        {warehouseName}
                      </strong>
                    </div>
                  </div>
                )}

                {warehouseId !== null && (
                  <div style={styles.infoBox}>
                    <span style={styles.icon}>
                      🔖
                    </span>

                    <div>
                      <small>Warehouse ID</small>

                      <strong>
                        {warehouseId}
                      </strong>
                    </div>
                  </div>
                )}

                {totalCapacity !== null && (
                  <div style={styles.infoBox}>
                    <span style={styles.icon}>
                      🏢
                    </span>

                    <div>
                      <small>Total Capacity</small>

                      <strong>
                        {totalCapacity} Tons
                      </strong>
                    </div>
                  </div>
                )}

                {currentLoad !== null && (
                  <div style={styles.infoBox}>
                    <span style={styles.icon}>
                      📊
                    </span>

                    <div>
                      <small>Current Load</small>

                      <strong>
                        {currentLoad} Tons
                      </strong>
                    </div>
                  </div>
                )}

                {availableCapacity !== null && (
                  <div style={styles.infoBox}>
                    <span style={styles.icon}>
                      ✅
                    </span>

                    <div>
                      <small>Available Capacity</small>

                      <strong>
                        {availableCapacity} Tons
                      </strong>
                    </div>
                  </div>
                )}

                {requiredCapacity !== null && (
                  <div style={styles.infoBox}>
                    <span style={styles.icon}>
                      📈
                    </span>

                    <div>
                      <small>Required Capacity</small>

                      <strong>
                        {requiredCapacity} Tons
                      </strong>
                    </div>
                  </div>
                )}

              </div>

              {/* RAW RESPONSE - ONLY IF NO KNOWN FIELDS */}

              {totalCapacity === null &&
                currentLoad === null &&
                availableCapacity === null &&
                requiredCapacity === null && (
                  <div style={styles.rawResult}>
                    <h3>Prediction Details</h3>

                    <pre style={styles.pre}>
                      {JSON.stringify(
                        result,
                        null,
                        2
                      )}
                    </pre>
                  </div>
                )}

            </div>
          )}

        </div>

      </main>
    </div>
  );
}

const styles = {
  dashboard: {
    minHeight: "100vh",
    background: "#f4f6f8",
    fontFamily: "Arial, sans-serif",
  },

  header: {
    background: "#1f4d3a",
    color: "white",
    padding: "20px 40px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  headerTitle: {
    margin: "0",
    fontSize: "28px",
  },

  headerSubtitle: {
    margin: "5px 0 0",
    fontSize: "14px",
    opacity: "0.85",
  },

  back: {
    padding: "10px 20px",
    border: "none",
    borderRadius: "7px",
    cursor: "pointer",
    background: "white",
    color: "#1f4d3a",
    fontWeight: "bold",
  },

  container: {
    display: "flex",
    justifyContent: "center",
    padding: "40px 20px",
    boxSizing: "border-box",
  },

  card: {
    width: "800px",
    maxWidth: "100%",
    background: "white",
    padding: "30px",
    borderRadius: "14px",
    boxShadow:
      "0 4px 18px rgba(0,0,0,0.1)",
    boxSizing: "border-box",
  },

  title: {
    color: "#1f4d3a",
    marginTop: "0",
    marginBottom: "8px",
  },

  help: {
    color: "#666",
    lineHeight: "1.5",
    marginBottom: "25px",
  },

  label: {
    display: "block",
    marginTop: "17px",
    marginBottom: "7px",
    fontWeight: "bold",
    color: "#333",
  },

  input: {
    width: "100%",
    padding: "12px",
    border: "1px solid #ccd5d0",
    borderRadius: "7px",
    fontSize: "15px",
    boxSizing: "border-box",
  },

  button: {
    width: "100%",
    marginTop: "25px",
    padding: "13px",
    background: "#1f4d3a",
    color: "white",
    border: "none",
    borderRadius: "7px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "bold",
  },

  error: {
    padding: "12px",
    color: "#c0392b",
    background: "#ffecec",
    borderRadius: "7px",
    border: "1px solid #f5c6c6",
    marginBottom: "20px",
  },

  result: {
    marginTop: "30px",
    padding: "25px",
    background: "#eef7ee",
    borderRadius: "10px",
    border: "1px solid #d5e8d5",
  },

  resultTitle: {
    color: "#1f4d3a",
    marginTop: "0",
  },

  infoGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "15px",
    marginTop: "20px",
  },

  infoBox: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    background: "white",
    padding: "15px",
    borderRadius: "8px",
    border: "1px solid #dce7e0",
  },

  icon: {
    fontSize: "28px",
  },

  rawResult: {
    marginTop: "20px",
    padding: "15px",
    background: "#fff",
    borderRadius: "8px",
  },

  pre: {
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    fontSize: "13px",
  },
};

export default WarehousePrediction;