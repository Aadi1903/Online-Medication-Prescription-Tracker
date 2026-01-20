import React, { useEffect, useState } from "react";
import {
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import { Bell, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";

export default function AdminReminders() {
    const [reminders, setReminders] = useState([]);
    const [loading, setLoading] = useState(true);

    // Stats State
    const [stats, setStats] = useState({
        total: 0,
        adherenceRate: 0,
        missed: 0,
        today: 0
    });

    const [pieData, setPieData] = useState([]);
    const [lineData, setLineData] = useState([]);

    useEffect(() => {
        const fetchReminders = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "reminders"));
                const data = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().timestamp ? doc.data().timestamp.toDate() : new Date()
                }));

                setReminders(data);
                processData(data);
            } catch (error) {
                console.error("Error fetching reminders:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchReminders();
    }, []);

    const processData = (data) => {
        if (!data || data.length === 0) return;

        // 1. Basic Stats
        const total = data.length;
        const taken = data.filter(r => r.status === "taken").length;
        const skipped = data.filter(r => r.status === "skipped").length;
        const adherenceRate = total > 0 ? Math.round((taken / total) * 100) : 0;

        // Check today's activity
        const today = new Date();
        const todayCount = data.filter(r => {
            return r.createdAt.getDate() === today.getDate() &&
                r.createdAt.getMonth() === today.getMonth() &&
                r.createdAt.getFullYear() === today.getFullYear();
        }).length;

        setStats({
            total,
            adherenceRate,
            missed: skipped,
            today: todayCount
        });

        // 2. Pie Chart Data (Adherence)
        setPieData([
            { name: "Taken", value: taken, color: "#22c55e" },
            { name: "Skipped", value: skipped, color: "#ef4444" },
        ]);

        // 3. Line Chart Data (Last 7 Days)
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dayName = d.toLocaleDateString('en-US', { weekday: 'short' }); // e.g., Mon, Tue
            last7Days.push({ date: d, name: dayName, count: 0 });
        }

        data.forEach(r => {
            // Find matching day in last7Days
            const rDate = r.createdAt;
            const dayItem = last7Days.find(d =>
                d.date.getDate() === rDate.getDate() &&
                d.date.getMonth() === rDate.getMonth() &&
                d.date.getFullYear() === rDate.getFullYear()
            );
            if (dayItem) {
                dayItem.count++;
            }
        });

        setLineData(last7Days);
    };

    const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" style={{ fontSize: '14px', fontWeight: 'bold' }}>
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    if (loading) return <div style={{ color: "white", padding: 20 }}>Loading analytics...</div>;

    return (
        <div className="hide-scrollbar" style={containerStyle}>
            {/* HEADER */}
            <div style={{ marginBottom: "30px" }}>
                <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "8px" }}>
                    Reminder Analytics
                </h1>
                <p style={{ color: "#888", fontSize: "1rem" }}>
                    Real-time overview of system-wide reminder performance (Based on {stats.total} records).
                </p>
            </div>

            {/* STATS CARDS - keeping only 3 important ones */}
            <div style={statsGrid}>
                <StatCard icon={<Bell size={24} color="#3b82f6" />} label="Total Logs" value={stats.total} change="All time" />
                <StatCard icon={<CheckCircle size={24} color="#22c55e" />} label="Adherence Rate" value={`${stats.adherenceRate}%`} change={stats.adherenceRate > 80 ? "Good" : "Needs Impr."} />
                <StatCard icon={<AlertTriangle size={24} color="#ef4444" />} label="Skipped Doses" value={stats.missed} change="Warning" isBad={true} />
            </div>

            {/* GRAPHS ROW: SIDE BY SIDE */}
            <div style={chartsRow}>

                {/* PIE CHART: Adherence */}
                <div style={chartCard}>
                    <h3 style={chartTitle}>Adherence Breakdown</h3>
                    <div style={{ height: "300px", display: "flex", justifyContent: "center", alignItems: "center" }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                    label={renderPieLabel} // Added label for percentage
                                    labelLine={false}
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: "#111", border: "1px solid #333", borderRadius: "8px" }}
                                    formatter={(value) => [`${value} Doses`, "Count"]}
                                />
                                <Legend layout="horizontal" verticalAlign="bottom" align="center" margin={{ top: 20 }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* LINE CHART: Activity Over Week */}
                <div style={chartCard}>
                    <h3 style={chartTitle}>Activity (Last 7 Days)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={lineData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                            <XAxis dataKey="name" stroke="#888" />
                            <YAxis stroke="#888" allowDecimals={false} />
                            <Tooltip contentStyle={{ backgroundColor: "#111", border: "1px solid #333", borderRadius: "8px" }} />
                            <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: "#8b5cf6" }} activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

            </div>
        </div>
    );
}

// --- SUB-COMPONENTS & STYLES ---

function StatCard({ icon, label, value, change, isBad }) {
    const changeColor = isBad ? "#ef4444" : "#22c55e";

    return (
        <div style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "12px" }}>
                <div style={{ background: "rgba(255,255,255,0.05)", padding: "10px", borderRadius: "12px" }}>
                    {icon}
                </div>
                <span style={{ color: changeColor, fontSize: "0.9rem", fontWeight: "600", background: `${changeColor}20`, padding: "4px 8px", borderRadius: "20px" }}>
                    {change}
                </span>
            </div>
            <div style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "4px" }}>{value}</div>
            <div style={{ color: "#888", fontSize: "0.9rem" }}>{label}</div>
        </div>
    );
}

const containerStyle = {
    padding: "20px",
    color: "white",
    width: "100%", // Full width
    margin: "0",   // Remove auto margin
    height: "100vh",
    overflowY: "auto",
    paddingBottom: "100px",
    boxSizing: "border-box" // Ensure padding is included
};

const statsGrid = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "20px",
    marginBottom: "30px",
};

const cardStyle = {
    background: "#111",
    border: "1px solid #222",
    borderRadius: "16px",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
};

const chartsRow = {
    display: "flex",
    gap: "20px",
    flexWrap: "wrap", // Allow wrapping on small screens
};

const chartCard = {
    background: "#111",
    border: "1px solid #222",
    borderRadius: "16px",
    padding: "24px",
    flex: 1,           // Take equal space
    minWidth: "350px", // Minimum width before wrapping
};

const chartTitle = {
    fontSize: "1.2rem",
    fontWeight: "600",
    marginBottom: "20px",
    color: "#eee",
};
