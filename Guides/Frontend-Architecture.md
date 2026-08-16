# Frontend Architecture & Development 

## 1. Overview and Tech Stack
The frontend of the Data-to-Graph Web Automator was built using React.js and Vite to provide a fast, responsive, and highly interactive user experience. The primary goal of the interface is to bridge the gap between raw CSV data and customizable engineering graphs, allowing users to seamlessly manipulate data structures, manage graph label presets, and generate Matplotlib plots directly in the browser. 

The application utilizes modular React components to separate concerns, keeping the user interface scalable and the codebase maintainable.

## 2. Centralized State & Session Management (`App.jsx`)
To keep the application synchronized, `App.jsx` acts as the central command hub. Rather than having independent components ping the database blindly, `App.jsx` holds the core application state—such as the selected axes, active preset IDs, and modal visibility—and passes them down as props. 

### Stateless Multi-User Sessions
Because the backend uses a shared Azure database, the frontend is responsible for ensuring users only see their own data. The application utilizes a helper function to check the browser's `localStorage` for a `device_id`. If one does not exist, it generates a unique ID using `crypto.randomUUID()`. This ID is injected into every API request across the app to securely isolate operations on the backend.

### The `refreshKey` Implementation
A key mechanism here is the `refreshKey` state. When new data is uploaded or modified, triggering a state update on `refreshKey` forces the data tables to unmount and re-fetch the latest database context, ensuring the UI is always perfectly aligned with the backend. Furthermore, to prevent "missing column" crashes when switching between different datasets, this refresh function actively wipes the axis selection states clean upon every new upload.

## 3. Component Deep-Dives & Problem Solving

### CSV Data Ingestion (`CSVUpload.jsx`)
*   **Thought Process:** The entry point for the user is uploading their raw data. I needed a simple, robust form that could handle file objects and send them to the Flask backend via `FormData`. 
*   **The Problem:** Once a file was successfully uploaded to the database, the sibling components (like the data tables) had no native way of knowing they needed to update their UI to show the new columns.
*   **The Solution:** I implemented an `uploadCallback` prop that fires upon a successful `201` response. This callback triggers the `handleRefresh` function up in `App.jsx`, which increments the global `refreshKey`, clears out legacy selections, and seamlessly forces the rest of the application to render the newly uploaded data.

### Interactive Data Grid & Inline Editing (`GraphTable.jsx`)
*   **Thought Process:** Users need a clear visual mapping of their data to select what goes on their graph. I built a dynamic table that maps out the database columns, using radio buttons for the X-axis (restricting it to a single selection) and checkboxes for the Y-axis (allowing multiple selections). 
*   **The Problem:** Engineering data often requires column names or legends that start with numbers (e.g., `0 kg/h`), but SQL Server strictly rejects renaming physical columns if they start with a digit, throwing a 500 server error on the backend.
*   **The Solution:** Instead of building a complex, bloated alias-mapping state on the frontend to trick the database, I structurally refactored the backend to store these headers as simple row strings rather than schema columns. This allowed the React component to drop the complex logic and pass the user's raw input—alongside their `device_id`—directly via an `axios.put` request, drastically simplifying state management.

### Preset Management (`LabelList.jsx` & `LabelForm.jsx`)
*   **Thought Process:** Engineers often generate the same types of graphs repeatedly, so I built a preset system to save X and Y axis labels and units. I wanted a single, reusable modal form component (`LabelForm`) that could handle both creating new presets and updating existing ones.
*   **The Problem:** Managing separate states and API endpoints for POST (create) and PUT (update) requests within the same form component can lead to tangled, repetitive code.
*   **The Solution:** I passed an `existingLabel` prop into the form; by checking `Object.entries(existingLabel).length !== 0`, the component dynamically determines if it is updating or creating. It then automatically toggles the correct HTTP method (`POST` vs `PUT`) and API endpoint, attaching the session ID and eliminating the need to write duplicate code for both actions.

### Graph Rendering (`GraphGenerator.jsx`)
*   **Thought Process:** The heavy mathematical processing and graph generation had to remain in Python (Matplotlib), but the output needed to be displayed natively and instantly within the React interface. 
*   **The Problem:** Generating physical image files on the server and serving them via static URLs introduces file management overhead, caching issues, and potential storage buildup.
*   **The Solution:** I configured the backend to encode the Matplotlib figure directly into a base64 string in memory. The `GraphGenerator` component dynamically bundles the user's axis selections and `device_id` into a JSON payload, fires the request, and injects the returned base64 string straight into an HTML `<img>` tag's `src` attribute (`data:image/png;base64,...`), resulting in a fast image render with zero server clean-up required.

## 4. Styling & UI Organization (`{any_file_name}.css`)
To keep the project structure clean and maintainable, I modularized the styling by pairing each React component with its own dedicated CSS file (e.g., `CSVUpload.css`, `GraphTable.css`). By utilizing React's `className` attribute, I scoped styles directly to their respective components, avoiding the complexity and cascading conflicts of a single, bloated global stylesheet. 

For the visual design, I focused on a clean, accessible interface by implementing a cohesive dark theme. Using a specific palette of deep slate backgrounds (like `#0f172a` and `#1e293b`) paired with high-contrast text (`#f8fafc`), I established a clear visual hierarchy that reduces eye strain. I also utilized standard CSS design practices—such as distinct border separations in the data tables and intuitive hover states for action buttons—to ensure the application feels highly responsive and professional.
