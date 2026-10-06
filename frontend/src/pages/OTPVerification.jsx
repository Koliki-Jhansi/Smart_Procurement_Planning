
import React, { useState } from "react";
import axios from "axios";
import API_BASE_URL from "../apiConfig";

function OTPVerification({ goLogin, onVerified }) {
  const [mobileNumber, setMobileNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [devOtp, setDevOtp] = useState("");

  // ==========================================
  // SEND OTP
  // ==========================================

  const sendOTP = async () => {
    setError("");
    setSuccess("");

    if (!mobileNumber || mobileNumber.length !== 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/otp/send`, {
        mobile_number: mobileNumber,
      });

      if (!response.data.success) {
        setError(response.data.message || "Unable to send OTP.");
        return;
      }

      setOtpSent(true);

      if (response.data.dev_otp) {
        setDevOtp(response.data.dev_otp);

        setSuccess(
          "Verification code generated successfully. Enter the OTP below."
        );
      } else {
        setSuccess(
          response.data.message || "OTP sent successfully."
        );
      }

    } catch (err) {
      console.error("Send OTP error:", err);

      if (err.response) {
        setError(
          err.response.data?.message || "Unable to send OTP."
        );
      } else {
        setError(
          "Unable to connect to the verification service. Please check your connection or try again later."
        );
      }

    } finally {
      setLoading(false);
    }
  };


  // ==========================================
  // VERIFY OTP
  // ==========================================

  const verifyOTP = async () => {
    setError("");
    setSuccess("");

    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/otp/verify`, {
        mobile_number: mobileNumber,
        otp: otp,
      });

      if (!response.data.success) {
        setError(
          response.data.message || "OTP verification failed."
        );
        return;
      }

      setSuccess(
        "Mobile number verified successfully. Redirecting..."
      );

      setTimeout(() => {
        onVerified(mobileNumber);
      }, 1000);

    } catch (err) {
      console.error("Verify OTP error:", err);

      if (err.response) {
        setError(
          err.response.data?.message ||
          "OTP verification failed."
        );
      } else {
        setError(
          "Unable to connect to the verification service. Please check your connection or try again later."
        );
      }

    } finally {
      setLoading(false);
    }
  };


  // ==========================================
  // CHANGE MOBILE NUMBER
  // ==========================================

  const changeMobile = () => {
    setOtpSent(false);
    setOtp("");
    setDevOtp("");
    setSuccess("");
    setError("");
  };


  return (
    <div style={styles.page}>

      {/* ======================================
          LEFT BRAND SECTION
      ====================================== */}

      <div style={styles.leftPanel}>

        <div style={styles.brand}>

          <div style={styles.logo}>
            🌾
          </div>

          <div>
            <h2 style={styles.brandTitle}>
              Smart Crop
            </h2>

            <p style={styles.brandSubtitle}>
              PROCUREMENT SYSTEM
            </p>
          </div>

        </div>


        <div style={styles.heroContent}>

          <div style={styles.stepBadge}>
            STEP 1 OF 2
          </div>

          <h1 style={styles.heroTitle}>
            Verify Your
            <br />
            Mobile Number
          </h1>

          <p style={styles.heroDescription}>
            Secure your account before registration.
            Mobile verification helps us protect your
            procurement information and requests.
          </p>


          <div style={styles.featureList}>

            <Feature
              icon="🔐"
              title="Secure Verification"
              text="Your mobile number is verified before registration."
            />

            <Feature
              icon="⚡"
              title="Quick Registration"
              text="Complete verification and continue to your profile."
            />

            <Feature
              icon="🌱"
              title="Farmer Focused"
              text="Designed specifically for smart crop procurement."
            />

          </div>

        </div>


        <div style={styles.leftFooter}>
          © 2026 Smart Crop Procurement System
        </div>

      </div>


      {/* ======================================
          RIGHT VERIFICATION SECTION
      ====================================== */}

      <div style={styles.rightPanel}>

        <div style={styles.formWrapper}>


          <div style={styles.mobileHeader}>

            <div style={styles.mobileIcon}>
              📱
            </div>

            <div>

              <p style={styles.formEyebrow}>
                ACCOUNT VERIFICATION
              </p>

              <h1 style={styles.formTitle}>
                {otpSent
                  ? "Enter verification code"
                  : "Verify your mobile number"}
              </h1>

              <p style={styles.formSubtitle}>
                {otpSent
                  ? `A 6-digit verification code has been generated for ${mobileNumber}.`
                  : "Enter your mobile number to receive a verification code."}
              </p>

            </div>

          </div>


          {/* ERROR */}

          {error && (
            <div style={styles.error}>
              <span style={styles.messageIcon}>
                ⚠️
              </span>

              <span>
                {error}
              </span>
            </div>
          )}


          {/* SUCCESS */}

          {success && (
            <div style={styles.success}>
              <span style={styles.messageIcon}>
                ✓
              </span>

              <span>
                {success}
              </span>
            </div>
          )}


          {/* ======================================
              DEVELOPMENT OTP
          ====================================== */}

          {devOtp && (
            <div style={styles.devOtp}>

              <div style={styles.devHeader}>

                <span>
                  🛠️ Development Mode
                </span>

                <small>
                  Test OTP
                </small>

              </div>


              <div style={styles.otpNumber}>
                {devOtp}
              </div>


              <p style={styles.devText}>
                This OTP is displayed because the application
                is currently running in development mode.
              </p>

            </div>
          )}


          {/* ======================================
              MOBILE NUMBER FORM
          ====================================== */}

          {!otpSent && (
            <>

              <label style={styles.label}>
                Mobile Number
              </label>


              <div style={styles.phoneInputWrapper}>

                <div style={styles.countryCode}>
                  🇮🇳 +91
                </div>


                <input
                  type="text"
                  value={mobileNumber}
                  onChange={(e) =>
                    setMobileNumber(
                      e.target.value.replace(/\D/g, "")
                    )
                  }
                  maxLength={10}
                  placeholder="Enter 10-digit mobile number"
                  style={styles.phoneInput}
                />

              </div>


              <p style={styles.helperText}>
                We'll use this number for account verification.
              </p>


              <button
                type="button"
                onClick={sendOTP}
                disabled={loading}
                style={{
                  ...styles.primaryButton,
                  opacity: loading ? 0.7 : 1,
                  cursor: loading
                    ? "not-allowed"
                    : "pointer",
                }}
              >
                {loading
                  ? "Generating verification code..."
                  : "Send Verification Code →"}
              </button>

            </>
          )}


          {/* ======================================
              OTP FORM
          ====================================== */}

          {otpSent && (
            <>

              <label style={styles.label}>
                Verification Code
              </label>


              <input
                type="text"
                value={otp}
                onChange={(e) =>
                  setOtp(
                    e.target.value.replace(/\D/g, "")
                  )
                }
                maxLength={6}
                placeholder="• • • • • •"
                style={styles.otpInput}
              />


              <p style={styles.helperText}>
                Enter the 6-digit verification code.
              </p>


              <button
                type="button"
                onClick={verifyOTP}
                disabled={loading}
                style={{
                  ...styles.primaryButton,
                  opacity: loading ? 0.7 : 1,
                  cursor: loading
                    ? "not-allowed"
                    : "pointer",
                }}
              >
                {loading
                  ? "Verifying mobile number..."
                  : "Verify & Continue →"}
              </button>


              <button
                type="button"
                onClick={changeMobile}
                style={styles.secondaryButton}
              >
                ← Change Mobile Number
              </button>

            </>
          )}


          {/* ======================================
              LOGIN
          ====================================== */}

          <div style={styles.loginSection}>

            <span>
              Already have an account?
            </span>

            <button
              type="button"
              onClick={goLogin}
              style={styles.loginButton}
            >
              Login
            </button>

          </div>


          <p style={styles.securityText}>
            🔒 Your information is securely protected.
          </p>

        </div>

      </div>

    </div>
  );
}


// ==========================================
// FEATURE COMPONENT
// ==========================================

function Feature({ icon, title, text }) {
  return (
    <div style={styles.feature}>

      <div style={styles.featureIcon}>
        {icon}
      </div>

      <div>

        <h3 style={styles.featureTitle}>
          {title}
        </h3>

        <p style={styles.featureText}>
          {text}
        </p>

      </div>

    </div>
  );
}


// ==========================================
// STYLES
// ==========================================

const styles = {

  page: {
    minHeight: "100vh",
    display: "flex",
    fontFamily:
      "'Segoe UI', Arial, sans-serif",
    background: "#f7faf8",
  },


  // ========================================
  // LEFT PANEL
  // ========================================

  leftPanel: {
    width: "48%",
    minHeight: "100vh",
    background:
      "linear-gradient(135deg, #123f30 0%, #1f6b4f 55%, #2d8a61 100%)",
    color: "white",
    padding: "45px 7%",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    position: "relative",
    overflow: "hidden",
  },


  brand: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },


  logo: {
    width: "52px",
    height: "52px",
    borderRadius: "15px",
    background:
      "rgba(255,255,255,0.14)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "27px",
    border:
      "1px solid rgba(255,255,255,0.2)",
  },


  brandTitle: {
    margin: 0,
    fontSize: "22px",
  },


  brandSubtitle: {
    margin: "4px 0 0",
    fontSize: "10px",
    letterSpacing: "2px",
    opacity: 0.7,
  },


  heroContent: {
    marginTop: "auto",
    marginBottom: "auto",
    paddingTop: "70px",
    paddingBottom: "70px",
    maxWidth: "580px",
  },


  stepBadge: {
    display: "inline-block",
    padding: "8px 14px",
    borderRadius: "30px",
    background:
      "rgba(255,255,255,0.13)",
    border:
      "1px solid rgba(255,255,255,0.18)",
    fontSize: "11px",
    letterSpacing: "1px",
    fontWeight: "bold",
    marginBottom: "25px",
  },


  heroTitle: {
    fontSize: "48px",
    lineHeight: 1.12,
    margin: "0 0 22px",
    letterSpacing: "-1px",
  },


  heroDescription: {
    fontSize: "16px",
    lineHeight: 1.8,
    opacity: 0.82,
    maxWidth: "500px",
    marginBottom: "45px",
  },


  featureList: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },


  feature: {
    display: "flex",
    alignItems: "flex-start",
    gap: "15px",
  },


  featureIcon: {
    width: "42px",
    height: "42px",
    minWidth: "42px",
    borderRadius: "12px",
    background:
      "rgba(255,255,255,0.13)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "19px",
  },


  featureTitle: {
    margin: "2px 0 6px",
    fontSize: "15px",
  },


  featureText: {
    margin: 0,
    fontSize: "13px",
    opacity: 0.7,
    lineHeight: 1.5,
  },


  leftFooter: {
    fontSize: "12px",
    opacity: 0.55,
  },


  // ========================================
  // RIGHT PANEL
  // ========================================

  rightPanel: {
    flex: 1,
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px",
    boxSizing: "border-box",
    background: "#ffffff",
  },


  formWrapper: {
    width: "100%",
    maxWidth: "470px",
  },


  mobileHeader: {
    display: "flex",
    alignItems: "flex-start",
    gap: "16px",
    marginBottom: "35px",
  },


  mobileIcon: {
    width: "55px",
    height: "55px",
    minWidth: "55px",
    borderRadius: "16px",
    background: "#edf8f1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "25px",
  },


  formEyebrow: {
    margin: "3px 0 7px",
    color: "#398263",
    fontSize: "11px",
    letterSpacing: "1.4px",
    fontWeight: "bold",
  },


  formTitle: {
    margin: 0,
    color: "#183d2f",
    fontSize: "27px",
  },


  formSubtitle: {
    margin: "9px 0 0",
    color: "#77827d",
    fontSize: "14px",
    lineHeight: 1.6,
  },


  // ========================================
  // MESSAGES
  // ========================================

  error: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "#fff0f0",
    color: "#b83a3a",
    border: "1px solid #ffd5d5",
    padding: "13px 15px",
    borderRadius: "10px",
    marginBottom: "20px",
    fontSize: "13px",
  },


  success: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "#edf9f1",
    color: "#277a4d",
    border: "1px solid #cfeeda",
    padding: "13px 15px",
    borderRadius: "10px",
    marginBottom: "20px",
    fontSize: "13px",
  },


  messageIcon: {
    fontWeight: "bold",
  },


  // ========================================
  // DEVELOPMENT OTP
  // ========================================

  devOtp: {
    background: "#fff9e9",
    border: "1px solid #f1db98",
    borderRadius: "12px",
    padding: "17px",
    marginBottom: "25px",
  },


  devHeader: {
    display: "flex",
    justifyContent: "space-between",
    color: "#85620d",
    fontSize: "12px",
    fontWeight: "bold",
  },


  otpNumber: {
    fontSize: "32px",
    fontWeight: "bold",
    letterSpacing: "8px",
    color: "#1e513b",
    textAlign: "center",
    margin: "14px 0",
  },


  devText: {
    margin: 0,
    color: "#806f42",
    fontSize: "11px",
    textAlign: "center",
    lineHeight: 1.5,
  },


  // ========================================
  // FORM
  // ========================================

  label: {
    display: "block",
    color: "#32483e",
    fontWeight: "600",
    fontSize: "14px",
    marginBottom: "9px",
  },


  phoneInputWrapper: {
    display: "flex",
    width: "100%",
  },


  countryCode: {
    padding: "14px 12px",
    background: "#f2f6f3",
    border:
      "1px solid #dfe7e2",
    borderRight: "none",
    borderRadius:
      "10px 0 0 10px",
    color: "#486056",
    fontSize: "14px",
    whiteSpace: "nowrap",
  },


  phoneInput: {
    flex: 1,
    minWidth: 0,
    padding: "14px",
    border:
      "1px solid #dfe7e2",
    borderRadius:
      "0 10px 10px 0",
    outline: "none",
    fontSize: "15px",
    boxSizing: "border-box",
  },


  otpInput: {
    width: "100%",
    padding: "15px",
    border:
      "1px solid #dfe7e2",
    borderRadius: "10px",
    outline: "none",
    fontSize: "23px",
    textAlign: "center",
    letterSpacing: "7px",
    boxSizing: "border-box",
    fontWeight: "600",
  },


  helperText: {
    margin: "8px 0 22px",
    fontSize: "12px",
    color: "#8a9690",
  },


  primaryButton: {
    width: "100%",
    padding: "15px",
    border: "none",
    borderRadius: "10px",
    background:
      "linear-gradient(135deg, #1c6147, #2d8b63)",
    color: "white",
    fontSize: "15px",
    fontWeight: "600",
    boxShadow:
      "0 8px 18px rgba(31,107,79,0.18)",
  },


  secondaryButton: {
    width: "100%",
    marginTop: "13px",
    padding: "13px",
    border:
      "1px solid #d8e2dc",
    borderRadius: "10px",
    background: "white",
    color: "#316a4e",
    fontSize: "14px",
    cursor: "pointer",
  },


  // ========================================
  // LOGIN SECTION
  // ========================================

  loginSection: {
    marginTop: "28px",
    paddingTop: "22px",
    borderTop:
      "1px solid #edf0ee",
    textAlign: "center",
    color: "#7b8580",
    fontSize: "13px",
  },


  loginButton: {
    border: "none",
    background: "transparent",
    color: "#26734f",
    fontWeight: "bold",
    cursor: "pointer",
    marginLeft: "6px",
    fontSize: "13px",
  },


  securityText: {
    textAlign: "center",
    color: "#9aa39e",
    fontSize: "11px",
    marginTop: "22px",
  },

};


export default OTPVerification;

