# 🚀 Deployment and Infrastructure Guide: Data-to-Graph Web Automator

This guide outlines the deployment architecture, configuration steps, and troubleshooting processes used to take the **Data-to-Graph Web Automator** from a local Python script into a fully hosted, cloud-native web application.

---

## 🏗️ 1. Architecture Overview
The application is decoupled into three production-grade cloud tiers to ensure scalable routing and reliable data persistence:
* **Frontend Layer (Vercel):** Serves the user interface.
* **Backend Layer (Render):** Hosts the Python/Flask application inside a custom Docker container.
* **Database Layer (Azure SQL Database):** Securely stores user inputs and preset configurations in a cloud database.

---

## 🛠️ 2. Step-by-Step Deployment Procedure

### Step A: Configuring Azure SQL Database
1. Provisioned a managed SQL Server on Azure with a custom username and password (`dariusehssan1`).
2. Exported the original local database directly into the newly created Azure SQL Database instance (`datagraph_db`).
3. Replaced the connection string in main.py to connect with the Azure database.

### Step B: Containerising and Deploying the Backend on Render
1. As standard Platform as a Service buildpacks lack native Microsoft ODBC drivers, the backend was packaged into a Docker container to bundle the pyodbc library and required system dependencies.
2. Linked the repository to Render to deploy the containerised web service, which automatically makes a live public endpoint.

### Step C: Linking the Frontend on Vercel
1. Deployed the frontend application repository to Vercel.
2. Configured the project environment variables in the Vercel dashboard:
* **Variable Name:** VITE_API_URL
* **Value:** https://data-to-graph-backend.onrender.com
3. Triggered a manual redeployment to bake the production API route directly into the static bundle.

## 🔍 3. Troubleshooting & Engineering Hurdles Conquered
1. **Missing Database Drivers**(pyodbc error):
* *Challenge*: Standard cloud environments produced errors because Microsoft SQL drivers were not natively present.
* *Resolution*: Switched to containerised deployments using Docker to explicitly install and configure the necessary system-level database libraries alongside Python.

2. **Mismatched API Routes**(500 Internal Server Error):
* *Challenge*: Initial frontend submissions triggered server errors because requests were accidentally routing to a legacy Render instance instead of the new container.
* *Resolution*: Inspected browser Network tabs to track outbound request paths, updated Vercel's environment variables to target the correct production URL, and successfully redeployed.

3. **Cloud Firewall Access Blocking**(Azure SQL Security):
* *Challenge*: Requests successfully reached the backend, but Azure SQL rejected the database connection with an IP restriction error (40615).
* *Resolution*: Logged into the Azure Portal, accessed the database server's firewall settings, and explicitly whitelisted Render's outbound client IP address (74.220.51.139) under a custom firewall rule (RenderBackend) to establish secure cloud-to-cloud communication.
