const express = require("express");
const cors = require("cors");
const passport = require("passport");
const errorMiddleware = require("./middleware/errorMiddleware");
require("./config/passport");

// Routes
const taskRoutes = require("./routes/taskRoutes");
const userRoutes = require("./routes/authRoutes");
const workspaceRoutes = require("./routes/workspaceRoutes");
const projectRoutes = require("./routes/projectRoutes");
const columnRoutes = require("./routes/columnRoutes");
const attachmentRoutes = require("./routes/attachmentRoutes");
const commentRoutes = require("./routes/commentRoutes");
const inviteLinkRoutes = require("./routes/inviteLinkRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const app = express();

app.use(cors());
app.use(express.json());
app.use(passport.initialize());
app.use("/api/tasks", taskRoutes);
app.use("/api/auth", userRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/columns", columnRoutes);
app.use("/api/attachments", attachmentRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/workspaces", inviteLinkRoutes);
app.use("/api/notifications", notificationRoutes);

// error middlware
app.use(errorMiddleware);

app.get("/", (req, res) => {
  res.send("API Running...");
});

module.exports = app;