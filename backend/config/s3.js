const { S3Client } = require('@aws-sdk/client-s3');
const logger = require('../utils/logger');

// Initialize the AWS S3 client
// In EC2, AWS SDK automatically retrieves credentials from the instance metadata IAM role.
// Locally, it uses ~/.aws/credentials or AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY.
const s3Config = {
  region: process.env.AWS_REGION || 'us-east-1'
};

// Support local/mock endpoints if configured (e.g. LocalStack)
if (process.env.AWS_ENDPOINT) {
  s3Config.endpoint = process.env.AWS_ENDPOINT;
  s3Config.forcePathStyle = true;
}

if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  s3Config.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  };
}

const s3Client = new S3Client(s3Config);

logger.info(`S3 Client initialized in region ${s3Config.region}`);

module.exports = s3Client;
