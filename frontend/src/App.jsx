import { useState, useEffect } from "react";
import LabelList from "./LabelList";
import LabelForm from "./LabelForm";
import CSVUpload from "./CSVUpload";
import GraphTable from "./GraphTable";
import GraphGenerator from "./GraphGenerator";
import "./App.css";

const API_URL = import.meta.env.REACT_APP_API_URL || "http://127.0.0.1:5000";

function App() {
    const [labels, setLabels] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentLabel, setCurrentLabel] = useState({});
    const [refreshKey, setRefreshKey] = useState(0);
    const [selectedXAxis, setSelectedXAxis] = useState("");
    const [selectedYAxis, setSelectedYAxis] = useState([]);
    const [selectedPresetId, setSelectedPresetId] = useState(null);

    const handleRefresh = () => {
        setRefreshKey(prev => prev + 1);
    };

    useEffect(() => {
        fetchLabels();
    }, []);

    const fetchLabels = async () => {
        const response = await fetch(`${API_URL}/labels`);
        const data = await response.json();
        setLabels(data.labels);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentLabel({});
    };

    const openCreateModal = () => {
        if (!isModalOpen) setIsModalOpen(true);
    };

    const openEditModal = (label) => {
        if (isModalOpen) return;
        setCurrentLabel(label);
        setIsModalOpen(true);
    };

    const onUpdate = () => {
        closeModal();
        fetchLabels();
    };

    return (
        <div className="app-container">
            <h1>Graphing Automator</h1>

            <CSVUpload uploadCallback={handleRefresh} />

            <GraphTable
                key={refreshKey}
                selectedXAxis={selectedXAxis}
                setSelectedXAxis={setSelectedXAxis}
                selectedYAxis={selectedYAxis}
                setSelectedYAxis={setSelectedYAxis}
            />

            <LabelList
                labels={labels}
                updateLabel={openEditModal}
                updateCallback={onUpdate}
                selectedPresetId={selectedPresetId}
                setSelectedPresetId={setSelectedPresetId}
            />
            <button className="create-preset-btn" onClick={openCreateModal}>Create New Label Preset</button>

            {isModalOpen && (
                <div className="modal">
                    <div className="modal-content">
                        <span className="close" onClick={closeModal}>&times;</span>
                        <LabelForm
                            existingLabel={currentLabel}
                            updateCallback={onUpdate}
                        />
                    </div>
                </div>
            )}

            <GraphGenerator
                selectedXAxis={selectedXAxis}
                selectedYAxis={selectedYAxis}
                selectedPresetId={selectedPresetId}
            />
        </div>
    );
}

export default App;