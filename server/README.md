# Task Management Backend (Node.js + MongoDB)

## 1) Install dependencies

```bash
npm install
```

## 2) Create environment file

Create `.env` from `.env.example` and set your values:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/task_management
JWT_SECRET=replace_with_a_strong_secret
CLIENT_URL=http://localhost:5173
```

## 3) Run backend server

```bash
npm run dev
```

Health check endpoint:

`GET http://localhost:5000/api/health`

## Auth APIs

### Register

- Method: `POST`
- URL: `/api/auth/register`
- Body:

```json
{
  "username": "john",
  "email": "john@example.com",
  "password": "123456"
}
```

### Login

- Method: `POST`
- URL: `/api/auth/login`
- Body:

```json
{
  "email": "john@example.com",
  "password": "123456"
}
```

## Task APIs (Protected)

Include header:

`Authorization: Bearer <token>`

### Get tasks

- Method: `GET`
- URL: `/api/tasks`

### Create task

- Method: `POST`
- URL: `/api/tasks`
- Body:

```json
{
  "title": "Learn backend",
  "description": "Connect React app to API",
  "priority": "High",
  "status": "Pending"
}
```

### Update task

- Method: `PATCH`
- URL: `/api/tasks/:id`

### Delete task

- Method: `DELETE`
- URL: `/api/tasks/:id`