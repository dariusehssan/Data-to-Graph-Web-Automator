from flask import Flask, request, jsonify
from flask_cors import CORS
import pyodbc
import pandas as pd
import uuid
import io
import base64
import matplotlib.pyplot as plt
import os

app = Flask(__name__)
CORS(app)

@app.route("/", methods=["GET"])
def home():
    return {"status": "Backend is running successfully!"}

def get_db_connection():
    conn_str = (
        "Driver={ODBC Driver 18 for SQL Server};"
        "Server=tcp:dariusehssan1.database.windows.net,1433;"
        "Database=datatograph_db;"
        "Uid=dariusehssan;"
        "Pwd=DariusDataGraph!;"
        "Encrypt=yes;"
        "TrustServerCertificate=no;"
        "Connection Timeout=30;"
    )
    return pyodbc.connect(conn_str)

@app.route("/labels/<device_id>", methods=["GET"])
def get_labels(device_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, xlabel, xunit, ylabel, yunit 
        FROM [dbo].[GraphPresets] 
        WHERE DeviceID = ?""", (device_id,))
    
    columns = [column[0] for column in cursor.description]
    labels = [dict(zip(columns, row)) for row in cursor.fetchall()]
    
    conn.close()
    return jsonify({"labels": labels})

@app.route("/create_labels", methods=["POST"])
def create_labels():
    data = request.json
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT INTO [dbo].[GraphPresets] (xlabel, xunit, ylabel, yunit, DeviceID)
        VALUES (?, ?, ?, ?)""", 
        (data['xlabel'], data['xunit'], data['ylabel'], data['yunit'])
    )
    
    conn.commit()
    conn.close()
    return jsonify({"message": "User created!"}), 201

@app.route("/update_label/<int:id>", methods=["PUT"])
def update_label(id):
    data = request.json
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        UPDATE [dbo].[GraphPresets]
        SET xlabel = ?, xunit = ?, ylabel = ?, yunit = ?
        WHERE id = ?""",
        (data['xlabel'], data['xunit'], data['ylabel'], data['yunit'], id)
    )
    
    conn.commit()
    conn.close()
    return jsonify({"message": "Label preset updated!"}), 200

@app.route("/delete_label/<int:id>", methods=["DELETE"])
def delete_label(id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("DELETE FROM [dbo].[GraphPresets] WHERE id = ?", (id,))
    
    conn.commit()
    conn.close()
    return jsonify({"message": "Label preset deleted!"}), 200

@app.route("/upload_data", methods=["POST"])
def upload_data():
    if 'file' not in request.files:
        return jsonify({"message": "No file uploaded"}), 400
    
    file = request.files['file']

    device_id = request.form.get('device_id')
    
    if not device_id:
        return jsonify({"message": "Device ID missing"}), 400
    
    df = pd.read_csv(file, sep=r'[,;]', engine='python')
    df.columns = df.columns.str.strip().str.replace(' ', '_').str.replace(r'[()]', '', regex=True)
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        upload_id = uuid.uuid4()
        
        cursor.execute("DELETE FROM RawGraphData WHERE DeviceID = ?", (device_id,))

        for index, row in df.iterrows():
            for col_name in df.columns:
                cursor.execute("""
                    INSERT INTO RawGraphData (UploadID, RowIndex, ColumnName, Value, DeviceID)
                    VALUES (?, ?, ?, ?)
                """, (str(upload_id), index, col_name, str(row[col_name])))
        
        conn.commit()
        return jsonify({"message": "CSV data successfully saved!", "upload_id": str(upload_id)}), 201
        
    except Exception as e:
        conn.rollback()
        return jsonify({"message": f"Error: {str(e)}"}), 500
    finally:
        conn.close()

@app.route("/csv_table", methods=["GET"])
def csv_table():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT DISTINCT ColumnName FROM RawGraphData")
    columns = [row[0] for row in cursor.fetchall()]

    conn.close()

    return jsonify({
        "columns": columns
    }), 200

@app.route("/rename_column", methods=["PUT"])
def rename_column():
    data = request.get_json()
    old_name = data.get("old_name")
    new_name = data.get("new_name")
    
    if not old_name or not new_name:
        return jsonify({"error": "Both old_name and new_name are required"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            UPDATE RawGraphData 
            SET ColumnName = ? 
            WHERE ColumnName = ?
        """, (new_name, old_name))
        
        conn.commit()
    except Exception as e:
        conn.close()
        return jsonify({"error": str(e)}), 500

    conn.close()

    return jsonify({
        "message": f"Column successfully renamed!",
        "saved_name": new_name
    }), 200


@app.route("/generate_graph", methods=["POST"])
def generate_graph():
    data = request.get_json()
    x_column = data.get("x_column")
    y_columns = data.get("y_columns")
    preset_id = data.get("preset_id")

    if not x_column or not y_columns:
        return jsonify({"error": "Please select both X and Y axes columns."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT xlabel, xunit, ylabel, yunit 
        FROM GraphPresets 
        WHERE id = ?
    """, (preset_id,))
    preset = cursor.fetchone()

    if preset:
        xlabel_text = f"{preset[0]} / {preset[1]}"
        ylabel_text = f"{preset[2]} / {preset[3]}"
    else:
        xlabel_text = x_column
        ylabel_text = "Values"

    df_raw = pd.read_sql("SELECT RowIndex, ColumnName, Value FROM RawGraphData ORDER BY RowIndex", conn)
    conn.close()

    if df_raw.empty:
        return jsonify({"error": "No data found in database."}), 400

    df = df_raw.pivot(index="RowIndex", columns="ColumnName", values="Value")

    if isinstance(y_columns, str): 
        y_columns = [y_columns]

    missing_cols = [col for col in y_columns + [x_column] if col not in df.columns]
    if missing_cols:
        return jsonify({"error": f"Missing columns in data: {missing_cols}"}), 400

    fig, ax = plt.subplots(figsize=(8, 5))

    for y_col in y_columns:
        x_vals = df[x_column]
        y_vals = pd.to_numeric(df[y_col], errors='coerce')
        
        ax.plot(x_vals, y_vals, label=y_col, marker='o', markersize=3)

    ax.set_xlabel(xlabel_text)
    ax.set_ylabel(ylabel_text)
    ax.legend()
    ax.grid(True)

    img_io = io.BytesIO()
    plt.savefig(img_io, format='png', bbox_inches='tight')
    img_io.seek(0)
    plot_url = base64.b64encode(img_io.getvalue()).decode('utf8')
    plt.close(fig)

    return jsonify({
        "plot": f"data:image/png;base64,{plot_url}"
    }), 200

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
