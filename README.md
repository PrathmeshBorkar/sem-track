# 🎓 SemTrack — Academic Intelligence Workbench

SemTrack is a full-stack student academic workbench designed for tracking semester course matrix, continuous assessment (CCA/LCA) marks, real-time SGPA forecasting, what-if simulations, and deadline management.

---

## 🛠️ Prerequisites

Before running the project locally, make sure you have installed:

1. **[Node.js](https://nodejs.org/)** (v18.0.0 or higher recommended)
2. **[MongoDB](https://www.mongodb.com/try/download/community)** (Community Server running locally on port `27017`, or a free [MongoDB Atlas](https://www.mongodb.com/atlas) connection string)
3. **[Git](https://git-scm.com/)**

---

## 🚀 Quick Start (Local Setup)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd sem-track
```

---

### 2. Backend Setup (`server`)

1. Navigate to the `server` directory and install dependencies:

   ```bash
   cd server
   npm install
   ```

2. Create a `.env` file inside the `server/` folder:

   ```bash
   # On Windows (PowerShell)
   Copy-Item .env.example .env

   # On macOS / Linux
   cp .env.example .env
   ```

3. Open `server/.env` and ensure the values are configured:

   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/sem-track
   CLIENT_ORIGIN=http://localhost:5173
   JWT_SECRET=super_secret_jwt_key_at_least_32_characters_long_12345
   SERVE_STATIC=false
   ```

   > **Note:** `JWT_SECRET` **must be at least 32 characters** long or the server will halt on startup.

4. Start the backend development server:

   ```bash
   npm run dev
   ```

   > The API will start running at **`http://localhost:5000`**.

---

### 3. Frontend Setup (`client`)

1. Open a **new terminal window**, navigate to the `client` directory, and install dependencies:

   ```bash
   cd client
   npm install
   ```

2. Start the Vite development server:

   ```bash
   npm run dev
   ```

   > The client will be accessible at **`http://localhost:5173`**.

---

## 🖥️ Using SemTrack

1. **Register an Account:**
   - Open [`http://localhost:5173/register`](http://localhost:5173/register) in your browser.
   - Enter your name, university email, and a password (minimum 8 characters).

2. **Add Courses:**
   - **Method A (Smart Add NLP):** Go to `/smart-add` and paste your syllabus/evaluation text, or use:
     ```text
     Add ICS, theory, 4 credits
     Marking: CCA1/15, Midsem/30, CCA2/15, Endsem/40

     Add IAM, theory, 2 credits
     Marking: CCA1/15, Midsem/30, CCA2/15, Endsem/40

     Add SEPM, theory, 2 credits
     Marking: CCA1/15, Midsem/30, CCA2/15, Endsem/40

     Add FSDL, lab, 2 credits
     Marking: LCA1/33, LCA2/33, LCA3/34
     ```
     Press `⌘ + Enter` to parse and click **Commit Course & Deliverables**.
   - **Method B (Manual Enrollment):** Go to `/subjects` and click **+ Enroll Course**.

3. **Track Marks & Forecast Grades:**
   - Click on any course to open its detail page and record your continuous assessment marks.
   - The grade forecast card and radial run-rate will update in real time.

4. **Simulate What-If SGPA:**
   - Open the **GPA Intelligence Engine** from the Dashboard to test hypothetical marks or calculate required marks using the **Target SGPA Solver**.

5. **Schedule Deliverables:**
   - Go to `/deadlines` to track assignments, quizzes, and project submission deadlines.

---

## 🧪 Running Tests

To run the automated backend unit, integration, and security test suite:

```bash
cd server
npm test
```

---

## 📁 Project Architecture

```text
sem-track/
├── client/                     # Frontend React + Vite SPA
│   ├── src/
│   │   ├── components/         # Dashboard, Subjects, Simulator, SmartAdd, Deadlines
│   │   ├── api.js              # Centralized fetch wrapper with credentials
│   │   ├── App.jsx             # Routing and authentication guards
│   │   └── index.css           # Obsidian Scholar design system tokens & utilities
│   ├── package.json
│   └── vite.config.js          # Proxies /api requests to http://localhost:5000
│
├── server/                     # Backend Express.js REST API
│   ├── middleware/             # JWT auth & object ID validators
│   ├── models/                 # Mongoose schemas (User, Subject, Deadline)
│   ├── nlp/                    # Syllabus & deadline NLP parser (Compromise.js)
│   ├── routes/                 # Express route handlers
│   ├── utils/                  # GPA engine & Target SGPA solver algorithms
│   ├── test/                   # Comprehensive Node test suites
│   ├── server.js               # Entry point
│   ├── seed-user-subjects.js   # Quick seed script for courses
│   └── package.json
│
└── README.md                   # Project documentation
```

---

## ⚙️ Tech Stack

- **Frontend:** React 18, React Router v7, Vite, Vanilla CSS Design System (Obsidian Scholar)
- **Backend:** Node.js, Express 4, Mongoose, JWT, bcryptjs, Compromise NLP, Day.js
- **Database:** MongoDB
