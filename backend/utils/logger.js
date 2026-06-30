const winston = require('winston');
const WinstonCloudwatch = require('winston-cloudwatch');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Configure CloudWatch transport in production
if (process.env.NODE_ENV === 'production') {
  logger.add(new WinstonCloudwatch({
    logGroupName: process.env.CLOUDWATCH_GROUP_NAME || '/aws/ec2/hr-system-backend',
    logStreamName: `${process.env.CLOUDWATCH_STREAM_NAME || 'backend-stream'}-${process.env.HOSTNAME || 'localhost'}`,
    awsRegion: process.env.AWS_REGION || 'us-east-1',
    jsonMessage: true
  }));
}

module.exports = logger;
