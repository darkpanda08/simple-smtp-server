module.exports = {
  smtp: {
    port: process.env.SMTP_PORT || 25,
    host: process.env.SMTP_HOST || '0.0.0.0',
    allowInsecureAuth: true,
    authOptional: true,
    hideENHANCEDSTATUSCODES: false
  },
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    bucket: process.env.S3_BUCKET || 'bucket-name'
  }
};