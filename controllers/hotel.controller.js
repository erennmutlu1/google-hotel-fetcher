const Hotel = require('../models/hotel.model');
const { 
  getHotelDetails, 
  searchHotelsByLocation, 
  geocodeCity, 
  testGoogleAPI,
  createCoordinateGrid 
} = require('../utils/hotelAPI');
const axios = require('axios');

const testAPI = async (req, res) => {
  try {
    console.log('testAPI function');

    
    const result = await testGoogleAPI();
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      error: 'API Test failed', 
      message: error.message 
    });
  }
};

const importHotels = async (req, res) => {
  try {
    let centerLocation;
    
    const gridSize = parseInt(req.query.grid) || 1;     // Default: 1 (creates a 3×3 grid)
    const gridDistance = parseInt(req.query.distance) || 5;  // Default: 5km between points
    const searchRadius = parseInt(req.query.radius) || 2500; // Default: 2.5km radius per point
    
    console.log(`Grid search configuration: size=${gridSize} (${2*gridSize+1}×${2*gridSize+1} grid), distance=${gridDistance}km, radius=${searchRadius/1000}km`);
    
    if (req.params.city) {
      centerLocation = await geocodeCity(req.params.city);
    } else {
      const lat = parseFloat(req.query.lat) || 40.7128;
      const lng = parseFloat(req.query.lng) || -74.0060;
      centerLocation = { lat, lng };
    }
    
    const searchPoints = [centerLocation, ...createCoordinateGrid(centerLocation, gridSize, gridDistance)];
    
    let allHotels = [];
    const seenPlaceIds = new Set();
    
    for (let i = 0; i < searchPoints.length; i++) {
      const point = searchPoints[i];
      
      try {
        const hotels = await searchHotelsByLocation(point, searchRadius, 60); // Max 60 per point
        
        for (const hotel of hotels) {
          if (!seenPlaceIds.has(hotel.place_id)) {
            seenPlaceIds.add(hotel.place_id);
            allHotels.push(hotel);
          }
        }
        
        console.log(`Found ${hotels.length} hotels at this point, ${allHotels.length} unique hotels in total`);
      } catch (error) {
        console.error(`Error searching point ${i+1}:`, error);
      }
      
      if (i < searchPoints.length - 1) {
        console.log('Waiting before next search point...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log(`\nFound a total of ${allHotels.length} unique hotels`);
    
    const savedHotels = [];
    
    for (const hotel of allHotels) {
      try {
        const existingHotel = await Hotel.findOne({ place_id: hotel.place_id });
        
        if (!existingHotel) {
          const hotelDetails = await getHotelDetails(hotel.place_id);
          
          const newHotel = new Hotel({
            name: hotelDetails.name,
            place_id: hotel.place_id,
            address: hotelDetails.address,
            location: hotel.location,
            rating: hotelDetails.rating,
            hotel_photos: hotelDetails.hotel_photos,
            reviews: hotelDetails.reviews
          });
          
          const savedHotel = await newHotel.save();
          savedHotels.push(savedHotel);
        }
      } catch (error) {
        console.error(`Error processing hotel ${hotel.name}:`, error);
      }
    }
    
    res.json({
      message: `Successfully imported ${savedHotels.length} new hotels`,
      location: req.params.city || `coordinates (${centerLocation.lat}, ${centerLocation.lng})`,
      total_hotels: allHotels.length,
      new_hotels: savedHotels.length,
      grid_points: searchPoints.length
    });
    
  } catch (error) {
    console.error('Import hotels error:', error.message);
    res.status(500).json({ error: 'Failed to import hotels' });
  }
};

const getHotels = async (req, res) => {
  try {
    const hotels = await Hotel.find().sort({ createdAt: -1 });
    res.json(hotels);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Failed to fetch hotels.' });
  }
};

module.exports = {
  importHotels,
  getHotels,
  testAPI  
};
