const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const multerS3 = require('multer-s3');

// Replace these with your AWS credentials and S3 bucket information
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const AWS_DEFAULT_REGION = process.env.AWS_DEFAULT_REGION;
const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET;

// Configure the S3 client
const s3Client = new S3Client({
  region: AWS_DEFAULT_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

// Multer configuration
const storage = multerS3({
  s3: s3Client,
  bucket: AWS_S3_BUCKET,
  contentType: multerS3.AUTO_CONTENT_TYPE,
  key: (req, file, cb) => {
    const uniqueFilename = Date.now() + '-' + uuidv4();
    cb(null, 'files_from_node/' + uniqueFilename + '-' + file.originalname);
  },
});

const upload = multer({ storage });

// Example middleware for handling file uploads
const singleUpload = (req, res, next) => {
  upload.single('file')(req, res, (error) => {
    if (error) {
      return res.status(400).json({ error: error.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file was uploaded.' });
    }

    // Extract fileId from the S3 key
    const fileId = extractFileIdFromKey(req.file.key);

    // Add fileId to the response
    req.file.fileId = fileId;

    next();
  });
};

// Helper function to extract fileId from S3 key
function extractFileIdFromKey(key) {
  const parts = key.split('-');
  const fileId = parts.slice(-1)[0];
  return fileId;
}

module.exports = {
  singleUpload,
};
