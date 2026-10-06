import React, { useEffect, useState } from "react";
import axios from "axios";
import WarehousePrediction from "./WarehousePrediction";
import { API_BASE_URL as API } from "../apiConfig";

function GovernmentDashboard({ user, onLogout }) {
  const [activeSection, setActiveSection] = useState("overview");

  const [cropData, setCropData] = useState(null);
  const [warehouseData, setWarehouseData] = useState(null);
  const [requests, setRequests] = useState([]);
  const [centers, setCenters] = useState([]);

  const [appointments, setAppointments] = useState([]);
  const [appointmentInputs, setAppointmentInputs] = useState({});
  const [receivedQuantities, setReceivedQuantities] = useState({});
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  const [loadingCrop, setLoadingCrop] = useState(false);
  const [loadingWarehouse, setLoadingWarehouse] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [uiMessage, setUiMessage] = useState("");
  const [requestFilter, setRequestFilter] = useState("pending");

  // Existing alert(...) calls are intentionally routed to an inline page
  // message so this dashboard never opens browser popup dialogs.
  const alert = (message) => {
    setUiMessage(String(message || ""));
  };

  const [cropForm, setCropForm] = useState({
    district: user?.district || "",
    crop: user?.primary_crop || "Paddy",
    season: "Kharif",
    year: new Date().getFullYear(),
    area: ""
  });

  const [warehouseForm, setWarehouseForm] = useState({
    district: user?.district || "",
    presentCapacity: ""
  });

  const [report, setReport] = useState([]);

  const addReport = (title, details, type = "info") => {
    setReport((previous) => [
      ...previous,
      {
        id: `${Date.now()}-${Math.random()}`,
        title,
        details,
        type,
        time: new Date().toLocaleTimeString()
      }
    ]);
  };

  const clearReport = () => {
    setReport([]);
  };

  const loadRequests = async () => {
    try {
      setLoadingRequests(true);

      const response = await axios.get(
        `${API}/api/procurement-requests`,
        {
          headers: {
            "X-Admin-Mobile": user?.mobile_number || ""
          }
        }
      );

      if (response.data.success) {
        setRequests(response.data.requests || []);
      }
    } catch (error) {
      console.error("Request loading error:", error);
      alert(
        error.response?.data?.message ||
          "Unable to load procurement requests."
      );
    } finally {
      setLoadingRequests(false);
    }
  };

  const loadCenters = async (district) => {
    if (!district) return;

    try {
      const response = await axios.get(
        `${API}/api/procurement/centers`,
        {
          params: { district }
        }
      );

      if (response.data.success) {
        setCenters(response.data.centers || []);
      } else {
        setCenters([]);
      }
    } catch (error) {
      console.error("Center loading error:", error);
      setCenters([]);
    }
  };

  const predictCropProduction = async () => {
    if (!cropForm.district || !cropForm.crop || !cropForm.area) {
      alert("Please enter district, crop and area.");
      return;
    }

    try {
      setLoadingCrop(true);

      const response = await axios.post(`${API}/api/predict`, {
        district: cropForm.district.trim(),
        crop: cropForm.crop,
        season: cropForm.season,
        year: Number(cropForm.year),
        area: Number(cropForm.area)
      });

      if (response.data.success) {
        setCropData(response.data);

        setWarehouseForm((previous) => ({
          ...previous,
          district: cropForm.district
        }));

        addReport(
          "Crop Production Prediction Completed",
          `${cropForm.crop} production in ${cropForm.district} is predicted as ${Number(
            response.data.predicted_production || 0
          ).toFixed(2)} tons.`,
          "success"
        );

        await loadCenters(cropForm.district);
      } else {
        alert(response.data.message || "Crop prediction failed.");
      }
    } catch (error) {
      console.error("Crop prediction error:", error);

      alert(
        error.response?.data?.message ||
          "Unable to connect to crop prediction API."
      );
    } finally {
      setLoadingCrop(false);
    }
  };

  const checkWarehouseCapacity = async () => {
    if (
      !warehouseForm.district ||
      warehouseForm.presentCapacity === ""
    ) {
      alert("Please enter district and present warehouse capacity.");
      return;
    }

    const predictedProduction = Number(
      cropData?.predicted_production || 0
    );

    const presentCapacity = Number(
      warehouseForm.presentCapacity
    );

    if (predictedProduction <= 0) {
      alert("Please complete crop production prediction first.");
      return;
    }

    try {
      setLoadingWarehouse(true);

      const difference =
        presentCapacity - predictedProduction;

      let recommendation = "";
      let type = "info";

      if (difference < 0) {
        recommendation =
          `Increase warehouse capacity by approximately ${Math.abs(
            difference
          ).toFixed(2)} tons.`;

        type = "warning";
      } else if (difference > 0) {
        recommendation =
          `Extra warehouse capacity of approximately ${difference.toFixed(
            2
          )} tons is available for additional procurement.`;

        type = "success";
      } else {
        recommendation =
          "Warehouse capacity is approximately equal to the predicted production.";

        type = "success";
      }

      const result = {
        district: warehouseForm.district,
        present_capacity: presentCapacity,
        predicted_requirement: predictedProduction,
        difference,
        recommendation
      };

      setWarehouseData(result);

      addReport(
        "Warehouse Capacity Checked",
        recommendation,
        type
      );
    } catch (error) {
      console.error("Warehouse error:", error);
      alert("Unable to analyse warehouse capacity.");
    } finally {
      setLoadingWarehouse(false);
    }
  };

  const loadAppointments = async () => {
    try {
      setLoadingAppointments(true);

      const response = await axios.get(
        `${API}/api/appointments`
      );

      if (response.data.success) {
        setAppointments(
          response.data.appointments || []
        );
      }
    } catch (error) {
      console.error(
        "Appointment loading error:",
        error
      );
    } finally {
      setLoadingAppointments(false);
    }
  };

  const updateRequestStatus = async (
    requestId,
    status,
    appointmentDate = "",
    appointmentTime = ""
  ) => {
    try {
      const payload = {
        status
      };

      if (
        status === "approved" ||
        status === "accepted"
      ) {
        if (!appointmentDate || !appointmentTime) {
          alert(
            "Select appointment date and time before approval."
          );
          return;
        }

        payload.appointment_date =
          appointmentDate;

        payload.appointment_time =
          appointmentTime;
      }

      const response = await axios.put(
        `${API}/api/procurement-requests/${requestId}/status`,
        payload,
        {
          headers: {
            "X-Admin-Mobile":
              user?.mobile_number || ""
          }
        }
      );

      if (!response.data.success) {
        alert(
          response.data.message ||
            "Unable to update request."
        );
        return;
      }

      const updatedRequest =
        response.data.request ||
        response.data.data;

      setRequests((previous) =>
        previous.map((requestItem) =>
          requestItem.id === requestId
            ? {
                ...requestItem,
                ...(updatedRequest || {})
              }
            : requestItem
        )
      );

      await loadRequests();
      await loadAppointments();

      alert(response.data.message);

    } catch (error) {
      console.error(
        "Status update error:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Unable to update request."
      );
    }
  };

  const confirmProcurement = async (
    appointmentId
  ) => {
    const quantity = Number(
      receivedQuantities[appointmentId]
    );

    if (
      !Number.isFinite(quantity) ||
      quantity <= 0
    ) {
      alert(
        "Enter the actual quantity received at the procurement center."
      );
      return;
    }

    try {
      const response = await axios.put(
        `${API}/api/appointments/${appointmentId}/confirm`,
        {
          actual_received_quantity:
            quantity
        },
        {
          headers: {
            "X-Admin-Mobile":
              user?.mobile_number || ""
          }
        }
      );

      if (!response.data.success) {
        alert(
          response.data.message ||
            "Unable to confirm procurement."
        );
        return;
      }

      setReceivedQuantities(
        (previous) => ({
          ...previous,
          [appointmentId]: ""
        })
      );

      await loadAppointments();
      await loadRequests();

      alert(
        response.data.message ||
          "Procurement confirmed and warehouse stock updated."
      );

    } catch (error) {
      console.error(
        "Confirm procurement error:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Unable to confirm procurement."
      );
    }
  };

  const findAlternativeCenter = async (request) => {
    if (!request?.district) {
      alert("District information is unavailable.");
      return;
    }

    try {
      const response = await axios.get(
        `${API}/api/procurement/centers`,
        {
          params: {
            district: request.district,
            crop: request.crop
          }
        }
      );

      const availableCenters =
        response.data.centers || [];

      if (availableCenters.length === 0) {
        alert(
          "No alternative procurement center was found."
        );

        addReport(
          "Alternative Center Search",
          `No alternative procurement center found in ${request.district}.`,
          "warning"
        );

        return;
      }

      const sortedCenters = [...availableCenters].sort(
        (a, b) =>
          Number(
            b.available_capacity_tons ??
              b.available_capacity ??
              b.capacity ??
              0
          ) -
          Number(
            a.available_capacity_tons ??
              a.available_capacity ??
              a.capacity ??
              0
          )
      );

      const alternative = sortedCenters[0];

      const centerName =
        alternative.center_name ||
        alternative.name ||
        "Procurement Center";

      const capacity =
        alternative.available_capacity_tons ??
        alternative.available_capacity ??
        alternative.capacity ??
        0;

      alert(
        `Suggested Center:\n${centerName}\nAvailable Capacity: ${Number(
          capacity
        ).toFixed(2)} tons`
      );

      addReport(
        "Alternative Procurement Center Suggested",
        `${centerName} is suggested for this farmer request because it has available procurement capacity.`,
        "success"
      );
    } catch (error) {
      console.error(
        "Alternative center error:",
        error
      );

      alert(
        "Unable to find alternative procurement center."
      );
    }
  };

  useEffect(() => {
    loadRequests();
    loadAppointments();

    const intervalId = setInterval(() => {
      loadRequests();
      loadAppointments();
    }, 10000);

    return () => clearInterval(intervalId);
  }, []);

  const pending = requests.filter(
    (request) => request.status === "pending"
  ).length;

  const accepted = requests.filter(
    (request) =>
      request.status === "accepted" ||
      request.status === "approved"
  ).length;

  const rejected = requests.filter(
    (request) => request.status === "rejected"
  ).length;

  const completed = requests.filter(
    (request) => request.status === "completed"
  ).length;

  const suggested = requests.filter(
    (request) =>
      request.status === "suggested" ||
      request.status === "suggested_center" ||
      request.status === "center_suggested"
  ).length;

  const currentRequests = requests.filter((request) => {
    const status = String(request?.status || "").toLowerCase();

    if (requestFilter === "pending") {
      return status === "pending";
    }

    if (requestFilter === "accepted") {
      return status === "accepted" || status === "approved";
    }

    if (requestFilter === "rejected") {
      return status === "rejected";
    }

    if (requestFilter === "completed") {
      return status === "completed";
    }

    if (requestFilter === "suggested") {
      return (
        status === "suggested" ||
        status === "suggested_center" ||
        status === "center_suggested"
      );
    }

    return true;
  });

  const renderOverview = () => (
    <div>
      <h2>Government Control Panel</h2>

      <p>
        Monitor crop production, warehouse capacity and
        farmer procurement requests.
      </p>

      <div style={styles.cardGrid}>
        <div style={styles.statCard}>
          <h3>🌾 Crop Production</h3>

          <p>
            Predict expected crop production using the
            trained machine learning model.
          </p>

          <button
            style={styles.primaryButton}
            onClick={() =>
              setActiveSection("crop")
            }
          >
            Open Crop Production
          </button>
        </div>

        <div style={styles.statCard}>
          <h3>🏭 Warehouse Capacity</h3>

          <p>
            Compare predicted production with available
            warehouse capacity.
          </p>

          <button
            style={styles.primaryButton}
            onClick={() =>
              setActiveSection("warehouse")
            }
          >
            Check Capacity
          </button>
        </div>

        <div style={styles.statCard}>
          <h3>📋 Farmer Requests</h3>

          <p>
            Pending: <b>{pending}</b>
          </p>

          <p>
            Accepted: <b>{accepted}</b>
          </p>

          <p>
            Rejected: <b>{rejected}</b>
          </p>

          <button
            style={styles.primaryButton}
            onClick={() =>
              setActiveSection("requests")
            }
          >
            View Requests
          </button>
        </div>

        <div style={styles.statCard}>
          <h3>📊 Final Report</h3>

          <p>
            View crop prediction, warehouse analysis and
            procurement activities.
          </p>

          <button
            style={styles.primaryButton}
            onClick={() =>
              setActiveSection("report")
            }
          >
            View Report
          </button>
        </div>
      </div>
    </div>
  );

  const renderCropProduction = () => (
    <div style={styles.sectionPage}>
      <div style={{ ...styles.pageHero, ...styles.cropHero }}>
        <div>
          <span style={styles.heroEyebrow}>AGRICULTURAL INTELLIGENCE</span>
          <h2 style={styles.heroTitle}>Crop Production Prediction</h2>
          <p style={styles.heroText}>
            Enter crop information on the left and view the ML prediction on the right.
          </p>
        </div>
        <div style={styles.hero3d}>🌾</div>
      </div>

      <div style={styles.splitWorkspace}>
        <div style={styles.formPanel}>
          <div style={styles.panelHeading}>
            <span style={styles.panelIcon}>⌨</span>
            <div>
              <h3 style={styles.panelTitle}>Prediction Inputs</h3>
              <p style={styles.panelText}>Enter cultivation details</p>
            </div>
          </div>

          <label style={styles.fieldLabel}>District</label>
          <input
            style={styles.input}
            value={cropForm.district}
            onChange={(e) =>
              setCropForm({ ...cropForm, district: e.target.value })
            }
            placeholder="Enter district"
          />

          <label style={styles.fieldLabel}>Crop</label>
          <select
            style={styles.input}
            value={cropForm.crop}
            onChange={(e) =>
              setCropForm({ ...cropForm, crop: e.target.value })
            }
          >
            <option>Paddy</option>
            <option>Maize</option>
            <option>Cotton</option>
            <option>Groundnut</option>
            <option>Red Gram</option>
            <option>Green Gram</option>
            <option>Black Gram</option>
            <option>Sunflower</option>
          </select>

          <label style={styles.fieldLabel}>Season</label>
          <select
            style={styles.input}
            value={cropForm.season}
            onChange={(e) =>
              setCropForm({ ...cropForm, season: e.target.value })
            }
          >
            <option>Kharif</option>
            <option>Rabi</option>
            <option>Summer</option>
          </select>

          <div style={styles.twoFieldGrid}>
            <div>
              <label style={styles.fieldLabel}>Year</label>
              <input
                style={{ ...styles.input, width: "100%", boxSizing: "border-box" }}
                type="number"
                value={cropForm.year}
                onChange={(e) =>
                  setCropForm({ ...cropForm, year: e.target.value })
                }
              />
            </div>
            <div>
              <label style={styles.fieldLabel}>Cultivated Area</label>
              <input
                style={{ ...styles.input, width: "100%", boxSizing: "border-box" }}
                type="number"
                value={cropForm.area}
                onChange={(e) =>
                  setCropForm({ ...cropForm, area: e.target.value })
                }
                placeholder="Area"
              />
            </div>
          </div>

          <button
            style={styles.primaryButton}
            onClick={predictCropProduction}
            disabled={loadingCrop}
          >
            {loadingCrop ? "Predicting..." : "Predict Crop Production"}
          </button>
        </div>

        <div style={styles.resultPanel}>
          <div style={styles.panelHeading}>
            <span style={styles.panelIcon}>▥</span>
            <div>
              <h3 style={styles.panelTitle}>Prediction Result</h3>
              <p style={styles.panelText}>Model output appears here</p>
            </div>
          </div>

          {!cropData ? (
            <div style={styles.resultEmpty}>
              <div style={styles.empty3d}>📊</div>
              <h3>Ready for prediction</h3>
              <p>Complete the inputs to generate the expected crop production.</p>
            </div>
          ) : (
            <>
              <div style={styles.resultSummary}>
                <span>Predicted Production</span>
                <strong style={styles.bigNumber}>
                  {Number(cropData.predicted_production || 0).toFixed(2)}
                  <small style={styles.tons}> tons</small>
                </strong>
              </div>
              <div style={styles.resultFacts}>
                <ResultFact label="District" value={cropForm.district} />
                <ResultFact label="Crop" value={cropForm.crop} />
                <ResultFact label="Season" value={cropForm.season} />
                <ResultFact label="Area" value={cropForm.area} />
              </div>
              <button
                style={styles.primaryButton}
                onClick={() => setActiveSection("warehouse")}
              >
                Continue to Warehouse Analysis →
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );


  const renderWarehouse = () => (
    <WarehousePrediction
      goBack={() => setActiveSection("overview")}
    />
  );

  const renderRequests = () => {
    const completionRequests =
      appointments.filter(
        (item) =>
          item.status ===
          "completion_requested"
      );

    return (
      <div>
        <button
          style={styles.backButton}
          onClick={() =>
            setActiveSection("overview")
          }
        >
          ← Back
        </button>

        <div style={styles.requestHeader}>
          <div>
            <h2>
              📋 Farmer Procurement Requests
            </h2>

            <p>
              Approve requests only after checking
              live capacity. Approval reserves the
              requested quantity and creates the
              farmer appointment.
            </p>
          </div>

          <button
            style={styles.secondaryButton}
            onClick={async () => {
              await loadRequests();
              await loadAppointments();
            }}
          >
            🔄 Refresh
          </button>
        </div>

        {completionRequests.length > 0 && (
          <div style={styles.completionPanel}>
            <h2>
              🔔 Procurement Completion Notifications
            </h2>

            <p>
              Farmers below reported that they sold
              their crop. Verify the actual received
              quantity before confirming.
            </p>

            {completionRequests.map(
              (appointment) => (
                <div
                  key={appointment.id}
                  style={styles.completionCard}
                >
                  <h3>
                    🌾 {appointment.crop}
                  </h3>

                  <p>
                    <b>Farmer:</b>{" "}
                    {appointment.farmer_name}
                  </p>

                  <p>
                    <b>Center:</b>{" "}
                    {appointment.center_name}
                  </p>

                  <p>
                    <b>Reserved Quantity:</b>{" "}
                    {appointment.reserved_quantity} tons
                  </p>

                  <p>
                    <b>Appointment:</b>{" "}
                    {appointment.appointment_date || "-"}{" "}
                    {appointment.appointment_time || ""}
                  </p>

                  <label>
                    Actual Received Quantity (tons)
                  </label>

                  <input
                    style={styles.input}
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={
                      receivedQuantities[
                        appointment.id
                      ] || ""
                    }
                    onChange={(event) =>
                      setReceivedQuantities(
                        (previous) => ({
                          ...previous,
                          [appointment.id]:
                            event.target.value
                        })
                      )
                    }
                    placeholder="Example: 95"
                  />

                  <button
                    style={styles.approveButton}
                    onClick={() =>
                      confirmProcurement(
                        appointment.id
                      )
                    }
                  >
                    ✓ Confirm Procurement
                  </button>
                </div>
              )
            )}
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
            margin: "26px 0 10px"
          }}
        >
          {[
            ["pending", `Pending (${pending})`],
            ["accepted", `Accepted / Approved (${accepted})`],
            ["rejected", `Rejected (${rejected})`],
            ["completed", `Completed (${completed})`],
            ["suggested", `Suggested Centers (${suggested})`]
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setRequestFilter(value)}
              style={{
                ...styles.secondaryButton,
                background:
                  requestFilter === value ? "#174b36" : "#ffffff",
                color:
                  requestFilter === value ? "#ffffff" : "#174b36",
                fontWeight: requestFilter === value ? 800 : 600
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div style={styles.requestSectionTitle}>
          <div>
            <span style={styles.heroEyebrow}>REQUESTS</span>
            <h2 style={{ margin: "5px 0 0" }}>
              {requestFilter === "suggested"
                ? "Suggested Centers"
                : `${requestFilter.charAt(0).toUpperCase()}${requestFilter.slice(1)} Requests`}
            </h2>
          </div>
          <span style={styles.countBadge}>{currentRequests.length}</span>
        </div>

        {loadingRequests ? (
          <p>Loading requests...</p>
        ) : currentRequests.length === 0 ? (
          <div style={styles.infoCard}>
            No {requestFilter === "suggested" ? "suggested center" : requestFilter} procurement requests.
          </div>
        ) : (
          <div style={styles.requestGrid}>
            {currentRequests.map((requestItem) => {
              const centerName =
                requestItem.center_name ||
                requestItem.procurement_center_name ||
                "Not available";

              const appointment =
                appointments.find(
                  (item) =>
                    Number(
                      item.procurement_request_id
                    ) ===
                    Number(requestItem.id)
                );

              return (
                <div
                  key={requestItem.id}
                  style={styles.requestCard}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                    <h3 style={{ margin: 0, color: "#173e2e", fontSize: "19px" }}>🌾 {requestItem.crop}</h3>
                    <span style={statusStyle(requestItem.status)}>
                      {requestItem.status}
                    </span>
                  </div>

                  <div style={styles.requestDetailsGrid}>
                    <div style={styles.requestDetailItem}>
                      <span style={styles.requestDetailLabel}>Farmer</span>
                      <strong style={styles.requestDetailValue}>{requestItem.farmer_name || "-"}</strong>
                    </div>

                    <div style={styles.requestDetailItem}>
                      <span style={styles.requestDetailLabel}>Farmer ID</span>
                      <strong style={styles.requestDetailValue}>{requestItem.farmer_id || "-"}</strong>
                    </div>

                    <div style={styles.requestDetailItem}>
                      <span style={styles.requestDetailLabel}>Mobile</span>
                      <strong style={styles.requestDetailValue}>{requestItem.mobile_number || "-"}</strong>
                    </div>

                    <div style={styles.requestDetailItem}>
                      <span style={styles.requestDetailLabel}>District</span>
                      <strong style={styles.requestDetailValue}>{requestItem.district || requestItem.center_district || "-"}</strong>
                    </div>

                    <div style={styles.requestDetailItem}>
                      <span style={styles.requestDetailLabel}>Procurement Center</span>
                      <strong style={styles.requestDetailValue}>
                        {centerName} {requestItem.center_id ? `(${requestItem.center_id})` : ""}
                      </strong>
                    </div>

                    <div style={styles.requestDetailItem}>
                      <span style={styles.requestDetailLabel}>Center Location</span>
                      <strong style={styles.requestDetailValue}>{requestItem.center_location || requestItem.location || "-"}</strong>
                    </div>

                    <div style={styles.requestDetailItem}>
                      <span style={styles.requestDetailLabel}>Quantity</span>
                      <strong style={{ ...styles.requestDetailValue, color: "#15803d" }}>
                        {requestItem.quantity} tons
                      </strong>
                    </div>

                    <div style={styles.requestDetailItem}>
                      <span style={styles.requestDetailLabel}>Distance</span>
                      <strong style={styles.requestDetailValue}>
                        {requestItem.distance_km != null
                          ? `${Number(requestItem.distance_km).toFixed(2)} KM`
                          : (requestItem.distance != null ? `${Number(requestItem.distance).toFixed(2)} KM` : "-")}
                      </strong>
                    </div>

                    <div style={styles.requestDetailItem}>
                      <span style={styles.requestDetailLabel}>Vehicle</span>
                      <strong style={styles.requestDetailValue}>{requestItem.vehicle || "-"}</strong>
                    </div>

                    <div style={styles.requestDetailItem}>
                      <span style={styles.requestDetailLabel}>Transport Cost</span>
                      <strong style={styles.requestDetailValue}>
                        {requestItem.transport_cost != null && requestItem.transport_cost > 0
                          ? `₹${Number(requestItem.transport_cost).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : (requestItem.total_cost != null && requestItem.total_cost > 0
                              ? `₹${Number(requestItem.total_cost).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                              : "-")}
                      </strong>
                    </div>

                    <div style={{ ...styles.requestDetailItem, gridColumn: "1 / -1" }}>
                      <span style={styles.requestDetailLabel}>Submitted On</span>
                      <strong style={styles.requestDetailValue}>
                        {requestItem.created_at_display ||
                          (requestItem.created_at
                            ? new Date(requestItem.created_at).toLocaleString("en-IN")
                            : "-")}
                      </strong>
                    </div>
                  </div>

                  {appointment && (
                    <div style={styles.appointmentBox}>
                      <b style={{ color: "#1e40af" }}>📅 Booked Appointment</b>
                      <p style={{ margin: "4px 0" }}>Date: <b>{appointment.appointment_date}</b> | Time: <b>{appointment.appointment_time}</b></p>
                      <p style={{ margin: "4px 0" }}>Reserved: <b>{appointment.reserved_quantity} tons</b></p>
                      <p style={{ margin: "4px 0" }}>Appointment Status: <b>{appointment.status}</b></p>
                    </div>
                  )}

                  {requestItem.status === "pending" && (
                    <>
                      <div style={styles.appointmentInputRow}>
                        <div>
                          <label style={styles.fieldLabel}>
                            Appointment Date
                          </label>
                          <input
                            style={styles.input}
                            type="date"
                            value={
                              appointmentInputs[
                                requestItem.id
                              ]?.date || ""
                            }
                            onChange={(event) =>
                              setAppointmentInputs(
                                (previous) => ({
                                  ...previous,
                                  [requestItem.id]: {
                                    ...previous[
                                      requestItem.id
                                    ],
                                    date:
                                      event.target.value
                                  }
                                })
                              )
                            }
                          />
                        </div>

                        <div>
                          <label style={styles.fieldLabel}>
                            Appointment Time
                          </label>
                          <input
                            style={styles.input}
                            type="time"
                            value={
                              appointmentInputs[
                                requestItem.id
                              ]?.time || ""
                            }
                            onChange={(event) =>
                              setAppointmentInputs(
                                (previous) => ({
                                  ...previous,
                                  [requestItem.id]: {
                                    ...previous[
                                      requestItem.id
                                    ],
                                    time:
                                      event.target.value
                                  }
                                })
                              )
                            }
                          />
                        </div>
                      </div>

                      <div style={styles.buttonRow}>
                        <button
                          style={styles.approveButton}
                          onClick={() =>
                            updateRequestStatus(
                              requestItem.id,
                              "approved",
                              appointmentInputs[
                                requestItem.id
                              ]?.date || "",
                              appointmentInputs[
                                requestItem.id
                              ]?.time || ""
                            )
                          }
                        >
                          ✓ Approve & Book
                        </button>

                        <button
                          style={styles.rejectButton}
                          onClick={() =>
                            updateRequestStatus(
                              requestItem.id,
                              "rejected"
                            )
                          }
                        >
                          ✕ Reject
                        </button>

                        <button
                          style={styles.secondaryButton}
                          onClick={() =>
                            findAlternativeCenter(
                              requestItem
                            )
                          }
                        >
                          Suggest Another Center
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {loadingAppointments && (
          <small>
            Refreshing appointment status...
          </small>
        )}
      </div>
    );
  };

  const renderReport = () => (
    <div>
      <button
        style={styles.backButton}
        onClick={() =>
          setActiveSection("overview")
        }
      >
        ← Back
      </button>

      <h2>📁 Government Session Report</h2>

      {cropData && (
        <div style={styles.reportSection}>
          <h3>🌾 Crop Production</h3>

          <p>
            District: <b>{cropForm.district}</b>
          </p>

          <p>
            Crop: <b>{cropForm.crop}</b>
          </p>

          <p>
            Predicted Production:{" "}
            <b>
              {Number(
                cropData.predicted_production || 0
              ).toFixed(2)}{" "}
              tons
            </b>
          </p>
        </div>
      )}

      {warehouseData && (
        <div style={styles.reportSection}>
          <h3>🏭 Warehouse Capacity</h3>

          <p>
            Present Capacity:{" "}
            <b>
              {warehouseData.present_capacity.toFixed(
                2
              )}{" "}
              tons
            </b>
          </p>

          <p>
            Expected Requirement:{" "}
            <b>
              {warehouseData.predicted_requirement.toFixed(
                2
              )}{" "}
              tons
            </b>
          </p>

          <p>
            <b>
              {warehouseData.recommendation}
            </b>
          </p>
        </div>
      )}

      <div style={styles.reportSection}>
        <h3>📋 Procurement Requests</h3>

        <p>
          Total Requests:{" "}
          <b>{requests.length}</b>
        </p>

        <p>
          Pending: <b>{pending}</b>
        </p>

        <p>
          Accepted: <b>{accepted}</b>
        </p>

        <p>
          Rejected: <b>{rejected}</b>
        </p>
      </div>

      <div style={styles.reportSection}>
        <h3>📝 Activity Log</h3>

        {report.length === 0 ? (
          <p>No activities recorded yet.</p>
        ) : (
          report.map((item) => (
            <div
              key={item.id}
              style={styles.activityItem}
            >
              <div style={styles.activityHeader}>
                <b>{item.title}</b>

                <small>{item.time}</small>
              </div>

              <p>{item.details}</p>
            </div>
          ))
        )}
      </div>

      <button
        style={styles.clearButton}
        onClick={clearReport}
      >
        Clear Session Activity
      </button>
    </div>
  );

  const navigation = [
    ["overview", "▦", "Overview"],
    ["crop", "🌾", "Crop Prediction"],
    ["warehouse", "🏭", "Warehouse"],
    ["requests", "📋", "Requests"],
    ["report", "📁", "Final Report"]
  ];

  return (
    <div style={styles.appShell}>
      <aside style={styles.sidebar}>
        <div style={styles.brandBlock}>
          <div style={styles.brandIcon}>🏛️</div>
          <div>
            <div style={styles.brandName}>AgriGov</div>
            <div style={styles.brandSub}>PROCUREMENT CONTROL</div>
          </div>
        </div>

        <div style={styles.navLabel}>GOVERNMENT WORKSPACE</div>
        <nav style={styles.sideNav}>
          {navigation.map(([key, icon, label]) => (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              style={{
                ...styles.sideNavButton,
                ...(activeSection === key ? styles.sideNavActive : {})
              }}
            >
              <span style={styles.navIcon}>{icon}</span>
              <span>{label}</span>
              {key === "requests" && pending > 0 && (
                <span style={styles.navCount}>{pending}</span>
              )}
            </button>
          ))}
        </nav>

        <div style={styles.sidebarBottom}>
          <div style={styles.govAvatar}>
            {(user?.full_name || user?.name || "G").charAt(0).toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <strong style={styles.govName}>
              {user?.full_name || user?.name || "Government User"}
            </strong>
            <div style={styles.govRole}>
              {user?.designation || user?.department || "Government Officer"}
            </div>
          </div>
          <button style={styles.sidebarLogout} onClick={onLogout}>↗</button>
        </div>
      </aside>

      <main style={styles.mainArea}>
        <header style={styles.topbar}>
          <div>
            <span style={styles.topKicker}>SMART PROCUREMENT PLANNING</span>
            <h1 style={styles.topTitle}>
              {navigation.find(([key]) => key === activeSection)?.[2] || "Overview"}
            </h1>
          </div>
          <div style={styles.livePill}>● SYSTEM LIVE</div>
        </header>

        <div style={styles.content}>
          {uiMessage && (
            <div
              style={{
                marginBottom: "14px",
                padding: "12px 14px",
                border: "1px solid #cfe0d5",
                borderRadius: "10px",
                background: "#f2f8f4",
                color: "#245c42",
                fontSize: "12px",
                fontWeight: 700,
                display: "flex",
                justifyContent: "space-between",
                gap: "12px",
                alignItems: "center"
              }}
            >
              <span style={{ whiteSpace: "pre-line" }}>{uiMessage}</span>
              <button
                type="button"
                onClick={() => setUiMessage("")}
                style={{
                  border: 0,
                  background: "transparent",
                  color: "#245c42",
                  cursor: "pointer",
                  fontWeight: 900
                }}
              >
                ×
              </button>
            </div>
          )}
          {activeSection === "overview" && renderOverview()}
          {activeSection === "crop" && renderCropProduction()}
          {activeSection === "warehouse" && renderWarehouse()}
          {activeSection === "requests" && renderRequests()}
          {activeSection === "report" && renderReport()}
        </div>
      </main>
    </div>
  );

}


function ResultFact({ label, value }) {
  return (
    <div style={styles.resultFact}>
      <span>{label}</span>
      <strong>{value || "-"}</strong>
    </div>
  );
}

function statusStyle(status) {
  const s = String(status || "").toLowerCase();
  if (
    s === "accepted" ||
    s === "approved"
  ) {
    return {
      padding: "5px 12px",
      borderRadius: "12px",
      background: "#e8f7ee",
      color: "#15803d",
      fontWeight: "bold",
      fontSize: "12px",
      textTransform: "capitalize",
      display: "inline-block"
    };
  }

  if (s === "rejected") {
    return {
      padding: "5px 12px",
      borderRadius: "12px",
      background: "#fef2f2",
      color: "#dc2626",
      fontWeight: "bold",
      fontSize: "12px",
      textTransform: "capitalize",
      display: "inline-block"
    };
  }

  if (s === "completed") {
    return {
      padding: "5px 12px",
      borderRadius: "12px",
      background: "#eff6ff",
      color: "#1d4ed8",
      fontWeight: "bold",
      fontSize: "12px",
      textTransform: "capitalize",
      display: "inline-block"
    };
  }

  return {
    padding: "5px 12px",
    borderRadius: "12px",
    background: "#fffbeb",
    color: "#b45309",
    fontWeight: "bold",
    fontSize: "12px",
    textTransform: "capitalize",
    display: "inline-block"
  };
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f4f7f6",
    fontFamily: "Arial, sans-serif"
  },

  header: {
    background: "#173f35",
    color: "white",
    padding: "24px 40px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },

  logoutButton: {
    background: "#dc2626",
    color: "white",
    border: "none",
    padding: "11px 20px",
    borderRadius: "7px",
    cursor: "pointer",
    fontWeight: "bold"
  },

  userCard: {
    margin: "20px 40px",
    padding: "20px",
    background: "white",
    borderRadius: "12px",
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "20px",
    boxShadow:
      "0 2px 8px rgba(0,0,0,0.08)"
  },

  userCardItem: {
    display: "flex",
    flexDirection: "column",
    gap: "7px"
  },

  nav: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    padding: "0 40px 20px"
  },

  navButton: {
    padding: "10px 16px",
    border: "1px solid #d1d5db",
    background: "white",
    borderRadius: "7px",
    cursor: "pointer"
  },

  navActive: {
    padding: "10px 16px",
    border: "none",
    background: "#176b4d",
    color: "white",
    borderRadius: "7px",
    cursor: "pointer",
    fontWeight: "bold"
  },

  content: {
    margin: "0",
    padding: "30px 34px 42px",
    background: "transparent",
    borderRadius: "14px",
    boxShadow:
      "0 2px 10px rgba(0,0,0,0.08)"
  },

  cardGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "20px",
    marginTop: "25px"
  },

  statCard: {
    padding: "24px",
    minHeight: "190px",
    boxSizing: "border-box",
    borderRadius: "18px",
    background: "linear-gradient(145deg,#ffffff,#f5faf6)",
    border: "1px solid #dce8e4"
  },

  formCard: {
    maxWidth: "600px",
    padding: "25px",
    background: "#f8faf9",
    borderRadius: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },

  input: {
    padding: "12px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "14px",
    background: "#ffffff",
    color: "#1f2937",
    colorScheme: "light",
    outline: "none",
    boxSizing: "border-box"
  },

  primaryButton: {
    marginTop: "15px",
    padding: "12px 18px",
    border: "none",
    borderRadius: "7px",
    background: "#176b4d",
    color: "white",
    cursor: "pointer",
    fontWeight: "bold"
  },

  secondaryButton: {
    padding: "10px 14px",
    border: "1px solid #176b4d",
    borderRadius: "7px",
    background: "white",
    color: "#176b4d",
    cursor: "pointer",
    fontWeight: "bold"
  },

  approveButton: {
    padding: "10px 15px",
    border: "none",
    borderRadius: "7px",
    background: "#15803d",
    color: "white",
    cursor: "pointer",
    fontWeight: "bold"
  },

  rejectButton: {
    padding: "10px 15px",
    border: "none",
    borderRadius: "7px",
    background: "#dc2626",
    color: "white",
    cursor: "pointer",
    fontWeight: "bold"
  },

  backButton: {
    marginBottom: "20px",
    padding: "9px 15px",
    border: "1px solid #d1d5db",
    borderRadius: "7px",
    background: "#ffffff",
    color: "#1f2937",
    cursor: "pointer",
    fontWeight: "bold"
  },

  resultCard: {
    marginTop: "25px",
    padding: "25px",
    borderRadius: "12px",
    background: "#f0fdf4",
    border: "1px solid #bbf7d0"
  },

  infoCard: {
    margin: "20px 0",
    padding: "20px",
    background: "#eff6ff",
    borderRadius: "10px"
  },

  bigNumber: {
    fontSize: "34px",
    fontWeight: "bold",
    margin: "20px 0",
    color: "#176b4d"
  },

  capacityRow: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "20px",
    margin: "20px 0"
  },

  capacityBox: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    padding: "18px",
    background: "white",
    borderRadius: "10px"
  },

  recommendation: {
    padding: "18px",
    borderRadius: "10px",
    marginBottom: "20px"
  },

  warning: {
    background: "#fff7ed",
    border: "1px solid #fed7aa"
  },

  success: {
    background: "#f0fdf4",
    border: "1px solid #bbf7d0"
  },

  requestHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    flexWrap: "wrap"
  },

  requestCard: {
    marginTop: "15px",
    padding: "22px",
    border: "1px solid #dce8e0",
    borderRadius: "14px",
    background: "#ffffff",
    boxShadow: "0 4px 15px rgba(20, 60, 40, 0.05)",
    boxSizing: "border-box"
  },

  requestDetailsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "12px",
    margin: "14px 0",
    padding: "14px",
    background: "#f9fafb",
    border: "1px solid #f3f4f6",
    borderRadius: "10px"
  },

  requestDetailItem: {
    display: "flex",
    flexDirection: "column",
    gap: "3px"
  },

  requestDetailLabel: {
    fontSize: "11px",
    fontWeight: 700,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: "0.5px"
  },

  requestDetailValue: {
    fontSize: "13px",
    fontWeight: 700,
    color: "#1f2937",
    overflowWrap: "anywhere"
  },

  buttonRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginTop: "15px"
  },

  appointmentInputRow: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "12px",
    marginTop: "15px"
  },

  appointmentBox: {
    marginTop: "15px",
    padding: "14px",
    background: "#eff6ff",
    borderRadius: "8px",
    border: "1px solid #bfdbfe"
  },

  completionPanel: {
    marginTop: "20px",
    padding: "20px",
    background: "#fff7ed",
    border: "1px solid #fed7aa",
    borderRadius: "12px"
  },

  completionCard: {
    marginTop: "15px",
    padding: "18px",
    background: "white",
    borderRadius: "10px",
    border: "1px solid #fdba74",
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },

  reportSection: {
    marginTop: "20px",
    padding: "20px",
    borderRadius: "10px",
    background: "#f8faf9",
    border: "1px solid #dce8e4"
  },

  activityItem: {
    padding: "15px",
    marginTop: "10px",
    background: "white",
    borderRadius: "8px",
    borderLeft: "4px solid #176b4d"
  },

  activityHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "20px"
  },

  clearButton: {
    marginTop: "20px",
    padding: "10px 16px",
    border: "none",
    borderRadius: "7px",
    background: "#6b7280",
    color: "white",
    cursor: "pointer"
  },

  appShell: {
    minHeight: "100vh",
    display: "flex",
    background: "linear-gradient(135deg, #f4f8f5 0%, #eef5f0 55%, #f8f6ef 100%)",
    fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
    color: "#18352a"
  },
  sidebar: {
    width: "258px",
    minWidth: "258px",
    minHeight: "100vh",
    position: "sticky",
    top: 0,
    alignSelf: "flex-start",
    boxSizing: "border-box",
    padding: "28px 18px 20px",
    background: "linear-gradient(180deg, #123d2d 0%, #0b2f23 100%)",
    color: "white",
    display: "flex",
    flexDirection: "column",
    boxShadow: "12px 0 35px rgba(11,47,35,.12)"
  },
  brandBlock: { display: "flex", alignItems: "center", gap: "12px", padding: "0 8px 28px" },
  brandIcon: {
    width: "46px", height: "46px", borderRadius: "15px", display: "grid",
    placeItems: "center", fontSize: "24px",
    background: "linear-gradient(145deg, rgba(255,255,255,.2), rgba(255,255,255,.06))",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,.25), 0 10px 22px rgba(0,0,0,.15)"
  },
  brandName: { fontSize: "20px", fontWeight: 800, letterSpacing: ".2px" },
  brandSub: { fontSize: "9px", opacity: .65, letterSpacing: "1.4px", marginTop: "3px" },
  navLabel: { fontSize: "10px", letterSpacing: "1.2px", opacity: .5, padding: "8px 12px 10px" },
  sideNav: { display: "flex", flexDirection: "column", gap: "7px" },
  sideNavButton: {
    width: "100%", border: "none", color: "rgba(255,255,255,.76)",
    background: "transparent", padding: "13px 14px", borderRadius: "12px",
    display: "flex", alignItems: "center", gap: "12px", cursor: "pointer",
    fontSize: "14px", textAlign: "left"
  },
  sideNavActive: {
    color: "white", background: "rgba(255,255,255,.13)",
    boxShadow: "inset 3px 0 0 #8fd19e, 0 8px 18px rgba(0,0,0,.08)"
  },
  navIcon: { width: "22px", textAlign: "center", fontSize: "17px" },
  navCount: {
    marginLeft: "auto", minWidth: "22px", height: "22px", borderRadius: "11px",
    display: "grid", placeItems: "center", background: "#d9f3df", color: "#174a34",
    fontSize: "11px", fontWeight: 800
  },
  sidebarBottom: {
    marginTop: "auto", display: "grid", gridTemplateColumns: "40px minmax(0,1fr) 32px",
    alignItems: "center", gap: "10px", padding: "16px 8px 0",
    borderTop: "1px solid rgba(255,255,255,.1)"
  },
  govAvatar: {
    width: "40px", height: "40px", borderRadius: "13px", display: "grid",
    placeItems: "center", background: "#d9f3df", color: "#164532", fontWeight: 900
  },
  govName: { display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: "13px" },
  govRole: { fontSize: "10px", opacity: .6, marginTop: "3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  sidebarLogout: { border: 0, background: "rgba(255,255,255,.1)", color: "white", width: "32px", height: "32px", borderRadius: "9px", cursor: "pointer" },
  mainArea: { flex: 1, minWidth: 0 },
  topbar: {
    minHeight: "92px", padding: "20px 34px", boxSizing: "border-box",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    background: "rgba(255,255,255,.82)", borderBottom: "1px solid #e1ebe4"
  },
  topKicker: { fontSize: "10px", fontWeight: 800, letterSpacing: "1.5px", color: "#6a8075" },
  topTitle: { margin: "5px 0 0", fontSize: "25px", color: "#173e2e" },
  livePill: { padding: "9px 13px", borderRadius: "20px", background: "#e8f6ec", color: "#237447", fontSize: "10px", fontWeight: 900, letterSpacing: ".6px" },
  sectionPage: { width: "100%" },
  pageHero: {
    minHeight: "155px", borderRadius: "22px", padding: "28px 32px", boxSizing: "border-box",
    display: "flex", justifyContent: "space-between", alignItems: "center",
    overflow: "hidden", position: "relative", marginBottom: "22px",
    boxShadow: "0 16px 36px rgba(25,71,51,.10)"
  },
  cropHero: {
    background: "radial-gradient(circle at 78% 20%, rgba(191,230,185,.42), transparent 28%), linear-gradient(120deg, #174b36 0%, #2c7650 55%, #80aa70 100%)",
    color: "white"
  },
  heroEyebrow: { fontSize: "10px", fontWeight: 900, letterSpacing: "1.6px", color: "#6c8578" },
  heroTitle: { margin: "8px 0", fontSize: "29px", color: "inherit" },
  heroText: { margin: 0, maxWidth: "600px", opacity: .82, lineHeight: 1.6 },
  hero3d: {
    width: "100px", height: "100px", borderRadius: "28px", display: "grid",
    placeItems: "center", fontSize: "55px", background: "rgba(255,255,255,.14)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,.35), 0 18px 30px rgba(0,0,0,.15)",
    transform: "rotate(-4deg)"
  },
  splitWorkspace: { display: "grid", gridTemplateColumns: "minmax(0, .9fr) minmax(0, 1.1fr)", gap: "22px" },
  formPanel: {
    background: "white", border: "1px solid #dfe9e2", borderRadius: "20px",
    padding: "24px", display: "flex", flexDirection: "column", gap: "9px",
    boxShadow: "0 10px 30px rgba(20,67,46,.06)"
  },
  resultPanel: {
    minHeight: "500px", background: "linear-gradient(145deg,#ffffff,#f4faf5)",
    border: "1px solid #dfe9e2", borderRadius: "20px", padding: "24px",
    boxShadow: "0 10px 30px rgba(20,67,46,.06)", boxSizing: "border-box"
  },
  panelHeading: { display: "flex", gap: "12px", alignItems: "center", marginBottom: "10px" },
  panelIcon: { width: "40px", height: "40px", borderRadius: "12px", display: "grid", placeItems: "center", background: "#eaf5ed", color: "#176b4d", fontWeight: 900 },
  panelTitle: { margin: 0, fontSize: "18px", color: "#193d2f" },
  panelText: { margin: "3px 0 0", fontSize: "12px", color: "#75877e" },
  fieldLabel: { fontSize: "12px", fontWeight: 800, color: "#4c6257", marginTop: "4px" },
  twoFieldGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" },
  resultEmpty: { minHeight: "390px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", color: "#6f8178" },
  empty3d: { fontSize: "62px", filter: "drop-shadow(0 12px 12px rgba(30,80,55,.15))" },
  resultSummary: { padding: "25px", borderRadius: "16px", background: "#eaf6ed", display: "flex", flexDirection: "column", gap: "6px", margin: "18px 0" },
  tons: { fontSize: "14px", fontWeight: 700, color: "#5c7568" },
  resultFacts: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" },
  resultFact: { padding: "13px", borderRadius: "12px", background: "#f6f8f7", display: "flex", flexDirection: "column", gap: "4px", fontSize: "12px", color: "#74847c" },
  requestGrid: { display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: "16px" },
  requestSectionTitle: { display: "flex", justifyContent: "space-between", alignItems: "center", margin: "26px 0 14px" },
  countBadge: { minWidth: "34px", height: "34px", borderRadius: "17px", display: "grid", placeItems: "center", background: "#174b36", color: "white", fontWeight: 900 },
  historySection: { marginTop: "34px", paddingTop: "8px", borderTop: "1px solid #e1e9e4" },
  historyBadge: { padding: "7px 11px", borderRadius: "14px", background: "#edf1ef", color: "#66766e", fontSize: "12px", fontWeight: 800 },
  historyGrid: { display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: "10px" },
  historyCard: { padding: "14px 16px", border: "1px solid #e2e8e4", borderRadius: "12px", background: "#fafcfb", display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center" },
  historyMeta: { marginTop: "5px", fontSize: "11px", color: "#75847d" }

};

export default GovernmentDashboard;