import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL as API } from "../apiConfig";

function ProcurementPlanning({
  user,
  selectedCrop,
  goBack,
  goToTransport,
}) {
  const [centers, setCenters] = useState([]);
  const [selectedCenter, setSelectedCenter] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // =====================================================
  // FARMER DETAILS
  // =====================================================

  const farmerDistrict =
    user?.district ||
    user?.District ||
    "";

  const farmerName =
    user?.full_name ||
    user?.name ||
    user?.farmer_name ||
    user?.username ||
    "Farmer";

  // =====================================================
  // SELECTED CROP
  // =====================================================

  const crop =
    selectedCrop ||
    user?.primary_crop ||
    user?.crop ||
    user?.Crop ||
    "";

  // =====================================================
  // GET CENTER ID SAFELY
  // =====================================================

  const getCenterId = (center) => {
    if (!center) return "";

    return (
      center.id ||
      center.center_id ||
      center.Center_ID ||
      center.centerId ||
      ""
    );
  };

  // =====================================================
  // LOAD PROCUREMENT CENTERS
  // =====================================================

  useEffect(() => {
    const loadCenters = async () => {
      setError("");

      if (!farmerDistrict) {
        setError(
          "District information is missing. Please login again."
        );
        return;
      }

      setLoading(true);

      try {
        const response = await axios.get(
          `${API}/api/procurement/centers`,
          {
            params: {
              district: farmerDistrict,
              crop: crop,
            },
            timeout: 15000,
          }
        );

        console.log(
          "Procurement centers response:",
          response.data
        );

        const responseCenters =
          response.data?.centers ||
          response.data?.data ||
          response.data ||
          [];

        if (Array.isArray(responseCenters)) {
          setCenters(responseCenters);
        } else {
          setCenters([]);
        }
      } catch (err) {
        console.error(
          "Error loading procurement centers:",
          err
        );

        if (err.response) {
          setError(
            err.response.data?.message ||
              err.response.data?.error ||
              `Server returned status ${err.response.status}.`
          );
        } else if (err.request) {
          setError(
            "Unable to load procurement centers. Please check your connection or try again later."
          );
        } else {
          setError(
            "Unable to load procurement centers."
          );
        }

        setCenters([]);
      } finally {
        setLoading(false);
      }
    };

    loadCenters();
  }, [farmerDistrict, crop]);

  // =====================================================
  // SELECT CENTER
  // =====================================================

  const handleSelectCenter = (center) => {
    setSelectedCenter(center);

    console.log(
      "Selected procurement center:",
      center
    );
  };

  // =====================================================
  // CONTINUE TO TRANSPORT
  // =====================================================

  const handleContinue = () => {
    if (!selectedCenter) {
      setError(
        "Please select a procurement center first."
      );
      return;
    }

    if (goToTransport) {
      goToTransport(selectedCenter);
    }
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <p style={styles.headerLabel}>
            SMART PROCUREMENT SYSTEM
          </p>

          <h1 style={styles.headerTitle}>
            Procurement Centers
          </h1>

          <p style={styles.headerSubtitle}>
            Select a procurement center for your crop.
          </p>
        </div>

        <button
          onClick={goBack}
          style={styles.backButton}
        >
          ← Back
        </button>
      </header>

      <main style={styles.container}>
        {/* ================================================= */}
        {/* FARMER INFORMATION */}
        {/* ================================================= */}

        <section style={styles.infoGrid}>
          <div style={styles.infoCard}>
            <span style={styles.infoLabel}>
              FARMER
            </span>

            <h2>
              👨‍🌾 {farmerName}
            </h2>

            <p>
              📍 {farmerDistrict || "District not available"}
            </p>
          </div>

          <div style={styles.infoCard}>
            <span style={styles.infoLabel}>
              SELECTED CROP
            </span>

            <h2>
              🌾 {crop || "Crop not selected"}
            </h2>

            <p>
              Procurement centers are recommended
              based on your district and crop.
            </p>
          </div>
        </section>

        {/* ================================================= */}
        {/* ERROR */}
        {/* ================================================= */}

        {error && (
          <div style={styles.errorBox}>
            <strong>
              Unable to continue
            </strong>

            <p>
              {error}
            </p>
          </div>
        )}

        {/* ================================================= */}
        {/* LOADING */}
        {/* ================================================= */}

        {loading && (
          <div style={styles.loadingBox}>
            Loading procurement centers...
          </div>
        )}

        {/* ================================================= */}
        {/* CENTERS */}
        {/* ================================================= */}

        {!loading && centers.length > 0 && (
          <section>
            <div style={styles.sectionHeader}>
              <div>
                <p style={styles.sectionLabel}>
                  AVAILABLE CENTERS
                </p>

                <h2>
                  Select a Procurement Center
                </h2>
              </div>

              <span style={styles.countBadge}>
                {centers.length} Centers
              </span>
            </div>

            <div style={styles.centerGrid}>
              {centers.map((center, index) => {
                const centerId =
                  getCenterId(center) || index;

                const isSelected =
                  getCenterId(selectedCenter) ===
                  getCenterId(center);

                const centerName =
                  center.name ||
                  center.center_name ||
                  center.Procurement_Center_Name ||
                  "Procurement Center";

                const location =
                  center.location ||
                  center.village ||
                  center.address ||
                  center.mandal ||
                  "";

                const district =
                  center.district ||
                  center.District ||
                  farmerDistrict ||
                  "";

                const distance =
                  center.distance_km ??
                  center.distance ??
                  0;

                const availableCapacity =
                  center.available_capacity ??
                  center.capacity ??
                  center.total_capacity ??
                  0;

                return (
                  <div
                    key={centerId}
                    style={{
                      ...styles.centerCard,
                      ...(isSelected
                        ? styles.selectedCard
                        : {}),
                    }}
                  >
                    <div style={styles.centerTop}>
                      <div>
                        <p style={styles.centerLabel}>
                          PROCUREMENT CENTER
                        </p>

                        <h2 style={styles.centerName}>
                          🏢 {centerName}
                        </h2>
                      </div>

                      {isSelected && (
                        <span style={styles.selectedBadge}>
                          ✓ Selected
                        </span>
                      )}
                    </div>

                    <div style={styles.centerDetails}>
                      <p>
                        📍{" "}
                        <b>Location:</b>{" "}
                        {location || "-"}
                      </p>

                      <p>
                        🗺️{" "}
                        <b>District:</b>{" "}
                        {district || "-"}
                      </p>

                      <p>
                        🛣️{" "}
                        <b>Distance:</b>{" "}
                        {distance} KM
                      </p>

                      <p>
                        📦{" "}
                        <b>Available Capacity:</b>{" "}
                        {availableCapacity} Tons
                      </p>
                    </div>

                    <button
                      onClick={() =>
                        handleSelectCenter(center)
                      }
                      style={
                        isSelected
                          ? styles.selectedButton
                          : styles.selectButton
                      }
                    >
                      {isSelected
                        ? "✓ Selected"
                        : "Select Center"}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ================================================= */}
        {/* NO CENTERS */}
        {/* ================================================= */}

        {!loading &&
          !error &&
          centers.length === 0 && (
            <div style={styles.emptyBox}>
              <h2>
                No Procurement Centers Found
              </h2>

              <p>
                No procurement centers are currently
                available for this district.
              </p>
            </div>
          )}

        {/* ================================================= */}
        {/* SELECTED CENTER */}
        {/* ================================================= */}

        {selectedCenter && (
          <section style={styles.continueCard}>
            <div>
              <p style={styles.continueLabel}>
                CENTER SELECTED
              </p>

              <h2>
                ✓{" "}
                {selectedCenter.name ||
                  selectedCenter.center_name ||
                  "Procurement Center"}
              </h2>

              <p>
                You can now calculate transportation
                cost and send a procurement request.
              </p>
            </div>

            <button
              onClick={handleContinue}
              style={styles.continueButton}
            >
              Continue to Transportation →
            </button>
          </section>
        )}
      </main>
    </div>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f4f7f5",
    fontFamily: "Arial, sans-serif",
  },

  header: {
    background:
      "linear-gradient(135deg, #153f30, #286147)",
    color: "white",
    padding: "28px 7%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
  },

  headerLabel: {
    fontSize: "11px",
    letterSpacing: "1.5px",
    opacity: 0.75,
    margin: "0 0 7px",
  },

  headerTitle: {
    margin: "0 0 7px",
    fontSize: "30px",
  },

  headerSubtitle: {
    margin: 0,
    opacity: 0.85,
  },

  backButton: {
    padding: "11px 20px",
    background: "white",
    color: "#1f4d3a",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
  },

  container: {
    maxWidth: "1250px",
    margin: "auto",
    padding: "35px 25px 70px",
    boxSizing: "border-box",
  },

  infoGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px",
    marginBottom: "30px",
  },

  infoCard: {
    background: "white",
    padding: "24px",
    borderRadius: "15px",
    border: "1px solid #e6ece8",
    boxShadow:
      "0 4px 16px rgba(0,0,0,0.05)",
  },

  infoLabel: {
    fontSize: "11px",
    fontWeight: "bold",
    letterSpacing: "1px",
    color: "#6d8778",
  },

  errorBox: {
    background: "#fff0f0",
    color: "#a52d2d",
    border: "1px solid #f1cccc",
    padding: "18px",
    borderRadius: "10px",
    marginBottom: "20px",
  },

  loadingBox: {
    background: "white",
    padding: "25px",
    borderRadius: "12px",
    textAlign: "center",
    border: "1px solid #e6ece8",
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    gap: "20px",
  },

  sectionLabel: {
    fontSize: "11px",
    letterSpacing: "1px",
    color: "#6d8778",
    fontWeight: "bold",
    marginBottom: "6px",
  },

  countBadge: {
    background: "#e8f5ec",
    color: "#1f4d3a",
    padding: "9px 15px",
    borderRadius: "20px",
    fontWeight: "bold",
  },

  centerGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "20px",
  },

  centerCard: {
    background: "white",
    padding: "24px",
    borderRadius: "15px",
    border: "1px solid #e0e7e2",
    boxShadow:
      "0 4px 15px rgba(0,0,0,0.04)",
  },

  selectedCard: {
    border: "2px solid #2d8a4f",
    boxShadow:
      "0 8px 25px rgba(45,138,79,0.15)",
  },

  centerTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    alignItems: "flex-start",
  },

  centerLabel: {
    fontSize: "10px",
    letterSpacing: "1px",
    color: "#6d8778",
    fontWeight: "bold",
  },

  centerName: {
    marginTop: "6px",
    fontSize: "20px",
  },

  selectedBadge: {
    background: "#e4f6e9",
    color: "#1f7a3d",
    padding: "7px 10px",
    borderRadius: "15px",
    fontSize: "12px",
    fontWeight: "bold",
  },

  centerDetails: {
    margin: "20px 0",
    lineHeight: "1.8",
    color: "#444",
  },

  selectButton: {
    width: "100%",
    padding: "13px",
    border: "none",
    borderRadius: "8px",
    background: "#1f4d3a",
    color: "white",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "15px",
  },

  selectedButton: {
    width: "100%",
    padding: "13px",
    border: "none",
    borderRadius: "8px",
    background: "#2d8a4f",
    color: "white",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "15px",
  },

  emptyBox: {
    background: "white",
    padding: "40px",
    borderRadius: "15px",
    textAlign: "center",
    border: "1px solid #e6ece8",
  },

  continueCard: {
    marginTop: "35px",
    padding: "28px",
    borderRadius: "16px",
    background:
      "linear-gradient(135deg, #1f4d3a, #2d6a4f)",
    color: "white",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "30px",
  },

  continueLabel: {
    fontSize: "11px",
    letterSpacing: "1px",
    opacity: 0.75,
  },

  continueButton: {
    padding: "15px 24px",
    border: "none",
    borderRadius: "8px",
    background: "white",
    color: "#1f4d3a",
    cursor: "pointer",
    fontWeight: "bold",
    whiteSpace: "nowrap",
    fontSize: "15px",
  },
};

export default ProcurementPlanning;