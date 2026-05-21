import { useState, useEffect, useRef, useCallback } from "react";
import {LineChart, Line, XAxis, YAxis, CartesianGrid,Tooltip, ResponsiveContainer, Area, AreaChart, ReferenceLine} from "recharts";

/* ─────────────────────────────────────────────
   CONSTANTS & MOCK DATA
───────────────────────────────────────────── */
const GOLD = "#D4AF37";
const GOLD_LIGHT = "#F0D060";
const GOLD_DIM = "#8A6E1A";

const MOCK_RESULTS = {
  "Full Stack Developer": { base: 115000, demand: 92, risk: 18 },
  "Frontend Developer":   { base: 105000, demand: 88, risk: 22 },
  "Backend Developer":    { base: 118000, demand: 89, risk: 20 },
  "ML / AI Engineer":     { base: 165000, demand: 98, risk: 8  },
  "DevOps Engineer":      { base: 125000, demand: 91, risk: 15 },
  "Data Scientist":       { base: 130000, demand: 94, risk: 14 },
  "Mobile Developer":     { base: 110000, demand: 83, risk: 24 },
  "Blockchain Developer": { base: 145000, demand: 76, risk: 12 },
  "Security Engineer":    { base: 135000, demand: 96, risk: 9  },
  "Cloud Architect":      { base: 155000, demand: 97, risk: 7  },
};

const EXP_MULT = { "Entry Level (0–2 yrs)": 0.60, "Mid Level (3–5 yrs)": 0.85, "Senior (6–9 yrs)": 1.00, "Lead / Principal (10–14 yrs)": 1.30, "Staff / Director (15+ yrs)": 1.65 };
const COUNTRY_MULT = { "United States": 1.00, "United Kingdom": 0.82, "Germany": 0.78, "Canada": 0.80, "Australia": 0.79, "India": 0.22, "Singapore": 0.88, "Netherlands": 0.81, "Sweden": 0.75, "Japan": 0.65, "France": 0.74, "Brazil": 0.28 };
const COMPANY_MULT = { "FAANG / Tier-1 (Google, Meta…)": 1.45, "Unicorn Startup": 1.20, "Mid-Size Tech": 1.00, "Fortune 500 Non-Tech": 0.95, "Government / Public Sector": 0.78, "Early-Stage Startup": 0.88 };

const buildTrend = (base) =>
  Array.from({ length: 8 }, (_, i) => ({
    year: 2025 + i,
    salary: Math.round(base * (1 + i * 0.065 + Math.random() * 0.02)),
    upper: Math.round(base * (1 + i * 0.065 + 0.07)),
    lower: Math.round(base * (1 + i * 0.065 - 0.04)),
  }));

/* ─────────────────────────────────────────────
   ANIMATED MESH BACKGROUND
───────────────────────────────────────────── */
function MeshBackground() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const frameRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let W, H;

    const resize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const onMouse = (e) => {
      mouseRef.current = { x: e.clientX / W, y: e.clientY / H };
    };
    window.addEventListener("mousemove", onMouse);

    const COLS = 18, ROWS = 12;
    let t = 0;

    const draw = () => {
      t += 0.004;
      ctx.clearRect(0, 0, W, H);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      for (let c = 0; c <= COLS; c++) {
        for (let r = 0; r <= ROWS; r++) {
          const bx = (c / COLS) * W;
          const by = (r / ROWS) * H;

          // Wave distortion
          const wave = Math.sin(c * 0.5 + t) * 8 + Math.cos(r * 0.6 + t * 1.2) * 6;
          // Mouse parallax
          const px = (mx - 0.5) * 30 * ((c / COLS) - 0.5);
          const py = (my - 0.5) * 30 * ((r / ROWS) - 0.5);

          const x = bx + wave + px;
          const y = by + wave * 0.6 + py;

          // Proximity to mouse glow
          const dx = bx / W - mx;
          const dy = by / H - my;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const glow = Math.max(0, 1 - dist / 0.35);

          if (c > 0 && r > 0) {
            // horizontal line
            const prevBx = ((c - 1) / COLS) * W;
            const prevWave = Math.sin((c - 1) * 0.5 + t) * 8 + Math.cos(r * 0.6 + t * 1.2) * 6;
            const prevPx = (mx - 0.5) * 30 * (((c - 1) / COLS) - 0.5);
            const prevX = prevBx + prevWave + prevPx;
            const prevY = by + prevWave * 0.6 + py;

            const grad = ctx.createLinearGradient(prevX, prevY, x, y);
            grad.addColorStop(0, `rgba(212,175,55,${0.06 + glow * 0.25})`);
            grad.addColorStop(0.5, `rgba(212,175,55,${0.12 + glow * 0.35})`);
            grad.addColorStop(1, `rgba(212,175,55,${0.06 + glow * 0.25})`);
            ctx.beginPath();
            ctx.moveTo(prevX, prevY);
            ctx.lineTo(x, y);
            ctx.strokeStyle = grad;
            ctx.lineWidth = 0.5 + glow * 1;
            ctx.stroke();
          }

          // Node dot
          ctx.beginPath();
          ctx.arc(x, y, glow > 0.4 ? 2 : 1, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(212,175,55,${0.2 + glow * 0.7})`;
          ctx.fill();
        }
      }
      frameRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouse);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", opacity: 0.55 }}
    />
  );
}

/* ─────────────────────────────────────────────
   HEADER
───────────────────────────────────────────── */
function Header() {
  return (
    <header style={{ textAlign: "center", padding: "56px 24px 32px", position: "relative", zIndex: 10 }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span style={{
          width: 36, height: 36, borderRadius: "50%",
          background: `radial-gradient(circle, ${GOLD_LIGHT}, ${GOLD})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 0 18px ${GOLD}88, 0 0 36px ${GOLD}44`,
          fontSize: 18,
        }}>◈</span>
        <span style={{
          fontSize: 11, letterSpacing: 6, textTransform: "uppercase",
          color: GOLD, fontFamily: "'Courier New', monospace", fontWeight: 700,
        }}>AI POWERED</span>
      </div>
      <h1 style={{
        margin: 0,
        fontSize: "clamp(28px, 5vw, 52px)",
        fontFamily: "'Georgia', serif",
        fontWeight: 400,
        letterSpacing: 2,
        color: "#fff",
        lineHeight: 1.15,
      }}>
        Prediction Dashboard
        <span style={{
          display: "block",
          background: `linear-gradient(135deg, ${GOLD_LIGHT}, ${GOLD}, #8B6914)`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          fontSize: "0.82em",
          letterSpacing: 8,
          textTransform: "uppercase",
          fontFamily: "'Courier New', monospace",
          fontWeight: 700,
          marginTop: 4,
        }}>Of Software Industries</span>
      </h1>
      <p style={{
        marginTop: 16, color: "#999", fontSize: 15,
        letterSpacing: 2, textTransform: "uppercase",
        fontFamily: "'Courier New', monospace",
      }}>
        Predict Future Trends in the Software Industry
      </p>
      <div style={{
        width: 120, height: 1, margin: "20px auto 0",
        background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
      }} />
    </header>
  );
}

/* ─────────────────────────────────────────────
   SELECT COMPONENT
───────────────────────────────────────────── */
function GoldSelect({ label, value, onChange, options, icon }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{
        fontSize: 10, letterSpacing: 3, textTransform: "uppercase",
        color: GOLD_DIM, fontFamily: "'Courier New', monospace",
      }}>{icon} {label}</label>
      <div style={{ position: "relative" }}>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: "100%", padding: "12px 40px 12px 14px",
            background: "rgba(255,255,255,0.03)",
            border: `1px solid ${focused ? GOLD : "rgba(212,175,55,0.25)"}`,
            borderRadius: 8, color: value ? "#fff" : "#666",
            fontSize: 14, fontFamily: "'Courier New', monospace",
            outline: "none", cursor: "pointer", appearance: "none",
            transition: "border-color 0.25s, box-shadow 0.25s",
            boxShadow: focused ? `0 0 12px ${GOLD}33` : "none",
          }}
        >
          <option value="" style={{ background: "#111" }}>— Select —</option>
          {options.map((o) => (
            <option key={o} value={o} style={{ background: "#111" }}>{o}</option>
          ))}
        </select>
        <span style={{
          position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
          color: GOLD, pointerEvents: "none", fontSize: 10,
        }}>▼</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   INPUT FORM
───────────────────────────────────────────── */
function InputForm({ onPredict, loading, devTypes, expLevels, countries }) {
  // 1. Simplified State: Only keeping the core variables found in your data
  const [devType, setDevType] = useState("");
  const [expLevel, setExpLevel] = useState("");
  const [country, setCountry] = useState("");

  // 2. Ready Condition: Button unlocks only when essential data is selected
  const ready = devType && expLevel && country;

  const handlePredict = () => {
    if (!ready) return;
    onPredict({
      devType,
      expLevel,
      country
    });
  };

  return (
    <section style={{
      maxWidth: 850,
      margin: "0 auto 60px",
      padding: "0 20px",
      position: "relative",
      zIndex: 10,
    }}>
      <div style={{
        background: "rgba(15, 15, 15, 0.6)",
        backdropFilter: "blur(25px)",
        border: "1px solid rgba(212, 175, 55, 0.15)",
        borderRadius: "24px",
        padding: "40px",
        boxShadow: "0 20px 50px rgba(0,0,0,0.5), inset 0 0 20px rgba(212, 175, 55, 0.05)"
      }}>
        
        {/* Selection Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "24px",
          marginBottom: "40px",
        }}>
          <GoldSelect 
            label="Developer Role" 
            value={devType} 
            onChange={setDevType} 
            options={devTypes || []} 
            icon="👨‍💻"
          />
          <GoldSelect 
            label="Experience Level" 
            value={expLevel} 
            onChange={setExpLevel} 
            options={expLevels || []} 
            icon="📈"
          />
          <GoldSelect 
            label="Target Country" 
            value={country} 
            onChange={setCountry} 
            options={countries || []} 
            icon="🌍"
          />
        </div>

        {/* Enhanced Predict Button */}
        <div style={{ textAlign: "center" }}>
          <button
            onClick={handlePredict}
            disabled={!ready || loading}
            style={{
              position: "relative",
              padding: "18px 56px",
              fontSize: "14px",
              fontWeight: "800",
              letterSpacing: "4px",
              textTransform: "uppercase",
              color: ready ? "#000" : "#666",
              background: ready 
                ? "linear-gradient(135deg, #F0D060 0%, #D4AF37 50%, #8B6914 100%)" 
                : "rgba(255,255,255,0.05)",
              border: "none",
              borderRadius: "50px",
              cursor: ready ? "pointer" : "not-allowed",
              transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
              boxShadow: ready 
                ? "0 10px 30px rgba(212, 175, 55, 0.4), 0 0 15px rgba(212, 175, 55, 0.2)" 
                : "none",
              transform: ready && !loading ? "scale(1)" : "scale(0.98)",
              overflow: "hidden"
            }}
            onMouseEnter={(e) => {
              if (ready) {
                e.currentTarget.style.transform = "translateY(-3px) scale(1.03)";
                e.currentTarget.style.boxShadow = "0 15px 40px rgba(212, 175, 55, 0.5)";
              }
            }}
            onMouseLeave={(e) => {
              if (ready) {
                e.currentTarget.style.transform = "translateY(0) scale(1)";
                e.currentTarget.style.boxShadow = "0 10px 30px rgba(212, 175, 55, 0.4)";
              }
            }}
          >
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <LoadingSpinner /> Processing...
              </span>
            ) : (
              "◈ Generate Prediction"
            )}
            
            {/* Glossy Overlay effect for the button */}
            {ready && (
              <div style={{
                position: "absolute",
                top: 0,
                left: "-100%",
                width: "50%",
                height: "100%",
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
                transition: "0.6s",
                animation: "shimmer 3s infinite"
              }} />
            )}
          </button>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   LOADING SPINNER
───────────────────────────────────────────── */
function LoadingSpinner() {
  return (
    <span style={{
      display: "inline-block", width: 14, height: 14,
      border: `2px solid rgba(0,0,0,0.3)`,
      borderTopColor: "#000",
      borderRadius: "50%",
      animation: "spin 0.7s linear infinite",
    }} />
  );
}

/* ─────────────────────────────────────────────
   KPI CARDS
───────────────────────────────────────────── */
function KPICard({ label, value, unit, icon, color, description, delay }) {
  const [visible, setVisible] = useState(false);

  // Trigger animation after the specified delay
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      backdropFilter: "blur(20px)",
      border: `1px solid ${color}55`,
      borderRadius: 12,
      padding: "28px 24px",
      position: "relative", 
      overflow: "hidden",
      boxShadow: `0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 ${color}22`,
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(20px)",
      transition: "opacity 0.6s ease-out, transform 0.6s ease-out",
    }}>
      {/* Glow effect matching screenshot */}
      <div style={{
        position: "absolute", top: -20, right: -20,
        width: 80, height: 80, borderRadius: "50%",
        background: `radial-gradient(circle, ${color}33, transparent)`,
        pointerEvents: "none",
      }} />

      {/* Top line accent */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
      }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "#888", fontFamily: "monospace" }}>
          {label}
        </span>
        <span style={{ fontSize: 20, lineHeight: 1, color: color }}>{icon}</span>
      </div>

      <div style={{ marginTop: 16, marginBottom: 6 }}>
        <span style={{
          fontSize: "clamp(22px, 3vw, 32px)",
          fontFamily: "Georgia, serif",
          fontWeight: 400, color: "#fff", lineHeight: 1,
        }}>{value}</span>
        {unit && <span style={{ fontSize: 13, color: color, marginLeft: 6, fontFamily: "monospace" }}>{unit}</span>}
      </div>

      <p style={{ margin: 0, fontSize: 11, color: "#555", fontFamily: "monospace", letterSpacing: 1 }}>{description}</p>

      {/* Progress Bar under the value */}
      <div style={{ marginTop: 14, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: 2,
          background: `linear-gradient(90deg, ${color}, ${color}88)`,
          width: visible ? `${Math.min(100, parseInt(value) || 75)}%` : "0%",
          transition: "width 1.5s cubic-bezier(0.1, 0.5, 0.2, 1)",
          boxShadow: `0 0 8px ${color}88`,
        }} />
      </div>
    </div>
  );
}

function KPISection({ result }) {
  const fmt = (n) => "$" + n.toLocaleString();
  return (
    <section style={{ maxWidth: 960, margin: "0 auto 40px", padding: "0 20px", position: "relative", zIndex: 10 }}>
      <SectionLabel>◆ Prediction Output</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
        <KPICard
          label="Predicted Salary" icon="◈"
          value={fmt(result.salary)} unit="/ yr"
          color={GOLD}
          description="Annual compensation estimate"
          delay={0}
        />
        <KPICard
          label="Demand Level" icon="⬡"
          value={result.demand} unit="/ 100"
          color="#4ECDC4"
          description="Market demand index"
          delay={120}
        />
        <KPICard
          label="Automation Risk" icon="⚠"
          value={result.risk} unit="%"
          color={result.risk < 15 ? "#4ECDC4" : result.risk < 30 ? GOLD : "#FF6B6B"}
          description="AI replacement probability"
          delay={240}
        />
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   CHART SECTION
───────────────────────────────────────────── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(10,10,10,0.95)",
      border: `1px solid ${GOLD}66`,
      borderRadius: 8, padding: "12px 16px",
      boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 16px ${GOLD}22`,
    }}>
      <p style={{ margin: "0 0 6px", fontSize: 11, color: GOLD, letterSpacing: 2, fontFamily: "'Courier New', monospace" }}>YEAR {label}</p>
      <p style={{ margin: 0, fontSize: 18, fontFamily: "'Georgia', serif", color: "#fff" }}>
        ${payload[0]?.value?.toLocaleString()}
      </p>
      <p style={{ margin: "4px 0 0", fontSize: 10, color: "#666", fontFamily: "'Courier New', monospace" }}>Predicted Salary</p>
    </div>
  );
};

function ChartSection({ trendData }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 300); return () => clearTimeout(t); }, []);

  return (
    <section style={{ maxWidth: 960, margin: "0 auto 40px", padding: "0 20px", position: "relative", zIndex: 10 }}>
      <SectionLabel>◆ Salary Trend Forecast (2025–2032)</SectionLabel>
      <div style={{
        background: "rgba(255,255,255,0.02)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(212,175,55,0.2)",
        borderRadius: 16, padding: "32px 28px",
        boxShadow: "0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(212,175,55,0.08)",
        opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: "all 0.6s ease",
      }}>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="salaryGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={GOLD} stopOpacity={0.25} />
                <stop offset="95%" stopColor={GOLD} stopOpacity={0} />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="year" tick={{ fill: "#555", fontSize: 11, fontFamily: "'Courier New', monospace" }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fill: "#555", fontSize: 10, fontFamily: "'Courier New', monospace" }}
              axisLine={false} tickLine={false}
              tickFormatter={(v) => "$" + (v / 1000).toFixed(0) + "k"}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: `${GOLD}44`, strokeWidth: 1, strokeDasharray: "4 4" }} />
            <Area
              type="monotone" dataKey="salary"
              stroke={GOLD} strokeWidth={2.5}
              fill="url(#salaryGrad)"
              dot={{ fill: GOLD, r: 4, strokeWidth: 0 }}
              activeDot={{ r: 7, fill: GOLD, stroke: GOLD_LIGHT, strokeWidth: 2, filter: "url(#glow)" }}
              animationDuration={1400}
              animationEasing="ease-out"
            />
            <ReferenceLine x={2025} stroke={`${GOLD}44`} strokeDasharray="4 4" label={{ value: "NOW", fill: "#666", fontSize: 9, fontFamily: "monospace" }} />
          </AreaChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 20 }}>
          {[{ color: GOLD, label: "Predicted Salary" }, { color: "#4ECDC4", label: "High Growth Path" }].map(({ color, label }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 24, height: 2, background: color, borderRadius: 1, boxShadow: `0 0 6px ${color}88` }} />
              <span style={{ fontSize: 10, color: "#666", fontFamily: "'Courier New', monospace", letterSpacing: 2, textTransform: "uppercase" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   DOWNLOAD SECTION
───────────────────────────────────────────── */
function DownloadSection({ result, params }) {
  const [clicked, setClicked] = useState(null);

  const downloadCSV = () => {
    setClicked("csv");
    const rows = [
      ["Parameter", "Value"],
      ["Developer Type", params.devType],
      ["Experience Level", params.expLevel],
      ["Country", params.country],
      ["Company Tier", params.company],
      ["", ""],
      ["Predicted Salary (USD)", result.salary],
      ["Demand Level", result.demand + "/100"],
      ["Automation Risk", result.risk + "%"],
      ["", ""],
      ["Year", "Projected Salary"],
      ...buildTrend(result.salary).map((d) => [d.year, d.salary]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "salary_prediction_report.csv";
    a.click();
    setTimeout(() => setClicked(null), 2000);
  };

  const downloadImage = () => {
    setClicked("img");
    const msg = "Dashboard screenshot captured! (In a production build, html2canvas would render the full dashboard)";
    alert(msg);
    setTimeout(() => setClicked(null), 2000);
  };

  return (
    <section style={{ maxWidth: 960, margin: "0 auto 64px", padding: "0 20px", position: "relative", zIndex: 10 }}>
      <SectionLabel>◆ Export Report</SectionLabel>
      <div style={{
        display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center",
      }}>
        {[
          { key: "csv", icon: "⬇", label: "Download CSV", fn: downloadCSV, accent: GOLD },
          { key: "img", icon: "⬛", label: "Capture Dashboard", fn: downloadImage, accent: "#4ECDC4" },
        ].map(({ key, icon, label, fn, accent }) => (
          <button key={key} onClick={fn} style={{
            padding: "13px 36px", borderRadius: 8, cursor: "pointer",
            background: clicked === key ? `${accent}22` : "rgba(255,255,255,0.03)",
            border: `1px solid ${accent}55`,
            color: accent, fontSize: 12, fontWeight: 700, letterSpacing: 3,
            textTransform: "uppercase", fontFamily: "'Courier New', monospace",
            transition: "all 0.25s",
            boxShadow: clicked === key ? `0 0 16px ${accent}44` : "none",
          }}
            onMouseEnter={(e) => { e.currentTarget.style.background = `${accent}18`; e.currentTarget.style.boxShadow = `0 0 12px ${accent}33`; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.boxShadow = "none"; }}
          >
            {clicked === key ? "✓ Done!" : `${icon} ${label}`}
          </button>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   SECTION LABEL
───────────────────────────────────────────── */
function SectionLabel({ children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
      <div style={{ flex: 1, height: "0.5px", background: `linear-gradient(90deg, ${GOLD}00, ${GOLD}55)` }} />
      <span style={{ fontSize: 10, letterSpacing: 4, textTransform: "uppercase", color: GOLD, fontFamily: "'Courier New', monospace" }}>{children}</span>
      <div style={{ flex: 1, height: "0.5px", background: `linear-gradient(90deg, ${GOLD}55, ${GOLD}00)` }} />
    </div>
  );
}

/* ─────────────────────────────────────────────
   EMPTY STATE
───────────────────────────────────────────── */
function EmptyState() {
  return (
    <div style={{
      textAlign: "center", padding: "40px 20px",
      position: "relative", zIndex: 10, maxWidth: 960, margin: "0 auto",
    }}>
      <div style={{
        width: 80, height: 80, borderRadius: "50%",
        border: `1px solid rgba(212,175,55,0.2)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 20px", fontSize: 32,
        background: "rgba(212,175,55,0.05)",
      }}>◈</div>
      <p style={{ color: "#444", fontFamily: "'Courier New', monospace", letterSpacing: 2, fontSize: 12 }}>
        Configure parameters above and click Predict to generate your salary forecast
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────
   FOOTER
───────────────────────────────────────────── */
function Footer() {
  return (
    <footer style={{
      textAlign: "center", padding: "24px",
      position: "relative", zIndex: 10,
      borderTop: "1px solid rgba(212,175,55,0.08)",
    }}>
      <p style={{ margin: 0, fontSize: 10, letterSpacing: 3, color: "#333", fontFamily: "'Courier New', monospace" }}>
        AI SALARY PREDICTION SYSTEM · MOCK DATA FOR DEMONSTRATION · {new Date().getFullYear()}
      </p>
    </footer>
  );
}

/* ─────────────────────────────────────────────
   ROOT APP
───────────────────────────────────────────── */

/* KEEP YOUR EXISTING IMPORTS LIKE:
   MeshBackground, Header, InputForm, KPISection, ChartSection, etc.
*/
// console.log("DEV TYPES:", devTypes);
export default function App() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [params, setParams] = useState(null);

  // ✅ Dropdown data
  const [devTypes, setDevTypes] = useState([]);
  const [expLevels, setExpLevels] = useState([]);
  const [countries, setCountries] = useState([]);
  const [companies, setCompanies] = useState([]);

  // ✅ Fetch dropdown options from backend
useEffect(() => {
  fetch("http://127.0.0.1:5000/options")
    .then(res => res.json())
    .then(data => {
      setDevTypes(data.devTypes);
      setExpLevels(data.experienceLevels);
      setCountries(data.countries);
      setCompanies(data.companies);
    })
    .catch(err => console.error(err));
}, []);

  // ✅ Prediction function
  const handlePredict = useCallback((p) => {
    setLoading(true);
    setResult(null);
    setParams(p); // ✅ store input

    fetch("http://127.0.0.1:5000/predict", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        devType: p.devType,
        expLevel: p.expLevel,
        country: p.country,
        company: p.company,
        year: p.year,
        remoteWork: p.remoteWork,
        aiImpact: p.aiImpact,
        automationRisk: p.automationRisk,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("API Response:", data);

        if (data.error) {
          alert(data.error);
          setLoading(false);
          return;
        }

        setResult({
          salary: data.salary,
          demand: data.demand,
          risk: data.risk,
          confidence: data.confidence,
          suggestion: data.suggestion,
        });

        setTrendData(buildTrend(data.salary));
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#080808", color: "#fff", position: "relative" }}>
      
      <MeshBackground />

      <div style={{ position: "relative", zIndex: 10 }}>
        <Header />

        {/* ✅ PASS DATA HERE */}
        <InputForm
        onPredict={handlePredict}
        loading={loading}
        devTypes={devTypes}
        expLevels={expLevels}
        countries={countries}
        companies={companies}
        />

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "32px" }}>
            <p>Loading prediction...</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <>
            <KPISection result={result} />
            <ChartSection trendData={trendData} />
            <DownloadSection result={result} params={params} />
          </>
        )}

        {!result && !loading && <EmptyState />}

        <Footer />
      </div>
    </div>
  );
}onabort