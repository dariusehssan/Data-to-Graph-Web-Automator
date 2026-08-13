import { useState, useEffect } from "react";
import axios from "axios";
import "./GraphTable.css";

const API_URL = import.meta.env.VITE_API_URL || "https://data-to-graph-web-automator.onrender.com";

const GraphTable = ({ selectedXAxis, setSelectedXAxis, selectedYAxis, setSelectedYAxis }) => {
    const [columns, setColumns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingCol, setEditingCol] = useState(null);
    const [tempName, setTempName] = useState("");

    useEffect(() => {
        axios.get(`${API_URL}/csv_table`)
            .then((res) => {
                setColumns(res.data.columns);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Error fetching columns:", err);
                setLoading(false);
            });
    }, []);

    const handleStartEdit = (colName) => {
        setEditingCol(colName);
        setTempName(colName);
    };

    const handleSaveRename = async (oldName) => {
        if (!tempName.trim() || tempName === oldName) {
            setEditingCol(null);
            return;
        }

        try {
            await axios.put(`${API_URL}/rename_column`, {
                old_name: oldName,
                new_name: tempName.trim()
            });

            setColumns((prev) => prev.map(c => c === oldName ? tempName.trim() : c));

            if (selectedXAxis === oldName) setSelectedXAxis(tempName.trim());
            setSelectedYAxis((prev) => prev.map(y => y === oldName ? tempName.trim() : y));

            setEditingCol(null);
        } catch (err) {
            console.error("Error renaming column:", err);
            alert(err.response?.data?.error || "Failed to rename column.");
            setEditingCol(null);
        }
    };
    
    const handleYAxisChange = (colName) => {
        setSelectedYAxis((prevSelected) => {
            if (prevSelected.includes(colName)) {
                return prevSelected.filter((item) => item !== colName);
            } else {
                return [...prevSelected, colName];
            }
        });
    };

    if (loading) return <div>Loading columns...</div>;

    return (
        <div className="graph-table-container">
            <h3>Raw Data Table Structure</h3>
            <p className="rename-hint">
                💡 <em>Click any database column name below to rename it inline.</em>
            </p>
            <table className="data-table">
                <thead>
                    <tr>
                        <th>Column Index</th>
                        <th>Database Column Name</th>
                        <th>X-Axis (Select One)</th>
                        <th>Y-Axis (Select Multiple)</th>
                    </tr>
                </thead>
                <tbody>
                    {columns.map((colName, index) => (
                        <tr key={index}>
                            <td>{index + 1}</td>
                            <td>
                                {editingCol === colName ? (
                                    <div className="edit-container">
                                        <input
                                            type="text"
                                            className="rename-input"
                                            value={tempName}
                                            onChange={(e) => setTempName(e.target.value)}
                                            autoFocus
                                        />
                                        <button className="rename-btn save-btn" onClick={() => handleSaveRename(colName)}>Save</button>
                                        <button className="rename-btn cancel-btn" onClick={() => setEditingCol(null)}>Cancel</button>
                                    </div>
                                ) : (
                                    <span 
                                        className="editable-column-name"
                                        onClick={() => handleStartEdit(colName)} 
                                        title="Click to rename"
                                    >
                                        {colName} ✏️
                                    </span>
                                )}
                            </td>
                            <td className="center-align">
                                <input
                                    type="radio"
                                    name="xaxis"
                                    value={colName}
                                    checked={selectedXAxis === colName}
                                    onChange={() => setSelectedXAxis(colName)}
                                />
                            </td>
                            <td className="center-align">
                                <input
                                    type="checkbox"
                                    value={colName}
                                    checked={selectedYAxis.includes(colName)}
                                    onChange={() => handleYAxisChange(colName)}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="selection-summary">
                <p><strong>Selected X-Axis:</strong> {selectedXAxis || "None"}</p>
                <p><strong>Selected Y-Axis:</strong> {selectedYAxis.join(", ") || "None"}</p>
            </div>
        </div>
    );
};

export default GraphTable;
