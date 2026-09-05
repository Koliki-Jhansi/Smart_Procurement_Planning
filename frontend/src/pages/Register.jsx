
import React, { useMemo, useState } from "react";
import axios from "axios";

const API = "http://127.0.0.1:5000/api";

function Register({ goLogin, verifiedMobile }) {
  // =====================================================
  // ACCOUNT DETAILS
  // =====================================================

  const [role, setRole] = useState("farmer");

  const [fullName, setFullName] = useState("");

  const [mobileNumber, setMobileNumber] = useState(
    verifiedMobile || ""
  );

  const [password, setPassword] = useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  // =====================================================
  // FARMER DETAILS
  // =====================================================

  const [farmerId, setFarmerId] = useState("");

  const [village, setVillage] = useState("");

  const [mandal, setMandal] = useState("");

  const [district, setDistrict] = useState("");

  const [landArea, setLandArea] = useState("");

  const [primaryCrop, setPrimaryCrop] =
    useState("");

  // =====================================================
  // GOVERNMENT DETAILS
  // =====================================================

  const [department, setDepartment] =
    useState("");

  const [designation, setDesignation] =
    useState("");

  // =====================================================
  // UI STATES
  // =====================================================

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  // =====================================================
  // PASSWORD STRENGTH
  // =====================================================

  const passwordStrength = useMemo(() => {
    let score = 0;

    if (password.length >= 6) score += 1;

    if (/[A-Z]/.test(password)) score += 1;

    if (/[0-9]/.test(password)) score += 1;

    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 1) {
      return {
        label: "Weak",
        width: "25%",
        color: "#dc3545",
      };
    }

    if (score === 2) {
      return {
        label: "Fair",
        width: "50%",
        color: "#f0a202",
      };
    }

    if (score === 3) {
      return {
        label: "Good",
        width: "75%",
        color: "#2f80ed",
      };
    }

    return {
      label: "Strong",
      width: "100%",
      color: "#27ae60",
    };
  }, [password]);

  // =====================================================
  // HANDLE ROLE CHANGE
  // =====================================================

  const handleRoleChange = (selectedRole) => {
    setRole(selectedRole);

    setError("");

    setSuccess("");
  };

  // =====================================================
  // REGISTER
  // =====================================================

  const handleRegister = async (e) => {
    e.preventDefault();

    setError("");

    setSuccess("");

    // ===================================================
    // MOBILE VERIFICATION
    // ===================================================

    if (!verifiedMobile) {
      setError(
        "Please verify your mobile number using OTP before registration."
      );

      return;
    }

    // ===================================================
    // BASIC VALIDATION
    // ===================================================

    if (!fullName.trim()) {
      setError(
        role === "farmer"
          ? "Farmer name is required."
          : "Name is required."
      );

      return;
    }

    if (
      !mobileNumber ||
      mobileNumber.length !== 10
    ) {
      setError(
        "Please enter a valid 10 digit mobile number."
      );

      return;
    }

    if (!password) {
      setError(
        "Password is required."
      );

      return;
    }

    if (password.length < 6) {
      setError(
        "Password must contain at least 6 characters."
      );

      return;
    }

    if (password !== confirmPassword) {
      setError(
        "Password and confirm password do not match."
      );

      return;
    }

    // ===================================================
    // FARMER VALIDATION
    // ===================================================

    if (role === "farmer") {
      if (!village.trim()) {
        setError(
          "Village is required."
        );

        return;
      }

      if (!mandal.trim()) {
        setError(
          "Mandal is required."
        );

        return;
      }

      if (!district.trim()) {
        setError(
          "District is required."
        );

        return;
      }

      if (!landArea) {
        setError(
          "Cultivated land area is required."
        );

        return;
      }

      if (Number(landArea) <= 0) {
        setError(
          "Cultivated land area must be greater than 0."
        );

        return;
      }

      if (!primaryCrop) {
        setError(
          "Please select your primary crop."
        );

        return;
      }
    }

    // ===================================================
    // GOVERNMENT VALIDATION
    // ===================================================

    if (role === "government") {
      if (!department.trim()) {
        setError(
          "Department is required."
        );

        return;
      }

      if (!designation.trim()) {
        setError(
          "Designation is required."
        );

        return;
      }
    }

    setLoading(true);

    try {
      // =================================================
      // BASE PAYLOAD
      // =================================================

      const payload = {
        name: fullName.trim(),

        full_name: fullName.trim(),

        mobile_number: mobileNumber.trim(),

        password: password,

        role: role,
      };

      // =================================================
      // FARMER PAYLOAD
      // =================================================

      if (role === "farmer") {
        payload.farmer_id =
          farmerId.trim();

        payload.village =
          village.trim();

        payload.mandal =
          mandal.trim();

        payload.district =
          district.trim();

        // IMPORTANT:
        // This stores exactly the value entered by the user.
        payload.land_area =
          Number(landArea);

        payload.primary_crop =
          primaryCrop;
      }

      // =================================================
      // GOVERNMENT PAYLOAD
      // =================================================

      if (role === "government") {
        payload.department =
          department.trim();

        payload.designation =
          designation.trim();
      }

      console.log(
        "Registration payload:",
        payload
      );

      // =================================================
      // API REQUEST
      // =================================================

      const response =
        await axios.post(
          `${API}/auth/register`,
          payload,
          {
            headers: {
              "Content-Type":
                "application/json",
            },
          }
        );

      console.log(
        "Registration response:",
        response.data
      );

      if (!response.data.success) {
        setError(
          response.data.message ||
            "Registration failed."
        );

        return;
      }

      setSuccess(
        "Account created successfully! Redirecting you to login..."
      );

      setTimeout(() => {
        if (goLogin) {
          goLogin();
        }
      }, 1800);

    } catch (err) {
      console.error(
        "Registration error:",
        err
      );

      if (err.response) {
        setError(
          err.response.data?.message ||
            "Registration failed."
        );
      } else {
        setError(
          "Unable to connect to server. Please make sure Flask is running."
        );
      }

    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* =============================================
          LEFT INFORMATION PANEL
      ============================================== */}

      <div style={styles.leftPanel}>
        <div style={styles.brand}>
          <div style={styles.brandIcon}>
            🌾
          </div>

          <div>
            <h2 style={styles.brandTitle}>
              Smart Crop
            </h2>

            <p style={styles.brandSubtitle}>
              PROCUREMENT PLATFORM
            </p>
          </div>
        </div>

        <div style={styles.heroContent}>
          <div style={styles.badge}>
            CREATE YOUR ACCOUNT
          </div>

          <h1 style={styles.heroTitle}>
            Join the future of
            <br />
            smart agriculture.
          </h1>

          <p style={styles.heroDescription}>
            Register to predict crop production,
            discover procurement centers,
            calculate transportation costs,
            and manage procurement requests.
          </p>

          <div style={styles.featureList}>
            <Feature
              icon="📊"
              text="Crop production prediction"
            />

            <Feature
              icon="🏢"
              text="Smart procurement center selection"
            />

            <Feature
              icon="🚛"
              text="Transportation cost planning"
            />

            <Feature
              icon="📨"
              text="Track procurement requests"
            />
          </div>
        </div>

        <div style={styles.leftFooter}>
          Intelligent Crop Procurement &
          Decision Support System
        </div>
      </div>

      {/* =============================================
          REGISTRATION PANEL
      ============================================== */}

      <div style={styles.rightPanel}>
        <div style={styles.formContainer}>
          <div style={styles.formHeader}>
            <p style={styles.headerTag}>
              SMART PROCUREMENT SYSTEM
            </p>

            <h1 style={styles.title}>
              Create your account
            </h1>

            <p style={styles.subtitle}>
              Complete your profile to access the
              Smart Crop Procurement Platform.
            </p>
          </div>

          {/* ===========================================
              VERIFIED MOBILE
          ============================================ */}

          {verifiedMobile && (
            <div style={styles.verifiedBox}>
              <div style={styles.verifiedIcon}>
                ✓
              </div>

              <div>
                <strong>
                  Mobile number verified
                </strong>

                <p style={styles.verifiedText}>
                  {verifiedMobile}
                </p>
              </div>
            </div>
          )}

          {/* ===========================================
              ERROR
          ============================================ */}

          {error && (
            <div style={styles.error}>
              <span>⚠️</span>

              <span>
                {error}
              </span>
            </div>
          )}

          {/* ===========================================
              SUCCESS
          ============================================ */}

          {success && (
            <div style={styles.success}>
              <span>✓</span>

              <span>
                {success}
              </span>
            </div>
          )}

          <form onSubmit={handleRegister}>
            {/* =========================================
                ROLE SELECTION
            ========================================== */}

            <div style={styles.formSection}>
              <p style={styles.sectionLabel}>
                ACCOUNT TYPE
              </p>

              <div style={styles.roleGrid}>
                <button
                  type="button"
                  onClick={() =>
                    handleRoleChange("farmer")
                  }
                  style={{
                    ...styles.roleCard,

                    ...(role === "farmer"
                      ? styles.roleCardActive
                      : {}),
                  }}
                >
                  <div style={styles.roleIcon}>
                    👨‍🌾
                  </div>

                  <div>
                    <strong>
                      Farmer
                    </strong>

                    <p style={styles.roleDescription}>
                      Manage crops and procurement
                    </p>
                  </div>

                  {role === "farmer" && (
                    <span style={styles.selectedMark}>
                      ✓
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleRoleChange("government")
                  }
                  style={{
                    ...styles.roleCard,

                    ...(role === "government"
                      ? styles.roleCardActive
                      : {}),
                  }}
                >
                  <div style={styles.roleIcon}>
                    🏛️
                  </div>

                  <div>
                    <strong>
                      Government
                    </strong>

                    <p style={styles.roleDescription}>
                      Manage procurement operations
                    </p>
                  </div>

                  {role === "government" && (
                    <span style={styles.selectedMark}>
                      ✓
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* =========================================
                PERSONAL INFORMATION
            ========================================== */}

            <div style={styles.formSection}>
              <p style={styles.sectionLabel}>
                PERSONAL INFORMATION
              </p>

              <div style={styles.field}>
                <label style={styles.label}>
                  {role === "farmer"
                    ? "Farmer Name"
                    : "Officer / Agency Name"}
                </label>

                <input
                  type="text"
                  value={fullName}
                  onChange={(e) =>
                    setFullName(
                      e.target.value
                    )
                  }
                  placeholder="Enter your full name"
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>
                  Verified Mobile Number
                </label>

                <div style={styles.mobileWrapper}>
                  <span style={styles.countryCode}>
                    +91
                  </span>

                  <input
                    type="text"
                    value={mobileNumber}
                    readOnly={!!verifiedMobile}
                    onChange={(e) =>
                      setMobileNumber(
                        e.target.value.replace(
                          /\D/g,
                          ""
                        )
                      )
                    }
                    maxLength={10}
                    placeholder="Enter mobile number"
                    style={{
                      ...styles.mobileInput,

                      background:
                        verifiedMobile
                          ? "#f4faf6"
                          : "white",
                    }}
                  />

                  {verifiedMobile && (
                    <span style={styles.mobileVerified}>
                      ✓
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* =========================================
                FARMER DETAILS
            ========================================== */}

            {role === "farmer" && (
              <div style={styles.formSection}>
                <p style={styles.sectionLabel}>
                  FARM INFORMATION
                </p>

                <div style={styles.twoColumnGrid}>
                  <div style={styles.field}>
                    <label style={styles.label}>
                      Farmer ID
                      <span style={styles.optional}>
                        Optional
                      </span>
                    </label>

                    <input
                      type="text"
                      value={farmerId}
                      onChange={(e) =>
                        setFarmerId(
                          e.target.value
                        )
                      }
                      placeholder="Farmer ID"
                      style={styles.input}
                    />
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>
                      Primary Crop
                    </label>

                    <select
                      value={primaryCrop}
                      onChange={(e) =>
                        setPrimaryCrop(
                          e.target.value
                        )
                      }
                      style={styles.input}
                    >
                      <option value="">
                        Select crop
                      </option>

                      <option value="Paddy">
                        Paddy
                      </option>

                      <option value="Black Gram">
                        Black Gram
                      </option>

                      <option value="Cotton">
                        Cotton
                      </option>

                      <option value="Green Gram">
                        Green Gram
                      </option>

                      <option value="Groundnut">
                        Groundnut
                      </option>

                      <option value="Maize">
                        Maize
                      </option>

                      <option value="Red Gram">
                        Red Gram
                      </option>

                      <option value="Sunflower">
                        Sunflower
                      </option>
                    </select>
                  </div>
                </div>

                <div style={styles.threeColumnGrid}>
                  <div style={styles.field}>
                    <label style={styles.label}>
                      Village
                    </label>

                    <input
                      type="text"
                      value={village}
                      onChange={(e) =>
                        setVillage(
                          e.target.value
                        )
                      }
                      placeholder="Village"
                      style={styles.input}
                    />
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>
                      Mandal
                    </label>

                    <input
                      type="text"
                      value={mandal}
                      onChange={(e) =>
                        setMandal(
                          e.target.value
                        )
                      }
                      placeholder="Mandal"
                      style={styles.input}
                    />
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>
                      District
                    </label>

                    <input
                      type="text"
                      value={district}
                      onChange={(e) =>
                        setDistrict(
                          e.target.value
                        )
                      }
                      placeholder="District"
                      style={styles.input}
                    />
                  </div>
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>
                    Cultivated Land Area
                  </label>

                  <div style={styles.unitInputWrapper}>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={landArea}
                      onChange={(e) =>
                        setLandArea(
                          e.target.value
                        )
                      }
                      placeholder="Enter cultivated area"
                      style={styles.unitInput}
                    />

                    <span style={styles.unit}>
                      Acres
                    </span>
                  </div>

                  <p style={styles.helperText}>
                    Enter the exact cultivated land area.
                    For example: 100 remains 100 acres.
                  </p>
                </div>
              </div>
            )}

            {/* =========================================
                GOVERNMENT DETAILS
            ========================================== */}

            {role === "government" && (
              <div style={styles.formSection}>
                <p style={styles.sectionLabel}>
                  GOVERNMENT INFORMATION
                </p>

                <div style={styles.twoColumnGrid}>
                  <div style={styles.field}>
                    <label style={styles.label}>
                      Department
                    </label>

                    <input
                      type="text"
                      value={department}
                      onChange={(e) =>
                        setDepartment(
                          e.target.value
                        )
                      }
                      placeholder="Agriculture Department"
                      style={styles.input}
                    />
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>
                      Designation
                    </label>

                    <input
                      type="text"
                      value={designation}
                      onChange={(e) =>
                        setDesignation(
                          e.target.value
                        )
                      }
                      placeholder="Enter designation"
                      style={styles.input}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* =========================================
                SECURITY
            ========================================== */}

            <div style={styles.formSection}>
              <p style={styles.sectionLabel}>
                ACCOUNT SECURITY
              </p>

              <div style={styles.twoColumnGrid}>
                <div style={styles.field}>
                  <label style={styles.label}>
                    Password
                  </label>

                  <div style={styles.passwordWrapper}>
                    <input
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      value={password}
                      onChange={(e) =>
                        setPassword(
                          e.target.value
                        )
                      }
                      placeholder="Minimum 6 characters"
                      style={styles.passwordInput}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          !showPassword
                        )
                      }
                      style={styles.eyeButton}
                    >
                      {showPassword
                        ? "Hide"
                        : "Show"}
                    </button>
                  </div>

                  {password && (
                    <div style={styles.strengthContainer}>
                      <div style={styles.strengthTrack}>
                        <div
                          style={{
                            ...styles.strengthBar,

                            width:
                              passwordStrength.width,

                            background:
                              passwordStrength.color,
                          }}
                        />
                      </div>

                      <span
                        style={{
                          ...styles.strengthLabel,

                          color:
                            passwordStrength.color,
                        }}
                      >
                        {passwordStrength.label}
                      </span>
                    </div>
                  )}
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>
                    Confirm Password
                  </label>

                  <div style={styles.passwordWrapper}>
                    <input
                      type={
                        showConfirmPassword
                          ? "text"
                          : "password"
                      }
                      value={confirmPassword}
                      onChange={(e) =>
                        setConfirmPassword(
                          e.target.value
                        )
                      }
                      placeholder="Re-enter password"
                      style={styles.passwordInput}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(
                          !showConfirmPassword
                        )
                      }
                      style={styles.eyeButton}
                    >
                      {showConfirmPassword
                        ? "Hide"
                        : "Show"}
                    </button>
                  </div>

                  {confirmPassword && (
                    <p
                      style={{
                        ...styles.passwordMatch,

                        color:
                          password === confirmPassword
                            ? "#27814c"
                            : "#c43b3b",
                      }}
                    >
                      {password === confirmPassword
                        ? "✓ Passwords match"
                        : "✕ Passwords do not match"}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* =========================================
                SUBMIT
            ========================================== */}

            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.submitButton,

                opacity:
                  loading ? 0.75 : 1,

                cursor:
                  loading
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {loading
                ? "Creating your account..."
                : "Create Account →"}
            </button>
          </form>

          <div style={styles.loginSection}>
            <span>
              Already have an account?
            </span>

            <button
              type="button"
              onClick={goLogin}
              style={styles.loginButton}
            >
              Login here
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


// =====================================================
// FEATURE COMPONENT
// =====================================================

function Feature({ icon, text }) {
  return (
    <div style={styles.feature}>
      <div style={styles.featureIcon}>
        {icon}
      </div>

      <span>
        {text}
      </span>
    </div>
  );
}


// =====================================================
// STYLES
// =====================================================

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    background: "#f5f7f6",
    fontFamily:
      "Arial, Helvetica, sans-serif",
  },

  // ===================================================
  // LEFT PANEL
  // ===================================================

  leftPanel: {
    width: "40%",
    minWidth: "380px",
    background:
      "linear-gradient(145deg, #0f3427, #1f6247)",
    color: "white",
    padding: "45px 55px",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
  },

  brand: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  brandIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "14px",
    background:
      "rgba(255,255,255,0.14)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "25px",
  },

  brandTitle: {
    margin: 0,
    fontSize: "22px",
  },

  brandSubtitle: {
    margin: "3px 0 0",
    fontSize: "10px",
    letterSpacing: "1.5px",
    opacity: 0.7,
  },

  heroContent: {
    marginTop: "auto",
    marginBottom: "auto",
    padding: "80px 0",
  },

  badge: {
    display: "inline-block",
    padding: "8px 13px",
    borderRadius: "20px",
    background:
      "rgba(255,255,255,0.12)",
    fontSize: "10px",
    letterSpacing: "1.2px",
    marginBottom: "25px",
  },

  heroTitle: {
    fontSize: "42px",
    lineHeight: "1.18",
    margin: "0 0 20px",
  },

  heroDescription: {
    fontSize: "16px",
    lineHeight: "1.8",
    opacity: 0.8,
    maxWidth: "520px",
  },

  featureList: {
    marginTop: "40px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },

  feature: {
    display: "flex",
    alignItems: "center",
    gap: "13px",
    fontSize: "14px",
  },

  featureIcon: {
    width: "38px",
    height: "38px",
    borderRadius: "10px",
    background:
      "rgba(255,255,255,0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  leftFooter: {
    fontSize: "11px",
    opacity: 0.55,
  },

  // ===================================================
  // RIGHT PANEL
  // ===================================================

  rightPanel: {
    flex: 1,
    background: "#f7f9f8",
    padding: "45px",
    boxSizing: "border-box",
    overflowY: "auto",
  },

  formContainer: {
    width: "100%",
    maxWidth: "850px",
    margin: "0 auto",
    background: "white",
    borderRadius: "22px",
    padding: "42px",
    boxSizing: "border-box",
    boxShadow:
      "0 12px 45px rgba(24, 55, 40, 0.08)",
    border: "1px solid #edf1ee",
  },

  formHeader: {
    marginBottom: "28px",
  },

  headerTag: {
    margin: "0 0 9px",
    fontSize: "10px",
    color: "#4d9670",
    letterSpacing: "1.2px",
    fontWeight: "bold",
  },

  title: {
    margin: "0 0 10px",
    color: "#193f30",
    fontSize: "30px",
  },

  subtitle: {
    margin: 0,
    color: "#758078",
    lineHeight: "1.6",
  },

  // ===================================================
  // MOBILE VERIFIED
  // ===================================================

  verifiedBox: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "15px",
    borderRadius: "12px",
    background: "#eff9f2",
    border: "1px solid #cdebd5",
    color: "#276b40",
    marginBottom: "25px",
  },

  verifiedIcon: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "#2f9b58",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
  },

  verifiedText: {
    margin: "3px 0 0",
    fontSize: "13px",
    color: "#5d7665",
  },

  // ===================================================
  // ALERTS
  // ===================================================

  error: {
    display: "flex",
    gap: "10px",
    padding: "14px",
    borderRadius: "10px",
    background: "#fff0f0",
    border: "1px solid #f4cccc",
    color: "#b83c3c",
    marginBottom: "20px",
    fontSize: "14px",
  },

  success: {
    display: "flex",
    gap: "10px",
    padding: "14px",
    borderRadius: "10px",
    background: "#eef9f1",
    border: "1px solid #cdebd5",
    color: "#267343",
    marginBottom: "20px",
    fontSize: "14px",
  },

  // ===================================================
  // FORM
  // ===================================================

  formSection: {
    paddingTop: "22px",
    marginTop: "22px",
    borderTop: "1px solid #edf0ee",
  },

  sectionLabel: {
    margin: "0 0 17px",
    fontSize: "10px",
    fontWeight: "bold",
    letterSpacing: "1.2px",
    color: "#5f8e70",
  },

  roleGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "15px",
  },

  roleCard: {
    position: "relative",
    padding: "18px",
    display: "flex",
    alignItems: "center",
    gap: "13px",
    background: "white",
    border: "1px solid #dfe7e2",
    borderRadius: "13px",
    cursor: "pointer",
    textAlign: "left",
    color: "#294638",
  },

  roleCardActive: {
    border: "2px solid #3b8c63",
    background: "#f2faf5",
  },

  roleIcon: {
    width: "46px",
    height: "46px",
    borderRadius: "12px",
    background: "#eaf5ee",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "23px",
  },

  roleDescription: {
    margin: "4px 0 0",
    fontSize: "11px",
    color: "#7a847e",
  },

  selectedMark: {
    position: "absolute",
    right: "13px",
    top: "13px",
    width: "21px",
    height: "21px",
    borderRadius: "50%",
    background: "#3b8c63",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: "bold",
  },

  field: {
    marginBottom: "16px",
  },

  label: {
    display: "block",
    marginBottom: "7px",
    fontSize: "13px",
    fontWeight: "bold",
    color: "#374b40",
  },

  optional: {
    marginLeft: "7px",
    color: "#9aa49e",
    fontSize: "10px",
    fontWeight: "normal",
  },

  input: {
    width: "100%",
    padding: "12px 13px",
    border: "1px solid #dbe2de",
    borderRadius: "9px",
    boxSizing: "border-box",
    fontSize: "14px",
    outline: "none",
    color: "#273b31",
  },

  twoColumnGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "16px",
  },

  threeColumnGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",
    gap: "14px",
  },

  // ===================================================
  // MOBILE
  // ===================================================

  mobileWrapper: {
    display: "flex",
    alignItems: "center",
    border: "1px solid #dbe2de",
    borderRadius: "9px",
    overflow: "hidden",
  },

  countryCode: {
    padding: "12px 13px",
    background: "#f4f7f5",
    borderRight: "1px solid #dbe2de",
    color: "#516058",
    fontSize: "14px",
  },

  mobileInput: {
    flex: 1,
    border: "none",
    outline: "none",
    padding: "12px",
    fontSize: "14px",
  },

  mobileVerified: {
    paddingRight: "13px",
    color: "#329257",
    fontWeight: "bold",
  },

  // ===================================================
  // LAND AREA
  // ===================================================

  unitInputWrapper: {
    display: "flex",
    alignItems: "center",
    border: "1px solid #dbe2de",
    borderRadius: "9px",
    overflow: "hidden",
  },

  unitInput: {
    flex: 1,
    border: "none",
    outline: "none",
    padding: "12px 13px",
    fontSize: "14px",
  },

  unit: {
    padding: "12px 15px",
    background: "#f4f7f5",
    borderLeft: "1px solid #dbe2de",
    color: "#5e6e65",
    fontSize: "13px",
  },

  helperText: {
    margin: "7px 0 0",
    fontSize: "11px",
    color: "#88938d",
  },

  // ===================================================
  // PASSWORD
  // ===================================================

  passwordWrapper: {
    position: "relative",
  },

  passwordInput: {
    width: "100%",
    padding: "12px 55px 12px 13px",
    border: "1px solid #dbe2de",
    borderRadius: "9px",
    boxSizing: "border-box",
    fontSize: "14px",
    outline: "none",
  },

  eyeButton: {
    position: "absolute",
    right: "8px",
    top: "50%",
    transform: "translateY(-50%)",
    border: "none",
    background: "transparent",
    color: "#3b7d5b",
    cursor: "pointer",
    fontSize: "11px",
    fontWeight: "bold",
  },

  strengthContainer: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginTop: "8px",
  },

  strengthTrack: {
    flex: 1,
    height: "5px",
    borderRadius: "5px",
    background: "#edf0ee",
    overflow: "hidden",
  },

  strengthBar: {
    height: "100%",
    borderRadius: "5px",
    transition: "0.3s",
  },

  strengthLabel: {
    fontSize: "10px",
    fontWeight: "bold",
  },

  passwordMatch: {
    margin: "7px 0 0",
    fontSize: "11px",
  },

  // ===================================================
  // SUBMIT
  // ===================================================

  submitButton: {
    width: "100%",
    marginTop: "30px",
    padding: "14px",
    border: "none",
    borderRadius: "10px",
    background:
      "linear-gradient(135deg, #1b5a41, #2f805b)",
    color: "white",
    fontSize: "15px",
    fontWeight: "bold",
    boxShadow:
      "0 8px 18px rgba(32, 101, 71, 0.2)",
  },

  loginSection: {
    marginTop: "22px",
    textAlign: "center",
    color: "#748078",
    fontSize: "13px",
  },

  loginButton: {
    border: "none",
    background: "transparent",
    color: "#2a7b55",
    fontWeight: "bold",
    cursor: "pointer",
    marginLeft: "6px",
    padding: 0,
  },
};


export default Register;

