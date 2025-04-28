# 🏨 Global Hotel Fetcher

![Global Hotel Fetcher](https://img.shields.io/badge/Status-Active-brightgreen)
![Version](https://img.shields.io/badge/Version-1.0.0-blue)
![License](https://img.shields.io/badge/License-MIT-green)

A powerful application that fetches hotel data globally using the Google Places API, providing detailed information including ratings, photos, reviews, and more.


## ✨ Features

- **Global Hotel Search**: Search for hotels in any city worldwide
- **Grid-Based Search**: Advanced algorithm that expands search areas using coordinate grids
- **Detailed Information**: Access ratings, reviews, photos, and addresses
- **Filtering & Sorting**: Filter by city, rating, and sort by various criteria
- **MongoDB Storage**: Persistent storage of all hotel data
- **Image Handling**: Robust handling of hotel photos with fallbacks
- **Import Wizard**: Easy-to-use interface for importing new hotel data

## 🛠 Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **APIs**: Google Places API, Google Geocoding API
- **Deployment**: Ready for local or cloud deployment

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4 or higher)
- Google API Key with Places API enabled

## 🚀 Getting Started

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/erennmutlu1/google-hotel-fetcher.git
   cd global-hotel-fetcher
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/global-hotel-fetcher?retryWrites=true&w=majority&connectTimeoutMS=30000&socketTimeoutMS=45000
   GOOGLE_API_KEY=your_google_api_key_here
   ```

4. Start the server:
   ```bash
   npm run dev
   ```

5. Access the application:
   ```
   http://localhost:5000
   ```

## 📱 Usage

### Web Interface

1. **Import Hotels**:
   - Click the "Import Hotels" button in the top-right corner
   - Enter a city name (e.g., Istanbul, New York, Paris)
   - Adjust advanced options (optional)
   - Click "Start Import"

2. **Browse Hotels**:
   - Use the filters to refine results
   - Switch between grid and list views
   - Click "View Details" to see comprehensive information

3. **Search**:
   - Use the search box to find specific hotels by name or address

### API Endpoints

| Endpoint | Method | Description | Parameters |
|----------|--------|-------------|------------|
| `/api/test-api` | GET | Test Google API connection | None |
| `/api/import-hotels/:city` | POST | Import hotels from a city | `grid`, `distance`, `radius` |
| `/api/hotels` | GET | Get all saved hotels | None |

## 📮 Postman Collection

You can use the following Postman collection to test the API endpoints:

### Setup

1. Download [Postman](https://www.postman.com/downloads/)
2. Import the collection:

```json
{
  "info": {
    "_postman_id": "75e3f9c0-5ae1-4a4e-bd5b-67a8f32c0742",
    "name": "Global Hotel Fetcher API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Test API",
      "request": {
        "method": "GET",
        "url": {
          "raw": "http://localhost:5000/api/test-api",
          "protocol": "http",
          "host": ["localhost"],
          "port": "5000",
          "path": ["api", "test-api"]
        }
      }
    },
    {
      "name": "Get All Hotels",
      "request": {
        "method": "GET",
        "url": {
          "raw": "http://localhost:5000/api/hotels",
          "protocol": "http",
          "host": ["localhost"],
          "port": "5000",
          "path": ["api", "hotels"]
        }
      }
    },
    {
      "name": "Import Hotels by City",
      "request": {
        "method": "POST",
        "url": {
          "raw": "http://localhost:5000/api/import-hotels/paris?grid=1&distance=5&radius=2500",
          "protocol": "http",
          "host": ["localhost"],
          "port": "5000",
          "path": ["api", "import-hotels", "paris"],
          "query": [
            {
              "key": "grid",
              "value": "1"
            },
            {
              "key": "distance",
              "value": "5"
            },
            {
              "key": "radius",
              "value": "2500"
            }
          ]
        }
      }
    }
  ]
}
```

## 📁 Project Structure

```
global-hotel-fetcher/
├── config/
│   └── db.js                # Database connection
├── controllers/
│   └── hotel.controller.js  # API controllers
├── models/
│   └── hotel.model.js       # Mongoose schemas
├── public/                  # Frontend static files
│   ├── index.html           # Main HTML file
│   ├── styles.css           # CSS styles
│   └── app.js               # Frontend JavaScript
├── routes/
│   └── hotel.routes.js      # API routes
├── utils/
│   └── hotelAPI.js          # Google API helpers
├── .env                     # Environment variables
├── package.json             # Dependencies
├── server.js                # Express server
└── README.md                # This file
```

## 🔍 Advanced Features

### Grid-Based Hotel Search

The application uses a sophisticated algorithm that creates a grid of coordinates around a city center to perform multiple searches, effectively overcoming Google Places API limitations and finding more hotels than would be possible with a single search.

```js
// Example with a 5×5 grid, 3km spacing, and 2.5km radius per point
POST /api/import-hotels/istanbul?grid=2&distance=3&radius=2500
```

### Placeholder Image System

The app includes a robust image handling system that gracefully degrades when hotel photos aren't available or can't be loaded, ensuring your UI always looks professional.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License.
