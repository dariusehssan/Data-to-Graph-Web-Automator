import { useState } from "react";
import "./CSVUpload.css";

const API_URL = import.meta.env.VITE_API_URL || "https://data-to-graph-web-automator.onrender.com";

const getDeviceId = () => {
    let deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
        deviceId = crypto.randomUUID(); 
        localStorage.setItem('device_id', deviceId);
    }
    return deviceId;
};

const CSVUpload = ({ uploadCallback }) => {
    const [file, setFile] = useState(null);
    const [message, setMessage] = useState("");

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        if (!file) {
            alert("Please select a CSV file first!");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);
        
        const currentDeviceId = getDeviceId();
        formData.append("device_id", currentDeviceId);
        
        const response = await fetch(`${API_URL}/upload_data`, {
            method: "POST",
            body: formData,
        });

        const data = await response.json();
        if (response.status !== 201) {
            setMessage(data.message);
        } else {
            setMessage(`${data.message} (Upload ID: ${data.upload_id})`);
            setFile(null);
            e.target.reset();
            if (uploadCallback) uploadCallback();
        }
    };

    return (
        <div className="csv-upload-container">
            <h3>Upload Graph Data (CSV)</h3>
            <form onSubmit={onSubmit}>
                <input type="file" accept=".csv" onChange={handleFileChange} />
                <button type="submit">Upload to Database</button>
            </form>
            {message && <p className="csv-message">{message}</p>}
        </div>
    );
};

export default CSVUpload;
