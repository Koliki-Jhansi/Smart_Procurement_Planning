import React, { useEffect, useState } from "react";
import axios from "axios";

const API = "http://127.0.0.1:5000";

function TransportCost({
  user,
  selectedCenter,
  selectedCrop,
  goBack,
  onOpenProcurementRequest,
  onRequestSent,
}) {
  const [quantity, setQuantity] = useState("");
  const [quantityManuallyEdited, setQuantityManuallyEdited] = useState(false);

  const savedPrediction = (() => {
    try {
      const raw = sessionStorage.getItem("latestCropPrediction");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();
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

  // Always derive the displayed cost-per-ton from the CURRENT transport
  // quantity and the returned total cost. This keeps the summary and the
  // quantity field synchronized without hardcoding any prediction value.
  const displayedCostPerTon = (() => {
    const q = Number(quantity);
    const total = Number(result?.totalCost);
    if (!result || !Number.isFinite(q) || q <= 0 || !Number.isFinite(total)) {
      return 0;
    }
    return total / q;
  })();

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
    user?.id ||
    user?.user_id ||
    user?.userId ||
    user?.farmer_id ||
    user?.farmerId ||
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
  // PREDICTED PRODUCTION (TONS ONLY)
  // Never use cultivated area / land area as quantity.
  // =====================================================

  const currentCropName = String(crop || "").trim().toLowerCase();
  const savedCropName = String(
    savedPrediction?.crop ?? savedPrediction?.crop_name ?? ""
  ).trim().toLowerCase();

  // A session fallback is allowed only for the SAME crop. This prevents an
  // old crop prediction from silently becoming the quantity for a new crop.
  const safeSavedPrediction =
    currentCropName && savedCropName === currentCropName
      ? savedPrediction
      : null;

  const predictedQuantity = Number(
    selectedCrop?.predicted_production ??
    selectedCrop?.estimated_production ??
    selectedCrop?.quantity_tons ??
    selectedCrop?.predictedProduction ??
    selectedCrop?.estimatedProduction ??
    selectedCrop?.production ??
    selectedCenter?.selectedCrop?.predicted_production ??
    selectedCenter?.selectedCrop?.estimated_production ??
    selectedCenter?.selectedCrop?.quantity_tons ??
    selectedCenter?.predicted_production ??
    selectedCenter?.estimated_production ??
    safeSavedPrediction?.predicted_production ??
    safeSavedPrediction?.estimated_production ??
    safeSavedPrediction?.quantity_tons ??
    safeSavedPrediction?.production ??
    0
  );

  // Prediction owns the initial transport quantity. After the farmer types,
  // never overwrite the farmer's manual value. Area/hectares is never read here.
  useEffect(() => {
    if (
      !quantityManuallyEdited &&
      Number.isFinite(predictedQuantity) &&
      predictedQuantity > 0
    ) {
      const nextQuantity = String(Math.round(predictedQuantity * 100) / 100);

      // If the prediction arrives/changes after an earlier calculation,
      // invalidate that old result. This prevents the input from showing
      // 21.92 while the cost cards still belong to an older quantity.
      if (String(quantity) !== nextQuantity) {
        setQuantity(nextQuantity);
        setResult(null);
        setSuccessMessage("");
        setError("");
      }
    }
  }, [predictedQuantity, quantityManuallyEdited, quantity]);

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
  // FARMER + CENTER COORDINATES
  // =====================================================

  const originLatitude = Number(
    user?.latitude ??
    user?.Latitude ??
    user?.lat ??
    user?.farmer?.latitude ??
    user?.farmer?.Latitude
  );

  const originLongitude = Number(
    user?.longitude ??
    user?.Longitude ??
    user?.lon ??
    user?.lng ??
    user?.farmer?.longitude ??
    user?.farmer?.Longitude
  );

  const destinationLatitude = Number(
    normalizedCenter?.latitude ??
    normalizedCenter?.Latitude ??
    normalizedCenter?.lat
  );

  const destinationLongitude = Number(
    normalizedCenter?.longitude ??
    normalizedCenter?.Longitude ??
    normalizedCenter?.lon ??
    normalizedCenter?.lng
  );

  const validLatitude = (value) =>
    Number.isFinite(value) &&
    value >= -90 &&
    value <= 90;

  const validLongitude = (value) =>
    Number.isFinite(value) &&
    value >= -180 &&
    value <= 180;

  const coordinatesAvailable =
    validLatitude(originLatitude) &&
    validLongitude(originLongitude) &&
    validLatitude(destinationLatitude) &&
    validLongitude(destinationLongitude);


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
          originLatitude,
          originLongitude,
          destinationLatitude,
          destinationLongitude,
          coordinatesAvailable,
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
    // Distance comes automatically from the selected procurement center.
    // Support both a plain center object and the wrapper returned by
    // ProcurementCenter ({ center, selectedCrop, ... }).
    const centerDistance =
      normalizedCenter?.distance_km ??
      normalizedCenter?.Distance_KM ??
      normalizedCenter?.distance ??
      selectedCenter?.distance_km ??
      selectedCenter?.Distance_KM ??
      selectedCenter?.distance ??
      selectedCenter?.center?.distance_km ??
      selectedCenter?.center?.Distance_KM ??
      selectedCenter?.center?.distance ??
      "";

    if (
      centerDistance !== "" &&
      centerDistance !== null &&
      centerDistance !== undefined
    ) {
      setDistance(String(centerDistance));
    }
  }, [
    selectedCenter,
    normalizedCenter?.distance_km,
    normalizedCenter?.Distance_KM,
    normalizedCenter?.distance,
  ]);

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

    /*
      Preferred calculation:
      farmer coordinates -> selected center coordinates
      -> backend road distance.

      Old distance input remains only as a fallback so
      existing functionality is not removed.
    */

    if (
      !Number.isFinite(numericDistance) ||
      numericDistance <= 0
    ) {
      setError(
        "Please enter or calculate a valid one-way distance."
      );
      return;
    }

    setLoading(true);

    try {
      // This matches the Flask endpoint that was verified directly in
      // PowerShell: quantity (tons), one-way distance (km), vehicle name.
      // Never send hectares/area as quantity.
      const payload = {
        quantity: numericQuantity,
        distance: numericDistance,
        vehicle: String(vehicleType),
      };

      console.log("======================================");
      console.log("SENDING TRANSPORT CALCULATION");
      console.log("PREDICTED PRODUCTION (TONS):", predictedQuantity);
      console.log("EDITABLE TRANSPORT QUANTITY (TONS):", numericQuantity);
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

      const calculatedOneWayDistance = Number(
        response.data?.oneWayDistance ??
        response.data?.distance
      );

      if (
        Number.isFinite(
          calculatedOneWayDistance
        ) &&
        calculatedOneWayDistance > 0
      ) {
        setDistance(
          String(
            calculatedOneWayDistance
          )
        );
      }
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

    const numericDistance = Number(
      result?.oneWayDistance ??
      result?.distance ??
      distance
    );

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
        {error && (
          <div style={styles.errorBox}><strong>Unable to continue</strong><p>{String(error)}</p></div>
        )}
        {successMessage && (
          <div style={styles.successBox}><strong>Request Sent Successfully</strong><p>{String(successMessage)}</p></div>
        )}

        <div style={styles.workspace}>
          <section style={styles.detailsPanel}>
            <div style={styles.sectionEyebrow}>TRANSPORT PLANNER</div>
            <h2 style={styles.sectionTitle}>Enter Transport Details</h2>
            <p style={styles.sectionText}>Review the shipment values and calculate the estimated transportation cost.</p>

            <div style={styles.fieldBlock}>
              <label style={styles.label}>Quantity (Tons)</label>
              <input type="number" min="0" step="0.01" value={quantity}
                onChange={(e) => { setQuantityManuallyEdited(true); setQuantity(e.target.value); setResult(null); setSuccessMessage(""); }} style={styles.input} />
              <div style={styles.helperText}>Predicted production: {Number.isFinite(predictedQuantity) && predictedQuantity > 0 ? `${predictedQuantity.toFixed(2)} tons` : "not available"}. Quantity is editable.</div>
            </div>

            <div style={styles.fieldBlock}>
              <label style={styles.label}>One Way Distance (KM)</label>
              <input type="number" min="0" step="0.01" value={distance} readOnly={coordinatesAvailable}
                onChange={(e) => { setDistance(e.target.value); setResult(null); setSuccessMessage(""); }}
                placeholder={coordinatesAvailable ? "Calculated from coordinates" : "Fallback distance"} style={styles.input} />
            </div>

            <div style={styles.fieldBlock}>
              <label style={styles.label}>Vehicle Type</label>
              <select value={vehicleType} onChange={(e) => { setVehicleType(e.target.value); setResult(null); setSuccessMessage(""); }} style={styles.input}>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.name} value={vehicle.name}>{vehicle.name} ({vehicle.capacity} Tons)</option>
                ))}
              </select>
            </div>

            <button onClick={calculateTransport} disabled={loading} style={styles.calculateButton}>
              {loading ? "Calculating..." : "Calculate Transportation Cost"}
            </button>
          </section>

          <section style={styles.resultsPanel}>
            <div style={styles.sectionEyebrow}>COST ESTIMATE</div>
            <h2 style={styles.sectionTitle}>Transportation Result</h2>
            {!result ? (
              <div style={styles.emptyResult}>
                <div style={styles.emptyResultIcon}>₹</div>
                <h3 style={{margin:"0 0 8px"}}>Your estimate will appear here</h3>
                <p style={{margin:0}}>Enter the transport details and calculate to view the complete cost breakdown.</p>
              </div>
            ) : (
              <>
                <div style={styles.totalHero}>
                  <span style={styles.totalLabel}>Estimated Transport Cost</span>
                  <strong style={styles.totalValue}>₹{formatCurrency(result.totalCost)}</strong>
                  <span style={styles.totalSub}>₹{formatCurrency(displayedCostPerTon)} per ton</span>
                </div>
                <div style={styles.resultGrid}>
                  <ResultItem label="One Way Distance" value={`${result.oneWayDistance ?? result.distance ?? 0} KM`} />
                  <ResultItem label="Total Distance" value={`${result.totalDistance || 0} KM`} />
                  <ResultItem label="Fuel Required" value={`${result.fuelRequired || 0} Liters`} />
                  <ResultItem label="Fuel Cost" value={`₹${formatCurrency(result.fuelCost)}`} />
                  <ResultItem label="Driver Cost" value={`₹${formatCurrency(result.driverCost)}`} />
                  <ResultItem label="Loading Cost" value={`₹${formatCurrency(result.loadingCost)}`} />
                  <ResultItem label="Unloading Cost" value={`₹${formatCurrency(result.unloadingCost)}`} />
                  <ResultItem label="Cost Per Ton" value={`₹${formatCurrency(displayedCostPerTon)}`} />
                </div>
                <button onClick={sendProcurementRequest} disabled={sendingRequest} style={styles.sendButton}>
                  {sendingRequest ? "Sending Request..." : "Send Procurement Request"}
                </button>
              </>
            )}
          </section>
        </div>
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
    background: "linear-gradient(180deg,#f4f8f5 0%,#edf4ef 100%)",
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
    maxWidth: "1280px",
    margin: "auto",
    padding: "26px",
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
    borderRadius: "11px",
    border: "1px solid #d5e1da",
    background: "#fbfdfb",
    outline: "none",
  },

  calculateButton: {
    marginTop: "25px",
    padding: "14px 25px",
    background: "#1f4d3a",
    color: "white",
    border: "none",
    borderRadius: "11px",
    cursor: "pointer",
    width: "100%",
    fontWeight: 750,
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

  workspace: {
    display: "grid",
    gridTemplateColumns: "minmax(300px, 0.82fr) minmax(0, 1.45fr)",
    gap: "22px",
    alignItems: "start",
  },
  detailsPanel: {
    background: "#ffffff", padding: "26px", borderRadius: "20px",
    border: "1px solid #e1ebe5", boxShadow: "0 14px 38px rgba(25,73,51,0.08)",
  },
  resultsPanel: {
    background: "#ffffff", padding: "26px", borderRadius: "20px",
    border: "1px solid #e1ebe5", boxShadow: "0 14px 38px rgba(25,73,51,0.08)", minHeight: "480px",
  },
  sectionEyebrow: { fontSize: "11px", letterSpacing: "1.5px", fontWeight: 800, color: "#2d7a55", marginBottom: "7px" },
  sectionTitle: { margin: "0 0 8px", color: "#173f30", fontSize: "24px" },
  sectionText: { margin: "0 0 24px", color: "#6a7e74", fontSize: "14px", lineHeight: 1.55 },
  fieldBlock: { marginBottom: "18px" },
  label: { display: "block", color: "#294d3d", fontSize: "13px", fontWeight: 750, marginBottom: "7px" },
  helperText: { marginTop: "7px", fontSize: "12px", color: "#71847a", lineHeight: 1.4 },
  emptyResult: { minHeight: "350px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", color: "#71847a", padding: "25px" },
  emptyResultIcon: { width: "58px", height: "58px", borderRadius: "18px", display: "grid", placeItems: "center", background: "#eaf5ee", color: "#236b49", fontSize: "26px", fontWeight: 800, marginBottom: "15px" },
  totalHero: { display: "flex", flexDirection: "column", padding: "20px 22px", margin: "20px 0", borderRadius: "17px", background: "linear-gradient(135deg,#174c36,#2f7d57)", color: "white" },
  totalLabel: { fontSize: "12px", fontWeight: 700, opacity: 0.85, textTransform: "uppercase", letterSpacing: "1px" },
  totalValue: { fontSize: "34px", lineHeight: 1.2, marginTop: "5px" },
  totalSub: { fontSize: "13px", opacity: 0.82, marginTop: "5px" },
  resultGrid: { display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "11px" },
  resultItem: { background: "#f6faf7", padding: "13px", borderRadius: "13px", border: "1px solid #e3ece6", minHeight: "66px" },
  sendButton: { width: "100%", marginTop: "20px", padding: "14px 22px", background: "#2d6a4f", color: "white", border: "none", borderRadius: "11px", cursor: "pointer", fontWeight: 750 },
};

export default TransportCost;
