import React, { useState } from "react";
import { API_BASE_URL as API } from "../apiConfig";

function ProcurementRequest({
  user,
  selectedCenter,
  selectedCrop,
  transportData,
  goBack,
  onRequestSent
}) {
  const savedPrediction = (() => {
    try {
      const raw = sessionStorage.getItem("latestCropPrediction");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  const cropName =
    typeof selectedCrop === "string" && selectedCrop.trim() !== ""
      ? selectedCrop
      : typeof selectedCrop === "object" && selectedCrop !== null
      ? selectedCrop.crop || selectedCrop.crop_name || selectedCrop.name || selectedCrop.selectedCrop || ""
      : savedPrediction?.crop ||
        savedPrediction?.crop_name ||
        user?.primary_crop ||
        user?.crop ||
        selectedCenter?.crop ||
        "";

  const initialQuantity = (() => {
    const raw =
      transportData?.quantity ??
      transportData?.production ??
      transportData?.estimated_production ??
      (typeof selectedCrop === "object" && selectedCrop !== null
        ? selectedCrop.estimated_production ??
          selectedCrop.estimatedProduction ??
          selectedCrop.predicted_production ??
          selectedCrop.predictedProduction ??
          selectedCrop.production ??
          selectedCrop.quantity
        : null) ??
      savedPrediction?.estimated_production ??
      savedPrediction?.estimatedProduction ??
      savedPrediction?.predicted_production ??
      savedPrediction?.predictedProduction ??
      savedPrediction?.production ??
      "";
    return raw !== null && raw !== undefined ? String(raw) : "";
  })();

  const initialTransportCost = (() => {
    const raw =
      transportData?.totalCost ??
      transportData?.total_cost ??
      transportData?.transport_cost ??
      "";
    return raw !== null && raw !== undefined ? String(raw) : "";
  })();

  const [quantity, setQuantity] = useState(initialQuantity);
  const [vehicle, setVehicle] = useState(transportData?.vehicle || transportData?.vehicleType || "Medium Truck");
  const [transportCost, setTransportCost] = useState(initialTransportCost);

  const [distanceKm] = useState(
    transportData?.oneWayDistance ??
      transportData?.distance ??
      selectedCenter?.distance_km ??
      selectedCenter?.distance ??
      0
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =====================================================
  // FARMER DATA - used only for backend request
  // =====================================================

  const farmerName =
    user?.full_name ||
    user?.name ||
    user?.farmer_name ||
    user?.username ||
    "Farmer";

  const farmerId =
    user?.id ||
    user?.user_id ||
    user?.userId ||
    user?.farmer_id ||
    user?.farmerId ||
    "";

  const mobileNumber =
    user?.mobile_number ||
    user?.mobile ||
    user?.phone ||
    "";

  const district =
    user?.district ||
    user?.District ||
    selectedCenter?.district ||
    "";

  // =====================================================
  // CENTER DATA
  // =====================================================

  const centerId =
    selectedCenter?.center_id ||
    selectedCenter?.id ||
    selectedCenter?.Center_ID ||
    "";

  const centerName =
    selectedCenter?.center_name ||
    selectedCenter?.name ||
    selectedCenter?.Procurement_Center_Name ||
    "Procurement Center";

  const centerDistrict =
    selectedCenter?.district ||
    selectedCenter?.center_district ||
    selectedCenter?.District ||
    district ||
    "";

  const centerLocation =
    selectedCenter?.location ||
    selectedCenter?.center_location ||
    selectedCenter?.Location ||
    selectedCenter?.address ||
    selectedCenter?.mandal ||
    selectedCenter?.village ||
    "-";

  const crop = cropName;

  const totalCapacity =
    selectedCenter?.total_capacity ??
    selectedCenter?.capacity ??
    selectedCenter?.capacity_tons ??
    "-";

  const availableCapacity =
    selectedCenter?.available_capacity ??
    selectedCenter?.available_capacity_tons ??
    "-";

  // =====================================================
  // SUBMIT REQUEST
  // =====================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    console.log("Send Request clicked");

    if (!selectedCenter || !centerId) {
      setError(
        "Please select a procurement center first."
      );
      return;
    }

    if (!crop) {
      setError("Please select a crop first.");
      return;
    }

    const numericQuantity = Number(quantity);

    if (
      !quantity ||
      Number.isNaN(numericQuantity) ||
      numericQuantity <= 0
    ) {
      setError(
        "Please enter a valid procurement quantity."
      );
      return;
    }

    const numericFarmerId = Number(farmerId) || farmerId;
    const numericDistance = Number(distanceKm) || 0;
    const numericTransportCost = Number(transportCost) || 0;

    const payload = {
      farmer_id: numericFarmerId,
      farmer_name: String(farmerName || ""),
      mobile_number: String(mobileNumber || ""),
      district: String(district || ""),

      crop: String(crop || ""),
      quantity: numericQuantity,

      center_id: String(centerId),
      center_name: String(centerName || ""),
      center_district: String(centerDistrict || ""),
      center_location: String(centerLocation || ""),

      distance_km: numericDistance,
      vehicle: String(vehicle || "Medium Truck"),

      transport_cost: numericTransportCost,
      total_cost: numericTransportCost
    };

    console.log("Request payload:", payload);

    setLoading(true);

    try {
      const response = await fetch(
        `${API}/api/procurement-requests`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        }
      );

      const result = await response.json();
      console.log("Request response:", result);

      if (!response.ok || result?.success === false) {
        setError(
          result?.message ||
            result?.error ||
            "Unable to send procurement request."
        );
        return;
      }

      setSuccess(
        result?.message ||
          "Procurement request submitted successfully."
      );

      const requestData =
        result?.request || {
          ...payload,
          status: "pending"
        };

      setTimeout(() => {
        if (
          typeof onRequestSent === "function"
        ) {
          onRequestSent(
            requestData
          );
        }
      }, 500);
    } catch (requestError) {
      console.error(
        "Request submission error:",
        requestError
      );

      setError(
        requestError?.message ||
          "Unable to send procurement request. Please verify connection to backend."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>

      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <div style={styles.header}>
        <div>
          <div style={styles.eyebrow}>
            PROCUREMENT REQUEST
          </div>

          <h1 style={styles.title}>
            Submit Procurement Request
          </h1>

          <p style={styles.subtitle}>
            Review the selected procurement center
            and enter your request details.
          </p>
        </div>

        {goBack && (
          <button
            type="button"
            onClick={goBack}
            style={styles.backButton}
          >
            ← Back
          </button>
        )}
      </div>

      <main style={styles.main}>

        {/* =================================================
            CENTER DETAILS
        ================================================= */}

        <section style={styles.centerCard}>

          <div style={styles.centerHeader}>
            <div style={styles.centerIcon}>
              🏢
            </div>

            <div>
              <div style={styles.smallHeading}>
                SELECTED PROCUREMENT CENTER
              </div>

              <h2 style={styles.centerName}>
                {centerName}
              </h2>
            </div>

            <div style={styles.statusBadge}>
              ● Available
            </div>
          </div>

          <div style={styles.centerGrid}>

            <CenterInfo
              label="Center ID"
              value={centerId || "-"}
            />

            <CenterInfo
              label="District"
              value={centerDistrict || "-"}
            />

            <CenterInfo
              label="Location"
              value={centerLocation || "-"}
            />

            <CenterInfo
              label="Distance"
              value={`${Number(
                distanceKm || 0
              ).toFixed(2)} KM`}
            />

            <CenterInfo
              label="Total Capacity"
              value={
                totalCapacity === "-"
                  ? "-"
                  : `${totalCapacity} Tons`
              }
            />

            <CenterInfo
              label="Available Capacity"
              value={
                availableCapacity === "-"
                  ? "-"
                  : `${availableCapacity} Tons`
              }
              highlight
            />

          </div>
        </section>

        {/* =================================================
            REQUEST DETAILS - NO CARD
        ================================================= */}

        <section style={styles.requestSection}>

          <div style={styles.requestHeading}>

            <div>
              <div style={styles.smallHeading}>
                REQUEST DETAILS
              </div>

              <h2 style={styles.requestTitle}>
                Enter Procurement Information
              </h2>
            </div>

            {crop && (
              <div style={styles.cropBadge}>
                {crop}
              </div>
            )}

          </div>

          {error && (
            <div style={styles.errorBox}>
              {error}
            </div>
          )}

          {success && (
            <div style={styles.successBox}>
              ✓ {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            <div style={styles.formGrid}>

              {/* CROP */}

              <div style={styles.field}>
                <label style={styles.label}>
                  Crop
                </label>

                <input
                  type="text"
                  value={crop || ""}
                  readOnly
                  style={styles.readOnlyInput}
                />
              </div>

              {/* QUANTITY */}

              <div style={styles.field}>
                <label style={styles.label}>
                  Quantity (Tons)
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={quantity}
                  onChange={(event) =>
                    setQuantity(
                      event.target.value
                    )
                  }
                  placeholder="Enter quantity"
                  style={styles.input}
                />
              </div>

              {/* VEHICLE */}

              <div style={styles.field}>
                <label style={styles.label}>
                  Vehicle
                </label>

                <select
                  value={vehicle}
                  onChange={(event) =>
                    setVehicle(
                      event.target.value
                    )
                  }
                  style={styles.input}
                >
                  <option value="Mini Truck">
                    Mini Truck
                  </option>

                  <option value="Medium Truck">
                    Medium Truck
                  </option>

                  <option value="Large Truck">
                    Large Truck
                  </option>

                  <option value="Heavy Truck">
                    Heavy Truck
                  </option>
                </select>
              </div>

              {/* TRANSPORT COST */}

              <div style={styles.field}>
                <label style={styles.label}>
                  Transport Cost (₹)
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={transportCost}
                  onChange={(event) =>
                    setTransportCost(
                      event.target.value
                    )
                  }
                  placeholder="Enter transport cost"
                  style={styles.input}
                />
              </div>

            </div>

            {/* SUBMIT */}

            <div style={styles.submitArea}>

              <p style={styles.note}>
                Your request will be sent to the
                procurement authority for approval.
              </p>

              <button
                type="submit"
                disabled={loading}
                style={{
                  ...styles.submitButton,
                  opacity: loading ? 0.7 : 1,
                  cursor:
                    loading
                      ? "not-allowed"
                      : "pointer"
                }}
              >
                {loading
                  ? "Submitting..."
                  : "Submit Procurement Request →"}
              </button>

            </div>

          </form>
        </section>

      </main>
    </div>
  );
}

/* =====================================================
   CENTER INFO COMPONENT
===================================================== */

function CenterInfo({
  label,
  value,
  highlight = false
}) {
  return (
    <div style={styles.infoItem}>

      <span style={styles.infoLabel}>
        {label}
      </span>

      <strong
        style={
          highlight
            ? styles.highlightValue
            : styles.infoValue
        }
      >
        {String(value)}
      </strong>

    </div>
  );
}

/* =====================================================
   STYLES
===================================================== */

const styles = {

  page: {
    width: "100%",
    minHeight: "100%",
    boxSizing: "border-box",
    color: "#183e2c",
    fontFamily:
      "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
  },

  /* HEADER */

  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "20px",
    marginBottom: "24px"
  },

  eyebrow: {
    marginBottom: "7px",
    color: "#2f805b",
    fontSize: "13px",
    fontWeight: "900",
    letterSpacing: "1.5px"
  },

  title: {
    margin: 0,
    color: "#123e2b",
    fontSize: "34px",
    fontWeight: "800",
    letterSpacing: "-0.7px"
  },

  subtitle: {
    margin: "8px 0 0",
    color: "#718279",
    fontSize: "16px",
    lineHeight: "1.5"
  },

  backButton: {
    padding: "11px 18px",
    border: "1px solid #d3e1d8",
    borderRadius: "10px",
    background: "#ffffff",
    color: "#246044",
    fontSize: "14px",
    fontWeight: "800",
    cursor: "pointer"
  },

  main: {
    display: "grid",
    gap: "28px"
  },

  /* CENTER CARD */

  centerCard: {
    padding: "26px",
    border: "1px solid #dbe8df",
    borderRadius: "18px",
    background: "#ffffff",
    boxShadow:
      "0 10px 30px rgba(18, 69, 46, 0.07)"
  },

  centerHeader: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "22px"
  },

  centerIcon: {
    width: "52px",
    height: "52px",
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
    borderRadius: "14px",
    background: "#eaf5ee",
    fontSize: "24px"
  },

  smallHeading: {
    color: "#34805e",
    fontSize: "12px",
    fontWeight: "900",
    letterSpacing: "1.2px"
  },

  centerName: {
    margin: "4px 0 0",
    color: "#173f2d",
    fontSize: "24px",
    fontWeight: "800"
  },

  statusBadge: {
    marginLeft: "auto",
    padding: "9px 14px",
    borderRadius: "999px",
    background: "#edf8f0",
    color: "#23804c",
    fontSize: "13px",
    fontWeight: "800"
  },

  centerGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",
    gap: "12px"
  },

  infoItem: {
    minWidth: 0,
    padding: "16px",
    border: "1px solid #e3ece6",
    borderRadius: "12px",
    background: "#f9fcfa"
  },

  infoLabel: {
    display: "block",
    marginBottom: "7px",
    color: "#7b8c82",
    fontSize: "12px",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: "0.5px"
  },

  infoValue: {
    display: "block",
    color: "#254b37",
    fontSize: "16px",
    fontWeight: "800",
    overflowWrap: "anywhere"
  },

  highlightValue: {
    display: "block",
    color: "#1c844d",
    fontSize: "16px",
    fontWeight: "900"
  },

  /* REQUEST - NO CARD */

  requestSection: {
    padding: "4px 6px 10px"
  },

  requestHeading: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    marginBottom: "22px"
  },

  requestTitle: {
    margin: "5px 0 0",
    color: "#173f2d",
    fontSize: "25px",
    fontWeight: "800"
  },

  cropBadge: {
    padding: "9px 16px",
    borderRadius: "999px",
    background: "#edf6e6",
    color: "#52742d",
    fontSize: "14px",
    fontWeight: "800"
  },

  /* FORM */

  formGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "20px"
  },

  field: {
    minWidth: 0
  },

  label: {
    display: "block",
    marginBottom: "9px",
    color: "#355844",
    fontSize: "15px",
    fontWeight: "800"
  },

  input: {
    width: "100%",
    height: "52px",
    boxSizing: "border-box",
    padding: "0 15px",
    border: "1px solid #d4e1d8",
    borderRadius: "11px",
    outline: "none",
    background: "#ffffff",
    color: "#244a36",
    colorScheme: "light",
    fontSize: "16px"
  },

  readOnlyInput: {
    width: "100%",
    height: "52px",
    boxSizing: "border-box",
    padding: "0 15px",
    border: "1px solid #dce6df",
    borderRadius: "11px",
    outline: "none",
    background: "#f4f8f5",
    color: "#355844",
    colorScheme: "light",
    fontSize: "16px",
    fontWeight: "700"
  },

  /* SUBMIT */

  submitArea: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "20px",
    marginTop: "28px",
    paddingTop: "22px",
    borderTop: "1px solid #e8efea"
  },

  note: {
    maxWidth: "520px",
    margin: 0,
    color: "#75877d",
    fontSize: "14px",
    lineHeight: "1.6"
  },

  submitButton: {
    minHeight: "52px",
    padding: "0 26px",
    border: "none",
    borderRadius: "11px",
    background:
      "linear-gradient(135deg, #176b48, #25875f)",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: "900",
    boxShadow:
      "0 10px 22px rgba(24, 107, 72, 0.18)"
  },

  /* MESSAGES */

  errorBox: {
    marginBottom: "20px",
    padding: "13px 15px",
    border: "1px solid #f0cbc7",
    borderRadius: "10px",
    background: "#fff4f2",
    color: "#a3443b",
    fontSize: "14px",
    fontWeight: "600"
  },

  successBox: {
    marginBottom: "20px",
    padding: "13px 15px",
    border: "1px solid #cce7d5",
    borderRadius: "10px",
    background: "#f0faf3",
    color: "#236b43",
    fontSize: "14px",
    fontWeight: "700"
  }
};

export default ProcurementRequest;