# Student Management System & Cloud Architecture Platform

**Course:** Web Application Architecture & Cloud Deployment  
**Case Study Focus:** Question 1 (Web Hosting, Domain Names, and DNS Architecture)  
**Architecture:** Decoupled Monorepo (`frontend/` for Vercel + `backend/` for Render)  

---

## 🏗️ Separated Project Architecture

The application is split into separate **Frontend** and **Backend** directories, matching the cloud deployment model:

```text
CASE STUDY/
├── backend/                  # ──> Deployed on Render (Node.js/Express Web Service)
│   ├── server.js             # Express application & REST API server
│   ├── routes/
│   │   ├── dnsRoutes.js      # Live DNS lookup & 6-step resolution trace
│   │   └── studentRoutes.js  # Full Student CRUD routes (/api/students)
│   ├── models/
│   │   └── studentStore.js   # MongoDB Atlas Mongoose model + Auto In-Memory fallback
│   ├── render.yaml           # Infrastructure-as-Code for Render deployment
│   ├── .env                  # Environment variables (PORT, MONGO_URI, CLIENT_ORIGIN)
│   ├── package.json          # Backend dependencies (express, cors, dotenv, mongoose)
│   └── package-lock.json
│
├── frontend/                 # ──> Deployed on Vercel (Edge CDN Static Hosting)
│   ├── index.html            # Interactive UI with Tailwind CSS & Lucide icons
│   ├── app.js                # Client controller: Live DNS trace & student CRUD
│   ├── style.css             # Custom styling, badges & stepper animations
│   ├── vercel.json           # Vercel Edge configuration with SPA routing rewrites
│   └── package.json          # Frontend metadata & standalone serve script
│
├── package.json              # Root workspace orchestrator
└── README.md                 # Project guide & submission documentation
```

---

## 🚀 How to Run

### Option 1: Unified Quick Start (Recommended)
From the root project folder:
```bash
npm start
```
* Starts the Express backend on `http://localhost:5000`.
* Express automatically serves the static files from `frontend/` so you can open your browser directly at:
  ```text
  http://localhost:5000
  ```

---

### Option 2: Running Backend & Frontend Independently
If you want to run the backend and frontend in separate processes (simulating Vercel on port 3000 calling Render on port 5000 via CORS):

1. **Start the Backend:**
   ```bash
   cd backend
   npm start
   ```
   *(Backend starts on `http://localhost:5000`)*

2. **Start the Frontend (in a second terminal):**
   ```bash
   cd frontend
   npx serve . -p 3000
   ```
   *(Frontend opens on `http://localhost:3000` and automatically connects to the backend on `localhost:5000` via CORS)*

---

## 🎯 Direct Relevance to Question 1

| Component | Cloud Role | Question 1 Concept Covered |
| :--- | :--- | :--- |
| **`frontend/`** | **Vercel** | **Web Hosting (Static & Edge CDN):** Compiled HTML/JS/CSS delivered across Anycast edge locations; client-side routing via `vercel.json`. |
| **`backend/`** | **Render** | **Web Hosting (PaaS Container):** Continuous Node.js/Express process handling dynamic HTTP REST API routes and persistent TCP connections. |
| **`models/`** | **MongoDB Atlas** | **Web Hosting (DBaaS):** Managed document database running 3-node replica sets with TLS security. |
| **`dnsRoutes.js`** | **DNS Engine** | **DNS & Domain Names:** Resolves real A, CNAME, and TXT records, and traces the 6-step iterative DNS hierarchy from browser to authoritative nameserver. |

---

## 📡 REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/dns/lookup` | Resolves live A, CNAME, and TXT records for any domain |
| `POST` | `/api/dns/trace` | Generates 6-step hierarchical DNS trace with step latencies |
| `GET` | `/api/dns/hosting-info` | Returns server runtime metrics and hosting comparison |
| `GET` | `/api/students` | Retrieves all registered student records |
| `POST` | `/api/students` | Creates a new student record |
| `PUT` | `/api/students/:id` | Updates a student's department or info |
| `DELETE`| `/api/students/:id` | Deletes a student record |
| `GET` | `/api/health` | Health check and database connectivity status |
