let hotels = [];
let filteredHotels = [];
let currentPage = 1;
let itemsPerPage = 12;
let currentHotelIndex = 0;
let currentPhotoIndex = 0;
let cities = new Set();
let brokenImageCounter = 0; 

const hotelsGrid = document.getElementById('hotels-grid');
const hotelsTableBody = document.getElementById('hotels-table-body');
const totalHotelsElement = document.getElementById('total-hotels');
const totalCitiesElement = document.getElementById('total-cities');
const avgRatingElement = document.getElementById('avg-rating');
const cityFilterElement = document.getElementById('city-filter');
const ratingFilterElement = document.getElementById('rating-filter');
const sortByElement = document.getElementById('sort-by');
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const prevPageButton = document.getElementById('prev-page');
const nextPageButton = document.getElementById('next-page');
const pageInfoElement = document.getElementById('page-info');
const gridViewButton = document.getElementById('grid-view-btn');
const tableViewButton = document.getElementById('table-view-btn');
const hotelsGridContainer = document.getElementById('hotels-grid');
const hotelsTableContainer = document.getElementById('hotels-table-container');
const importButton = document.getElementById('import-button');
const imageErrorBanner = document.getElementById('image-error-banner');
const dismissBannerButton = document.getElementById('dismiss-banner');

document.addEventListener('DOMContentLoaded', () => {
    fetchHotels();
    setupEventListeners();
});

async function fetchHotels() {
    try {
        const response = await fetch('/api/hotels');
        const data = await response.json();
        hotels = data;
        filteredHotels = [...hotels];
        
        cities = new Set(hotels.map(hotel => {
            const addressParts = hotel.address.split(',');
            return addressParts.length > 1 ? addressParts[addressParts.length - 2].trim() : 'Unknown';
        }));
        
        populateCityFilter();
        updateStats();
        renderHotels();
    } catch (error) {
        console.error('Error fetching hotels:', error);
        showNotification('Failed to fetch hotels', 'error');
    }
}

function setupEventListeners() {
    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') performSearch();
    });
    
    cityFilterElement.addEventListener('change', applyFilters);
    ratingFilterElement.addEventListener('change', applyFilters);
    sortByElement.addEventListener('change', applyFilters);
    
    prevPageButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderHotels();
        }
    });
    
    nextPageButton.addEventListener('click', () => {
        if (currentPage < getTotalPages()) {
            currentPage++;
            renderHotels();
        }
    });
    
    gridViewButton.addEventListener('click', () => {
        gridViewButton.classList.add('active');
        tableViewButton.classList.remove('active');
        hotelsGridContainer.classList.remove('hidden');
        hotelsTableContainer.classList.add('hidden');
    });
    
    tableViewButton.addEventListener('click', () => {
        tableViewButton.classList.add('active');
        gridViewButton.classList.remove('active');
        hotelsTableContainer.classList.remove('hidden');
        hotelsGridContainer.classList.add('hidden');
        renderTable();
    });
    
    setupModalListeners();
    
    importButton.addEventListener('click', showImportModal);
    
    dismissBannerButton.addEventListener('click', () => {
        imageErrorBanner.classList.add('hidden');
    });
}

function handleBrokenImage(img) {
    brokenImageCounter++;
    
    const hotelName = img.alt || 'Hotel';
    img.src = `https://picsum.photos/300/200?random=${Math.floor(Math.random()*1000)}`;
    
    if (brokenImageCounter === 1) {
        imageErrorBanner.classList.remove('hidden');
    }
}

function populateCityFilter() {
    cityFilterElement.innerHTML = '<option value="">All Cities</option>';
    
    const sortedCities = Array.from(cities).sort();
    
    sortedCities.forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        option.textContent = city;
        cityFilterElement.appendChild(option);
    });
}

function updateStats() {
    totalHotelsElement.textContent = hotels.length;
    totalCitiesElement.textContent = cities.size;
    
    const totalRating = hotels.reduce((sum, hotel) => sum + (hotel.rating || 0), 0);
    const avgRating = hotels.length ? (totalRating / hotels.length).toFixed(1) : '0.0';
    avgRatingElement.textContent = avgRating;
}

function applyFilters() {
    const cityFilter = cityFilterElement.value;
    const ratingFilter = parseFloat(ratingFilterElement.value) || 0;
    const sortBy = sortByElement.value;
    const searchQuery = searchInput.value.toLowerCase();
    
    filteredHotels = hotels.filter(hotel => {
        const addressParts = hotel.address.split(',');
        const hotelCity = addressParts.length > 1 ? addressParts[addressParts.length - 2].trim() : '';
        
        const matchesCity = !cityFilter || hotelCity.includes(cityFilter);
        
        const matchesRating = hotel.rating >= ratingFilter;
        
        const matchesSearch = !searchQuery || 
            hotel.name.toLowerCase().includes(searchQuery) || 
            hotel.address.toLowerCase().includes(searchQuery);
        
        return matchesCity && matchesRating && matchesSearch;
    });
    
    if (sortBy === 'name') {
        filteredHotels.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'rating') {
        filteredHotels.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'recent') {
      
    }
    
    currentPage = 1;
    renderHotels();
}

function performSearch() {
    applyFilters();
}

function renderHotels() {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const hotelsToDisplay = filteredHotels.slice(startIndex, endIndex);
  
  hotelsGrid.innerHTML = '';
  
  if (hotelsToDisplay.length === 0) {
    hotelsGrid.innerHTML = `
        <div class="no-results">
            <p>No hotels found matching your criteria.</p>
        </div>
    `;
    return;
  }
  
  hotelsToDisplay.forEach(hotel => {
    const card = document.createElement('div');
    card.className = 'hotel-card';
    
    const defaultImage = 'https://picsum.photos/300/200?random=' + hotel._id;
    const imageUrl = hotel.hotel_photos && hotel.hotel_photos.length > 0 
        ? hotel.hotel_photos[0] 
        : defaultImage;
    
    const stars = generateStarRating(hotel.rating);
    
    card.innerHTML = `
        <div class="hotel-image">
            <img src="${imageUrl}" alt="${hotel.name}" loading="lazy" 
                 onerror="this.onerror=null; handleBrokenImage(this);">
        </div>
        <div class="hotel-info-preview">
            <h3 class="hotel-name">${hotel.name}</h3>
            <div class="hotel-rating">
                <span class="rating-value">${hotel.rating || 'N/A'}</span>
                <div class="stars">${stars}</div>
            </div>
            <p class="hotel-address">${hotel.address}</p>
            <div class="hotel-actions">
                <button class="view-details" data-id="${hotel._id}">View Details</button>
            </div>
        </div>
    `;
    
    hotelsGrid.appendChild(card);
    
    const viewDetailsBtn = card.querySelector('.view-details');
    viewDetailsBtn.addEventListener('click', () => {
        showHotelDetails(hotel);
    });
  });
  
  updatePagination();
  
  if (!hotelsTableContainer.classList.contains('hidden')) {
    renderTable();
  }
}

function renderTable() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const hotelsToDisplay = filteredHotels.slice(startIndex, endIndex);
    
    hotelsTableBody.innerHTML = '';
    
    if (hotelsToDisplay.length === 0) {
        hotelsTableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center;">No hotels found matching your criteria.</td>
            </tr>
        `;
        return;
    }
    
    hotelsToDisplay.forEach(hotel => {
        const row = document.createElement('tr');
        
        const defaultImage = 'https://picsum.photos/60/60?random=' + hotel._id;
        const imageUrl = hotel.hotel_photos && hotel.hotel_photos.length > 0 
            ? hotel.hotel_photos[0] 
            : defaultImage;
        
        row.innerHTML = `
            <td>${hotel.name}</td>
            <td>${hotel.address}</td>
            <td>${hotel.rating || 'N/A'}</td>
            <td><img src="${imageUrl}" alt="${hotel.name}" class="table-photo"></td>
            <td>
                <div class="table-actions">
                    <button class="view-details" data-id="${hotel._id}">View Details</button>
                </div>
            </td>
        `;
        
        hotelsTableBody.appendChild(row);
        
        const viewDetailsBtn = row.querySelector('.view-details');
        viewDetailsBtn.addEventListener('click', () => {
            showHotelDetails(hotel);
        });
    });
    
    updatePagination();
}

function updatePagination() {
    const totalPages = getTotalPages();
    pageInfoElement.textContent = `Page ${currentPage} of ${totalPages}`;
    
    prevPageButton.disabled = currentPage <= 1;
    nextPageButton.disabled = currentPage >= totalPages;
}

function getTotalPages() {
    return Math.ceil(filteredHotels.length / itemsPerPage);
}

function generateStarRating(rating) {
    if (!rating) return '';
    
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    
    let starsHTML = '';
    
    for (let i = 0; i < fullStars; i++) {
        starsHTML += '<i class="fas fa-star star"></i>';
    }
    
    if (halfStar) {
        starsHTML += '<i class="fas fa-star-half-alt star"></i>';
    }
    
    for (let i = 0; i < emptyStars; i++) {
        starsHTML += '<i class="far fa-star star"></i>';
    }
    
    return starsHTML;
}

function setupModalListeners() {
    const hotelModal = document.getElementById('hotel-modal');
    const closeButtons = document.querySelectorAll('.close');
    
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            button.closest('.modal').style.display = 'none';
        });
    });
    
    window.addEventListener('click', function(event) {
        if (event.target === hotelModal) {
            hotelModal.style.display = 'none';
        }
        
        if (event.target === document.getElementById('import-modal')) {
            document.getElementById('import-modal').style.display = 'none';
        }
    });
    
    document.getElementById('prev-photo').addEventListener('click', showPreviousPhoto);
    document.getElementById('next-photo').addEventListener('click', showNextPhoto);
    
    document.querySelector('#import-modal .cancel-button').addEventListener('click', function() {
        document.getElementById('import-modal').style.display = 'none';
    });
    
    document.getElementById('start-import').addEventListener('click', startImport);
}

function showHotelDetails(hotel) {
  currentHotelIndex = filteredHotels.findIndex(h => h._id === hotel._id);
  currentPhotoIndex = 0;
  
  const modal = document.getElementById('hotel-modal');
  const hotelNameElement = document.getElementById('hotel-name');
  const hotelRatingElement = document.getElementById('hotel-rating');
  const hotelStarsElement = document.getElementById('hotel-stars');
  const hotelAddressElement = document.getElementById('hotel-address');
  const hotelPhotosElement = document.getElementById('hotel-photos');
  const hotelReviewsElement = document.getElementById('hotel-reviews');
  
  hotelNameElement.textContent = hotel.name;
  hotelRatingElement.textContent = hotel.rating || 'N/A';
  hotelStarsElement.innerHTML = generateStarRating(hotel.rating);
  hotelAddressElement.textContent = hotel.address;
  
  hotelPhotosElement.innerHTML = '';
  if (hotel.hotel_photos && hotel.hotel_photos.length > 0) {
    const defaultImage = `https://picsum.photos/800/400?random=${hotel._id}`;
    
    hotel.hotel_photos.forEach(photoUrl => {
      const img = document.createElement('img');
      img.src = photoUrl;
      img.alt = hotel.name;
      img.onerror = function() {
        this.onerror = null;
        handleBrokenImage(this);
      };
      hotelPhotosElement.appendChild(img);
    });
    
    updatePhotoIndicator(hotel);
  } else {
    const img = document.createElement('img');
    img.src = 'https://picsum.photos/800/400?blur=2';
    img.alt = 'No photos available';
    hotelPhotosElement.appendChild(img);
    
    document.getElementById('photo-nav').style.display = 'none';
  }
  
  hotelReviewsElement.innerHTML = '';
  if (hotel.reviews && hotel.reviews.length > 0) {
      hotel.reviews.forEach(review => {
          const reviewElement = document.createElement('div');
          reviewElement.className = 'review';
          reviewElement.innerHTML = `
              <div class="review-header">
                  <span class="reviewer">${review.author}</span>
                  <div class="review-rating">
                      ${review.rating} <i class="fas fa-star star"></i>
                  </div>
              </div>
              <p class="review-text">${review.text}</p>
          `;
          hotelReviewsElement.appendChild(reviewElement);
      });
  } else {
      hotelReviewsElement.innerHTML = '<p>No reviews available for this hotel.</p>';
  }
  
  modal.style.display = 'block';
}

function updatePhotoIndicator(hotel) {
    const photoNav = document.getElementById('photo-nav');
    const photoIndicator = document.getElementById('photo-indicator');
    
    if (hotel.hotel_photos && hotel.hotel_photos.length > 0) {
        photoNav.style.display = 'flex';
        photoIndicator.textContent = `${currentPhotoIndex + 1} / ${hotel.hotel_photos.length}`;
        
        const hotelPhotos = document.getElementById('hotel-photos');
        hotelPhotos.style.transform = `translateX(${-currentPhotoIndex * 100}%)`;
        
        document.getElementById('prev-photo').disabled = currentPhotoIndex === 0;
        document.getElementById('next-photo').disabled = currentPhotoIndex === hotel.hotel_photos.length - 1;
    } else {
        photoNav.style.display = 'none';
    }
}

function showPreviousPhoto() {
    const hotel = filteredHotels[currentHotelIndex];
    if (hotel.hotel_photos && currentPhotoIndex > 0) {
        currentPhotoIndex--;
        updatePhotoIndicator(hotel);
    }
}

function showNextPhoto() {
    const hotel = filteredHotels[currentHotelIndex];
    if (hotel.hotel_photos && currentPhotoIndex < hotel.hotel_photos.length - 1) {
        currentPhotoIndex++;
        updatePhotoIndicator(hotel);
    }
}

function showImportModal() {
    const importModal = document.getElementById('import-modal');
    importModal.style.display = 'block';
    
    document.getElementById('import-city').value = '';
    document.getElementById('grid-size').value = '1';
    document.getElementById('grid-distance').value = '5';
    document.getElementById('search-radius').value = '2.5';
    
    document.getElementById('import-status').classList.add('hidden');
    document.getElementById('import-progress').style.width = '0%';
    document.getElementById('import-status-message').textContent = 'Importing...';
}

async function startImport() {
    const cityName = document.getElementById('import-city').value.trim();
    if (!cityName) {
        alert('Please enter a city name');
        return;
    }
    
    const gridSize = document.getElementById('grid-size').value;
    const gridDistance = document.getElementById('grid-distance').value;
    const searchRadius = Math.round(parseFloat(document.getElementById('search-radius').value) * 1000);
    
    document.getElementById('import-status').classList.remove('hidden');
    document.getElementById('import-progress').style.width = '10%';
    document.getElementById('import-status-message').textContent = 'Connecting to server...';
    
    try {
        document.getElementById('import-progress').style.width = '30%';
        document.getElementById('import-status-message').textContent = `Searching for hotels in ${cityName}...`;
        
        const response = await fetch(`/api/import-hotels/${cityName}?grid=${gridSize}&distance=${gridDistance}&radius=${searchRadius}`, {
            method: 'POST'
        });
        
        if (!response.ok) {
            throw new Error('Import failed');
        }
        
        document.getElementById('import-progress').style.width = '80%';
        document.getElementById('import-status-message').textContent = 'Processing hotel data...';
        
        const data = await response.json();
        
        document.getElementById('import-progress').style.width = '100%';
        document.getElementById('import-status-message').textContent = 
            `Successfully imported ${data.new_hotels} new hotels from ${data.location}`;
        
        setTimeout(() => {
            fetchHotels();
            document.getElementById('import-modal').style.display = 'none';
        }, 2000);
        
    } catch (error) {
        console.error('Import error:', error);
        document.getElementById('import-status-message').textContent = `Error: ${error.message}`;
    }
}

function showNotification(message, type = 'info') {
    console.log(`${type.toUpperCase()}: ${message}`);
}