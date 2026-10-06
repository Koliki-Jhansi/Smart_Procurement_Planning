import React, {
  useEffect,
  useState,
} from "react";

import CropPrediction from "./CropPrediction";
import ProcurementCenter from "./ProcurementCenter";
import TransportCost from "./TransportCost";
import ProcurementRequest from "./ProcurementRequest";
import MyRequests from "./MyRequests";
import { API_BASE_URL as API } from "../apiConfig";

function FarmerDashboard({
  user,
  onLogout,
}) {
  const [page, setPage] =
    useState("home");

  const [
    selectedCenter,
    setSelectedCenter,
  ] = useState(null);

  const [
    selectedCrop,
    setSelectedCrop,
  ] = useState(
    user?.primary_crop ||
    user?.crop ||
    user?.Crop ||
    ""
  );

  const [
    transportData,
    setTransportData,
  ] = useState(null);

  const [
    latestRequest,
    setLatestRequest,
  ] = useState(null);

  const [requests, setRequests] =
    useState([]);

  const [
    appointments,
    setAppointments,
  ] = useState([]);

  const [
    loadingRequests,
    setLoadingRequests,
  ] = useState(false);

  const [
    notifications,
    setNotifications,
  ] = useState([]);

  const [
    unreadNotifications,
    setUnreadNotifications,
  ] = useState(0);

  const [
    loadingNotifications,
    setLoadingNotifications,
  ] = useState(false);

  const [
    completionSaving,
    setCompletionSaving,
  ] = useState(null);

  const [
    acceptingAppointment,
    setAcceptingAppointment,
  ] = useState(null);

  // Normal message instead of browser popup
  const [
    appointmentMessage,
    setAppointmentMessage,
  ] = useState({
    type: "",
    text: "",
  });

  // =====================================================
  // FARMER DETAILS
  // =====================================================

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

  // =====================================================
  // NAVIGATION
  // =====================================================

  const navigate = (
    targetPage
  ) => {
    setPage(targetPage);
    loadFarmerRequests();
    loadFarmerAppointments();
    loadFarmerNotifications();

    if (
      targetPage !==
      "appointments"
    ) {
      setAppointmentMessage({
        type: "",
        text: "",
      });
    }
  };

  // =====================================================
  // LOAD REQUESTS
  // =====================================================

  const loadFarmerRequests =
    async () => {
      try {
        setLoadingRequests(true);

        const response =
          await fetch(
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

        const rawRequests =
          result.requests ||
          result.data ||
          [];

        const ownRequests = farmerId
          ? rawRequests.filter(
            (r) =>
              !r?.farmer_id ||
              Number(r.farmer_id) === Number(farmerId) ||
              String(r.farmer_id) === String(farmerId)
          )
          : rawRequests;

        setRequests(ownRequests);
      } catch (error) {
        console.error(
          "LOAD REQUESTS ERROR:",
          error
        );

        setRequests([]);
      } finally {
        setLoadingRequests(
          false
        );
      }
    };

  // =====================================================
  // LOAD APPOINTMENTS
  // =====================================================

  const loadFarmerAppointments =
    async () => {
      try {
        const response =
          await fetch(
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

        const rawApps =
          result.appointments ||
          [];

        const ownAppointments = farmerId
          ? rawApps.filter(
            (a) =>
              !a?.farmer_id ||
              Number(a.farmer_id) === Number(farmerId) ||
              String(a.farmer_id) === String(farmerId)
          )
          : rawApps;

        setAppointments(ownAppointments);
      } catch (error) {
        console.error(
          "LOAD APPOINTMENTS ERROR:",
          error
        );
      }
    };

  // =====================================================
  // LOAD NOTIFICATIONS
  // =====================================================

  const loadFarmerNotifications =
    async () => {
      try {
        setLoadingNotifications(
          true
        );

        const response =
          await fetch(
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
          result.notifications ||
          []
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
        setLoadingNotifications(
          false
        );
      }
    };

  // =====================================================
  // MARK NOTIFICATIONS READ
  // =====================================================

  const markAllNotificationsRead =
    async () => {
      try {
        const response =
          await fetch(
            `${API}/api/notifications/farmer/${farmerId}/read-all`,
            {
              method: "PUT",
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
              (
                notification
              ) => ({
                ...notification,
                is_read: true,
              })
            )
        );

        setUnreadNotifications(
          0
        );
      } catch (error) {
        console.error(
          "MARK NOTIFICATIONS READ ERROR:",
          error
        );
      }
    };

  // =====================================================
  // ACCEPT APPOINTMENT
  // No alert popup
  // =====================================================

  const acceptAppointment =
    async (
      appointmentId
    ) => {
      try {
        setAcceptingAppointment(
          appointmentId
        );

        setAppointmentMessage({
          type: "",
          text: "",
        });

        const response =
          await fetch(
            `${API}/api/appointments/${appointmentId}/accept`,
            {
              method: "PUT",

              headers: {
                "Content-Type":
                  "application/json",
              },
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
            "Unable to accept appointment."
          );
        }

        setAppointmentMessage({
          type: "success",

          text:
            result.message ||
            "Appointment accepted successfully.",
        });

        await Promise.all([
          loadFarmerAppointments(),
          loadFarmerRequests(),
          loadFarmerNotifications(),
        ]);
      } catch (error) {
        setAppointmentMessage({
          type: "error",

          text:
            error.message ||
            "Unable to accept appointment.",
        });
      } finally {
        setAcceptingAppointment(
          null
        );
      }
    };

  // =====================================================
  // PROCUREMENT COMPLETION
  // No alert popup
  // =====================================================

  const markProcurementCompleted =
    async (
      appointmentId
    ) => {
      try {
        setCompletionSaving(
          appointmentId
        );

        setAppointmentMessage({
          type: "",
          text: "",
        });

        const response =
          await fetch(
            `${API}/api/appointments/${appointmentId}/farmer-completed`,
            {
              method: "PUT",

              headers: {
                "Content-Type":
                  "application/json",
              },
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

        setAppointmentMessage({
          type: "success",

          text:
            result.message ||
            "Procurement completion sent to Government.",
        });

        await Promise.all([
          loadFarmerRequests(),
          loadFarmerAppointments(),
          loadFarmerNotifications(),
        ]);
      } catch (error) {
        setAppointmentMessage({
          type: "error",

          text:
            error.message ||
            "Unable to send procurement completion.",
        });
      } finally {
        setCompletionSaving(
          null
        );
      }
    };

  // =====================================================
  // POLLING & REAL-TIME REFRESH
  // =====================================================

  useEffect(() => {
    loadFarmerRequests();
    loadFarmerAppointments();
    loadFarmerNotifications();

    const intervalId =
      setInterval(() => {
        loadFarmerRequests();
        loadFarmerAppointments();
        loadFarmerNotifications();
      }, 6000);

    const handleFocus = () => {
      loadFarmerRequests();
      loadFarmerAppointments();
      loadFarmerNotifications();
    };

    window.addEventListener(
      "focus",
      handleFocus
    );

    return () => {
      clearInterval(
        intervalId
      );
      window.removeEventListener(
        "focus",
        handleFocus
      );
    };
  }, [farmerId, page]);

  // =====================================================
  // FORMATTERS
  // =====================================================

  const formatRequestDateTime =
    (value) => {
      if (!value) {
        return "-";
      }

      try {
        let normalizedValue =
          value;

        if (
          typeof normalizedValue ===
          "string" &&
          normalizedValue.includes(
            " "
          ) &&
          !normalizedValue.includes(
            "T"
          )
        ) {
          normalizedValue =
            normalizedValue.replace(
              " ",
              "T"
            );
        }

        const date =
          new Date(
            normalizedValue
          );

        if (
          Number.isNaN(
            date.getTime()
          )
        ) {
          return String(
            value
          );
        }

        return date.toLocaleString(
          "en-IN",
          {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute:
              "2-digit",
            second:
              "2-digit",
            hour12: true,
          }
        );
      } catch {
        return String(value);
      }
    };

  const statusText = (
    value
  ) =>
    String(
      value || "pending"
    ).replaceAll("_", " ");

  // =====================================================
  // NORMALIZE CENTER
  // =====================================================

  const normalizeCenter = (
    data
  ) => {
    if (!data) {
      return null;
    }

    const actualCenter =
      data.center &&
        typeof data.center ===
        "object"
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
        actualCenter?.Distance_KM ??
        data?.distance_km ??
        data?.distance ??
        data?.Distance_KM ??
        0,

      distance:
        actualCenter?.distance_km ??
        actualCenter?.distance ??
        actualCenter?.Distance_KM ??
        data?.distance_km ??
        data?.distance ??
        data?.Distance_KM ??
        0,
    };
  };

  // =====================================================
  // CENTER SELECTED
  // =====================================================

  const handleCenterSelected =
    (centerData) => {
      const normalizedCenter =
        normalizeCenter(
          centerData
        );

      if (
        !normalizedCenter
      ) {
        alert(
          "Invalid procurement center selected."
        );

        return;
      }

      setSelectedCenter(
        normalizedCenter
      );

      const centerCrop =
        centerData?.selectedCrop ??
        selectedCrop ??
        centerData?.crop;

      if (centerCrop) {
        if (
          typeof centerCrop ===
          "object" &&
          centerCrop !== null
        ) {
          setSelectedCrop({
            ...centerCrop,
          });
        } else if (
          typeof selectedCrop ===
          "object" &&
          selectedCrop !== null
        ) {
          setSelectedCrop({
            ...selectedCrop,

            crop: String(
              centerCrop
            ),

            crop_name:
              String(
                centerCrop
              ),
          });
        } else {
          setSelectedCrop({
            crop: String(
              centerCrop
            ),

            crop_name:
              String(
                centerCrop
              ),
          });
        }
      }

      setTransportData(
        null
      );

      setPage("transport");
    };

  // =====================================================
  // OPEN PROCUREMENT REQUEST
  // =====================================================

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

  // =====================================================
  // REQUEST SENT
  // =====================================================

  const handleRequestSent =
    (dataOrStatus, maybeData) => {
      const requestData =
        typeof dataOrStatus === "object" && dataOrStatus !== null
          ? dataOrStatus
          : typeof maybeData === "object" && maybeData !== null
            ? maybeData
            : {};

      const requestWithTime = {
        ...requestData,
        created_at:
          requestData?.created_at ||
          requestData?.requested_at ||
          new Date().toISOString(),
      };

      setLatestRequest(
        requestWithTime
      );

      setPage("requests");

      loadFarmerRequests();
      loadFarmerAppointments();
      loadFarmerNotifications();

      setTimeout(() => {
        loadFarmerRequests();
        loadFarmerAppointments();
        loadFarmerNotifications();
      }, 400);
    };

  // =====================================================
  // NOTIFICATION HELPERS
  // =====================================================

  const getNotificationType =
    (notification) => {
      const raw = String(
        notification?.type ||
        notification
          ?.notification_type ||
        notification?.status ||
        notification?.title ||
        notification?.message ||
        ""
      ).toLowerCase();

      if (
        raw.includes(
          "suggest"
        ) ||
        raw.includes(
          "alternative center"
        )
      ) {
        return "suggested";
      }

      if (
        raw.includes(
          "reject"
        ) ||
        raw.includes(
          "cancel"
        )
      ) {
        return "rejected";
      }

      if (
        raw.includes(
          "approve"
        ) ||
        raw.includes(
          "accept"
        ) ||
        raw.includes(
          "booked"
        )
      ) {
        return "approved";
      }

      if (
        raw.includes(
          "appointment"
        ) ||
        raw.includes(
          "scheduled"
        )
      ) {
        return "appointment";
      }

      if (
        raw.includes(
          "complete"
        ) ||
        raw.includes(
          "procured"
        )
      ) {
        return "completed";
      }

      return "general";
    };

  const notificationMeta =
    (notification) => {
      const type =
        getNotificationType(
          notification
        );

      if (
        type === "approved"
      ) {
        return {
          icon: "✓",
          label: "Approved",
          tone: "#1d7a4c",
          bg: "#edf8f1",
        };
      }

      if (
        type === "rejected"
      ) {
        return {
          icon: "✕",
          label: "Rejected",
          tone: "#b4473d",
          bg: "#fff1ef",
        };
      }

      if (
        type === "suggested"
      ) {
        return {
          icon: "🏢",
          label:
            "Suggested Center",
          tone: "#315f99",
          bg: "#eef4ff",
        };
      }

      if (
        type ===
        "appointment"
      ) {
        return {
          icon: "📅",
          label: "Appointment",
          tone: "#8a6518",
          bg: "#fff8e8",
        };
      }

      if (
        type === "completed"
      ) {
        return {
          icon: "✓",
          label: "Completed",
          tone: "#176b48",
          bg: "#eaf7ef",
        };
      }

      return {
        icon: "🔔",
        label: "Update",
        tone: "#536a5d",
        bg: "#f3f6f4",
      };
    };

  const getNotificationTitle =
    (notification) =>
      notification?.title ||
      notification
        ?.notification_title ||
      notification?.subject ||
      `${notificationMeta(
        notification
      ).label
      } Update`;

  const getNotificationMessage =
    (notification) =>
      notification?.message ||
      notification?.text ||
      notification?.description ||
      notification?.body ||
      "Your procurement activity has been updated.";

  // =====================================================
  // COUNTS FOR DASHBOARD
  // =====================================================

  const normalizeStatus = (status) =>
    String(status || "").trim().toLowerCase();

  const isSuggested = (requestItem) =>
    Boolean(
      requestItem?.suggested_center_id ||
      requestItem?.suggested_center_name ||
      requestItem?.alternative_center_id ||
      requestItem?.alternative_center_name ||
      [
        "suggested",
        "suggested_center",
        "center_suggested",
      ].includes(normalizeStatus(requestItem?.status))
    );

  const getEffectiveStatus = (requestItem) => {
    const reqStatus = normalizeStatus(requestItem?.status);
    const appointment = appointments.find(
      (item) =>
        Number(item?.procurement_request_id) === Number(requestItem?.id) ||
        String(item?.procurement_request_id) === String(requestItem?.id)
    );
    const appStatus = normalizeStatus(appointment?.status);
    if (reqStatus === "completed" || appStatus === "completed") return "completed";
    if (
      ["rejected", "cancelled", "cancel"].includes(reqStatus) ||
      ["rejected", "cancelled", "cancel"].includes(appStatus)
    ) return "rejected";
    if (
      ["approved", "accepted", "booked", "scheduled"].includes(reqStatus) ||
      ["approved", "accepted", "booked", "scheduled"].includes(appStatus)
    ) return "accepted";
    if (
      ["suggested", "suggested_center", "center_suggested"].includes(reqStatus) ||
      isSuggested(requestItem)
    ) return "suggested";
    return reqStatus || "pending";
  };

  const pendingCount =
    requests.filter(
      (item) =>
        getEffectiveStatus(item) === "pending"
    ).length;

  const acceptedCount =
    requests.filter(
      (item) =>
        ["accepted", "approved", "booked", "scheduled"].includes(
          getEffectiveStatus(item)
        )
    ).length;

  const rejectedCount =
    requests.filter(
      (item) =>
        getEffectiveStatus(item) === "rejected"
    ).length;

  const completedCount =
    requests.filter(
      (item) =>
        getEffectiveStatus(item) === "completed"
    ).length;

  const suggestedCount =
    requests.filter(
      (item) =>
        getEffectiveStatus(item) === "suggested"
    ).length;

  const approvedCount = acceptedCount;

  const appointmentCount =
    appointments.filter(
      (item) =>
        ![
          "completed",
          "cancelled",
          "rejected",
        ].includes(
          normalizeStatus(item?.status)
        )
    ).length;

  // =====================================================
  // PAGE RENDERER
  // =====================================================

  const renderMiddle = () => {
    // ===================================================
    // CROP PREDICTION
    // ===================================================

    if (page === "crop") {
      return (
        <CropPrediction
          user={user}
          goBack={() =>
            navigate("home")
          }
          onCropSelected={(
            crop
          ) => {
            if (!crop) {
              return;
            }

            const predictionData =
              typeof crop ===
                "string"
                ? {
                  crop,
                  crop_name:
                    crop,
                }
                : {
                  ...crop,
                };

            setSelectedCrop(
              predictionData
            );

            if (
              typeof predictionData ===
              "object"
            ) {
              sessionStorage.setItem(
                "latestCropPrediction",
                JSON.stringify(
                  predictionData
                )
              );
            }
          }}
        />
      );
    }

    // ===================================================
    // PROCUREMENT CENTERS
    // ===================================================

    if (
      page === "centers"
    ) {
      return (
        <ProcurementCenter
          user={user}
          selectedCrop={
            selectedCrop
          }
          goBack={() =>
            navigate("home")
          }
          onSelectCenter={
            handleCenterSelected
          }
        />
      );
    }

    // ===================================================
    // TRANSPORT
    // ===================================================

    if (
      page === "transport"
    ) {
      return (
        <TransportCost
          user={user}
          selectedCenter={
            selectedCenter
          }
          selectedCrop={
            selectedCrop
          }
          goBack={() =>
            navigate("home")
          }
          onTransportCalculated={
            handleTransportCalculated
          }
          onOpenProcurementRequest={
            openProcurementRequest
          }
          onRequestSent={
            handleRequestSent
          }
        />
      );
    }

    // ===================================================
    // PROCUREMENT REQUEST
    // ===================================================

    if (
      page ===
      "procurement-request"
    ) {
      return (
        <ProcurementRequest
          user={user}
          selectedCenter={
            selectedCenter
          }
          selectedCrop={
            selectedCrop
          }
          transportData={
            transportData
          }
          goBack={() =>
            navigate("home")
          }
          onRequestSent={
            handleRequestSent
          }
        />
      );
    }

    // ===================================================
    // MY REQUESTS
    // ===================================================

    if (
      page === "requests"
    ) {
      return (
        <MyRequests
          requests={
            requests
          }
          appointments={
            appointments
          }
          loadingRequests={
            loadingRequests
          }
          completionSaving={
            completionSaving
          }
          markProcurementCompleted={
            markProcurementCompleted
          }
        />
      );
    }

    // ===================================================
    // APPOINTMENTS
    // ===================================================

    if (
      page ===
      "appointments"
    ) {
      return (
        <section>
          <PageHeading
            title="Appointments"
            text="View and manage your Government procurement appointments."
          />

          {appointmentMessage
            .text && (
              <div
                style={{
                  ...ui.pageMessage,

                  ...(appointmentMessage
                    .type ===
                    "error"
                    ? ui.pageMessageError
                    : ui.pageMessageSuccess),
                }}
              >
                <span
                  style={
                    ui.pageMessageIcon
                  }
                >
                  {appointmentMessage
                    .type ===
                    "error"
                    ? "!"
                    : "✓"}
                </span>

                <span>
                  {
                    appointmentMessage.text
                  }
                </span>
              </div>
            )}

          {appointments.length ===
            0 ? (
            <div
              style={ui.empty}
            >
              <div
                style={
                  ui.emptyIcon
                }
              >
                📅
              </div>

              <strong>
                No appointments
                available
              </strong>

              <span>
                Approved procurement
                appointments will
                appear here.
              </span>
            </div>
          ) : (
            <div
              style={
                ui.requestGrid
              }
              className="dashboard-grid"
            >
              {appointments.map(
                (
                  item,
                  index
                ) => {
                  const status =
                    String(
                      item?.status ||
                      ""
                    ).toLowerCase();

                  const canAccept =
                    status ===
                    "booked" ||
                    status ===
                    "scheduled";

                  const canComplete =
                    status ===
                    "accepted";

                  return (
                    <article
                      key={
                        item?.id ??
                        index
                      }
                      style={
                        ui.requestCard
                      }
                    >
                      <div
                        style={
                          ui.cardTop
                        }
                      >
                        <span
                          style={
                            ui.requestNo
                          }
                        >
                          Appointment #
                          {item?.id ??
                            index +
                            1}
                        </span>

                        <StatusBadge
                          status={
                            item?.status
                          }
                        />
                      </div>

                      <div
                        style={
                          ui.appointmentIconRow
                        }
                      >
                        <div
                          style={
                            ui.appointmentIcon
                          }
                        >
                          📅
                        </div>

                        <div>
                          <h3
                            style={
                              ui.requestCrop
                            }
                          >
                            {item?.crop ||
                              "Procurement Appointment"}
                          </h3>

                          <span
                            style={
                              ui.appointmentSub
                            }
                          >
                            Government
                            procurement
                            schedule
                          </span>
                        </div>
                      </div>

                      <InfoRow
                        label="Date"
                        value={
                          item?.appointment_date ||
                          "-"
                        }
                      />

                      <InfoRow
                        label="Time"
                        value={
                          item?.appointment_time ||
                          "-"
                        }
                      />

                      <InfoRow
                        label="Center"
                        value={
                          item?.center_name ||
                          "-"
                        }
                      />

                      <InfoRow
                        label="District"
                        value={
                          item?.center_district ||
                          "-"
                        }
                      />

                      <InfoRow
                        label="Reserved Quantity"
                        value={`${item?.reserved_quantity ?? "-"} Tons`}
                      />

                      {canAccept && (
                        <button
                          style={
                            ui.primaryButton
                          }
                          disabled={
                            acceptingAppointment ===
                            item.id
                          }
                          onClick={() =>
                            acceptAppointment(
                              item.id
                            )
                          }
                        >
                          {acceptingAppointment ===
                            item.id
                            ? "Accepting..."
                            : "Accept Appointment"}
                        </button>
                      )}

                      {canComplete && (
                        <>
                          <div
                            style={
                              ui.notice
                            }
                          >
                            Appointment
                            accepted. After
                            crop delivery,
                            confirm the
                            procurement.
                          </div>

                          <button
                            style={
                              ui.primaryButton
                            }
                            disabled={
                              completionSaving ===
                              item.id
                            }
                            onClick={() =>
                              markProcurementCompleted(
                                item.id
                              )
                            }
                          >
                            {completionSaving ===
                              item.id
                              ? "Sending..."
                              : "Procurement Completed"}
                          </button>
                        </>
                      )}

                      {status ===
                        "completion_requested" && (
                          <div
                            style={
                              ui.notice
                            }
                          >
                            Completion sent
                            to Government.
                            Waiting for
                            verification.
                          </div>
                        )}

                      {status ===
                        "completed" && (
                          <div
                            style={
                              ui.successNotice
                            }
                          >
                            ✓ Government
                            confirmed
                            procurement.
                            Actual received:{" "}
                            {item?.actual_received_quantity ??
                              item?.actual_accepted_quantity ??
                              item?.reserved_quantity ??
                              "-"}{" "}
                            Tons.
                          </div>
                        )}
                    </article>
                  );
                }
              )}
            </div>
          )}
        </section>
      );
    }

    // ===================================================
    // NOTIFICATIONS
    // Approved / Rejected / Suggested Center /
    // Appointment / Completion
    // ===================================================

    if (
      page ===
      "notifications"
    ) {
      return (
        <section>
          <div
            style={
              ui.notificationHeading
            }
          >
            <PageHeading
              title="Notifications"
              text="Procurement approvals, rejections, suggested centers and appointment updates."
            />

            {unreadNotifications >
              0 && (
                <button
                  type="button"
                  onClick={
                    markAllNotificationsRead
                  }
                  style={
                    ui.readAllButton
                  }
                >
                  Mark all as read
                </button>
              )}
          </div>

          <div
            style={
              ui.notificationCategories
            }
          >
            <NotificationSummary
              icon="✓"
              title="Approved"
              count={
                notifications.filter(
                  (item) =>
                    getNotificationType(
                      item
                    ) ===
                    "approved"
                ).length
              }
            />

            <NotificationSummary
              icon="✕"
              title="Rejected"
              count={
                notifications.filter(
                  (item) =>
                    getNotificationType(
                      item
                    ) ===
                    "rejected"
                ).length
              }
            />

            <NotificationSummary
              icon="🏢"
              title="Suggested Centers"
              count={
                notifications.filter(
                  (item) =>
                    getNotificationType(
                      item
                    ) ===
                    "suggested"
                ).length
              }
            />

            <NotificationSummary
              icon="📅"
              title="Appointments"
              count={
                notifications.filter(
                  (item) =>
                    getNotificationType(
                      item
                    ) ===
                    "appointment"
                ).length
              }
            />
          </div>

          {loadingNotifications ? (
            <div
              style={ui.empty}
            >
              Loading
              notifications...
            </div>
          ) : notifications.length ===
            0 ? (
            <div
              style={ui.empty}
            >
              <div
                style={
                  ui.emptyIcon
                }
              >
                🔔
              </div>

              <strong>
                No notifications
              </strong>

              <span>
                Procurement updates
                will appear here.
              </span>
            </div>
          ) : (
            <div
              style={
                ui.notificationList
              }
            >
              {notifications.map(
                (
                  notification,
                  index
                ) => {
                  const meta =
                    notificationMeta(
                      notification
                    );

                  return (
                    <article
                      key={
                        notification?.id ??
                        index
                      }
                      style={{
                        ...ui.notificationCard,

                        ...(!notification?.is_read
                          ? ui.notificationUnread
                          : {}),
                      }}
                    >
                      <div
                        style={{
                          ...ui.notificationIcon,

                          background:
                            meta.bg,

                          color:
                            meta.tone,
                        }}
                      >
                        {
                          meta.icon
                        }
                      </div>

                      <div
                        style={
                          ui.notificationContent
                        }
                      >
                        <div
                          style={
                            ui.notificationTop
                          }
                        >
                          <div>
                            <span
                              style={{
                                ...ui.notificationType,

                                color:
                                  meta.tone,

                                background:
                                  meta.bg,
                              }}
                            >
                              {
                                meta.label
                              }
                            </span>

                            <h3
                              style={
                                ui.notificationTitle
                              }
                            >
                              {getNotificationTitle(
                                notification
                              )}
                            </h3>
                          </div>

                          {!notification?.is_read && (
                            <span
                              style={
                                ui.unreadDot
                              }
                            />
                          )}
                        </div>

                        <p
                          style={
                            ui.notificationMessage
                          }
                        >
                          {getNotificationMessage(
                            notification
                          )}
                        </p>

                        {(notification?.center_name ||
                          notification?.suggested_center_name) && (
                            <div
                              style={
                                ui.notificationCenter
                              }
                            >
                              🏢{" "}
                              {notification?.suggested_center_name ||
                                notification?.center_name}
                            </div>
                          )}

                        <div
                          style={
                            ui.notificationDate
                          }
                        >
                          {formatRequestDateTime(
                            notification?.created_at ||
                            notification?.updated_at ||
                            notification?.date
                          )}
                        </div>
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          )}
        </section>
      );
    }

    // ===================================================
    // PROFILE - SEPARATE PAGE
    // ===================================================

    if (
      page === "profile"
    ) {
      return (
        <section>
          <PageHeading
            title="Farmer Profile"
            text="Your registered farmer and farm information."
          />

          <div
            style={
              ui.profileLayout
            }
          >
            <div
              style={
                ui.profileCard
              }
            >
              <div
                style={
                  ui.profileAvatar
                }
              >
                👨‍🌾
              </div>

              <h2
                style={
                  ui.profileName
                }
              >
                {farmerName}
              </h2>

              <p
                style={
                  ui.profileRole
                }
              >
                Registered Farmer
              </p>

              <div
                style={
                  ui.profileLocation
                }
              >
                📍{" "}
                {district ||
                  "Location not available"}
              </div>
            </div>

            <div
              style={
                ui.profileDetails
              }
            >
              <div
                style={
                  ui.profileSectionHeader
                }
              >
                <div>
                  <span
                    style={
                      ui.profileEyebrow
                    }
                  >
                    FARMER OVERVIEW
                  </span>

                  <h2
                    style={
                      ui.profileSectionTitle
                    }
                  >
                    Personal & Farm
                    Details
                  </h2>
                </div>
              </div>

              <div
                style={
                  ui.profileGrid
                }
                className="profile-grid"
              >
                <ProfileField
                  icon="👤"
                  label="Farmer Name"
                  value={
                    farmerName
                  }
                />

                <ProfileField
                  icon="📱"
                  label="Mobile Number"
                  value={
                    mobile || "-"
                  }
                />

                <ProfileField
                  icon="🏡"
                  label="Village"
                  value={
                    village || "-"
                  }
                />

                <ProfileField
                  icon="📍"
                  label="Mandal"
                  value={
                    mandal || "-"
                  }
                />

                <ProfileField
                  icon="🗺️"
                  label="District"
                  value={
                    district || "-"
                  }
                />

                <ProfileField
                  icon="🌱"
                  label="Land Area"
                  value={
                    landArea
                      ? `${landArea}`
                      : "-"
                  }
                />

                <ProfileField
                  icon="🌾"
                  label="Primary Crop"
                  value={
                    typeof primaryCrop ===
                      "object"
                      ? primaryCrop?.crop ||
                      primaryCrop?.crop_name ||
                      "-"
                      : primaryCrop ||
                      "-"
                  }
                />

                <ProfileField
                  icon="🆔"
                  label="Farmer ID"
                  value={
                    farmerId || "-"
                  }
                />
              </div>
            </div>
          </div>
        </section>
      );
    }

    // ===================================================
    // HOME DASHBOARD
    // ===================================================

    const services = [
      {
        key: "crop",
        icon: "🌾",
        title:
          "Crop Prediction",
        text:
          "Estimate crop production from your farm details.",
        action: () =>
          navigate("crop"),
      },

      {
        key: "centers",
        icon: "🏢",
        title:
          "Procurement Centers",
        text:
          "Find procurement centers and available capacity.",
        action: () =>
          navigate("centers"),
      },

      {
        key: "transport",
        icon: "🚚",
        title:
          "Transport Cost",
        text:
          "Calculate crop transportation cost.",
        action: () =>
          navigate("transport"),
      },

      {
        key:
          "procurement-request",
        icon: "📄",
        title:
          "Procurement Request",
        text:
          "Submit crop quantity for Government approval.",
        action:
          openProcurementRequest,
      },

      {
        key: "requests",
        icon: "📋",
        title:
          "My Requests",
        text:
          "Track your procurement requests and status.",
        action: () =>
          navigate("requests"),
      },

      {
        key:
          "appointments",
        icon: "📅",
        title:
          "Appointments",
        text:
          "View approved procurement dates and timings.",
        action: () =>
          navigate(
            "appointments"
          ),
      },

      {
        key:
          "notifications",
        icon: "🔔",
        title:
          "Notifications",
        text:
          "View approvals, rejections, suggestions and updates.",
        action: () =>
          navigate(
            "notifications"
          ),
        badge:
          unreadNotifications,
      },

      {
        key: "profile",
        icon: "👨‍🌾",
        title: "Profile",
        text:
          "View your farmer and farm information.",
        action: () =>
          navigate("profile"),
      },
    ];

    return (
      <section>
        <PageHeading
          title="Farmer Dashboard"
          text={`Welcome ${farmerName}. Manage your procurement activities from one place.`}
        />

        {/* SUMMARY */}

        <div
          style={
            ui.summaryGrid
          }
          className="summary-grid"
        >
          <SummaryCard
            icon="📋"
            value={
              requests.length
            }
            label="Total Requests"
          />

          <SummaryCard
            icon="⏳"
            value={
              pendingCount
            }
            label="Pending"
          />

          <SummaryCard
            icon="✓"
            value={
              approvedCount
            }
            label="Approved"
          />

          <SummaryCard
            icon="📅"
            value={
              appointmentCount
            }
            label="Appointments"
          />
        </div>

        <div
          style={
            ui.sectionLabelRow
          }
        >
          <div>
            <span
              style={
                ui.sectionLabel
              }
            >
              FARMER SERVICES
            </span>

            <h2
              style={
                ui.servicesHeading
              }
            >
              Procurement Services
            </h2>
          </div>
        </div>

        <div
          style={
            ui.serviceGrid
          }
          className="service-grid"
        >
          {services.map(
            (service) => (
              <button
                key={
                  service.key
                }
                onClick={
                  service.action
                }
                style={
                  ui.serviceCard
                }
              >
                {service.badge >
                  0 && (
                    <span
                      style={
                        ui.serviceBadge
                      }
                    >
                      {
                        service.badge
                      }
                    </span>
                  )}

                <div
                  style={
                    ui.smallImage
                  }
                >
                  {
                    service.icon
                  }
                </div>

                <div
                  style={
                    ui.serviceBody
                  }
                >
                  <h3
                    style={
                      ui.serviceTitle
                    }
                  >
                    {
                      service.title
                    }
                  </h3>

                  <p
                    style={
                      ui.serviceText
                    }
                  >
                    {
                      service.text
                    }
                  </p>

                  <span
                    style={
                      ui.openLink
                    }
                  >
                    Open →
                  </span>
                </div>
              </button>
            )
          )}
        </div>
      </section>
    );
  };

  // =====================================================
  // MENU
  // =====================================================

  const menu = [
    [
      "home",
      "⌂",
      "Dashboard",
    ],

    [
      "crop",
      "🌾",
      "Crop Prediction",
    ],

    [
      "centers",
      "🏢",
      "Procurement Centers",
    ],

    [
      "transport",
      "🚚",
      "Transport Cost",
    ],

    [
      "procurement-request",
      "📄",
      "Procurement Request",
    ],

    [
      "requests",
      "📋",
      "My Requests",
    ],

    [
      "appointments",
      "📅",
      "Appointments",
    ],

    [
      "notifications",
      "🔔",
      "Notifications",
    ],
  ];

  return (
    <div style={ui.shell}>
      <style>{`
        * {
          box-sizing: border-box;
        }

        button {
          font-family: inherit;
        }

        .service-grid button,
        .dashboard-nav-button {
          transition:
            transform .18s ease,
            box-shadow .18s ease,
            background .18s ease;
        }

        .service-grid button:hover {
          transform: translateY(-2px);
          box-shadow:
            0 10px 28px rgba(28, 74, 50, .10) !important;
        }

        @media (max-width: 1250px) {
          .service-grid {
            grid-template-columns:
              repeat(3, minmax(0, 1fr)) !important;
          }

          .summary-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr)) !important;
          }

          .profile-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr)) !important;
          }
        }

        @media (max-width: 900px) {
          .farmer-dashboard-shell {
            grid-template-columns:
              205px minmax(0, 1fr) !important;
          }

          .service-grid,
          .dashboard-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr)) !important;
          }
        }

        @media (max-width: 700px) {
          .farmer-dashboard-shell {
            display: block !important;
          }

          .farmer-sidebar {
            min-height: auto !important;
            position: relative !important;
          }

          .farmer-sidebar-nav {
            display: grid !important;
            grid-template-columns:
              repeat(2, minmax(0, 1fr)) !important;
          }

          .service-grid,
          .dashboard-grid,
          .summary-grid,
          .profile-grid {
            grid-template-columns:
              1fr !important;
          }
        }
      `}</style>

      <aside
        style={ui.sidebar}
        className="farmer-sidebar"
      >
        <div
          style={ui.brand}
        >
          <div
            style={
              ui.brandMark
            }
          >
            🌾
          </div>

          <div>
            <div
              style={
                ui.brandName
              }
            >
              AgriProcure
            </div>

            <div
              style={
                ui.brandSub
              }
            >
              FARMER PORTAL
            </div>
          </div>
        </div>

        <nav
          style={ui.nav}
          className="farmer-sidebar-nav"
        >
          {menu.map(
            ([
              key,
              icon,
              label,
            ]) => (
              <button
                key={key}
                className="dashboard-nav-button"
                onClick={() =>
                  key ===
                    "procurement-request"
                    ? openProcurementRequest()
                    : navigate(
                      key
                    )
                }
                style={{
                  ...ui.navButton,

                  ...(page ===
                    key
                    ? ui.navButtonActive
                    : {}),
                }}
              >
                <span
                  style={
                    ui.navButtonLeft
                  }
                >
                  <span
                    style={
                      ui.navIcon
                    }
                  >
                    {icon}
                  </span>

                  {label}
                </span>

                {key ===
                  "notifications" &&
                  unreadNotifications >
                  0 && (
                    <span
                      style={
                        ui.count
                      }
                    >
                      {
                        unreadNotifications
                      }
                    </span>
                  )}
              </button>
            )
          )}
        </nav>

        {/* PROFILE SEPARATE */}

        <div
          style={
            ui.profileMenu
          }
        >
          <button
            className="dashboard-nav-button"
            onClick={() =>
              navigate(
                "profile"
              )
            }
            style={{
              ...ui.navButton,

              ...(page ===
                "profile"
                ? ui.navButtonActive
                : {}),
            }}
          >
            <span
              style={
                ui.navButtonLeft
              }
            >
              <span
                style={
                  ui.navIcon
                }
              >
                👨‍🌾
              </span>

              Profile
            </span>
          </button>
        </div>

        <div
          style={
            ui.sidebarBottom
          }
        >
          <button
            onClick={
              onLogout
            }
            style={ui.logout}
          >
            Logout
          </button>
        </div>
      </aside>

      <main
        style={ui.content}
      >
        {renderMiddle()}
      </main>
    </div>
  );
}

// =====================================================
// PART 2 CONTINUES DIRECTLY HERE
// Helper components + complete clean styles + export
// =====================================================
// =====================================================
// PAGE HEADING
// =====================================================

function PageHeading({
  title,
  text,
}) {
  return (
    <div style={ui.heading}>
      <div>
        <div style={ui.eyebrow}>
          SMART PROCUREMENT PLANNING
        </div>

        <h1 style={ui.headingTitle}>
          {title}
        </h1>

        <p style={ui.headingText}>
          {text}
        </p>
      </div>
    </div>
  );
}

// =====================================================
// INFORMATION ROW
// =====================================================

function InfoRow({
  label,
  value,
}) {
  return (
    <div style={ui.infoRow}>
      <span style={ui.infoLabel}>
        {label}
      </span>

      <strong style={ui.infoValue}>
        {value}
      </strong>
    </div>
  );
}

// =====================================================
// STATUS BADGE
// =====================================================

function StatusBadge({
  status,
}) {
  const normalizedStatus =
    String(
      status || "pending"
    ).toLowerCase();

  let style =
    ui.statusPending;

  if (
    [
      "approved",
      "accepted",
      "booked",
    ].includes(
      normalizedStatus
    )
  ) {
    style =
      ui.statusApproved;
  }

  if (
    [
      "rejected",
      "cancelled",
    ].includes(
      normalizedStatus
    )
  ) {
    style =
      ui.statusRejected;
  }

  if (
    normalizedStatus ===
    "completed"
  ) {
    style =
      ui.statusCompleted;
  }

  if (
    normalizedStatus ===
    "completion_requested"
  ) {
    style =
      ui.statusProcessing;
  }

  return (
    <span
      style={{
        ...ui.statusBadge,
        ...style,
      }}
    >
      {String(
        status || "pending"
      )
        .replaceAll("_", " ")
        .toUpperCase()}
    </span>
  );
}

// =====================================================
// DASHBOARD SUMMARY
// =====================================================

function SummaryCard({
  icon,
  value,
  label,
}) {
  return (
    <div style={ui.summaryCard}>
      <div
        style={
          ui.summaryIcon
        }
      >
        {icon}
      </div>

      <div>
        <strong
          style={
            ui.summaryValue
          }
        >
          {value}
        </strong>

        <span
          style={
            ui.summaryLabel
          }
        >
          {label}
        </span>
      </div>
    </div>
  );
}

// =====================================================
// NOTIFICATION SUMMARY
// =====================================================

function NotificationSummary({
  icon,
  title,
  count,
}) {
  return (
    <div
      style={
        ui.notificationSummary
      }
    >
      <div
        style={
          ui.notificationSummaryIcon
        }
      >
        {icon}
      </div>

      <div>
        <strong
          style={
            ui.notificationSummaryCount
          }
        >
          {count}
        </strong>

        <span
          style={
            ui.notificationSummaryTitle
          }
        >
          {title}
        </span>
      </div>
    </div>
  );
}

// =====================================================
// PROFILE FIELD
// =====================================================

function ProfileField({
  icon,
  label,
  value,
}) {
  return (
    <div
      style={
        ui.profileField
      }
    >
      <div
        style={
          ui.profileFieldIcon
        }
      >
        {icon}
      </div>

      <div
        style={
          ui.profileFieldContent
        }
      >
        <span
          style={
            ui.profileFieldLabel
          }
        >
          {label}
        </span>

        <strong
          style={
            ui.profileFieldValue
          }
        >
          {value}
        </strong>
      </div>
    </div>
  );
}

// =====================================================
// STYLES
// =====================================================

const ui = {
  // ===================================================
  // MAIN SHELL
  // ===================================================

  shell: {
    minHeight: "100vh",

    width: "100%",

    display: "grid",

    gridTemplateColumns:
      "235px minmax(0, 1fr)",

    background: "#f5f7f4",

    color: "#183126",

    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },

  // ===================================================
  // SIDEBAR
  // ===================================================

  sidebar: {
    minHeight: "100vh",

    padding:
      "24px 14px 18px",

    display: "flex",

    flexDirection: "column",

    position: "sticky",

    top: 0,

    alignSelf: "start",

    boxSizing: "border-box",

    background:
      "linear-gradient(180deg,#123c2d 0%,#103528 100%)",
  },

  brand: {
    padding:
      "0 8px 22px",

    display: "flex",

    alignItems: "center",

    gap: 10,

    borderBottom:
      "1px solid rgba(255,255,255,.11)",
  },

  brandMark: {
    width: 39,

    height: 39,

    display: "grid",

    placeItems: "center",

    flexShrink: 0,

    borderRadius: 11,

    background: "#eef7ef",

    fontSize: 20,
  },

  brandName: {
    color: "#ffffff",

    fontSize: 17,

    fontWeight: 800,

    letterSpacing: "-.2px",
  },

  brandSub: {
    marginTop: 2,

    color: "#a9c9b8",

    fontSize: 8,

    fontWeight: 700,

    letterSpacing: 1.4,
  },

  nav: {
    paddingTop: 20,

    display: "flex",

    flexDirection: "column",

    gap: 5,
  },

  navButton: {
    width: "100%",

    minHeight: 43,

    padding:
      "0 11px",

    display: "flex",

    alignItems: "center",

    justifyContent:
      "space-between",

    gap: 8,

    border: 0,

    borderRadius: 9,

    background:
      "transparent",

    color: "#d6e6dc",

    fontSize: 12,

    fontWeight: 650,

    textAlign: "left",

    cursor: "pointer",
  },

  navButtonActive: {
    background:
      "#ffffff",

    color: "#153e2e",

    boxShadow:
      "0 7px 20px rgba(0,0,0,.13)",
  },

  navButtonLeft: {
    minWidth: 0,

    display: "flex",

    alignItems: "center",

    gap: 9,
  },

  navIcon: {
    width: 23,

    flexShrink: 0,

    display: "inline-flex",

    alignItems: "center",

    justifyContent: "center",

    fontSize: 14,
  },

  count: {
    minWidth: 21,

    height: 21,

    padding: "0 5px",

    display: "inline-flex",

    alignItems: "center",

    justifyContent: "center",

    flexShrink: 0,

    borderRadius: 999,

    background: "#dff2df",

    color: "#174c35",

    fontSize: 9,

    fontWeight: 900,
  },

  profileMenu: {
    marginTop: 12,

    paddingTop: 12,

    borderTop:
      "1px solid rgba(255,255,255,.11)",
  },

  sidebarBottom: {
    marginTop: "auto",

    padding:
      "16px 4px 0",

    borderTop:
      "1px solid rgba(255,255,255,.11)",
  },

  logout: {
    width: "100%",

    minHeight: 40,

    border:
      "1px solid rgba(255,255,255,.2)",

    borderRadius: 9,

    background:
      "rgba(255,255,255,.04)",

    color: "#ffffff",

    fontSize: 11,

    fontWeight: 750,

    cursor: "pointer",
  },

  // ===================================================
  // CONTENT
  // ===================================================

  content: {
    minWidth: 0,

    padding:
      "34px clamp(20px,3vw,46px)",

    boxSizing: "border-box",

    overflowX: "hidden",
  },

  // ===================================================
  // PAGE HEADING
  // ===================================================

  heading: {
    marginBottom: 23,

    display: "flex",

    alignItems: "flex-end",

    justifyContent:
      "space-between",

    gap: 20,
  },

  eyebrow: {
    marginBottom: 6,

    color: "#4f7b64",

    fontSize: 9,

    fontWeight: 850,

    letterSpacing: 1.4,
  },

  headingTitle: {
    margin: 0,

    color: "#153d2d",

    fontSize:
      "clamp(25px,3vw,34px)",

    lineHeight: 1.1,

    letterSpacing: "-.7px",
  },

  headingText: {
    maxWidth: 700,

    margin:
      "8px 0 0",

    color: "#728078",

    fontSize: 12,

    lineHeight: 1.55,
  },

  // ===================================================
  // DASHBOARD SUMMARY
  // ===================================================

  summaryGrid: {
    marginBottom: 28,

    display: "grid",

    gridTemplateColumns:
      "repeat(4,minmax(0,1fr))",

    gap: 13,
  },

  summaryCard: {
    minHeight: 90,

    padding: "15px",

    display: "flex",

    alignItems: "center",

    gap: 12,

    border:
      "1px solid #dfe7e1",

    borderRadius: 13,

    background: "#ffffff",

    boxShadow:
      "0 5px 18px rgba(30,70,47,.045)",
  },

  summaryIcon: {
    width: 43,

    height: 43,

    flexShrink: 0,

    display: "grid",

    placeItems: "center",

    borderRadius: 11,

    background: "#edf6ef",

    fontSize: 20,
  },

  summaryValue: {
    display: "block",

    color: "#173f2e",

    fontSize: 22,

    lineHeight: 1,
  },

  summaryLabel: {
    display: "block",

    marginTop: 5,

    color: "#7d8a82",

    fontSize: 9,

    fontWeight: 700,
  },

  // ===================================================
  // SERVICES
  // ===================================================

  sectionLabelRow: {
    marginBottom: 13,

    display: "flex",

    alignItems: "flex-end",

    justifyContent:
      "space-between",
  },

  sectionLabel: {
    color: "#478064",

    fontSize: 8,

    fontWeight: 900,

    letterSpacing: 1.2,
  },

  servicesHeading: {
    margin:
      "4px 0 0",

    color: "#183f2f",

    fontSize: 19,
  },

  serviceGrid: {
    display: "grid",

    gridTemplateColumns:
      "repeat(4,minmax(0,1fr))",

    gap: 14,

    width: "100%",
  },

  serviceCard: {
    minHeight: 170,

    padding: 17,

    position: "relative",

    display: "flex",

    flexDirection: "column",

    alignItems:
      "flex-start",

    border:
      "1px solid #dfe7e1",

    borderRadius: 14,

    background: "#ffffff",

    boxShadow:
      "0 6px 20px rgba(30,70,47,.05)",

    textAlign: "left",

    cursor: "pointer",
  },

  serviceBadge: {
    position: "absolute",

    top: 12,

    right: 12,

    minWidth: 21,

    height: 21,

    padding: "0 5px",

    display: "grid",

    placeItems: "center",

    borderRadius: 999,

    background: "#c93e35",

    color: "#ffffff",

    fontSize: 8,

    fontWeight: 900,
  },

  smallImage: {
    width: 45,

    height: 45,

    marginBottom: 13,

    display: "grid",

    placeItems: "center",

    borderRadius: 11,

    background: "#edf6ed",

    fontSize: 21,
  },

  serviceBody: {
    width: "100%",
  },

  serviceTitle: {
    margin: 0,

    color: "#173e2e",

    fontSize: 14,

    lineHeight: 1.3,
  },

  serviceText: {
    minHeight: 39,

    margin:
      "6px 0 11px",

    color: "#74827a",

    fontSize: 10,

    lineHeight: 1.5,
  },

  openLink: {
    color: "#257149",

    fontSize: 9,

    fontWeight: 850,
  },

  // ===================================================
  // APPOINTMENT PAGE MESSAGE
  // ===================================================

  pageMessage: {
    marginBottom: 17,

    padding:
      "11px 14px",

    display: "flex",

    alignItems: "center",

    gap: 9,

    borderRadius: 10,

    fontSize: 11,

    fontWeight: 650,
  },

  pageMessageSuccess: {
    border:
      "1px solid #cce8d7",

    background: "#edf8f1",

    color: "#176b48",
  },

  pageMessageError: {
    border:
      "1px solid #f1d0cb",

    background: "#fff0ee",

    color: "#a63e35",
  },

  pageMessageIcon: {
    width: 23,

    height: 23,

    flexShrink: 0,

    display: "grid",

    placeItems: "center",

    borderRadius: "50%",

    background:
      "rgba(255,255,255,.7)",

    fontSize: 10,

    fontWeight: 900,
  },

  // ===================================================
  // APPOINTMENTS
  // ===================================================

  requestGrid: {
    display: "grid",

    gridTemplateColumns:
      "repeat(3,minmax(0,1fr))",

    gap: 15,

    width: "100%",
  },

  requestCard: {
    minWidth: 0,

    padding: 17,

    border:
      "1px solid #dfe7e1",

    borderRadius: 14,

    background: "#ffffff",

    boxShadow:
      "0 6px 20px rgba(30,70,47,.05)",
  },

  cardTop: {
    display: "flex",

    alignItems: "center",

    justifyContent:
      "space-between",

    gap: 9,
  },

  requestNo: {
    color: "#7b8880",

    fontSize: 9,

    fontWeight: 750,
  },

  statusBadge: {
    maxWidth: 145,

    padding:
      "5px 7px",

    overflow: "hidden",

    borderRadius: 999,

    fontSize: 7,

    fontWeight: 900,

    letterSpacing: ".3px",

    textOverflow: "ellipsis",

    whiteSpace: "nowrap",
  },

  statusPending: {
    border:
      "1px solid #eadba9",

    background: "#fff8e5",

    color: "#8a6518",
  },

  statusApproved: {
    border:
      "1px solid #cce8d7",

    background: "#eaf7ef",

    color: "#177647",
  },

  statusRejected: {
    border:
      "1px solid #f1d0cb",

    background: "#fff0ee",

    color: "#b34237",
  },

  statusCompleted: {
    border:
      "1px solid #bfe3cd",

    background: "#e7f7ed",

    color: "#126b40",
  },

  statusProcessing: {
    border:
      "1px solid #d6e2f5",

    background: "#eef4ff",

    color: "#315f99",
  },

  appointmentIconRow: {
    margin:
      "15px 0 11px",

    paddingBottom: 12,

    display: "flex",

    alignItems: "center",

    gap: 10,

    borderBottom:
      "1px solid #edf1ed",
  },

  appointmentIcon: {
    width: 39,

    height: 39,

    display: "grid",

    placeItems: "center",

    flexShrink: 0,

    borderRadius: 10,

    background: "#edf6ef",

    fontSize: 18,
  },

  requestCrop: {
    margin: 0,

    color: "#173e2e",

    fontSize: 14,
  },

  appointmentSub: {
    display: "block",

    marginTop: 2,

    color: "#8a978f",

    fontSize: 8,
  },

  infoRow: {
    padding: "7px 0",

    display: "flex",

    alignItems:
      "flex-start",

    justifyContent:
      "space-between",

    gap: 12,

    borderBottom:
      "1px solid #edf1ed",

    fontSize: 9,
  },

  infoLabel: {
    color: "#7a877f",
  },

  infoValue: {
    maxWidth: "62%",

    color: "#294739",

    textAlign: "right",

    overflowWrap: "anywhere",
  },

  primaryButton: {
    width: "100%",

    minHeight: 38,

    marginTop: 12,

    padding:
      "0 11px",

    border: 0,

    borderRadius: 9,

    background: "#1e6846",

    color: "#ffffff",

    fontSize: 9,

    fontWeight: 800,

    cursor: "pointer",
  },

  notice: {
    marginTop: 11,

    padding: 9,

    border:
      "1px solid #efe0b8",

    borderRadius: 8,

    background: "#fff8e7",

    color: "#7b641f",

    fontSize: 8,

    lineHeight: 1.5,
  },

  successNotice: {
    marginTop: 11,

    padding: 9,

    border:
      "1px solid #cce8d7",

    borderRadius: 8,

    background: "#edf8ef",

    color: "#286847",

    fontSize: 8,

    fontWeight: 700,

    lineHeight: 1.5,
  },

  // ===================================================
  // EMPTY STATE
  // ===================================================

  empty: {
    minHeight: 230,

    padding: 28,

    display: "flex",

    flexDirection: "column",

    alignItems: "center",

    justifyContent: "center",

    gap: 6,

    border:
      "1px solid #dfe7e1",

    borderRadius: 14,

    background: "#ffffff",

    color: "#718078",

    fontSize: 11,

    textAlign: "center",
  },

  emptyIcon: {
    width: 54,

    height: 54,

    marginBottom: 5,

    display: "grid",

    placeItems: "center",

    borderRadius: "50%",

    background: "#edf6ef",

    fontSize: 23,
  },

  // ===================================================
  // NOTIFICATIONS
  // ===================================================

  notificationHeading: {
    display: "flex",

    alignItems:
      "flex-start",

    justifyContent:
      "space-between",

    gap: 15,
  },

  readAllButton: {
    marginTop: 8,

    minHeight: 36,

    padding:
      "0 12px",

    flexShrink: 0,

    border:
      "1px solid #cddfd3",

    borderRadius: 9,

    background: "#ffffff",

    color: "#286548",

    fontSize: 9,

    fontWeight: 800,

    cursor: "pointer",
  },

  notificationCategories: {
    marginBottom: 18,

    display: "grid",

    gridTemplateColumns:
      "repeat(4,minmax(0,1fr))",

    gap: 11,
  },

  notificationSummary: {
    padding: 12,

    display: "flex",

    alignItems: "center",

    gap: 9,

    border:
      "1px solid #dfe7e1",

    borderRadius: 11,

    background: "#ffffff",
  },

  notificationSummaryIcon: {
    width: 35,

    height: 35,

    flexShrink: 0,

    display: "grid",

    placeItems: "center",

    borderRadius: 9,

    background: "#edf6ef",

    color: "#246d49",

    fontSize: 14,

    fontWeight: 900,
  },

  notificationSummaryCount: {
    display: "block",

    color: "#173f2e",

    fontSize: 16,

    lineHeight: 1,
  },

  notificationSummaryTitle: {
    display: "block",

    marginTop: 4,

    color: "#7d8b82",

    fontSize: 8,

    fontWeight: 700,
  },

  notificationList: {
    display: "flex",

    flexDirection: "column",

    gap: 10,
  },

  notificationCard: {
    padding: 14,

    display: "flex",

    alignItems:
      "flex-start",

    gap: 12,

    border:
      "1px solid #dfe7e1",

    borderRadius: 12,

    background: "#ffffff",

    boxShadow:
      "0 4px 15px rgba(28,69,46,.035)",
  },

  notificationUnread: {
    borderLeft:
      "3px solid #23724c",

    background: "#fbfefc",
  },

  notificationIcon: {
    width: 40,

    height: 40,

    flexShrink: 0,

    display: "grid",

    placeItems: "center",

    borderRadius: 10,

    fontSize: 16,

    fontWeight: 900,
  },

  notificationContent: {
    minWidth: 0,

    flex: 1,
  },

  notificationTop: {
    display: "flex",

    alignItems:
      "flex-start",

    justifyContent:
      "space-between",

    gap: 10,
  },

  notificationType: {
    display: "inline-block",

    padding:
      "4px 7px",

    borderRadius: 999,

    fontSize: 7,

    fontWeight: 900,

    textTransform:
      "uppercase",

    letterSpacing: ".35px",
  },

  notificationTitle: {
    margin:
      "6px 0 0",

    color: "#183f2f",

    fontSize: 13,

    lineHeight: 1.35,
  },

  unreadDot: {
    width: 8,

    height: 8,

    marginTop: 5,

    flexShrink: 0,

    borderRadius: "50%",

    background: "#238052",
  },

  notificationMessage: {
    margin:
      "6px 0 0",

    color: "#6f7f76",

    fontSize: 10,

    lineHeight: 1.55,
  },

  notificationCenter: {
    marginTop: 8,

    padding:
      "7px 9px",

    display: "inline-block",

    borderRadius: 7,

    background: "#f3f7f4",

    color: "#476555",

    fontSize: 8,

    fontWeight: 700,
  },

  notificationDate: {
    marginTop: 8,

    color: "#98a29c",

    fontSize: 8,
  },

  // ===================================================
  // PROFILE
  // ===================================================

  profileLayout: {
    display: "grid",

    gridTemplateColumns:
      "230px minmax(0,1fr)",

    gap: 16,

    alignItems: "start",
  },

  profileCard: {
    padding:
      "28px 18px",

    display: "flex",

    flexDirection: "column",

    alignItems: "center",

    border:
      "1px solid #dfe7e1",

    borderRadius: 15,

    background:
      "linear-gradient(160deg,#ffffff,#f0f7f2)",

    boxShadow:
      "0 6px 20px rgba(30,70,47,.05)",

    textAlign: "center",
  },

  profileAvatar: {
    width: 82,

    height: 82,

    marginBottom: 13,

    display: "grid",

    placeItems: "center",

    border:
      "4px solid #ffffff",

    borderRadius: "50%",

    background: "#dcefe2",

    boxShadow:
      "0 6px 18px rgba(25,83,53,.12)",

    fontSize: 39,
  },

  profileName: {
    margin: 0,

    color: "#173e2e",

    fontSize: 19,
  },

  profileRole: {
    margin:
      "5px 0 0",

    color: "#6f8177",

    fontSize: 9,

    fontWeight: 700,
  },

  profileLocation: {
    marginTop: 14,

    padding:
      "7px 10px",

    borderRadius: 999,

    background: "#ffffff",

    color: "#4e6d5b",

    fontSize: 8,

    fontWeight: 700,
  },

  profileDetails: {
    padding: 20,

    border:
      "1px solid #dfe7e1",

    borderRadius: 15,

    background: "#ffffff",

    boxShadow:
      "0 6px 20px rgba(30,70,47,.05)",
  },

  profileSectionHeader: {
    marginBottom: 17,

    paddingBottom: 13,

    borderBottom:
      "1px solid #edf1ee",
  },

  profileEyebrow: {
    color: "#478064",

    fontSize: 8,

    fontWeight: 900,

    letterSpacing: 1.1,
  },

  profileSectionTitle: {
    margin:
      "4px 0 0",

    color: "#173e2e",

    fontSize: 18,
  },

  profileGrid: {
    display: "grid",

    gridTemplateColumns:
      "repeat(2,minmax(0,1fr))",

    gap: 10,
  },

  profileField: {
    minWidth: 0,

    padding: 12,

    display: "flex",

    alignItems: "center",

    gap: 10,

    border:
      "1px solid #e4ebe6",

    borderRadius: 10,

    background: "#f9fbf9",
  },

  profileFieldIcon: {
    width: 35,

    height: 35,

    flexShrink: 0,

    display: "grid",

    placeItems: "center",

    borderRadius: 9,

    background: "#eaf4ed",

    fontSize: 15,
  },

  profileFieldContent: {
    minWidth: 0,
  },

  profileFieldLabel: {
    display: "block",

    marginBottom: 3,

    color: "#8b978f",

    fontSize: 7,

    fontWeight: 700,

    textTransform:
      "uppercase",

    letterSpacing: ".35px",
  },

  profileFieldValue: {
    display: "block",

    overflow: "hidden",

    color: "#355844",

    fontSize: 10,

    textOverflow:
      "ellipsis",

    whiteSpace: "nowrap",
  },
};

export default FarmerDashboard;