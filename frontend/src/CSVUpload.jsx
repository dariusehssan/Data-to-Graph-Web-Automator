import { useState } from "react";

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
            body: formData, // The cargo containing your CSV file
        });

        const data = await response.json();
        if (response.status !== 201) {
            setMessage(data.message);
        } else {
            setMessage(`${data.message} (Upload ID: ${data.upload_id})`);
            setFile(null);
            e.target.reset(); // Resets the HTML form inputs, clearing the file picker box visually
            if (uploadCallback) uploadCallback();
        }
    };

    return (
        <div>
            <h3>Upload Graph Data (CSV)</h3>
            <form onSubmit={onSubmit}>
                <input type="file" accept=".csv" onChange={handleFileChange} />
                <button type="submit">Upload to Database</button>
            </form>
            {message && <p>{message}</p>}
        </div>
    );
};

export default CSVUpload;