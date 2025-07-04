# Simple SMTP Server

[![Docker Image](https://github.com/darkpanda08/simple-smtp-server/actions/workflows/publish-ghcr.yaml/badge.svg)](https://github.com/users/darkpanda08/packages/container/package/simple-smtp-server)

A lightweight SMTP server that captures emails and saves them locally or uploads to AWS S3 bucket.

## Installation

```bash
git clone https://github.com/darkpanda08/simple-smtp-server.git

cd smtp-server

npm install
```

## Usage

```bash
# Show help
npm run help

# Start server (local storage)
npm start

# Start server with S3 upload
npm run start:s3

# Run with sudo for port 25
npm run start:local
npm run start:local:s3
```

## Configuration

| Variable | Description | Default Value |
|----------|-------------|---------------|
| `SMTP_PORT` | SMTP server port | 25 |
| `SMTP_HOST` | SMTP server host | 0.0.0.0 |
| `AWS_REGION` | AWS region for S3 | us-east-1 |
| `S3_BUCKET` | S3 bucket name (required for S3 upload) | - |
| `AWS_ACCESS_KEY_ID`* | AWS access key for S3 upload | - |
| `AWS_SECRET_ACCESS_KEY`* | AWS secret key for S3 upload | - |

*Not required when running on EC2 with IAM role


## AWS Requirements

### S3 Bucket
- Create an S3 bucket in your AWS account
- Add the bucket name in `config/config.js` file or as environment variable `S3_BUCKET`

### Authentication
Choose one of:
1. **EC2 IAM Role** (if running on EC2)
   - Attach the policy to the EC2 instance role
2. **IAM User** (if running locally/Docker)
   - Create an IAM user
   - Generate access key and secret
   - Set as environment variables

### IAM Permissions
Create an IAM user/role with the following policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

## Code Structure

```
├── app.js              # Main SMTP server application
├── config/
│   └── config.js       # Configuration settings
├── utils/
│   ├── logger.js       # Logging utility
│   └── s3-uploader.js  # AWS S3 upload functionality
├── emails/             # Local email storage directory
└── Dockerfile          # Docker configuration
```

## Features

- **Email Capture**: Receives emails via SMTP protocol
- **Local Storage**: Saves emails as `.eml` files in `./emails/` directory
- **S3 Upload**: Optional upload to AWS S3 bucket
- **Session Tracking**: Each email gets unique session ID and timestamp
- **Graceful Shutdown**: Handles SIGTERM/SIGINT signals properly
- **Docker Support**: Containerized deployment

## Technical Details

- Built with Node.js and `smtp-server` package
- Uses AWS SDK v3 for S3 operations
- Supports insecure auth and optional authentication
- Runs on port 25 by default (requires sudo on Unix systems)
- Email files named as `email_{sessionId}_{timestamp}.eml`

## Docker

### Option 1: Using Pre-built Image

```bash
# Pull image from GitHub Container Registry
docker pull ghcr.io/darkpanda08/simple-smtp-server:latest

# Run with local storage
docker run -d \
  --name smtp-server \
  --cap-add=NET_BIND_SERVICE \
  -p 25:25 \
  --memory="512m" \
  -v $(pwd)/emails:/usr/src/app/emails \
  ghcr.io/darkpanda08/simple-smtp-server:latest

# Run with S3 Upload
docker run -d \
  --name smtp-server \
  --cap-add=NET_BIND_SERVICE \
  -p 25:25 \
  --memory="512m" \
  -v $(pwd)/emails:/usr/src/app/emails \
  -e AWS_REGION=your-region \
  -e S3_BUCKET=your-bucket \
  -e AWS_ACCESS_KEY_ID=your-key \
  -e AWS_SECRET_ACCESS_KEY=your-secret \
  ghcr.io/darkpanda08/simple-smtp-server:latest start:s3
```

### Option 2: Building Locally

```bash
# Build image
docker build -t smtp-server .

# Create emails directory if it doesn't exist
mkdir -p emails

# Run with local storage
docker run -d \
  --name smtp-server \
  --cap-add=NET_BIND_SERVICE \
  -p 25:25 \
  --memory="512m" \
  -v $(pwd)/emails:/usr/src/app/emails \
  smtp-server

# Run with S3 Upload
docker run -d \
  --name smtp-server \
  --cap-add=NET_BIND_SERVICE \
  -p 25:25 \
  --memory="512m" \
  -v $(pwd)/emails:/usr/src/app/emails \
  -e AWS_REGION=your-region \
  -e S3_BUCKET=your-bucket \
  -e AWS_ACCESS_KEY_ID=your-key \
  -e AWS_SECRET_ACCESS_KEY=your-secret \
  smtp-server start:s3
```

### Common Docker Commands

```
# Stop container
docker stop smtp-server

# Remove container
docker rm smtp-server

# View logs
docker logs -f smtp-server
```

> Note: The default memory limit is set to 512MB. You can adjust this value using the --memory flag depending on your email volume and server capacity.

Emails are saved to `./emails/` directory or uploaded to S3 if configured.