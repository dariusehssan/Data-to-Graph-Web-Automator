import { useState, useEffect } from "react";
import axios from "axios";
import "./GraphRename.css";

const API_URL = import.meta.env.REACT_APP_API_URL || "http://127.0.0.1:5000";

const GraphRename = () => {
    const [columns, setColumns] = useState([]);
    const [renameMap, setRenameMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [statusMessage, setStatusMessage] = useState("");

    useEffect(() => {
        axios.get(`${API_URL}/csv_table`)
            .then((res) => {
                const cols = res.data.columns;
                setColumns(cols);
                
                const initialMap = {};
                cols.forEach((col) => {
                    initialMap[col] = "";
                });
                setRenameMap(initialMap);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Error fetching columns for rename:", err);
                setLoading(false);
            });
    }, []);

    const handleInputChange = (oldName, value) => {
        setRenameMap((prev) => ({
            ...prev,
            [oldName]: value
        }));
    };

    const handleRenameSubmit = async (oldName) => {
        const newName = renameMap[oldName];
        if (!newName.trim()) {
            setStatusMessage("Please enter a valid new column name.");
            return;
        }

        try {
            const response = await axios.put(`${API_URL}/rename_column`, {
                old_name: oldName,
                new_name: newName.trim()
            });

            setStatusMessage(response.data.message);

            setColumns((prevCols) => prevCols.map(c => c === oldName ? newName.trim() : c));
            
            setRenameMap((prev) => {
                const updated = { ...prev };
                delete updated[oldName];
                updated[newName.trim()] = "";
                return updated;
            });
        } catch (err) {
            console.error("Error renaming column:", err);
            setStatusMessage(err.response?.data?.error || "Failed to rename column.");
        }
    };

    if (loading) return <div>Loading columns for renaming...</div>;

    return (
        <div className="graph-rename-container">
            <h3>Clean Up Graph Column Legends</h3>
            <p>Rename technical column headers (e.g., underscores/symbols) into clean labels for your final graphs.</p>
            
            {statusMessage && <div className="status-banner">{statusMessage}</div>}

            <table className="data-table">
                <thead>
                    <tr>
                        <th>Current Database Column</th>
                        <th>New Desired Name</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {columns.map((colName, index) => (
                        <tr key={index}>
                            <td><code>{colName}</code></td>
                            <td>
                                <input
                                    type="text"
                                    placeholder="e.g. Temperature (°C)"
                                    value={renameMap[colName] || ""}
                                    onChange={(e) => handleInputChange(colName, e.target.value)}
                                />
                            </td>
                            <td>
                                <button onClick={() => handleRenameSubmit(colName)}>
                                    Rename
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default GraphRename;