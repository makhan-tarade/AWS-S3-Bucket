const express = require('express')
const bodyParser = require('body-parser')
require('dotenv').config()

const server = express()

// Ensure that S3 Bucket is properly loaded
console.log('S3 BUCKET', process.env.AWS_S3_BUCKET)

// Middleware Plugins
server.use(bodyParser.json())
server.use(express.static('public')) // Just for testing, use a static html

// Routes
server.use('/', [
  require('./routes/fileupload')
])

const port = process.env.PORT || 5000;

// Start the server
server.listen(port, error => {
  if (error) console.error('Error starting', error)
  else console.log(`Started at http://localhost:${port}`)
})