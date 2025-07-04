const fs = require('fs');
const path = require('path');
const SMTPServer = require("smtp-server").SMTPServer;
const { uploadToS3 } = require('./utils/s3-uploader');
const { logger } = require('./utils/logger');
const config = require('./config/config');

const args = process.argv.slice(2);
let S3Upload = false;
let S3_BUCKET = null;

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  logger.info(`
  Usage: npm run <command>

  Commands:
      start          Start SMTP server (local storage only)
      start:s3       Start SMTP server with S3 upload capability
      help           Show this help message

  Examples:
      npm start
      npm run start:s3
      npm run help
  `);
  process.exit(0);
}

if (args.includes('--upload-to-s3')) {
  S3Upload = true;
  
  if (!config.aws.bucket) {
    logger.error('Error: S3 bucket not configured. Please set bucket in config.');
    process.exit(1);
  }
  
  S3_BUCKET = config.aws.bucket;
  logger.info(`Emails will be uploaded to S3 bucket ${S3_BUCKET}`);
} else {
  logger.info('Emails will not be uploaded to S3 bucket');
}

const server = new SMTPServer({
  allowInsecureAuth: config.smtp.allowInsecureAuth,
  authOptional: config.smtp.authOptional,
  hideENHANCEDSTATUSCODES: config.smtp.hideENHANCEDSTATUSCODES,

  onConnect(session, cb) {
    logger.info("==========================================");
    logger.info(`New connection established, Session: ${session.id}`);
    cb();
  },

  onMailFrom(address, session, cb) {
    logger.info(`Mail From: ${address.address}, Session: ${session.id}`);
    cb();
  },

  onRcptTo(address, session, cb) {
    logger.info(`Mail To: ${address.address}, Session: ${session.id}`);
    cb();
  },

  onData(stream, session, cb) {
    let emailData = '';

    stream.on('error', (err) => {
      logger.error(`Stream error: ${err}`);
      cb(err);
    });

    stream.on('data', (data) => {
      emailData += data.toString();
    });

    stream.on('end', () => {
      const filename = `email_${session.id}_${Date.now()}.eml`;
      const filePath = path.join(__dirname, 'emails', filename);

      const emailsDir = path.join(__dirname, 'emails');
      if (!fs.existsSync(emailsDir)) {
        try {
          fs.mkdirSync(emailsDir);
        } catch (err) {
          logger.error(`Error creating emails directory: ${err}`);
          return cb(err);
        }
      }

      fs.writeFile(filePath, emailData, (err) => {
        if (err) {
          logger.error(`Error writing email to file: ${err}`);
          return cb(err);
        }

        logger.info(`Email saved to file: ${filePath}`);

        if (S3Upload) {
          uploadToS3(filePath, S3_BUCKET)
        }
        
        emailData = '';
        cb();
      });
    });
  }
});

server.listen(config.smtp.port, config.smtp.host, () => {
  logger.info(`SMTP server listening on port ${config.smtp.port}`);
});

server.on('error', err => {
  logger.error('SMTP Server error:', {
    message: err.message,
    code: err.code,
    stack: err.stack
  });

});

function shutdownGracefully() {
  logger.info('Shutting down server...');

  const forceShutdown = setTimeout(() => {
    logger.error('Force shutting down after timeout');
    process.exit(1);
  }, 5000);

  new Promise((resolve) => server.close(resolve))
    .then(() => {
      clearTimeout(forceShutdown);
      logger.info('Server shut down successfully');
      process.exit(0);
    })
    .catch((err) => {
      clearTimeout(forceShutdown);
      logger.error('Error during shutdown:', err);
      process.exit(1);
    });
}

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  shutdownGracefully();
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received');
  shutdownGracefully();
});

process.on('SIGINT', () => {
  logger.info('SIGINT received');
  shutdownGracefully();
});
