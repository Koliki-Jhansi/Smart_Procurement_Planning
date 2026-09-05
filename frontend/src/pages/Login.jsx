import React, { useState } from "react";
import axios from "axios";

const API = "http://127.0.0.1:5000/api";

function Login({ onLogin, goRegister }) {
const [mobile, setMobile] = useState("");
const [password, setPassword] = useState("");
const [showPassword, setShowPassword] = useState(false);
const [loading, setLoading] = useState(false);
const [error, setError] = useState("");

const handleSubmit = async (e) => {
e.preventDefault();

setError("");

if (!mobile || !password) {
  setError("Please enter your mobile number and password.");
  return;
}

if (mobile.length !== 10) {
  setError("Please enter a valid 10-digit mobile number.");
  return;
}

setLoading(true);

try {
  const response = await axios.post(
    `${API}/auth/login`,
    {
      mobile_number: mobile.trim(),
      password: password,
    }
  );

  console.log("Login response:", response.data);

  const user = response.data.user;

  if (!user) {
    setError(
      "Login was successful, but user information was not returned."
    );
    return;
  }

  localStorage.setItem(
    "smart_procurement_user",
    JSON.stringify(user)
  );

  onLogin(user);

} catch (err) {
  console.error("Login error:", err);

  if (err.response) {
    setError(
      err.response.data?.message ||
      "Invalid mobile number or password."
    );
  } else {
    setError(
      "Unable to connect to server. Please make sure the backend is running."
    );
  }

} finally {
  setLoading(false);
}

};

return (
<div style={styles.page}>

  {/* LEFT SIDE */}

  <div style={styles.leftSection}>

    <div style={styles.brand}>

      <div style={styles.logo}>
        🌾
      </div>

      <div>
        <h2 style={styles.brandTitle}>
          Smart Crop
        </h2>

        <p style={styles.brandSubtitle}>
          Procurement Planning System
        </p>
      </div>

    </div>


    <div style={styles.heroContent}>

      <div style={styles.badge}>
        DIGITAL AGRICULTURE PLATFORM
      </div>

      <h1 style={styles.heroTitle}>
        Smart decisions for
        <br />

        <span style={styles.heroHighlight}>
          smarter farming.
        </span>
      </h1>

      <p style={styles.heroDescription}>
        Predict crop production, discover procurement
        centers, calculate transportation costs and manage
        procurement requests from one intelligent platform.
      </p>


      <div style={styles.featureList}>

        <Feature
          icon="📊"
          title="Crop Prediction"
          text="Estimate crop production using farm information"
        />

        <Feature
          icon="🏢"
          title="Smart Procurement"
          text="Find suitable procurement centers near your location"
        />

        <Feature
          icon="🚛"
          title="Transport Planning"
          text="Calculate transportation cost before sending requests"
        />

      </div>

    </div>


    <div style={styles.footerText}>
      © 2026 Smart Crop Procurement System
    </div>

  </div>


  {/* RIGHT SIDE LOGIN */}

  <div style={styles.rightSection}>

    <div style={styles.loginContainer}>

      <div style={styles.mobileBrand}>
        🌾 Smart Crop
      </div>


      <div style={styles.loginHeader}>

        <p style={styles.welcome}>
          WELCOME BACK
        </p>

        <h1 style={styles.loginTitle}>
          Sign in to your account
        </h1>

        <p style={styles.loginSubtitle}>
          Enter your credentials to access your dashboard.
        </p>

      </div>


      {error && (

        <div style={styles.errorBox}>

          <span style={styles.errorIcon}>
            ⚠
          </span>

          <span>
            {error}
          </span>

        </div>

      )}


      <form onSubmit={handleSubmit}>

        <label style={styles.label}>
          Mobile Number
        </label>


        <div style={styles.inputWrapper}>

          <span style={styles.inputIcon}>
            📱
          </span>

          <input
            type="text"
            value={mobile}
            onChange={(e) =>
              setMobile(
                e.target.value.replace(/\D/g, "")
              )
            }
            placeholder="Enter 10-digit mobile number"
            maxLength={10}
            style={styles.input}
          />

        </div>


        <label
          style={{
            ...styles.label,
            marginTop: "22px",
          }}
        >
          Password
        </label>


        <div style={styles.inputWrapper}>

          <span style={styles.inputIcon}>
            🔒
          </span>

          <input
            type={
              showPassword
                ? "text"
                : "password"
            }
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            placeholder="Enter your password"
            style={{
              ...styles.input,
              paddingRight: "60px",
            }}
          />


          <button
            type="button"
            onClick={() =>
              setShowPassword(!showPassword)
            }
            style={styles.showPasswordButton}
          >
            {showPassword
              ? "Hide"
              : "Show"}
          </button>

        </div>


        <button
          type="submit"
          disabled={loading}
          style={{
            ...styles.loginButton,
            opacity: loading ? 0.7 : 1,
            cursor: loading
              ? "not-allowed"
              : "pointer",
          }}
        >

          {loading ? (
            <>
              <span style={styles.spinner}>
                ⏳
              </span>

              Logging in...
            </>
          ) : (
            <>
              Sign In
              <span>
                →
              </span>
            </>
          )}

        </button>

      </form>


      <div style={styles.divider}>

        <div style={styles.dividerLine} />

        <span>
          New to the platform?
        </span>

        <div style={styles.dividerLine} />

      </div>


      <button
        type="button"
        onClick={goRegister}
        style={styles.registerButton}
      >
        <span style={styles.registerIcon}>
          👤
        </span>

        Create New Account
      </button>


      <p style={styles.helpText}>
        Farmer or Government Agency can create an account.
      </p>

    </div>

  </div>

</div>

);
}

function Feature({
icon,
title,
text,
}) {

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

const styles = {

page: {
minHeight: "100vh",
display: "flex",
fontFamily:
"Inter, Arial, sans-serif",
background: "#ffffff",
},

/* LEFT SECTION */

leftSection: {
width: "55%",
minHeight: "100vh",
background:
"linear-gradient(135deg, #103d2d 0%, #1f6b4f 55%, #2f8a63 100%)",
color: "white",
padding: "45px 65px",
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
width: "55px",
height: "55px",
borderRadius: "15px",
background:
"rgba(255,255,255,0.15)",
display: "flex",
alignItems: "center",
justifyContent: "center",
fontSize: "28px",
border:
"1px solid rgba(255,255,255,0.2)",
},

brandTitle: {
margin: 0,
fontSize: "22px",
letterSpacing: "0.3px",
},

brandSubtitle: {
margin: "4px 0 0",
fontSize: "12px",
opacity: 0.75,
},

heroContent: {
maxWidth: "620px",
marginTop: "auto",
marginBottom: "auto",
paddingTop: "60px",
paddingBottom: "60px",
},

badge: {
display: "inline-block",
padding: "9px 15px",
borderRadius: "20px",
background:
"rgba(255,255,255,0.13)",
border:
"1px solid rgba(255,255,255,0.15)",
fontSize: "11px",
letterSpacing: "1.5px",
marginBottom: "25px",
},

heroTitle: {
fontSize: "52px",
lineHeight: "1.18",
margin: "0 0 22px",
fontWeight: "700",
},

heroHighlight: {
color: "#a7f3c4",
},

heroDescription: {
fontSize: "17px",
lineHeight: "1.7",
opacity: 0.82,
maxWidth: "570px",
marginBottom: "40px",
},

featureList: {
display: "flex",
flexDirection: "column",
gap: "18px",
},

feature: {
display: "flex",
alignItems: "center",
gap: "16px",
},

featureIcon: {
width: "50px",
height: "50px",
minWidth: "50px",
borderRadius: "12px",
background:
"rgba(255,255,255,0.12)",
display: "flex",
alignItems: "center",
justifyContent: "center",
fontSize: "22px",
},

featureTitle: {
margin: "0 0 5px",
fontSize: "15px",
},

featureText: {
margin: 0,
fontSize: "13px",
opacity: 0.72,
},

footerText: {
fontSize: "12px",
opacity: 0.55,
},

/* RIGHT SECTION */

rightSection: {
width: "45%",
minHeight: "100vh",
display: "flex",
justifyContent: "center",
alignItems: "center",
padding: "40px",
boxSizing: "border-box",
background: "#fafcfb",
},

loginContainer: {
width: "100%",
maxWidth: "440px",
},

mobileBrand: {
display: "none",
},

loginHeader: {
marginBottom: "35px",
},

welcome: {
margin: "0 0 10px",
color: "#3c8b66",
fontSize: "11px",
fontWeight: "bold",
letterSpacing: "1.5px",
},

loginTitle: {
margin: "0 0 12px",
color: "#183b2c",
fontSize: "32px",
},

loginSubtitle: {
margin: 0,
color: "#74807a",
fontSize: "14px",
lineHeight: "1.6",
},

label: {
display: "block",
color: "#34443c",
fontSize: "13px",
fontWeight: "600",
marginBottom: "8px",
},

inputWrapper: {
position: "relative",
display: "flex",
alignItems: "center",
},

inputIcon: {
position: "absolute",
left: "16px",
fontSize: "17px",
zIndex: 1,
},

input: {
width: "100%",
padding: "15px 18px 15px 48px",
border: "1px solid #dfe7e2",
borderRadius: "10px",
fontSize: "14px",
outline: "none",
boxSizing: "border-box",
background: "white",
},

showPasswordButton: {
position: "absolute",
right: "12px",
border: "none",
background: "transparent",
color: "#287252",
fontWeight: "600",
cursor: "pointer",
fontSize: "12px",
},

errorBox: {
display: "flex",
alignItems: "center",
gap: "10px",
background: "#fff1f1",
border: "1px solid #ffd6d6",
color: "#b73a3a",
padding: "13px 15px",
borderRadius: "9px",
fontSize: "13px",
marginBottom: "22px",
},

errorIcon: {
fontSize: "17px",
},

loginButton: {
width: "100%",
marginTop: "28px",
padding: "15px 20px",
border: "none",
borderRadius: "10px",
background:
"linear-gradient(135deg, #1d5d43, #2c8a62)",
color: "white",
fontSize: "15px",
fontWeight: "600",
display: "flex",
justifyContent: "center",
alignItems: "center",
gap: "12px",
boxShadow:
"0 8px 18px rgba(31,107,79,0.22)",
},

spinner: {
fontSize: "16px",
},

divider: {
display: "flex",
alignItems: "center",
gap: "12px",
margin: "28px 0",
color: "#98a39d",
fontSize: "12px",
},

dividerLine: {
flex: 1,
height: "1px",
background: "#e2e8e4",
},

registerButton: {
width: "100%",
padding: "14px",
borderRadius: "10px",
border: "1px solid #2c7a58",
background: "white",
color: "#236044",
fontSize: "14px",
fontWeight: "600",
cursor: "pointer",
display: "flex",
alignItems: "center",
justifyContent: "center",
gap: "10px",
},

registerIcon: {
fontSize: "17px",
},

helpText: {
textAlign: "center",
color: "#89938e",
fontSize: "11px",
marginTop: "16px",
},

};

export default Login;