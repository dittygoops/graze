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
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markerRef = useRef<google.maps.Marker | null>(null)
  const circleRef = useRef<google.maps.Circle | null>(null)

  const updateCircle = (position: google.maps.LatLng | google.maps.LatLngLiteral) => {
    if (!circleRef.current) return
    circleRef.current.setCenter(position)
    circleRef.current.setRadius(radiusMiles * MILES_TO_METERS)
  }

  useEffect(() => {
    const init = async () => {
      if (!mapRef.current) return

      const { Map, Circle } = await importLibrary('maps') as google.maps.MapsLibrary
      const { Marker } = await importLibrary('marker') as google.maps.MarkerLibrary

      const map = new Map(mapRef.current, {
        center: selectedLocation ?? DEFAULT_CENTER,
        zoom: 14,
        clickableIcons: false,
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

      map.addListener('click', (e: google.maps.MapMouseEvent) => {
        if (!e.latLng) return
        const lat = e.latLng.lat()
        const lng = e.latLng.lng()

        if (markerRef.current) {
          markerRef.current.setPosition(e.latLng)
        } else {
          markerRef.current = new Marker({ position: e.latLng, map, title: 'Search here' })
        }

        circleRef.current!.setCenter(e.latLng)
        circleRef.current!.setVisible(true)

        onLocationSelect(lat, lng)
      })

      if (selectedLocation) {
        markerRef.current = new Marker({ position: selectedLocation, map, title: 'Search here' })
        circleRef.current.setCenter(selectedLocation)
        circleRef.current.setVisible(true)
      }
    }

    init()
  }, [])

  // Update circle radius when radiusMiles changes
  useEffect(() => {
    if (!circleRef.current) return
    circleRef.current.setRadius(radiusMiles * MILES_TO_METERS)
  }, [radiusMiles])

  // Clear marker + circle if location is reset
  useEffect(() => {
    if (!mapInstanceRef.current) return
    if (!selectedLocation) {
      markerRef.current?.setMap(null)
      markerRef.current = null
      circleRef.current?.setVisible(false)
      mapInstanceRef.current.panTo(DEFAULT_CENTER)
    } else {
      updateCircle(selectedLocation)
    }
  }, [selectedLocation])

  return (
    <div className="map-container">
      <div ref={mapRef} className="google-map" />
      {!selectedLocation && (
        <div className="map-hint">Click anywhere on the map to set your search location</div>
      )}
    </div>
  )
}
