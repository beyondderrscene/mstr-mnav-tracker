import { useEffect, useState, useRef } from "react";
import axios from "axios";
import Draggable from "react-draggable";
import MNavChart from "./components/MNavChart";

const API_BASE = "http://127.0.0.1:8000";

const RANGES = [
  { label: "1M", days: 30 },
  { label: "3M", days: 90 },
  { label: "6M", days: 180 },
  { label: "1Y", days: 365 },
  { label: "5Y", days: 1825 },
  { label: "All", days: null }, // null = from MSTR's first BTC purchase
];

function getStartDate(days) {
  if (!days) return "2020-08-11";
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeRange, setActiveRange] = useState("1Y");
  
  // Custom Date Range States
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customStart, setCustomStart] = useState("2023-01-01");
  const [customEnd, setCustomEnd] = useState(new Date().toISOString().slice(0, 10));

  // Robo Advisor States
  const [advisorOpen, setAdvisorOpen] = useState(false);
  const [advisorLoading, setAdvisorLoading] = useState(false);
  const [advisorText, setAdvisorText] = useState("");
  // Caching the last fetched period
  const [cachedPeriod, setCachedPeriod] = useState("");
  const advisorRef = useRef(null);

  const fetchAdvisorInsights = (forceRefresh = false) => {
    let start, end;
    if (isCustomMode) {
      if (!customStart || !customEnd) return;
      start = customStart;
      end = customEnd;
    } else {
      const range = RANGES.find((r) => r.label === activeRange);
      start = getStartDate(range.days);
      end = new Date().toISOString().slice(0, 10);
    }
    
    const currentPeriod = `${start} to ${end}`;
    setAdvisorOpen(true);

    // Use cache if not force refreshing and the period matches the cache
    if (!forceRefresh && advisorText && cachedPeriod === currentPeriod) {
      return;
    }

    setAdvisorLoading(true);
    setCachedPeriod(currentPeriod);
    axios
      .get(`${API_BASE}/api/summary?start=${start}&end=${end}`)
      .then((res) => {
        setAdvisorText(res.data.summary);
        setAdvisorLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setAdvisorText("Failed to generate insights.");
        setAdvisorLoading(false);
      });
  };

  useEffect(() => {
    let start, end;
    if (isCustomMode) {
      if (!customStart || !customEnd) return;
      start = customStart;
      end = customEnd;
    } else {
      const range = RANGES.find((r) => r.label === activeRange);
      start = getStartDate(range.days);
      end = new Date().toISOString().slice(0, 10);
    }

    setLoading(true);
    axios
      .get(`${API_BASE}/api/mnav?start=${start}&end=${end}`)
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [activeRange, isCustomMode, customStart, customEnd]);

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 20px" }}>
      <h1 style={{ fontSize: "24px", marginBottom: "8px" }}>MSTR mNAV Tracker</h1>
      <p style={{ color: "#888", marginBottom: "24px" }}>
        Modified Net Asset Value — MicroStrategy Market Cap vs Bitcoin Holdings
      </p>

      {/* Range selector */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "24px", flexWrap: "wrap", alignItems: "center" }}>
        {RANGES.map((r) => (
          <button
            key={r.label}
            onClick={() => {
              setActiveRange(r.label);
              setIsCustomMode(false);
            }}
            style={{
              padding: "6px 16px",
              borderRadius: "6px",
              border: "1px solid #333",
              backgroundColor: activeRange === r.label && !isCustomMode ? "#f7931a" : "#1a1a1a",
              color: activeRange === r.label && !isCustomMode ? "#000" : "#aaa",
              cursor: "pointer",
              fontWeight: activeRange === r.label && !isCustomMode ? "bold" : "normal",
            }}
          >
            {r.label}
          </button>
        ))}

        <button
          onClick={() => setIsCustomMode(true)}
          style={{
            padding: "6px 16px",
            borderRadius: "6px",
            border: "1px solid #333",
            backgroundColor: isCustomMode ? "#f7931a" : "#1a1a1a",
            color: isCustomMode ? "#000" : "#aaa",
            cursor: "pointer",
            fontWeight: isCustomMode ? "bold" : "normal",
            marginLeft: "8px"
          }}
        >
          Custom
        </button>

        {isCustomMode && (
          <div style={{ display: "flex", gap: "8px", alignItems: "center", marginLeft: "8px" }}>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              style={{
                padding: "6px",
                borderRadius: "6px",
                border: "1px solid #333",
                backgroundColor: "#1a1a1a",
                color: "#ddd",
                outline: "none"
              }}
            />
            <span style={{ color: "#aaa" }}>to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              style={{
                padding: "6px",
                borderRadius: "6px",
                border: "1px solid #333",
                backgroundColor: "#1a1a1a",
                color: "#ddd",
                outline: "none"
              }}
            />
          </div>
        )}
      </div>

      {loading ? <p style={{ color: "#888" }}>Fetching data...</p> : <MNavChart data={data} />}

      {/* Robo-Advisor Floating Button */}
      <div style={{ position: "fixed", bottom: "30px", right: "30px", zIndex: 1000 }}>
        {!advisorOpen && (
          <button
            onClick={() => fetchAdvisorInsights(false)}
            style={{
              padding: "16px 24px",
              borderRadius: "30px",
              backgroundColor: "#f7931a",
              color: "#000",
              fontWeight: "bold",
              border: "none",
              boxShadow: "0 4px 12px rgba(247, 147, 26, 0.4)",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            ✨ Robo-Advisor Insights
          </button>
        )}
      </div>

      {advisorOpen && (
        <Draggable 
          nodeRef={advisorRef} 
          handle=".advisor-handle" 
          key={cachedPeriod} // resets position whenever new data (period) is generated
        >
          <div
            ref={advisorRef}
            style={{
              position: "fixed",
              bottom: "30px", // align natively
              right: "30px",
              zIndex: 1001,
              width: "350px",
              maxHeight: "400px",
              backgroundColor: "#1a1a1a",
              border: "1px solid #333",
              borderRadius: "12px",
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.6)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              className="advisor-handle"
              style={{
                backgroundColor: "#222",
                padding: "12px 16px",
                borderBottom: "1px solid #333",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontWeight: "bold",
                color: "#f7931a",
                cursor: "grab",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span>Robo-Advisor</span>
                <span style={{ fontSize: "10px", color: "#aaa", fontWeight: "normal", marginTop: "2px" }}>
                  {cachedPeriod}
                </span>
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={() => fetchAdvisorInsights(true)}
                  title="Refresh Insights"
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#aaa",
                    cursor: "pointer",
                    fontSize: "14px",
                    padding: 0,
                  }}
                >
                  ↻
                </button>
                <button
                  onClick={() => setAdvisorOpen(false)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#aaa",
                    cursor: "pointer",
                    fontSize: "16px",
                    padding: 0,
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
            <div style={{ padding: "16px", overflowY: "auto", color: "#ddd", lineHeight: "1.5" }}>
              {advisorLoading ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100px" }}>
                  <span style={{ color: "#aaa" }}>Analyzing data...</span>
                </div>
              ) : (
                <div style={{ whiteSpace: "pre-wrap" }}>{advisorText}</div>
              )}
            </div>
          </div>
        </Draggable>
      )}
    </div>
  );
}

export default App;