const express = require("express");
const cors = require("cors");
const errorMiddleware = require("./middleware/errorMiddleware");

// Routes
const taskRoutes = require("./routes/taskRoutes");
const userRoutes = require("./routes/authRoutes");
const workspaceRoutes = require("./routes/workspaceRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/tasks", taskRoutes);
app.use("/api/auth", userRoutes);
app.use("/api/workspace", workspaceRoutes);


// error middlware
app.use(errorMiddleware);

app.get("/", (req, res) => {
  res.send("API Running...");
});

module.exports = app;