# Backend Architecture & API Reference

This document provides a comprehensive breakdown of the Python/Flask backend for the Data-to-Graph Web Automator. It explains the object-oriented architecture, how the backend securely connects to the Azure SQL database, and details the functionality of every API route and internal class.

---

## 1. Object-Oriented Architecture & Separation of Concerns

The backend utilizes an object-oriented architecture to encapsulate related data and logic into dedicated blueprints. This prevents scattered and duplicated code, which can quickly become a maintenance headache when logic is spread across loose functions. The application is divided into two distinct files to cleanly separate responsibilities:

*   **`main.py` (The Routing Layer):** Acts strictly as a traffic director. It receives incoming HTTP requests, extracts the JSON payloads, hands the data to the appropriate specialized classes, and returns the final JSON response.
*   **`Classes.py` (The Business Logic):** A separate module containing the custom class blueprints (`DBConnectionManager`, `GraphPreset`, `DataUploader`, `GraphBuilder`). These classes encapsulate all database queries, Pandas data manipulation, and Matplotlib rendering, keeping the web routing file lightweight and focused solely on network traffic.

---

## 2. Connecting the Backend to the Frontend & The Role of JSON

The frontend (JavaScript/HTML/CSS) and backend (Python/Flask) operate in separate environments. We bridge this gap using standard web protocols:

*   **CORS (`flask_cors`):** By default, web browsers block frontend applications from making requests to a different domain for security reasons. The `CORS(app)` configuration explicitly tells the Flask server to accept incoming cross-origin requests from the frontend.
*   **Data Translation via JSON:** Python and JavaScript cannot natively read each other's memory structures. JSON (JavaScript Object Notation) acts as the universal translator. When the frontend sends data, it packages it as JSON. Flask receives this, converts it into a Python dictionary, passes it to the internal classes for processing, and then uses Flask's `jsonify()` method to translate the Python output back into a JSON response the browser can easily parse and render.

---

## 3. Multi-User Data Isolation (`DeviceID`)

To prevent data bleeding between multiple users interacting with the shared Azure database simultaneously, the backend utilizes a stateless session isolation pattern. The frontend generates a unique `crypto.randomUUID()` and stores it in `localStorage`. Every backend API route now requires this `device_id` (passed via URL parameters, query string parameters, or JSON payloads) to filter all SQL `SELECT`, `INSERT`, `UPDATE`, and `DELETE` operations, ensuring users only ever overwrite, edit, and render their own specific data.

---

## 4. Secure Database Connections & Context Management

To interact with the Azure SQL database, the backend uses the `pyodbc` library integrated with a custom context manager class.

*   **Environment Variables:** Hardcoded database credentials have been replaced with `os.environ.get()` to securely pull the database username and password from the host server's live environment, keeping secrets out of the source code.
*   **`DBConnectionManager`:** This custom class operates as a context manager, utilizing the `__enter__` and `__exit__` methods to control execution within `with` statement blocks. Every time an API endpoint or internal class needs to read or write data, this context manager automatically opens a cursor, executes the queries, commits the transaction upon completion, and securely closes the connection when exiting the block.

---

## 5. API Route & Class Breakdown

### A. Health Check
*   **Route:** `GET /`
*   **Functionality:** Acts as a simple heartbeat monitor. Visiting the root backend URL instantly returns a JSON payload confirming the server is online and running successfully.

### B. Fetching Label Presets
*   **Route:** `GET /labels/<device_id>`
*   **Functionality:** Calls the `GraphPreset.get_by_device()` class method. It queries the database using a stored procedure (`[dbo].[GetGraphPresets]`), dynamically pulls column headers and rows, and packs them into a clean JSON list so the frontend can display user-saved graph axis label presets. 

### C. Creating Label Presets
*   **Route:** `POST /create_labels`
*   **Functionality:** Extracts incoming JSON data submitted via a frontend form and instantiates a new `GraphPreset` object. The route then calls the object's `.create()` method, which executes the `[dbo].[CreateGraphPreset]` stored procedure and returns a `201 Created` status. 

### D. Updating Label Presets
*   **Route:** `PUT /update_label/<int:id>`
*   **Functionality:** Captures an ID from the URL parameter along with modified JSON form inputs to instantiate a `GraphPreset` object. It then calls `.update_label()`, executing the `[dbo].[UpdateGraphPreset]` stored procedure to target and modify that specific row ID in the database. 

### E. Deleting Label Presets
*   **Route:** `DELETE /delete_label/<int:id>`
*   **Functionality:** Takes a preset ID from the endpoint URL, instantiates an empty `GraphPreset` object loaded with that ID, and calls `.delete()` to erase the corresponding record via the `[dbo].[DeleteGraphPreset]` stored procedure.

### F. Uploading and Processing Raw CSV Data
*   **Route:** `POST /upload_data`
*   **Functionality:** 
    1. Grabs an uploaded CSV file and passes it into a newly instantiated `DataUploader` object.
    2. The class automatically generates a unique tracking ID (UUID) and uses Pandas to parse the file into an internal dataframe.
    3. The `.clean_data()` method cleans the column names (stripping whitespace, replacing spaces with underscores, removing special characters).
    4. The `.save()` method calls the `[dbo].[ClearDeviceRawData]` stored procedure to wipe previous data belonging to that specific `device_id`, then loops through the dataframe to securely store the dataset layout row-by-row using `[dbo].[InsertRawData]`.

### G. Fetching Uploaded CSV Columns
*   **Route:** `GET /csv_table`
*   **Functionality:** Calls the `GraphPreset.get_csv_table()` class method, which runs a distinct SQL query to extract all unique column names from the uploaded dataset. It returns them to the frontend so users can select their X and Y graphing axes. 

### H. Renaming Columns
*   **Route:** `PUT /rename_column`
*   **Functionality:** Takes an `old_name`, `new_name`, and `device_id` via JSON and utilizes the `DBConnectionManager` to securely execute a SQL `UPDATE` statement. This alters the underlying column name directly inside the database table schema, utilizing an `AND DeviceID = ?` check to guarantee isolation.

### I. Dynamic Graph Generation & Plotting Engine
*   **Route:** `POST /generate_graph`
*   **Functionality:** 
    1. **Fetches Constraints:** Retrieves the saved axis labels by calling `GraphPreset.get_by_id()`.
    2. **Instantiates the Engine:** Initializes a `GraphBuilder` object, passing in the target axes, the `device_id`, and the loaded preset object.
    3. **Data Processing:** The `.fetch_data()` method reads raw row-value records from SQL into Pandas (strictly filtered by `DeviceID`) and pivots the tall data format back into a clean wide-format dataframe.
    4. **Image Rendering:** The `.build_image()` method initializes a Matplotlib figure, plots the selected Y columns against the X column, applies the preset labels, and streams the plot into an in-memory byte buffer. It converts the buffer into a Base64 string and returns it as a data URL payload (`data:image/png;base64,...`) so the frontend can instantly render the graph without downloading a file.
