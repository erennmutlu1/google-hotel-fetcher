const axios = require('axios');

const getPhotoUrl = (photoReference) => {
  if (!photoReference || typeof photoReference !== 'string' || photoReference.trim() === '') {
    return null;
  }
  
  return `/api/hotel-photo/${photoReference}`;
};

const getHotelDetails = async (placeId) => {
  try {
    const fields = 'name,rating,formatted_address,photos,reviews';
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${process.env.GOOGLE_API_KEY}`;

    const response = await axios.get(url);
    const data = response.data.result;

    const hotelName = data.name || 'Hotel';
    const defaultImage = `/api/placeholder-image?text=${encodeURIComponent(hotelName)}`;
    let hotelPhotos = [defaultImage];

    if (data.photos && data.photos.length > 0) {
      const googlePhotos = data.photos
        .map(photo => getPhotoUrl(photo.photo_reference))
        .filter(url => url !== null);
      
      if (googlePhotos.length > 0) {
        hotelPhotos = hotelPhotos.concat(googlePhotos);
      }
    }

    return {
      name: data.name,
      address: data.formatted_address,
      rating: data.rating,
      hotel_photos: hotelPhotos,
      reviews: data.reviews ? data.reviews
        .filter(r => r.text && r.text.trim() !== '')
        .map(r => ({
          author: r.author_name || 'Anonymous',
          text: r.text,
          rating: r.rating || 0
        }))
      : []
    };
  } catch (error) {
    console.error(`Error fetching hotel details for place_id ${placeId}:`, error);
    return {
      name: "Hotel Information Unavailable",
      address: "Address unavailable",
      rating: 0,
      hotel_photos: [`/api/placeholder-image?text=Error+Loading+Hotel`],
      reviews: []
    };
  }
};


const searchHotelsByLocation = async (location, radius = 5000, maxResults = Number.MAX_SAFE_INTEGER) => {
  try {
    let allHotels = [];
    let nextPageToken = null;
    let pageCount = 0;
    
    do {
      let url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.lat},${location.lng}&radius=${radius}&type=lodging&key=${process.env.GOOGLE_API_KEY}`;
      if (nextPageToken) {
        url += `&pagetoken=${nextPageToken}`;
      }
      
      console.log(`Fetching hotels page ${pageCount+1}...`);
      const response = await axios.get(url);
      const results = response.data.results || [];
      
      allHotels = [...allHotels, ...results];
      nextPageToken = response.data.next_page_token;
      pageCount++;
      
      if (nextPageToken) {
        console.log('Next page token found, waiting before next request...');
        await new Promise(resolve => setTimeout(resolve, 2000));      }
      
      if (allHotels.length >= maxResults) {
        console.log(`Reached maximum results limit: ${allHotels.length} hotels`);
        break;
      }
    } while (nextPageToken); 
    
    if (allHotels.length > maxResults) {
      allHotels = allHotels.slice(0, maxResults);
    }
    
    console.log(`Total hotels found: ${allHotels.length} (from ${pageCount} pages)`);
    
    return allHotels.map(hotel => ({
      name: hotel.name,
      place_id: hotel.place_id,
      address: hotel.vicinity,
      location: hotel.geometry.location,
      rating: hotel.rating
    }));
  } catch (error) {
    console.error('Error fetching hotels:', error);
    throw new Error('Failed to fetch hotels by location');
  }
};

const geocodeCity = async (cityName) => {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(cityName)}&key=${process.env.GOOGLE_API_KEY}`;
    
    console.log('Geocoding URL (key hidden):', url.replace(process.env.GOOGLE_API_KEY, 'API_KEY_HIDDEN'));
    
    const response = await axios.get(url);
    
    console.log('Geocoding API Response Status:', response.data.status);
    if (response.data.error_message) {
      console.log('API Error Message:', response.data.error_message);
    }
    
    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const location = response.data.results[0].geometry.location;
      return {
        lat: location.lat,
        lng: location.lng
      };
    } else {
      throw new Error(`Geocoding failed for city: ${cityName}, Status: ${response.data.status}`);
    }
  } catch (error) {
    console.error('Error geocoding city:', error);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw new Error(`Failed to geocode city: ${error.message}`);
  }
};


const createCoordinateGrid = (centerLocation, gridSize = 2, distanceKm = 5) => {
  const R = 6371;
  const grid = [];
  
  const lat = centerLocation.lat * Math.PI / 180;
  const lng = centerLocation.lng * Math.PI / 180;
  
  for (let i = -gridSize; i <= gridSize; i++) {
    for (let j = -gridSize; j <= gridSize; j++) {
      if (i === 0 && j === 0) continue;
      

      const newLat = centerLocation.lat + (i * distanceKm / R) * (180 / Math.PI);
      
      const newLng = centerLocation.lng + (j * distanceKm / R) * (180 / Math.PI) / Math.cos(lat);
      
      grid.push({ lat: newLat, lng: newLng });
    }
  }
  
  return grid;
};

const testGoogleAPI = async () => {
  try {
    const testUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=London&key=${process.env.GOOGLE_API_KEY}`;
    console.log('Testing Google API...');
    const response = await axios.get(testUrl);
    console.log('API Test Response Status:', response.status);
    console.log('API Response Data Status:', response.data.status);
    return {
      success: response.data.status === 'OK',
      message: response.data.status,
      data: response.data
    };
  } catch (error) {
    console.error('API Test Error:', error.message);
    return {
      success: false,
      message: error.message,
      error: error.response ? error.response.data : null
    };
  }
};

module.exports = { 
  getHotelDetails, 
  searchHotelsByLocation, 
  geocodeCity,
  testGoogleAPI,
  createCoordinateGrid,
  getPhotoUrl, 
};