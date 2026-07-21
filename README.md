# 🛡️ Guardian: Enterprise System Audit Logs Dashboard

[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express_4.19-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas_8.4-47A248.svg)](https://www.mongodb.com/)
[![Vercel](https://img.shields.io/badge/Deployment-Vercel-black.svg)](https://vercel.com)

> **Guardian** is an enterprise-grade, full-stack cybersecurity audit log intelligence platform built to ingest, index, investigate, and analyze system activity logs at scale.

---

## 🌟 Key Features

- **⚡ High-Throughput Log Ingestion**: Supports single-record JSON uploads as well as high-capacity bulk datasets (up to 10,000 logs per batch).
- **🔍 Sub-Millisecond Search & Indexing**: Real-time server-side text search across Actors, IP Addresses, Resources, and Regions using MongoDB compound indices.
- **🎯 Multi-Dimensional Filtering**: Dynamic filtering by Severity (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), Resolution Status (`Unresolved`, `Resolved`), User Roles, and System Actions.
- **🕵️ Incident Investigation Drawer**: Interactive side-panel providing full JSON payload deep-dives and live status toggling (Resolve / Re-open incidents).
- **📊 Real-time Security Metrics**: Live dashboard analytics tracking total log counts, unresolved alerts, critical incident metrics, and resolution progress.
- **🎨 Responsive Cyber-Security Theme**: Built with custom dark mode glassmorphism, micro-animations, accessible color tokens, and smooth drag-and-drop mechanics.

---

## 🏗️ Architecture & Technical Decisions

```
                           +------------------------+
                           |  Vercel Edge Network   |
                           |   (React + Vite UI)    |
                           +-----------+------------+
                                       |
                              REST API | /api/logs
                                       v
                           +------------------------+
                           | Vercel Serverless /    |
                           |   Express Node API     |
                           +-----------+------------+
                                       |
                              Mongoose | Index Queries
                                       v
                           +------------------------+
                           |  MongoDB Atlas Cluster |
                           |   (Document Storage)   |
                           +------------------------+
```

### Backend (`Node.js`, `Express`, `TypeScript`, `MongoDB`)
1. **Strong Typing & Scalability**: Clean TypeScript architecture ensuring strict API request/response contracts and reliable maintainability.
2. **Database Optimization & Compound Indexing**:
   - High-cardinality fields (`actor`, `role`, `action`, `resourceType`, `region`, `severity`, `status`, `timestamp`) are indexed for instant server-side pagination, sorting, and filtering.
   - Text indexing enables instant search across IP addresses and email patterns.
3. **High-Performance Bulk Ingestion**: Uses Mongoose `insertMany` with `{ ordered: false }` for maximum write throughput during large log batch uploads.

### Frontend (`React`, `TypeScript`, `Vite`, `Vanilla CSS`)
1. **Lightning-Fast UI**: Powered by Vite and React 18 for sub-second page loads and instantaneous state updates.
2. **Zero-Dependency Styling System**: Native CSS custom variables (`--bg-primary`, `--primary`, `--critical`) ensuring total control over layout performance and sleek cyber-security aesthetics without heavyweight utility frameworks.
3. **Resilient Drag-and-Drop Ingestion**: Persistent dropzone component supporting seamless dragging of single or bulk JSON files without blocking UI view state.

---

## 📁 Repository Structure

```
Audit/
├── vercel.json                 # Unified multi-service deployment configuration
├── package.json                # Root package for workspace orchestration
├── README.md                   # Project documentation
├── backend/
│   ├── src/
│   │   ├── models/
│   │   │   └── AuditLog.ts     # Mongoose Schema & Indices definition
│   │   ├── routes/
│   │   │   └── logs.ts         # REST API Controllers & Query Engine
│   │   └── index.ts            # Express App setup & database connection
│   ├── generate_logs.js        # Script to synthesize mock log datasets (10,000 records)
│   ├── package.json            # Backend dependencies & build scripts
│   └── tsconfig.json           # Backend TypeScript configuration
└── frontend/
    ├── src/
    │   ├── App.tsx             # Main Dashboard, Filters, Ingestion & Investigation Drawer
    │   ├── index.css           # Global Design Tokens & Cyber Theme Styles
    │   └── main.tsx            # Application Entrypoint
    ├── index.html              # HTML Shell & Google Fonts integration
    ├── vite.config.ts          # Vite configuration & Dev Proxy settings
    ├── package.json            # Frontend dependencies & build scripts
    └── tsconfig.json           # Frontend TypeScript configuration
```

---

## 🚀 API Endpoint Reference

| Method | Endpoint | Description | Query / Body Parameters |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/logs` | Fetch paginated & filtered audit logs | `page`, `limit`, `search`, `severity`, `status`, `role`, `action`, `region`, `sortBy`, `sortOrder` |
| `GET` | `/api/logs/stats` | Fetch aggregate metrics & unique filter values | N/A |
| `POST` | `/api/logs/bulk` | Ingest single or bulk array of JSON logs | JSON payload (Array or Single Document) |
| `PATCH` | `/api/logs/:id` | Update log incident status | `{ "status": "Resolved" \| "Unresolved" }` |
| `GET` | `/health` | Service health check | N/A |

---

## 💻 Local Setup & Installation

### Prerequisites
- **Node.js** (v18.x or higher)
- **npm** (v9.x or higher)
- **MongoDB** (Local instance or MongoDB Atlas URI)

### Quick Start

1. **Clone Repository**:
   ```bash
   git clone https://github.com/A-Muthurama/Gidy.git
   cd Gidy
   ```

2. **Install Dependencies**:
   ```bash
   npm run install:all
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the `backend/` directory:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/audit_db
   ```

4. **Generate Sample Test Logs (10,000 Records)**:
   ```bash
   npm run generate-data
   ```
   *Generates `backend/sample_audit_logs.json` for instant UI upload testing.*

5. **Run Development Server**:
   ```bash
   npm run dev
   ```
   - **Frontend UI**: [http://localhost:3000](http://localhost:3000)
   - **Backend API**: [http://localhost:5000](http://localhost:5000)

---

## ☁️ Deployment Guide (Vercel)

This repository is pre-configured for **unified Vercel Multi-Service Deployment** via the root `vercel.json`.

1. Import repository on [Vercel](https://vercel.com).
2. Set **Root Directory** to `./`.
3. Add Environment Variable:
   - `MONGO_URI`: Your MongoDB Atlas Connection String.
4. Deploy! Vercel will automatically build both the React frontend and Node backend services.

---

## 👨‍💻 Author

**Muthurama A**  
- GitHub: [@A-Muthurama](https://github.com/A-Muthurama)  
- Email: `iammuthurama@gmail.com`
