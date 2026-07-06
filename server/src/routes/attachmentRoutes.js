const router = require("express").Router();
const {authMiddleware} = require("../middleware/authMiddleware");
const {createAttachment, getAttachments, deleteAttachment, downloadAttachment} = require("../controllers/attachmentController");
const upload = require("../middleware/upload");

router.post("/tasks/:taskId/attachments", authMiddleware, upload.single("file"), createAttachment);

router.get("/tasks/:taskId/attachments",authMiddleware, getAttachments);

router.delete("/:attachmentId", authMiddleware, deleteAttachment);

router.get("/download/:attachmentId", authMiddleware, downloadAttachment);

module.exports = router;