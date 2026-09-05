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

const styles = {
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

  logout: {
    padding: "10px 20px",
    cursor: "pointer",
    border: "none",
    borderRadius: "6px",
    background: "white",
    color: "#1f4d3a",
    fontWeight: "bold",
  },

  predictionContainer: {
    display: "flex",
    justifyContent: "center",
    padding: "40px",
    boxSizing: "border-box",
  },
};

export default PageLayout;