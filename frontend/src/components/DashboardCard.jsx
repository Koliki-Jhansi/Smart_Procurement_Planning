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

const styles = {
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
};

export default DashboardCard;