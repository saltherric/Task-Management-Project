const express = require("express");
const upload = require("../middleware/upload");
const uploadFile = require("../services/uploadFile");

const router = express.Router();

router.post(
  "/attachments",
  upload.single("file"),
  async (req, res) => {
    try {
      const fileKey = await uploadFile(req.file);

      res.status(201).json({
        success: true,
        fileKey,
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }
);

module.exports = router;