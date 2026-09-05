import { useState } from "react";
import axios from "axios";

// =====================================================
// API CONFIGURATION
// =====================================================

const API = "http://127.0.0.1:5000/api";

const AUTH_API = `${API}/auth`;
const PREDICTION_API = `${API}/predict`;
const PROCUREMENT_API = `${API}/procurement/predict`;
const WAREHOUSE_API = `${API}/warehouse/check`;

const ADMIN_TRAINING_API = `${API}/admin/training-data`;
const ADMIN_TRAIN_API = `${API}/admin/train-model`;
const ADMIN_UPLOAD_API = `${API}/admin/upload-dataset`;

// =====================================================
// DISTRICTS
// =====================================================

const districts = [
  "Anantapur",
  "Chittoor",
  "East Godavari",
  "Guntur",
  "Krishna",
  "Kurnool",
  "NTR",
  "Nellore",
  "Prakasam",
  "West Godavari",
];

// =====================================================
// CROPS
// =====================================================

const crops = [
  "Black Gram",
  "Cotton",
  "Green Gram",
  "Groundnut",
  "Maize",
  "Paddy",
  "Red Gram",
  "Sunflower",
];

// =====================================================
// SEASONS
// =====================================================

const seasons = [
  "Kharif",
  "Rabi",
  "Summer",
];

// =====================================================
// MAIN APP
// =====================================================

function App() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  });

  const [page, setPage] = useState("dashboard");

  // ===================================================
  // LOGOUT
  // ===================================================

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
    setPage("dashboard");
  };

  // ===================================================
  // LOGIN
  // ===================================================

  if (!user) {
    return <Login setUser={setUser} />;
  }

  // ===================================================
  // ADMIN PAGES
  // ===================================================

  if (user.role === "admin") {
    if (page === "admin-training") {
      return (
        <AdminTrainingData
          user={user}
          goBack={() => setPage("dashboard")}
        />
      );
    }

    if (page === "admin-upload") {
      return (
        <AdminUploadDataset
          user={user}
          goBack={() => setPage("dashboard")}
        />
      );
    }

    if (page === "admin-view") {
      return (
        <AdminViewData
          user={user}
          goBack={() => setPage("dashboard")}
        />
      );
    }

    if (page === "admin-train") {
      return (
        <AdminTrainModel
          user={user}
          goBack={() => setPage("dashboard")}
        />
      );
    }

    return (
      <AdminDashboard
        user={user}
        logout={logout}
        openTraining={() => setPage("admin-training")}
        openUpload={() => setPage("admin-upload")}
        openViewData={() => setPage("admin-view")}
        openTrain={() => setPage("admin-train")}
      />
    );
  }

  // ===================================================
  // NORMAL USER PAGES
  // ===================================================

  if (page === "prediction") {
    return (
      <CropPrediction
        goBack={() => setPage("dashboard")}
      />
    );
  }

  if (page === "procurement") {
    return (
      <ProcurementPlanning
        goBack={() => setPage("dashboard")}
      />
    );
  }

  if (page === "warehouse") {
    return (
      <WarehouseManagement
        goBack={() => setPage("dashboard")}
      />
    );
  }

  if (page === "transport") {
    return (
      <TransportCost
        goBack={() => setPage("dashboard")}
      />
    );
  }

  // ===================================================
  // DASHBOARD
  // ===================================================

  return (
    <Dashboard
      user={user}
      logout={logout}
      openPrediction={() => setPage("prediction")}
      openProcurement={() => setPage("procurement")}
      openWarehouse={() => setPage("warehouse")}
      openTransport={() => setPage("transport")}
    />
  );
}

// =====================================================
// LOGIN / REGISTER
// =====================================================

function Login({ setUser }) {
  const [isLogin, setIsLogin] = useState(true);

  const [fullName, setFullName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [role, setRole] = useState("farmer");

  const [farmerId, setFarmerId] = useState("");
  const [village, setVillage] = useState("");
  const [mandal, setMandal] = useState("");
  const [district, setDistrict] = useState("");
  const [landArea, setLandArea] = useState("");
  const [primaryCrop, setPrimaryCrop] = useState("Paddy");

  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const resetFields = () => {
    setFullName("");
    setMobileNumber("");
    setEmail("");
    setPassword("");

    setFarmerId("");
    setVillage("");
    setMandal("");
    setDistrict("");
    setLandArea("");
    setPrimaryCrop("Paddy");

    setDepartment("");
    setDesignation("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setLoading(true);

    try {
      let data;

      if (isLogin) {
        data = {
          mobile_number: mobileNumber,
          password: password,
        };
      } else if (role === "farmer") {
        data = {
          full_name: fullName,
          mobile_number: mobileNumber,
          email,
          password,
          role: "farmer",

          farmer_id: farmerId,
          village,
          mandal,
          district,

          land_area:
            landArea === "" ? null : Number(landArea),

          primary_crop: primaryCrop,
        };
      } else {
        data = {
          full_name: fullName,
          mobile_number: mobileNumber,
          email,
          password,
          role: "government",

          department,
          designation,
          district,
        };
      }

      const endpoint = isLogin
        ? "/login"
        : "/register";

      const response = await axios.post(
        `${AUTH_API}${endpoint}`,
        data
      );

      if (isLogin) {
        const loggedUser = response.data.user;

        localStorage.setItem(
          "user",
          JSON.stringify(loggedUser)
        );

        setUser(loggedUser);
      } else {
        setMessage(
          "Account created successfully! Please login."
        );

        resetFields();
        setIsLogin(true);
      }
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.message ||
          "Unable to connect to backend."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div
        style={{
          ...styles.card,
          width: isLogin ? "400px" : "520px",
        }}
      >
        <h1 style={styles.title}>
          Smart Procurement Planning
        </h1>

        <p style={styles.subtitle}>
          Intelligent Crop Procurement
          <br />
          & Decision Support System
        </p>

        <h2>
          {isLogin
            ? "Login"
            : "Create Account"}
        </h2>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <label>Full Name</label>

              <input
                type="text"
                value={fullName}
                onChange={(e) =>
                  setFullName(e.target.value)
                }
                placeholder="Enter full name"
                required
              />

              <label>Email</label>

              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="Enter email address"
              />
            </>
          )}

          <label>Mobile Number</label>

          <input
            type="tel"
            value={mobileNumber}
            onChange={(e) =>
              setMobileNumber(e.target.value)
            }
            placeholder="Enter mobile number"
            maxLength="15"
            required
          />

          <label>Password</label>

          <input
            type="password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            placeholder="Enter password"
            required
          />

          {!isLogin && (
            <>
              <label>Account Type</label>

              <select
                value={role}
                onChange={(e) => {
                  setRole(e.target.value);
                  setDistrict("");
                }}
              >
                <option value="farmer">
                  Farmer
                </option>

                <option value="government">
                  Government
                </option>
              </select>

              {role === "farmer" && (
                <div>
                  <h3 style={styles.sectionTitle}>
                    Farmer Information
                  </h3>

                  <label>Farmer ID</label>

                  <input
                    type="text"
                    value={farmerId}
                    onChange={(e) =>
                      setFarmerId(e.target.value)
                    }
                    placeholder="Enter farmer ID"
                  />

                  <label>Village</label>

                  <input
                    type="text"
                    value={village}
                    onChange={(e) =>
                      setVillage(e.target.value)
                    }
                    placeholder="Enter village"
                  />

                  <label>Mandal</label>

                  <input
                    type="text"
                    value={mandal}
                    onChange={(e) =>
                      setMandal(e.target.value)
                    }
                    placeholder="Enter mandal"
                  />

                  <label>District</label>

                  <select
                    value={district}
                    onChange={(e) =>
                      setDistrict(e.target.value)
                    }
                    required
                  >
                    <option value="">
                      Select District
                    </option>

                    {districts.map((item) => (
                      <option
                        key={item}
                        value={item}
                      >
                        {item}
                      </option>
                    ))}
                  </select>

                  <label>
                    Land Area (Acres)
                  </label>

                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={landArea}
                    onChange={(e) =>
                      setLandArea(e.target.value)
                    }
                    placeholder="Enter land area"
                  />

                  <label>
                    Primary Crop
                  </label>

                  <select
                    value={primaryCrop}
                    onChange={(e) =>
                      setPrimaryCrop(e.target.value)
                    }
                  >
                    {crops.map((item) => (
                      <option
                        key={item}
                        value={item}
                      >
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {role === "government" && (
                <div>
                  <h3 style={styles.sectionTitle}>
                    Government Information
                  </h3>

                  <label>Department</label>

                  <input
                    type="text"
                    value={department}
                    onChange={(e) =>
                      setDepartment(e.target.value)
                    }
                    placeholder="Agriculture Department"
                    required
                  />

                  <label>Designation</label>

                  <input
                    type="text"
                    value={designation}
                    onChange={(e) =>
                      setDesignation(e.target.value)
                    }
                    placeholder="Enter designation"
                    required
                  />

                  <label>District</label>

                  <select
                    value={district}
                    onChange={(e) =>
                      setDistrict(e.target.value)
                    }
                    required
                  >
                    <option value="">
                      Select District
                    </option>

                    {districts.map((item) => (
                      <option
                        key={item}
                        value={item}
                      >
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            style={styles.primaryButton}
          >
            {loading
              ? "Please wait..."
              : isLogin
              ? "Login"
              : "Create Account"}
          </button>
        </form>

        {message && (
          <p
            style={{
              ...styles.message,
              color: message.includes(
                "successfully"
              )
                ? "green"
                : "red",
            }}
          >
            {message}
          </p>
        )}

        <button
          style={styles.linkButton}
          onClick={() => {
            setIsLogin(!isLogin);
            setMessage("");
            resetFields();
          }}
        >
          {isLogin
            ? "Create Account"
            : "Go to Login"}
        </button>
      </div>
    </div>
  );
}

// =====================================================
// DASHBOARD
// =====================================================

function Dashboard({
  user,
  logout,
  openPrediction,
  openProcurement,
  openWarehouse,
  openTransport,
}) {
  return (
    <div style={styles.dashboard}>
      <header style={styles.header}>
        <div>
          <h1>
            Smart Procurement Planning
          </h1>

          <p>
            Welcome,{" "}
            {user.role === "farmer"
              ? "Farmer"
              : "Government User"}
          </p>
        </div>

        <button
          onClick={logout}
          style={styles.logout}
        >
          Logout
        </button>
      </header>

      <main style={styles.main}>
        <h2>
          {user.role === "farmer"
            ? "Farmer Dashboard"
            : "Government Dashboard"}
        </h2>

        <div style={styles.cards}>
          {user.role === "farmer" && (
            <>
              <DashboardCard
                title="Crop Prediction"
                description="Predict expected crop production using historical data."
                onClick={openPrediction}
              />

              <DashboardCard
                title="Procurement Planning"
                description="Predict available procurement capacity."
                onClick={openProcurement}
              />

              <DashboardCard
                title="Warehouse"
                description="Check warehouse capacity."
                onClick={openWarehouse}
              />

              <DashboardCard
                title="Transport Cost"
                description="Calculate transportation cost based on vehicle capacity, trips, distance, fuel and operating costs."
                onClick={openTransport}
              />

              <DashboardCard
                title="Reports"
                description="View procurement reports."
              />
            </>
          )}

          {user.role === "government" && (
            <>
              <DashboardCard
                title="Procurement Overview"
                description="Monitor procurement activities."
              />

              <DashboardCard
                title="Warehouse Management"
                description="Monitor warehouse capacity."
                onClick={openWarehouse}
              />

              <DashboardCard
                title="Farmer Data"
                description="View registered farmers."
              />

              <DashboardCard
                title="Transport Cost"
                description="Estimate transportation cost for agricultural procurement."
                onClick={openTransport}
              />

              <DashboardCard
                title="Reports"
                description="View government reports."
              />
            </>
          )}
        </div>
      </main>
    </div>
  );
}

// =====================================================
// ADMIN DASHBOARD
// =====================================================

function AdminDashboard({
  user,
  logout,
  openTraining,
  openUpload,
  openViewData,
  openTrain,
}) {
  return (
    <div style={styles.dashboard}>
      <header style={styles.adminHeader}>
        <div>
          <h1>
            Smart Procurement Planning
          </h1>

          <p>
            Welcome, Administrator
          </p>
        </div>

        <button
          onClick={logout}
          style={styles.logout}
        >
          Logout
        </button>
      </header>

      <main style={styles.main}>
        <div style={styles.adminWelcome}>
          <h2>Admin Dashboard</h2>

          <p>
            Manage historical crop data and train
            the crop prediction model.
          </p>

          <div style={styles.adminInfo}>
            <p>
              <b>Mobile:</b>{" "}
              {user.mobile_number}
            </p>

            <p>
              <b>Department:</b>{" "}
              {user.department ||
                "Agriculture Department"}
            </p>

            <p>
              <b>Designation:</b>{" "}
              {user.designation ||
                "System Administrator"}
            </p>
          </div>
        </div>

        <div style={styles.cards}>
          <DashboardCard
            title="Upload Dataset"
            description="Upload a CSV or Excel dataset containing historical crop production records."
            onClick={openUpload}
          />

          <DashboardCard
            title="Add Historical Data"
            description="Enter previous crop production records for model training."
            onClick={openTraining}
          />

          <DashboardCard
            title="View Training Data"
            description="View and manage historical records stored in PostgreSQL."
            onClick={openViewData}
          />

          <DashboardCard
            title="Train Crop Model"
            description="Train the prediction model using stored historical data."
            onClick={openTrain}
          />
        </div>
      </main>
    </div>
  );
}

// =====================================================
// ADMIN - ADD TRAINING DATA
// =====================================================

function AdminTrainingData({
  user,
  goBack,
}) {
  const [district, setDistrict] =
    useState("Guntur");

  const [crop, setCrop] =
    useState("Paddy");

  const [season, setSeason] =
    useState("Kharif");

  const [year, setYear] = useState("");
  const [area, setArea] = useState("");
  const [production, setProduction] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setLoading(true);

    try {
      const response = await axios.post(
        ADMIN_TRAINING_API,
        {
          district,
          crop,
          season,
          year: Number(year),
          area: Number(area),
          production: Number(production),
        },
        {
          headers: {
            "X-Admin-Mobile":
              user.mobile_number,
          },
        }
      );

      setMessage(
        response.data.message ||
          "Training data saved successfully."
      );

      setYear("");
      setArea("");
      setProduction("");
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.message ||
          "Unable to save training data."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout
      title="Add Historical Training Data"
      goBack={goBack}
    >
      <div style={styles.predictionCard}>
        <h2>
          Historical Crop Production Data
        </h2>

        <p style={styles.helpText}>
          Enter previous real-world crop production
          records. These records will be used to
          train the prediction model.
        </p>

        <form onSubmit={handleSubmit}>
          <label>District</label>

          <select
            value={district}
            onChange={(e) =>
              setDistrict(e.target.value)
            }
            required
          >
            {districts.map((item) => (
              <option
                key={item}
                value={item}
              >
                {item}
              </option>
            ))}
          </select>

          <label>Crop</label>

          <select
            value={crop}
            onChange={(e) =>
              setCrop(e.target.value)
            }
            required
          >
            {crops.map((item) => (
              <option
                key={item}
                value={item}
              >
                {item}
              </option>
            ))}
          </select>

          <label>Season</label>

          <select
            value={season}
            onChange={(e) =>
              setSeason(e.target.value)
            }
            required
          >
            {seasons.map((item) => (
              <option
                key={item}
                value={item}
              >
                {item}
              </option>
            ))}
          </select>

          <label>Year</label>

          <input
            type="number"
            min="1900"
            max="2100"
            value={year}
            onChange={(e) =>
              setYear(e.target.value)
            }
            placeholder="Example: 2020"
            required
          />

          <label>Area (Acres)</label>

          <input
            type="number"
            min="0"
            step="0.01"
            value={area}
            onChange={(e) =>
              setArea(e.target.value)
            }
            placeholder="Example: 100"
            required
          />

          <label>
            Production (Tons)
          </label>

          <input
            type="number"
            min="0"
            step="0.01"
            value={production}
            onChange={(e) =>
              setProduction(e.target.value)
            }
            placeholder="Example: 350"
            required
          />

          <button
            type="submit"
            disabled={loading}
            style={styles.primaryButton}
          >
            {loading
              ? "Saving..."
              : "Save Historical Data"}
          </button>
        </form>

        {message && (
          <div style={styles.messageBox}>
            {message}
          </div>
        )}
      </div>
    </PageLayout>
  );
}

// =====================================================
// ADMIN - VIEW TRAINING DATA
// =====================================================

function AdminViewData({
  user,
  goBack,
}) {
  const [records, setRecords] =
    useState([]);

  const [count, setCount] =
    useState(0);

  const [message, setMessage] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const loadData = async () => {
    setLoading(true);
    setMessage("");

    try {
      const response = await axios.get(
        ADMIN_TRAINING_API,
        {
          headers: {
            "X-Admin-Mobile":
              user.mobile_number,
          },
        }
      );

      setRecords(
        response.data.data || []
      );

      setCount(
        response.data.count || 0
      );
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.message ||
          "Unable to load training data."
      );
    } finally {
      setLoading(false);
    }
  };

  const deleteRecord = async (id) => {
    const confirmed =
      window.confirm(
        "Delete this training record?"
      );

    if (!confirmed) {
      return;
    }

    try {
      await axios.delete(
        `${ADMIN_TRAINING_API}/${id}`,
        {
          headers: {
            "X-Admin-Mobile":
              user.mobile_number,
          },
        }
      );

      loadData();
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.message ||
          "Unable to delete record."
      );
    }
  };

  return (
    <PageLayout
      title="Training Data"
      goBack={goBack}
    >
      <div style={styles.fullCard}>
        <div style={styles.dataHeader}>
          <div>
            <h2>
              Historical Training Data
            </h2>

            <p>
              Total Records:{" "}
              <b>{count}</b>
            </p>
          </div>

          <button
            onClick={loadData}
            style={
              styles.primarySmallButton
            }
          >
            {loading
              ? "Loading..."
              : "Refresh"}
          </button>
        </div>

        {message && (
          <p style={styles.error}>
            {message}
          </p>
        )}

        {records.length === 0 ? (
          <div style={styles.emptyBox}>
            <h3>
              No training data loaded
            </h3>

            <p>
              Click Refresh to load the
              records.
            </p>
          </div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>District</th>
                  <th>Crop</th>
                  <th>Season</th>
                  <th>Year</th>
                  <th>Area</th>
                  <th>Production</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {records.map((record) => (
                  <tr key={record.id}>
                    <td>{record.id}</td>
                    <td>
                      {record.district}
                    </td>
                    <td>
                      {record.crop}
                    </td>
                    <td>
                      {record.season}
                    </td>
                    <td>
                      {record.year}
                    </td>
                    <td>
                      {record.area}
                    </td>
                    <td>
                      {record.production}
                    </td>

                    <td>
                      <button
                        onClick={() =>
                          deleteRecord(
                            record.id
                          )
                        }
                        style={
                          styles.deleteButton
                        }
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageLayout>
  );
}

// =====================================================
// ADMIN - TRAIN MODEL
// =====================================================

function AdminTrainModel({
  user,
  goBack,
}) {
  const [result, setResult] =
    useState(null);

  const [message, setMessage] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const trainModel = async () => {
    setLoading(true);
    setMessage("");
    setResult(null);

    try {
      const response = await axios.post(
        ADMIN_TRAIN_API,
        {},
        {
          headers: {
            "X-Admin-Mobile":
              user.mobile_number,
          },
        }
      );

      setResult(response.data);
    } catch (error) {
      console.error(error);

      if (
        error.response?.data?.records !==
        undefined
      ) {
        setMessage(
          `${error.response.data.message} Records available: ${error.response.data.records}`
        );
      } else {
        setMessage(
          error.response?.data?.message ||
            "Model training failed."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout
      title="Train Crop Prediction Model"
      goBack={goBack}
    >
      <div style={styles.predictionCard}>
        <h2>Model Training</h2>

        <p style={styles.helpText}>
          The model will use all historical
          records stored in PostgreSQL.
        </p>

        <div style={styles.trainingInfo}>
          <p>
            <b>Algorithm:</b>{" "}
            Random Forest Regressor
          </p>

          <p>
            <b>Features:</b> District, Crop,
            Season, Year, Area
          </p>

          <p>
            <b>Target:</b> Production
          </p>
        </div>

        <button
          onClick={trainModel}
          disabled={loading}
          style={styles.primaryButton}
        >
          {loading
            ? "Training Model..."
            : "Train Model"}
        </button>

        {message && (
          <div style={styles.errorBox}>
            {message}
          </div>
        )}

        {result && (
          <div style={styles.trainingResult}>
            <h2>
              ✅ Model Trained Successfully
            </h2>

            <div style={styles.metricGrid}>
              <div style={styles.metricCard}>
                <span>
                  Records Used
                </span>

                <strong>
                  {result.records_used}
                </strong>
              </div>

              <div style={styles.metricCard}>
                <span>MAE</span>

                <strong>
                  {
                    result.mean_absolute_error
                  }
                </strong>
              </div>

              <div style={styles.metricCard}>
                <span>R² Score</span>

                <strong>
                  {result.r2_score}
                </strong>
              </div>
            </div>

            <p>
              <b>Model:</b>{" "}
              {result.model}
            </p>

            <p>
              The trained model has been saved
              and will be used for future crop
              predictions.
            </p>
          </div>
        )}
      </div>
    </PageLayout>
  );
}

// =====================================================
// CROP PREDICTION
// =====================================================

function CropPrediction({
  goBack,
}) {
  const [district, setDistrict] =
    useState("Guntur");

  const [crop, setCrop] =
    useState("Paddy");

  const [season, setSeason] =
    useState("Kharif");

  const [year, setYear] =
    useState(new Date().getFullYear());

  const [area, setArea] =
    useState("");

  const [prediction, setPrediction] =
    useState(null);

  const [message, setMessage] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const handlePrediction = async (e) => {
    e.preventDefault();

    setPrediction(null);
    setMessage("");
    setLoading(true);

    try {
      const response = await axios.post(
        PREDICTION_API,
        {
          district,
          crop,
          season,
          year: Number(year),
          area: Number(area),
        }
      );

      setPrediction(
        response.data.predicted_production
      );
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.message ||
          "Prediction failed."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout
      title="Crop Prediction"
      goBack={goBack}
    >
      <div style={styles.predictionCard}>
        <h2>
          Predict Crop Production
        </h2>

        <p style={styles.helpText}>
          Prediction is generated using the
          model trained by the administrator
          from historical crop production data.
        </p>

        <form onSubmit={handlePrediction}>
          <label>District</label>

          <select
            value={district}
            onChange={(e) =>
              setDistrict(e.target.value)
            }
          >
            {districts.map((item) => (
              <option
                key={item}
                value={item}
              >
                {item}
              </option>
            ))}
          </select>

          <label>Crop</label>

          <select
            value={crop}
            onChange={(e) =>
              setCrop(e.target.value)
            }
          >
            {crops.map((item) => (
              <option
                key={item}
                value={item}
              >
                {item}
              </option>
            ))}
          </select>

          <label>Season</label>

          <select
            value={season}
            onChange={(e) =>
              setSeason(e.target.value)
            }
          >
            {seasons.map((item) => (
              <option
                key={item}
                value={item}
              >
                {item}
              </option>
            ))}
          </select>

          <label>Year</label>

          <input
            type="number"
            min="1900"
            max="2100"
            value={year}
            onChange={(e) =>
              setYear(e.target.value)
            }
            required
          />

          <label>
            Cultivated Area (Acres)
          </label>

          <input
            type="number"
            min="0"
            step="0.01"
            value={area}
            onChange={(e) =>
              setArea(e.target.value)
            }
            placeholder="Enter cultivated area"
            required
          />

          <button
            type="submit"
            disabled={loading}
            style={styles.primaryButton}
          >
            {loading
              ? "Predicting..."
              : "Predict Production"}
          </button>
        </form>

        {prediction !== null && (
          <div style={styles.result}>
            <h3>
              Prediction Result
            </h3>

            <p>
              District: <b>{district}</b>
            </p>

            <p>
              Crop: <b>{crop}</b>
            </p>

            <p>
              Season: <b>{season}</b>
            </p>

            <p>
              Year: <b>{year}</b>
            </p>

            <p>
              Area: <b>{area} acres</b>
            </p>

            <h2>
              Predicted Production:{" "}
              {Number(prediction).toFixed(2)} tons
            </h2>
          </div>
        )}

        {message && (
          <p style={styles.error}>
            {message}
          </p>
        )}
      </div>
    </PageLayout>
  );
}

// =====================================================
// PROCUREMENT PLANNING
// =====================================================

function ProcurementPlanning({
  goBack,
}) {
  const [district, setDistrict] =
    useState("Guntur");

  const [crop, setCrop] =
    useState("Paddy");

  const [quantity, setQuantity] =
    useState("");

  const [moisture, setMoisture] =
    useState("");

  const [msp, setMsp] =
    useState("");

  const [marketPrice, setMarketPrice] =
    useState("");

  const [distance, setDistance] =
    useState("");

  const [totalCapacity, setTotalCapacity] =
    useState("");

  const [consumedCapacity, setConsumedCapacity] =
    useState("");

  const [prediction, setPrediction] =
    useState(null);

  const [message, setMessage] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const handlePrediction = async (e) => {
    e.preventDefault();

    setPrediction(null);
    setMessage("");
    setLoading(true);

    try {
      const response = await axios.post(
        PROCUREMENT_API,
        {
          District: district,
          Crop_Name: crop,
          Procurement_Season: "Kharif",
          Quantity_Tons: Number(quantity),
          Moisture_Percent: Number(moisture),
          MSP_per_Ton: Number(msp),
          Market_Price_per_Ton:
            Number(marketPrice),
          Distance_KM: Number(distance),
          Total_Capacity_Tons:
            Number(totalCapacity),
          Consumed_Capacity_Tons:
            Number(consumedCapacity),
        }
      );

      setPrediction(
        response.data
          .predicted_available_capacity
      );
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.message ||
          "Procurement prediction failed."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout
      title="Procurement Planning"
      goBack={goBack}
    >
      <div style={styles.predictionCard}>
        <h2>
          Procurement Capacity Prediction
        </h2>

        <form onSubmit={handlePrediction}>
          <label>District</label>

          <select
            value={district}
            onChange={(e) =>
              setDistrict(e.target.value)
            }
          >
            {districts.map((item) => (
              <option
                key={item}
                value={item}
              >
                {item}
              </option>
            ))}
          </select>

          <label>Crop</label>

          <select
            value={crop}
            onChange={(e) =>
              setCrop(e.target.value)
            }
          >
            {crops.map((item) => (
              <option
                key={item}
                value={item}
              >
                {item}
              </option>
            ))}
          </select>

          <label>
            Procurement Season
          </label>

          <input
            value="Kharif"
            readOnly
          />

          <label>
            Quantity (Tons)
          </label>

          <input
            type="number"
            step="0.01"
            min="0"
            value={quantity}
            onChange={(e) =>
              setQuantity(e.target.value)
            }
            required
          />

          <label>
            Moisture (%)
          </label>

          <input
            type="number"
            step="0.01"
            min="0"
            value={moisture}
            onChange={(e) =>
              setMoisture(e.target.value)
            }
            required
          />

          <label>
            MSP per Ton
          </label>

          <input
            type="number"
            step="0.01"
            min="0"
            value={msp}
            onChange={(e) =>
              setMsp(e.target.value)
            }
            required
          />

          <label>
            Market Price per Ton
          </label>

          <input
            type="number"
            step="0.01"
            min="0"
            value={marketPrice}
            onChange={(e) =>
              setMarketPrice(e.target.value)
            }
            required
          />

          <label>
            Distance (KM)
          </label>

          <input
            type="number"
            step="0.01"
            min="0"
            value={distance}
            onChange={(e) =>
              setDistance(e.target.value)
            }
            required
          />

          <label>
            Total Warehouse Capacity (Tons)
          </label>

          <input
            type="number"
            step="0.01"
            min="0"
            value={totalCapacity}
            onChange={(e) =>
              setTotalCapacity(e.target.value)
            }
            required
          />

          <label>
            Consumed Capacity (Tons)
          </label>

          <input
            type="number"
            step="0.01"
            min="0"
            value={consumedCapacity}
            onChange={(e) =>
              setConsumedCapacity(
                e.target.value
              )
            }
            required
          />

          <button
            type="submit"
            disabled={loading}
            style={styles.primaryButton}
          >
            {loading
              ? "Predicting..."
              : "Predict Available Capacity"}
          </button>
        </form>

        {prediction !== null && (
          <div style={styles.result}>
            <h3>
              Procurement Prediction Result
            </h3>

            <p>
              District: <b>{district}</b>
            </p>

            <p>
              Crop: <b>{crop}</b>
            </p>

            <p>
              Quantity:{" "}
              <b>{quantity} tons</b>
            </p>

            <h2>
              Predicted Available Capacity:{" "}
              {Number(prediction).toFixed(2)}
              {" "}tons
            </h2>
          </div>
        )}

        {message && (
          <p style={styles.error}>
            {message}
          </p>
        )}
      </div>
    </PageLayout>
  );
}

// =====================================================
// WAREHOUSE
// =====================================================

function WarehouseManagement({
  goBack,
}) {
  const [totalCapacity, setTotalCapacity] =
    useState("");

  const [consumedCapacity, setConsumedCapacity] =
    useState("");

  const [procurementQuantity, setProcurementQuantity] =
    useState("");

  const [result, setResult] =
    useState(null);

  const [message, setMessage] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const handleCheck = async (e) => {
    e.preventDefault();

    setResult(null);
    setMessage("");
    setLoading(true);

    try {
      const response = await axios.post(
        WAREHOUSE_API,
        {
          total_capacity:
            Number(totalCapacity),

          consumed_capacity:
            Number(consumedCapacity),

          procurement_quantity:
            Number(procurementQuantity),
        }
      );

      setResult(response.data);
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.message ||
          "Warehouse check failed."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout
      title="Warehouse Management"
      goBack={goBack}
    >
      <div style={styles.predictionCard}>
        <h2>
          Check Warehouse Capacity
        </h2>

        <form onSubmit={handleCheck}>
          <label>
            Total Warehouse Capacity (Tons)
          </label>

          <input
            type="number"
            step="0.01"
            min="0"
            value={totalCapacity}
            onChange={(e) =>
              setTotalCapacity(
                e.target.value
              )
            }
            required
          />

          <label>
            Consumed Capacity (Tons)
          </label>

          <input
            type="number"
            step="0.01"
            min="0"
            value={consumedCapacity}
            onChange={(e) =>
              setConsumedCapacity(
                e.target.value
              )
            }
            required
          />

          <label>
            Procurement Quantity (Tons)
          </label>

          <input
            type="number"
            step="0.01"
            min="0"
            value={procurementQuantity}
            onChange={(e) =>
              setProcurementQuantity(
                e.target.value
              )
            }
            required
          />

          <button
            type="submit"
            disabled={loading}
            style={styles.primaryButton}
          >
            {loading
              ? "Checking..."
              : "Check Capacity"}
          </button>
        </form>

        {result && (
          <div style={styles.result}>
            <h3>
              Warehouse Capacity Result
            </h3>

            <p>
              Total Capacity:{" "}
              <b>
                {Number(
                  result.total_capacity
                ).toFixed(2)}{" "}
                tons
              </b>
            </p>

            <p>
              Consumed Capacity:{" "}
              <b>
                {Number(
                  result.consumed_capacity
                ).toFixed(2)}{" "}
                tons
              </b>
            </p>

            <p>
              Available Capacity:{" "}
              <b>
                {Number(
                  result.available_capacity
                ).toFixed(2)}{" "}
                tons
              </b>
            </p>

            <p>
              Procurement Quantity:{" "}
              <b>
                {Number(
                  result.procurement_quantity
                ).toFixed(2)}{" "}
                tons
              </b>
            </p>

            <p>
              Remaining Capacity:{" "}
              <b>
                {Number(
                  result.remaining_capacity
                ).toFixed(2)}{" "}
                tons
              </b>
            </p>

            <h2>
              {result.status}
            </h2>
          </div>
        )}

        {message && (
          <p style={styles.error}>
            {message}
          </p>
        )}
      </div>
    </PageLayout>
  );
}

// =====================================================
// TRANSPORT COST
// =====================================================

function TransportCost({ goBack }) {
  const [crop, setCrop] = useState("Paddy");
  const [quantity, setQuantity] = useState("");
  const [distance, setDistance] = useState("");
  const [vehicleType, setVehicleType] = useState("Large Truck");
  const [fuelPrice, setFuelPrice] = useState("95");
  const [fuelEfficiency, setFuelEfficiency] = useState("");
  const [driverCost, setDriverCost] = useState("");
  const [loadingCost, setLoadingCost] = useState("");
  const [unloadingCost, setUnloadingCost] = useState("");

  const [result, setResult] = useState(null);
  const [comparison, setComparison] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const vehicles = {
    "Mini Truck": {
      capacity: 5,
      efficiency: 8,
      driverCost: 800,
    },

    "Medium Truck": {
      capacity: 10,
      efficiency: 6,
      driverCost: 1200,
    },

    "Large Truck": {
      capacity: 20,
      efficiency: 5,
      driverCost: 1800,
    },

    "Heavy Truck": {
      capacity: 30,
      efficiency: 4,
      driverCost: 2500,
    },
  };

  const selectedVehicle =
    vehicles[vehicleType] || vehicles["Large Truck"];

  useEffect(() => {
    setFuelEfficiency(
      String(selectedVehicle.efficiency)
    );

    setDriverCost(
      String(selectedVehicle.driverCost)
    );
  }, [vehicleType]);

  const calculateForVehicle = (name) => {
    const vehicle = vehicles[name];

    const qty = Number(quantity);
    const dist = Number(distance);
    const fuel = Number(fuelPrice);
    const efficiency = Number(vehicle.efficiency);
    const driver = Number(vehicle.driverCost);
    const load = Number(loadingCost);
    const unload = Number(unloadingCost);

    const trips = Math.ceil(
      qty / vehicle.capacity
    );

    const totalDistance =
      trips * dist * 2;

    const fuelRequired =
      totalDistance / efficiency;

    const fuelCost =
      fuelRequired * fuel;

    const driverTotal =
      trips * driver;

    const loadingTotal =
      qty * load;

    const unloadingTotal =
      qty * unload;

    const totalCost =
      fuelCost +
      driverTotal +
      loadingTotal +
      unloadingTotal;

    return {
      vehicleType: name,
      capacity: vehicle.capacity,
      efficiency,
      trips,
      totalDistance,
      fuelRequired,
      fuelCost,
      driverCost: driverTotal,
      loadingCost: loadingTotal,
      unloadingCost: unloadingTotal,
      totalCost,
      costPerTon:
        qty > 0 ? totalCost / qty : 0,
    };
  };

  const handleCalculate = async (e) => {
    e.preventDefault();

    setMessage("");
    setResult(null);
    setComparison([]);

    if (
      !crop ||
      Number(quantity) <= 0 ||
      Number(distance) <= 0 ||
      Number(fuelPrice) <= 0 ||
      Number(fuelEfficiency) <= 0 ||
      Number(driverCost) < 0 ||
      Number(loadingCost) < 0 ||
      Number(unloadingCost) < 0
    ) {
      setMessage(
        "Please enter valid transport details."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${API}/transport/calculate`,
        {
          crop,
          quantity: Number(quantity),
          distance: Number(distance),
          vehicle_capacity:
            Number(selectedVehicle.capacity),
          cost_per_km: Number(fuelPrice),
          loading_cost: Number(loadingCost),
        }
      );

      const apiData = response.data?.data;

      const calculated =
        calculateForVehicle(vehicleType);

      const finalResult = {
        ...calculated,
        crop,
        quantity: Number(quantity),
        distance: Number(distance),
      };

      if (apiData) {
        finalResult.apiData = apiData;
      }

      setResult(finalResult);

      const allVehicles =
        Object.keys(vehicles)
          .map(calculateForVehicle)
          .sort(
            (a, b) =>
              a.totalCost - b.totalCost
          );

      setComparison(allVehicles);

      setMessage(
        response.data?.message ||
        "Transport cost calculated successfully."
      );
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.message ||
        "Transport calculation failed. Please check the backend."
      );
    } finally {
      setLoading(false);
    }
  };

  const resetCalculator = () => {
    setCrop("Paddy");
    setQuantity("");
    setDistance("");
    setVehicleType("Large Truck");
    setFuelPrice("95");
    setFuelEfficiency(
      String(vehicles["Large Truck"].efficiency)
    );
    setDriverCost(
      String(vehicles["Large Truck"].driverCost)
    );
    setLoadingCost("");
    setUnloadingCost("");
    setResult(null);
    setComparison([]);
    setMessage("");
  };

  return (
    <PageLayout
      title="Transport Cost Calculator"
      goBack={goBack}
    >
      <div style={styles.largeCard}>

        <h2>🚛 Transport Planning</h2>

        <p style={styles.helpText}>
          Calculate transportation cost based on
          quantity, distance, vehicle capacity,
          fuel efficiency and operating costs.
        </p>

        <form onSubmit={handleCalculate}>

          {/* CROP */}

          <label>Crop</label>

          <select
            value={crop}
            onChange={(e) =>
              setCrop(e.target.value)
            }
          >
            <option>Paddy</option>
            <option>Black Gram</option>
            <option>Green Gram</option>
            <option>Groundnut</option>
            <option>Maize</option>
            <option>Red Gram</option>
            <option>Cotton</option>
            <option>Sunflower</option>
          </select>

          {/* QUANTITY */}

          <label>
            Quantity (Tons)
          </label>

          <input
            type="number"
            min="0.01"
            step="0.01"
            value={quantity}
            onChange={(e) =>
              setQuantity(e.target.value)
            }
            required
          />

          {/* DISTANCE */}

          <label>
            One-Way Distance (KM)
          </label>

          <input
            type="number"
            min="0.1"
            step="0.1"
            value={distance}
            onChange={(e) =>
              setDistance(e.target.value)
            }
            required
          />

          {/* VEHICLE */}

          <label>
            Vehicle Type
          </label>

          <select
            value={vehicleType}
            onChange={(e) =>
              setVehicleType(e.target.value)
            }
          >
            {Object.entries(vehicles).map(
              ([name, data]) => (
                <option
                  key={name}
                  value={name}
                >
                  {name} - {data.capacity} Tons
                </option>
              )
            )}
          </select>

          {/* VEHICLE INFORMATION */}

          <div style={styles.vehicleInfo}>

            <h3>
              🚛 Selected Vehicle
            </h3>

            <div style={styles.vehicleGrid}>

              <div>
                <span>Capacity</span>

                <strong>
                  {selectedVehicle.capacity} Tons
                </strong>
              </div>

              <div>
                <span>
                  Default Efficiency
                </span>

                <strong>
                  {selectedVehicle.efficiency} KM/L
                </strong>
              </div>

              <div>
                <span>
                  Default Driver Cost
                </span>

                <strong>
                  ₹{selectedVehicle.driverCost}
                </strong>
              </div>

            </div>
          </div>

          {/* FUEL */}

          <label>
            Fuel Price (₹ / Litre)
          </label>

          <input
            type="number"
            min="0.01"
            step="0.01"
            value={fuelPrice}
            onChange={(e) =>
              setFuelPrice(e.target.value)
            }
            required
          />

          {/* EFFICIENCY */}

          <label>
            Vehicle Fuel Efficiency (KM/L)
          </label>

          <input
            type="number"
            min="0.1"
            step="0.1"
            value={fuelEfficiency}
            onChange={(e) =>
              setFuelEfficiency(e.target.value)
            }
            required
          />

          {/* DRIVER */}

          <label>
            Driver Cost per Trip (₹)
          </label>

          <input
            type="number"
            min="0"
            step="0.01"
            value={driverCost}
            onChange={(e) =>
              setDriverCost(e.target.value)
            }
            required
          />

          {/* LOADING */}

          <label>
            Loading Cost per Ton (₹)
          </label>

          <input
            type="number"
            min="0"
            step="0.01"
            value={loadingCost}
            onChange={(e) =>
              setLoadingCost(e.target.value)
            }
            required
          />

          {/* UNLOADING */}

          <label>
            Unloading Cost per Ton (₹)
          </label>

          <input
            type="number"
            min="0"
            step="0.01"
            value={unloadingCost}
            onChange={(e) =>
              setUnloadingCost(e.target.value)
            }
            required
          />

          {/* BUTTON */}

          <button
            type="submit"
            style={styles.primaryButton}
            disabled={loading}
          >
            {loading
              ? "Calculating..."
              : "Calculate Transport Cost"}
          </button>

          <button
            type="button"
            onClick={resetCalculator}
            style={{
              ...styles.primaryButton,
              background: "#666",
            }}
          >
            Reset
          </button>

        </form>

        {/* MESSAGE */}

        {message && (
          <div style={styles.messageBox}>
            {message}
          </div>
        )}

        {/* RESULT */}

        {result && (
          <div style={styles.result}>

            <h2>
              🚚 Transport Cost Result
            </h2>

            <p>
              <b>Crop:</b> {result.crop}
            </p>

            <p>
              <b>Quantity:</b>{" "}
              {result.quantity.toFixed(2)} tons
            </p>

            <p>
              <b>One-Way Distance:</b>{" "}
              {result.distance.toFixed(2)} km
            </p>

            <p>
              <b>Vehicle:</b>{" "}
              {result.vehicleType}
            </p>

            <p>
              <b>Vehicle Capacity:</b>{" "}
              {result.capacity} tons
            </p>

            <p>
              <b>Fuel Efficiency:</b>{" "}
              {result.efficiency} KM/L
            </p>

            <hr />

            <div
              style={
                styles.transportMetricGrid
              }
            >

              <div style={styles.transportMetric}>
                <span>Required Trips</span>
                <strong>{result.trips}</strong>
              </div>

              <div style={styles.transportMetric}>
                <span>Total Distance</span>
                <strong>
                  {result.totalDistance.toFixed(2)} km
                </strong>
              </div>

              <div style={styles.transportMetric}>
                <span>Fuel Required</span>
                <strong>
                  {result.fuelRequired.toFixed(2)} L
                </strong>
              </div>

            </div>

            <p>
              <b>Fuel Cost:</b>{" "}
              ₹{result.fuelCost.toFixed(2)}
            </p>

            <p>
              <b>Driver Cost:</b>{" "}
              ₹{result.driverCost.toFixed(2)}
            </p>

            <p>
              <b>Loading Cost:</b>{" "}
              ₹{result.loadingCost.toFixed(2)}
            </p>

            <p>
              <b>Unloading Cost:</b>{" "}
              ₹{result.unloadingCost.toFixed(2)}
            </p>

            <hr />

            <h2>
              Total Transport Cost: ₹
              {result.totalCost.toFixed(2)}
            </h2>

            <h3>
              Cost per Ton: ₹
              {result.costPerTon.toFixed(2)}
            </h3>

          </div>
        )}

        {/* VEHICLE COMPARISON */}

        {comparison.length > 0 && (
          <div style={styles.comparisonCard}>

            <h2>
              🚛 Vehicle Cost Comparison
            </h2>

            <p style={styles.helpText}>
              The system compares all available
              vehicle types for the same quantity,
              distance and fuel price.
            </p>

            <div style={styles.tableWrapper}>

              <table style={styles.table}>

                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>Capacity</th>
                    <th>Efficiency</th>
                    <th>Trips</th>
                    <th>Total Distance</th>
                    <th>Fuel</th>
                    <th>Total Cost</th>
                    <th>Cost / Ton</th>
                  </tr>
                </thead>

                <tbody>

                  {comparison.map(
                    (item, index) => (
                      <tr
                        key={item.vehicleType}
                      >

                        <td>
                          {index === 0 && (
                            <span
                              style={
                                styles.bestBadge
                              }
                            >
                              BEST
                            </span>
                          )}

                          {" "}
                          {item.vehicleType}
                        </td>

                        <td>
                          {item.capacity} Tons
                        </td>

                        <td>
                          {item.efficiency} KM/L
                        </td>

                        <td>
                          {item.trips}
                        </td>

                        <td>
                          {item.totalDistance.toFixed(2)}
                          {" "}km
                        </td>

                        <td>
                          {item.fuelRequired.toFixed(2)}
                          {" "}L
                        </td>

                        <td>
                          ₹{item.totalCost.toFixed(2)}
                        </td>

                        <td>
                          ₹{item.costPerTon.toFixed(2)}
                        </td>

                      </tr>
                    )
                  )}

                </tbody>
              </table>
            </div>

            {/* RECOMMENDATION */}

            <div style={styles.recommendationBox}>

              <h3>
                ⭐ Recommended Vehicle
              </h3>

              <p>
                For <b>{quantity} tons</b> over{" "}
                <b>{distance} km</b>, the lowest
                estimated transport cost is with{" "}
                <b>
                  {comparison[0].vehicleType}
                </b>.
              </p>

              <p>
                Vehicle Capacity:{" "}
                <b>
                  {comparison[0].capacity} Tons
                </b>
              </p>

              <p>
                Required Trips:{" "}
                <b>{comparison[0].trips}</b>
              </p>

              <p>
                Estimated Cost:{" "}
                <b>
                  ₹{comparison[0].totalCost.toFixed(2)}
                </b>
              </p>

              <p>
                Cost per Ton:{" "}
                <b>
                  ₹{comparison[0].costPerTon.toFixed(2)}
                </b>
              </p>

            </div>

          </div>
        )}

      </div>
    </PageLayout>
  );
}

// =====================================================
// ADMIN - UPLOAD DATASET
// =====================================================

function AdminUploadDataset({
  user,
  goBack,
}) {
  const [file, setFile] =
    useState(null);

  const [result, setResult] =
    useState(null);

  const [message, setMessage] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const handleFileChange = (e) => {
    const selectedFile =
      e.target.files[0];

    setFile(
      selectedFile || null
    );

    setResult(null);
    setMessage("");
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    setMessage("");
    setResult(null);

    if (!file) {
      setMessage(
        "Please select a CSV or Excel dataset."
      );
      return;
    }

    const allowedExtensions = [
      ".csv",
      ".xlsx",
      ".xls",
    ];

    const fileName =
      file.name.toLowerCase();

    const validExtension =
      allowedExtensions.some(
        (extension) =>
          fileName.endsWith(
            extension
          )
      );

    if (!validExtension) {
      setMessage(
        "Only CSV, XLS or XLSX files are supported."
      );
      return;
    }

    const formData =
      new FormData();

    formData.append(
      "file",
      file
    );

    setLoading(true);

    try {
      const response =
        await axios.post(
          ADMIN_UPLOAD_API,
          formData,
          {
            headers: {
              "X-Admin-Mobile":
                user.mobile_number,

              "Content-Type":
                "multipart/form-data",
            },
          }
        );

      setResult(
        response.data
      );

      setMessage(
        response.data.message ||
          "Dataset uploaded successfully."
      );

      setFile(null);

      const fileInput =
        document.getElementById(
          "dataset-file"
        );

      if (fileInput) {
        fileInput.value = "";
      }
    } catch (error) {
      console.error(error);

      const data =
        error.response?.data;

      if (
        data?.missing_columns
      ) {
        setMessage(
          `${data.message}. Missing: ${data.missing_columns.join(", ")}`
        );
      } else {
        setMessage(
          data?.message ||
            "Dataset upload failed."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout
      title="Upload Crop Dataset"
      goBack={goBack}
    >
      <div style={styles.predictionCard}>
        <h2>
          Upload Historical Dataset
        </h2>

        <p style={styles.helpText}>
          Upload a CSV or Excel file containing
          historical crop production data.
          The valid records will be stored in
          PostgreSQL and can later be used to
          train the crop prediction model.
        </p>

        <div style={styles.uploadInfo}>
          <h3>
            Required Dataset Columns
          </h3>

          <p>
            Your dataset should contain:
          </p>

          <ul>
            <li>District</li>
            <li>Crop</li>
            <li>Season</li>
            <li>Year</li>
            <li>Area</li>
            <li>Production</li>
          </ul>
        </div>

        <form onSubmit={handleUpload}>
          <label>
            Select Dataset
          </label>

          <input
            id="dataset-file"
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileChange}
          />

          {file && (
            <div
              style={
                styles.selectedFile
              }
            >
              <b>
                Selected File:
              </b>

              <p>
                {file.name}
              </p>

              <p>
                Size:{" "}
                {(file.size / 1024).toFixed(
                  2
                )} KB
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={
              loading || !file
            }
            style={
              styles.primaryButton
            }
          >
            {loading
              ? "Uploading Dataset..."
              : "Upload Dataset"}
          </button>
        </form>

        {message && (
          <div
            style={
              result
                ? styles.messageBox
                : styles.errorBox
            }
          >
            {message}
          </div>
        )}

        {result && (
          <div
            style={
              styles.uploadResult
            }
          >
            <h2>
              ✅ Dataset Uploaded Successfully
            </h2>

            <div
              style={
                styles.metricGrid
              }
            >
              <div
                style={
                  styles.metricCard
                }
              >
                <span>
                  Original Rows
                </span>

                <strong>
                  {result.original_rows}
                </strong>
              </div>

              <div
                style={
                  styles.metricCard
                }
              >
                <span>
                  Valid Rows
                </span>

                <strong>
                  {result.valid_rows}
                </strong>
              </div>

              <div
                style={
                  styles.metricCard
                }
              >
                <span>
                  Imported
                </span>

                <strong>
                  {result.records_imported}
                </strong>
              </div>
            </div>

            <p>
              <b>File:</b>{" "}
              {result.filename}
            </p>

            {result.columns_used && (
              <div>
                <h3>
                  Columns Used
                </h3>

                <ul>
                  {Object.entries(
                    result.columns_used
                  ).map(
                    ([standard, original]) => (
                      <li
                        key={standard}
                      >
                        <b>
                          {standard}
                        </b>
                        {" ← "}
                        {original}
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}

            <p
              style={
                styles.successText
              }
            >
              Your dataset is now stored in the
              database. You can go to{" "}
              <b>
                View Training Data
              </b>{" "}
              to verify the imported records.
            </p>
          </div>
        )}
      </div>
    </PageLayout>
  );
}

// =====================================================
// PAGE LAYOUT
// =====================================================

function PageLayout({
  title,
  goBack,
  children,
}) {
  return (
    <div style={styles.dashboard}>
      <header style={styles.header}>
        <h1>{title}</h1>

        <button
          onClick={goBack}
          style={styles.logout}
        >
          Back
        </button>
      </header>

      <main
        style={
          styles.predictionContainer
        }
      >
        {children}
      </main>
    </div>
  );
}

// =====================================================
// DASHBOARD CARD
// =====================================================

function DashboardCard({
  title,
  description,
  onClick,
}) {
  return (
    <div
      style={
        styles.dashboardCard
      }
    >
      <h3>{title}</h3>

      <p>{description}</p>

      <button
        style={styles.openButton}
        onClick={onClick}
        disabled={!onClick}
      >
        Open
      </button>
    </div>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f2f5f7",
    fontFamily: "Arial",
    padding: "20px",
    boxSizing: "border-box",
  },

  card: {
    padding: "35px",
    background: "white",
    borderRadius: "12px",
    boxShadow:
      "0 5px 20px rgba(0,0,0,0.15)",
    boxSizing: "border-box",
    maxHeight: "95vh",
    overflowY: "auto",
  },

  title: {
    color: "#1f4d3a",
    marginBottom: "5px",
  },

  subtitle: {
    color: "#666",
    marginTop: "0",
    marginBottom: "25px",
  },

  sectionTitle: {
    color: "#1f4d3a",
    borderBottom:
      "1px solid #ddd",
    paddingBottom: "8px",
    marginTop: "25px",
  },

  dashboard: {
    minHeight: "100vh",
    background: "#f4f6f8",
    fontFamily: "Arial",
  },

  header: {
    background: "#1f4d3a",
    color: "white",
    padding: "20px 40px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  adminHeader: {
    background: "#243447",
    color: "white",
    padding: "20px 40px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  logout: {
    padding: "10px 20px",
    cursor: "pointer",
    border: "none",
    borderRadius: "6px",
    background: "white",
    color: "#1f4d3a",
    fontWeight: "bold",
  },

  main: {
    padding: "40px",
    maxWidth: "1200px",
    margin: "0 auto",
  },

  cards: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "20px",
    marginTop: "30px",
  },

  dashboardCard: {
    background: "white",
    padding: "25px",
    borderRadius: "10px",
    boxShadow:
      "0 3px 10px rgba(0,0,0,0.1)",
  },

  openButton: {
    padding: "10px 20px",
    cursor: "pointer",
    border: "none",
    borderRadius: "6px",
    background: "#1f4d3a",
    color: "white",
  },

  adminWelcome: {
    background: "white",
    padding: "25px",
    borderRadius: "12px",
    boxShadow:
      "0 3px 12px rgba(0,0,0,0.1)",
  },

  adminInfo: {
    marginTop: "20px",
    padding: "15px",
    background: "#f4f7f5",
    borderRadius: "8px",
  },

  predictionContainer: {
    display: "flex",
    justifyContent: "center",
    padding: "40px",
    boxSizing: "border-box",
  },

  predictionCard: {
    width: "550px",
    maxWidth: "100%",
    background: "white",
    padding: "30px",
    borderRadius: "12px",
    boxShadow:
      "0 3px 15px rgba(0,0,0,0.1)",
    boxSizing: "border-box",
  },

  largeCard: {
    width: "900px",
    maxWidth: "100%",
    background: "white",
    padding: "30px",
    borderRadius: "12px",
    boxShadow:
      "0 3px 15px rgba(0,0,0,0.1)",
    boxSizing: "border-box",
  },

  fullCard: {
    width: "100%",
    maxWidth: "1100px",
    background: "white",
    padding: "30px",
    borderRadius: "12px",
    boxShadow:
      "0 3px 15px rgba(0,0,0,0.1)",
    boxSizing: "border-box",
  },

  helpText: {
    color: "#666",
    lineHeight: "1.5",
    marginBottom: "20px",
  },

  infoBox: {
    background: "#eef5f1",
    borderLeft:
      "5px solid #1f4d3a",
    padding: "15px",
    borderRadius: "8px",
    marginBottom: "20px",
    color: "#333",
  },

  vehicleInfo: {
    marginTop: "20px",
    padding: "18px",
    background: "#f5f8f6",
    borderRadius: "10px",
    border:
      "1px solid #dce7e0",
  },

  vehicleGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "15px",
  },

  transportMetricGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "15px",
    margin: "20px 0",
  },

  transportMetric: {
    background: "white",
    padding: "15px",
    borderRadius: "8px",
    textAlign: "center",
    boxShadow:
      "0 2px 8px rgba(0,0,0,0.08)",
  },

  comparisonCard: {
    marginTop: "30px",
    padding: "25px",
    background: "#f8faf9",
    borderRadius: "12px",
    border:
      "1px solid #dfe8e3",
  },

  bestBadge: {
    display: "inline-block",
    padding: "4px 7px",
    borderRadius: "4px",
    background: "#1f4d3a",
    color: "white",
    fontSize: "11px",
    fontWeight: "bold",
  },

  recommendationBox: {
    marginTop: "20px",
    padding: "18px",
    background: "#eef7ee",
    borderRadius: "8px",
    borderLeft:
      "5px solid #1f4d3a",
  },

  result: {
    marginTop: "25px",
    padding: "20px",
    background: "#eef7ee",
    borderRadius: "10px",
    borderLeft:
      "5px solid #1f4d3a",
  },

  trainingResult: {
    marginTop: "25px",
    padding: "25px",
    background: "#eef7ee",
    borderRadius: "10px",
  },

  trainingInfo: {
    background: "#f5f7f6",
    padding: "15px",
    borderRadius: "8px",
    marginTop: "20px",
  },

  metricGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(130px, 1fr))",
    gap: "15px",
    margin: "20px 0",
  },

  metricCard: {
    background: "white",
    padding: "18px",
    borderRadius: "8px",
    textAlign: "center",
    boxShadow:
      "0 2px 8px rgba(0,0,0,0.08)",
  },

  messageBox: {
    marginTop: "15px",
    padding: "12px",
    background: "#eef7ee",
    borderRadius: "6px",
    color: "green",
    fontWeight: "bold",
  },

  errorBox: {
    marginTop: "15px",
    padding: "12px",
    background: "#fff0f0",
    borderRadius: "6px",
    color: "red",
  },

  error: {
    color: "red",
    marginTop: "15px",
  },

  message: {
    marginTop: "15px",
    fontWeight: "bold",
  },

  linkButton: {
    width: "100%",
    marginTop: "15px",
    padding: "10px",
    cursor: "pointer",
    background: "transparent",
    border: "none",
    color: "#1f4d3a",
    textDecoration: "underline",
  },

  primaryButton: {
    width: "100%",
    marginTop: "20px",
    padding: "12px",
    cursor: "pointer",
    background: "#1f4d3a",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "16px",
  },

  primarySmallButton: {
    padding: "10px 18px",
    cursor: "pointer",
    background: "#1f4d3a",
    color: "white",
    border: "none",
    borderRadius: "6px",
  },

  dataHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    marginBottom: "20px",
  },

  tableWrapper: {
    overflowX: "auto",
    marginTop: "20px",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "800px",
  },

  emptyBox: {
    padding: "30px",
    textAlign: "center",
    background: "#f5f7f6",
    borderRadius: "8px",
  },

  deleteButton: {
    padding: "7px 12px",
    background: "#c0392b",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },

  uploadInfo: {
    background: "#f5f8f6",
    padding: "15px 20px",
    borderRadius: "8px",
    marginTop: "20px",
    border:
      "1px solid #dce7e0",
  },

  selectedFile: {
    marginTop: "15px",
    padding: "15px",
    background: "#f5f7f6",
    borderRadius: "8px",
  },

  uploadResult: {
    marginTop: "25px",
    padding: "20px",
    background: "#eef7ee",
    borderRadius: "10px",
  },

  successText: {
    color: "#1f4d3a",
    lineHeight: "1.6",
  },
};

// =====================================================
// GLOBAL CSS
// =====================================================

if (
  typeof document !== "undefined" &&
  !document.getElementById(
    "smart-procurement-global-css"
  )
) {
  const styleElement =
    document.createElement(
      "style"
    );

  styleElement.id =
    "smart-procurement-global-css";

  styleElement.innerHTML = `
    body {
      margin: 0;
    }

    label {
      display: block;
      margin-top: 15px;
      margin-bottom: 6px;
      font-weight: bold;
      color: #333;
    }

    input,
    select {
      width: 100%;
      padding: 11px;
      box-sizing: border-box;
      border: 1px solid #ccc;
      border-radius: 6px;
      font-size: 15px;
      background: white;
    }

    input:focus,
    select:focus {
      outline: none;
      border-color: #1f4d3a;
    }

    table th,
    table td {
      border: 1px solid #ddd;
      padding: 10px;
      text-align: left;
    }

    table th {
      background: #1f4d3a;
      color: white;
    }

    table tr:nth-child(even) {
      background: #f7f7f7;
    }

    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    hr {
      border: 0;
      border-top: 1px solid #ddd;
      margin: 20px 0;
    }
  `;

  document.head.appendChild(
    styleElement
  );
}

// =====================================================
// EXPORT
// =====================================================

export default App;