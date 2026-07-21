# Guardian: System Audit Logs Dashboard

Guardian is a premium full-stack dashboard built for security engineers to upload, view, filter, sort, and investigate system audit logs.

---

## Technical Decisions

### Backend

1. **Node.js, Express & TypeScript**: Selected for a robust, strongly-typed development experience and efficient async I/O handling.
2. **MongoDB & Mongoose Schema**: 
   - Audit logs naturally fit a semi-structured document store where records are static and read-heavy.
   - Built-in schema validation ensures database integrity for severity levels (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) and resolution status (`Unresolved`, `Resolved`).
3. **Indexing for Performance**:
   - Single-field and compound indexes are configured on high-cardinality fields (`actor`, `role`, `action`, `resourceType`, `region`, `severity`, `status`, `timestamp`) to guarantee sub-millisecond server-side querying, sorting, and filtering.
   - Text indexing allows broad search patterns across actor emails, IP addresses, and resource paths.
4. **Bulk Ingestion optimization**:
   - The `/api/logs/bulk` API leverages Mongoose's `insertMany` option with `{ ordered: false }` to insert up to 10,000 logs in a single batch, minimizing database round-trips.

### Frontend

1. **React, TypeScript & Vite**: Selected for compile-time safety, extremely fast build speeds, and instant development hot reloading.
2. **Proxy Configuration**:
   - Out-of-the-box development proxy is set up in `vite.config.ts` to map `/api` calls directly to the Express server running on port `5000` to avoid CORS issues.
3. **Vanilla CSS System**:
   - Custom CSS variables (`--bg-primary`, `--primary`, `--critical`, etc.) build a cohesive cyber-security style theme.
   - Responsive flexbox/grid layout ensures the dashboard scales beautifully on all screens.
   - Micro-animations (like sliding sidebar drawer and smooth fade-in animations) enhance the visual experience.

---

## Project Structure

```
Audit/
├── backend/
│   ├── src/
│   │   ├── models/
│   │   │   └── AuditLog.ts
│   │   ├── routes/
│   │   │   └── logs.ts
│   │   └── index.ts
│   ├── .env
│   ├── generate_logs.js
│   ├── tsconfig.json
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── index.css
│   │   └── main.tsx
│   ├── index.html
│   ├── tsconfig.json
│   └── package.json
├── package.json
└── README.md
```

---

## Setup & Running Instructions

### Prerequisites
- **Node.js** (v18+ recommended)
- **MongoDB** running locally on default port `27017` (or edit `backend/.env` with your custom connection string).

### Installation

1. Clone or download this project.
2. Navigate to the root directory `Audit`.
3. Install all dependencies for both frontend and backend:
   ```bash
   npm run install:all
   ```

### Running the Application

1. **Generate Test Data (10,000 Mock Logs)**:
   Generate a test file containing 10,000 random audit logs:
   ```bash
   npm run generate-data
   ```
   This will output a file `backend/sample_audit_logs.json` that you can upload directly in the frontend UI.

2. **Start Dev Servers**:
   Run both frontend (Vite) and backend (Express) concurrently:
   ```bash
   npm run dev
   ```
   - **Frontend** will be live at: http://localhost:3000
   - **Backend** will be live at: http://localhost:5000

---

## Verification

### Uploading Logs
- Open http://localhost:3000
- If the database is empty, a large dropzone will ask you to upload a logs file.
- Drag & drop or browse to select the generated `backend/sample_audit_logs.json`.
- The dashboard will ingest all 10,000 logs and populate the interface instantly.

### Incident Investigation
- Use the search bar to query actors, IP addresses, or resources.
- Filter by Severity, Status, Role, Action, or Region.
- Click any log row to open the **Log Investigation Panel** on the right side.
- Inspect the full JSON payload, and toggle its status between `Resolved` and `Unresolved` directly from the UI.
