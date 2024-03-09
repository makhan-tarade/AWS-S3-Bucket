const express = require('express');
const router = express.Router();
const { singleUpload } = require('../multer-s3-fileupload/s3UploadClient');
const { S3Client, DeleteObjectCommand, HeadObjectCommand, GetObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');

const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const AWS_DEFAULT_REGION = process.env.AWS_DEFAULT_REGION;
const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET;

const s3Client = new S3Client({
  region: AWS_DEFAULT_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

// Upload a file
router.post('/upload', (req, res) => {
  singleUpload(req, res, (error) => {
    if (error) {
      return res.status(400).json({ error: error.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file was uploaded.' });
    }

    // Access the uploaded file details via req.file
    const uploadedFile = req.file;

    res.status(201).json({
      message: 'Successfully uploaded file!',
      file: uploadedFile,
    });
  });
});

// Update a file
router.put('/:fileId', singleUpload, async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file was uploaded.' });
  }

  // Perform the necessary logic to update the file in your storage
  // (e.g., update the file in S3, update file details in your database)

  try {
    // Find the existing file record in your database using fileId
    const fileId = req.params.fileId;
    // Assuming you have a model named `FileModel`
    const existingFile = await FileModel.findOne({ fileId });

    if (!existingFile) {
      return res.status(404).json({ error: 'File not found.' });
    }

    // Update file details in your database
    existingFile.originalname = req.file.originalname;
    existingFile.mimetype = req.file.mimetype;
    existingFile.size = req.file.size;

    // Save the updated file record
    await existingFile.save();

    res.status(200).json({
      message: 'File updated successfully!',
      updatedFile: existingFile,
    });
  } catch (error) {
    console.error('Error updating file:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Delete a file
router.delete('/:fileId', async (req, res) => {
  const fileId = req.params.fileId;

  // Perform the necessary logic to delete the file from your storage
  // (e.g., delete the file from S3, update file details in your database)

  const params = {
    Bucket: AWS_S3_BUCKET,
    Key: 'files_from_node/' + fileId, // Adjust the key based on your file naming convention
  };

  try {
    await s3Client.send(new DeleteObjectCommand(params));
    res.status(200).json({ message: 'File deleted successfully!' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Fetch a file by fileId
router.get('/:fileId', async (req, res) => {
  const fileId = req.params.fileId;

  // Perform the necessary logic to fetch the file from your storage
  // (e.g., retrieve the file from S3, fetch file details from your database)

  const params = {
    Bucket: AWS_S3_BUCKET,
    Key: 'files_from_node/' + fileId, // Adjust the key based on your file naming convention
  };

  try {
    // Check if the file exists in S3
    const headObjectParams = {
      Bucket: AWS_S3_BUCKET,
      Key: 'files_from_node/' + fileId,
    };

    await s3Client.send(new HeadObjectCommand(headObjectParams));

    // Fetch the file from S3
    const fileStream = await s3Client.send(new GetObjectCommand(params));

    // Set appropriate headers for the response
    res.setHeader('Content-Length', fileStream.ContentLength);
    res.setHeader('Content-Type', fileStream.ContentType);

    // Pipe the file stream to the response
    fileStream.Body.pipe(res);
  } catch (error) {
    console.error('Error fetching file:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Fetch all files
router.get('/all', async (req, res) => {
  try {
    // Perform the necessary logic to fetch all files from your storage
    // (e.g., list all files from S3, fetch file details from your database)

    const params = {
      Bucket: AWS_S3_BUCKET,
      Prefix: 'files_from_node/', // Adjust the prefix based on your file naming convention
    };

    // List all objects in the S3 bucket with the specified prefix
    const data = await s3Client.send(new ListObjectsV2Command(params));

    // Extract file keys from the S3 response
    const fileKeys = data.Contents.map((obj) => obj.Key);

    // You can now use fileKeys to fetch additional details from your database if needed

    // Check if there are no files
    if (fileKeys.length === 0) {
      return res.status(404).json({ error: 'No files found.' });
    }

    // Return the list of file keys
    res.status(200).json({
      message: 'Files fetched successfully!',
      files: fileKeys,
    });
  } catch (error) {
    console.error('Error fetching files:', error);

    // Log additional details about the error
    console.error('Error metadata:', error.$metadata);

    res.status(500).json({ error: 'Internal Server Error' });
  }
});


module.exports = router;
