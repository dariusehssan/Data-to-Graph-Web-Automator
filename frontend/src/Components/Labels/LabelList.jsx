import React from "react";
import "./Labels.css";

const LabelList = ({ labels, updateLabel, updateCallback, selectedPresetId, setSelectedPresetId }) => {
    const onDelete = async (id) => {
        try {
            const options = { method: "DELETE" };
            const response = await fetch(`http://127.0.0.1:5000/delete_label/${id}`, options);
            if (response.status === 200) {
                updateCallback();
            } else {
                console.error("Failed to delete label preset");
            }
        } catch (error) {
            alert(error);
        }
    };

    return (
        <div className="label-list-container">
            <h2>Saved Graph Labels</h2>
            <table className="data-table">
                <thead>
                    <tr>
                        <th>X-Label</th>
                        <th>X-Unit</th>
                        <th>Y-Label</th>
                        <th>Y-Unit</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {labels.map((label) => {
                        const isSelected = selectedPresetId === label.Id;

                        return (
                            <tr key={label.Id} className={isSelected ? "selected-row" : ""}>
                                <td>{label.XLabel}</td>
                                <td>{label.XUnit}</td>
                                <td>{label.YLabel}</td>
                                <td>{label.YUnit}</td>
                                <td>
                                    <button
                                        className={`action-btn ${isSelected ? "btn-selected" : "btn-use"}`}
                                        onClick={() => setSelectedPresetId(label.Id)}
                                    >
                                        {isSelected ? "Selected" : "Use"}
                                    </button>
                                    <button className="action-btn btn-update" onClick={() => updateLabel(label)}>Update</button>
                                    <button className="action-btn btn-delete" onClick={() => onDelete(label.Id)}>Delete</button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default LabelList;