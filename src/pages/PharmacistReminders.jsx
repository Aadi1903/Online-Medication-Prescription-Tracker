import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import {
    collection, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, deleteDoc
} from "firebase/firestore";
import { AlertTriangle, AlertOctagon, CheckCircle, Package, Plus, Edit, X } from "lucide-react";

export default function PharmacistReminders({ showToast }) {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal States
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    const [formData, setFormData] = useState({
        name: "", batchNumber: "", expiryDate: "", stock: 0, price: 0
    });

    useEffect(() => {
        const unsub = onSnapshot(collection(db, "inventory"), (snap) => {
            const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            setInventory(list);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    // --- LOGIC ---
    const LOW_STOCK_LIMIT = 20;
    const expiredItems = inventory.filter(i => new Date(i.expiryDate) < new Date());
    const lowStockItems = inventory.filter(i => i.stock <= LOW_STOCK_LIMIT);
    const allStockItems = [...inventory].sort((a, b) => a.stock - b.stock);

    // --- HANDLERS ---
    const openAddModal = () => {
        setFormData({ name: "", batchNumber: "", expiryDate: "", stock: 0, price: 0 });
        setIsEditing(false);
        setShowModal(true);
    };

    const openEditModal = (item) => {
        setFormData({
            name: item.name,
            batchNumber: item.batchNumber,
            expiryDate: item.expiryDate,
            stock: item.stock,
            price: item.price || 0
        });
        setCurrentId(item.id);
        setIsEditing(true);
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await updateDoc(doc(db, "inventory", currentId), {
                    ...formData,
                    stock: parseInt(formData.stock),
                    price: parseFloat(formData.price)
                });
                showToast("Medicine updated successfully", "success");
            } else {
                await addDoc(collection(db, "inventory"), {
                    ...formData,
                    stock: parseInt(formData.stock),
                    price: parseFloat(formData.price),
                    addedAt: serverTimestamp()
                });
                showToast("Medicine added successfully", "success");
            }
            setShowModal(false);
        } catch (err) {
            console.error(err);
            showToast("Error saving medicine", "error");
        }
    };

    if (loading) return <div style={{ color: "white", padding: 20 }}>Checking stock alerts...</div>;

    return (
        <div className="hide-scrollbar" style={containerStyle}>
            <div style={{ marginBottom: "30px" }}>
                <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "8px" }}>
                    Stock Alerts & Overview
                </h1>
                
            </div>

            <div style={{ display: "grid", gap: "40px" }}>

                {/* --- ALERTS SECTION --- */}
                {(expiredItems.length > 0 || lowStockItems.length > 0) && (
                    <div style={{ display: "grid", gap: "20px" }}>
                        {expiredItems.length > 0 && (
                            <div style={{ ...alertSection, borderColor: "#ef4444" }}>
                                <div style={sectionHeader}>
                                    <AlertOctagon color="#ef4444" size={24} />
                                    <h2 style={{ fontSize: "1.4rem", color: "#ef4444", margin: 0 }}>Expired Medicines</h2>
                                </div>
                                <div style={itemsGrid}>
                                    {expiredItems.map(item => (
                                        <div key={item.id} style={alertCard}>
                                            <div style={{ fontWeight: "bold", fontSize: "1.1rem" }}>{item.name}</div>
                                            <div style={{ color: "#ef4444", fontWeight: "bold", marginTop: "10px" }}>Expired: {item.expiryDate}</div>
                                            <button onClick={() => openEditModal(item)} style={editBtn}>Edit</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {lowStockItems.length > 0 && (
                            <div style={{ ...alertSection, borderColor: "#ef4444" }}>
                                <div style={sectionHeader}>
                                    <AlertTriangle color="#ef4444" size={24} />
                                    <h2 style={{ fontSize: "1.4rem", color: "#ef4444", margin: 0 }}>Low Stock Alerts</h2>
                                </div>
                                <div style={itemsGrid}>
                                    {lowStockItems.map(item => (
                                        <div key={item.id} style={alertCard}>
                                            <div style={{ fontWeight: "bold", fontSize: "1.1rem" }}>{item.name}</div>
                                            <div style={{ color: "#888", fontSize: "0.9rem" }}>Stock: <span style={{ color: "#ef4444", fontWeight: "bold" }}>{item.stock}</span></div>
                                            <button onClick={() => openEditModal(item)} style={editBtn}>Edit Stock</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}


                {/* --- ALL STOCKS SECTION --- */}
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", borderTop: "1px solid #333", paddingTop: "30px" }}>
                        <Package color="#3b82f6" size={24} />
                        <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", margin: 0 }}>Current Stock Levels</h2>
                    </div>

                    {allStockItems.length === 0 ? (
                        <p style={{ opacity: 0.5 }}>Inventory is empty.</p>
                    ) : (
                        <div style={fullGrid}>
                            {allStockItems.map(item => {
                                const isLow = item.stock <= 20;
                                return (
                                    <div key={item.id} style={{
                                        ...stockCard,
                                        border: isLow ? "1px solid #ef4444" : "1px solid #333"
                                    }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "5px" }}>
                                            <div style={{ fontWeight: "bold", fontSize: "1.1rem" }}>{item.name}</div>
                                            <button onClick={() => openEditModal(item)} style={{ background: "transparent", border: "none", cursor: "pointer", padding: "2px" }}>
                                                <Edit size={16} color="#888" />
                                            </button>
                                        </div>
                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", color: "#aaa" }}>
                                            <span>Batch: {item.batchNumber}</span>
                                            <span style={{
                                                color: isLow ? "#ef4444" : "#22c55e",
                                                fontWeight: "bold"
                                            }}>
                                                Qty: {item.stock}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

            </div>

            {/* MODAL */}
            {showModal && (
                <div style={overlay}>
                    <div style={modal}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
                            <h2>{isEditing ? "Edit Medicine" : "Add New Medicine"}</h2>
                            <button onClick={() => setShowModal(false)} style={{ background: "transparent", border: "none", cursor: "pointer" }}>
                                <X color="white" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "15px" }}>
                            <input style={input} placeholder="Medicine Name" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            <input style={input} placeholder="Batch Number" required value={formData.batchNumber} onChange={e => setFormData({ ...formData, batchNumber: e.target.value })} />
                            <input style={input} type="date" placeholder="Expiry Date" required value={formData.expiryDate} onChange={e => setFormData({ ...formData, expiryDate: e.target.value })} />
                            <div style={{ display: "flex", gap: "15px" }}>
                                <div>
                                    <label style={{ fontSize: "0.8rem", color: "#888" }}>Stock</label>
                                    <input style={input} type="number" placeholder="Qty" required value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} />
                                </div>
                                <div>
                                    <label style={{ fontSize: "0.8rem", color: "#888" }}>Price</label>
                                    <input style={input} type="number" placeholder="Price" required value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                                </div>
                            </div>
                            <button type="submit" style={submitBtn}>{isEditing ? "Save Changes" : "Add Medicine"}</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

const containerStyle = {
    padding: "20px",
    color: "white",
    width: "100%",
    height: "100vh",
    overflowY: "auto",
    paddingBottom: "100px",
};

const alertSection = {
    background: "#111",
    border: "1px solid #333",
    borderLeftWidth: "4px",
    borderRadius: "12px",
    padding: "24px"
};

const sectionHeader = {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    marginBottom: "20px"
};

const itemsGrid = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
    gap: "20px"
};

const fullGrid = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: "15px"
};

const alertCard = {
    background: "rgba(255,255,255,0.05)",
    padding: "16px",
    borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.1)"
};

const stockCard = {
    background: "#111",
    padding: "15px",
    borderRadius: "10px",
    transition: "all 0.2s"
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

const editBtn = {
    marginTop: "10px",
    width: "100%",
    padding: "8px",
    borderRadius: "6px",
    border: "none",
    background: "#333",
    color: "white",
    cursor: "pointer"
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
    marginTop: "10px",
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border: "none",
    background: "#22c55e",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer"
};
