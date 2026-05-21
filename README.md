# Implementation Plan - Trello-Jira Hybrid (trello-cam)

We will build a fully featured, state-of-the-art **Todo Management System** (`trello-cam`) incorporating elements from Trello (boards, lists, cards, visual drag-and-drop) and Jira (projects, sprints, product backlog, reports/charts). The app will feature premium modern aesthetics (clean fonts, deep dark mode support, glassmorphism, responsive UI) and real-time syncing via Socket.IO.

---

## Technical Stack & Architecture

### Backend (`/backend`)
*   **Runtime/Framework:** Node.js, Express.js
*   **Database:** MongoDB with Mongoose (ODM)
*   **Real-time Communication:** Socket.IO
*   **Authentication:** JSON Web Tokens (JWT) + bcryptjs
*   **File Storage:** Local uploads (with public asset routing) structured for easy swap to Cloudinary/S3.
*   **Key npm Packages:** `express`, `mongoose`, `cors`, `dotenv`, `jsonwebtoken`, `bcryptjs`, `socket.io`, `multer`, `nodemailer`

### Frontend (`/frontend`)
*   **Framework:** React (Vite-powered, fast, modern SPA)
*   **UI Component Library:** Ant Design (`antd`) with `@ant-design/icons` and Bootstrap 5 
*   **State Management:** React Context API + custom hooks (provides a lightweight, high-performance solution for reactive state)
*   **Drag & Drop:** Modern React `dnd-kit` (or HTML5-based Drag & Drop with polished overlays for lists & cards)
*   **Rich Text Editor:** `react-quill` or high-quality custom rich editor for task descriptions.
*   **Data Visualization:** `recharts` (custom clean dashboards, burndown charts, productivity metrics)
*   **Real-time Communication Client:** `socket.io-client`
*   **Key npm Packages:** `antd`, `axios`, `react-router-dom`, `recharts`, `socket.io-client`, `react-quill`, `@ant-design/icons`

---

## User Review Required

> [!IMPORTANT]
> **Environment Variables:**
> For the system to run locally, we will setup standard defaults in `.env` files (e.g. `MONGO_URI=mongodb://127.0.0.1:27017/trello-cam`, `JWT_SECRET=supersecretkey`, `PORT=5000`). If you have a remote MongoDB cluster or specific JWT settings, please let us know.
>
> **File Uploads:**
> We will configure a local storage upload folder inside the backend (e.g., `backend/uploads`) that acts as the static assets server. This allows out-of-the-box uploading/downloading and instant preview of images and PDFs without needing external S3/Cloudinary credentials immediately.
>
> **Mock Emailing:**
> For verification and forgot-password flows, we will use a console-log fallback or custom mock transporter when real SMTP credentials are not supplied, so you can test registration and verification seamlessly without external email configs.

---

## Database Design (Mongoose Schemas)

1.  **User**
    *   `name` (String, required)
    *   `email` (String, required, unique)
    *   `password` (String, required)
    *   `avatar` (String)
    *   `role` (String: `'Admin' | 'Manager' | 'Member'`, default `'Member'`)
    *   `isVerified` (Boolean, default `false`)
    *   `verificationToken` (String)
    *   `resetPasswordToken` (String)
    *   `resetPasswordExpires` (Date)
2.  **Workspace**
    *   `name` (String, required)
    *   `description` (String)
    *   `owner` (ObjectId -> User, required)
    *   `members` (Array of `{ user: ObjectId -> User, role: 'Admin' | 'Manager' | 'Member' }`)
3.  **Project**
    *   `workspace` (ObjectId -> Workspace, required)
    *   `name` (String, required)
    *   `description` (String)
    *   `key` (String, required, unique key e.g. "TCAM")
    *   `visibility` (String: `'Public' | 'Private'`, default `'Private'`)
    *   `startDate` (Date)
    *   `dueDate` (Date)
    *   `status` (String: `'Active' | 'Archived'`, default `'Active'`)
4.  **Board**
    *   `project` (ObjectId -> Project, required)
    *   `name` (String, required)
    *   `description` (String)
    *   `isFavorite` (Boolean, default `false`)
    *   `bgType` (String: `'color' | 'image'`, default `'color'`)
    *   `bgValue` (String, default `'#1890ff'`)
5.  **List (Column)**
    *   `board` (ObjectId -> Board, required)
    *   `name` (String, required)
    *   `position` (Number, required)
6.  **Task (Card)**
    *   `list` (ObjectId -> List, required)
    *   `board` (ObjectId -> Board, required)
    *   `title` (String, required)
    *   `description` (String, rich HTML)
    *   `priority` (String: `'Low' | 'Medium' | 'High' | 'Urgent'`, default `'Medium'`)
    *   `status` (String: `'Todo' | 'In Progress' | 'Review' | 'Done'`, default `'Todo'`)
    *   `assignee` (ObjectId -> User)
    *   `creator` (ObjectId -> User, required)
    *   `dueDate` (Date)
    *   `position` (Number, required)
    *   `labels` (Array of String)
    *   `attachments` (Array of `{ name, url, fileType, uploadedAt }`)
    *   `checklist` (Array of `{ title, isCompleted }`)
    *   `estimatedTime` (Number, hours)
    *   `sprint` (ObjectId -> Sprint, optional)
7.  **Sprint**
    *   `project` (ObjectId -> Project, required)
    *   `name` (String, required)
    *   `goal` (String)
    *   `startDate` (Date)
    *   `endDate` (Date)
    *   `status` (String: `'Future' | 'Active' | 'Completed'`, default `'Future'`)
8.  **Comment**
    *   `task` (ObjectId -> Task, required)
    *   `user` (ObjectId -> User, required)
    *   `message` (String, required)
9.  **ActivityLog**
    *   `task` (ObjectId -> Task)
    *   `project` (ObjectId -> Project)
    *   `workspace` (ObjectId -> Workspace)
    *   `user` (ObjectId -> User, required)
    *   `action` (String, required e.g., "Created task", "Moved task")
    *   `details` (String)
    *   `createdAt` (Date, default `Date.now`)
10. **Notification**
    *   `recipient` (ObjectId -> User, required)
    *   `sender` (ObjectId -> User, required)
    *   `type` (String: `'Assign' | 'Comment' | 'DueSoon' | 'Mention'`)
    *   `task` (ObjectId -> Task)
    *   `isRead` (Boolean, default `false`)
    *   `message` (String)

---

## Proposed Changes

We will generate the workspace directories systematically:

### Backend Structure (`/backend`)

#### [NEW] [package.json](file:///d:/Raksmey/project/trello-cam/backend/package.json)
Contains all backend dependencies (`express`, `mongoose`, `cors`, `dotenv`, `jsonwebtoken`, `bcryptjs`, `socket.io`, `multer`, `nodemailer`).

#### [NEW] [.env](file:///d:/Raksmey/project/trello-cam/backend/.env)
Contains server configuration, DB string, JWT secret, server port.

#### [NEW] [server.js](file:///d:/Raksmey/project/trello-cam/backend/server.js)
Bootstrap server with express, HTTP, MongoDB connection, Socket.IO config, and static asset route.

#### [NEW] [config/db.js](file:///d:/Raksmey/project/trello-cam/backend/config/db.js)
Setup connection logic with MongoDB.

#### [NEW] [middlewares/auth.js](file:///d:/Raksmey/project/trello-cam/backend/middlewares/auth.js)
Middleware for JWT parsing and authorization checking (e.g. verifying Workspace roles).

#### [NEW] Models in `/models`
Schemas for:
*   [user.js](file:///d:/Raksmey/project/trello-cam/backend/models/user.js)
*   [workspace.js](file:///d:/Raksmey/project/trello-cam/backend/models/workspace.js)
*   [project.js](file:///d:/Raksmey/project/trello-cam/backend/models/project.js)
*   [board.js](file:///d:/Raksmey/project/trello-cam/backend/models/board.js)
*   [list.js](file:///d:/Raksmey/project/trello-cam/backend/models/list.js)
*   [task.js](file:///d:/Raksmey/project/trello-cam/backend/models/task.js)
*   [comment.js](file:///d:/Raksmey/project/trello-cam/backend/models/comment.js)
*   [sprint.js](file:///d:/Raksmey/project/trello-cam/backend/models/sprint.js)
*   [activityLog.js](file:///d:/Raksmey/project/trello-cam/backend/models/activityLog.js)
*   [notification.js](file:///d:/Raksmey/project/trello-cam/backend/models/notification.js)

#### [NEW] Controllers in `/controllers`
Business logic encapsulating CRUD + operations for Auth, Workspace, Project, Board, List, Task, Comments, Sprints, Notifications.

#### [NEW] Routes in `/routes`
API bindings mapping `/api/auth`, `/api/workspaces`, `/api/projects`, `/api/boards`, `/api/lists`, `/api/tasks`, `/api/comments`, `/api/sprints`, `/api/notifications`.

---

### Frontend Structure (`/frontend`)

#### [NEW] [package.json](file:///d:/Raksmey/project/trello-cam/frontend/package.json)
Contains all frontend dependencies (`vite`, `react`, `antd`, `@ant-design/icons`, `axios`, `react-router-dom`, `recharts`, `socket.io-client`, `react-quill`).

#### [NEW] [vite.config.js](file:///d:/Raksmey/project/trello-cam/frontend/vite.config.js)
Vite setup with support for local dev server configuration.

#### [NEW] [index.html](file:///d:/Raksmey/project/trello-cam/frontend/index.html)
Main viewport including Google Font link (e.g. Inter/Outfit) for sleek custom typography.

#### [NEW] [src/index.css](file:///d:/Raksmey/project/trello-cam/frontend/src/index.css)
Global styling setup with dark/light themes, curated HSL styling tokens, glassmorphic layout rules, card micro-animations, custom scrollbars, and full layout wrappers.

#### [NEW] [src/App.jsx](file:///d:/Raksmey/project/trello-cam/frontend/src/App.jsx)
Router configuration establishing private/public routes, layout definitions, and initializations.

#### [NEW] [src/context/AppContext.jsx](file:///d:/Raksmey/project/trello-cam/frontend/src/context/AppContext.jsx)
State manager keeping track of user authentication, active workspace, active project, real-time board updates via sockets, and local push notifications.

#### [NEW] Components in `/src/components`
*   `Sidebar.jsx`: Unified sidebar displaying interactive Workspaces list, Projects tree, Boards list, Dashboard link, Calendar, Reports, and System Settings.
*   `Navbar.jsx`: Premium header with a real-time notification drop-down panel, a unified search field, and a user profile/avatar control.
*   `BoardView.jsx`: Interactive Board component featuring lists with drag-and-drop mechanics, inline creation, and quick board favoriting/background customization.
*   `TaskModal.jsx`: Fully loaded task detail modal with:
    *   Description with rich text formatting (using a Quill editor or a beautiful custom styled rich editor).
    *   Checklists with automatic progress bars.
    *   Comments panel supporting dynamic `@username` styling.
    *   File Upload with instant image/PDF inline previewing and downloading.
    *   Time tracking (estimated vs logged hours).
    *   Assignee, Priority, Label selectors.
    *   Activity logs timeline.
*   `SprintManager.jsx`: Backlog & sprint manager enabling dragging backlog items into sprints, starting/ending sprints (Jira style), and outlining active sprint targets.

#### [NEW] Pages in `/src/pages`
*   `Login.jsx` & `Register.jsx`: Interactive, modern auth portals with rich typography and smooth loading animations.
*   `ForgotPassword.jsx` & `ResetPassword.jsx`: Form elements for secure verification and password retrieval.
*   `Dashboard.jsx`: Executive overview featuring:
    *   Key metrics (Total, Completed, Pending tasks).
    *   Task breakdown by status.
    *   Beautiful Recharts-based Velocity & Burndown charts.
    *   Recent activity stream.
*   `CalendarView.jsx`: High-performance calendar loading task cards aligned to their due-dates, supporting visual status badges and quick modal clicks.
*   `Reports.jsx`: Interactive charts with customizable filters for measuring developer speed, project completion rates, and historical performance.

---

## Verification Plan

### Automated Tests & Runs
*   **Backend Server Validation:** Run backend server (`node server.js` or `npm run dev`) and test API routing using standard fetch scripts or internal verification tool.
*   **Database Sync Verification:** Confirm creation of Mongoose collections upon database interaction.
*   **Frontend Dev Server:** Launch Vite dev environment (`npm run dev`) and verify UI responsiveness, responsive styling on smaller viewports, and proper client asset loading.

### Manual Verification Flow
1.  **Register/Login User A:** Access the authentication portal, complete validation, and land on the main workspace.
2.  **Create Workspace & Invite Member:** Create "Innovators Team Workspace", and invite "User B".
3.  **Create Project TCAM:** Set Project parameters, custom project key, and assign status.
4.  **Create Board & Define Lists:** Make "Sprint Board 1", set a visual gradient background, and add columns: *Todo*, *In Progress*, *Review*, and *Done*.
5.  **Create Task Cards:** Add standard tasks, enter detailed rich description, select urgency labels, attach a test PDF/image, and establish checklist items.
6.  **Drag and Drop Interactions:** Move cards dynamically across lists and confirm visual responsive transitions.
7.  **Real-Time Sync Check:** Open a second browser window (logged in as User B) and confirm cards shift, comments appear, and notifications display in real-time.
8.  **Sprint Mechanics:** Open Sprint Manager, move items from Backlog to Active Sprint, press "Start Sprint", and track visual progress on the Dashboard charts.
