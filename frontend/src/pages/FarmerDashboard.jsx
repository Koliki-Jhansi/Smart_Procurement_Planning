import React, {
  useEffect,
  useState
} from "react";

import CropPrediction from "./CropPrediction";
import ProcurementCenter from "./ProcurementCenter";
import TransportCost from "./TransportCost";
import ProcurementRequest from "./ProcurementRequest";
import MyRequests from "./MyRequests";


const API = "http://127.0.0.1:5000";


function FarmerDashboard({
  user,
  onLogout
}) {
  const [page, setPage] =
    useState("home");

  const [selectedCenter, setSelectedCenter] =
    useState(null);

  const [selectedCrop, setSelectedCrop] =
    useState(
      user?.primary_crop ||
      user?.crop ||
      user?.Crop ||
      ""
    );

  const [transportData, setTransportData] =
    useState(null);

  const [latestRequest, setLatestRequest] =
    useState(null);

  const [requests, setRequests] =
    useState([]);

  const [appointments, setAppointments] =
    useState([]);

  const [loadingRequests, setLoadingRequests] =
    useState(false);

  const [notifications, setNotifications] =
    useState([]);

  const [unreadNotifications, setUnreadNotifications] =
    useState(0);

  const [loadingNotifications, setLoadingNotifications] =
    useState(false);

  const [completionSaving, setCompletionSaving] =
    useState(null);

  const [acceptingAppointment, setAcceptingAppointment] =
    useState(null);


  const farmerName =
    user?.full_name ||
    user?.name ||
    user?.farmer_name ||
    user?.username ||
    "Farmer";

  const farmerId =
    user?.id ||
    user?.farmer_id ||
    user?.user_id ||
    1234;

  const mobile =
    user?.mobile_number ||
    user?.mobile ||
    user?.phone ||
    "";

  const village =
    user?.village || "";

  const mandal =
    user?.mandal || "";

  const district =
    user?.district ||
    user?.District ||
    "";

  const landArea =
    user?.land_area || "";

  const primaryCrop =
    selectedCrop ||
    user?.primary_crop ||
    user?.crop ||
    "";

  const latestNotifications =
    notifications.slice(0, 3);


  const navigate = (targetPage) => {
    setPage(targetPage);
  };


  const loadFarmerRequests =
    async () => {
      try {
        setLoadingRequests(true);

        const response = await fetch(
          `${API}/api/procurement-requests/farmer/${farmerId}`
        );

        const result =
          await response.json();

        if (
          !response.ok ||
          result.success === false
        ) {
          throw new Error(
            result.message ||
            result.error ||
            "Unable to load requests."
          );
        }

        setRequests(
          result.requests ||
          result.data ||
          []
        );

      } catch (error) {
        console.error(
          "LOAD REQUESTS ERROR:",
          error
        );

        setRequests([]);

      } finally {
        setLoadingRequests(false);
      }
    };


  const loadFarmerAppointments =
    async () => {
      try {
        const response = await fetch(
          `${API}/api/appointments/farmer/${farmerId}`
        );

        const result =
          await response.json();

        if (
          !response.ok ||
          result.success === false
        ) {
          throw new Error(
            result.message ||
            "Unable to load appointments."
          );
        }

        setAppointments(
          result.appointments || []
        );

      } catch (error) {
        console.error(
          "LOAD APPOINTMENTS ERROR:",
          error
        );
      }
    };


  const loadFarmerNotifications =
    async () => {
      try {
        setLoadingNotifications(true);

        const response = await fetch(
          `${API}/api/notifications/farmer/${farmerId}`
        );

        const result =
          await response.json();

        if (
          !response.ok ||
          result.success === false
        ) {
          throw new Error(
            result.message ||
            result.error ||
            "Unable to load notifications."
          );
        }

        setNotifications(
          result.notifications || []
        );

        setUnreadNotifications(
          result.unread_count || 0
        );

      } catch (error) {
        console.error(
          "LOAD NOTIFICATIONS ERROR:",
          error
        );

      } finally {
        setLoadingNotifications(false);
      }
    };


  const markAllNotificationsRead =
    async () => {
      try {
        const response = await fetch(
          `${API}/api/notifications/farmer/${farmerId}/read-all`,
          {
            method: "PUT"
          }
        );

        const result =
          await response.json();

        if (
          !response.ok ||
          result.success === false
        ) {
          throw new Error(
            result.message ||
            "Unable to update notifications."
          );
        }

        setNotifications(
          (previous) =>
            previous.map(
              (notification) => ({
                ...notification,
                is_read: true
              })
            )
        );

        setUnreadNotifications(0);

      } catch (error) {
        console.error(
          "MARK NOTIFICATIONS READ ERROR:",
          error
        );
      }
    };


  const acceptAppointment =
    async (appointmentId) => {
      try {
        setAcceptingAppointment(appointmentId);

        const response = await fetch(
          `${API}/api/appointments/${appointmentId}/accept`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json"
            }
          }
        );

        const result = await response.json();

        if (!response.ok || result.success === false) {
          throw new Error(
            result.message ||
            "Unable to accept appointment."
          );
        }

        alert(
          result.message ||
          "Appointment accepted successfully."
        );

        await Promise.all([
          loadFarmerAppointments(),
          loadFarmerRequests(),
          loadFarmerNotifications()
        ]);
      } catch (error) {
        alert(
          error.message ||
          "Unable to accept appointment."
        );
      } finally {
        setAcceptingAppointment(null);
      }
    };


  const markProcurementCompleted =
    async (appointmentId) => {
      try {
        setCompletionSaving(
          appointmentId
        );

        const response = await fetch(
          `${API}/api/appointments/${appointmentId}/farmer-completed`,
          {
            method: "PUT",
            headers: {
              "Content-Type":
                "application/json"
            }
          }
        );

        const result =
          await response.json();

        if (
          !response.ok ||
          result.success === false
        ) {
          throw new Error(
            result.message ||
            "Unable to send procurement completion."
          );
        }

        alert(
          result.message ||
          "Procurement completion sent to Government."
        );

        await Promise.all([
          loadFarmerRequests(),
          loadFarmerAppointments(),
          loadFarmerNotifications()
        ]);

      } catch (error) {
        alert(
          error.message ||
          "Unable to send procurement completion."
        );

      } finally {
        setCompletionSaving(null);
      }
    };


  useEffect(() => {
    loadFarmerNotifications();

    const intervalId = setInterval(
      () => {
        loadFarmerNotifications();

        if (page === "requests" || page === "appointments") {
          loadFarmerRequests();
          loadFarmerAppointments();
        }
      },
      10000
    );

    return () => {
      clearInterval(intervalId);
    };
  }, [farmerId, page]);


  useEffect(() => {
    if (
    page === "home" ||
    page === "requests" ||
    page === "appointments"
  ) {
      loadFarmerRequests();
      loadFarmerAppointments();
      loadFarmerNotifications();
    }
  }, [page, farmerId]);


  const formatRequestDateTime =
    (value) => {
      if (!value) {
        return "-";
      }

      try {
        let normalizedValue = value;

        if (
          typeof normalizedValue ===
            "string" &&
          normalizedValue.includes(" ") &&
          !normalizedValue.includes("T")
        ) {
          normalizedValue =
            normalizedValue.replace(
              " ",
              "T"
            );
        }

        const date =
          new Date(normalizedValue);

        if (
          Number.isNaN(
            date.getTime()
          )
        ) {
          return String(value);
        }

        return date.toLocaleString(
          "en-IN",
          {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true
          }
        );

      } catch {
        return String(value);
      }
    };


  const normalizeCenter =
    (data) => {
      if (!data) {
        return null;
      }

      const actualCenter =
        data.center &&
        typeof data.center === "object"
          ? data.center
          : data;

      return {
        ...actualCenter,

        id:
          actualCenter?.id ??
          actualCenter?.center_id ??
          actualCenter?.Center_ID ??
          actualCenter?.centerId ??
          "",

        center_id:
          actualCenter?.center_id ??
          actualCenter?.id ??
          actualCenter?.Center_ID ??
          actualCenter?.centerId ??
          "",

        name:
          actualCenter?.name ||
          actualCenter?.center_name ||
          actualCenter
            ?.Procurement_Center_Name ||
          "Unknown Procurement Center",

        center_name:
          actualCenter?.center_name ||
          actualCenter?.name ||
          actualCenter
            ?.Procurement_Center_Name ||
          "Unknown Procurement Center",

        district:
          actualCenter?.district ||
          actualCenter?.District ||
          data?.district ||
          district ||
          "",

        location:
          actualCenter?.location ||
          actualCenter?.Location ||
          actualCenter?.address ||
          actualCenter?.mandal ||
          "",

        distance_km:
          actualCenter?.distance_km ??
          actualCenter?.distance ??
          0
      };
    };


  const handleCenterSelected =
    (centerData) => {
      const normalizedCenter =
        normalizeCenter(centerData);

      if (!normalizedCenter) {
        alert(
          "Invalid procurement center selected."
        );
        return;
      }

      setSelectedCenter(
        normalizedCenter
      );

      // Keep the complete crop-prediction object. TransportCost needs
      // predicted_production in tons; never reduce it to only a crop name.
      const centerCrop =
        centerData?.selectedCrop ??
        selectedCrop ??
        centerData?.crop;

      if (centerCrop) {
        if (typeof centerCrop === "object" && centerCrop !== null) {
          setSelectedCrop({ ...centerCrop });
        } else if (typeof selectedCrop === "object" && selectedCrop !== null) {
          setSelectedCrop({
            ...selectedCrop,
            crop: String(centerCrop),
            crop_name: String(centerCrop),
          });
        } else {
          setSelectedCrop({
            crop: String(centerCrop),
            crop_name: String(centerCrop),
          });
        }
      }

      setTransportData(null);
      setPage("transport");
    };


  const openProcurementRequest =
    () => {
      if (!selectedCenter) {
        alert(
          "Please select a procurement center first."
        );

        setPage("centers");
        return;
      }

      setPage(
        "procurement-request"
      );
    };


  const handleTransportCalculated =
    (data) => {
      setTransportData(data);
    };


  const handleRequestSent =
    (requestData) => {
      const requestWithTime = {
        ...requestData,
        created_at:
          requestData?.created_at ||
          requestData?.requested_at ||
          new Date().toISOString()
      };

      setLatestRequest(
        requestWithTime
      );

      setPage("requests");

      setTimeout(() => {
        loadFarmerRequests();
        loadFarmerAppointments();
        loadFarmerNotifications();
      }, 500);
    };


  const statusText = (value) =>
    String(value || "pending").replaceAll("_", " ");

  const appointmentFor = (request) =>
    appointments.find(
      (item) =>
        String(item?.procurement_request_id) ===
        String(request?.id ?? request?.request_id)
    );

  const renderMiddle = () => {
    if (page === "crop") {
      return (
        <CropPrediction
          user={user}
          goBack={() => navigate("home")}
          onCropSelected={(crop) => {
            if (!crop) return;

            // Preserve predicted production + crop metadata for the
            // Procurement Center -> Transport Cost handoff.
            const predictionData =
              typeof crop === "string"
                ? { crop, crop_name: crop }
                : { ...crop };

            setSelectedCrop(predictionData);

            // Keep one authoritative prediction for the transport page.
            // This stores production tons, not cultivated area/hectares.
            if (typeof predictionData === "object") {
              sessionStorage.setItem(
                "latestCropPrediction",
                JSON.stringify(predictionData)
              );
            }
          }}
        />
      );
    }

    if (page === "centers") {
      return (
        <ProcurementCenter
          user={user}
          selectedCrop={selectedCrop}
          goBack={() => navigate("home")}
          onSelectCenter={handleCenterSelected}
        />
      );
    }

    if (page === "transport") {
      return (
        <TransportCost
          user={user}
          selectedCenter={selectedCenter}
          selectedCrop={selectedCrop}
          goBack={() => navigate("home")}
          onTransportCalculated={handleTransportCalculated}
          onOpenProcurementRequest={openProcurementRequest}
          onRequestSent={handleRequestSent}
        />
      );
    }

    if (page === "procurement-request") {
      return (
        <ProcurementRequest
          user={user}
          selectedCenter={selectedCenter}
          selectedCrop={selectedCrop}
          transportData={transportData}
          goBack={() => navigate("home")}
          onRequestSent={handleRequestSent}
        />
      );
    }

    if (page === "requests") {
      return (
        <MyRequests
          requests={requests}
          appointments={appointments}
          loadingRequests={loadingRequests}
          completionSaving={completionSaving}
          markProcurementCompleted={markProcurementCompleted}
        />
      );
    }

    if (page === "appointments") {
      return (
        <section>
          <PageHeading
            title="Appointments"
            text="Accept Government-scheduled appointments and complete procurement after selling your crop."
          />

          {appointments.length === 0 ? (
            <div style={ui.empty}>No appointments available.</div>
          ) : (
            <div style={ui.requestGrid}>
              {appointments.map((item, index) => {
                const status = String(item?.status || "").toLowerCase();
                const canAccept =
                  status === "booked" || status === "scheduled";
                const canComplete = status === "accepted";

                return (
                  <article key={item?.id ?? index} style={ui.requestCard}>
                    <div style={ui.cardTop}>
                      <span style={ui.requestNo}>
                        Appointment #{item?.id ?? index + 1}
                      </span>
                      <span style={ui.statusBadge}>
                        {statusText(item?.status)}
                      </span>
                    </div>

                    <h3 style={ui.requestCrop}>
                      {item?.crop || "Procurement Appointment"}
                    </h3>

                    <InfoRow
                      label="Date"
                      value={item?.appointment_date || "-"}
                    />
                    <InfoRow
                      label="Time"
                      value={item?.appointment_time || "-"}
                    />
                    <InfoRow
                      label="Center"
                      value={item?.center_name || "-"}
                    />
                    <InfoRow
                      label="District"
                      value={item?.center_district || "-"}
                    />
                    <InfoRow
                      label="Reserved Quantity"
                      value={`${item?.reserved_quantity ?? "-"} Tons`}
                    />

                    {canAccept && (
                      <button
                        style={ui.primaryButton}
                        disabled={acceptingAppointment === item.id}
                        onClick={() => acceptAppointment(item.id)}
                      >
                        {acceptingAppointment === item.id
                          ? "Accepting..."
                          : "✓ Accept Appointment"}
                      </button>
                    )}

                    {canComplete && (
                      <>
                        <div style={ui.notice}>
                          Appointment accepted. After you sell/deliver the crop
                          at the center, click Procurement Completed.
                        </div>
                        <button
                          style={ui.primaryButton}
                          disabled={completionSaving === item.id}
                          onClick={() => markProcurementCompleted(item.id)}
                        >
                          {completionSaving === item.id
                            ? "Sending..."
                            : "✓ Procurement Completed"}
                        </button>
                      </>
                    )}

                    {status === "completion_requested" && (
                      <div style={ui.notice}>
                        Completion sent. Waiting for Government to verify the
                        actual received quantity. Warehouse capacity has not
                        been updated yet.
                      </div>
                    )}

                    {status === "completed" && (
                      <div style={ui.successNotice}>
                        ✓ Government confirmed procurement. Actual received:{" "}
                        {item?.actual_received_quantity ??
                          item?.actual_accepted_quantity ??
                          item?.reserved_quantity ??
                          "-"}{" "}
                        Tons. Warehouse stock/capacity is updated.
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      );
    }

    const services = [
      {
        key: "crop",
        icon: "🌾",
        title: "Crop Production Prediction",
        text: "Estimate crop production using your farm details.",
        action: () => navigate("crop"),
      },
      {
        key: "centers",
        icon: "🏢",
        title: "Procurement Centers",
        text: "Find procurement centers and available capacity.",
        action: () => navigate("centers"),
      },
      {
        key: "transport",
        icon: "🚚",
        title: "Transport Cost",
        text: "Calculate estimated crop transportation cost.",
        action: () => navigate("transport"),
      },
      {
        key: "procurement-request",
        icon: "📄",
        title: "Procurement Request",
        text: "Submit crop quantity for Government approval.",
        action: openProcurementRequest,
      },
      {
        key: "requests",
        icon: "📋",
        title: "My Requests",
        text: "Track request status and procurement completion.",
        action: () => navigate("requests"),
      },
      {
        key: "appointments",
        icon: "📅",
        title: "Appointments",
        text: "View approved procurement dates and timings.",
        action: () => navigate("appointments"),
      },
    ];

    return (
      <section>
        <PageHeading
          title="Farmer Dashboard"
          text={`Welcome ${farmerName}. Choose a service to continue.`}
        />

        <div style={ui.serviceGrid}>
          {services.map((service) => (
            <button
              key={service.key}
              onClick={service.action}
              style={ui.serviceCard}
            >
              <div style={ui.smallImage}>{service.icon}</div>
              <div style={ui.serviceBody}>
                <h3 style={ui.serviceTitle}>{service.title}</h3>
                <p style={ui.serviceText}>{service.text}</p>
                <span style={ui.openLink}>Open service →</span>
              </div>
            </button>
          ))}
        </div>
      </section>
    );
  };

  const menu = [
    ["home", "Dashboard"],
    ["crop", "Crop Prediction"],
    ["centers", "Procurement Centers"],
    ["transport", "Transport Cost"],
    ["procurement-request", "Procurement Request"],
    ["requests", "My Requests"],
    ["appointments", "Appointments"],
  ];

  return (
    <div style={ui.shell}>
      <aside style={ui.sidebar}>
        <div style={ui.brand}>
          <div style={ui.brandMark}>🌾</div>
          <div>
            <div style={ui.brandName}>AgriProcure</div>
            <div style={ui.brandSub}>FARMER PORTAL</div>
          </div>
        </div>

        <nav style={ui.nav}>
          {menu.map(([key, label]) => (
            <button
              key={key}
              onClick={() =>
                key === "procurement-request"
                  ? openProcurementRequest()
                  : navigate(key)
              }
              style={{
                ...ui.navButton,
                ...(page === key ? ui.navButtonActive : {}),
              }}
            >
              {label}
              {key === "requests" && unreadNotifications > 0 && (
                <span style={ui.count}>{unreadNotifications}</span>
              )}
            </button>
          ))}
        </nav>

        <div style={ui.sidebarBottom}>
          <div style={ui.farmerName}>{farmerName}</div>
          <div style={ui.farmerMeta}>{district || "Farmer"}</div>
          <button onClick={onLogout} style={ui.logout}>
            Logout
          </button>
        </div>
      </aside>

      <main style={ui.content}>
        {renderMiddle()}
      </main>
    </div>
  );
}

function PageHeading({ title, text }) {
  return (
    <div style={ui.heading}>
      <div>
        <div style={ui.eyebrow}>SMART PROCUREMENT PLANNING</div>
        <h1 style={ui.headingTitle}>{title}</h1>
        <p style={ui.headingText}>{text}</p>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={ui.infoRow}>
      <span style={ui.infoLabel}>{label}</span>
      <strong style={ui.infoValue}>{value}</strong>
    </div>
  );
}

const ui = {
  shell: {
    minHeight: "100vh",
    width: "100%",
    display: "grid",
    gridTemplateColumns: "250px minmax(0, 1fr)",
    background: "#f6f8f3",
    color: "#183126",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  sidebar: {
    minHeight: "100vh",
    background: "#123c2d",
    padding: "28px 18px 22px",
    display: "flex",
    flexDirection: "column",
    position: "sticky",
    top: 0,
    alignSelf: "start",
    boxSizing: "border-box",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 11,
    padding: "0 10px 28px",
    borderBottom: "1px solid rgba(255,255,255,.12)",
  },
  brandMark: {
    width: 38,
    height: 38,
    borderRadius: 11,
    display: "grid",
    placeItems: "center",
    background: "#e8f4e8",
    fontSize: 20,
  },
  brandName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: 800,
  },
  brandSub: {
    color: "#a9c9b8",
    fontSize: 10,
    letterSpacing: "1.5px",
    marginTop: 2,
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: 7,
    paddingTop: 24,
  },
  navButton: {
    width: "100%",
    minHeight: 46,
    border: 0,
    borderRadius: 10,
    padding: "0 14px",
    background: "transparent",
    color: "#d9e8df",
    fontSize: 14,
    fontWeight: 650,
    textAlign: "left",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  navButtonActive: {
    background: "#ffffff",
    color: "#123c2d",
    boxShadow: "0 8px 24px rgba(0,0,0,.12)",
  },
  count: {
    minWidth: 22,
    height: 22,
    borderRadius: 999,
    background: "#dff2df",
    color: "#174c35",
    display: "grid",
    placeItems: "center",
    fontSize: 11,
    fontWeight: 800,
  },
  sidebarBottom: {
    marginTop: "auto",
    padding: "18px 10px 0",
    borderTop: "1px solid rgba(255,255,255,.12)",
  },
  farmerName: {
    color: "#fff",
    fontWeight: 750,
    fontSize: 14,
  },
  farmerMeta: {
    color: "#a9c9b8",
    fontSize: 12,
    marginTop: 4,
  },
  logout: {
    marginTop: 14,
    width: "100%",
    border: "1px solid rgba(255,255,255,.22)",
    borderRadius: 9,
    background: "transparent",
    color: "#fff",
    padding: "10px 12px",
    cursor: "pointer",
    fontWeight: 650,
  },
  content: {
    minWidth: 0,
    padding: "44px clamp(24px, 4vw, 64px)",
    boxSizing: "border-box",
    overflowX: "hidden",
  },
  heading: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 30,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "1.5px",
    color: "#4f7b64",
    marginBottom: 8,
  },
  headingTitle: {
    margin: 0,
    color: "#153d2d",
    fontSize: "clamp(28px, 3vw, 40px)",
    lineHeight: 1.1,
    letterSpacing: "-1px",
  },
  headingText: {
    margin: "9px 0 0",
    color: "#6c7d73",
    fontSize: 14,
  },
  serviceGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 20,
    width: "100%",
  },
  serviceCard: {
    minHeight: 205,
    border: "1px solid #e0e8e1",
    borderRadius: 18,
    background: "#fff",
    padding: 22,
    textAlign: "left",
    cursor: "pointer",
    boxShadow: "0 8px 28px rgba(32,65,47,.06)",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
  },
  smallImage: {
    width: 62,
    height: 62,
    borderRadius: 15,
    background: "#edf6ed",
    display: "grid",
    placeItems: "center",
    fontSize: 29,
    marginBottom: 18,
  },
  serviceBody: {
    width: "100%",
  },
  serviceTitle: {
    margin: 0,
    color: "#173e2e",
    fontSize: 17,
    lineHeight: 1.3,
  },
  serviceText: {
    color: "#718078",
    fontSize: 13,
    lineHeight: 1.6,
    margin: "8px 0 15px",
  },
  openLink: {
    color: "#257149",
    fontSize: 13,
    fontWeight: 800,
  },
  requestGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 18,
    width: "100%",
  },
  requestCard: {
    background: "#fff",
    border: "1px solid #e1e8e2",
    borderRadius: 16,
    padding: 20,
    boxShadow: "0 8px 26px rgba(32,65,47,.05)",
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "center",
  },
  requestNo: {
    color: "#748178",
    fontSize: 12,
    fontWeight: 700,
  },
  statusBadge: {
    background: "#edf6ed",
    color: "#286847",
    borderRadius: 999,
    padding: "6px 9px",
    fontSize: 10,
    fontWeight: 800,
    textTransform: "capitalize",
  },
  requestCrop: {
    margin: "16px 0 12px",
    fontSize: 20,
    color: "#173e2e",
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 14,
    padding: "9px 0",
    borderBottom: "1px solid #edf1ed",
    fontSize: 12,
  },
  infoLabel: { color: "#7a877f" },
  infoValue: {
    color: "#294739",
    textAlign: "right",
    overflowWrap: "anywhere",
  },
  appointmentBox: {
    marginTop: 14,
    borderRadius: 11,
    background: "#f4f8f3",
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: 5,
    color: "#496156",
    fontSize: 12,
  },
  primaryButton: {
    marginTop: 14,
    width: "100%",
    border: 0,
    borderRadius: 10,
    background: "#1e6846",
    color: "#fff",
    padding: "11px 12px",
    cursor: "pointer",
    fontWeight: 750,
  },
  notice: {
    marginTop: 14,
    borderRadius: 10,
    background: "#fff8e7",
    padding: 11,
    color: "#7b641f",
    fontSize: 12,
  },
  successNotice: {
    marginTop: 14,
    borderRadius: 10,
    background: "#edf8ef",
    padding: 11,
    color: "#286847",
    fontSize: 12,
    fontWeight: 700,
  },
  empty: {
    padding: 36,
    background: "#fff",
    border: "1px solid #e1e8e2",
    borderRadius: 16,
    color: "#718078",
    textAlign: "center",
  },
};

export default FarmerDashboard;
