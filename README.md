# 📊 Data-to-Graph Web Automator

This project started at the beginning of this year with a simple goal: create a Python script to automate the generation of graphs from raw data.

While the console-based Python script worked, it had limitations. Running everything through a command-line interface meant input questions were rigid, data couldn't easily persist, and saving custom graph options from previous runs was difficult. More importantly, I wanted a solution that others could easily use themselves, without having to run code locally or dig through source files.

To solve this, I decided to scale the project into a full-stack web application. Stepping outside my core chemical engineering background, I committed to learning JavaScript, HTML, and CSS for the frontend, while expanding my database knowledge with SQL.

Building a web interface from scratch has brought plenty of learning curves and complex hurdles along the way, but it has been an invaluable journey so far in bridging core engineering data needs with modern web development.

## 🛠️ Tech Stack
* **Frontend:** JavaScript, HTML, CSS
* **Backend/Processing:** Python
* **Data Management:** SQL

## Website Architecture Overview
* **Frontend:** Vercel
* **Backend:** Render
* **Database:** Azure SQL Database

For an in-depth look at how this project was built, please refer to the detailed markdown guides included in this repository:

*   **[Frontend Architecture](./Guides/Frontend-Architecture.md)**
*   **[Backend Architecture](./Guides/Backend-Architecture.md)**
*   **[Database Architecture & SQL Implementation](./Guides/Database-Architecture.md)**
*   **[Web Deployment Setup](./Guides/Web-Deployment-Setup.md)**

## 🚀 Project Roadmap (Planned Features)

As this application continues to grow, the next phase of development will focus on transitioning from a session-based tool to a fully personalized, multi-user platform. 

*   **Robust User Authentication:** Implementing a secure account system with encrypted, high-security password hashing to ensure user credentials are safe.
*   **Persistent Cloud Storage:** Allowing users to permanently save their raw CSV data, generated Matplotlib graphs, and custom axis presets directly to their personal profiles, eliminating the need to re-upload files during new sessions.
*   **Cross-Device Synchronization:** Upgrading the architecture so users can securely log into their accounts from any desktop or mobile device and instantly access their historical data and saved projects.
*   **Multi-Page Application Routing:** Expanding the frontend interface with dedicated routes (e.g., utilizing React Router) to create separate, intuitive pages for user dashboards, account settings, and the core graphing engine.
