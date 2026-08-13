import { useState, useEffect } from "react";
import axios from "axios";
import "./GraphTable.css";

const API_URL = import.meta.env.VITE_API_URL || "https://data-to-graph-web-automator.onrender.com";

const GraphTable = ({ selectedXAxis, setSelectedXAxis, selectedYAxis, setSelectedYAxis }) => {
    const [columns, setColumns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingCol, setEditingCol] = useState(null);
    const [tempName, setTempName] = useState("");
    const [columnAliases, setColumnAliases] = useState({});

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
        const currentDisplay = columnAliases[colName] || (colName.startsWith("val_") ? colName.slice(4) : colName);
        setTempName(currentDisplay);
    };

    const handleSaveRename = async (oldName) => {
        if (!tempName.trim()) {
            setEditingCol(null);
            return;
        }

        const desiredName = tempName.trim();

        try {
            const response = await axios.put(`${API_URL}/rename_column`, {
                old_name: oldName,
                new_name: desiredName
            });

            const savedDbName = response.data.saved_name;

            setColumnAliases((prev) => ({ ...prev, [savedDbName]: desiredName }));

            setColumns((prev) => prev.map(c => c === oldName ? savedDbName : c));

            if (selectedXAxis === oldName) setSelectedXAxis(savedDbName);
            setSelectedYAxis((prev) => prev.map(y => y === oldName ? savedDbName : y));

            setEditingCol(null);
        } catch (err) {
            console.error("Error renaming column:", err);
            alert(err.response?.data?.error || "Failed to rename column.");
            setEditingCol(null);
        }
    };

    const displayColumnName = (name) => {
        if (!name) return "";
        if (columnAliases[name]) {
            return columnAliases[name];
        }
        return name.startsWith("val_") ? name.slice(4) : name;
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
                                        {displayColumnName(colName)} ✏️
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
                <p><strong>Selected X-Axis:</strong> {displayColumnName(selectedXAxis) || "None"}</p>
                <p><strong>Selected Y-Axis:</strong> {selectedYAxis.map(col => displayColumnName(col)).join(", ") || "None"}</p>
            </div>
        </div>
    );
};

export default GraphTable;
