import React from "react";

function Reports({ goBack }) {
  const handleReport = (reportName) => {
    alert(`${reportName} report will be generated here.`);
  };

  return (
    <div style={styles.dashboard}>

      {/* HEADER */}
      <header style={styles.header}>

        <div>
          <h1 style={styles.headerTitle}>
            📊 Reports
          </h1>

          <p style={styles.headerSubtitle}>
            Smart Crop Procurement Planning System
          </p>
        </div>

        <button
          onClick={goBack}
          style={styles.back}
        >
          ← Back
        </button>

      </header>

      {/* MAIN CONTENT */}
      <main style={styles.container}>

        <div style={styles.card}>

          <h2 style={styles.mainTitle}>
            Procurement Reports
          </h2>

          <p style={styles.description}>
            View crop production, procurement,
            warehouse and transportation
            information.
          </p>

          {/* REPORT GRID */}
          <div style={styles.grid}>

            {/* CROP PRODUCTION */}
            <div style={styles.report}>

              <div style={styles.reportIcon}>
                🌾
              </div>

              <h3 style={styles.reportTitle}>
                Crop Production Report
              </h3>

              <p style={styles.reportText}>
                View predicted crop production
                based on farmer and crop data.
              </p>

              <button
                onClick={() =>
                  handleReport(
                    "Crop Production"
                  )
                }
                style={styles.reportButton}
              >
                View Report
              </button>

            </div>

            {/* PROCUREMENT */}
            <div style={styles.report}>

              <div style={styles.reportIcon}>
                📦
              </div>

              <h3 style={styles.reportTitle}>
                Procurement Report
              </h3>

              <p style={styles.reportText}>
                View procurement centers,
                farmer requests and procurement
                planning information.
              </p>

              <button
                onClick={() =>
                  handleReport(
                    "Procurement"
                  )
                }
                style={styles.reportButton}
              >
                View Report
              </button>

            </div>

            {/* WAREHOUSE */}
            <div style={styles.report}>

              <div style={styles.reportIcon}>
                🏭
              </div>

              <h3 style={styles.reportTitle}>
                Warehouse Report
              </h3>

              <p style={styles.reportText}>
                View warehouse capacity,
                current load and available
                storage requirements.
              </p>

              <button
                onClick={() =>
                  handleReport(
                    "Warehouse"
                  )
                }
                style={styles.reportButton}
              >
                View Report
              </button>

            </div>

            {/* TRANSPORT */}
            <div style={styles.report}>

              <div style={styles.reportIcon}>
                🚛
              </div>

              <h3 style={styles.reportTitle}>
                Transport Report
              </h3>

              <p style={styles.reportText}>
                View transportation distance,
                fuel cost, driver cost and
                total transport cost.
              </p>

              <button
                onClick={() =>
                  handleReport(
                    "Transport"
                  )
                }
                style={styles.reportButton}
              >
                View Report
              </button>

            </div>

          </div>

          {/* SUMMARY */}
          <div style={styles.summary}>

            <h3 style={styles.summaryTitle}>
              📈 System Report Summary
            </h3>

            <div style={styles.summaryGrid}>

              <div style={styles.summaryItem}>
                <span style={styles.summaryIcon}>
                  🌾
                </span>

                <div>
                  <strong>
                    Crop Production
                  </strong>

                  <p>
                    Prediction based
                  </p>
                </div>
              </div>

              <div style={styles.summaryItem}>
                <span style={styles.summaryIcon}>
                  📦
                </span>

                <div>
                  <strong>
                    Procurement
                  </strong>

                  <p>
                    Center planning
                  </p>
                </div>
              </div>

              <div style={styles.summaryItem}>
                <span style={styles.summaryIcon}>
                  🏭
                </span>

                <div>
                  <strong>
                    Warehouse
                  </strong>

                  <p>
                    Capacity planning
                  </p>
                </div>
              </div>

              <div style={styles.summaryItem}>
                <span style={styles.summaryIcon}>
                  🚛
                </span>

                <div>
                  <strong>
                    Transport
                  </strong>

                  <p>
                    Cost calculation
                  </p>
                </div>
              </div>

            </div>

          </div>

        </div>

      </main>
    </div>
  );
}

const styles = {
  dashboard: {
    minHeight: "100vh",
    background: "#f4f6f8",
    fontFamily: "Arial, sans-serif",
  },

  header: {
    background: "#1f4d3a",
    color: "white",
    padding: "20px 40px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxSizing: "border-box",
  },

  headerTitle: {
    margin: "0",
    fontSize: "28px",
  },

  headerSubtitle: {
    margin: "5px 0 0",
    fontSize: "14px",
    opacity: "0.85",
  },

  back: {
    padding: "10px 20px",
    border: "none",
    borderRadius: "7px",
    background: "white",
    color: "#1f4d3a",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "14px",
  },

  container: {
    display: "flex",
    justifyContent: "center",
    padding: "40px 20px",
    boxSizing: "border-box",
  },

  card: {
    width: "1000px",
    maxWidth: "100%",
    background: "white",
    padding: "35px",
    borderRadius: "14px",
    boxShadow:
      "0 4px 18px rgba(0,0,0,0.1)",
    boxSizing: "border-box",
  },

  mainTitle: {
    marginTop: "0",
    marginBottom: "8px",
    color: "#1f4d3a",
    fontSize: "26px",
  },

  description: {
    color: "#666",
    marginBottom: "30px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "20px",
  },

  report: {
    padding: "25px",
    background: "#f5f8f6",
    borderRadius: "10px",
    border: "1px solid #dce7e0",
  },

  reportIcon: {
    fontSize: "40px",
    marginBottom: "10px",
  },

  reportTitle: {
    margin: "5px 0 10px",
    color: "#1f4d3a",
  },

  reportText: {
    color: "#666",
    lineHeight: "1.5",
    minHeight: "65px",
  },

  reportButton: {
    width: "100%",
    padding: "10px",
    marginTop: "15px",
    border: "none",
    borderRadius: "6px",
    background: "#1f4d3a",
    color: "white",
    cursor: "pointer",
    fontWeight: "bold",
  },

  summary: {
    marginTop: "35px",
    padding: "25px",
    background: "#eef5f0",
    borderRadius: "10px",
    border:
      "1px solid #d4e3d8",
  },

  summaryTitle: {
    marginTop: "0",
    color: "#1f4d3a",
  },

  summaryGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "15px",
    marginTop: "20px",
  },

  summaryItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    background: "white",
    padding: "15px",
    borderRadius: "8px",
  },

  summaryIcon: {
    fontSize: "28px",
  },
};

export default Reports;