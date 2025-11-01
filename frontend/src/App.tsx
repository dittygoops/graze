import { useState } from 'react'
import './App.css'
import type { Restaurant } from './types'

function App() {
  const [latitude, setLatitude] = useState<string>('33.4140')
  const [longitude, setLongitude] = useState<string>('-111.9301')
  const [radius, setRadius] = useState<string>('1000')
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [excludedTags, setExcludedTags] = useState<Set<string>>(new Set())

  const handleSearch = async () => {
    setLoading(true)
    setError('')
    setExcludedTags(new Set())
    
    try {
      const response = await fetch(
        `http://localhost:5001/api/restaurants?lat=${latitude}&long=${longitude}&radius=${radius}`
      )
      
      if (!response.ok) {
        throw new Error('Failed to fetch restaurants')
      }
      
      const data = await response.json()
      setRestaurants(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setRestaurants([])
    } finally {
      setLoading(false)
    }
  }

  const handleTagClick = (tag: string) => {
    setExcludedTags(prev => {
      const newSet = new Set(prev)
      if (newSet.has(tag)) {
        newSet.delete(tag)
      } else {
        newSet.add(tag)
      }
      return newSet
    })
  }

  const filteredRestaurants = restaurants.filter(restaurant => {
    return !restaurant.tags.some(tag => excludedTags.has(tag))
  })

  const handleRestaurantClick = (restaurant: Restaurant) => {
    // Open Google Maps with the restaurant's place_id
    if (restaurant.place_id) {
      const url = `https://www.google.com/maps/place/?q=place_id:${restaurant.place_id}`
      window.open(url, '_blank', 'noopener,noreferrer')
    } else if (restaurant.lat && restaurant.long) {
      // Fallback to coordinates if place_id is not available
      const url = `https://www.google.com/maps/search/?api=1&query=${restaurant.lat},${restaurant.long}`
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>🍽️ Restaurant Finder</h1>
        <p>Discover restaurants and filter by tags</p>
      </header>

      {/* Map Placeholder Section */}
      <div className="map-section">
        <div className="map-placeholder">
          <span className="map-icon">🗺️</span>
          <p>Map View (Coming Soon)</p>
        </div>
        
        <div className="search-controls">
          <div className="input-group">
            <label htmlFor="latitude">Latitude</label>
            <input
              id="latitude"
              type="number"
              step="any"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              placeholder="37.7749"
              autoComplete="off"
              data-form-type="other"
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="longitude">Longitude</label>
            <input
              id="longitude"
              type="number"
              step="any"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              placeholder="-122.4194"
              autoComplete="off"
              data-form-type="other"
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="radius">Radius (meters)</label>
            <input
              id="radius"
              type="number"
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              placeholder="1000"
              autoComplete="off"
              data-form-type="other"
            />
          </div>
          
          <button 
            className="search-button" 
            onClick={handleSearch}
            disabled={loading}
          >
            {loading ? 'Searching...' : '🔍 Search'}
          </button>
        </div>
      </div>

      {/* Excluded Tags Section */}
      {excludedTags.size > 0 && (
        <div className="excluded-tags-section">
          <h3>🚫 Excluded Tags (Click to re-include)</h3>
          <div className="excluded-tags-container">
            {Array.from(excludedTags).map(tag => (
              <span
                key={tag}
                className="tag excluded-tag"
                onClick={() => handleTagClick(tag)}
              >
                {tag} ✕
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Finding delicious restaurants...</p>
          <div className="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="error-container">
          <span className="error-icon">⚠️</span>
          <p className="error-text">{error}</p>
        </div>
      )}

      {/* Results Section */}
      {!loading && restaurants.length > 0 && (
        <div className="results-section">
          <div className="results-header">
            <h2>Found {filteredRestaurants.length} {filteredRestaurants.length === 1 ? 'Restaurant' : 'Restaurants'}</h2>
            {excludedTags.size > 0 && (
              <p className="filter-info">
                ({restaurants.length - filteredRestaurants.length} hidden by filters)
              </p>
            )}
          </div>

          <div className="restaurant-list">
            {filteredRestaurants.map((restaurant, index) => (
              <div 
                key={index} 
                className="restaurant-card"
                onClick={() => handleRestaurantClick(restaurant)}
              >
                <h3 className="restaurant-name">{restaurant.name}</h3>
                
                {restaurant.rating && (
                  <div className="restaurant-rating">
                    ⭐ {restaurant.rating.toFixed(1)}
                    {restaurant.total_ratings && (
                      <span className="rating-count"> ({restaurant.total_ratings} reviews)</span>
                    )}
                  </div>
                )}
                
                {restaurant.address && (
                  <div className="restaurant-address">
                    📍 {restaurant.address}
                  </div>
                )}
                
                <div className="tags-container">
                  {restaurant.tags.map((tag, tagIndex) => (
                    <span
                      key={tagIndex}
                      className="tag"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleTagClick(tag)
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && restaurants.length === 0 && (
        <div className="empty-state">
          <span className="empty-icon">🔍</span>
          <p>Enter coordinates and click Search to find restaurants</p>
        </div>
      )}
    </div>
  )
}

export default App
