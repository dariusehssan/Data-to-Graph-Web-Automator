from flask import Flask, request, jsonify
from flask_cors import CORS
import pyodbc
import pandas as pd
import uuid
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

def get_db_connection():
    conn_str = (
        r'DRIVER={ODBC Driver 17 for SQL Server};'
        r'SERVER=DESKTOP-1ABH03L\SQLEXPRESS;'
        r'DATABASE=GraphProjectDB;'
        r'Trusted_Connection=yes;'
    )
    return pyodbc.connect(conn_str)

@app.route("/labels", methods=["GET"])
def get_labels():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("[dbo].[GetGraphPresets]")
    
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
        INSERT INTO [dbo].[GraphPresets] (xlabel, xunit, ylabel, yunit)
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
    df = pd.read_csv(file, sep=';')
    
    df.columns = df.columns.str.strip().str.replace(' ', '_').str.replace(r'[()]', '', regex=True)
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        upload_id = uuid.uuid4()
        
        for index, row in df.iterrows():
            for col_name in df.columns:
                cursor.execute("""
                    INSERT INTO RawGraphData (UploadID, RowIndex, ColumnName, Value)
                    VALUES (?, ?, ?, ?)
                """, (str(upload_id), index, col_name, str(row[col_name])))
                
        expiration_time = datetime.now() - timedelta(minutes=15)

        cursor.execute("""
             DELETE FROM RawGraphData 
             WHERE CreatedAt < ?
             """, (expiration_time,))
        conn.commit()
        return jsonify({"message": "CSV data successfully saved!", "upload_id": str(upload_id)}), 201
        
    except Exception as e:
        conn.rollback()
        return jsonify({"message": f"Error: {str(e)}"}), 500
    finally:
        conn.close()

if __name__ == "__main__":
    app.run(debug=True)