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

export default styles;