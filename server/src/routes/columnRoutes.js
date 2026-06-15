const express = require ("express");
const { getColumns } = require("../controllers/columnController");
const { authMiddleware } = require("../middleware/authMiddleware");
const router = express.Router();

router.get("/project/:projectId", authMiddleware, getColumns);

module.exports = router;