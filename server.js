const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');
const axios = require('axios');

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.send('Global Hotel Fetcher API is running');
});

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${mongoose.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

connectDB();

const hotelController = require('./controllers/hotel.controller');

app.get('/api/hotel-photo/:photoRef', async (req, res) => {
  try {
    const photoRef = req.params.photoRef;
    if (!photoRef) {
      return res.status(400).send('Photo reference is required');
    }
    
    const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoRef}&key=${process.env.GOOGLE_API_KEY}`;
    
    const response = await axios({
      method: 'get',
      url: url,
      responseType: 'stream'
    });
    
    res.set('Content-Type', response.headers['content-type']);
    
    response.data.pipe(res);
  } catch (error) {
    console.error('Error proxying photo:', error);
    
    const hotelName = 'Image Unavailable';
    res.redirect(`/api/placeholder-image?text=${encodeURIComponent(hotelName)}`);
  }
});

app.get('/api/placeholder-image', (req, res) => {
  const text = req.query.text || 'Hotel';
  const width = req.query.width || 800;
  const height = req.query.height || 600;
  const bgColor = req.query.bg || '2c3e50';
  const textColor = req.query.text_color || 'ffffff';
  
  const placeholderUrl = `https://via.placeholder.com/${width}x${height}/${bgColor}/${textColor}?text=${encodeURIComponent(text)}`;
  res.redirect(placeholderUrl);
});

app.get('/api/test-api', hotelController.testAPI);
app.get('/api/hotels', hotelController.getHotels);
app.post('/api/import-hotels', hotelController.importHotels);
app.post('/api/import-hotels/:city', hotelController.importHotels);

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Server error',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message
  });
});

app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found', 
    message: `Route ${req.method} ${req.url} not found` 
  });
});

const PORT = process.env.PORT || 7890;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log(`- GET http://localhost:${PORT}/api/test-api`);
  console.log(`- POST http://localhost:${PORT}/api/import-hotels/:city`);
  console.log(`- GET http://localhost:${PORT}/api/hotels`);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
