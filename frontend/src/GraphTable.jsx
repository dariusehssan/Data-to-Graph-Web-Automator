import { useState, useEffect } from "react";
import axios from "axios";
import "./GraphTable.css";

const API_URL = import.meta.env.VITE_API_URL || "https://data-to-graph-web-automator.onrender.com";

const GraphTable = ({ selectedXAxis, setSelectedXAxis, selectedYAxis, setSelectedYAxis }) => {
    const [columns, setColumns] = useState([]);
    const [loading, setLoading] = useState(true);

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

    const formatColumnName = (colName) => {
        return colName
            .replace(/_/g, " ")
            .replace(/\b([a-zA-Z0-9\/^*+_]+)\b/g, (match) => {
                const lower = match.toLowerCase();
                if (lower === "at" || lower === "by" || lower === "of") return match;
                return match;
            });
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
                            <td>{colName}</td>
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
