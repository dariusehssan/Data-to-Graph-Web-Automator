import { useState } from "react";
import "./Labels.css";

const LabelForm = ({ existingLabel = {}, updateCallback }) => {
    const [xlabel, setXLabel] = useState(existingLabel.XLabel || "");
    const [xunit, setXUnit] = useState(existingLabel.XUnit || "");
    const [ylabel, setYLabel] = useState(existingLabel.YLabel || "");
    const [yunit, setYUnit] = useState(existingLabel.YUnit || "");

    const updating = Object.entries(existingLabel).length !== 0;

    const onSubmit = async (e) => {
        e.preventDefault();

        const data = { xlabel, xunit, ylabel, yunit };
        const url = "http://127.0.0.1:5000/" + (updating ? `update_label/${existingLabel.Id}` : "create_labels");
        const options = {
            method: updating ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        };

        const response = await fetch(url, options);
        if (response.status !== 201 && response.status !== 200) {
            const errorData = await response.json();
            alert(errorData.message);
        } else {
            updateCallback();
        }
    };

    return (
        <form className="label-form" onSubmit={onSubmit}>
            <div className="form-group">
                <label htmlFor="xlabel">X-Label:</label>
                <input type="text" id="xlabel" value={xlabel} onChange={(e) => setXLabel(e.target.value)} />
            </div>
            <div className="form-group">
                <label htmlFor="xunit">X-Unit:</label>
                <input type="text" id="xunit" value={xunit} onChange={(e) => setXUnit(e.target.value)} />
            </div>
            <div className="form-group">
                <label htmlFor="ylabel">Y-Label:</label>
                <input type="text" id="ylabel" value={ylabel} onChange={(e) => setYLabel(e.target.value)} />
            </div>
            <div className="form-group">
                <label htmlFor="yunit">Y-Unit:</label>
                <input type="text" id="yunit" value={yunit} onChange={(e) => setYUnit(e.target.value)} />
            </div>
            <button type="submit" className="submit-btn">{updating ? "Update" : "Create"}</button>
        </form>
    );
};

export default LabelForm;