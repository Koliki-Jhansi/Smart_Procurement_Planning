import React, { useEffect, useState } from "react";
import axios from "axios";

const API = "http://127.0.0.1:5000";

function TransportCost({
  user,
  selectedCenter,
  selectedCrop,
  goBack,
  onOpenProcurementRequest,
}) {
  const [quantity, setQuantity] = useState("");
  const [distance, setDistance] = useState("");
  const [vehicleType, setVehicleType] =
    useState("Medium Truck");

  const [loading, setLoading] = useState(false);
  const [sendingRequest, setSendingRequest] =
    useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  const [result, setResult] = useState(null);

  // =====================================================
  // NORMALIZE SELECTED CENTER
  // =====================================================

  const normalizedCenter =
    selectedCenter?.center &&
    typeof selectedCenter.center === "object"
      ? selectedCenter.center
      : selectedCenter &&
        typeof selectedCenter === "object"
      ? selectedCenter
      : {};

  // =====================================================
  // FARMER DETAILS
  // =====================================================

  const farmerName =
    user?.full_name ||
    user?.name ||
    user?.farmer_name ||
    user?.username ||
    "Farmer";

  // =====================================================
  // FARMER ID
  // =====================================================

  const farmerId =
    user?.farmer_id ||
    user?.farmerId ||
    user?.id ||
    user?.user_id ||
    user?.userId ||
    user?.farmer?.id ||
    "";

  // =====================================================
  // FARMER MOBILE
  // =====================================================

  const farmerMobile =
    user?.mobile_number ||
    user?.mobile ||
    user?.phone ||
    user?.farmer?.mobile_number ||
    "";

  // =====================================================
  // FARMER DISTRICT
  // =====================================================

  const farmerDistrict =
    user?.district ||
    user?.District ||
    user?.farmer?.district ||
    "";

  // =====================================================
  // SELECTED CROP
  // =====================================================

  const crop =
    typeof selectedCrop === "string"
      ? selectedCrop
      : selectedCenter?.crop &&
        typeof selectedCenter.crop === "string"
      ? selectedCenter.crop
      : selectedCrop?.crop ||
        selectedCrop?.name ||
        selectedCrop?.Crop ||
        user?.primary_crop ||
        user?.crop ||
        user?.Crop ||
        "";

  // =====================================================
  // CENTER ID
  // =====================================================

  const centerId =
    normalizedCenter?.center_id ||
    normalizedCenter?.id ||
    normalizedCenter?.centerId ||
    normalizedCenter?.procurement_center_id ||
    normalizedCenter?.Center_ID ||
    "";

  // =====================================================
  // CENTER NAME
  // =====================================================

  const centerName =
    typeof normalizedCenter?.center_name === "string"
      ? normalizedCenter.center_name
      : typeof normalizedCenter?.name === "string"
      ? normalizedCenter.name
      : typeof normalizedCenter?.Procurement_Center_Name ===
        "string"
      ? normalizedCenter.Procurement_Center_Name
      : "Procurement Center";

  // =====================================================
  // CENTER DISTRICT
  // =====================================================

  const centerDistrict =
    typeof normalizedCenter?.district === "string"
      ? normalizedCenter.district
      : typeof normalizedCenter?.District === "string"
      ? normalizedCenter.District
      : farmerDistrict;

  // =====================================================
  // CENTER LOCATION
  // =====================================================

  const centerLocation =
    typeof normalizedCenter?.location === "string"
      ? normalizedCenter.location
      : typeof normalizedCenter?.area === "string"
      ? normalizedCenter.area
      : typeof normalizedCenter?.village === "string"
      ? normalizedCenter.village
      : typeof normalizedCenter?.mandal === "string"
      ? normalizedCenter.mandal
      : centerDistrict;

  // =====================================================
  // DEBUG USER AND CENTER
  // =====================================================

  useEffect(() => {
    console.log("======================================");
    console.log("TRANSPORT COST USER");
    console.log(JSON.stringify(user, null, 2));

    console.log("FARMER DETAILS");
    console.log(
      JSON.stringify(
        {
          farmerId,
          farmerName,
          farmerMobile,
          farmerDistrict,
        },
        null,
        2
      )
    );

    console.log("PROCUREMENT CENTER");
    console.log(
      JSON.stringify(
        {
          centerId,
          centerName,
          centerDistrict,
          centerLocation,
          normalizedCenter,
        },
        null,
        2
      )
    );

    console.log("======================================");
  }, [user, selectedCenter]);

  // =====================================================
  // SET DISTANCE FROM SELECTED CENTER
  // =====================================================

  useEffect(() => {
    const centerDistance =
      normalizedCenter?.distance_km ??
      normalizedCenter?.Distance_KM ??
      normalizedCenter?.distance ??
      "";

    if (
      centerDistance !== "" &&
      centerDistance !== null &&
      centerDistance !== undefined
    ) {
      setDistance(String(centerDistance));
    }
  }, [selectedCenter]);

  // =====================================================
  // VEHICLES
  // =====================================================

  const vehicles = [
    {
      name: "Mini Truck",
      capacity: 3,
    },
    {
      name: "Medium Truck",
      capacity: 7,
    },
    {
      name: "Large Truck",
      capacity: 10,
    },
    {
      name: "Heavy Truck",
      capacity: 20,
    },
  ];

  // =====================================================
  // CALCULATE TRANSPORT
  // =====================================================

  const calculateTransport = async () => {
    setError("");
    setSuccessMessage("");
    setResult(null);

    if (!centerId) {
      setError(
        "Please select a valid procurement center first."
      );
      return;
    }

    const numericQuantity = Number(quantity);
    const numericDistance = Number(distance);

    if (
      !Number.isFinite(numericQuantity) ||
      numericQuantity <= 0
    ) {
      setError(
        "Please enter a valid crop quantity."
      );
      return;
    }

    if (
      !Number.isFinite(numericDistance) ||
      numericDistance < 0
    ) {
      setError(
        "Please enter a valid distance."
      );
      return;
    }

    setLoading(true);

    try {
      const payload = {
        quantity: numericQuantity,
        distance: numericDistance,
        vehicle: String(vehicleType),
      };

      console.log("======================================");
      console.log("SENDING TRANSPORT CALCULATION");
      console.log(JSON.stringify(payload, null, 2));
      console.log("======================================");

      const response = await axios.post(
        `${API}/api/transport/calculate`,
        payload,
        {
          timeout: 15000,
        }
      );

      console.log("TRANSPORT RESPONSE");
      console.log(
        JSON.stringify(response.data, null, 2)
      );

      if (response.data?.success === false) {
        setError(
          response.data?.message ||
          response.data?.error ||
          "Unable to calculate transportation cost."
        );
        return;
      }

      setResult(response.data);
    } catch (err) {
      console.error(
        "TRANSPORT CALCULATION ERROR:",
        err
      );

      console.log(
        "SERVER ERROR DATA:",
        JSON.stringify(
          err.response?.data,
          null,
          2
        )
      );

      if (err.response) {
        setError(
          err.response.data?.message ||
          err.response.data?.error ||
          `Server returned status ${err.response.status}.`
        );
      } else if (err.request) {
        setError(
          "Unable to connect to the backend. Please make sure Flask is running on port 5000."
        );
      } else {
        setError(
          "Unable to calculate transportation cost."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // SEND PROCUREMENT REQUEST
  // =====================================================

  const sendProcurementRequest = async () => {
    setError("");
    setSuccessMessage("");

    // -------------------------------------------------
    // TRANSPORT RESULT CHECK
    // -------------------------------------------------

    if (!result) {
      setError(
        "Please calculate transportation cost first."
      );
      return;
    }

    // -------------------------------------------------
    // FARMER ID CHECK
    // -------------------------------------------------

    if (
      farmerId === "" ||
      farmerId === null ||
      farmerId === undefined
    ) {
      console.log(
        "FARMER ID MISSING. USER OBJECT:"
      );

      console.log(
        JSON.stringify(user, null, 2)
      );

      setError(
        "Farmer ID is required. Please logout and login again."
      );

      return;
    }

    // -------------------------------------------------
    // MOBILE CHECK
    // -------------------------------------------------

    if (
      !farmerMobile ||
      String(farmerMobile).trim() === ""
    ) {
      setError(
        "Farmer mobile number is missing. Please login again."
      );

      return;
    }

    // -------------------------------------------------
    // CENTER CHECK
    // -------------------------------------------------

    if (
      !centerId ||
      String(centerId).trim() === ""
    ) {
      setError(
        "Procurement center information is missing."
      );

      return;
    }

    // -------------------------------------------------
    // CROP CHECK
    // -------------------------------------------------

    if (
      !crop ||
      String(crop).trim() === ""
    ) {
      setError(
        "Crop information is missing."
      );

      return;
    }

    // =================================================
    // SAFE NUMERIC CONVERSION
    // =================================================

    const numericFarmerId = Number(farmerId);
    const numericQuantity = Number(quantity);
    const numericDistance = Number(distance);

    const numericTransportCost = Number(
      result?.totalCost ??
      result?.total_cost ??
      0
    );

    // -------------------------------------------------
    // VALIDATE FARMER ID
    // -------------------------------------------------

    if (
      !Number.isFinite(numericFarmerId) ||
      numericFarmerId <= 0
    ) {
      console.log(
        "INVALID FARMER ID:",
        farmerId
      );

      setError(
        `Invalid Farmer ID: ${String(farmerId)}`
      );

      return;
    }

    // -------------------------------------------------
    // VALIDATE QUANTITY
    // -------------------------------------------------

    if (
      !Number.isFinite(numericQuantity) ||
      numericQuantity <= 0
    ) {
      console.log(
        "INVALID QUANTITY:",
        quantity
      );

      setError(
        "Invalid crop quantity."
      );

      return;
    }

    // -------------------------------------------------
    // VALIDATE DISTANCE
    // -------------------------------------------------

    if (
      !Number.isFinite(numericDistance) ||
      numericDistance < 0
    ) {
      console.log(
        "INVALID DISTANCE:",
        distance
      );

      setError(
        "Invalid distance."
      );

      return;
    }

    // -------------------------------------------------
    // VALIDATE TRANSPORT COST
    // -------------------------------------------------

    if (
      !Number.isFinite(numericTransportCost) ||
      numericTransportCost < 0
    ) {
      console.log(
        "INVALID TRANSPORT COST:",
        result?.totalCost
      );

      setError(
        "Invalid transportation cost."
      );

      return;
    }

    // =================================================
    // PROCUREMENT REQUEST PAYLOAD
    // =================================================

    /*
      IMPORTANT:

      center_id is kept as a STRING.

      Your procurement center ID may be:

      1
      PC001
      GUNTUR_01
      CENTER-12

      Converting these IDs using Number() can cause
      "Invalid numeric data provided".
    */

    const payload = {
      farmer_id: numericFarmerId,

      farmer_name: String(
        farmerName || ""
      ),

      mobile_number: String(
        farmerMobile || ""
      ),

      district: String(
        farmerDistrict || ""
      ),

      crop: String(
        crop || ""
      ),

      quantity: numericQuantity,

      center_id: String(
        centerId
      ),

      center_name: String(
        centerName || ""
      ),

      center_district: String(
        centerDistrict || ""
      ),

      center_location: String(
        centerLocation || ""
      ),

      distance_km: numericDistance,

      vehicle: String(
        vehicleType || ""
      ),

      transport_cost:
        numericTransportCost,

      total_cost:
        numericTransportCost,
    };

    // =================================================
    // COMPLETE DEBUG OUTPUT
    // =================================================

    console.log("======================================");
    console.log("NUMERIC DEBUG");

    console.log("farmerId:", farmerId);
    console.log(
      "numericFarmerId:",
      numericFarmerId
    );

    console.log("centerId:", centerId);
    console.log(
      "centerId type:",
      typeof centerId
    );

    console.log("quantity:", quantity);
    console.log(
      "numericQuantity:",
      numericQuantity
    );

    console.log("distance:", distance);
    console.log(
      "numericDistance:",
      numericDistance
    );

    console.log(
      "transportCost:",
      result?.totalCost
    );

    console.log(
      "numericTransportCost:",
      numericTransportCost
    );

    console.log("======================================");

    console.log("SENDING PROCUREMENT REQUEST");

    console.log(
      JSON.stringify(
        payload,
        null,
        2
      )
    );

    console.log("======================================");

    setSendingRequest(true);

    try {
      const response = await axios.post(
        `${API}/api/procurement-requests`,
        payload,
        {
          timeout: 15000,
        }
      );

      console.log(
        "PROCUREMENT REQUEST RESPONSE:"
      );

      console.log(
        JSON.stringify(
          response.data,
          null,
          2
        )
      );

      if (
        response.data?.success === false
      ) {
        setError(
          response.data?.message ||
          response.data?.error ||
          "Unable to send procurement request."
        );

        return;
      }

      setSuccessMessage(
        response.data?.message ||
        `Request successfully sent to ${centerName}.`
      );

      // =================================================
      // REQUEST DATA
      // =================================================

      const requestData =
        response.data?.request ||
        response.data?.data ||
        {
          farmer_id: numericFarmerId,

          farmer_name: farmerName,

          crop: crop,

          quantity: numericQuantity,

          center_id: centerId,

          center_name: centerName,

          status: "pending",
        };

      // =================================================
      // GO TO REQUEST STATUS PAGE
      // =================================================

      if (onRequestSent) {
        setTimeout(() => {
          onRequestSent(
            requestData.status ||
            "pending",
            requestData
          );
        }, 1000);
      }

    } catch (err) {
      console.error(
        "PROCUREMENT REQUEST ERROR:",
        err
      );

      console.log(
        "SERVER ERROR DATA:"
      );

      console.log(
        JSON.stringify(
          err.response?.data,
          null,
          2
        )
      );

      if (err.response) {
        setError(
          err.response.data?.message ||
          err.response.data?.error ||
          `Server returned status ${err.response.status}.`
        );
      } else if (err.request) {
        setError(
          "Unable to connect to the backend. Please make sure Flask is running on port 5000."
        );
      } else {
        setError(
          "Unable to send procurement request."
        );
      }
    } finally {
      setSendingRequest(false);
    }
  };

  // =====================================================
  // FORMAT CURRENCY
  // =====================================================

  const formatCurrency = (value) => {
    return Number(
      value || 0
    ).toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div style={styles.page}>

      <div style={styles.header}>
        <div>
          <h1>
            Transportation Cost
          </h1>

          <p>
            Calculate transportation cost and send your procurement request.
          </p>
        </div>

        <button
          onClick={goBack}
          style={styles.backButton}
        >
          ← Back
        </button>
      </div>

      <div style={styles.container}>

        {/* SUMMARY */}

        <div style={styles.summaryGrid}>

          <div style={styles.card}>
            <h3>
              Farmer
            </h3>

            <p>
              {String(farmerName)}
            </p>

            <p>
              {String(
                farmerDistrict || "-"
              )}
            </p>
          </div>

          <div style={styles.card}>
            <h3>
              Selected Crop
            </h3>

            <p>
              {String(
                crop || "-"
              )}
            </p>
          </div>

          <div style={styles.card}>
            <h3>
              Procurement Center
            </h3>

            <p>
              {String(centerName)}
            </p>

            <p>
              {String(centerLocation)}
            </p>
          </div>

        </div>

        {/* ERROR */}

        {error && (
          <div style={styles.errorBox}>
            <strong>
              Unable to continue
            </strong>

            <p>
              {String(error)}
            </p>
          </div>
        )}

        {/* SUCCESS */}

        {successMessage && (
          <div style={styles.successBox}>
            <strong>
              Request Sent Successfully
            </strong>

            <p>
              {String(successMessage)}
            </p>
          </div>
        )}

        {/* TRANSPORT DETAILS */}

        <div style={styles.card}>

          <h2>
            Transport Details
          </h2>

          <div style={styles.formGrid}>

            <div>
              <label>
                Crop
              </label>

              <input
                value={String(crop)}
                readOnly
                style={styles.input}
              />
            </div>

            <div>
              <label>
                Quantity (Tons)
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={quantity}
                onChange={(e) =>
                  setQuantity(
                    e.target.value
                  )
                }
                style={styles.input}
              />
            </div>

            <div>
              <label>
                Distance (KM)
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={distance}
                onChange={(e) =>
                  setDistance(
                    e.target.value
                  )
                }
                style={styles.input}
              />
            </div>

            <div>
              <label>
                Vehicle
              </label>

              <select
                value={vehicleType}
                onChange={(e) =>
                  setVehicleType(
                    e.target.value
                  )
                }
                style={styles.input}
              >
                {vehicles.map(
                  (vehicle) => (
                    <option
                      key={vehicle.name}
                      value={vehicle.name}
                    >
                      {vehicle.name}
                      {" "}
                      ({vehicle.capacity} Tons)
                    </option>
                  )
                )}
              </select>
            </div>

          </div>

          <button
            onClick={calculateTransport}
            disabled={loading}
            style={styles.calculateButton}
          >
            {loading
              ? "Calculating..."
              : "Calculate Transportation Cost"}
          </button>

        </div>

        {/* RESULT */}

        {result && (
          <div style={styles.resultCard}>

            <h2>
              Transportation Cost Result
            </h2>

            <div style={styles.resultGrid}>

              <ResultItem
                label="Vehicle"
                value={
                  String(
                    result.vehicle ||
                    vehicleType
                  )
                }
              />

              <ResultItem
                label="Trips"
                value={
                  String(
                    result.trips || 0
                  )
                }
              />

              <ResultItem
                label="Total Distance"
                value={`${result.totalDistance || 0} KM`}
              />

              <ResultItem
                label="Fuel Required"
                value={`${result.fuelRequired || 0} Liters`}
              />

              <ResultItem
                label="Fuel Cost"
                value={`₹${formatCurrency(
                  result.fuelCost
                )}`}
              />

              <ResultItem
                label="Driver Cost"
                value={`₹${formatCurrency(
                  result.driverCost
                )}`}
              />

              <ResultItem
                label="Loading Cost"
                value={`₹${formatCurrency(
                  result.loadingCost
                )}`}
              />

              <ResultItem
                label="Unloading Cost"
                value={`₹${formatCurrency(
                  result.unloadingCost
                )}`}
              />

              <ResultItem
                label="Cost Per Ton"
                value={`₹${formatCurrency(
                  result.costPerTon
                )}`}
              />

              <ResultItem
                label="Total Cost"
                value={`₹${formatCurrency(
                  result.totalCost
                )}`}
              />

            </div>

            <button
              onClick={
                sendProcurementRequest
              }
              disabled={
                sendingRequest
              }
              style={styles.sendButton}
            >
              {sendingRequest
                ? "Sending Request..."
                : "Send Procurement Request"}
            </button>

          </div>
        )}

      </div>

    </div>
  );
}

// =====================================================
// RESULT ITEM
// =====================================================

function ResultItem({
  label,
  value,
}) {
  return (
    <div style={styles.resultItem}>
      <strong>
        {String(label)}
      </strong>

      <p>
        {String(value)}
      </p>
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
    background: "#1f4d3a",
    color: "white",
    padding: "25px 8%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  container: {
    maxWidth: "1200px",
    margin: "auto",
    padding: "30px",
  },

  summaryGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "20px",
    marginBottom: "25px",
  },

  card: {
    background: "white",
    padding: "25px",
    borderRadius: "12px",
    marginBottom: "25px",
    boxShadow:
      "0 3px 10px rgba(0,0,0,0.08)",
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "20px",
  },

  input: {
    width: "100%",
    padding: "12px",
    marginTop: "8px",
    boxSizing: "border-box",
    borderRadius: "6px",
    border: "1px solid #ccc",
  },

  calculateButton: {
    marginTop: "25px",
    padding: "14px 25px",
    background: "#1f4d3a",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },

  backButton: {
    padding: "10px 18px",
    background: "white",
    color: "#1f4d3a",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },

  errorBox: {
    background: "#ffe5e5",
    padding: "18px",
    marginBottom: "20px",
    borderRadius: "8px",
    color: "#b00020",
  },

  successBox: {
    background: "#e3f7e8",
    padding: "18px",
    marginBottom: "20px",
    borderRadius: "8px",
    color: "#176b2c",
  },

  resultCard: {
    background: "white",
    padding: "30px",
    borderRadius: "12px",
    boxShadow:
      "0 3px 10px rgba(0,0,0,0.08)",
  },

  resultGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "15px",
  },

  resultItem: {
    background: "#f5f8f6",
    padding: "15px",
    borderRadius: "8px",
  },

  sendButton: {
    marginTop: "25px",
    padding: "15px 28px",
    background: "#2d6a4f",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
};

export default TransportCost;