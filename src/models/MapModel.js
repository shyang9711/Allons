import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';
import '../css/MapModel.css'; // Import the new CSS file

// Fix default marker icon import issue
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [24, 36],
  iconAnchor: [12, 36],
});

L.Marker.prototype.options.icon = DefaultIcon;

// RecenterAutomatically component
function RecenterAutomatically({ position }) {
  const map = useMap();
  useEffect(() => {
    map.setView(position);
  }, [position, map]);
  return null;
}

const MapModel = ({ isDraggable = true }) => {
    const [position, setPosition] = useState([37.77, -122.41]); // Default to San Francisco
    const [locationError, setLocationError] = useState(null);
    const [isDragged, setIsDragged] = useState(false);
    const [address, setAddress] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setPosition([position.coords.latitude, position.coords.longitude]);
            },
            (error) => {
                console.error("Error getting location:", error);
                // Fallback to IP-based location
                axios.get('https://ipapi.co/json/')
                    .then((response) => {
                        setPosition([response.data.latitude, response.data.longitude]);
                    })
                    .catch((error) => {
                        console.error("Error getting IP-based location:", error);
                        setLocationError("Unable to retrieve location. Using default.");
                    });
            }
        );
    }, []);

    useEffect(() => {
        // Fetch address whenever position changes
        const fetchAddress = async () => {
            try {
                const response = await axios.get(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position[0]}&lon=${position[1]}`
                );
                const addressParts = response.data.address;
                let shortAddress  = [
                  addressParts.house_number && addressParts.house_number,
                  addressParts.road && addressParts.road,
                  addressParts.suburb && addressParts.suburb,
                  addressParts.city && addressParts.city,
                  addressParts.state && addressParts.state,
                  // addressParts.country && addressParts.country
              ].filter(Boolean).join(', ');
                setAddress(shortAddress);
            } catch (error) {
                console.error("Error fetching address:", error);
                setAddress('Unable to fetch address');
            }
        };

        fetchAddress();
    }, [position]);

    const handleSearch = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.get(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
            );
            if (response.data && response.data.length > 0) {
                const { lat, lon } = response.data[0];
                setPosition([parseFloat(lat), parseFloat(lon)]);
                setIsDragged(true);
            } else {
                alert('Location not found. Please try a different search term.');
            }
        } catch (error) {
            console.error("Error searching for location:", error);
            alert('An error occurred while searching for the location.');
        }
    };

    return (
      <div className="map-container">
        <div className="search-container">
            <form onSubmit={handleSearch} className="search-form">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for a location"
                    className="search-input"
                />
                <button type="submit" className="search-button">
                    Search
                </button>
            </form>
        </div>
        {locationError && (
          <div className="location-error">
            {locationError}
          </div>
        )}
        <MapContainer center={position} zoom={14} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <Marker 
            position={position} 
            draggable={isDraggable}
            eventHandlers={{
              dragend: (e) => {
                if (isDraggable) {
                  const marker = e.target;
                  const position = marker.getLatLng();
                  setPosition([position.lat, position.lng]);
                  setIsDragged(true);
                }
              },
            }}
          >
            <Popup>
              {isDragged ? "Your selected location" : 
                (locationError ? "Approximate location based on IP" : "Your current location")}
              <br />
              {isDraggable && "Drag this marker to adjust your location"}
              <br />
              Latitude: {position[0].toFixed(4)}, Longitude: {position[1].toFixed(4)}
            </Popup>
          </Marker>
          <RecenterAutomatically position={position} />
        </MapContainer>
        {isDragged && (
          <div className="address-display">
            {address}
          </div>
        )}
      </div>
    );
  };

export default MapModel;
