import React, {
  useState,
  useEffect
} from "react";

import CropPrediction from "./CropPrediction";
import ProcurementCenter from "./ProcurementCenter";
import TransportCost from "./TransportCost";
import ProcurementRequest from "./ProcurementRequest";


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

  const [loadingRequests, setLoadingRequests] =
    useState(false);


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
    user?.village ||
    "";


  const mandal =
    user?.mandal ||
    "";


  const district =
    user?.district ||
    user?.District ||
    "";


  const landArea =
    user?.land_area ||
    "";


  const primaryCrop =
    selectedCrop ||
    user?.primary_crop ||
    user?.crop ||
    "";


  const navigate = (
    targetPage
  ) => {

    setPage(
      targetPage
    );

  };


  const loadFarmerRequests =
    async () => {

      try {

        setLoadingRequests(
          true
        );


        const response =
          await fetch(

            `${API}/api/procurement-requests/farmer/${farmerId}`

          );


        const result =
          await response.json();


        if (!response.ok) {

          throw new Error(

            result.message ||
            result.error ||
            "Unable to load requests."

          );

        }


        if (
          result.success === false
        ) {

          throw new Error(

            result.message ||
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


        setRequests(
          []
        );


      } finally {

        setLoadingRequests(
          false
        );

      }

    };


  useEffect(() => {

    if (
      page === "requests"
    ) {

      loadFarmerRequests();

    }

  }, [
    page
  ]);


  const normalizeCenter = (
    data
  ) => {

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

        actualCenter?.Procurement_Center_Name ||

        "Unknown Procurement Center",


      center_name:

        actualCenter?.center_name ||

        actualCenter?.name ||

        actualCenter?.Procurement_Center_Name ||

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


  const handleCenterSelected = (
    centerData
  ) => {

    const normalizedCenter =

      normalizeCenter(
        centerData
      );


    if (!normalizedCenter) {

      alert(
        "Invalid procurement center selected."
      );

      return;

    }


    setSelectedCenter(
      normalizedCenter
    );


    const centerCrop =

      centerData?.crop ||

      centerData?.selectedCrop ||

      selectedCrop;


    if (centerCrop) {

      setSelectedCrop(

        String(
          centerCrop
        )

      );

    }


    setTransportData(
      null
    );


    setPage(
      "transport"
    );

  };


  const openProcurementRequest =
    () => {

      if (!selectedCenter) {

        alert(
          "Please select a procurement center first."
        );


        setPage(
          "centers"
        );

        return;

      }


      setPage(
        "procurement-request"
      );

    };


  const handleTransportCalculated =
    (
      data
    ) => {

      setTransportData(
        data
      );

    };


  const handleRequestSent =
    (
      requestData
    ) => {

      setLatestRequest(
        requestData
      );


      setPage(
        "requests"
      );


      setTimeout(() => {

        loadFarmerRequests();

      }, 500);

    };


  if (
    page === "home"
  ) {

    return (

      <div style={styles.app}>


        <aside style={styles.sidebar}>


          <div style={styles.logoSection}>


            <div style={styles.logoIcon}>
              🌾
            </div>


            <div>


              <h2 style={styles.logoTitle}>
                Smart Crop
              </h2>


              <p style={styles.logoSubtitle}>
                Procurement System
              </p>


            </div>


          </div>


          <div style={styles.menuLabel}>
            MAIN MENU
          </div>


          <button

            onClick={() =>
              navigate("home")
            }

            style={{
              ...styles.menuButton,
              ...styles.activeMenu
            }}

          >

            🏠 Dashboard

          </button>


          <button

            onClick={() =>
              navigate("crop")
            }

            style={styles.menuButton}

          >

            🌱 Crop Prediction

          </button>


          <button

            onClick={() =>
              navigate("centers")
            }

            style={styles.menuButton}

          >

            🏢 Procurement Centers

          </button>


          <button

            onClick={() =>
              navigate("procurement-request")
            }

            style={styles.menuButton}

          >

            📨 Procurement Request

          </button>


          <button

            onClick={() =>
              navigate("requests")
            }

            style={styles.menuButton}

          >

            📋 My Requests

          </button>


          <div style={styles.sidebarBottom}>


            <div style={styles.sidebarFarmer}>


              <div style={styles.avatar}>

                {farmerName
                  .charAt(0)
                  .toUpperCase()}

              </div>


              <strong>
                {farmerName}
              </strong>


            </div>


            <button

              onClick={onLogout}

              style={styles.logoutButton}

            >

              🚪 Logout

            </button>


          </div>


        </aside>


        <div style={styles.content}>


          <header style={styles.topHeader}>


            <div>


              <p style={styles.headerSmall}>
                FARMER PORTAL
              </p>


              <h1 style={styles.pageTitle}>

                Welcome back,
                {" "}
                {farmerName}! 👋

              </h1>


              <p style={styles.pageSubtitle}>

                Manage crop production and procurement activities.

              </p>


            </div>


            <div style={styles.locationBox}>

              📍
              {" "}
              {district || "District not available"}

            </div>


          </header>


          <main style={styles.main}>


            <section style={styles.profileCard}>


              <div style={styles.profileMain}>


                <div style={styles.largeAvatar}>

                  {farmerName
                    .charAt(0)
                    .toUpperCase()}

                </div>


                <div>


                  <p>
                    FARMER PROFILE
                  </p>


                  <h2>
                    {farmerName}
                  </h2>


                  <p>
                    📱 {mobile || "-"}
                  </p>


                  <p>
                    📍 {village || "-"}, {mandal || "-"}, {district || "-"}
                  </p>


                </div>


              </div>


            </section>


            <h2 style={styles.sectionHeading}>
              Farm Overview
            </h2>


            <div style={styles.statsGrid}>


              <StatCard
                icon="🌱"
                label="Primary Crop"
                value={primaryCrop || "-"}
              />


              <StatCard
                icon="📐"
                label="Land Area"
                value={
                  landArea
                    ? `${landArea} Acres`
                    : "-"
                }
              />


              <StatCard
                icon="📍"
                label="Mandal"
                value={mandal || "-"}
              />


              <StatCard
                icon="🏛️"
                label="District"
                value={district || "-"}
              />


            </div>


            <section style={styles.serviceSection}>


              <h2 style={styles.sectionHeading}>
                Farmer Services
              </h2>


              <div style={styles.serviceGrid}>


                <ServiceCard

                  icon="📊"

                  title="Crop Production Prediction"

                  description="Predict expected crop production."

                  buttonText="Predict Production"

                  onClick={() =>
                    navigate("crop")
                  }

                />


                <ServiceCard

                  icon="🏢"

                  title="Procurement Centers"

                  description="Find a procurement center."

                  buttonText="View Centers"

                  onClick={() =>
                    navigate("centers")
                  }

                />


                <ServiceCard

                  icon="🚛"

                  title="Transport Planning"

                  description="Select a center and calculate transport cost."

                  buttonText="Select Center"

                  onClick={() =>
                    navigate("centers")
                  }

                />


                <ServiceCard

                  icon="📨"

                  title="Procurement Request"

                  description="Send your crop procurement request."

                  buttonText="Create Request"

                  onClick={
                    openProcurementRequest
                  }

                />


              </div>


            </section>


          </main>


        </div>


      </div>

    );

  }


  if (
    page === "crop"
  ) {

    return (

      <CropPrediction

        user={user}

        goBack={() =>
          navigate("home")
        }

        onCropSelected={(crop) => {

          if (crop) {

            setSelectedCrop(

              typeof crop === "string"

                ? crop

                :

                (
                  crop?.crop ||
                  crop?.name ||
                  crop?.crop_name ||
                  ""
                )

            );

          }

        }}

      />

    );

  }


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
          navigate("centers")
        }

        onTransportCalculated={
          handleTransportCalculated
        }

        onOpenProcurementRequest={
          openProcurementRequest
        }

      />

    );

  }


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


  if (
    page === "requests"
  ) {

    return (

      <div style={styles.requestPage}>


        <header style={styles.requestHeader}>


          <div>


            <button

              onClick={() =>
                navigate("home")
              }

              style={styles.backButton}

            >

              ← Dashboard

            </button>


            <h1>
              My Procurement Requests
            </h1>


            <p>
              Track your procurement requests and their status.
            </p>


          </div>


          <button

            onClick={onLogout}

            style={styles.logoutSmall}

          >

            Logout

          </button>


        </header>


        <main style={styles.requestMain}>


          {loadingRequests ? (

            <div style={styles.statusCard}>

              <h2>
                Loading Requests...
              </h2>

            </div>

          ) : requests.length === 0 ? (

            <div style={styles.statusCard}>


              <h2>
                No Requests Yet
              </h2>


              <p>
                You have not sent any procurement requests.
              </p>


            </div>

          ) : (

            <div style={styles.requestsList}>


              {requests.map(
                (
                  requestItem
                ) => (

                  <div

                    key={
                      requestItem.id
                    }

                    style={
                      styles.requestCard
                    }

                  >


                    <div
                      style={
                        styles.requestCardHeader
                      }
                    >


                      <div>


                        <h2
                          style={{
                            margin: 0
                          }}
                        >

                          🌾
                          {" "}
                          {requestItem.crop}

                        </h2>


                        <p>
                          Request ID: #{requestItem.id}
                        </p>


                      </div>


                      <span
                        style={styles.statusBadge}
                      >

                        ⏳
                        {" "}
                        {requestItem.status}

                      </span>


                    </div>


                    <div
                      style={
                        styles.requestDetailsGrid
                      }
                    >


                      <RequestDetail
                        icon="🏢"
                        label="Center"
                        value={
                          requestItem.center_name
                        }
                      />


                      <RequestDetail
                        icon="📦"
                        label="Quantity"
                        value={`${requestItem.quantity} tons`}
                      />


                      <RequestDetail
                        icon="📍"
                        label="Distance"
                        value={`${requestItem.distance_km} KM`}
                      />


                      <RequestDetail
                        icon="🚛"
                        label="Vehicle"
                        value={
                          requestItem.vehicle ||
                          "-"
                        }
                      />


                      <RequestDetail
                        icon="💰"
                        label="Transport Cost"
                        value={`₹${requestItem.transport_cost}`}
                      />


                    </div>


                  </div>

                )

              )}


            </div>

          )}


          <button

            onClick={
              openProcurementRequest
            }

            style={
              styles.newRequestButton
            }

          >

            📨 Create New Procurement Request

          </button>


        </main>


      </div>

    );

  }


  return null;

}


function StatCard({

  icon,
  label,
  value

}) {

  return (

    <div
      style={styles.statCard}
    >

      <div
        style={styles.statIcon}
      >

        {icon}

      </div>


      <div>

        <p
          style={styles.statLabel}
        >

          {label}

        </p>


        <h3>
          {value}
        </h3>

      </div>


    </div>

  );

}


function ServiceCard({

  icon,
  title,
  description,
  buttonText,
  onClick

}) {

  return (

    <div
      style={styles.serviceCard}
    >


      <div
        style={styles.serviceIcon}
      >

        {icon}

      </div>


      <h3>
        {title}
      </h3>


      <p>
        {description}
      </p>


      <button

        onClick={onClick}

        style={
          styles.serviceButton
        }

      >

        {buttonText}
        {" "}
        →

      </button>


    </div>

  );

}


function RequestDetail({

  icon,
  label,
  value

}) {

  return (

    <div
      style={
        styles.requestDetail
      }
    >

      <span
        style={
          styles.requestLabel
        }
      >

        {icon}
        {" "}
        {label}

      </span>


      <strong
        style={
          styles.requestValue
        }
      >

        {value}

      </strong>


    </div>

  );

}


const styles = {

  app: {
    minHeight: "100vh",
    display: "flex",
    background: "#f4f7f5",
    fontFamily: "Arial, sans-serif"
  },

  sidebar: {
    width: "260px",
    minHeight: "100vh",
    background: "#153f30",
    color: "white",
    padding: "25px 15px",
    display: "flex",
    flexDirection: "column"
  },

  logoSection: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    marginBottom: "30px"
  },

  logoIcon: {
    fontSize: "32px"
  },

  logoTitle: {
    margin: 0
  },

  logoSubtitle: {
    margin: "4px 0",
    fontSize: "12px"
  },

  menuLabel: {
    fontSize: "11px",
    marginBottom: "10px",
    opacity: 0.7
  },

  menuButton: {
    padding: "13px",
    border: "none",
    background: "transparent",
    color: "white",
    textAlign: "left",
    cursor: "pointer",
    borderRadius: "8px",
    marginBottom: "5px"
  },

  activeMenu: {
    background: "#286147"
  },

  sidebarBottom: {
    marginTop: "auto"
  },

  sidebarFarmer: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "15px"
  },

  avatar: {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    background: "#3c8863",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },

  logoutButton: {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer"
  },

  content: {
    flex: 1
  },

  topHeader: {
    background: "white",
    padding: "30px 45px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },

  headerSmall: {
    fontSize: "11px",
    color: "#5a8f72"
  },

  pageTitle: {
    color: "#193f31"
  },

  pageSubtitle: {
    color: "#777"
  },

  locationBox: {
    padding: "10px 15px",
    background: "#f4f8f5",
    borderRadius: "8px"
  },

  main: {
    padding: "35px 45px"
  },

  profileCard: {
    background: "#1f4d3a",
    color: "white",
    padding: "28px",
    borderRadius: "16px"
  },

  profileMain: {
    display: "flex",
    alignItems: "center",
    gap: "20px"
  },

  largeAvatar: {
    width: "70px",
    height: "70px",
    borderRadius: "50%",
    background: "#3c8863",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "28px"
  },

  sectionHeading: {
    marginTop: "35px"
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
    gap: "18px"
  },

  statCard: {
    background: "white",
    padding: "20px",
    borderRadius: "12px",
    display: "flex",
    gap: "15px"
  },

  statIcon: {
    fontSize: "28px"
  },

  statLabel: {
    margin: 0,
    color: "#777"
  },

  serviceSection: {
    marginTop: "40px"
  },

  serviceGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))",
    gap: "20px"
  },

  serviceCard: {
    background: "white",
    padding: "25px",
    borderRadius: "15px"
  },

  serviceIcon: {
    fontSize: "30px"
  },

  serviceButton: {
    width: "100%",
    border: "none",
    padding: "12px",
    background: "#1f6b4f",
    color: "white",
    borderRadius: "8px",
    cursor: "pointer"
  },

  requestPage: {
    minHeight: "100vh",
    background: "#f4f7f5",
    fontFamily: "Arial, sans-serif"
  },

  requestHeader: {
    background: "white",
    padding: "25px 8%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },

  backButton: {
    border: "none",
    background: "#eaf4ed",
    padding: "10px 18px",
    borderRadius: "8px",
    cursor: "pointer"
  },

  logoutSmall: {
    padding: "10px 20px",
    background: "#1f4d3a",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer"
  },

  requestMain: {
    maxWidth: "950px",
    margin: "auto",
    padding: "40px 20px"
  },

  statusCard: {
    background: "white",
    padding: "30px",
    borderRadius: "14px"
  },

  requestsList: {
    display: "flex",
    flexDirection: "column",
    gap: "20px"
  },

  requestCard: {
    background: "white",
    padding: "25px",
    borderRadius: "15px"
  },

  requestCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "25px"
  },

  statusBadge: {
    padding: "8px 15px",
    borderRadius: "20px",
    background: "#fff3cd",
    fontWeight: "bold",
    textTransform: "capitalize"
  },

  requestDetailsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
    gap: "20px"
  },

  requestDetail: {
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },

  requestLabel: {
    color: "#777"
  },

  requestValue: {
    color: "#193f31"
  },

  newRequestButton: {
    width: "100%",
    marginTop: "25px",
    padding: "15px",
    background: "#1f6b4f",
    color: "white",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "bold"
  }

};


export default FarmerDashboard;