import React, { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  ArcElement,
  RadialLinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Doughnut, Radar, Scatter } from "react-chartjs-2";
import "./App.css";

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  ArcElement,
  RadialLinearScale,
  Tooltip,
  Legend
);

const glass = {
  background: "rgba(36, 40, 54, 0.7)",
  boxShadow: "0 12px 48px rgba(79,140,255,0.22)",
  borderRadius: "24px",
  border: "1.5px solid rgba(255,255,255,0.18)",
  backdropFilter: "blur(18px)",
};

const navItems = [
  { key: "overview", label: "Overview", icon: "❤️" },
  { key: "variability", label: "Variability", icon: "📈" },
  { key: "stats", label: "Stats", icon: "📊" },
  { key: "historical", label: "Historical", icon: "⏳" },
];

function randomHR() {
  // Simulate heart rate data
  return 70 + Math.sin(Date.now() / 2000) * 10 + Math.random() * 4;
}
function randomSpO2() {
  return 97 + Math.sin(Date.now() / 3000) * 1.5 + Math.random() * 0.5;
}
function randomTemp() {
  return 36.5 + Math.sin(Date.now() / 4000) * 0.3 + Math.random() * 0.2;
}
function randomRR() {
  // Simulate RR intervals (ms)
  return Array.from({ length: 60 }, (_, i) => 800 + Math.sin(i / 5 + Date.now() / 3000) * 40 + Math.random() * 10);
}

function calcRMSSD(rr) {
  let sum = 0;
  for (let i = 1; i < rr.length; i++) sum += Math.pow(rr[i] - rr[i - 1], 2);
  return Math.sqrt(sum / (rr.length - 1));
}
function calcSDNN(rr) {
  const mean = rr.reduce((a, b) => a + b, 0) / rr.length;
  const variance = rr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / rr.length;
  return Math.sqrt(variance);
}
function calcPNN50(rr) {
  let count = 0;
  for (let i = 1; i < rr.length; i++) if (Math.abs(rr[i] - rr[i - 1]) > 50) count++;
  return (count / (rr.length - 1)) * 100;
}

export default function App() {
  const [page, setPage] = useState("overview");
  const [hr, setHr] = useState(75);
  const [spo2, setSpo2] = useState(98);
  const [temp, setTemp] = useState(36.7);
  const [hrHistory, setHrHistory] = useState(Array(60).fill(75));
  const [rr, setRr] = useState(randomRR());
  // For modals/tooltips
  const [modal, setModal] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const newHr = randomHR();
      const newSpo2 = randomSpO2();
      const newTemp = randomTemp();
      setHr(newHr);
      setSpo2(newSpo2);
      setTemp(newTemp);
      setHrHistory((h) => [...h.slice(1), newHr]);
      setRr(randomRR());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Chart data
  const lineData = {
    labels: Array.from({ length: hrHistory.length }, (_, i) => i - hrHistory.length + 1),
    datasets: [
      {
        label: "Heart Rate (BPM)",
        data: hrHistory,
        borderColor: "#4f8cff",
        backgroundColor: "rgba(79,140,255,0.15)",
        tension: 0.4,
        pointRadius: 0,
        fill: true,
      },
    ],
  };
  const doughnutData = {
    labels: ["Current", "Rest"],
    datasets: [
      {
        data: [hr, 120 - hr],
        backgroundColor: ["#00ffd0", "rgba(79,140,255,0.10)"],
        borderWidth: 0,
        cutout: "80%",
      },
    ],
  };
  const radarData = {
    labels: ["Rest", "Light", "Cardio", "Peak", "Recovery"],
    datasets: [
      {
        label: "Zone Distribution",
        data: [30, 25, 20, 15, 10],
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderColor: "#00ffd0",
        pointBackgroundColor: "#00ffd0",
      },
    ],
  };
  const scatterData = {
    datasets: [
      {
        label: "RRi",
        data: rr.slice(1).map((v, i) => ({ x: rr[i], y: v })),
        backgroundColor: "rgba(0,255,208,0.7)",
        pointRadius: 4,
      },
    ],
  };

  // HRV metrics
  const rmssd = calcRMSSD(rr).toFixed(1);
  const sdnn = calcSDNN(rr).toFixed(1);
  const pnn50 = calcPNN50(rr).toFixed(1);
  const meanRR = (rr.reduce((a, b) => a + b, 0) / rr.length).toFixed(1);

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #232946 0%, #4f8cff 100%)", color: "#f7f7fa", fontFamily: "Inter, Arial, sans-serif" }}>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        {/* Sidebar */}
        <nav style={{ width: 80, background: "rgba(36,40,54,0.85)", display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 0", gap: 24, boxShadow: "0 0 32px #4f8cff22" }}>
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setPage(item.key)}
              style={{
                background: page === item.key ? "#00ffd0" : "transparent",
                color: page === item.key ? "#232946" : "#fff",
                border: "none",
                borderRadius: 16,
                width: 48,
                height: 48,
                fontSize: 28,
                marginBottom: 8,
                cursor: "pointer",
                boxShadow: page === item.key ? "0 0 16px #00ffd0aa" : undefined,
                transition: "all 0.2s",
              }}
              title={item.label}
            >
              {item.icon}
            </button>
          ))}
        </nav>
        {/* Main Content */}
        <main style={{ flex: 1, padding: "32px 0", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <h1 style={{ fontWeight: 700, fontSize: 36, marginBottom: 24, letterSpacing: 1 }}>Next-Gen Health Dashboard</h1>
          {/* Overview Page */}
          {page === "overview" && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 32, justifyContent: "center", width: "100%" }}>
              {/* Metric Cards */}
              <div style={{ ...glass, minWidth: 220, padding: 24, textAlign: "center", flex: 1, maxWidth: 320, cursor: "pointer" }} onClick={() => setModal("hr") }>
                <div style={{ fontSize: 48, color: "#ff4f81", marginBottom: 8 }}>❤️</div>
                <div style={{ fontSize: 32, fontWeight: 700 }}>{hr.toFixed(0)} <span style={{ fontSize: 18, color: "#bfc9d9" }}>BPM</span></div>
                <div style={{ color: "#bfc9d9", marginTop: 4 }}>Heart Rate</div>
              </div>
              <div style={{ ...glass, minWidth: 220, padding: 24, textAlign: "center", flex: 1, maxWidth: 320, cursor: "pointer" }} onClick={() => setModal("spo2") }>
                <div style={{ fontSize: 48, color: "#00ffd0", marginBottom: 8 }}>🫁</div>
                <div style={{ fontSize: 32, fontWeight: 700 }}>{spo2.toFixed(1)} <span style={{ fontSize: 18, color: "#bfc9d9" }}>%</span></div>
                <div style={{ color: "#bfc9d9", marginTop: 4 }}>Blood Oxygen</div>
              </div>
              <div style={{ ...glass, minWidth: 220, padding: 24, textAlign: "center", flex: 1, maxWidth: 320, cursor: "pointer" }} onClick={() => setModal("temp") }>
                <div style={{ fontSize: 48, color: "#f7b801", marginBottom: 8 }}>🌡️</div>
                <div style={{ fontSize: 32, fontWeight: 700 }}>{temp.toFixed(1)} <span style={{ fontSize: 18, color: "#bfc9d9" }}>°C</span></div>
                <div style={{ color: "#bfc9d9", marginTop: 4 }}>Temperature</div>
              </div>
              {/* Heart Rate Line Chart */}
              <div style={{ ...glass, minWidth: 320, maxWidth: 600, flex: 2, padding: 24 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>Heart Rate Trend (1 min)</div>
                <Line data={lineData} options={{
                  plugins: { legend: { display: false } },
                  scales: {
                    x: { display: false },
                    y: { min: 50, max: 120, grid: { color: "rgba(79,140,255,0.08)" } },
                  },
                  animation: { duration: 800, easing: "easeOutQuart" },
                  responsive: true,
                  maintainAspectRatio: false,
                }} height={180} />
              </div>
              {/* Heart Rate Gauge */}
              <div style={{ ...glass, minWidth: 220, maxWidth: 320, flex: 1, padding: 24 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>Current Heart Rate</div>
                <Doughnut data={doughnutData} options={{
                  cutout: "80%",
                  plugins: { legend: { display: false }, tooltip: { enabled: false } },
                  circumference: 180,
                  rotation: 270,
                  animation: { duration: 800, easing: "easeOutQuart" },
                  responsive: true,
                  maintainAspectRatio: false,
                }} height={180} />
                <div style={{ position: "relative", top: -120, textAlign: "center", fontSize: 32, fontWeight: 700, color: "#00ffd0", textShadow: "0 0 8px #00ffd0, 0 0 2px #fff" }}>{hr.toFixed(0)}</div>
              </div>
            </div>
          )}
          {/* Variability Page */}
          {page === "variability" && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 32, justifyContent: "center", width: "100%" }}>
              <div style={{ ...glass, minWidth: 220, padding: 24, textAlign: "center", flex: 1, maxWidth: 320 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>RMSSD</div>
                <div style={{ fontSize: 32, fontWeight: 700, color: "#00ffd0" }}>{rmssd} ms</div>
                <div style={{ color: "#bfc9d9", marginTop: 4 }}>Root Mean Square of Successive Differences</div>
              </div>
              <div style={{ ...glass, minWidth: 220, padding: 24, textAlign: "center", flex: 1, maxWidth: 320 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>SDNN</div>
                <div style={{ fontSize: 32, fontWeight: 700, color: "#4f8cff" }}>{sdnn} ms</div>
                <div style={{ color: "#bfc9d9", marginTop: 4 }}>Standard Deviation of NN intervals</div>
              </div>
              <div style={{ ...glass, minWidth: 220, padding: 24, textAlign: "center", flex: 1, maxWidth: 320 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>pNN50</div>
                <div style={{ fontSize: 32, fontWeight: 700, color: "#f7b801" }}>{pnn50} %</div>
                <div style={{ color: "#bfc9d9", marginTop: 4 }}>Proportion of NN50 divided by total NN intervals</div>
              </div>
              {/* Poincaré Plot */}
              <div style={{ ...glass, minWidth: 320, maxWidth: 600, flex: 2, padding: 24 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>Poincaré Plot</div>
                <Scatter data={scatterData} options={{
                  plugins: { legend: { display: false } },
                  scales: {
                    x: { title: { display: true, text: "RRn (ms)" }, grid: { color: "rgba(79,140,255,0.08)" } },
                    y: { title: { display: true, text: "RRn+1 (ms)" }, grid: { color: "rgba(79,140,255,0.08)" } },
                  },
                  animation: { duration: 800, easing: "easeOutQuart" },
                  responsive: true,
                  maintainAspectRatio: false,
                }} height={180} />
              </div>
            </div>
          )}
          {/* Stats Page */}
          {page === "stats" && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 32, justifyContent: "center", width: "100%" }}>
              <div style={{ ...glass, minWidth: 220, padding: 24, textAlign: "center", flex: 1, maxWidth: 320 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>Current Average</div>
                <div style={{ fontSize: 32, fontWeight: 700, color: "#00ffd0" }}>{(hrHistory.reduce((a, b) => a + b, 0) / hrHistory.length).toFixed(1)} BPM</div>
              </div>
              <div style={{ ...glass, minWidth: 220, padding: 24, textAlign: "center", flex: 1, maxWidth: 320 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>Standard Deviation</div>
                <div style={{ fontSize: 32, fontWeight: 700, color: "#4f8cff" }}>{calcSDNN(hrHistory).toFixed(1)}</div>
              </div>
              <div style={{ ...glass, minWidth: 220, padding: 24, textAlign: "center", flex: 1, maxWidth: 320 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>Median Rate</div>
                <div style={{ fontSize: 32, fontWeight: 700, color: "#f7b801" }}>{[...hrHistory].sort((a, b) => a - b)[Math.floor(hrHistory.length / 2)].toFixed(1)}</div>
              </div>
              <div style={{ ...glass, minWidth: 220, padding: 24, textAlign: "center", flex: 1, maxWidth: 320 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>Mode Rate</div>
                <div style={{ fontSize: 32, fontWeight: 700, color: "#ff4f81" }>{mode(hrHistory).toFixed(1)}</div>
              </div>
              {/* Distribution Chart */}
              <div style={{ ...glass, minWidth: 320, maxWidth: 600, flex: 2, padding: 24 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>Distribution</div>
                <Line data={{
                  labels: Array.from({ length: hrHistory.length }, (_, i) => i - hrHistory.length + 1),
                  datasets: [
                    {
                      label: "Heart Rate (BPM)",
                      data: hrHistory,
                      borderColor: "#ff4f81",
                      backgroundColor: "rgba(255,79,129,0.15)",
                      tension: 0.4,
                      pointRadius: 0,
                      fill: true,
                    },
                  ],
                }} options={{
                  plugins: { legend: { display: false } },
                  scales: {
                    x: { display: false },
                    y: { min: 50, max: 120, grid: { color: "rgba(79,140,255,0.08)" } },
                  },
                  animation: { duration: 800, easing: "easeOutQuart" },
                  responsive: true,
                  maintainAspectRatio: false,
                }} height={180} />
              </div>
              {/* Radar Chart */}
              <div style={{ ...glass, minWidth: 320, maxWidth: 400, flex: 1, padding: 24 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>Zones Radar</div>
                <Radar data={radarData} options={{
                  plugins: { legend: { display: false } },
                  scales: { r: { beginAtZero: true, max: 100 } },
                  animation: { duration: 800, easing: "easeOutQuart" },
                  responsive: true,
                  maintainAspectRatio: false,
                }} height={180} />
              </div>
            </div>
          )}
          {/* Historical Page */}
          {page === "historical" && (
            <div style={{ ...glass, minWidth: 320, maxWidth: 900, width: "100%", padding: 24, margin: "0 auto" }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Historical Heart Rate (Mocked)</div>
              <Line data={lineData} options={{
                plugins: { legend: { display: false } },
                scales: {
                  x: { display: false },
                  y: { min: 50, max: 120, grid: { color: "rgba(79,140,255,0.08)" } },
                },
                animation: { duration: 800, easing: "easeOutQuart" },
                responsive: true,
                maintainAspectRatio: false,
              }} height={320} />
            </div>
          )}
        </main>
      </div>
      {/* Modal for metric details */}
      {modal && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setModal(null)}>
          <div style={{ ...glass, minWidth: 320, maxWidth: 400, padding: 32, textAlign: "center", position: "relative" }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setModal(null)} style={{ position: "absolute", top: 12, right: 12, background: "none", border: "none", color: "#fff", fontSize: 24, cursor: "pointer" }}>&times;</button>
            {modal === "hr" && <>
              <div style={{ fontSize: 48, color: "#ff4f81", marginBottom: 8 }}>❤️</div>
              <div style={{ fontSize: 32, fontWeight: 700 }}>{hr.toFixed(0)} BPM</div>
              <div style={{ color: "#bfc9d9", marginTop: 8 }}>Your current heart rate. Normal range: 60-100 BPM.</div>
            </>}
            {modal === "spo2" && <>
              <div style={{ fontSize: 48, color: "#00ffd0", marginBottom: 8 }}>🫁</div>
              <div style={{ fontSize: 32, fontWeight: 700 }}>{spo2.toFixed(1)}%</div>
              <div style={{ color: "#bfc9d9", marginTop: 8 }}>Your current blood oxygen saturation. Normal: 95-100%.</div>
            </>}
            {modal === "temp" && <>
              <div style={{ fontSize: 48, color: "#f7b801", marginBottom: 8 }}>🌡️</div>
              <div style={{ fontSize: 32, fontWeight: 700 }}>{temp.toFixed(1)}°C</div>
              <div style={{ color: "#bfc9d9", marginTop: 8 }}>Your current body temperature. Normal: 36.1-37.2°C.</div>
            </>}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper for mode
function mode(arr) {
  const freq = {};
  let max = 0, res = arr[0];
  for (const n of arr) {
    freq[n] = (freq[n] || 0) + 1;
    if (freq[n] > max) {
      max = freq[n];
      res = n;
    }
  }
  return res;
} 