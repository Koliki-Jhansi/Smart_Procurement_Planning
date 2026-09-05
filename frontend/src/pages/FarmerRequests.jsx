import React, { useEffect, useState } from "react";
import axios from "axios";

const API = "http://127.0.0.1:5000";

function FarmerRequests({ user, goBack }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // =====================================================
  // FARMER MOBILE
  // =====================================================

  const mobile =
    user?.mobile_number ||
    user?.mobile ||
    "";

  // =====================================================
  // LOAD FARMER REQUESTS
  // =====================================================

  const loadRequests = async () => {
    if (!mobile) {
      setError(
        "Farmer mobile number is not available."
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.get(
        `${API}/api/farmer/requests`,
        {
          params: {
            mobile_number: mobile,
          },
        }
      );

      const data = response.data;

      if (Array.isArray(data)) {
        setRequests(data);
      } else if (
        Array.isArray(data?.requests)
      ) {
        setRequests(data.requests);
      } else {
        setRequests([]);
      }
    } catch (err) {
      console.error(
        "Load farmer requests error:",
        err
      );

      setRequests([]);

      setError(
        err.response?.data?.message ||
          "Unable to load procurement requests."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // LOAD WHEN PAGE OPENS
  // =====================================================

  useEffect(() => {
    loadRequests();
  }, [mobile]);

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (date) => {
    if (!date) {
      return "N/A";
    }

    try {
      return new Date(date).toLocaleString();
    } catch {
      return date;
    }
  };

  // =====================================================
  // STATUS
  // =====================================================

  const getStatus = (request) => {
    return String(
      request?.status ||
        request?.request_status ||
        "pending"
    ).toLowerCase();
  };

  const getStatusText = (status) => {
    if (status === "accepted") {
      return "✅ Accepted";
    }

    if (status === "rejected") {
      return "❌ Rejected";
    }

    if (status === "pending") {
      return "⏳ Pending";
    }

    return status;
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div style={styles.page}>

      {/* HEADER */}

      <header style={styles.header}>

        <div>
          <h1 style={styles.title}>
            📋 My Procurement Requests
          </h1>

          <p style={styles.subtitle}>
            Track your crop procurement requests
          </p>
        </div>

        <button
          onClick={goBack}
          style={styles.backButton}
        >
          ← Dashboard
        </button>

      </header>

      {/* CONTENT */}

      <main style={styles.container}>

        <div style={styles.card}>

          {/* TOP */}

          <div style={styles.top}>

            <div>
              <h2 style={styles.heading}>
                Procurement Request Status
              </h2>

              <p style={styles.description}>
                View all procurement requests
                submitted to procurement centers.
              </p>
            </div>

            <button
              onClick={loadRequests}
              disabled={loading}
              style={styles.refresh}
            >
              {loading
                ? "Loading..."
                : "🔄 Refresh"}
            </button>

          </div>

          {/* FARMER INFO */}

          <div style={styles.farmerInfo}>

            <div>
              <span style={styles.label}>
                Farmer
              </span>

              <strong>
                {user?.name ||
                  user?.farmer_name ||
                  "Farmer"}
              </strong>
            </div>

            <div>
              <span style={styles.label}>
                Mobile
              </span>

              <strong>
                {mobile || "N/A"}
              </strong>
            </div>

            <div>
              <span style={styles.label}>
                District
              </span>

              <strong>
                {user?.district || "N/A"}
              </strong>
            </div>

          </div>

          {/* ERROR */}

          {error && (
            <div style={styles.error}>
              <b>⚠️ Error:</b>{" "}
              {error}
            </div>
          )}

          {/* LOADING */}

          {loading && (
            <div style={styles.loading}>
              <h3>
                Loading procurement requests...
              </h3>

              <p>
                Please wait while we retrieve
                your requests.
              </p>
            </div>
          )}

          {/* EMPTY */}

          {!loading &&
            !error &&
            requests.length === 0 && (
              <div style={styles.empty}>

                <div style={styles.emptyIcon}>
                  📨
                </div>

                <h2>
                  No Procurement Requests
                </h2>

                <p>
                  You have not sent any procurement
                  requests yet.
                </p>

                <p>
                  Go to{" "}
                  <b>Procurement Centers</b>{" "}
                  to select a center and send
                  a request.
                </p>

              </div>
            )}

          {/* REQUEST LIST */}

          {!loading &&
            requests.length > 0 && (
              <div style={styles.list}>

                <h3>
                  Your Requests (
                  {requests.length})
                </h3>

                {requests.map(
                  (request, index) => {

                    const status =
                      getStatus(request);

                    return (
                      <div
                        key={
                          request.id ||
                          request.request_id ||
                          index
                        }
                        style={styles.request}
                      >

                        {/* REQUEST DETAILS */}

                        <div
                          style={
                            styles.requestDetails
                          }
                        >

                          <div
                            style={
                              styles.requestHeader
                            }
                          >

                            <h3>
                              🏪{" "}
                              {request.center_name ||
                                request.procurement_center_name ||
                                request.Procurement_Center_Name ||
                                "Procurement Center"}
                            </h3>

                            <span
                              style={getStatusStyle(
                                status
                              )}
                            >
                              {getStatusText(
                                status
                              )}
                            </span>

                          </div>

                          <div
                            style={
                              styles.detailsGrid
                            }
                          >

                            <div>
                              <span
                                style={
                                  styles.detailLabel
                                }
                              >
                                Crop
                              </span>

                              <strong>
                                {request.crop ||
                                  request.crop_name ||
                                  request.Crop ||
                                  "N/A"}
                              </strong>
                            </div>

                            <div>
                              <span
                                style={
                                  styles.detailLabel
                                }
                              >
                                Quantity
                              </span>

                              <strong>
                                {request.quantity ||
                                  request.quantity_tons ||
                                  request.Quantity_Tons ||
                                  "N/A"}{" "}
                                Tons
                              </strong>
                            </div>

                            <div>
                              <span
                                style={
                                  styles.detailLabel
                                }
                              >
                                District
                              </span>

                              <strong>
                                {request.district ||
                                  request.District ||
                                  user?.district ||
                                  "N/A"}
                              </strong>
                            </div>

                            <div>
                              <span
                                style={
                                  styles.detailLabel
                                }
                              >
                                Request Date
                              </span>

                              <strong>
                                {formatDate(
                                  request.created_at ||
                                    request.request_date ||
                                    request.createdAt
                                )}
                              </strong>
                            </div>

                          </div>

                          {/* OPTIONAL EXTRA DETAILS */}

                          {(request.transport_cost ||
                            request.total_cost ||
                            request.cost_per_ton) && (
                            <div
                              style={
                                styles.transportInfo
                              }
                            >

                              <h4>
                                🚛 Transport
                                Information
                              </h4>

                              {request.transport_cost && (
                                <p>
                                  <b>
                                    Transport Cost:
                                  </b>{" "}
                                  ₹
                                  {Number(
                                    request.transport_cost
                                  ).toFixed(2)}
                                </p>
                              )}

                              {request.total_cost && (
                                <p>
                                  <b>
                                    Total Cost:
                                  </b>{" "}
                                  ₹
                                  {Number(
                                    request.total_cost
                                  ).toFixed(2)}
                                </p>
                              )}

                              {request.cost_per_ton && (
                                <p>
                                  <b>
                                    Cost per Ton:
                                  </b>{" "}
                                  ₹
                                  {Number(
                                    request.cost_per_ton
                                  ).toFixed(2)}
                                </p>
                              )}

                            </div>
                          )}

                          {/* STATUS MESSAGE */}

                          <div
                            style={getStatusMessageStyle(
                              status
                            )}
                          >

                            {status ===
                              "pending" && (
                              <p>
                                ⏳ Your request is
                                waiting for the
                                procurement center
                                to respond.
                              </p>
                            )}

                            {status ===
                              "accepted" && (
                              <p>
                                ✅ Your request has
                                been accepted by the
                                procurement center.
                              </p>
                            )}

                            {status ===
                              "rejected" && (
                              <p>
                                ❌ Your request has
                                been rejected by the
                                procurement center.
                              </p>
                            )}

                            {![
                              "pending",
                              "accepted",
                              "rejected",
                            ].includes(status) && (
                              <p>
                                Current request
                                status:{" "}
                                <b>{status}</b>
                              </p>
                            )}

                          </div>

                        </div>

                      </div>
                    );
                  }
                )}

              </div>
            )}

        </div>

      </main>

    </div>
  );
}

// =====================================================
// STATUS STYLE
// =====================================================

function getStatusStyle(status) {

  if (status === "accepted") {
    return {
      ...styles.status,
      background: "#d9f2df",
      color: "#176b2c",
    };
  }

  if (status === "rejected") {
    return {
      ...styles.status,
      background: "#ffe0e0",
      color: "#b42323",
    };
  }

  return {
    ...styles.status,
    background: "#fff3cd",
    color: "#856404",
  };
}

// =====================================================
// STATUS MESSAGE STYLE
// =====================================================

function getStatusMessageStyle(status) {

  if (status === "accepted") {
    return {
      ...styles.statusMessage,
      background: "#edf9ef",
      borderLeft:
        "4px solid #28a745",
    };
  }

  if (status === "rejected") {
    return {
      ...styles.statusMessage,
      background: "#fff1f1",
      borderLeft:
        "4px solid #c0392b",
    };
  }

  return {
    ...styles.statusMessage,
    background: "#fffaf0",
    borderLeft:
      "4px solid #f0ad00",
  };
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
    padding: "20px 40px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxSizing: "border-box",
  },

  title: {
    margin: 0,
  },

  subtitle: {
    margin: "7px 0 0",
    opacity: 0.9,
  },

  backButton: {
    padding: "10px 18px",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    background: "white",
    color: "#1f4d3a",
    fontWeight: "bold",
  },

  container: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "40px 20px",
    boxSizing: "border-box",
  },

  card: {
    background: "white",
    padding: "30px",
    borderRadius: "12px",
    boxShadow:
      "0 3px 15px rgba(0,0,0,0.1)",
  },

  top: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    flexWrap: "wrap",
  },

  heading: {
    color: "#1f4d3a",
    marginBottom: "8px",
  },

  description: {
    color: "#666",
    marginTop: 0,
  },

  refresh: {
    padding: "10px 16px",
    background: "#1f4d3a",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
  },

  farmerInfo: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "15px",
    marginTop: "25px",
    padding: "18px",
    background: "#f5f8f6",
    borderRadius: "8px",
  },

  label: {
    display: "block",
    color: "#777",
    fontSize: "13px",
    marginBottom: "5px",
  },

  error: {
    marginTop: "20px",
    padding: "14px",
    color: "#b42323",
    background: "#fff0f0",
    borderRadius: "7px",
    borderLeft:
      "4px solid #c0392b",
  },

  loading: {
    marginTop: "25px",
    padding: "25px",
    textAlign: "center",
    background: "#f5f7f6",
    borderRadius: "8px",
  },

  empty: {
    marginTop: "25px",
    padding: "40px 20px",
    textAlign: "center",
    background: "#f5f7f6",
    borderRadius: "10px",
  },

  emptyIcon: {
    fontSize: "45px",
  },

  list: {
    marginTop: "30px",
  },

  request: {
    marginTop: "15px",
    padding: "20px",
    border: "1px solid #ddd",
    borderRadius: "10px",
    background: "#fff",
  },

  requestDetails: {
    width: "100%",
  },

  requestHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    flexWrap: "wrap",
    marginBottom: "20px",
  },

  status: {
    display: "inline-block",
    padding: "8px 14px",
    borderRadius: "20px",
    fontWeight: "bold",
    fontSize: "14px",
  },

  detailsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "18px",
    padding: "15px",
    background: "#f8faf9",
    borderRadius: "8px",
  },

  detailLabel: {
    display: "block",
    color: "#777",
    fontSize: "13px",
    marginBottom: "5px",
  },

  transportInfo: {
    marginTop: "15px",
    padding: "15px",
    background: "#eef5f1",
    borderRadius: "8px",
  },

  statusMessage: {
    marginTop: "15px",
    padding: "12px 15px",
    borderRadius: "6px",
  },
};

export default FarmerRequests;