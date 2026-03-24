import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import {
    collection,
    onSnapshot,
    addDoc,
    deleteDoc,
    doc,
    updateDoc,
    serverTimestamp,
} from "firebase/firestore";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import { Plus, Trash, Edit, AlertCircle, Search, Package } from "lucide-react";

export default function PharmacistDashboard({ showToast }) {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);

    // Search state
    const [searchTerm, setSearchTerm] = useState("");

    // New Drug Form State
    const [newDrug, setNewDrug] = useState({
        name: "",
        batchNumber: "",
        expiryDate: "",
        stock: 0,
        price: 0,
        composition: "",
    });

    useEffect(() => {
        // Listen to inventory
        const unsub = onSnapshot(collection(db, "inventory"), (snap) => {
            const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            setInventory(list);
            setLoading(false);

            // SEED DATA IF EMPTY (Auto-run once)
            if (list.length === 0 && !localStorage.getItem("inventorySeeded")) {
                seedInventory();
            }
        });
        return () => unsub();
    }, []);

    const seedInventory = async () => {
        const medicines = [
            { name: "Paracetamol 500mg", stock: 120, expiryDate: "2026-12-31", batchNumber: "PCM-001", price: 20, composition: "Paracetamol IP" },
            { name: "Amoxicillin 250mg", stock: 10, expiryDate: "2025-06-15", batchNumber: "AMX-023", price: 45, composition: "Amoxicillin Trihydrate" }, // Low Stock
            { name: "Ibuprofen 400mg", stock: 85, expiryDate: "2026-08-20", batchNumber: "IBP-112", price: 30, composition: "Ibuprofen" },
            { name: "Cetirizine 10mg", stock: 200, expiryDate: "2027-01-10", batchNumber: "CTZ-554", price: 15, composition: "Cetirizine Hydrochloride" },
            { name: "Metformin 500mg", stock: 15, expiryDate: "2025-11-30", batchNumber: "MET-889", price: 25, composition: "Metformin HCl" }, // Low Stock
            { name: "Atorvastatin 10mg", stock: 60, expiryDate: "2026-05-22", batchNumber: "ATV-332", price: 110, composition: "Atorvastatin Calcium" },
            { name: "Omeprazole 20mg", stock: 18, expiryDate: "2025-09-05", batchNumber: "OMP-776", price: 40, composition: "Omeprazole" }, // Low Stock
            { name: "Aspirin 75mg", stock: 300, expiryDate: "2024-12-01", batchNumber: "ASP-998", price: 10, composition: "Acetylsalicylic Acid" }, // Expired
            { name: "Azithromycin 500mg", stock: 45, expiryDate: "2026-03-15", batchNumber: "AZM-221", price: 85, composition: "Azithromycin" },
            { name: "Pantoprazole 40mg", stock: 90, expiryDate: "2026-10-20", batchNumber: "PAN-445", price: 55, composition: "Pantoprazole Sodium" },
            { name: "Diclofenac 50mg", stock: 5, expiryDate: "2025-08-10", batchNumber: "DIC-663", price: 25, composition: "Diclofenac Sodium" }, // Critically Low
            { name: "Losartan 50mg", stock: 75, expiryDate: "2026-04-18", batchNumber: "LOS-119", price: 60, composition: "Losartan Potassium" },
            { name: "Ranitidine 150mg", stock: 12, expiryDate: "2025-02-28", batchNumber: "RAN-002", price: 18, composition: "Ranitidine HCl" }, // Low & Expiring Soon
            { name: "Ciprofloxacin 500mg", stock: 55, expiryDate: "2026-07-07", batchNumber: "CIP-444", price: 70, composition: "Ciprofloxacin HCl" },
            { name: "Montelukast 10mg", stock: 100, expiryDate: "2027-05-05", batchNumber: "MON-339", price: 90, composition: "Montelukast Sodium" },
        ];

        console.log("Seeding inventory...");
        for (const med of medicines) {
            await addDoc(collection(db, "inventory"), {
                ...med,
                addedAt: serverTimestamp()
            });
        }
        localStorage.setItem("inventorySeeded", "true");
        console.log("Seeding complete.");
    };

    const handleAddDrug = async (e) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, "inventory"), {
                ...newDrug,
                stock: parseInt(newDrug.stock),
                price: parseFloat(newDrug.price),
                addedAt: serverTimestamp(),
            });
            showToast("Medicine added successfully", "success");
            setShowAddModal(false);
            setNewDrug({ name: "", batchNumber: "", expiryDate: "", stock: 0, price: 0, composition: "" });
        } catch (err) {
            console.error("Error adding drug:", err);
            showToast("Failed to add drug", "error");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this item?")) {
            await deleteDoc(doc(db, "inventory", id));
            showToast("Item deleted", "success");
        }
    };

    // --- ANALYTICS DATA PREP ---
    const lowStockThreshold = 20;
    const lowStockItems = inventory.filter((i) => i.stock < lowStockThreshold);

    // Mock sales data (since we don't have a real sales collection yet)
    const salesData = inventory.slice(0, 5).map(item => ({
        name: item.name,
        stock: item.stock,
        sales: Math.floor(Math.random() * 100) + 10 // Mock sales
    }));

    const pieData = [
        { name: "In Stock", value: inventory.length - lowStockItems.length, color: "#22c55e" },
        { name: "Low Stock", value: lowStockItems.length, color: "#ef4444" },
    ];

    if (loading) return <div style={{ color: "white", padding: 20 }}>Loading Inventory...</div>;

    return (
        <div className="hide-scrollbar" style={containerStyle}>
            {/* HEADER */}
            <div style={{ marginBottom: "30px" }}>
                <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "8px" }}>
                    Pharmacy Dashboard
                </h1>
                <p style={{ color: "#888", fontSize: "1rem" }}>
                    Manage inventory, track stock levels, and view sales analytics.
                </p>
            </div>

            {/* ANALYTICS ROW */}
            <div style={chartsRow}>
                {/* Sales vs Stock */}
                <div style={chartCard}>
                    <h3 style={chartTitle}>Stock vs Sales (Top Items)</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={salesData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                            <XAxis dataKey="name" stroke="#888" />
                            <YAxis stroke="#888" />
                            <Tooltip contentStyle={{ backgroundColor: "#111", border: "1px solid #333", borderRadius: "8px" }} />
                            <Legend />
                            <Bar dataKey="stock" fill="#3b82f6" name="Current Stock" />
                            <Bar dataKey="sales" fill="#eab308" name="Est. Sales" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Inventory Health */}
                <div style={chartCard}>
                    <h3 style={chartTitle}>Inventory Health</h3>
                    <div style={{ height: "250px", display: "flex", justifyContent: "center", alignItems: "center" }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: "#111", border: "1px solid #333", borderRadius: "8px" }} />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* INVENTORY SECTION */}
            <div style={{ marginTop: "40px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <h2 style={{ fontSize: "1.5rem", fontWeight: "600" }}>Inventory Management</h2>
                    <button style={addBtn} onClick={() => setShowAddModal(true)}>
                        <Plus size={18} /> Add Medicine
                    </button>
                </div>

                {/* Search Bar */}
                <div style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px", background: "#111", padding: "10px 15px", borderRadius: "10px", width: "fit-content", border: "1px solid #333" }}>
                    <Search size={18} color="#888" />
                    <input
                        placeholder="Search medicines..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ background: "transparent", border: "none", outline: "none", color: "white", fontSize: "1rem", minWidth: "250px" }}
                    />
                </div>

                {/* ITEMS TABLe */}
                <div style={tableContainer}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ borderBottom: "1px solid #333", textAlign: "left" }}>
                                <th style={thStyle}>Medicine Name</th>
                                <th style={thStyle}>Batch No</th>
                                <th style={thStyle}>Expiry</th>
                                <th style={thStyle}>Stock</th>
                                <th style={thStyle}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {inventory.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase())).map((item) => (
                                <tr key={item.id} style={{ borderBottom: "1px solid #222" }}>
                                    <td style={tdStyle}>
                                        <div style={{ fontWeight: "bold" }}>{item.name}</div>
                                        <div style={{ fontSize: "0.8rem", color: "#666" }}>{item.composition || "No composition info"}</div>
                                    </td>
                                    <td style={tdStyle}>{item.batchNumber}</td>
                                    <td style={tdStyle}>
                                        <span style={{ color: new Date(item.expiryDate) < new Date() ? "#ef4444" : "#ccc" }}>
                                            {item.expiryDate}
                                        </span>
                                    </td>
                                    <td style={tdStyle}>
                                        <span style={{
                                            color: item.stock < 20 ? "#ef4444" : "#22c55e",
                                            fontWeight: "bold"
                                        }}>
                                            {item.stock}
                                        </span>
                                    </td>
                                    <td style={tdStyle}>
                                        <button style={iconBtn} onClick={() => handleDelete(item.id)}><Trash size={16} color="#ef4444" /></button>
                                    </td>
                                </tr>
                            ))}
                            {inventory.length === 0 && (
                                <tr>
                                    <td colSpan="5" style={{ padding: "30px", textAlign: "center", color: "#666" }}>
                                        No medicines in inventory. Add some to get started.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ADD DRUG MODAL */}
            {showAddModal && (
                <div style={overlay}>
                    <div style={modal}>
                        <h2 style={{ marginBottom: "20px" }}>Add New Medicine</h2>
                        <form onSubmit={handleAddDrug} style={{ display: "grid", gap: "15px" }}>
                            <input style={input} placeholder="Medicine Name" required value={newDrug.name} onChange={e => setNewDrug({ ...newDrug, name: e.target.value })} />
                            <input style={input} placeholder="Batch Number" required value={newDrug.batchNumber} onChange={e => setNewDrug({ ...newDrug, batchNumber: e.target.value })} />
                            <input style={input} type="date" placeholder="Expiry Date" required value={newDrug.expiryDate} onChange={e => setNewDrug({ ...newDrug, expiryDate: e.target.value })} />
                            <div style={{ display: "flex", gap: "15px" }}>
                                <input style={input} type="number" placeholder="Stock Qty" required value={newDrug.stock || ""} onChange={e => setNewDrug({ ...newDrug, stock: e.target.value })} />
                                <input style={input} type="number" placeholder="Price (₹)" required value={newDrug.price || ""} onChange={e => setNewDrug({ ...newDrug, price: e.target.value })} />
                            </div>
                            <input style={input} placeholder="Composition / Details" value={newDrug.composition} onChange={e => setNewDrug({ ...newDrug, composition: e.target.value })} />

                            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                                <button type="button" onClick={() => setShowAddModal(false)} style={cancelBtn}>Cancel</button>
                                <button type="submit" style={submitBtn}>Add Medicine</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}

// --- STYLES ---

const containerStyle = {
    padding: "20px",
    color: "white",
    width: "100%",
    height: "100vh",
    overflowY: "auto",
    paddingBottom: "100px",
};

const chartsRow = {
    display: "flex",
    gap: "20px",
    flexWrap: "wrap",
};

const chartCard = {
    background: "#111",
    border: "1px solid #222",
    borderRadius: "16px",
    padding: "24px",
    flex: 1,
    minWidth: "350px",
};

const chartTitle = {
    fontSize: "1.2rem",
    fontWeight: "600",
    marginBottom: "20px",
    color: "#eee",
};

const addBtn = {
    background: "#2563eb",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: "10px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontWeight: "600"
};

const tableContainer = {
    background: "#111",
    borderRadius: "16px",
    border: "1px solid #222",
    overflow: "hidden"
};

const thStyle = {
    padding: "16px",
    color: "#888",
    fontSize: "0.9rem",
    fontWeight: "600",
    borderBottom: "1px solid #333"
};

const tdStyle = {
    padding: "16px",
    color: "#eee",
    fontSize: "0.95rem"
};

const iconBtn = {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    padding: "5px"
};

const overlay = {
    position: "fixed",
    top: 0, left: 0,
    width: "100%", height: "100%",
    background: "rgba(0,0,0,0.7)",
    backdropFilter: "blur(5px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000
};

const modal = {
    background: "#1a1a1a",
    padding: "30px",
    borderRadius: "20px",
    width: "400px",
    maxWidth: "90%",
    border: "1px solid #333"
};

const input = {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    background: "#0d0d0d",
    border: "1px solid #333",
    color: "white",
    outline: "none"
};

const submitBtn = {
    flex: 1,
    padding: "12px",
    borderRadius: "10px",
    border: "none",
    background: "#22c55e",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer"
};

const cancelBtn = {
    flex: 1,
    padding: "12px",
    borderRadius: "10px",
    border: "none",
    background: "#dc2626",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer"
};
