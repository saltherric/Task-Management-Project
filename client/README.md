# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

client/
│
├── src/
│
│   ├── api/
│   │      axios.js
│   │      authApi.js
│   │      workspaceApi.js
│   │      projectApi.js
│   │      taskApi.js
│   │
│   ├── pages/
│   │      LoginPage.jsx
│   │      RegisterPage.jsx
│   │      DashboardPage.jsx
│   │      WorkspacePage.jsx
│   │      ProjectBoardPage.jsx
│   │
│   ├── components/
│   │
│   │      ├── layout/
│   │      │      Sidebar.jsx
│   │      │      Navbar.jsx
│   │      │
│   │      ├── board/
│   │      │      Board.jsx
│   │      │      Column.jsx
│   │      │      TaskCard.jsx
│   │      │
│   │      ├── task/
│   │      │      TaskModal.jsx
│   │      │      CreateTaskForm.jsx
│   │      │      EditTaskForm.jsx
│   │      │
│   │      ├── workspace/
│   │      │      WorkspaceCard.jsx
│   │      │
│   │      ├── project/
│   │      │      ProjectCard.jsx
│   │      │
│   │      └── common/
│   │             Loader.jsx
│   │             EmptyState.jsx
│   │             ConfirmModal.jsx
│   │
│   ├── context/
│   │      AuthContext.jsx
│   │
│   ├── hooks/
│   │      useAuth.js
│   │      useTasks.js
│   │
│   ├── services/
│   │      authService.js
│   │      taskService.js
│   │
│   ├── utils/
│   │      formatDate.js
│   │      taskHelpers.js
│   │
│   ├── routes/
│   │      AppRoutes.jsx
│   │      ProtectedRoute.jsx
│   │
│   ├── styles/
│   │      globals.css
│   │
│   ├── App.jsx
│   └── main.jsx
│
├── package.json
└── vite.config.js