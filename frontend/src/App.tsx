import { useState } from 'react'
import './App.css'
import type { Restaurant } from './types'
import MapPicker from './components/MapPicker'

function App() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [radiusMiles, setRadiusMiles] = useState<number>(0.5)

  const RADIUS_OPTIONS = [0.25, 0.5, 1, 2, 5, 10]
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [excludedTags, setExcludedTags] = useState<Set<string>>(new Set())

  const handleSearch = async () => {
    if (!location) {
      setError('Click on the map to select a location first')
      return
    }

    setLoading(true)
    setError('')
    setExcludedTags(new Set())

    try {
      const radiusMeters = Math.round(radiusMiles * 1609.34)
      const response = await fetch(
        `/api/restaurants?lat=${location.lat}&long=${location.lng}&radius=${radiusMeters}`
      )
      if (!response.ok) throw new Error('Failed to fetch restaurants')
      setRestaurants(await response.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setRestaurants([])
    } finally {
      setLoading(false)
    }
  }

  const handleTagClick = (tag: string) => {
    setExcludedTags(prev => {
      const next = new Set(prev)
      if (next.has(tag)) next.delete(tag)
      else next.add(tag)
      return next
    })
  }

  const filteredRestaurants = restaurants.filter(r => !r.tags.some(tag => excludedTags.has(tag)))

  const handleRestaurantClick = (restaurant: Restaurant) => {
    if (restaurant.place_id) {
      window.open(`https://www.google.com/maps/place/?q=place_id:${restaurant.place_id}`, '_blank', 'noopener,noreferrer')
    } else if (restaurant.lat && restaurant.long) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${restaurant.lat},${restaurant.long}`, '_blank', 'noopener,noreferrer')
    }
  }

  const renderStars = (rating: number) => {
    const full = Math.round(rating)
    return '★'.repeat(full) + '☆'.repeat(5 - full)
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Grazeria</h1>
        <p>Click the map to pick a spot, then search for restaurants nearby</p>
      </header>

      <div className="map-section">
        <MapPicker
          onLocationSelect={(lat, lng) => setLocation({ lat, lng })}
          selectedLocation={location}
          radiusMiles={radiusMiles}
        />

        <div className="search-bar">
          <div className="location-status">
            <div className={`location-dot ${location ? 'active' : ''}`} />
            <span>
              {location
                ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
                : 'Click the map to set a location'}
            </span>
          </div>

          <div className="search-divider" />

          <div className="radius-group">
            {RADIUS_OPTIONS.map(miles => (
              <button
                key={miles}
                className={`radius-option ${radiusMiles === miles ? 'active' : ''}`}
                onClick={() => setRadiusMiles(miles)}
              >
                {miles} mi
              </button>
            ))}
          </div>

          <button className="search-button" onClick={handleSearch} disabled={loading || !location}>
            {loading ? 'Searching…' : 'Search'}
          </button>
        </div>
      </div>

      {excludedTags.size > 0 && (
        <div className="excluded-tags-section">
          <h3>Excluded tags — click to re-include</h3>
          <div className="excluded-tags-container">
            {Array.from(excludedTags).map(tag => (
              <span key={tag} className="tag excluded-tag" onClick={() => handleTagClick(tag)}>
                {tag} ✕
              </span>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="loading-container">
          <div className="loading-spinner" />
          <p className="loading-text">Finding restaurants nearby…</p>
          <div className="loading-dots">
            <span /><span /><span />
          </div>
        </div>
      )}

      {error && (
        <div className="error-container">
          <span className="error-icon">⚠️</span>
          <p className="error-text">{error}</p>
        </div>
      )}

      {!loading && restaurants.length > 0 && (
        <div className="results-section">
          <div className="results-header">
            <h2>{filteredRestaurants.length} {filteredRestaurants.length === 1 ? 'restaurant' : 'restaurants'}</h2>
            {excludedTags.size > 0 && (
              <p className="filter-info">{restaurants.length - filteredRestaurants.length} hidden by filters</p>
            )}
          </div>

          <div className="restaurant-list">
            {filteredRestaurants.map((restaurant, index) => (
              <div key={index} className="restaurant-card" onClick={() => handleRestaurantClick(restaurant)}>
                <h3 className="restaurant-name">{restaurant.name}</h3>

                <div className="restaurant-meta">
                  {restaurant.rating && (
                    <div className="restaurant-rating">
                      <span className="rating-stars">{renderStars(restaurant.rating)}</span>
                      <span>{restaurant.rating.toFixed(1)}</span>
                      {restaurant.total_ratings && (
                        <span className="rating-count">({restaurant.total_ratings.toLocaleString()})</span>
                      )}
                    </div>
                  )}
                </div>

                {restaurant.address && (
                  <div className="restaurant-address">📍 {restaurant.address}</div>
                )}

                <div className="tags-container">
                  {restaurant.tags.map((tag, i) => (
                    <span key={i} className="tag" onClick={e => { e.stopPropagation(); handleTagClick(tag) }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && !error && restaurants.length === 0 && (
        <div className="empty-state">
          <span className="empty-icon">🗺️</span>
          <p>{location ? 'Hit Search to find restaurants nearby' : 'Drop a pin on the map to get started'}</p>
        </div>
      )}
    </div>
  )
}

export default App
