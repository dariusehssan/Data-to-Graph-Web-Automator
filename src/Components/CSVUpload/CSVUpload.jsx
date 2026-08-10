import { useState } from "react";
import "./CSVUpload.css";

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

        const response = await fetch("http://127.0.0.1:5000/upload_data", {
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