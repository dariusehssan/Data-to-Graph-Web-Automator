import { useState, useEffect } from "react";
import LabelList from "./LabelList";
import "./App.css";
import LabelForm from "./LabelForm";
import CSVUpload from "./CSVUpload";

function App() {
    const [labels, setLabels] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentLabel, setCurrentLabel] = useState({});

    useEffect(() => {
        fetchLabels();
    }, []);

    const fetchLabels = async () => {
        const response = await fetch("http://127.0.0.1:5000/labels");
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
        <>
            <h1>Graph Label Manager</h1>
            
            <CSVUpload />
            
            <LabelList
                labels={labels}
                updateLabel={openEditModal}
                updateCallback={onUpdate}
            />
            <button onClick={openCreateModal}>Create New Label Preset</button>

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
        </>
    );
}

export default App;