import React, { useState } from "react";

import Login from "./pages/Login";
import Register from "./pages/Register";
import OTPVerification from "./pages/OTPVerification";

import FarmerDashboard from "./pages/FarmerDashboard";
import GovernmentDashboard from "./pages/GovernmentDashboard";
import AdminDashboard from "./pages/AdminDashboard";

import ProcurementPlanning from "./pages/ProcurementPlanning";
import TransportCost from "./pages/TransportCost";
import ProcurementRequest from "./pages/ProcurementRequest";

function App() {

  // =====================================================
  // CURRENT PAGE
  // =====================================================

  const [page, setPage] = useState("login");


  // =====================================================
  // VERIFIED MOBILE
  // =====================================================

  const [verifiedMobile, setVerifiedMobile] = useState("");


  // =====================================================
  // SELECTED PROCUREMENT CENTER
  // =====================================================

  const [selectedCenter, setSelectedCenter] =
    useState(null);


  // =====================================================
  // SELECTED CROP
  // =====================================================

  const [selectedCrop, setSelectedCrop] =
    useState("");


  // =====================================================
  // PROCUREMENT REQUEST DATA
  // =====================================================

  const [procurementRequest, setProcurementRequest] =
    useState(null);


  // =====================================================
  // USER SESSION
  // =====================================================

  const [user, setUser] = useState(() => {

    const savedUser =
      localStorage.getItem(
        "smart_procurement_user"
      );

    if (!savedUser) {
      return null;
    }

    try {

      return JSON.parse(savedUser);

    } catch (error) {

      console.error(
        "Invalid saved user:",
        error
      );

      localStorage.removeItem(
        "smart_procurement_user"
      );

      localStorage.removeItem(
        "user_role"
      );

      localStorage.removeItem(
        "admin_mobile"
      );

      return null;
    }

  });


  // =====================================================
  // LOGIN SUCCESS
  // =====================================================

  const handleLogin = (loggedInUser) => {

    if (!loggedInUser) {
      return;
    }

    console.log(
      "Logged in user:",
      loggedInUser
    );


    // -------------------------------------------------
    // NORMALIZE USER DATA
    // -------------------------------------------------

    const normalizedUser = {

      ...loggedInUser,

      mobile_number:
        loggedInUser.mobile_number ||
        loggedInUser.mobile ||
        loggedInUser.phone ||
        loggedInUser.phone_number ||
        "",

      full_name:
        loggedInUser.full_name ||
        loggedInUser.name ||
        loggedInUser.username ||
        "",

      district:
        loggedInUser.district ||
        loggedInUser.District ||
        "",

      village:
        loggedInUser.village ||
        loggedInUser.Village ||
        "",

      mandal:
        loggedInUser.mandal ||
        loggedInUser.Mandal ||
        "",

      primary_crop:
        loggedInUser.primary_crop ||
        loggedInUser.crop ||
        loggedInUser.Crop ||
        ""

    };


    // -------------------------------------------------
    // SAVE USER
    // -------------------------------------------------

    setUser(normalizedUser);

    localStorage.setItem(
      "smart_procurement_user",
      JSON.stringify(normalizedUser)
    );


    // -------------------------------------------------
    // GET ROLE
    // -------------------------------------------------

    const role = String(
      normalizedUser.role || ""
    )
      .trim()
      .toLowerCase();


    localStorage.setItem(
      "user_role",
      role
    );


    // -------------------------------------------------
    // SAVE ADMIN MOBILE
    // -------------------------------------------------

    if (

      role === "admin" ||
      role === "administrator" ||
      role === "government" ||
      role === "government_user" ||
      role === "government officer"

    ) {

      const mobile =
        normalizedUser.mobile_number || "";

      if (mobile) {

        localStorage.setItem(
          "admin_mobile",
          String(mobile)
        );

      }

    }


    // -------------------------------------------------
    // OPEN DASHBOARD
    // -------------------------------------------------

    setPage("dashboard");

  };


  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {

    localStorage.removeItem(
      "smart_procurement_user"
    );

    localStorage.removeItem(
      "user_role"
    );

    localStorage.removeItem(
      "admin_mobile"
    );


    setUser(null);

    setVerifiedMobile("");

    setSelectedCenter(null);

    setSelectedCrop("");

    setProcurementRequest(null);

    setPage("login");

  };


  // =====================================================
  // OTP VERIFIED
  // =====================================================

  const handleOTPVerified = (mobileNumber) => {

    setVerifiedMobile(
      mobileNumber
    );

    setPage(
      "register"
    );

  };


  // =====================================================
  // PROCUREMENT NAVIGATION FUNCTIONS
  // =====================================================

  const openProcurementPlanning = (crop = "") => {

    const finalCrop =
      crop ||
      selectedCrop ||
      user?.primary_crop ||
      "";

    setSelectedCrop(finalCrop);

    setPage(
      "procurement-planning"
    );

  };


  // =====================================================
  // OPEN TRANSPORT PAGE
  // =====================================================

  const openTransport = (
    center,
    crop = ""
  ) => {

    console.log(
      "Opening Transport Page"
    );

    console.log(
      "Selected Center:",
      center
    );

    setSelectedCenter(center);

    if (crop) {
      setSelectedCrop(crop);
    }

    setPage(
      "transport"
    );

  };


  // =====================================================
  // OPEN PROCUREMENT REQUEST PAGE
  // =====================================================

  const openProcurementRequest = () => {

    if (!selectedCenter) {

      console.error(
        "No procurement center selected"
      );

      return;
    }

    setPage(
      "procurement-request"
    );

  };


  // =====================================================
  // REQUEST SENT
  // =====================================================

  const handleRequestSent = (
    status,
    requestData
  ) => {

    const createdRequest =
      requestData ||
      (
        status &&
        typeof status === "object"
          ? status
          : {}
      );

    const createdStatus =
      typeof status === "string"
        ? status
        : createdRequest?.status;

    console.log(
      "Request sent:",
      createdRequest
    );

    setProcurementRequest({
      ...createdRequest,
      status:
        createdStatus ||
        "pending"
    });

    // Go back to dashboard after request

    setPage(
      "dashboard"
    );

  };


  // =====================================================
  // OTP PAGE
  // =====================================================

  if (
    !user &&
    page === "otp"
  ) {

    return (

      <OTPVerification

        goLogin={() => {

          setVerifiedMobile("");

          setPage("login");

        }}

        onVerified={
          handleOTPVerified
        }

      />

    );

  }


  // =====================================================
  // REGISTER PAGE
  // =====================================================

  if (
    !user &&
    page === "register"
  ) {

    return (

      <Register

        verifiedMobile={
          verifiedMobile
        }

        goLogin={() => {

          setVerifiedMobile("");

          setPage("login");

        }}

      />

    );

  }


  // =====================================================
  // LOGIN PAGE
  // =====================================================

  if (!user) {

    return (

      <Login

        onLogin={
          handleLogin
        }

        goRegister={() => {

          setVerifiedMobile("");

          setPage("otp");

        }}

      />

    );

  }


  // =====================================================
  // USER ROLE
  // =====================================================

  const role = String(
    user.role || ""
  )
    .trim()
    .toLowerCase();


  // =====================================================
  // PROCUREMENT PLANNING PAGE
  // =====================================================

  if (
    page === "procurement-planning"
  ) {

    return (

      <ProcurementPlanning

        user={user}

        selectedCrop={
          selectedCrop
        }

        goBack={() => {

          setPage(
            "dashboard"
          );

        }}

        goToTransport={(
          center
        ) => {

          openTransport(
            center,
            selectedCrop
          );

        }}

      />

    );

  }


  // =====================================================
  // TRANSPORT PAGE
  // =====================================================

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

        goBack={() => {

          setPage(
            "procurement-planning"
          );

        }}

        // IMPORTANT:
        // This opens ProcurementRequest page

        onOpenProcurementRequest={
          openProcurementRequest
        }

        onRequestSent={
          handleRequestSent
        }

      />

    );

  }


  // =====================================================
  // PROCUREMENT REQUEST PAGE
  // =====================================================

  if (
    page === "procurement-request"
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

        goBack={() => {

          setPage(
            "transport"
          );

        }}

        onRequestSent={
          handleRequestSent
        }

      />

    );

  }


  // =====================================================
  // FARMER DASHBOARD
  // =====================================================

  if (

    role === "farmer" ||
    role === "farmers"

  ) {

    return (

      <FarmerDashboard

        user={
          user
        }

        onLogout={
          handleLogout
        }

        // IMPORTANT:
        // Pass this function to dashboard

        goToProcurement={(
          crop
        ) => {

          openProcurementPlanning(
            crop
          );

        }}

        procurementRequest={
          procurementRequest
        }

      />

    );

  }


  // =====================================================
  // GOVERNMENT DASHBOARD
  // =====================================================

  if (

    role === "government" ||
    role === "government_user" ||
    role === "government user" ||
    role === "government_officer" ||
    role === "government officer" ||
    role === "government agency"

  ) {

    return (

      <GovernmentDashboard

        user={
          user
        }

        onLogout={
          handleLogout
        }

      />

    );

  }


  // =====================================================
  // ADMIN DASHBOARD
  // =====================================================

  if (

    role === "admin" ||
    role === "administrator"

  ) {

    return (

      <AdminDashboard

        user={
          user
        }

        onLogout={
          handleLogout
        }

      />

    );

  }


  // =====================================================
  // UNKNOWN ROLE
  // =====================================================

  return (

    <div

      style={{

        minHeight:
          "100vh",

        display:
          "flex",

        justifyContent:
          "center",

        alignItems:
          "center",

        padding:
          "20px",

        background:
          "linear-gradient(135deg, #edf4ef, #f5f7fa)",

        fontFamily:
          "Arial, sans-serif",

      }}

    >

      <div

        style={{

          width:
            "500px",

          maxWidth:
            "100%",

          background:
            "white",

          padding:
            "45px",

          borderRadius:
            "18px",

          boxShadow:
            "0 15px 40px rgba(0,0,0,0.12)",

          textAlign:
            "center",

          boxSizing:
            "border-box",

        }}

      >

        <div

          style={{

            fontSize:
              "55px",

            marginBottom:
              "15px",

          }}

        >

          ⚠️

        </div>


        <h2>

          Unknown User Role

        </h2>


        <p>

          Your account was successfully loaded,
          but the application could not identify
          your dashboard.

        </p>


        <p>

          Role received:

        </p>


        <div

          style={{

            background:
              "#fff0f0",

            color:
              "#c0392b",

            padding:
              "12px 20px",

            borderRadius:
              "8px",

            fontSize:
              "18px",

            fontWeight:
              "bold",

            margin:
              "10px 0 25px",

          }}

        >

          {
            user.role ||
            "No role received"
          }

        </div>


        <button

          onClick={
            handleLogout
          }

          style={{

            width:
              "100%",

            padding:
              "13px",

            border:
              "none",

            borderRadius:
              "8px",

            background:
              "#1f4d3a",

            color:
              "white",

            cursor:
              "pointer",

            fontSize:
              "16px",

            fontWeight:
              "bold",

          }}

        >

          Logout

        </button>

      </div>

    </div>

  );

}

export default App;
