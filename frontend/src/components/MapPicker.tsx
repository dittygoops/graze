import { useEffect, useRef } from 'react'
import { setOptions, importLibrary } from '@googlemaps/js-api-loader'

interface Props {
  onLocationSelect: (lat: number, lng: number) => void
  selectedLocation: { lat: number; lng: number } | null
  radiusMiles: number
}

const DEFAULT_CENTER = { lat: 33.4140, lng: -111.9301 }
const MILES_TO_METERS = 1609.34

setOptions({ key: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string })

export default function MapPicker({ onLocationSelect, selectedLocation, radiusMiles }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null)
  const circleRef = useRef<google.maps.Circle | null>(null)

  const placeMarker = (pos: { lat: number; lng: number }) => {
    if (markerRef.current) {
      markerRef.current.position = pos
    } else {
      markerRef.current = new google.maps.marker.AdvancedMarkerElement({
        position: pos,
        map: mapInstanceRef.current!,
        title: 'Search here',
      })
    }
    circleRef.current!.setCenter(pos)
    circleRef.current!.setVisible(true)
    onLocationSelect(pos.lat, pos.lng)
  }

  useEffect(() => {
    const init = async () => {
      if (!mapRef.current || !searchInputRef.current) return

      const { Map, Circle } = await importLibrary('maps') as google.maps.MapsLibrary
      await importLibrary('marker')
      const { Autocomplete } = await importLibrary('places') as google.maps.PlacesLibrary

      const map = new Map(mapRef.current, {
        center: selectedLocation ?? DEFAULT_CENTER,
        zoom: 14,
        mapId: 'DEMO_MAP_ID',
        clickableIcons: false,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      })

      mapInstanceRef.current = map

      circleRef.current = new Circle({
        map,
        radius: radiusMiles * MILES_TO_METERS,
        fillColor: '#5b5ef4',
        fillOpacity: 0.12,
        strokeColor: '#5b5ef4',
        strokeOpacity: 0.5,
        strokeWeight: 1.5,
        visible: false,
      })

      // Places search autocomplete
      const autocomplete = new Autocomplete(searchInputRef.current!, { fields: ['geometry'] })
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace()
        if (!place.geometry?.location) return
        const pos = { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() }
        map.panTo(pos)
        map.setZoom(15)
        placeMarker(pos)
      })

      // Click to place marker
      map.addListener('click', (e: google.maps.MapMouseEvent) => {
        if (!e.latLng) return
        placeMarker({ lat: e.latLng.lat(), lng: e.latLng.lng() })
      })

      // Geolocation on load
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          ({ coords }) => {
            const pos = { lat: coords.latitude, lng: coords.longitude }
            map.panTo(pos)
            placeMarker(pos)
          },
          () => { /* permission denied — stay on default center */ }
        )
      }

      if (selectedLocation) {
        placeMarker(selectedLocation)
      }
    }

    init()
  }, [])

  // Update circle radius when radiusMiles changes
  useEffect(() => {
    if (!circleRef.current) return
    circleRef.current.setRadius(radiusMiles * MILES_TO_METERS)
  }, [radiusMiles])

  // Clear marker + circle if location is reset externally
  useEffect(() => {
    if (!mapInstanceRef.current) return
    if (!selectedLocation) {
      if (markerRef.current) markerRef.current.map = null
      markerRef.current = null
      circleRef.current?.setVisible(false)
      mapInstanceRef.current.panTo(DEFAULT_CENTER)
    }
  }, [selectedLocation])

  return (
    <div className="map-container">
      <input
        ref={searchInputRef}
        type="text"
        className="map-search-input"
        placeholder="Search for a place…"
      />
      <div ref={mapRef} className="google-map" />
      {!selectedLocation && (
        <div className="map-hint">Click the map or search to set your location</div>
      )}
    </div>
  )
}
