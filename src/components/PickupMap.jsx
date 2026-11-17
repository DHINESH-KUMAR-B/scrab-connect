import { useEffect, useMemo, useState } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import 'leaflet/dist/leaflet.css'

const CHENNAI = [13.0475, 80.209]

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow
})

function MapClick({ onSelect }) {
  useMapEvents({
    click(event) {
      onSelect([event.latlng.lat, event.latlng.lng])
    }
  })
  return null
}

function Recenter({ location }) {
  const map = useMap()
  useEffect(() => {
    if (location) map.flyTo(location, Math.max(map.getZoom(), 15), { duration: 0.5 })
  }, [location, map])
  return null
}

function FitStops({ stops }) {
  const map = useMap()
  useEffect(() => {
    if (stops.length > 1) {
      map.fitBounds(stops.map(stop => [stop.lat, stop.lng]), { padding: [32, 32], maxZoom: 14 })
    } else if (stops.length === 1) {
      map.setView([stops[0].lat, stops[0].lng], 14)
    }
  }, [map, stops])
  return null
}

export function MapPicker({ location, onSelect }) {
  const [satellite, setSatellite] = useState(false)
  return (
    <div className="space-y-2">
      <button type="button" className="rounded-lg border border-white/15 px-3 py-1.5 text-sm hover:bg-white/10" aria-pressed={satellite} onClick={() => setSatellite(value => !value)}>{satellite ? 'Switch to street map' : 'Switch to satellite'}</button>
      <MapContainer center={location || CHENNAI} zoom={12} scrollWheelZoom className="h-72 w-full rounded-xl">
        <TileLayer key={satellite ? 'satellite' : 'street'}
          attribution={satellite
            ? 'Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community'
            : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}
          url={satellite
            ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
            : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'}
        />
        <MapClick onSelect={onSelect} />
        <Recenter location={location} />
        {location && <Marker position={location}><Popup>Pickup location</Popup></Marker>}
      </MapContainer>
      {location
        ? <p className="text-xs opacity-70">Pickup pin: {location[0].toFixed(5)}, {location[1].toFixed(5)}</p>
        : <p className="text-xs opacity-70">Click the map to pin your pickup location.</p>}
    </div>
  )
}

export function PickupMap({ pickups, route = false, onSelect }) {
  const [satellite, setSatellite] = useState(false)
  const stops = useMemo(
    () => pickups.filter(pickup => Number.isFinite(pickup.lat) && Number.isFinite(pickup.lng)),
    [pickups]
  )
  const line = useMemo(() => route ? stops.map(pickup => [pickup.lat, pickup.lng]) : [], [route, stops])

  return (
    <div className="space-y-2">
      <button type="button" className="rounded-lg border border-white/15 px-3 py-1.5 text-sm hover:bg-white/10" aria-pressed={satellite} onClick={() => setSatellite(value => !value)}>{satellite ? 'Switch to street map' : 'Switch to satellite'}</button>
      <MapContainer center={CHENNAI} zoom={12} scrollWheelZoom className="h-80 w-full rounded-xl">
        <TileLayer key={satellite ? 'satellite' : 'street'}
          attribution={satellite
            ? 'Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community'
            : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}
          url={satellite
            ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
            : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'}
        />
        <FitStops stops={stops} />
        {line.length > 1 && <Polyline positions={line} pathOptions={{ color: '#16a34a', weight: 4, opacity: 0.8 }} />}
        {stops.map((pickup, index) => (
          <Marker
            key={pickup.id}
            position={[pickup.lat, pickup.lng]}
            eventHandlers={{ click: () => onSelect?.(pickup) }}
          >
            <Popup>
              <strong>Stop {index + 1}: {pickup.scrapType}</strong>
              <br />{pickup.weight} kg · {pickup.status}
              <br />{pickup.address || pickup.area}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
