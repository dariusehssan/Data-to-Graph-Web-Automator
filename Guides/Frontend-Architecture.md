# Frontend Architecture & Development 
**Data-to-Graph Web Automator**

## 1. Overview and Tech Stack
The frontend of the Data-to-Graph Web Automator was built using React.js and Vite to provide a fast, responsive, and highly interactive user experience. The primary goal of the interface is to bridge the gap between raw CSV data and customizable engineering graphs, allowing users to seamlessly manipulate data structures, manage graph label presets, and generate Matplotlib plots directly in the browser. 

The application utilizes modular React components to separate concerns, keeping the user interface scalable and the codebase maintainable.

## 2. Centralized State Management (`App.jsx`)
To keep the application synchronized, `App.jsx` acts as the central command hub[cite: 2]. Rather than having independent components ping the database blindly, `App.jsx` holds the core application state—such as the selected axes, active preset IDs, and modal visibility—and passes them down as props[cite: 2]. 

A key mechanism here is the `refreshKey` state[cite: 2]. When new data is uploaded or modified, triggering a state update on `refreshKey` forces the data tables to unmount and re-fetch the latest database context, ensuring the UI is always perfectly aligned with the backend[cite: 2].

## 3. Component Deep-Dives & Problem Solving

### CSV Data Ingestion (`CSVUpload.jsx`)
*   **Thought Process:** The entry point for the user is uploading their raw data. I needed a simple, robust form that could handle file objects and send them to the Flask backend via `FormData`[cite: 5]. 
*   **The Problem:** Once a file was successfully uploaded to the database, the sibling components (like the data tables) had no native way of knowing they needed to update their UI to show the new columns.
*   **The Solution:** I implemented an `uploadCallback` prop that fires upon a successful `201` response[cite: 5]. This callback triggers the `handleRefresh` function up in `App.jsx`, which increments the global `refreshKey` and seamlessly forces the rest of the application to render the newly uploaded data[cite: 2, 5].

### Interactive Data Grid & Inline Editing (`GraphTable.jsx`)
*   **Thought Process:** Users need a clear visual mapping of their data to select what goes on their graph. I built a dynamic table that maps out the database columns, using radio buttons for the X-axis (restricting it to a single selection) and checkboxes for the Y-axis (allowing multiple selections)[cite: 10]. 
*   **The Problem:** Engineering data often requires column names or legends that start with numbers (e.g., `0 kg/h`), but SQL Server strictly rejects renaming physical columns if they start with a digit, throwing a 500 server error on the backend.
*   **The Solution:** Instead of building a complex, bloated alias-mapping state on the frontend to trick the database, I structurally refactored the backend to store these headers as simple row strings rather than schema columns. This allowed the React component to drop the complex logic and pass the user's raw input directly via an `axios.put` request, drastically simplifying state management[cite: 10].

### Preset Management (`LabelList.jsx` & `LabelForm.jsx`)
*   **Thought Process:** Engineers often generate the same types of graphs repeatedly, so I built a preset system to save X and Y axis labels and units[cite: 11, 12]. I wanted a single, reusable modal form component (`LabelForm`) that could handle both creating new presets and updating existing ones[cite: 11].
*   **The Problem:** Managing separate states and API endpoints for POST (create) and PUT (update) requests within the same form component can lead to tangled, repetitive code.
*   **The Solution:** I passed an `existingLabel` prop into the form; by checking `Object.entries(existingLabel).length !== 0`, the component dynamically determines if it is updating or creating[cite: 11]. It then automatically toggles the correct HTTP method (`POST` vs `PUT`) and API endpoint, keeping the component entirely DRY (Don't Repeat Yourself)[cite: 11].

### Graph Rendering (`GraphGenerator.jsx`)
*   **Thought Process:** The heavy mathematical processing and graph generation had to remain in Python (Matplotlib), but the output needed to be displayed natively and instantly within the React interface[cite: 7]. 
*   **The Problem:** Generating physical image files on the server and serving them via static URLs introduces file management overhead, caching issues, and potential storage buildup.
*   **The Solution:** I configured the backend to encode the Matplotlib figure directly into a base64 string in memory. The `GraphGenerator` component receives this string and dynamically injects it straight into an HTML `<img>` tag's `src` attribute (`data:image/png;base64,...`), resulting in a fast image render with zero server clean-up required[cite: 7].

## 4. Styling & UI Organization
To keep the project structure clean and maintainable, I modularized the styling by pairing each React component with its own dedicated CSS file (e.g., `CSVUpload.css`, `GraphTable.css`)[cite: 4, 9]. By utilizing React's `className` attribute, I scoped styles directly to their respective components, avoiding the complexity and cascading conflicts of a single, bloated global stylesheet[cite: 5, 10]. 

For the visual design, I focused on a clean, accessible interface by implementing a cohesive dark theme. Using a specific palette of deep slate backgrounds (like `#0f172a` and `#1e293b`) paired with high-contrast text (`#f8fafc`), I established a clear visual hierarchy that reduces eye strain[cite: 1, 4]. I also utilized standard CSS design practices—such as distinct border separations in the data tables and intuitive hover states for action buttons—to ensure the application feels highly responsive and professional[cite: 6, 9, 13].
