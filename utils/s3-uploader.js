const fs = require("fs");
const path = require("path");
const { PutObjectCommand, S3Client } = require("@aws-sdk/client-s3");
const config = require("../config/config")
const { logger } = require('./logger');

const uploadToS3 = async (emailFilePath, s3BucketName) => {
  const client = new S3Client({
    region: config.aws.region
  });

  try {
    const fileContent = await fs.promises.readFile(emailFilePath);

    const command = new PutObjectCommand({
      Bucket: s3BucketName,
      Key: path.basename(emailFilePath),
      Body: fileContent,
    });

    await client.send(command);
    logger.info(
      `File ${path.basename(
        emailFilePath
      )} uploaded to S3 bucket at s3://${s3BucketName}/${path.basename(emailFilePath)}`
    );
  } catch (err) {
    logger.error(`Error uploading file to S3: ${err}`);
  }
};

module.exports = {
  uploadToS3,
};
