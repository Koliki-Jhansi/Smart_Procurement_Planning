import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";

const API = "http://127.0.0.1:5000";

function WarehousePrediction({ goBack }) {
  const [districts, setDistricts] = useState([]);
  const [centers, setCenters] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const formatNumber = (value) =>
    Number(value || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    });

  const loadCenters = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    setError("");

    try {
      const districtResponse = await axios.get(
        `${API}/api/warehouse/districts`
      );

      if (!districtResponse.data?.success) {
        throw new Error(
          districtResponse.data?.message ||
            "Unable to load warehouse districts."
        );
      }

      const districtRows = districtResponse.data?.districts || [];
      setDistricts(districtRows);

      const responses = await Promise.all(
        districtRows.map((item) =>
          axios
            .get(`${API}/api/warehouse/centers`, {
              params: { district: item.district },
            })
            .then((response) =>
              response.data?.success
                ? response.data?.centers || []
                : []
            )
            .catch(() => [])
        )
      );

      const allCenters = responses.flat();

      const uniqueCenters = Array.from(
        new Map(
          allCenters.map((center) => [
            center.center_id ||
              `${center.district}-${center.center_name}`,
            center,
          ])
        ).values()
      );

      setCenters(uniqueCenters);
    } catch (err) {
      console.error("Warehouse center loading error:", err);

      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Unable to load procurement center capacity."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadCenters();

    // Keep center capacity synchronized with government confirmation.
    const intervalId = setInterval(() => {
      loadCenters(true);
    }, 10000);

    return () => clearInterval(intervalId);
  }, [loadCenters]);

  const filteredCenters = useMemo(() => {
    const text = search.trim().toLowerCase();

    if (!text) return centers;

    return centers.filter((center) =>
      [
        center.center_name,
        center.center_id,
        center.district,
        center.mandal,
        center.location,
        center.pincode,
      ].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(text)
      )
    );
  }, [centers, search]);

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <div style={styles.kicker}>WAREHOUSE NETWORK</div>
          <h1 style={styles.headerTitle}>
            Procurement Center Capacity
          </h1>
          <p style={styles.headerSubtitle}>
            Search a procurement center and view its live capacity.
          </p>
        </div>

        {goBack && (
          <button
            type="button"
            onClick={goBack}
            style={styles.backButton}
          >
            ← Back
          </button>
        )}
      </header>

      <main style={styles.container}>
        <section style={styles.heroCard}>
          <div style={styles.heroContent}>
            <div>
              <span style={styles.heroLabel}>
                LIVE CAPACITY MONITOR
              </span>

              <h2 style={styles.heroTitle}>
                Find a Procurement Center
              </h2>

              <p style={styles.heroText}>
                Capacity information is displayed directly inside
                each center card. No separate district-capacity
                panel is required.
              </p>
            </div>

            <div style={styles.heroIcon}>🏭</div>
          </div>

          <div style={styles.searchRow}>
            <div style={styles.searchBox}>
              <span style={styles.searchIcon}>⌕</span>

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search center, ID, district, mandal or location..."
                style={styles.searchInput}
              />
            </div>

            <button
              type="button"
              onClick={() => loadCenters()}
              disabled={refreshing}
              style={{
                ...styles.refreshButton,
                opacity: refreshing ? 0.7 : 1,
              }}
            >
              {refreshing ? "Refreshing..." : "↻ Refresh"}
            </button>
          </div>
        </section>

        {error && (
          <div style={styles.errorBox}>
            ⚠️ {error}
          </div>
        )}

        <div style={styles.resultHeader}>
          <div>
            <h2 style={styles.sectionTitle}>
              Procurement Centers
            </h2>

            <p style={styles.sectionText}>
              {loading
                ? "Loading center capacity..."
                : `${filteredCenters.length} center${
                    filteredCenters.length === 1 ? "" : "s"
                  } found`}
            </p>
          </div>

          <div style={styles.liveBadge}>
            <span style={styles.liveDot}>●</span>
            LIVE DATA
          </div>
        </div>

        {loading ? (
          <div style={styles.messageBox}>
            Loading procurement centers...
          </div>
        ) : filteredCenters.length === 0 ? (
          <div style={styles.messageBox}>
            No procurement center matches your search.
          </div>
        ) : (
          <div style={styles.centerGrid}>
            {filteredCenters.map((center) => (
              <CenterCard
                key={
                  center.center_id ||
                  `${center.district}-${center.center_name}`
                }
                center={center}
                formatNumber={formatNumber}
              />
            ))}
          </div>
        )}

        <section style={styles.workflowCard}>
          <div style={styles.workflowIcon}>✓</div>

          <div>
            <h3 style={styles.workflowTitle}>
              Capacity Update Workflow
            </h3>

            <p style={styles.workflowText}>
              Farmer marks procurement completed → Government
              verifies the actual received quantity → Government
              confirms procurement → that specific center's current
              stock increases and its available capacity is
              recalculated.
            </p>

            <div style={styles.formula}>
              Available Capacity = Total Capacity − Current Stock −
              Active Reservations
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function CenterCard({ center, formatNumber }) {
  const total = Number(
    center.total_capacity ??
      center.capacity_tons ??
      center.capacity ??
      0
  );

  const currentStock = Number(
    center.current_stock ?? 0
  );

  const reserved = Number(
    center.reserved_quantity ??
      center.reserved_capacity ??
      0
  );

  const available = Number(
    center.available_capacity ??
      center.effective_available_capacity ??
      Math.max(total - currentStock - reserved, 0)
  );

  const utilization =
    total > 0
      ? Math.min(
          100,
          Math.max(
            0,
            ((currentStock + reserved) / total) * 100
          )
        )
      : 0;

  const status =
    center.capacity_status ||
    (available <= 0
      ? "Full"
      : utilization >= 85
      ? "High Utilization"
      : "Available");

  return (
    <article style={styles.centerCard}>
      <div style={styles.cardTop}>
        <div style={styles.centerIdentity}>
          <div style={styles.centerIcon}>🏢</div>

          <div style={styles.centerNameWrap}>
            <h3 style={styles.centerName}>
              {center.center_name || "Procurement Center"}
            </h3>

            <span style={styles.centerId}>
              {center.center_id || "-"}
            </span>
          </div>
        </div>

        <StatusBadge status={status} />
      </div>

      <div style={styles.locationBox}>
        <span>📍</span>

        <span>
          {[
            center.district,
            center.mandal,
            center.location,
          ]
            .filter(Boolean)
            .join(" • ") || "Location not available"}
        </span>
      </div>

      <div style={styles.capacityGrid}>
        <CapacityBox
          label="Total Capacity"
          value={`${formatNumber(total)} Tons`}
        />

        <CapacityBox
          label="Current Stock"
          value={`${formatNumber(currentStock)} Tons`}
        />

        <CapacityBox
          label="Reserved"
          value={`${formatNumber(reserved)} Tons`}
        />

        <CapacityBox
          label="Available Capacity"
          value={`${formatNumber(available)} Tons`}
          highlight
        />
      </div>

      <div style={styles.progressHeader}>
        <span>Occupied + Reserved</span>
        <strong>{utilization.toFixed(1)}%</strong>
      </div>

      <div style={styles.progressTrack}>
        <div
          style={{
            ...styles.progressFill,
            width: `${utilization}%`,
          }}
        />
      </div>

      <div style={styles.cardFooter}>
        <span style={styles.liveDot}>●</span>
        Updated from warehouse records
      </div>
    </article>
  );
}

function CapacityBox({
  label,
  value,
  highlight = false,
}) {
  return (
    <div
      style={{
        ...styles.capacityBox,
        ...(highlight
          ? styles.capacityBoxHighlight
          : {}),
      }}
    >
      <span style={styles.capacityLabel}>
        {label}
      </span>

      <strong
        style={{
          ...styles.capacityValue,
          ...(highlight
            ? styles.capacityValueHighlight
            : {}),
        }}
      >
        {value}
      </strong>
    </div>
  );
}

function StatusBadge({ status }) {
  const text = String(status || "Available");
  const value = text.toLowerCase();

  let badgeStyle = styles.statusAvailable;

  if (
    value.includes("full") ||
    value.includes("critical") ||
    value.includes("no capacity")
  ) {
    badgeStyle = styles.statusFull;
  } else if (
    value.includes("high") ||
    value.includes("warning")
  ) {
    badgeStyle = styles.statusWarning;
  }

  return (
    <span
      style={{
        ...styles.statusBadge,
        ...badgeStyle,
      }}
    >
      {text}
    </span>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg, #f3f7f4 0%, #edf5ef 55%, #f8f6ef 100%)",
    color: "#18352a",
    fontFamily:
      "'Inter', 'Segoe UI', Arial, sans-serif",
  },

  header: {
    minHeight: "110px",
    padding: "24px 38px",
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "20px",
    background:
      "linear-gradient(120deg, #123d2d 0%, #1e6043 100%)",
    color: "white",
    boxShadow:
      "0 12px 30px rgba(18, 61, 45, 0.16)",
  },

  kicker: {
    marginBottom: "5px",
    fontSize: "10px",
    fontWeight: "900",
    letterSpacing: "1.7px",
    opacity: 0.72,
  },

  headerTitle: {
    margin: 0,
    fontSize: "28px",
    lineHeight: 1.2,
  },

  headerSubtitle: {
    margin: "7px 0 0",
    fontSize: "13px",
    opacity: 0.82,
  },

  backButton: {
    padding: "10px 17px",
    border: "1px solid rgba(255,255,255,.35)",
    borderRadius: "10px",
    background: "rgba(255,255,255,.12)",
    color: "white",
    cursor: "pointer",
    fontWeight: "800",
  },

  container: {
    width: "100%",
    maxWidth: "1450px",
    margin: "0 auto",
    padding: "30px 28px 55px",
    boxSizing: "border-box",
  },

  heroCard: {
    padding: "28px",
    border: "1px solid #d9e7dd",
    borderRadius: "22px",
    background:
      "radial-gradient(circle at 86% 10%, rgba(117, 174, 125, .24), transparent 28%), linear-gradient(145deg, #ffffff, #f1f8f3)",
    boxShadow:
      "0 14px 35px rgba(21, 69, 48, .08)",
  },

  heroContent: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "24px",
  },

  heroLabel: {
    color: "#2c7b55",
    fontSize: "10px",
    fontWeight: "900",
    letterSpacing: "1.6px",
  },

  heroTitle: {
    margin: "8px 0",
    color: "#173f2f",
    fontSize: "28px",
  },

  heroText: {
    maxWidth: "700px",
    margin: 0,
    color: "#65776e",
    lineHeight: 1.6,
    fontSize: "14px",
  },

  heroIcon: {
    width: "92px",
    height: "92px",
    minWidth: "92px",
    display: "grid",
    placeItems: "center",
    borderRadius: "26px",
    background:
      "linear-gradient(145deg, #e5f2e8, #c8e0ce)",
    boxShadow:
      "inset 0 1px 0 rgba(255,255,255,.9), 0 16px 25px rgba(28, 86, 55, .15)",
    fontSize: "48px",
    transform: "rotate(-3deg)",
  },

  searchRow: {
    display: "grid",
    gridTemplateColumns:
      "minmax(0, 1fr) auto",
    gap: "12px",
    marginTop: "22px",
  },

  searchBox: {
    display: "grid",
    gridTemplateColumns: "44px 1fr",
    alignItems: "center",
    minWidth: 0,
    overflow: "hidden",
    border: "1px solid #cddbd2",
    borderRadius: "13px",
    background: "white",
  },

  searchIcon: {
    display: "grid",
    placeItems: "center",
    color: "#2b7351",
    fontSize: "24px",
  },

  searchInput: {
    width: "100%",
    height: "48px",
    padding: "0 14px 0 0",
    boxSizing: "border-box",
    border: "none",
    outline: "none",
    background: "transparent",
    color: "#263c32",
    fontSize: "14px",
  },

  refreshButton: {
    minWidth: "120px",
    padding: "0 17px",
    border: "none",
    borderRadius: "12px",
    background: "#176b4d",
    color: "white",
    cursor: "pointer",
    fontWeight: "800",
  },

  errorBox: {
    marginTop: "18px",
    padding: "14px 16px",
    border: "1px solid #f2c8c8",
    borderRadius: "11px",
    background: "#fff0f0",
    color: "#b42318",
  },

  resultHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "18px",
    margin: "28px 0 15px",
  },

  sectionTitle: {
    margin: 0,
    color: "#183e2f",
    fontSize: "22px",
  },

  sectionText: {
    margin: "5px 0 0",
    color: "#718078",
    fontSize: "12px",
  },

  liveBadge: {
    padding: "8px 11px",
    borderRadius: "999px",
    background: "#e5f4e9",
    color: "#237248",
    fontSize: "10px",
    fontWeight: "900",
    letterSpacing: ".6px",
  },

  liveDot: {
    marginRight: "5px",
    color: "#29995a",
  },

  messageBox: {
    padding: "42px 20px",
    border: "1px solid #dde7e1",
    borderRadius: "16px",
    background: "white",
    color: "#6a7a72",
    textAlign: "center",
  },

  centerGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(360px, 1fr))",
    gap: "18px",
  },

  centerCard: {
    minWidth: 0,
    padding: "21px",
    boxSizing: "border-box",
    overflow: "hidden",
    border: "1px solid #dce7e0",
    borderRadius: "18px",
    background:
      "linear-gradient(145deg, #ffffff, #f7faf8)",
    boxShadow:
      "0 10px 28px rgba(22, 68, 48, .07)",
  },

  cardTop: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "12px",
  },

  centerIdentity: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    minWidth: 0,
  },

  centerIcon: {
    width: "48px",
    height: "48px",
    minWidth: "48px",
    display: "grid",
    placeItems: "center",
    borderRadius: "14px",
    background:
      "linear-gradient(145deg, #e4f1e7, #cce3d2)",
    boxShadow:
      "inset 0 1px 0 white, 0 8px 16px rgba(29, 85, 55, .12)",
    fontSize: "25px",
  },

  centerNameWrap: {
    minWidth: 0,
  },

  centerName: {
    margin: 0,
    color: "#173d2e",
    fontSize: "17px",
    lineHeight: 1.35,
    overflowWrap: "anywhere",
  },

  centerId: {
    display: "block",
    marginTop: "4px",
    color: "#7a8981",
    fontSize: "11px",
    overflowWrap: "anywhere",
  },

  statusBadge: {
    flexShrink: 0,
    padding: "6px 9px",
    borderRadius: "999px",
    fontSize: "10px",
    fontWeight: "900",
    whiteSpace: "nowrap",
  },

  statusAvailable: {
    background: "#e4f5e9",
    color: "#1f7748",
  },

  statusWarning: {
    background: "#fff3d8",
    color: "#976500",
  },

  statusFull: {
    background: "#fde8e8",
    color: "#b42318",
  },

  locationBox: {
    display: "flex",
    gap: "7px",
    margin: "16px 0",
    padding: "10px 11px",
    borderRadius: "10px",
    background: "#f1f5f2",
    color: "#63736b",
    fontSize: "12px",
    lineHeight: 1.5,
    overflowWrap: "anywhere",
  },

  capacityGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "10px",
  },

  capacityBox: {
    minWidth: 0,
    padding: "13px",
    border: "1px solid #e1e8e4",
    borderRadius: "11px",
    background: "white",
  },

  capacityBoxHighlight: {
    border: "1px solid #c9e5d2",
    background: "#edf8f0",
  },

  capacityLabel: {
    display: "block",
    marginBottom: "5px",
    color: "#77867e",
    fontSize: "11px",
  },

  capacityValue: {
    display: "block",
    color: "#294338",
    fontSize: "15px",
    overflowWrap: "anywhere",
  },

  capacityValueHighlight: {
    color: "#187044",
    fontSize: "17px",
  },

  progressHeader: {
    display: "flex",
    justifyContent: "space-between",
    margin: "17px 0 7px",
    color: "#66766e",
    fontSize: "11px",
  },

  progressTrack: {
    width: "100%",
    height: "8px",
    overflow: "hidden",
    borderRadius: "999px",
    background: "#e5ece7",
  },

  progressFill: {
    height: "100%",
    borderRadius: "999px",
    background:
      "linear-gradient(90deg, #2a7953, #7eaa70)",
    transition: "width .3s ease",
  },

  cardFooter: {
    marginTop: "12px",
    color: "#567066",
    fontSize: "10px",
    fontWeight: "700",
  },

  workflowCard: {
    display: "grid",
    gridTemplateColumns: "48px 1fr",
    gap: "15px",
    marginTop: "25px",
    padding: "22px",
    border: "1px solid #d5e5da",
    borderRadius: "16px",
    background:
      "linear-gradient(135deg, #eaf5ed, #f7faf8)",
  },

  workflowIcon: {
    width: "48px",
    height: "48px",
    display: "grid",
    placeItems: "center",
    borderRadius: "14px",
    background: "#176b4d",
    color: "white",
    fontSize: "22px",
    fontWeight: "900",
  },

  workflowTitle: {
    margin: 0,
    color: "#193f30",
    fontSize: "17px",
  },

  workflowText: {
    margin: "7px 0 12px",
    color: "#5c7066",
    lineHeight: 1.6,
    fontSize: "13px",
  },

  formula: {
    display: "inline-block",
    padding: "9px 12px",
    borderRadius: "9px",
    background: "white",
    color: "#1d5c41",
    fontSize: "12px",
    fontWeight: "800",
  },
};

export default WarehousePrediction;
