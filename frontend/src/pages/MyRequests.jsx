import React from "react";

function MyRequests({
  requests = [],
  appointments = [],
  loadingRequests = false,
  completionSaving = null,
  markProcurementCompleted
}) {
  // =====================================================
  // HELPERS
  // =====================================================

  const getAppointment = (requestId) => {
    return appointments.find(
      (item) =>
        Number(item?.procurement_request_id) ===
        Number(requestId)
    );
  };

  const formatDate = (value) => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  const formatMoney = (value) => {
    const amount = Number(value || 0);

    return `₹${amount.toLocaleString("en-IN", {
      maximumFractionDigits: 2
    })}`;
  };

  const getStatusStyle = (status) => {
    const currentStatus = String(
      status || "pending"
    ).toLowerCase();

    if (
      currentStatus === "approved" ||
      currentStatus === "booked"
    ) {
      return {
        background: "#eaf7ef",
        color: "#177647",
        border: "1px solid #cce8d7"
      };
    }

    if (currentStatus === "completed") {
      return {
        background: "#e7f7ed",
        color: "#126b40",
        border: "1px solid #c7e8d3"
      };
    }

    if (
      currentStatus === "rejected" ||
      currentStatus === "cancelled"
    ) {
      return {
        background: "#fff0ee",
        color: "#b34237",
        border: "1px solid #f1d0cb"
      };
    }

    if (
      currentStatus === "completion_requested"
    ) {
      return {
        background: "#eef4ff",
        color: "#315f99",
        border: "1px solid #d6e2f5"
      };
    }

    return {
      background: "#fff7e5",
      color: "#956610",
      border: "1px solid #efdfb7"
    };
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loadingRequests) {
    return (
      <div style={styles.page}>
        <div style={styles.stateCard}>
          <div style={styles.stateIcon}>↻</div>

          <h2 style={styles.stateTitle}>
            Loading Requests...
          </h2>

          <p style={styles.stateText}>
            Please wait while your procurement
            requests are loaded.
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div style={styles.page}>

      {/* HEADER */}

      <div style={styles.header}>
        <div>
          <div style={styles.eyebrow}>
            PROCUREMENT ACTIVITY
          </div>

          <h1 style={styles.title}>
            My Requests
          </h1>

          <p style={styles.subtitle}>
            Track your procurement requests,
            appointments and completion status.
          </p>
        </div>

        <div style={styles.totalCard}>
          <strong style={styles.totalNumber}>
            {requests.length}
          </strong>

          <span style={styles.totalLabel}>
            Total Requests
          </span>
        </div>
      </div>

      {/* EMPTY */}

      {requests.length === 0 ? (
        <div style={styles.stateCard}>
          <div style={styles.stateIcon}>
            📋
          </div>

          <h2 style={styles.stateTitle}>
            No Requests Yet
          </h2>

          <p style={styles.stateText}>
            Your procurement requests will
            appear here after submission.
          </p>
        </div>
      ) : (
        /* ==============================================
           EXACTLY 3 CARDS PER ROW
        ============================================== */

        <div style={styles.requestGrid}>

          {requests.map((requestItem) => {
            const appointment =
              getAppointment(requestItem?.id);

            const status =
              appointment?.status ||
              requestItem?.status ||
              "pending";

            const normalizedStatus =
              String(status).toLowerCase();

            const requestId =
              requestItem?.id ||
              requestItem?.request_id ||
              "-";

            const crop =
              requestItem?.crop ||
              "Crop";

            const quantity =
              requestItem?.quantity ??
              requestItem?.requested_quantity ??
              0;

            const centerName =
              requestItem?.center_name ||
              appointment?.center_name ||
              "Procurement Center";

            const centerDistrict =
              requestItem?.center_district ||
              requestItem?.district ||
              appointment?.center_district ||
              "-";

            const centerLocation =
              requestItem?.center_location ||
              appointment?.center_location ||
              "";

            const distance =
              requestItem?.distance_km ??
              requestItem?.distance ??
              "-";

            const vehicle =
              requestItem?.vehicle ||
              "-";

            const transportCost =
              requestItem?.transport_cost ??
              requestItem?.total_cost ??
              0;

            return (
              <article
                key={requestId}
                style={styles.requestCard}
              >
                {/* CARD HEADER */}

                <div style={styles.cardHeader}>
                  <div>
                    <div style={styles.requestLabel}>
                      REQUEST
                    </div>

                    <div style={styles.requestId}>
                      #{requestId}
                    </div>
                  </div>

                  <span
                    style={{
                      ...styles.statusBadge,
                      ...getStatusStyle(status)
                    }}
                  >
                    {String(status)
                      .replaceAll("_", " ")
                      .toUpperCase()}
                  </span>
                </div>

                {/* CROP */}

                <div style={styles.cropRow}>
                  <div style={styles.cropIcon}>
                    🌾
                  </div>

                  <div>
                    <div style={styles.cropName}>
                      {crop}
                    </div>

                    <div
                      style={
                        styles.quantityText
                      }
                    >
                      {quantity} Tons
                    </div>
                  </div>
                </div>

                {/* CENTER */}

                <div style={styles.cardBody}>

                  <Detail
                    label="Procurement Center"
                    value={centerName}
                  />

                  <Detail
                    label="District"
                    value={centerDistrict}
                  />

                  {centerLocation && (
                    <Detail
                      label="Location"
                      value={centerLocation}
                    />
                  )}

                  {/* DISTANCE + VEHICLE */}

                  <div
                    style={
                      styles.twoColumn
                    }
                  >
                    <Detail
                      label="Distance"
                      value={
                        distance === "-"
                          ? "-"
                          : `${distance} KM`
                      }
                    />

                    <Detail
                      label="Vehicle"
                      value={vehicle}
                    />
                  </div>

                  {/* TRANSPORT COST */}

                  <div style={styles.costBox}>
                    <div>
                      <div
                        style={
                          styles.costLabel
                        }
                      >
                        TRANSPORT COST
                      </div>

                      <div
                        style={
                          styles.costSubtext
                        }
                      >
                        Estimated logistics cost
                      </div>
                    </div>

                    <strong
                      style={
                        styles.costValue
                      }
                    >
                      {formatMoney(
                        transportCost
                      )}
                    </strong>
                  </div>
                </div>

                {/* APPOINTMENT */}

                {appointment && (
                  <div
                    style={
                      styles.appointmentCard
                    }
                  >
                    <div
                      style={
                        styles.appointmentHeading
                      }
                    >
                      APPOINTMENT
                    </div>

                    <div
                      style={
                        styles.appointmentGrid
                      }
                    >
                      <div>
                        <span
                          style={
                            styles.smallLabel
                          }
                        >
                          Date
                        </span>

                        <strong
                          style={
                            styles.appointmentValue
                          }
                        >
                          {formatDate(
                            appointment
                              ?.appointment_date
                          )}
                        </strong>
                      </div>

                      <div>
                        <span
                          style={
                            styles.smallLabel
                          }
                        >
                          Time
                        </span>

                        <strong
                          style={
                            styles.appointmentValue
                          }
                        >
                          {appointment
                            ?.appointment_time ||
                            "-"}
                        </strong>
                      </div>
                    </div>

                    {appointment
                      ?.reserved_quantity !=
                      null && (
                      <div
                        style={
                          styles.reservedRow
                        }
                      >
                        <span>
                          Reserved
                        </span>

                        <strong>
                          {
                            appointment
                              .reserved_quantity
                          }{" "}
                          Tons
                        </strong>
                      </div>
                    )}
                  </div>
                )}

                {/* PROCUREMENT COMPLETED BUTTON */}

                {appointment &&
                  normalizedStatus ===
                    "booked" && (
                    <button
                      type="button"
                      disabled={
                        completionSaving ===
                        appointment?.id
                      }
                      onClick={() => {
                        if (
                          typeof markProcurementCompleted ===
                          "function"
                        ) {
                          markProcurementCompleted(
                            appointment.id
                          );
                        }
                      }}
                      style={{
                        ...styles.completeButton,

                        opacity:
                          completionSaving ===
                          appointment?.id
                            ? 0.65
                            : 1,

                        cursor:
                          completionSaving ===
                          appointment?.id
                            ? "not-allowed"
                            : "pointer"
                      }}
                    >
                      {completionSaving ===
                      appointment?.id
                        ? "Saving..."
                        : "✓ Procurement Completed"}
                    </button>
                  )}

                {/* COMPLETION REQUESTED */}

                {normalizedStatus ===
                  "completion_requested" && (
                  <div
                    style={
                      styles.waitingBox
                    }
                  >
                    <strong
                      style={
                        styles.messageTitle
                      }
                    >
                      Completion Submitted
                    </strong>

                    <span>
                      Waiting for Government
                      verification.
                    </span>
                  </div>
                )}

                {/* COMPLETED */}

                {normalizedStatus ===
                  "completed" && (
                  <div
                    style={
                      styles.completedBox
                    }
                  >
                    <strong
                      style={
                        styles.messageTitle
                      }
                    >
                      ✓ Procurement Confirmed
                    </strong>

                    <span>
                      Government verification
                      completed.
                    </span>

                    {appointment
                      ?.actual_received_quantity !=
                      null && (
                      <div
                        style={
                          styles.actualRow
                        }
                      >
                        <span>
                          Actual Received
                        </span>

                        <strong>
                          {
                            appointment
                              .actual_received_quantity
                          }{" "}
                          Tons
                        </strong>
                      </div>
                    )}
                  </div>
                )}

                {/* FOOTER */}

                <div style={styles.footer}>
                  <span style={styles.footerLabel}>
                    Requested
                  </span>

                  <strong
                    style={
                      styles.footerDate
                    }
                  >
                    {formatDate(
                      requestItem?.created_at ||
                        requestItem?.requested_at
                    )}
                  </strong>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

// =====================================================
// DETAIL COMPONENT
// =====================================================

function Detail({
  label,
  value
}) {
  return (
    <div style={styles.detail}>
      <span style={styles.detailLabel}>
        {label}
      </span>

      <strong style={styles.detailValue}>
        {value || "-"}
      </strong>
    </div>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = {
  page: {
    width: "100%",
    boxSizing: "border-box",
    color: "#183e2c",
    fontFamily:
      "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
  },

  // HEADER

  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "20px",
    marginBottom: "25px"
  },

  eyebrow: {
    marginBottom: "5px",
    color: "#2f7e5a",
    fontSize: "14px",
    fontWeight: "900",
    letterSpacing: "1.3px"
  },

  title: {
    margin: 0,
    color: "#123e2b",
    fontSize: "36px",
    fontWeight: "850",
    letterSpacing: "-0.7px"
  },

  subtitle: {
    margin: "7px 0 0",
    color: "#718279",
    fontSize: "17px",
    lineHeight: "1.5"
  },

  totalCard: {
    minWidth: "125px",
    padding: "13px 18px",
    border: "1px solid #dce7e0",
    borderRadius: "14px",
    background: "#ffffff",
    textAlign: "center"
  },

  totalNumber: {
    display: "block",
    color: "#176b48",
    fontSize: "27px",
    fontWeight: "900"
  },

  totalLabel: {
    display: "block",
    marginTop: "2px",
    color: "#75867c",
    fontSize: "13px",
    fontWeight: "700"
  },

  // ===================================================
  // EXACTLY THREE CARDS PER ROW
  // ===================================================

  requestGrid: {
    width: "100%",
    display: "grid",

    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",

    gap: "18px",
    alignItems: "start",
    boxSizing: "border-box"
  },

  requestCard: {
    width: "100%",
    minWidth: 0,
    boxSizing: "border-box",
    overflow: "hidden",
    border: "1px solid #dce7e0",
    borderRadius: "16px",
    background: "#ffffff",
    boxShadow:
      "0 8px 24px rgba(19,72,47,0.07)"
  },

  // CARD HEADER

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "10px",
    padding: "16px 17px 13px",
    borderBottom: "1px solid #edf2ef"
  },

  requestLabel: {
    color: "#87968d",
    fontSize: "12px",
    fontWeight: "900",
    letterSpacing: "1px"
  },

  requestId: {
    marginTop: "2px",
    color: "#173f2d",
    fontSize: "20px",
    fontWeight: "900"
  },

  statusBadge: {
    maxWidth: "145px",
    padding: "6px 9px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: "900",
    textAlign: "center"
  },

  // CROP

  cropRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "15px 17px"
  },

  cropIcon: {
    width: "44px",
    height: "44px",
    flexShrink: 0,
    display: "grid",
    placeItems: "center",
    borderRadius: "11px",
    background: "#edf6e8",
    fontSize: "22px"
  },

  cropName: {
    color: "#183e2c",
    fontSize: "20px",
    fontWeight: "900"
  },

  quantityText: {
    marginTop: "2px",
    color: "#65786d",
    fontSize: "15px",
    fontWeight: "700"
  },

  // DETAILS

  cardBody: {
    padding: "0 17px 14px"
  },

  detail: {
    minWidth: 0,
    marginBottom: "12px"
  },

  detailLabel: {
    display: "block",
    marginBottom: "3px",
    color: "#87968d",
    fontSize: "12px",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: "0.4px"
  },

  detailValue: {
    display: "block",
    color: "#304f3d",
    fontSize: "15px",
    fontWeight: "800",
    overflowWrap: "anywhere"
  },

  twoColumn: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px"
  },

  // COST

  costBox: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    marginTop: "3px",
    padding: "12px",
    borderRadius: "10px",
    background: "#f3f8f5"
  },

  costLabel: {
    color: "#64766c",
    fontSize: "11px",
    fontWeight: "900",
    letterSpacing: "0.5px"
  },

  costSubtext: {
    marginTop: "2px",
    color: "#91a097",
    fontSize: "11px"
  },

  costValue: {
    color: "#176b48",
    fontSize: "19px",
    fontWeight: "900"
  },

  // APPOINTMENT

  appointmentCard: {
    margin: "0 17px 14px",
    padding: "12px",
    border: "1px solid #d7e7dd",
    borderRadius: "10px",
    background: "#f5faf7"
  },

  appointmentHeading: {
    marginBottom: "9px",
    color: "#37815f",
    fontSize: "11px",
    fontWeight: "900",
    letterSpacing: "1px"
  },

  appointmentGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px"
  },

  smallLabel: {
    display: "block",
    marginBottom: "2px",
    color: "#87968d",
    fontSize: "11px",
    fontWeight: "700"
  },

  appointmentValue: {
    display: "block",
    color: "#294c38",
    fontSize: "14px",
    fontWeight: "850"
  },

  reservedRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    marginTop: "10px",
    paddingTop: "9px",
    borderTop: "1px solid #dce9e1",
    color: "#52675b",
    fontSize: "12px"
  },

  // COMPLETE

  completeButton: {
    width: "calc(100% - 34px)",
    minHeight: "44px",
    margin: "0 17px 14px",
    border: "none",
    borderRadius: "10px",
    background:
      "linear-gradient(135deg, #176b48, #25875f)",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: "900"
  },

  waitingBox: {
    display: "grid",
    gap: "3px",
    margin: "0 17px 14px",
    padding: "11px 12px",
    borderRadius: "10px",
    background: "#eef4ff",
    color: "#315f99",
    fontSize: "13px"
  },

  completedBox: {
    display: "grid",
    gap: "3px",
    margin: "0 17px 14px",
    padding: "11px 12px",
    borderRadius: "10px",
    background: "#edf8f1",
    color: "#176d43",
    fontSize: "13px"
  },

  messageTitle: {
    fontSize: "14px",
    fontWeight: "900"
  },

  actualRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    marginTop: "8px",
    paddingTop: "8px",
    borderTop: "1px solid #d2eadb"
  },

  // FOOTER

  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    padding: "11px 17px",
    borderTop: "1px solid #edf2ef",
    background: "#fafcfb"
  },

  footerLabel: {
    color: "#87968d",
    fontSize: "12px",
    fontWeight: "700"
  },

  footerDate: {
    color: "#52675b",
    fontSize: "13px",
    fontWeight: "800"
  },

  // EMPTY / LOADING

  stateCard: {
    padding: "55px 25px",
    border: "1px solid #dce8e0",
    borderRadius: "16px",
    background: "#ffffff",
    textAlign: "center"
  },

  stateIcon: {
    marginBottom: "10px",
    fontSize: "36px"
  },

  stateTitle: {
    margin: "0 0 7px",
    color: "#173f2d",
    fontSize: "23px"
  },

  stateText: {
    margin: 0,
    color: "#78887f",
    fontSize: "16px"
  }
};

export default MyRequests;