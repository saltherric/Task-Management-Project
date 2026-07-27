const express = require("express");
const upload = require("../middleware/upload");
const { uploadFile, deleteFile } = require("../services/uploadFile");
const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { generateSignedUrl } = require("../services/signedUrl");
const s3 = require("../config/s3");

const router = express.Router();

router.post(
  "/attachments",
  upload.single("file"),
  async (req, res) => {
    try {
      const { fileKey } = await uploadFile(req.file, "attachments");

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

// Route to handle user avatar uploads
router.post(
  "/avatar",
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "File is required",
        });
      }

      const { fileKey } = await uploadFile(req.file, "avatars");
      const fileUrl = await generateSignedUrl(fileKey);

      res.status(201).json({
        success: true,
        fileKey,
        fileUrl,
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }
);

// Route to stream S3 files
router.get(
  /^\/files\/(.+)$/,
  async (req, res) => {
    try {
      const fileKey = req.params[0];
      const command = new GetObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: fileKey,
      });

      const s3Item = await s3.send(command);

      res.setHeader("Content-Type", s3Item.ContentType || "image/jpeg");
      s3Item.Body.pipe(res);
    } catch (error) {
      res.status(404).json({
        message: "File not found or connection error",
      });
    }
  }
);

// Route to delete S3 files
router.delete(
  /^\/files\/(.+)$/,
  async (req, res) => {
    try {
      const fileKey = req.params[0];
      await deleteFile(fileKey);
      res.status(200).json({
        success: true,
        message: "File deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }
);

module.exports = router;