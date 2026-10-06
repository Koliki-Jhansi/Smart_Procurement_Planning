import React, {
  useMemo,
  useState,
} from "react";
import axios from "axios";
import API_BASE_URL from "../apiConfig";
const heroImage = "/assets/procurement-hero.png";

function Register({ goLogin }) {
  const [role, setRole] = useState("farmer");

  const [fullName, setFullName] =
    useState("");
  const [mobileNumber, setMobileNumber] =
    useState("");
  const [password, setPassword] =
    useState("");
  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [farmerId, setFarmerId] =
    useState("");
  const [village, setVillage] =
    useState("");
  const [mandal, setMandal] =
    useState("");
  const [district, setDistrict] =
    useState("");
  const [landArea, setLandArea] =
    useState("");
  const [primaryCrop, setPrimaryCrop] =
    useState("");

  const [department, setDepartment] =
    useState("");
  const [designation, setDesignation] =
    useState("");

  const [loading, setLoading] =
    useState(false);
  const [error, setError] =
    useState("");
  const [success, setSuccess] =
    useState("");

  const passwordStrength = useMemo(() => {
    let score = 0;

    if (password.length >= 6) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password))
      score++;

    if (score <= 1) {
      return {
        label: "Weak",
        width: "25%",
        color: "#d84a4a",
      };
    }

    if (score === 2) {
      return {
        label: "Fair",
        width: "50%",
        color: "#d89c27",
      };
    }

    if (score === 3) {
      return {
        label: "Good",
        width: "75%",
        color: "#347fcb",
      };
    }

    return {
      label: "Strong",
      width: "100%",
      color: "#278a59",
    };
  }, [password]);

  const handleRoleChange = (
    selectedRole
  ) => {
    setRole(selectedRole);
    setError("");
    setSuccess("");
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

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
      setError("Password is required.");
      return;
    }

    if (password.length < 6) {
      setError(
        "Password must contain at least 6 characters."
      );
      return;
    }

    if (
      password !== confirmPassword
    ) {
      setError(
        "Password and confirm password do not match."
      );
      return;
    }

    if (role === "farmer") {
      if (!village.trim()) {
        setError("Village is required.");
        return;
      }

      if (!mandal.trim()) {
        setError("Mandal is required.");
        return;
      }

      if (!district.trim()) {
        setError("District is required.");
        return;
      }

      if (
        !landArea ||
        Number(landArea) <= 0
      ) {
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
      const payload = {
        name: fullName.trim(),
        full_name: fullName.trim(),
        mobile_number:
          mobileNumber.trim(),
        password,
        role,
      };

      if (role === "farmer") {
        payload.farmer_id =
          farmerId.trim();
        payload.village =
          village.trim();
        payload.mandal =
          mandal.trim();
        payload.district =
          district.trim();
        payload.land_area =
          Number(landArea);
        payload.primary_crop =
          primaryCrop;
      }

      if (role === "government") {
        payload.department =
          department.trim();
        payload.designation =
          designation.trim();
      }

      const response =
        await axios.post(
          `${API_BASE_URL}/api/auth/register`,
          payload,
          {
            headers: {
              "Content-Type":
                "application/json",
            },
          }
        );

      if (!response.data.success) {
        setError(
          response.data.message ||
            "Registration failed."
        );
        return;
      }

      setSuccess(
        "Account created successfully! Redirecting to login..."
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
          "Unable to connect to the registration service. Please check your connection or try again later."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
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
          background: #f5f8f6;
        }

        #root {
          max-width: none !important;
          padding: 0 !important;
          border: 0 !important;
        }

        button,
        input,
        select {
          font-family: inherit;
        }

        .register-page {
          min-height: 100vh;
          width: 100%;
          display: grid;
          grid-template-columns: minmax(330px, 0.68fr) minmax(600px, 1.32fr);
          font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont,
            "Segoe UI", sans-serif;
          color: #19372a;
          background: #f5f8f6;
        }

        .register-visual {
          position: relative;
          min-height: 100vh;
          padding: 39px 42px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          color: white;
          background-image:
            linear-gradient(
              180deg,
              rgba(3, 35, 22, 0.78),
              rgba(3, 44, 28, 0.93)
            ),
            url("${heroImage}");
          background-size: cover;
          background-position: center;
        }

        .register-brand {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .register-brand-logo {
          width: 47px;
          height: 47px;
          display: grid;
          place-items: center;
          border-radius: 15px;
          background: rgba(255, 255, 255, 0.13);
          border: 1px solid rgba(255, 255, 255, 0.17);
          backdrop-filter: blur(13px);
          font-size: 22px;
        }

        .register-brand-title {
          font-size: 15px;
          font-weight: 800;
        }

        .register-brand-sub {
          margin-top: 3px;
          color: rgba(255, 255, 255, 0.62);
          font-size: 7px;
          letter-spacing: 1.6px;
        }

        .register-visual-content {
          position: relative;
          z-index: 2;
          margin: auto 0;
          padding: 45px 0;
        }

        .register-visual-tag {
          margin-bottom: 15px;
          color: #9ce8b8;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 1.8px;
        }

        .register-visual-title {
          margin: 0 0 19px;
          font-size: clamp(36px, 3.2vw, 50px);
          line-height: 1.06;
          letter-spacing: -1.8px;
        }

        .register-visual-title span {
          color: #96e5b3;
        }

        .register-visual-text {
          margin: 0 0 29px;
          max-width: 410px;
          color: rgba(255, 255, 255, 0.7);
          font-size: 11px;
          line-height: 1.75;
        }

        .benefit {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.82);
          font-size: 9px;
        }

        .benefit-check {
          width: 22px;
          height: 22px;
          display: grid;
          place-items: center;
          border-radius: 7px;
          background: rgba(137, 226, 170, 0.13);
          color: #98e6b4;
          font-size: 8px;
          font-weight: 900;
        }

        .register-visual-footer {
          position: relative;
          z-index: 2;
          color: rgba(255, 255, 255, 0.45);
          font-size: 7px;
          letter-spacing: 0.8px;
        }

        .register-main {
          min-height: 100vh;
          padding: 30px;
          overflow-y: auto;
          background:
            radial-gradient(
              circle at 100% 0%,
              rgba(187, 231, 204, 0.4),
              transparent 28%
            ),
            #f7faf8;
        }

        .register-card {
          width: 100%;
          max-width: 930px;
          margin: 0 auto;
          padding: 35px;
          border: 1px solid #e1eae4;
          border-radius: 25px;
          background: rgba(255, 255, 255, 0.96);
          box-shadow: 0 24px 70px rgba(14, 68, 44, 0.09);
        }

        .register-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 22px;
        }

        .register-tag {
          margin-bottom: 7px;
          color: #25815a;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 1.6px;
        }

        .register-title {
          margin: 0 0 7px;
          color: #123b29;
          font-size: 28px;
          letter-spacing: -0.8px;
        }

        .register-subtitle {
          margin: 0;
          color: #839087;
          font-size: 10px;
          line-height: 1.6;
        }

        .back-login {
          padding: 9px 12px;
          border: 1px solid #dbe5df;
          border-radius: 10px;
          background: #fafcfb;
          color: #52685c;
          font-size: 9px;
          font-weight: 750;
          cursor: pointer;
          white-space: nowrap;
        }

        .back-login:hover {
          background: #f1f7f3;
        }

        .alert {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 15px;
          padding: 11px 13px;
          border: 1px solid;
          border-radius: 10px;
          font-size: 9px;
        }

        .form-section {
          margin-top: 18px;
          padding-top: 18px;
          border-top: 1px solid #edf1ee;
        }

        .section-heading {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 13px;
        }

        .section-number {
          width: 24px;
          height: 24px;
          display: grid;
          place-items: center;
          border-radius: 7px;
          background: #e9f6ee;
          color: #248159;
          font-size: 8px;
          font-weight: 850;
        }

        .section-title {
          color: #536e61;
          font-size: 8px;
          font-weight: 850;
          letter-spacing: 1.2px;
          text-transform: uppercase;
        }

        .role-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .role-card {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 13px;
          border: 1px solid #dce6e0;
          border-radius: 13px;
          background: #fff;
          color: #334b3e;
          text-align: left;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .role-card:hover {
          transform: translateY(-1px);
          border-color: #9fc9af;
        }

        .role-card.active {
          border-color: #4d9d74;
          background: #f0faf4;
          box-shadow: 0 6px 18px rgba(36, 127, 84, 0.08);
        }

        .role-icon {
          flex: 0 0 auto;
          width: 41px;
          height: 41px;
          display: grid;
          place-items: center;
          border-radius: 11px;
          background: #e9f5ee;
          font-size: 19px;
        }

        .role-info {
          flex: 1;
        }

        .role-title {
          display: block;
          font-size: 10px;
          font-weight: 800;
        }

        .role-description {
          margin-top: 3px;
          color: #89968f;
          font-size: 8px;
        }

        .role-check {
          width: 19px;
          height: 19px;
          display: grid;
          place-items: center;
          border: 1px solid #cad7cf;
          border-radius: 50%;
          font-size: 8px;
        }

        .role-card.active .role-check {
          border-color: #27845b;
          background: #27845b;
          color: white;
        }

        .two-column {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .three-column {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }

        .field {
          margin-bottom: 12px;
        }

        .field-label {
          display: block;
          margin-bottom: 6px;
          color: #405349;
          font-size: 9px;
          font-weight: 750;
        }

        .optional {
          margin-left: 5px;
          color: #9ba69f;
          font-size: 7px;
          font-weight: 500;
        }

        .reg-input,
        .reg-select {
          width: 100%;
          min-height: 41px;
          padding: 10px 11px;
          border: 1px solid #dce5df;
          border-radius: 10px;
          outline: none;
          background: #fbfcfb;
          color: #263d31;
          font-size: 10px;
          transition: 0.2s;
        }

        .reg-input:focus,
        .reg-select:focus,
        .phone-shell:focus-within,
        .password-shell:focus-within,
        .area-shell:focus-within {
          border-color: #48a277;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(40, 143, 94, 0.08);
        }

        .phone-shell,
        .password-shell,
        .area-shell {
          min-height: 41px;
          display: flex;
          align-items: center;
          border: 1px solid #dce5df;
          border-radius: 10px;
          background: #fbfcfb;
          overflow: hidden;
          transition: 0.2s;
        }

        .country-code {
          align-self: stretch;
          display: flex;
          align-items: center;
          padding: 0 11px;
          border-right: 1px solid #dce5df;
          background: #f1f5f2;
          color: #5b6d63;
          font-size: 10px;
          font-weight: 700;
        }

        .shell-input {
          flex: 1;
          min-width: 0;
          min-height: 39px;
          padding: 0 10px;
          border: 0;
          outline: 0;
          background: transparent;
          color: #263d31;
          font-size: 10px;
        }

        .area-unit {
          align-self: stretch;
          display: flex;
          align-items: center;
          padding: 0 13px;
          border-left: 1px solid #dce5df;
          background: #f2f6f3;
          color: #607168;
          font-size: 9px;
        }

        .show-password {
          margin-right: 5px;
          padding: 7px 9px;
          border: 0;
          background: transparent;
          color: #237a55;
          font-size: 8px;
          font-weight: 800;
          cursor: pointer;
        }

        .strength-row {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-top: 6px;
        }

        .strength-track {
          flex: 1;
          height: 4px;
          overflow: hidden;
          border-radius: 20px;
          background: #e8edea;
        }

        .strength-bar {
          height: 100%;
          border-radius: 20px;
          transition: 0.25s ease;
        }

        .strength-label {
          font-size: 8px;
          font-weight: 750;
        }

        .match-text {
          margin-top: 6px;
          font-size: 8px;
          font-weight: 650;
        }

        .submit-button {
          width: 100%;
          margin-top: 21px;
          padding: 13px 15px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border: 0;
          border-radius: 11px;
          background: linear-gradient(135deg, #105638, #20865a);
          color: white;
          font-size: 10px;
          font-weight: 800;
          box-shadow: 0 11px 25px rgba(20, 108, 70, 0.18);
          transition: 0.2s ease;
        }

        .submit-button:not(:disabled):hover {
          transform: translateY(-1px);
          box-shadow: 0 15px 31px rgba(20, 108, 70, 0.24);
        }

        .signin-footer {
          margin-top: 17px;
          text-align: center;
          color: #929e97;
          font-size: 9px;
        }

        .signin-link {
          margin-left: 5px;
          padding: 0;
          border: 0;
          background: transparent;
          color: #247b56;
          font-size: 9px;
          font-weight: 800;
          cursor: pointer;
        }

        @media (max-width: 1050px) {
          .register-page {
            grid-template-columns: 1fr;
          }

          .register-visual {
            display: none;
          }
        }

        @media (max-width: 680px) {
          .register-main {
            padding: 18px;
          }

          .register-card {
            padding: 24px 20px;
          }

          .register-header {
            flex-direction: column;
          }

          .two-column,
          .three-column,
          .role-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <aside className="register-visual">
        <div className="register-brand">
          <div className="register-brand-logo">
            🌾
          </div>

          <div>
            <div className="register-brand-title">
              Smart Procurement
            </div>

            <div className="register-brand-sub">
              AGRICULTURE INTELLIGENCE PLATFORM
            </div>
          </div>
        </div>

        <div className="register-visual-content">
          <div className="register-visual-tag">
            JOIN THE DIGITAL AGRICULTURE NETWORK
          </div>

          <h1 className="register-visual-title">
            Building a smarter
            <br />
            agricultural
            <br />
            <span>ecosystem.</span>
          </h1>

          <p className="register-visual-text">
            Create your account and connect with an
            integrated procurement network built for
            farmers and government agencies.
          </p>

          <Benefit text="Crop production intelligence" />
          <Benefit text="Procurement center planning" />
          <Benefit text="Warehouse capacity visibility" />
          <Benefit text="Connected transport planning" />
        </div>

        <div className="register-visual-footer">
          SMART AGRICULTURE • PROCUREMENT • LOGISTICS
        </div>
      </aside>

      <main className="register-main">
        <div className="register-card">
          <div className="register-header">
            <div>
              <div className="register-tag">
                ACCOUNT REGISTRATION
              </div>

              <h2 className="register-title">
                Create your account
              </h2>

              <p className="register-subtitle">
                Join the Smart Procurement Platform and
                access your personalized dashboard.
              </p>
            </div>

            <button
              className="back-login"
              type="button"
              onClick={goLogin}
            >
              ← Back to login
            </button>
          </div>

          {error && (
            <Alert
              success={false}
              text={error}
            />
          )}

          {success && (
            <Alert
              success
              text={success}
            />
          )}

          <form onSubmit={handleRegister}>
            <Section
              number="01"
              title="Choose account type"
            >
              <div className="role-grid">
                <RoleCard
                  active={role === "farmer"}
                  icon="👨‍🌾"
                  title="Farmer"
                  description="Crop planning & procurement"
                  onClick={() =>
                    handleRoleChange("farmer")
                  }
                />

                <RoleCard
                  active={
                    role === "government"
                  }
                  icon="🏛️"
                  title="Government Agency"
                  description="Procurement management"
                  onClick={() =>
                    handleRoleChange(
                      "government"
                    )
                  }
                />
              </div>
            </Section>

            <Section
              number="02"
              title="Personal information"
            >
              <div className="two-column">
                <Field
                  label={
                    role === "farmer"
                      ? "Farmer Name"
                      : "Officer / Agency Name"
                  }
                >
                  <input
                    className="reg-input"
                    value={fullName}
                    onChange={(e) =>
                      setFullName(
                        e.target.value
                      )
                    }
                    placeholder="Enter full name"
                  />
                </Field>

                <Field label="Mobile Number">
                  <div className="phone-shell">
                    <span className="country-code">
                      +91
                    </span>

                    <input
                      className="shell-input"
                      inputMode="numeric"
                      value={mobileNumber}
                      onChange={(e) =>
                        setMobileNumber(
                          e.target.value.replace(
                            /\D/g,
                            ""
                          )
                        )
                      }
                      maxLength={10}
                      placeholder="10-digit mobile number"
                    />
                  </div>
                </Field>
              </div>
            </Section>

            {role === "farmer" && (
              <Section
                number="03"
                title="Farm information"
              >
                <div className="two-column">
                  <Field
                    label="Farmer ID"
                    optional
                  >
                    <input
                      className="reg-input"
                      value={farmerId}
                      onChange={(e) =>
                        setFarmerId(
                          e.target.value
                        )
                      }
                      placeholder="Enter Farmer ID"
                    />
                  </Field>

                  <Field label="Primary Crop">
                    <select
                      className="reg-select"
                      value={primaryCrop}
                      onChange={(e) =>
                        setPrimaryCrop(
                          e.target.value
                        )
                      }
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
                  </Field>
                </div>

                <div className="three-column">
                  <Field label="Village">
                    <input
                      className="reg-input"
                      value={village}
                      onChange={(e) =>
                        setVillage(
                          e.target.value
                        )
                      }
                      placeholder="Village"
                    />
                  </Field>

                  <Field label="Mandal">
                    <input
                      className="reg-input"
                      value={mandal}
                      onChange={(e) =>
                        setMandal(
                          e.target.value
                        )
                      }
                      placeholder="Mandal"
                    />
                  </Field>

                  <Field label="District">
                    <input
                      className="reg-input"
                      value={district}
                      onChange={(e) =>
                        setDistrict(
                          e.target.value
                        )
                      }
                      placeholder="District"
                    />
                  </Field>
                </div>

                <Field label="Cultivated Land Area">
                  <div className="area-shell">
                    <input
                      className="shell-input"
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
                    />

                    <span className="area-unit">
                      Acres
                    </span>
                  </div>
                </Field>
              </Section>
            )}

            {role === "government" && (
              <Section
                number="03"
                title="Government information"
              >
                <div className="two-column">
                  <Field label="Department">
                    <input
                      className="reg-input"
                      value={department}
                      onChange={(e) =>
                        setDepartment(
                          e.target.value
                        )
                      }
                      placeholder="Agriculture Department"
                    />
                  </Field>

                  <Field label="Designation">
                    <input
                      className="reg-input"
                      value={designation}
                      onChange={(e) =>
                        setDesignation(
                          e.target.value
                        )
                      }
                      placeholder="Enter designation"
                    />
                  </Field>
                </div>
              </Section>
            )}

            <Section
              number="04"
              title="Account security"
            >
              <div className="two-column">
                <Field label="Password">
                  <div className="password-shell">
                    <input
                      className="shell-input"
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
                    />

                    <button
                      className="show-password"
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

                  {password && (
                    <div className="strength-row">
                      <div className="strength-track">
                        <div
                          className="strength-bar"
                          style={{
                            width:
                              passwordStrength.width,
                            background:
                              passwordStrength.color,
                          }}
                        />
                      </div>

                      <span
                        className="strength-label"
                        style={{
                          color:
                            passwordStrength.color,
                        }}
                      >
                        {
                          passwordStrength.label
                        }
                      </span>
                    </div>
                  )}
                </Field>

                <Field label="Confirm Password">
                  <div className="password-shell">
                    <input
                      className="shell-input"
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
                    />

                    <button
                      className="show-password"
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(
                          !showConfirmPassword
                        )
                      }
                    >
                      {showConfirmPassword
                        ? "Hide"
                        : "Show"}
                    </button>
                  </div>

                  {confirmPassword && (
                    <div
                      className="match-text"
                      style={{
                        color:
                          password ===
                          confirmPassword
                            ? "#258454"
                            : "#c53d3d",
                      }}
                    >
                      {password ===
                      confirmPassword
                        ? "✓ Passwords match"
                        : "✕ Passwords do not match"}
                    </div>
                  )}
                </Field>
              </div>
            </Section>

            <button
              className="submit-button"
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
                  ? "Creating account..."
                  : "Create Account"}
              </span>

              {!loading && <span>→</span>}
            </button>
          </form>

          <div className="signin-footer">
            Already have an account?

            <button
              className="signin-link"
              type="button"
              onClick={goLogin}
            >
              Sign in
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

function Section({
  number,
  title,
  children,
}) {
  return (
    <section className="form-section">
      <div className="section-heading">
        <div className="section-number">
          {number}
        </div>

        <div className="section-title">
          {title}
        </div>
      </div>

      {children}
    </section>
  );
}

function Field({
  label,
  optional = false,
  children,
}) {
  return (
    <div className="field">
      <label className="field-label">
        {label}

        {optional && (
          <span className="optional">
            Optional
          </span>
        )}
      </label>

      {children}
    </div>
  );
}

function RoleCard({
  active,
  icon,
  title,
  description,
  onClick,
}) {
  return (
    <button
      className={`role-card ${
        active ? "active" : ""
      }`}
      type="button"
      onClick={onClick}
    >
      <div className="role-icon">
        {icon}
      </div>

      <div className="role-info">
        <span className="role-title">
          {title}
        </span>

        <div className="role-description">
          {description}
        </div>
      </div>

      <div className="role-check">
        {active ? "✓" : ""}
      </div>
    </button>
  );
}

function Benefit({ text }) {
  return (
    <div className="benefit">
      <div className="benefit-check">
        ✓
      </div>

      <span>{text}</span>
    </div>
  );
}

function Alert({ success, text }) {
  return (
    <div
      className="alert"
      style={{
        background: success
          ? "#eff9f2"
          : "#fff2f2",
        borderColor: success
          ? "#ccebd6"
          : "#ffd5d5",
        color: success
          ? "#247344"
          : "#b23b3b",
      }}
    >
      <strong>
        {success ? "✓" : "!"}
      </strong>

      <span>{text}</span>
    </div>
  );
}

export default Register;