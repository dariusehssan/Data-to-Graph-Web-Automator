import uuid
import pandas as pd
import matplotlib.pyplot as plt
import io
import base64
import pyodbc

def get_db_connection():
    conn_str = (
        "Driver={ODBC Driver 18 for SQL Server}";
        "Server=tcp:dariusehssan1.database.windows.net,1433";
        "Database=datatograph_db";
        "Uid=dariusehssan";
        "Pwd=DariusDataGraph!";
        "Encrypt=yes";
        "TrustServerCertificate=no";
        "Connection Timeout=30";
    )
    return pyodbc.connect(conn_str)


class DBConnectionManager():
    def __enter__(self):
        self.conn = get_db_connection()
        cursor = self.conn.cursor()
        return cursor

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is None:
            self.conn.commit()

        self.conn.close()

class GraphPreset():
    def __init__(self, xlabel, xunit, ylabel, yunit, device_id, id=None):
        self.xlabel = xlabel
        self.xunit = xunit
        self.ylabel = ylabel
        self.yunit = yunit
        self.device_id = device_id
        self.id = id

    def create(self):
        with DBConnectionManager() as cursor:
            cursor.execute("""
                EXEC [dbo].[CreateGraphPreset] 
                @xlabel = ?, @xunit = ?, @ylabel = ?, @yunit = ?, @DeviceID = ?""", 
                (self.xlabel, self.xunit, self.ylabel, self.yunit, self.device_id)
            )

    def update_label(self):
        with DBConnectionManager() as cursor:
            cursor.execute("""
                EXEC [dbo].[UpdateGraphPreset] 
                @id = ?, @xlabel = ?, @xunit = ?, @ylabel = ?, @yunit = ?""",
                (self.id, self.xlabel, self.xunit, self.ylabel, self.yunit)
            )

    def delete(self):
        with DBConnectionManager() as cursor:
            cursor.execute("EXEC [dbo].[DeleteGraphPreset] @id = ?", (self.id,))

    @classmethod
    def get_by_device(cls, device_id):
        with DBConnectionManager() as cursor:
            cursor.execute("EXEC [dbo].[GetGraphPresets] @DeviceID = ?", (device_id,))
            columns = [column[0] for column in cursor.description]
            labels = [dict(zip(columns, row)) for row in cursor.fetchall()]
            return labels

    @classmethod
    def get_csv_table(cls, device_id):
        with DBConnectionManager() as cursor:
            cursor.execute("SELECT DISTINCT ColumnName FROM RawGraphData WHERE DeviceID = ?", (device_id,))
            columns = [row[0] for row in cursor.fetchall()]
            return columns

    @classmethod
    def get_by_id(cls, preset_id):
        with DBConnectionManager() as cursor:
            cursor.execute("""
                SELECT xlabel, xunit, ylabel, yunit, DeviceID 
                FROM GraphPresets 
                WHERE id = ?
            """, (preset_id,))
            row = cursor.fetchone()

            if row:
                return cls(
                    xlabel = row[0], 
                    xunit = row[1], 
                    ylabel = row[2], 
                    yunit = row[3], 
                    device_id = row[4],
                    id = preset_id
                )
            return None

class DataUploader:
    def __init__(self, file, device_id):
        self.file = file
        self.device_id = device_id
        self.upload_id = uuid.uuid4()
        self.df = pd.read_csv(self.file, sep=r'[,;]', engine='python')
        
    def clean_data(self):
        self.df.columns = self.df.columns.str.strip().str.replace(' ', '_').str.replace(r'[()]', '', regex=True)

    def save(self):
        with DBConnectionManager() as cursor:
            cursor.execute("EXEC [dbo].[ClearDeviceRawData] @DeviceID = ?", (self.device_id,))

            for index, row in self.df.iterrows():
                for col_name in self.df.columns:
                    cursor.execute("""
                        EXEC [dbo].[InsertRawData] 
                        @UploadID = ?, @RowIndex = ?, @ColumnName = ?, @Value = ?, @DeviceID = ?
                    """, (str(self.upload_id), index, col_name, str(row[col_name]), self.device_id))

class GraphBuilder():
    def __init__(self, device_id, x_column, y_columns, preset):
        self.device_id = device_id
        self.x_column = x_column
        self.y_columns = [y_columns] if isinstance(y_columns, str) else y_columns
        self.preset = preset

    def fetch_data(self):
        conn = get_db_connection()
        try:
            df_raw = pd.read_sql("SELECT RowIndex, ColumnName, Value FROM RawGraphData WHERE DeviceID = ? ORDER BY RowIndex", conn, params=[self.device_id])
        finally:
            conn.close()
        if df_raw.empty:
            raise ValueError("No data found in database.")

        self.df = df_raw.pivot(index="RowIndex", columns="ColumnName", values="Value")

    def build_image(self):
        missing_cols = [col for col in self.y_columns + [self.x_column] if col not in self.df.columns]
        if missing_cols:
            raise ValueError(f"Missing columns in data: {missing_cols}")

        fig, ax = plt.subplots(figsize=(8, 5))

        for y_col in self.y_columns:
            x_vals = self.df[self.x_column]
            y_vals = pd.to_numeric(self.df[y_col], errors='coerce')
            ax.plot(x_vals, y_vals, label=y_col, marker='o', markersize=3)

        if self.preset:
            xlabel_text = f"{self.preset.xlabel} / {self.preset.xunit}"
            ylabel_text = f"{self.preset.ylabel} / {self.preset.yunit}"
        else:
            xlabel_text = self.x_column
            ylabel_text = "Values"

        ax.set_xlabel(xlabel_text)
        ax.set_ylabel(ylabel_text)
        ax.legend()
        ax.grid(True)

        img_io = io.BytesIO()
        plt.savefig(img_io, format='png', bbox_inches='tight')
        img_io.seek(0)
        plot_url = base64.b64encode(img_io.getvalue()).decode('utf8')
        plt.close(fig)
        
        return plot_url
