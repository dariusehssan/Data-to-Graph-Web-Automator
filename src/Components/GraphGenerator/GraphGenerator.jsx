import React, { useState } from "react";
import axios from "axios";
import "./GraphGenerator.css";

const GraphGenerator = ({ selectedXAxis, selectedYAxis, selectedPresetId }) => {
    const [plotUrl, setPlotUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const handleGenerateClick = async () => {
        if (!selectedXAxis) {
            setErrorMessage("Please select an X-Axis column.");
            return;
        }
        if (!selectedYAxis || selectedYAxis.length === 0) {
            setErrorMessage("Please select at least one Y-Axis column.");
            return;
        }

        setErrorMessage("");
        setLoading(true);

        try {
            const response = await axios.post("http://127.0.0.1:5000/generate_graph", {
                x_column: selectedXAxis,
                y_columns: selectedYAxis,
                preset_id: selectedPresetId || null
            });

            setPlotUrl(response.data.plot);
            setLoading(false);
        } catch (err) {
            console.error("Error generating graph:", err);
            setErrorMessage(err.response?.data?.error || "Failed to generate graph.");
            setLoading(false);
        }
    };

    return (
        <div className="graph-generator-container">
            <button className="generate-btn" onClick={handleGenerateClick}>
                Generate Graph
            </button>

            {errorMessage && <p className="error-message">{errorMessage}</p>}
            {loading && <p className="loading-message">Rendering graph via Matplotlib...</p>}

            {plotUrl && (
                <div className="plot-result-container">
                    <h3>Generated Engineering Graph</h3>
                    <img src={plotUrl} alt="Engineering Graph" className="plot-image" />
                </div>
            )}
        </div>
    );
};

export default GraphGenerator;