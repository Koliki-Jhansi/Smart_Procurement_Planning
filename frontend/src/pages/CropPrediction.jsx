import React, { useState } from "react";
import axios from "axios";

const API = "http://127.0.0.1:5000/api";

function CropPrediction({ user, goBack }) {
  const [crop, setCrop] = useState("Paddy");
  const [season, setSeason] = useState("Kharif");
  const [area, setArea] = useState("");
  const [year, setYear] = useState("2026");

  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Get district from logged-in farmer
  const district = (
  user?.district ||
  ""
).trim();

  // Get farmer name from possible login response fields
  const farmerName =
    user?.full_name ||
    user?.name ||
    user?.farmer_name ||
    "-";

  const predict = async (e) => {
    e.preventDefault();

    setError("");
    setPrediction(null);

    // ==========================================
    // VALIDATION
    // ==========================================

    if (!district) {
      setError(
        "District information is not available in your account."
      );
      return;
    }

    if (!area || Number(area) <= 0) {
      setError(
        "Please enter a valid cultivated area."
      );
      return;
    }

    if (!year || Number(year) < 2000) {
      setError(
        "Please enter a valid year."
      );
      return;
    }

    setLoading(true);

    try {
      const requestData = {
        district: district,
        crop: crop,
        season: season,
        year: Number(year),
        area: Number(area),
      };

      console.log(
        "================================="
      );

      console.log(
        "Sending prediction request:"
      );

      console.log(
        "URL:",
        `${API}/predict`
      );

      console.log(
        "Data:",
        requestData
      );

      console.log(
        "================================="
      );

      // ==========================================
      // SEND REQUEST
      // ==========================================

      const response = await axios.post(
        `${API}/predict`,
        requestData,
        {
          headers: {
            "Content-Type": "application/json",
          },

          timeout: 10000,
        }
      );

      console.log(
        "Prediction response:",
        response.data
      );

      // ==========================================
      // GET PREDICTION VALUE
      // ==========================================

      const predictedValue =
        response.data?.predicted_production ??
        response.data?.predictedProduction ??
        response.data?.production ??
        response.data?.prediction;

      if (
        predictedValue === undefined ||
        predictedValue === null
      ) {
        setError(
          "Server responded, but no production prediction was returned."
        );

        return;
      }

      setPrediction(
        Number(predictedValue)
      );

    } catch (err) {
      console.error(
        "Crop prediction error:",
        err
      );

      // ==========================================
      // SERVER RESPONDED
      // ==========================================

      if (err.response) {
        console.error(
          "Status:",
          err.response.status
        );

        console.error(
          "Response:",
          err.response.data
        );

        setError(
          err.response.data?.message ||
          err.response.data?.error ||
          `Prediction failed. Server returned status ${err.response.status}.`
        );
      }

      // ==========================================
      // REQUEST SENT BUT NO RESPONSE
      // ==========================================

      else if (err.request) {
        console.error(
          "No response received:",
          err.request
        );

        setError(
          "Unable to connect to Flask server. Please make sure Flask is running on http://127.0.0.1:5000."
        );
      }

      // ==========================================
      // OTHER ERROR
      // ==========================================

      else {
        setError(
          err.message ||
          "Something went wrong while sending the prediction request."
        );
      }

    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>

      {/* =========================================
          TOP BAR
      ========================================= */}

      <div style={styles.topBar}>

        <button
          onClick={goBack}
          style={styles.back}
        >
          ← Back
        </button>

        <h1 style={styles.title}>
          Farmer Dashboard
        </h1>

      </div>

      {/* =========================================
          MAIN CARD
      ========================================= */}

      <div style={styles.card}>

        <h2 style={styles.heading}>
          🌾 Crop Production Prediction
        </h2>

        <p style={styles.description}>
          Enter your crop details to estimate
          expected production.
        </p>

        {/* =====================================
            FARMER INFORMATION
        ===================================== */}

        <div style={styles.userInfo}>

          <p>
            <b>Farmer:</b>{" "}
            {farmerName}
          </p>

          <p>
            <b>District:</b>{" "}
            {district || "-"}
          </p>

          <p>
            <b>Mobile:</b>{" "}
            {user?.mobile_number || "-"}
          </p>

        </div>

        {/* =====================================
            ERROR
        ===================================== */}

        {error && (
          <div style={styles.error}>
            ❌ {error}
          </div>
        )}

        {/* =====================================
            FORM
        ===================================== */}

        <form onSubmit={predict}>

          {/* DISTRICT */}

          <label style={styles.label}>
            District
          </label>

          <input
            type="text"
            value={district}
            readOnly
            style={styles.inputReadOnly}
          />

          {/* CROP */}

          <label style={styles.label}>
            Crop
          </label>

          <select
            value={crop}
            onChange={(e) =>
              setCrop(e.target.value)
            }
            style={styles.input}
          >

            <option value="Paddy">
              Paddy
            </option>

            <option value="Black Gram">
              Black Gram
            </option>

            <option value="Cotton">
              Cotton
            </option>

            <option value="Green Gram">
              Green Gram
            </option>

            <option value="Groundnut">
              Groundnut
            </option>

            <option value="Maize">
              Maize
            </option>

            <option value="Red Gram">
              Red Gram
            </option>

            <option value="Sunflower">
              Sunflower
            </option>

          </select>

          {/* SEASON */}

          <label style={styles.label}>
            Season
          </label>

          <select
            value={season}
            onChange={(e) =>
              setSeason(e.target.value)
            }
            style={styles.input}
          >

            <option value="Kharif">
              Kharif
            </option>

            <option value="Rabi">
              Rabi
            </option>

            <option value="Summer">
              Summer
            </option>

          </select>

          {/* YEAR */}

          <label style={styles.label}>
            Year
          </label>

          <input
            type="number"
            min="2000"
            max="2100"
            value={year}
            onChange={(e) =>
              setYear(e.target.value)
            }
            style={styles.input}
          />

          {/* AREA */}

          <label style={styles.label}>
            Cultivated Area (Hectares)
          </label>

          <input
            type="number"
            min="0.01"
            step="0.01"
            value={area}
            onChange={(e) =>
              setArea(e.target.value)
            }
            placeholder="Enter cultivated area"
            style={styles.input}
          />

          {/* PREDICT BUTTON */}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              opacity: loading ? 0.7 : 1,
            }}
          >

            {loading
              ? "⏳ Predicting..."
              : "🌾 Predict Production"}

          </button>

        </form>

        {/* =====================================
            RESULT
        ===================================== */}

        {prediction !== null && (

          <div style={styles.result}>

            <h2>
              ✅ Prediction Result
            </h2>

            <div style={styles.resultRow}>
              <span>Farmer</span>

              <b>
                {farmerName}
              </b>
            </div>

            <div style={styles.resultRow}>
              <span>District</span>

              <b>
                {district}
              </b>
            </div>

            <div style={styles.resultRow}>
              <span>Crop</span>

              <b>
                {crop}
              </b>
            </div>

            <div style={styles.resultRow}>
              <span>Season</span>

              <b>
                {season}
              </b>
            </div>

            <div style={styles.resultRow}>
              <span>Year</span>

              <b>
                {year}
              </b>
            </div>

            <div style={styles.resultRow}>
              <span>Cultivated Area</span>

              <b>
                {area} hectares
              </b>
            </div>

            <hr />

            <div style={styles.production}>

              <span>
                Estimated Production
              </span>

              <strong>
                {Number(prediction).toFixed(2)}
              </strong>

            </div>

            <p style={styles.note}>
              This estimated production will be
              used when planning procurement from
              suitable procurement centers.
            </p>

          </div>

        )}

      </div>

    </div>
  );
}


// =================================================
// STYLES
// =================================================

const styles = {

  page: {
    minHeight: "100vh",
    background: "#f4f6f8",
    fontFamily: "Arial, sans-serif",
    paddingBottom: "40px",
  },

  topBar: {
    background: "#1f4d3a",
    color: "white",
    padding: "18px 40px",
    display: "flex",
    alignItems: "center",
    gap: "25px",
  },

  title: {
    margin: 0,
    fontSize: "24px",
  },

  back: {
    padding: "10px 18px",
    background: "white",
    color: "#1f4d3a",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
  },

  card: {
    width: "600px",
    maxWidth: "calc(100% - 40px)",
    margin: "35px auto",
    background: "white",
    padding: "30px",
    borderRadius: "12px",
    boxShadow:
      "0 3px 15px rgba(0,0,0,0.1)",
    boxSizing: "border-box",
  },

  heading: {
    marginTop: 0,
    color: "#1f4d3a",
  },

  description: {
    color: "#666",
    lineHeight: "1.5",
  },

  userInfo: {
    background: "#f4f7f5",
    padding: "15px",
    borderRadius: "8px",
    margin: "20px 0",
  },

  label: {
    display: "block",
    marginTop: "15px",
    marginBottom: "6px",
    fontWeight: "bold",
    color: "#333",
  },

  input: {
    width: "100%",
    padding: "11px",
    border: "1px solid #ccc",
    borderRadius: "6px",
    fontSize: "15px",
    boxSizing: "border-box",
  },

  inputReadOnly: {
    width: "100%",
    padding: "11px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    fontSize: "15px",
    boxSizing: "border-box",
    background: "#f1f1f1",
    color: "#555",
  },

  button: {
    width: "100%",
    padding: "13px",
    marginTop: "25px",
    background: "#1f4d3a",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "bold",
  },

  error: {
    background: "#ffecec",
    color: "#b42323",
    padding: "12px",
    borderRadius: "6px",
    marginBottom: "15px",
  },

  result: {
    marginTop: "30px",
    padding: "22px",
    background: "#eef7ee",
    borderRadius: "10px",
    borderLeft: "5px solid #1f4d3a",
  },

  resultRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
    padding: "8px 0",
    borderBottom: "1px solid #d8e8d8",
  },

  production: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "15px",
    fontSize: "18px",
    color: "#1f4d3a",
  },

  note: {
    marginTop: "15px",
    fontSize: "13px",
    color: "#666",
  },

};

export default CropPrediction;