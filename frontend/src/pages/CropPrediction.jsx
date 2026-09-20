import React, { useState } from "react";
import axios from "axios";

const API = "http://127.0.0.1:5000/api";

function CropPrediction({ user, goBack, onCropSelected }) {
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

      const productionTons = Number(predictedValue);

      setPrediction(productionTons);

      // Preserve hectares and predicted tons as different values.
      // Transport must use predicted_production, never area.
      if (Number.isFinite(productionTons) && productionTons > 0) {
        const predictionPayload = {
          crop,
          crop_name: crop,
          district,
          season,
          year: Number(year),
          area: Number(area),
          predicted_production: productionTons,
          estimated_production: productionTons,
          production: productionTons,
          quantity_tons: productionTons,
        };

        // Keep a browser-session copy so the transport page can recover
        // the prediction even if an intermediate page only passes crop name.
        sessionStorage.setItem(
          "latestCropPrediction",
          JSON.stringify(predictionPayload)
        );

        if (onCropSelected) {
          onCropSelected(predictionPayload);
        }
      }

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
      <div style={styles.hero}>
        <div>
          <div style={styles.eyebrow}>SMART AGRICULTURE • AI PRODUCTION ESTIMATE</div>
          <h1 style={styles.heroTitle}>Crop Production Prediction</h1>
          <p style={styles.heroText}>
            Enter crop cultivation details to estimate expected production.
            Your prediction result appears on the right after calculation.
          </p>
        </div>

        {goBack && (
          <button type="button" onClick={goBack} style={styles.backButton}>
            ← Back
          </button>
        )}
      </div>

      <div style={styles.workspace}>
        <section style={styles.formCard}>
          <div style={styles.sectionHeader}>
            <div style={styles.sectionIcon}>🌾</div>
            <div>
              <div style={styles.sectionKicker}>PRODUCTION INPUTS</div>
              <h2 style={styles.sectionTitle}>Crop Details</h2>
            </div>
          </div>

          <p style={styles.sectionText}>
            Provide the cultivation details below. District is taken from your
            registered location and is used only as a prediction input.
          </p>

          {error && <div style={styles.error}>{error}</div>}

          <form onSubmit={predict}>
            <div style={styles.field}>
              <label style={styles.label}>District</label>
              <div style={styles.readOnlyField}>
                <span style={styles.fieldIcon}>⌖</span>
                <span>{district || "District unavailable"}</span>
              </div>
            </div>

            <div style={styles.twoColumns}>
              <div style={styles.field}>
                <label style={styles.label}>Crop</label>
                <select
                  value={crop}
                  onChange={(e) => setCrop(e.target.value)}
                  style={styles.input}
                >
                  <option value="Paddy">Paddy</option>
                  <option value="Black Gram">Black Gram</option>
                  <option value="Cotton">Cotton</option>
                  <option value="Green Gram">Green Gram</option>
                  <option value="Groundnut">Groundnut</option>
                  <option value="Maize">Maize</option>
                  <option value="Red Gram">Red Gram</option>
                  <option value="Sunflower">Sunflower</option>
                </select>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Season</label>
                <select
                  value={season}
                  onChange={(e) => setSeason(e.target.value)}
                  style={styles.input}
                >
                  <option value="Kharif">Kharif</option>
                  <option value="Rabi">Rabi</option>
                  <option value="Summer">Summer</option>
                  <option value="Whole Year">Whole Year</option>
                </select>
              </div>
            </div>

            <div style={styles.twoColumns}>
              <div style={styles.field}>
                <label style={styles.label}>Cultivated Area</label>
                <div style={styles.inputWithUnit}>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="Enter area"
                    style={styles.unitInput}
                  />
                  <span style={styles.unit}>hectares</span>
                </div>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Prediction Year</label>
                <input
                  type="number"
                  min="2000"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  style={styles.input}
                />
              </div>
            </div>

            <button type="submit" disabled={loading} style={{
              ...styles.predictButton,
              opacity: loading ? 0.72 : 1,
              cursor: loading ? "wait" : "pointer",
            }}>
              <span>{loading ? "Calculating prediction..." : "Predict Production"}</span>
              <span>{loading ? "⏳" : "→"}</span>
            </button>
          </form>

          <div style={styles.formFootnote}>
            Prediction uses district, crop, season, year and cultivated area.
          </div>
        </section>

        <aside style={styles.resultCard}>
          {prediction === null ? (
            <div style={styles.emptyResult}>
              <div style={styles.resultIllustration}>
                <span style={styles.plantStem}>│</span>
                <span style={styles.leafOne}>◖</span>
                <span style={styles.leafTwo}>◗</span>
                <span style={styles.grain}>●</span>
              </div>
              <div style={styles.resultKicker}>PREDICTION RESULT</div>
              <h2 style={styles.emptyTitle}>Your estimate will appear here</h2>
              <p style={styles.emptyText}>
                Complete the crop details and select Predict Production to view
                the estimated production with the submitted crop information.
              </p>
              <div style={styles.emptySteps}>
                <span style={styles.stepPill}>01 Crop</span>
                <span style={styles.stepPill}>02 Season</span>
                <span style={styles.stepPill}>03 Area</span>
              </div>
            </div>
          ) : (
            <div style={styles.resultContent}>
              <div style={styles.successBadge}>✓ PREDICTION COMPLETE</div>

              <p style={styles.resultKicker}>ESTIMATED PRODUCTION</p>

              <div style={styles.productionValue}>
                {Number(prediction).toFixed(2)}
              </div>
              <div style={styles.productionUnit}>production units</div>

              <div style={styles.resultDivider} />

              <div style={styles.resultGrid}>
                <ResultItem label="Crop" value={crop} />
                <ResultItem label="Season" value={season} />
                <ResultItem label="District" value={district || "-"} />
                <ResultItem label="Year" value={year} />
                <ResultItem label="Cultivated Area" value={`${area} hectares`} wide />
              </div>

              <div style={styles.resultNote}>
                <span style={styles.noteIcon}>i</span>
                <p>
                  This estimate can support your procurement planning. Actual
                  production may vary with field and seasonal conditions.
                </p>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function ResultItem({ label, value, wide = false }) {
  return (
    <div style={{
      ...styles.resultItem,
      gridColumn: wide ? "1 / -1" : "auto",
    }}>
      <span style={styles.resultLabel}>{label}</span>
      <strong style={styles.resultValue}>{value}</strong>
    </div>
  );
}

const styles = {
  page: {
    width: "100%",
    minHeight: "100%",
    boxSizing: "border-box",
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    color: "#173c2b",
  },
  hero: {
    marginBottom: 22,
    padding: "24px 28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 20,
    border: "1px solid #dce9e1",
    borderRadius: 20,
    background: "linear-gradient(120deg,#f7fbf8 0%,#eef7f1 68%,#f9f3e4 100%)",
    boxShadow: "0 10px 30px rgba(18,70,46,.06)",
  },
  eyebrow: {
    marginBottom: 7,
    color: "#2b7c58",
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: 1.5,
  },
  heroTitle: {
    margin: 0,
    color: "#113c29",
    fontSize: 29,
    lineHeight: 1.15,
    letterSpacing: "-.7px",
  },
  heroText: {
    maxWidth: 670,
    margin: "8px 0 0",
    color: "#6f8177",
    fontSize: 13,
    lineHeight: 1.6,
  },
  backButton: {
    flexShrink: 0,
    padding: "10px 15px",
    border: "1px solid #cfe0d5",
    borderRadius: 11,
    background: "rgba(255,255,255,.82)",
    color: "#245c42",
    fontWeight: 800,
    cursor: "pointer",
  },
  workspace: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.05fr) minmax(340px, .95fr)",
    gap: 22,
    alignItems: "stretch",
  },
  formCard: {
    padding: 26,
    border: "1px solid #e0e9e3",
    borderRadius: 20,
    background: "#fff",
    boxShadow: "0 12px 34px rgba(15,67,44,.07)",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: 13,
  },
  sectionIcon: {
    width: 48,
    height: 48,
    display: "grid",
    placeItems: "center",
    borderRadius: 14,
    background: "#eaf5ee",
    fontSize: 23,
  },
  sectionKicker: {
    color: "#2b8059",
    fontSize: 9,
    fontWeight: 900,
    letterSpacing: 1.25,
  },
  sectionTitle: {
    margin: "3px 0 0",
    color: "#153f2d",
    fontSize: 21,
  },
  sectionText: {
    margin: "15px 0 20px",
    color: "#78887f",
    fontSize: 12,
    lineHeight: 1.6,
  },
  twoColumns: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 14,
  },
  field: {
    marginBottom: 15,
  },
  label: {
    display: "block",
    marginBottom: 7,
    color: "#385a48",
    fontSize: 11,
    fontWeight: 800,
  },
  input: {
    width: "100%",
    height: 45,
    boxSizing: "border-box",
    padding: "0 12px",
    border: "1px solid #d6e1da",
    borderRadius: 11,
    outline: "none",
    background: "#fbfdfb",
    color: "#254735",
    fontSize: 12,
  },
  readOnlyField: {
    height: 45,
    boxSizing: "border-box",
    padding: "0 13px",
    display: "flex",
    alignItems: "center",
    gap: 9,
    border: "1px solid #d8e4dc",
    borderRadius: 11,
    background: "#f3f8f5",
    color: "#355b47",
    fontSize: 12,
    fontWeight: 700,
  },
  fieldIcon: {
    color: "#27805a",
    fontSize: 17,
  },
  inputWithUnit: {
    height: 45,
    display: "flex",
    alignItems: "center",
    border: "1px solid #d6e1da",
    borderRadius: 11,
    background: "#fbfdfb",
    overflow: "hidden",
  },
  unitInput: {
    minWidth: 0,
    flex: 1,
    height: "100%",
    boxSizing: "border-box",
    padding: "0 12px",
    border: 0,
    outline: "none",
    background: "transparent",
    color: "#254735",
    fontSize: 12,
  },
  unit: {
    padding: "0 12px",
    color: "#7a8b81",
    fontSize: 10,
    borderLeft: "1px solid #e1e9e4",
  },
  predictButton: {
    width: "100%",
    minHeight: 48,
    marginTop: 6,
    padding: "0 17px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    border: 0,
    borderRadius: 12,
    background: "linear-gradient(135deg,#176b48,#23875e)",
    color: "#fff",
    boxShadow: "0 10px 22px rgba(24,107,72,.20)",
    fontSize: 12,
    fontWeight: 850,
  },
  formFootnote: {
    marginTop: 13,
    color: "#8a9991",
    fontSize: 10,
    textAlign: "center",
  },
  error: {
    marginBottom: 16,
    padding: "11px 13px",
    border: "1px solid #f0c9c5",
    borderRadius: 10,
    background: "#fff4f2",
    color: "#a94438",
    fontSize: 11,
  },
  resultCard: {
    minHeight: 500,
    padding: 28,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    border: "1px solid #dce9e1",
    borderRadius: 20,
    background: "radial-gradient(circle at 82% 12%,rgba(227,187,78,.16),transparent 25%), linear-gradient(145deg,#123f2c 0%,#0c5237 100%)",
    boxShadow: "0 16px 38px rgba(11,70,45,.15)",
    color: "#fff",
  },
  emptyResult: {
    maxWidth: 360,
    textAlign: "center",
  },
  resultIllustration: {
    position: "relative",
    width: 110,
    height: 110,
    margin: "0 auto 23px",
    display: "grid",
    placeItems: "center",
    border: "1px solid rgba(255,255,255,.14)",
    borderRadius: "50%",
    background: "rgba(255,255,255,.07)",
    color: "#d9bd65",
    fontSize: 43,
  },
  plantStem: { position: "absolute", top: 38, left: 53, color: "#d9bd65" },
  leafOne: { position: "absolute", top: 41, left: 30, color: "#8bc69d" },
  leafTwo: { position: "absolute", top: 54, left: 56, color: "#a6d5ad" },
  grain: { position: "absolute", top: 24, left: 49, color: "#e4bd51", fontSize: 16 },
  resultKicker: {
    margin: "0 0 9px",
    color: "#b8d8c5",
    fontSize: 9,
    fontWeight: 900,
    letterSpacing: 1.5,
  },
  emptyTitle: {
    margin: 0,
    color: "#fff",
    fontSize: 23,
    lineHeight: 1.25,
  },
  emptyText: {
    margin: "12px auto 20px",
    color: "#c7d9cf",
    fontSize: 11,
    lineHeight: 1.7,
  },
  emptySteps: {
    display: "flex",
    justifyContent: "center",
    gap: 7,
    flexWrap: "wrap",
  },
  stepPill: {
    padding: "7px 10px",
    border: "1px solid rgba(255,255,255,.12)",
    borderRadius: 999,
    background: "rgba(255,255,255,.06)",
    color: "#dce9e2",
    fontSize: 9,
    fontWeight: 700,
  },
  resultContent: {
    width: "100%",
    alignSelf: "stretch",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
  successBadge: {
    width: "fit-content",
    marginBottom: 22,
    padding: "7px 10px",
    borderRadius: 999,
    background: "rgba(167,214,179,.13)",
    color: "#bfe2c8",
    fontSize: 9,
    fontWeight: 900,
    letterSpacing: 1,
  },
  productionValue: {
    color: "#fff",
    fontSize: 56,
    lineHeight: 1,
    fontWeight: 900,
    letterSpacing: "-2px",
  },
  productionUnit: {
    marginTop: 6,
    color: "#c2d8cc",
    fontSize: 11,
  },
  resultDivider: {
    height: 1,
    margin: "24px 0",
    background: "rgba(255,255,255,.12)",
  },
  resultGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
  },
  resultItem: {
    padding: "12px 13px",
    border: "1px solid rgba(255,255,255,.10)",
    borderRadius: 11,
    background: "rgba(255,255,255,.055)",
  },
  resultLabel: {
    display: "block",
    marginBottom: 4,
    color: "#9fc1af",
    fontSize: 9,
    fontWeight: 700,
  },
  resultValue: {
    color: "#fff",
    fontSize: 11,
    fontWeight: 800,
  },
  resultNote: {
    marginTop: 18,
    padding: "12px 13px",
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
    borderRadius: 11,
    background: "rgba(231,190,79,.10)",
    color: "#d8e4de",
    fontSize: 10,
    lineHeight: 1.55,
  },
  noteIcon: {
    width: 20,
    height: 20,
    flexShrink: 0,
    display: "grid",
    placeItems: "center",
    borderRadius: "50%",
    background: "#d7b657",
    color: "#123f2c",
    fontWeight: 900,
  },
};

export default CropPrediction;
