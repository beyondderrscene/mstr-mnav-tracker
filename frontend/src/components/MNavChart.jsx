import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from "recharts";

function SmallChart({ data, dataKey, color, label, formatter, gradientId }) {
  return (
    <div>
      <p style={{ color: "#aaa", fontSize: "13px", marginBottom: "8px" }}>{label}</p>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart syncId="mstr" data={data} margin={{ top: 5, right: 20, left: 10, bottom: 30 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
          <XAxis
            dataKey="Date"
            tick={{ fill: "#888", fontSize: 10 }}
            tickFormatter={(d) => d.slice(0, 7)}
            interval={Math.floor(data.length / 6)}
          />
          <YAxis
            tick={{ fill: "#888", fontSize: 10 }}
            tickFormatter={formatter}
            domain={["auto", "auto"]}
            width={70}
          />
          <Tooltip
            contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }}
            labelStyle={{ color: "#aaa" }}
            formatter={(value) => [formatter(value), dataKey]}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            fill={`url(#${gradientId})`}
            dot={false}
            strokeWidth={1.5}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function MNavChart({ data }) {
  if (!data || data.length === 0) return <p>Loading chart...</p>;

  const filtered = data.filter((d) => d.mnav < 6);

  return (
    <div>
      <p style={{ color: "#aaa", fontSize: "13px", marginBottom: "8px" }}>
        mNAV Ratio (Market Cap / BTC NAV)
      </p>
      <ResponsiveContainer width="100%" height={350}>
        <AreaChart syncId="mstr" data={filtered} margin={{ top: 10, right: 30, left: 10, bottom: 30 }}>
          <defs>
            <linearGradient id="mnav_gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FF00FF" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#FF00FF" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
          <XAxis
            dataKey="Date"
            tick={{ fill: "#888", fontSize: 11 }}
            tickFormatter={(d) => d.slice(0, 7)}
            interval={Math.floor(filtered.length / 6)}
          />
          <YAxis
            tick={{ fill: "#888", fontSize: 11 }}
            tickFormatter={(v) => `${v.toFixed(2)}x`}
            domain={["auto", "auto"]}
            width={70}
          />
          <Tooltip
            contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }}
            labelStyle={{ color: "#aaa" }}
            formatter={(value) => [`${value.toFixed(3)}x`, "mNAV"]}
          />
          <ReferenceLine
            y={1}
            stroke="#ff4444"
            strokeDasharray="4 4"
            label={{ value: "NAV = 1x", fill: "#ff4444", fontSize: 11 }}
          />
          <Area
            type="monotone"
            dataKey="mnav"  
            stroke="#FF00FF"
            fill="url(#mnav_gradient)"
            dot={false}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginTop: "40px" }}>
        <SmallChart
          data={filtered}
          dataKey="mstr_price"
          color="#00bfff"
          label="MSTR Stock Price (USD)"
          formatter={(v) => `$${v.toFixed(0)}`}
          gradientId="mstr_gradient"
        />
        <SmallChart
          data={filtered}
          dataKey="btc_price"
          color="#f7931a"
          label="BTC Price (USD)"
          formatter={(v) => `$${Number(v).toLocaleString()}`}
          gradientId="btc_gradient"
        />
      </div>
    </div>
  );
}

export default MNavChart;