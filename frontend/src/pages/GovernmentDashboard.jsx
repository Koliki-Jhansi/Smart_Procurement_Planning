import React, { useEffect, useState } from "react";
import axios from "axios";

const API = "http://127.0.0.1:5000";

function GovernmentDashboard({ user, onLogout }) {
  const [activeSection, setActiveSection] = useState("overview");

  const [cropData, setCropData] = useState(null);
  const [warehouseData, setWarehouseData] = useState(null);
  const [requests, setRequests] = useState([]);
  const [centers, setCenters] = useState([]);

  const [loadingCrop, setLoadingCrop] = useState(false);
  const [loadingWarehouse, setLoadingWarehouse] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);

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

  const updateRequestStatus = async (requestId, status) => {
    try {
      const response = await axios.put(
        `${API}/api/procurement-requests/${requestId}/status`,
        {
          status
        },
        {
          headers: {
            "X-Admin-Mobile": user?.mobile_number || ""
          }
        }
      );

      if (response.data.success) {
        const updatedRequest =
          response.data.request || response.data.data;

        setRequests((previous) =>
          previous.map((request) =>
            request.id === requestId
              ? {
                  ...request,
                  ...(updatedRequest || {}),
                  status:
                    updatedRequest?.status || status
                }
              : request
          )
        );

        const selectedRequest = requests.find(
          (item) => item.id === requestId
        );

        addReport(
          status === "accepted" || status === "approved"
            ? "Procurement Request Approved"
            : "Procurement Request Rejected",
          selectedRequest
            ? `${selectedRequest.crop} request of ${selectedRequest.quantity} tons has been ${status}.`
            : `Request ${requestId} was ${status}.`,
          status === "accepted" || status === "approved"
            ? "success"
            : "warning"
        );
      } else {
        alert(
          response.data.message ||
            "Unable to update request."
        );
      }
    } catch (error) {
      console.error("Status update error:", error);

      alert(
        error.response?.data?.message ||
          "Unable to update request."
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
    <div>
      <button
        style={styles.backButton}
        onClick={() =>
          setActiveSection("overview")
        }
      >
        ← Back
      </button>

      <h2>🌾 Crop Production Prediction</h2>

      <div style={styles.formCard}>
        <label>District</label>

        <input
          style={styles.input}
          value={cropForm.district}
          onChange={(e) =>
            setCropForm({
              ...cropForm,
              district: e.target.value
            })
          }
          placeholder="Enter district"
        />

        <label>Crop</label>

        <select
          style={styles.input}
          value={cropForm.crop}
          onChange={(e) =>
            setCropForm({
              ...cropForm,
              crop: e.target.value
            })
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

        <label>Season</label>

        <select
          style={styles.input}
          value={cropForm.season}
          onChange={(e) =>
            setCropForm({
              ...cropForm,
              season: e.target.value
            })
          }
        >
          <option>Kharif</option>
          <option>Rabi</option>
          <option>Summer</option>
        </select>

        <label>Year</label>

        <input
          style={styles.input}
          type="number"
          value={cropForm.year}
          onChange={(e) =>
            setCropForm({
              ...cropForm,
              year: e.target.value
            })
          }
        />

        <label>Present Cultivated Area</label>

        <input
          style={styles.input}
          type="number"
          value={cropForm.area}
          onChange={(e) =>
            setCropForm({
              ...cropForm,
              area: e.target.value
            })
          }
          placeholder="Area"
        />

        <button
          style={styles.primaryButton}
          onClick={predictCropProduction}
          disabled={loadingCrop}
        >
          {loadingCrop
            ? "Predicting..."
            : "Predict Crop Production"}
        </button>
      </div>

      {cropData && (
        <div style={styles.resultCard}>
          <h3>📊 Production Prediction</h3>

          <p>
            <b>District:</b> {cropForm.district}
          </p>

          <p>
            <b>Crop:</b> {cropForm.crop}
          </p>

          <p>
            <b>Season:</b> {cropForm.season}
          </p>

          <p>
            <b>Area:</b> {cropForm.area}
          </p>

          <div style={styles.bigNumber}>
            {Number(
              cropData.predicted_production || 0
            ).toFixed(2)}{" "}
            tons
          </div>

          <button
            style={styles.primaryButton}
            onClick={() =>
              setActiveSection("warehouse")
            }
          >
            Continue to Warehouse Analysis →
          </button>
        </div>
      )}
    </div>
  );

  const renderWarehouse = () => (
    <div>
      <button
        style={styles.backButton}
        onClick={() =>
          setActiveSection("overview")
        }
      >
        ← Back
      </button>

      <h2>🏭 Warehouse Capacity Analysis</h2>

      {cropData && (
        <div style={styles.infoCard}>
          <b>Predicted Crop Production: </b>

          {Number(
            cropData.predicted_production || 0
          ).toFixed(2)}{" "}
          tons
        </div>
      )}

      <div style={styles.formCard}>
        <label>District</label>

        <input
          style={styles.input}
          value={warehouseForm.district}
          onChange={(e) =>
            setWarehouseForm({
              ...warehouseForm,
              district: e.target.value
            })
          }
        />

        <label>Present Warehouse Capacity</label>

        <input
          style={styles.input}
          type="number"
          value={
            warehouseForm.presentCapacity
          }
          onChange={(e) =>
            setWarehouseForm({
              ...warehouseForm,
              presentCapacity: e.target.value
            })
          }
          placeholder="Capacity in tons"
        />

        <button
          style={styles.primaryButton}
          onClick={checkWarehouseCapacity}
          disabled={loadingWarehouse}
        >
          {loadingWarehouse
            ? "Checking..."
            : "Check Warehouse Capacity"}
        </button>
      </div>

      {warehouseData && (
        <div style={styles.resultCard}>
          <h3>Warehouse Recommendation</h3>

          <div style={styles.capacityRow}>
            <div style={styles.capacityBox}>
              <span>Predicted Requirement</span>

              <strong>
                {warehouseData.predicted_requirement.toFixed(
                  2
                )}{" "}
                tons
              </strong>
            </div>

            <div style={styles.capacityBox}>
              <span>Present Capacity</span>

              <strong>
                {warehouseData.present_capacity.toFixed(
                  2
                )}{" "}
                tons
              </strong>
            </div>
          </div>

          <div
            style={{
              ...styles.recommendation,
              ...(warehouseData.difference < 0
                ? styles.warning
                : styles.success)
            }}
          >
            <b>
              {warehouseData.recommendation}
            </b>
          </div>

          <button
            style={styles.primaryButton}
            onClick={() =>
              setActiveSection("requests")
            }
          >
            Continue to Farmer Requests →
          </button>
        </div>
      )}
    </div>
  );

  const renderRequests = () => (
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
          <h2>📋 Farmer Procurement Requests</h2>

          <p>
            Approve or reject procurement requests and
            suggest alternative centers when required.
          </p>
        </div>

        <button
          style={styles.secondaryButton}
          onClick={loadRequests}
        >
          🔄 Refresh
        </button>
      </div>

      {loadingRequests ? (
        <p>Loading requests...</p>
      ) : requests.length === 0 ? (
        <div style={styles.infoCard}>
          No procurement requests found.
        </div>
      ) : (
        <div>
          {requests.map((request) => {
            const centerName =
              request.center_name ||
              request.procurement_center_name ||
              "Not available";

            return (
              <div
                key={request.id}
                style={styles.requestCard}
              >
                <h3>{request.crop}</h3>

                <p>
                  <b>Farmer:</b>{" "}
                  {request.farmer_name || "-"}
                </p>

                <p>
                  <b>Farmer ID:</b>{" "}
                  {request.farmer_id || "-"}
                </p>

                <p>
                  <b>Mobile:</b>{" "}
                  {request.mobile_number || "-"}
                </p>

                <p>
                  <b>Center:</b> {centerName}
                </p>

                <p>
                  <b>District:</b>{" "}
                  {request.district || "-"}
                </p>

                <p>
                  <b>Quantity:</b>{" "}
                  {request.quantity} tons
                </p>

                <p>
                  <b>Distance:</b>{" "}
                  {request.distance_km || 0} km
                </p>

                <p>
                  <b>Status:</b>{" "}

                  <span
                    style={statusStyle(
                      request.status
                    )}
                  >
                    {request.status}
                  </span>
                </p>

                {request.status === "pending" && (
                  <div style={styles.buttonRow}>
                    <button
                      style={styles.approveButton}
                      onClick={() =>
                        updateRequestStatus(
                          request.id,
                          "accepted"
                        )
                      }
                    >
                      ✓ Approve
                    </button>

                    <button
                      style={styles.rejectButton}
                      onClick={() =>
                        updateRequestStatus(
                          request.id,
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
                          request
                        )
                      }
                    >
                      Suggest Another Center
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

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

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1>🏛️ Government Control Panel</h1>

          <p>Smart Crop Procurement Planning</p>
        </div>

        <button
          style={styles.logoutButton}
          onClick={onLogout}
        >
          Logout
        </button>
      </header>

      <div style={styles.userCard}>
        <div style={styles.userCardItem}>
          <b>Name</b>

          <span>
            {user?.full_name ||
              user?.name ||
              "Government User"}
          </span>
        </div>

        <div style={styles.userCardItem}>
          <b>Mobile</b>

          <span>
            {user?.mobile_number || "-"}
          </span>
        </div>

        <div style={styles.userCardItem}>
          <b>Department</b>

          <span>
            {user?.department || "-"}
          </span>
        </div>

        <div style={styles.userCardItem}>
          <b>Designation</b>

          <span>
            {user?.designation || "-"}
          </span>
        </div>

        <div style={styles.userCardItem}>
          <b>Role</b>

          <span>
            {user?.role || "government"}
          </span>
        </div>
      </div>

      <nav style={styles.nav}>
        <button
          style={
            activeSection === "overview"
              ? styles.navActive
              : styles.navButton
          }
          onClick={() =>
            setActiveSection("overview")
          }
        >
          🏠 Overview
        </button>

        <button
          style={
            activeSection === "crop"
              ? styles.navActive
              : styles.navButton
          }
          onClick={() =>
            setActiveSection("crop")
          }
        >
          🌾 Crop Production
        </button>

        <button
          style={
            activeSection === "warehouse"
              ? styles.navActive
              : styles.navButton
          }
          onClick={() =>
            setActiveSection("warehouse")
          }
        >
          🏭 Warehouse
        </button>

        <button
          style={
            activeSection === "requests"
              ? styles.navActive
              : styles.navButton
          }
          onClick={() =>
            setActiveSection("requests")
          }
        >
          📋 Requests
        </button>

        <button
          style={
            activeSection === "report"
              ? styles.navActive
              : styles.navButton
          }
          onClick={() =>
            setActiveSection("report")
          }
        >
          📁 Final Report
        </button>
      </nav>

      <main style={styles.content}>
        {activeSection === "overview" &&
          renderOverview()}

        {activeSection === "crop" &&
          renderCropProduction()}

        {activeSection === "warehouse" &&
          renderWarehouse()}

        {activeSection === "requests" &&
          renderRequests()}

        {activeSection === "report" &&
          renderReport()}
      </main>
    </div>
  );
}

function statusStyle(status) {
  if (
    status === "accepted" ||
    status === "approved"
  ) {
    return {
      color: "#15803d",
      fontWeight: "bold",
      textTransform: "capitalize"
    };
  }

  if (status === "rejected") {
    return {
      color: "#dc2626",
      fontWeight: "bold",
      textTransform: "capitalize"
    };
  }

  return {
    color: "#d97706",
    fontWeight: "bold",
    textTransform: "capitalize"
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
    margin: "0 40px 40px",
    padding: "30px",
    background: "white",
    borderRadius: "14px",
    boxShadow:
      "0 2px 10px rgba(0,0,0,0.08)"
  },

  cardGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "20px",
    marginTop: "25px"
  },

  statCard: {
    padding: "24px",
    borderRadius: "12px",
    background: "#f8faf9",
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
    borderRadius: "7px",
    fontSize: "15px"
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
    cursor: "pointer"
  },

  rejectButton: {
    padding: "10px 15px",
    border: "none",
    borderRadius: "7px",
    background: "#dc2626",
    color: "white",
    cursor: "pointer"
  },

  backButton: {
    marginBottom: "20px",
    padding: "9px 15px",
    border: "none",
    borderRadius: "7px",
    background: "#e5e7eb",
    cursor: "pointer"
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
    padding: "20px",
    border: "1px solid #ddd",
    borderRadius: "10px",
    background: "#fafafa"
  },

  buttonRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginTop: "15px"
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
  }
};

export default GovernmentDashboard;