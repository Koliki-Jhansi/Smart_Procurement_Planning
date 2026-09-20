import React, { useState } from "react";
import axios from "axios";

const API = "http://127.0.0.1:5000/api";
const heroImage = "/assets/procurement-hero.png";

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
      const response = await axios.post(`${API}/auth/login`, {
        mobile_number: mobile.trim(),
        password,
      });

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
    <div className="auth-page">
      <style>{`
        * {
          box-sizing: border-box;
        }

        html,
        body,
        #root {
          margin: 0;
          width: 100%;
          min-width: 100%;
          min-height: 100%;
        }

        body {
          margin: 0;
          background: #f4f8f5;
        }

        #root {
          max-width: none !important;
          padding: 0 !important;
          border: 0 !important;
        }

        button,
        input {
          font-family: inherit;
        }

        .auth-page {
          width: 100%;
          min-height: 100vh;
          display: grid;
          grid-template-columns: minmax(0, 1.15fr) minmax(420px, 0.85fr);
          font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont,
            "Segoe UI", sans-serif;
          background: #f5f8f6;
          color: #163527;
        }

        .login-visual {
          position: relative;
          min-height: 100vh;
          padding: 42px 52px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          color: white;
          background-image:
            linear-gradient(
              90deg,
              rgba(4, 35, 23, 0.95) 0%,
              rgba(5, 49, 31, 0.82) 38%,
              rgba(6, 47, 31, 0.34) 100%
            ),
            linear-gradient(
              0deg,
              rgba(2, 27, 17, 0.72) 0%,
              transparent 60%
            ),
            url("${heroImage}");
          background-size: cover;
          background-position: center;
        }

        .visual-top {
          position: relative;
          z-index: 2;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 13px;
        }

        .brand-logo {
          width: 50px;
          height: 50px;
          border-radius: 16px;
          display: grid;
          place-items: center;
          font-size: 24px;
          background: rgba(255, 255, 255, 0.13);
          border: 1px solid rgba(255, 255, 255, 0.18);
          backdrop-filter: blur(14px);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.12);
        }

        .brand-title {
          font-size: 17px;
          font-weight: 800;
          letter-spacing: -0.2px;
        }

        .brand-subtitle {
          margin-top: 3px;
          font-size: 8px;
          letter-spacing: 1.8px;
          color: rgba(255, 255, 255, 0.65);
        }

        .network-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 9px 13px;
          border-radius: 999px;
          background: rgba(4, 32, 21, 0.32);
          border: 1px solid rgba(255, 255, 255, 0.14);
          backdrop-filter: blur(14px);
          font-size: 8px;
          letter-spacing: 1.2px;
          font-weight: 700;
        }

        .network-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #75e5a1;
          box-shadow: 0 0 12px #75e5a1;
        }

        .visual-content {
          position: relative;
          z-index: 2;
          margin: auto 0;
          max-width: 670px;
          padding: 55px 0;
        }

        .eyebrow {
          display: inline-flex;
          align-items: center;
          padding: 8px 12px;
          margin-bottom: 19px;
          border-radius: 999px;
          background: rgba(143, 232, 177, 0.1);
          border: 1px solid rgba(153, 235, 184, 0.2);
          color: #a3edbf;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 1.7px;
        }

        .visual-title {
          margin: 0;
          max-width: 630px;
          font-size: clamp(43px, 4vw, 65px);
          line-height: 1.02;
          letter-spacing: -2.6px;
          font-weight: 800;
          text-shadow: 0 5px 30px rgba(0, 0, 0, 0.18);
        }

        .visual-title span {
          color: #99e9b7;
        }

        .visual-description {
          max-width: 570px;
          margin: 23px 0 32px;
          color: rgba(255, 255, 255, 0.76);
          font-size: 14px;
          line-height: 1.8;
        }

        .process-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 11px;
          max-width: 620px;
        }

        .process-card {
          padding: 15px;
          border-radius: 16px;
          background: rgba(3, 39, 25, 0.45);
          border: 1px solid rgba(255, 255, 255, 0.13);
          backdrop-filter: blur(14px);
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.08);
        }

        .process-number {
          margin-bottom: 9px;
          color: #88e1aa;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1px;
        }

        .process-title {
          margin-bottom: 4px;
          font-size: 11px;
          font-weight: 750;
        }

        .process-text {
          color: rgba(255, 255, 255, 0.58);
          font-size: 8px;
          line-height: 1.5;
        }

        .visual-footer {
          position: relative;
          z-index: 2;
          display: flex;
          justify-content: space-between;
          gap: 20px;
          color: rgba(255, 255, 255, 0.48);
          font-size: 8px;
          letter-spacing: 0.7px;
        }

        .login-side {
          min-height: 100vh;
          padding: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          background:
            radial-gradient(
              circle at 100% 0%,
              rgba(181, 230, 200, 0.35),
              transparent 30%
            ),
            linear-gradient(160deg, #fbfdfc, #f3f8f5);
        }

        .login-wrapper {
          width: 100%;
          max-width: 440px;
        }

        .login-card {
          width: 100%;
          padding: 39px;
          border: 1px solid #e0eae4;
          border-radius: 28px;
          background: rgba(255, 255, 255, 0.94);
          box-shadow: 0 28px 80px rgba(17, 70, 46, 0.12);
          backdrop-filter: blur(20px);
        }

        .form-brand {
          display: flex;
          align-items: center;
          gap: 11px;
          margin-bottom: 31px;
        }

        .form-brand-icon {
          width: 39px;
          height: 39px;
          border-radius: 12px;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, #e7f6ed, #f4faf6);
          border: 1px solid #dcebe2;
          font-size: 19px;
        }

        .form-brand-title {
          color: #123d2a;
          font-size: 13px;
          font-weight: 800;
        }

        .form-brand-subtitle {
          display: block;
          margin-top: 2px;
          color: #95a199;
          font-size: 7px;
          letter-spacing: 0.7px;
        }

        .form-tag {
          margin-bottom: 8px;
          color: #238158;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 1.6px;
        }

        .form-title {
          margin: 0 0 9px;
          color: #113b28;
          font-size: 31px;
          line-height: 1.1;
          letter-spacing: -1px;
        }

        .form-description {
          margin: 0 0 27px;
          color: #7b8981;
          font-size: 11px;
          line-height: 1.7;
        }

        .error-box {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 18px;
          padding: 11px 12px;
          border: 1px solid #ffd7d7;
          border-radius: 11px;
          background: #fff3f3;
          color: #ad3939;
          font-size: 10px;
        }

        .error-icon {
          flex: 0 0 auto;
          width: 22px;
          height: 22px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: #d94b4b;
          color: white;
          font-weight: 800;
        }

        .field {
          margin-bottom: 18px;
        }

        .field-label {
          display: block;
          margin-bottom: 7px;
          color: #3b5145;
          font-size: 10px;
          font-weight: 750;
        }

        .input-shell {
          height: 51px;
          display: flex;
          align-items: center;
          border: 1px solid #dae5de;
          border-radius: 12px;
          background: #fbfcfb;
          transition: 0.2s ease;
          overflow: hidden;
        }

        .input-shell:focus-within {
          border-color: #42a276;
          background: white;
          box-shadow: 0 0 0 4px rgba(39, 142, 93, 0.09);
        }

        .input-symbol {
          width: 43px;
          display: grid;
          place-items: center;
          color: #688075;
          font-size: 14px;
        }

        .country-code {
          padding-right: 11px;
          border-right: 1px solid #e1e8e4;
          color: #566a5f;
          font-size: 11px;
          font-weight: 700;
        }

        .input-control {
          flex: 1;
          min-width: 0;
          height: 100%;
          padding: 0 12px;
          border: 0;
          outline: 0;
          background: transparent;
          color: #22382d;
          font-size: 11px;
        }

        .show-button {
          margin-right: 6px;
          padding: 8px 10px;
          border: 0;
          background: transparent;
          color: #217b55;
          font-size: 9px;
          font-weight: 800;
          cursor: pointer;
        }

        .login-button {
          width: 100%;
          margin-top: 5px;
          padding: 14px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border: 0;
          border-radius: 12px;
          background: linear-gradient(135deg, #0c5537, #1d875b);
          color: white;
          font-size: 11px;
          font-weight: 800;
          box-shadow: 0 12px 27px rgba(15, 115, 72, 0.21);
          transition: 0.2s ease;
        }

        .login-button:not(:disabled):hover {
          transform: translateY(-2px);
          box-shadow: 0 17px 35px rgba(15, 115, 72, 0.27);
        }

        .button-arrow {
          font-size: 18px;
          line-height: 1;
        }

        .divider {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 24px 0;
        }

        .divider-line {
          flex: 1;
          height: 1px;
          background: #e5ebe7;
        }

        .divider-text {
          color: #9aa69f;
          font-size: 7px;
          font-weight: 700;
          letter-spacing: 1px;
          white-space: nowrap;
        }

        .register-button {
          width: 100%;
          padding: 13px;
          border: 1px solid #bcd7c7;
          border-radius: 12px;
          background: #f8fcfa;
          color: #196947;
          font-size: 10px;
          font-weight: 800;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .register-button:hover {
          background: #eef8f2;
          border-color: #8fc3a5;
        }

        .account-note {
          margin: 11px 0 22px;
          text-align: center;
          color: #99a49e;
          font-size: 8px;
        }

        .security-card {
          display: flex;
          gap: 10px;
          padding-top: 17px;
          border-top: 1px solid #edf1ee;
        }

        .security-icon {
          flex: 0 0 auto;
          width: 27px;
          height: 27px;
          display: grid;
          place-items: center;
          border-radius: 8px;
          background: #e9f6ee;
          color: #1c8255;
          font-size: 10px;
          font-weight: 800;
        }

        .security-title {
          color: #4a6155;
          font-size: 9px;
          font-weight: 750;
        }

        .security-text {
          margin-top: 3px;
          color: #9aa59f;
          font-size: 7px;
          line-height: 1.5;
        }

        .login-footer {
          margin-top: 17px;
          text-align: center;
          color: #9aa59f;
          font-size: 8px;
        }

        @media (max-width: 1000px) {
          .auth-page {
            grid-template-columns: 1fr;
          }

          .login-visual {
            display: none;
          }

          .login-side {
            width: 100%;
          }
        }

        @media (max-width: 520px) {
          .login-side {
            padding: 18px;
          }

          .login-card {
            padding: 27px 22px;
            border-radius: 22px;
          }
        }
      `}</style>

      <section className="login-visual">
        <div className="visual-top">
          <div className="brand">
            <div className="brand-logo">🌾</div>

            <div>
              <div className="brand-title">
                Smart Procurement
              </div>
              <div className="brand-subtitle">
                AGRICULTURE INTELLIGENCE PLATFORM
              </div>
            </div>
          </div>

          <div className="network-badge">
            <span className="network-dot" />
            DIGITAL PROCUREMENT NETWORK
          </div>
        </div>

        <div className="visual-content">
          <div className="eyebrow">
            SMART AGRICULTURE • CONNECTED LOGISTICS
          </div>

          <h1 className="visual-title">
            From harvest to
            <br />
            procurement,
            <br />
            <span>intelligently.</span>
          </h1>

          <p className="visual-description">
            One intelligent platform connecting farmers,
            procurement centers, warehouses and government
            agencies for efficient agricultural procurement.
          </p>

          <div className="process-grid">
            <ProcessCard
              number="01"
              title="Predict"
              text="Data-driven crop planning"
            />

            <ProcessCard
              number="02"
              title="Procure"
              text="Center & capacity planning"
            />

            <ProcessCard
              number="03"
              title="Deliver"
              text="Connected logistics"
            />
          </div>
        </div>

        <div className="visual-footer">
          <span>Smart Procurement Planning System</span>
          <span>Farmer • Government • Warehouse</span>
        </div>
      </section>

      <section className="login-side">
        <div className="login-wrapper">
          <div className="login-card">
            <div className="form-brand">
              <div className="form-brand-icon">🌿</div>

              <div>
                <div className="form-brand-title">
                  Smart Procurement
                </div>
                <span className="form-brand-subtitle">
                  SECURE AGRICULTURE PLATFORM
                </span>
              </div>
            </div>

            <div className="form-tag">
              SECURE PLATFORM ACCESS
            </div>

            <h2 className="form-title">
              Welcome back
            </h2>

            <p className="form-description">
              Sign in to access your dashboard and continue
              managing your procurement activities.
            </p>

            {error && (
              <div className="error-box">
                <div className="error-icon">!</div>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="field">
                <label className="field-label">
                  Mobile Number
                </label>

                <div className="input-shell">
                  <div className="input-symbol">☎</div>

                  <span className="country-code">
                    +91
                  </span>

                  <input
                    className="input-control"
                    type="text"
                    inputMode="numeric"
                    value={mobile}
                    onChange={(e) =>
                      setMobile(
                        e.target.value.replace(
                          /\D/g,
                          ""
                        )
                      )
                    }
                    maxLength={10}
                    placeholder="Enter 10-digit mobile number"
                  />
                </div>
              </div>

              <div className="field">
                <label className="field-label">
                  Password
                </label>

                <div className="input-shell">
                  <div className="input-symbol">●</div>

                  <input
                    className="input-control"
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
                  />

                  <button
                    className="show-button"
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        !showPassword
                      )
                    }
                  >
                    {showPassword
                      ? "Hide"
                      : "Show"}
                  </button>
                </div>
              </div>

              <button
                className="login-button"
                type="submit"
                disabled={loading}
                style={{
                  opacity: loading ? 0.7 : 1,
                  cursor: loading
                    ? "not-allowed"
                    : "pointer",
                }}
              >
                <span>
                  {loading
                    ? "Signing in..."
                    : "Sign in to dashboard"}
                </span>

                {!loading && (
                  <span className="button-arrow">
                    →
                  </span>
                )}
              </button>
            </form>

            <div className="divider">
              <span className="divider-line" />
              <span className="divider-text">
                NEW TO THE PLATFORM?
              </span>
              <span className="divider-line" />
            </div>

            <button
              className="register-button"
              type="button"
              onClick={goRegister}
            >
              ＋ Create a new account
            </button>

            <p className="account-note">
              Registration available for Farmers and
              Government Agencies
            </p>

            <div className="security-card">
              <div className="security-icon">
                ✓
              </div>

              <div>
                <div className="security-title">
                  Secure platform access
                </div>

                <div className="security-text">
                  Your account information is securely
                  transmitted and protected.
                </div>
              </div>
            </div>
          </div>

          <div className="login-footer">
            © 2026 Smart Procurement Planning System
          </div>
        </div>
      </section>
    </div>
  );
}

function ProcessCard({
  number,
  title,
  text,
}) {
  return (
    <div className="process-card">
      <div className="process-number">
        {number}
      </div>

      <div className="process-title">
        {title}
      </div>

      <div className="process-text">
        {text}
      </div>
    </div>
  );
}

export default Login;