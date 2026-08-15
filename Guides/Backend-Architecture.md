# Backend Architecture & API Reference

This document provides a comprehensive breakdown of the Python/Flask backend for the Data-to-Graph Web Automator. It explains how the backend communicates with the frontend, how it securely connects to the Azure SQL database, and details the functionality of every API route.

---

## 1. Connecting the Backend to the Frontend & The Role of JSON

The frontend (JavaScript/HTML/CSS) and backend (Python/Flask) operate in separate environments. We bridge this gap using standard web protocols:

* **CORS (`flask_cors`):** By default, web browsers block frontend applications from making requests to a different domain for security reasons. The `CORS(app)` configuration explicitly tells the Flask server to accept incoming cross-origin requests from the Vercel-hosted frontend.
* **Data Translation via JSON:** Python and JavaScript cannot natively read each other's memory structures. **JSON (JavaScript Object Notation)** acts as the universal translator. When the frontend sends data, it packages it as JSON. Flask receives this, converts it into a Python dictionary, processes it, and then uses Flask's `jsonify()` method to translate the Python output back into a JSON response the browser can easily parse and render.

---

## 2. Connecting to Azure SQL Database (`pyodbc`)

To interact with the Azure SQL database, the backend utilizes the **`pyodbc`** library.

* **The Connection String (`get_db_connection`):** This function bundles the server address, database name, credentials, and cryptographic settings (`Encrypt=yes`) into a secure driver configuration string.
* **The Execution Workflow:** Whenever an API endpoint needs to read or write data, it calls `get_db_connection()`, opens a cursor (the pipeline to run SQL commands), executes a query, fetches or commits the results, and securely closes the connection.

---

## 3. API Route Breakdown

### A. Health Check
* **Route:** `GET /`
* **Libraries Used:** `Flask`
* **Functionality:** Acts as a simple heartbeat monitor. Visiting the root backend URL instantly returns a JSON payload confirming the server is online and running successfully.

### B. Fetching Label Presets
* **Route:** `GET /labels`
* **Libraries Used:** `Flask`, `pyodbc`
* **Functionality:** Queries the database using a stored procedure (`[dbo].[GetGraphPresets]`), dynamically pulls column headers and rows, and packs them into a clean JSON list so the frontend can display user-saved graph axis label presets.

### C. Creating Label Presets
* **Route:** `POST /create_labels`
* **Libraries Used:** `Flask`, `pyodbc`
* **Functionality:** Extracts incoming JSON data (`xlabel`, `xunit`, `ylabel`, `yunit`) submitted via a frontend form, executes a SQL `INSERT` statement into `[dbo].[GraphPresets]`, commits the transaction, and returns a `201 Created` status.

### D. Updating Label Presets
* **Route:** `PUT /update_label/<int:id>`
* **Libraries Used:** `Flask`, `pyodbc`
* **Functionality:** Captures an ID from the URL parameter along with modified JSON form inputs, then executes a parameterized SQL `UPDATE` command targeting that specific row ID in the database.

### E. Deleting Label Presets
* **Route:** `DELETE /delete_label/<int:id>`
* **Libraries Used:** `Flask`, `pyodbc`
* **Functionality:** Takes a preset ID from the endpoint URL and deletes the corresponding record from the `[dbo].[GraphPresets]` table.

### F. Uploading and Processing Raw CSV Data
* **Route:** `POST /upload_data`
* **Libraries Used:** `Flask`, `pandas`, `uuid`, `pyodbc`
* **Functionality:** 
  1. Grabs an uploaded CSV file from the incoming request.
  2. Uses **Pandas** to parse the file into a dataframe, automatically cleaning column names (stripping whitespace, replacing spaces with underscores, removing special characters).
  3. Generates a unique tracking ID (**UUID**) for the upload batch.
  4. Clears out old raw data in the database and loops through every row and column, using parameterized SQL `INSERT` statements to store the dataset layout row-by-row.

### G. Fetching Uploaded CSV Columns
* **Route:** `GET /csv_table`
* **Libraries Used:** `Flask`, `pyodbc`
* **Functionality:** Runs a distinct SQL query (`SELECT DISTINCT ColumnName FROM RawGraphData`) to extract all unique column names from the uploaded dataset, returning them to the frontend so users can select their X and Y graphing axes.

### H. Renaming Columns
* **Route:** `PUT /rename_column`
* **Libraries Used:** `Flask`, `pyodbc`
* **Functionality:** Takes an `old_name` and `new_name` via JSON and securely executes a SQL system stored procedure (`sp_rename`) to alter the underlying column name directly inside the database table schema.

### I. Dynamic Graph Generation & Plotting Engine
* **Route:** `POST /generate_graph`
* **Libraries Used:** `Flask`, `pandas`, `matplotlib.pyplot`, `io`, `base64`, `pyodbc`
* **Functionality:** This is the core computational engine of the application:
  1. **Fetches Constraints:** Pulls axis choices (`x_column`, `y_columns`) and optional unit presets from the request and database.
  2. **Pivots Data:** Reads raw row-value records from SQL into Pandas, pivoting the tall data format back into a clean wide-format dataframe (`df_raw.pivot(...)`).
  3. **Plots with Matplotlib:** Initializes a figure, loops through the selected Y columns against the X column, plots lines with data markers, and adds labels, legends and gridlines.
  4. **Encodes to Base64:** Instead of saving an image file onto the server disk, it streams the plot into an in-memory byte buffer (`io.BytesIO()`), converts it into a **Base64 string**, and returns it as a data URL JSON payload (`data:image/png;base64,...`) so the frontend can instantly render the graph without downloading a file.
