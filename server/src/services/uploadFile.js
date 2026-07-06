const { PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const s3 = require("../config/s3");

const uploadFile = async (file) => {
  const fileKey = `${Date.now()}-${file.originalname}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: fileKey,
      Body: file.buffer,
      ContentType: file.mimetype,
    })
  );

  return {fileKey};
};

const deleteFile = async (fileKey) => {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: fileKey
    })
  )
};

module.exports = {uploadFile, deleteFile};