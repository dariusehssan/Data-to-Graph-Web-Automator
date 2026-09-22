from flask import Flask, request, jsonify
from flask_cors import CORS
import pyodbc
import os
from Classes import DBConnectionManager, GraphPreset, DataUploader, GraphBuilder

app = Flask(__name__)
CORS(app)

@app.route("/", methods=["GET"])
def home():
    return {"status": "Backend is running successfully!"}

@app.route("/labels/<device_id>", methods=["GET"])
def get_labels(device_id):
    
    labels = GraphPreset.get_by_device(device_id)

    return jsonify({"labels": labels})

@app.route("/create_labels", methods=["POST"])
def create_labels():
    data = request.json
    
    create_preset = GraphPreset(
        xlabel = data['xlabel'],
        xunit = data['xunit'],
        ylabel = data['ylabel'],
        yunit = data['yunit'],
        device_id = data.get('device_id')
    )

    create_preset.create()

    return jsonify({"message": "Label created!"}), 201

@app.route("/update_label/<int:id>", methods=["PUT"])
def update_label(id):
    data = request.json

    update_preset = GraphPreset(
        xlabel = data['xlabel'],
        xunit = data['xunit'],
        ylabel = data['ylabel'],
        yunit = data['yunit'],
        id = id
        )

    update_preset.update_label()
    
    return jsonify({"message": "Label preset updated!"}), 200

@app.route("/delete_label/<int:id>", methods=["DELETE"])
def delete_label(id):
    
    delete_preset = GraphPreset(None, None, None, None, None, id = id)

    delete_preset.delete()

    return jsonify({"message": "Label preset deleted!"}), 200

@app.route("/upload_data", methods=["POST"])
def upload_data():
    if 'file' not in request.files:
        return jsonify({"message": "No file uploaded"}), 400
    
    device_id = request.form.get('device_id')
    if not device_id:
        return jsonify({"message": "Device ID missing"}), 400
    
    try:
        uploader = DataUploader(request.files['file'], device_id)
        
        uploader.clean_data()
        uploader.save()
        
        return jsonify({
            "message": "CSV data successfully saved!", 
            "upload_id": str(uploader.upload_id)
        }), 201
        
    except Exception as e:
        return jsonify({"message": f"Error: {str(e)}"}), 500

@app.route("/csv_table", methods=["GET"])
def csv_table():
    device_id = request.args.get('device_id')
    
    columns = GraphPreset.get_csv_table(device_id)
        
    return jsonify({"columns": columns}), 200

@app.route("/rename_column", methods=["PUT"])
def rename_column():
    data = request.get_json()
    device_id = data.get("device_id")
    old_name = data.get("old_name")
    new_name = data.get("new_name")
    
    if not device_id or not old_name or not new_name:
        return jsonify({"error": "Device ID, old_name, and new_name are required."}), 400

    try:
        with DBConnectionManager() as cursor:
            cursor.execute("""
                UPDATE RawGraphData 
                SET ColumnName = ? 
                WHERE ColumnName = ? AND DeviceID = ?
            """, (new_name, old_name, device_id))
            
        return jsonify({
            "message": f"Column successfully renamed!",
            "saved_name": new_name
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/generate_graph", methods=["POST"])
def generate_graph():
    data = request.get_json()
    
    if not data.get("device_id") or not data.get("x_column") or not data.get("y_columns"):
        return jsonify({"error": "Device ID, X, and Y axes columns are required."}), 400

    preset = GraphPreset.get_by_id(data.get("preset_id"))
    
    builder = GraphBuilder(data['device_id'], data['x_column'], data['y_columns'], preset)
    
    try:
        builder.fetch_data()
        plot_url = builder.build_image()
        
        return jsonify({"plot": f"data:image/png;base64,{plot_url}"}), 200
        
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
