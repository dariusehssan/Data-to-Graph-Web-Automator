import React from "react";

const LabelList = ({ labels, updateLabel, updateCallback }) => {
    const onDelete = async (id) => {
        try {
            const options = {
                method: "DELETE"
            }
            const response = await fetch(`http://127.0.0.1:5000/delete_label/${id}`, options)
            if (response.status === 200) {
                updateCallback()
            } else {
                console.error("Failed to delete label preset")
            }
        } catch (error) {
            alert(error)
        }
    }

    return (
        <div>
            <h2>Saved Graph Labels</h2>
            <table>
                <thead>
                    <tr>
                        <th>X-Label</th>
                        <th>X-Unit</th>
                        <th>Y-Label</th>
                        <th>Y-Unit</th>
                    </tr>
                </thead>
                <tbody>
                    {labels.map((label) => (
                        <tr key={label.Id}>
                            <td>{label.XLabel}</td>
                            <td>{label.XUnit}</td>
                            <td>{label.YLabel}</td>
                            <td>{label.YUnit}</td>
                            <td>
                                <button onClick={() => updateLabel(label)}>Update</button>
                                <button onClick={() => onDelete(label.Id)}>Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default LabelList;