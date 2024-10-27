import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
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
// Updated DelayedZoom component
function DelayedZoom({ delay }) {
  const map = useMap();
  const hasZoomedRef = useRef(false);
  
  useEffect(() => {
    if (!hasZoomedRef.current) {
      const timer = setTimeout(() => {
        map.zoomIn(1);
        hasZoomedRef.current = true;
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [map, delay]);

  return null;
}


const MapModel = ({ onLocationChange, isDraggable = false, onBoundsChange, groupPostList, selectedDate, allHeritexData, initialLocation = null }) => {
    const [position, setPosition] = useState(initialLocation || [37.77, -122.41]); // Default to San Francisco
    const [locationError, setLocationError] = useState(null);
    const [address, setAddress] = useState('');
    const [searchQuery, setSearchQuery] = useState([]);
    const [postMarkers, setPostMarkers] = useState([]);
    const [searchError, setSearchError] = useState(null);
    const [geocodingError, setGeocodingError] = useState(null);
    const [lastFetchedPosition, setLastFetchedPosition] = useState(null);
    const [heritexMarkers, setHeritexMarkers] = useState([]);
    const [selectedMarker, setSelectedMarker] = useState(null);

    useEffect(() => {
        if (initialLocation) {
            console.log("map model initial location:", initialLocation);
            setPosition(initialLocation);
        } else {
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
        }
    }, [initialLocation]);

    useEffect(() => {
        // Fetch address only when position has changed
        const fetchAddress = async () => {
            if (JSON.stringify(position) === JSON.stringify(lastFetchedPosition)) {
                return; // Skip if position hasn't changed
            }

            try {
                console.log('Fetching address for position:', position);
                const response = await axios.get(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position[0]}&lon=${position[1]}`
                );
                const addressParts = response.data.address;
                let shortAddress = [
                    addressParts.house_number,
                    addressParts.road,
                    addressParts.suburb,
                    addressParts.city,
                    addressParts.state,
                ].filter(Boolean).join(', ');
                setAddress(shortAddress);
                
                if (typeof onLocationChange === 'function') {
                    console.log('onLocationChange is a function');
                    onLocationChange({ lat: position[0], lng: position[1], address: shortAddress });
                }

                setLastFetchedPosition(position);
            } catch (error) {
                console.error("Error fetching address:", error);
                setAddress('Unable to fetch address');
            }
        };

        fetchAddress();
    }, [position, lastFetchedPosition, onLocationChange]);

    useEffect(() => {
        if (groupPostList && groupPostList.length > 0) {
            const markers = groupPostList.filter(post => {
                const postDate = new Date(post.date_time);
                console.log('postDate:', postDate);
                console.log('selectedDate:', selectedDate);
                return postDate.setHours(0, 0, 0, 0) === selectedDate.setHours(0, 0, 0, 0);
            }).map(post => {
                if (post.location) {
                    const [lat, lng] = post.location.split(',').map(Number);
                    if (!isNaN(lat) && !isNaN(lng)) {
                        return {
                            position: [lat, lng],
                            title: post.title,
                            dateTime: new Date(post.date_time),
                            host: post.host_username
                        };
                    }
                }
                console.warn('Post missing valid location data:', post);
                return null;
            }).filter(Boolean); // Remove any null entries
            console.log('Created markers:', markers);
            setPostMarkers(markers);
        } else {
            console.log('groupPostList is empty or undefined');
            setPostMarkers([]);
        }
    }, [groupPostList, selectedDate]);

    const handleSearch = async (e) => {
        e.preventDefault();
        setSearchError(null);
        setGeocodingError(null);

        if (!searchQuery.trim()) {
            setSearchError("Please enter a search term");
            return;
        }

        try {
            // Step 1: Use Nominatim API for forward geocoding
            const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`;
            const nominatimResponse = await axios.get(nominatimUrl);

            if (nominatimResponse.data && nominatimResponse.data.length > 0) {
                const { lat, lon } = nominatimResponse.data[0];

                // Step 2: Use our backend API with the obtained coordinates
                const backendUrl = `http://localhost:5000/api/geocode?lat=${lat}&lon=${lon}`;
                const backendResponse = await axios.get(backendUrl);

                if (backendResponse.data) {
                    setPosition([parseFloat(lat), parseFloat(lon)]);
                    
                    // Format the address
                    const addressObj = backendResponse.data;
                    const formattedAddress = [
                        addressObj.tourism,
                        addressObj.road,
                        addressObj.county,
                        addressObj.state,
                        addressObj.postcode,
                        addressObj.country
                    ].filter(Boolean).join(', ');
                    
                    setAddress(formattedAddress || 'Address not available');
                    
                    if (typeof onLocationChange === 'function') {
                        onLocationChange({ lat: parseFloat(lat), lng: parseFloat(lon), address: formattedAddress });
                    }
                } else {
                    setSearchError('Location details not found. Please try a different search term.');
                }
            } else {
                setSearchError('Location not found. Please try a different search term.');
            }
        } catch (error) {
            console.error("Error searching for location:", error);
            if (error.response) {
                console.error("Response data:", error.response.data);
                console.error("Response status:", error.response.status);
                console.error("Response headers:", error.response.headers);
                setGeocodingError(`Server error: ${error.response.status}. Please try again later.`);
            } else if (error.request) {
                console.error("No response received:", error.request);
                setGeocodingError("No response from server. Please check your connection and try again.");
            } else {
                console.error("Error details:", error.message);
                setGeocodingError("An unexpected error occurred. Please try again.");
            }
        }
    };

    const MapEvents = () => {
        const map = useMap();
        
        useEffect(() => {
          if (onBoundsChange) {
            const updateBounds = () => {
              const bounds = map.getBounds();
              onBoundsChange(bounds);
            };

            map.on('moveend', updateBounds);
            return () => {
              map.off('moveend', updateBounds);
            };
          }
        }, [map, onBoundsChange]);

        return null;
    };

    // Create a custom red icon for post markers
    const redIcon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    // Create a custom green icon for Heritex markers
    const greenIcon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    // New useEffect for Heritex data
    useEffect(() => {
        if (allHeritexData && allHeritexData.length > 0) {
            const markers = allHeritexData.map(item => {
                if (item.location && typeof item.location.x === 'number' && typeof item.location.y === 'number') {
                    return {
                        position: [item.location.x, item.location.y],
                        name: item.name,
                        rarity: item.rarity,
                        type: item.type,
                        range: item.range
                    };
                }
                console.warn('Heritex item missing valid location data:', item);
                return null;
            }).filter(Boolean);
            console.log('Created Heritex markers:', markers);
            setHeritexMarkers(markers);
        } else {
            console.log('allHeritexData is empty or undefined');
            setHeritexMarkers([]);
        }
    }, [allHeritexData]);

    console.log('Rendering with postMarkers:', postMarkers); // Debugging

    // Add this new component to enforce min/max zoom levels
    const SetZoomLimits = () => {
        const map = useMap();
        
        useEffect(() => {
          map.setMinZoom(11);
          map.setMaxZoom(18); // You can adjust this if needed
        }, [map]);

        return null;
    };

    const handleMarkerClick = (marker) => {
      setSelectedMarker(prevMarker => prevMarker === marker ? null : marker);
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
            <MapContainer 
                center={position} 
                zoom={13} 
                style={{ height: '100%', width: '100%' }}
                minZoom={11} // This sets the initial limit, but we need SetZoomLimits for dynamic changes
            >
                <SetZoomLimits />
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {/* Updated main user marker */}
                <Marker 
                    position={position} 
                    draggable={isDraggable}
                    eventHandlers={{
                        dragend: (e) => {
                            const marker = e.target;
                            const position = marker.getLatLng();
                            setPosition([position.lat, position.lng]);
                            console.log('Marker moved to:', position.lat, position.lng); // Added console.log
                        },
                    }}
                >
                    <Popup>
                        {address}
                        {console.log("map model position:", position)}
                        <br />
                        Latitude: {position[0].toFixed(4)}, Longitude: {position[1].toFixed(4)}
                    </Popup>
                </Marker>
                {/* Post markers */}
                {postMarkers.map((marker, index) => (
                    <Marker key={index} position={marker.position} icon={redIcon}>
                        <Popup>
                            <strong>{marker.title}</strong>
                            <br />
                            Host: {marker.host}
                            <br />
                            Date: {marker.dateTime.toLocaleString([], { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </Popup>
                    </Marker>
                ))}
                <RecenterAutomatically position={position} />
                <MapEvents />
                <DelayedZoom delay={300} />
                {/* Heritex markers */}
                {heritexMarkers.map((marker, index) => (
                    <React.Fragment key={`heritex-${index}`}>
                        <Marker 
                            position={marker.position} 
                            icon={greenIcon}
                            eventHandlers={{
                                click: () => handleMarkerClick(marker),
                            }}
                        >
                            <Popup>
                                <strong>{marker.name}</strong>
                            </Popup>
                        </Marker>
                        {selectedMarker === marker && (
                            <Circle 
                                center={marker.position}
                                radius={marker.range}
                                pathOptions={{ color: 'green', fillColor: 'green', fillOpacity: 0.2 }}
                            />
                        )}
                    </React.Fragment>
                ))}
            </MapContainer>
            <div className="address-display">
                {address || 'No address available'}
            </div>
        </div>
    );
};

export default MapModel;
