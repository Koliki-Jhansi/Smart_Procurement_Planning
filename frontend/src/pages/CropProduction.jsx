import React, { useState } from "react";
import axios from "axios";

const API = "http://127.0.0.1:5000";

function CropProduction({ user, goBack, onPrediction }) {
  // Use logged-in farmer's district automatically
  const [district, setDistrict] = useState(
    user?.district || ""
  );

  const [crop, setCrop] = useState("");
  const [season, setSeason] = useState("");
  const [year, setYear] = useState("");
  const [area, setArea] = useState("");

  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const predictProduction = async (e) => {
    e.preventDefault();

    setError("");
    setPrediction(null);

    if (!district || !crop || !season || !year || !area) {
      setError("Please fill all fields.");
      return;
    }

    if (Number(area) <= 0) {
      setError("Area must be greater than 0.");
      return;
    }

    if (Number(year) < 2000) {
      setError("Please enter a valid year.");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${API}/api/predict`,
        {
          District: district,
          Crop: crop,
          Season: season,
          Year: Number(year),
          Area: Number(area),
        }
      );

      console.log("Crop prediction response:", response.data);

      const data = response.data;

      const value =
        data.predicted_production ??
        data.predictedProduction ??
        data.production ??
        data.prediction;

      if (
        value === undefined ||
        value === null ||
        value === ""
      ) {
        setError(
          "Prediction was received, but production value was not found in the server response."
        );
        return;
      }

      const numericPrediction = Number(value);

      if (Number.isNaN(numericPrediction)) {
        setError(
          "The server returned an invalid production value."
        );
        return;
      }

      setPrediction(numericPrediction);

      // Send prediction back to FarmerDashboard
      if (onPrediction) {
        onPrediction({
          district,
          crop,
          season,
          year: Number(year),
          area: Number(area),
          production: numericPrediction,
        });
      }
    } catch (err) {
      console.error("Crop prediction error:", err);

      if (err.response) {
        setError(
          err.response.data?.message ||
            err.response.data?.error ||
            `Prediction failed. Server returned ${err.response.status}.`
        );
      } else if (err.request) {
        setError(
          "Unable to connect to server. Make sure Flask is running on http://127.0.0.1:5000."
        );
      } else {
        setError(
          "Prediction failed. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.dashboard}>
      {/* HEADER */}
      <header style={styles.header}>
        <div>
          <h1 style={styles.headerTitle}>
            🌾 Crop Production Prediction
          </h1>

          <p style={styles.headerSubtitle}>
            Estimate your expected crop production
          </p>
        </div>

        <button
          onClick={goBack}
          style={styles.backButton}
        >
          ← Back
        </button>
      </header>

      {/* MAIN */}
      <main style={styles.container}>
        <div style={styles.card}>
          <h2>
            Crop Production Prediction
          </h2>

          <p style={styles.helpText}>
            Enter your crop details to predict
            the expected production.
          </p>

          {/* FARMER INFO */}
          <div style={styles.farmerInfo}>
            <h3>
              👨‍🌾 Farmer Information
            </h3>

            <p>
              <b>Name:</b>{" "}
              {user?.name ||
                user?.farmer_name ||
                "Farmer"}
            </p>

            <p>
              <b>Mobile:</b>{" "}
              {user?.mobile_number || "-"}
            </p>

            <p>
              <b>District:</b>{" "}
              {district || "Not available"}
            </p>
          </div>

          <form onSubmit={predictProduction}>
            {/* DISTRICT */}
            <label>District</label>

            <input
              type="text"
              value={district}
              onChange={(e) =>
                setDistrict(e.target.value)
              }
              placeholder="Enter district"
            />

            <small style={styles.note}>
              Your registered district is used for
              procurement center recommendations.
            </small>

            {/* CROP */}
            <label>Crop</label>

            <select
              value={crop}
              onChange={(e) =>
                setCrop(e.target.value)
              }
            >
              <option value="">
                Select Crop
              </option>

              <option value="Paddy">
                Paddy
              </option>

              <option value="Rice">
                Rice
              </option>

              <option value="Cotton">
                Cotton
              </option>

              <option value="Maize">
                Maize
              </option>

              <option value="Groundnut">
                Groundnut
              </option>

              <option value="Black Gram">
                Black Gram
              </option>

              <option value="Green Gram">
                Green Gram
              </option>

              <option value="Red Gram">
                Red Gram
              </option>

              <option value="Sunflower">
                Sunflower
              </option>
            </select>

            {/* SEASON */}
            <label>Season</label>

            <select
              value={season}
              onChange={(e) =>
                setSeason(e.target.value)
              }
            >
              <option value="">
                Select Season
              </option>

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
            <label>Year</label>

            <input
              type="number"
              value={year}
              onChange={(e) =>
                setYear(e.target.value)
              }
              placeholder="2026"
              min="2000"
              max="2100"
            />

            {/* AREA */}
            <label>
              Area (Hectares)
            </label>

            <input
              type="number"
              step="0.01"
              min="0.01"
              value={area}
              onChange={(e) =>
                setArea(e.target.value)
              }
              placeholder="Enter cultivated area"
            />

            {/* BUTTON */}
            <button
              type="submit"
              disabled={loading}
              style={styles.button}
            >
              {loading
                ? "⏳ Predicting..."
                : "🌾 Predict Production"}
            </button>
          </form>

          {/* ERROR */}
          {error && (
            <div style={styles.error}>
              <b>❌ Error</b>

              <p style={{ marginBottom: 0 }}>
                {error}
              </p>
            </div>
          )}

          {/* RESULT */}
          {prediction !== null && (
            <div style={styles.result}>
              <h2>
                ✅ Prediction Result
              </h2>

              <div style={styles.resultGrid}>
                <div style={styles.resultItem}>
                  <span>
                    District
                  </span>

                  <strong>
                    {district}
                  </strong>
                </div>

                <div style={styles.resultItem}>
                  <span>
                    Crop
                  </span>

                  <strong>
                    {crop}
                  </strong>
                </div>

                <div style={styles.resultItem}>
                  <span>
                    Season
                  </span>

                  <strong>
                    {season}
                  </strong>
                </div>

                <div style={styles.resultItem}>
                  <span>
                    Year
                  </span>

                  <strong>
                    {year}
                  </strong>
                </div>

                <div style={styles.resultItem}>
                  <span>
                    Cultivated Area
                  </span>

                  <strong>
                    {area} ha
                  </strong>
                </div>
              </div>

              <hr />

              <div style={styles.predictionBox}>
                <p>
                  Estimated Crop Production
                </p>

                <h1>
                  {Number(
                    prediction
                  ).toFixed(2)}
                </h1>

                <span>
                  Production Units
                </span>
              </div>

              <div style={styles.nextStep}>
                <h3>
                  📍 Next Step
                </h3>

                <p>
                  After viewing your predicted
                  production, go to{" "}
                  <b>
                    Procurement Centers
                  </b>{" "}
                  to find centers available in
                  your district.
                </p>
              </div>
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
    fontFamily: "Arial",
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
    margin: 0,
  },

  headerSubtitle: {
    margin: "5px 0 0",
    opacity: 0.9,
  },

  backButton: {
    padding: "10px 20px",
    background: "white",
    color: "#1f4d3a",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
  },

  container: {
    display: "flex",
    justifyContent: "center",
    padding: "40px 20px",
  },

  card: {
    width: "600px",
    maxWidth: "100%",
    background: "white",
    padding: "30px",
    borderRadius: "12px",
    boxShadow:
      "0 3px 15px rgba(0,0,0,0.1)",
    boxSizing: "border-box",
  },

  helpText: {
    color: "#666",
    lineHeight: "1.5",
    marginBottom: "20px",
  },

  farmerInfo: {
    background: "#eef5f1",
    borderLeft: "5px solid #1f4d3a",
    padding: "15px 18px",
    borderRadius: "8px",
    marginBottom: "20px",
  },

  note: {
    display: "block",
    color: "#777",
    marginTop: "5px",
    fontSize: "12px",
  },

  button: {
    width: "100%",
    marginTop: "25px",
    padding: "13px",
    background: "#1f4d3a",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "bold",
  },

  result: {
    marginTop: "25px",
    padding: "20px",
    background: "#eef7ee",
    borderRadius: "10px",
    borderLeft: "5px solid #1f4d3a",
  },

  resultGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "12px",
    marginTop: "15px",
  },

  resultItem: {
    background: "white",
    padding: "12px",
    borderRadius: "7px",
  },

  predictionBox: {
    textAlign: "center",
    background: "white",
    padding: "20px",
    borderRadius: "10px",
    marginTop: "15px",
  },

  predictionBox h1: {
    color: "#1f4d3a",
  },

  nextStep: {
    marginTop: "20px",
    padding: "15px",
    background: "#f5f8f6",
    borderRadius: "8px",
  },

  error: {
    marginTop: "20px",
    padding: "12px",
    background: "#fff0f0",
    color: "#c0392b",
    borderRadius: "6px",
  },
};

export default CropProduction;