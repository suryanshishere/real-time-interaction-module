**Real‑Time Interaction Module**

Deployed at:

* **Frontend:** [https://pollbuzz.vercel.app/](https://pollbuzz.vercel.app/)
* **Backend:** [https://pollbuzz-backend.onrender.com/](https://pollbuzz-backend.onrender.com/)
* **Overview (Video Walkthrough):** [2 minute walkthrough](https://www.loom.com/share/43bb07bdc3d14aeda92c2defa1f43b57?sid=8a8a2fb2-e550-47c2-864c-4cbcedc79453)

A simple real‑time polling session application that lets an admin host interactive polls and an audience join, vote, and view live results.

---

## Features Completed

* **Admin Poll Management**

  * Create, launch, and close polls in real time
* **Audience Participation**

  * Join sessions via a unique session code
  * Submit votes on active polls
* **Live Results Visualization**

  * Display real‑time updates with bar and pie charts
* **Session History & Timer (Optional)**

  * Track past polls and countdown timers for live sessions
* **Authentication & Authorization**

  * User signup / login with JWT‑based auth
  * Role‑based access: admin vs. audience
* **Extras**

  * Email notifications
  * Responsive UI with Next.js App Router
  * Socket.IO for bidirectional communication

---

## Evaluation Considerations

While developing this module, the following evaluation areas were kept in focus:

* Completion and accuracy of core features
* UI/UX quality and overall functionality
* Clean and modular code structure for readability and maintenance
* Thought process and custom implementation choices
* Bonus features including live charts and mobile responsiveness

---

## Tech Stack

* **Frontend:**

  * Next.js (App Router)
  * Tailwind CSS
  * Chart.js / Recharts
  * Socket.IO client
* **Backend:**

  * Node.js + Express
  * TypeScript
  * Socket.IO server
  * MongoDB with Mongoose
  * JWT for authentication
* **DevOps & Testing:**

  * Vercel (frontend) & Render (backend)
  * ESLint & Prettier

---

## Getting Started

1. **Clone the repo**

   ```bash
   git clone https://github.com/suryanshishere/real-time-interaction-module.git
   cd real-time-interaction-module
   ```

2. **Install dependencies**

   ```bash
   # Backend
   cd backend && npm install

   # Frontend
   cd ../frontend && npm install
   ```

3. **Configure environment**
   Copy `.env.example` to `.env` in both `backend` and `frontend` and fill in:

   ```env
   MONGODB_URI=<your-mongo-uri>
   JWT_SECRET=<your-secret>
   ```

4. **Run locally**

   ```bash
   # In two terminals
   cd backend && npm run dev
   cd frontend && npm run dev
   ```

   * Backend runs at `http://localhost:4000`
   * Frontend runs at `http://localhost:3000`

---

## Testing Credentials

For quick testing use:

> **Email:** [heresuryanshsingh@gmail.com](mailto:heresuryanshsingh@gmail.com)
>
> **Password:** test12345

---

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   ├── .env.example
│   ├── index.ts
│   └── package.json
├── frontend/
│   ├── app/
│   │   ├── (auth|poll|admin)/
│   │   └── layout.tsx
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── styles/
│   ├── utils/
│   ├── env.mjs
│   └── package.json
└── README.md
```
