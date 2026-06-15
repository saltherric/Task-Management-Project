const router = require("express").Router();
const {authMiddleware} = require("../middleware/authMiddleware");
const {createAttachment, getAttachments, deleteAttachment} = require("../controllers/attachmentController");

router.post("/tasks/:taskId/attachments", authMiddleware, createAttachment);

router.get("/tasks/:taskId/attachments",authMiddleware, getAttachments);

router.delete("/attachments/:attachmentId", authMiddleware, deleteAttachment);

module.exports = router;