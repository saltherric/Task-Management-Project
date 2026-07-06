const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const s3 = require("../config/s3");

const generateSignedUrl = async (fileKey) => {
  const command = new GetObjectCommand({
    Bucket: process.env.BUCKET_NAME,
    Key: fileKey,
  });

  const url = await getSignedUrl(s3, command, {
    expiresIn: 60 * 5, 
  });

  return url;
};

const generateSignedDownloadUrl = async (fileKey, fileName) => {
  const command = new GetObjectCommand({
    Bucket: process.env.BUCKET_NAME,
    Key: fileKey,

    ResponseContentDisposition: `attachment; filename="${fileName}"`,
  });

  return await getSignedUrl(s3, command, {
    expiresIn: 300, 
  });
};

module.exports = {generateSignedUrl, generateSignedDownloadUrl };