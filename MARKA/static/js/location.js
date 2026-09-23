/* ==========================================================================
   MARKA — EVERY JOURNEY LEAVES A MARK.
   Automated Vehicle Passenger Footprint & Real Road Network Telemetry Engine
   With Device Location Sensing, Interactive Autocomplete & Verified Road Tracing
   ========================================================================== */

// Vehicle emission factors (kg CO2e per km)
const VEHICLE_EMISSIONS = {
    petrol_sedan: { name: "Sedan (Petrol)", factor: 0.180, icon: "bi-car-front-fill" },
    diesel_suv:   { name: "Diesel SUV", factor: 0.230, icon: "bi-truck-front-fill" },
    hybrid_car:   { name: "Hybrid Car", factor: 0.105, icon: "bi-ev-front-fill" },
    electric_car: { name: "Electric EV", factor: 0.045, icon: "bi-lightning-charge-fill" },
    public_bus:   { name: "Public Bus", factor: 1.150, icon: "bi-bus-front-fill" },
    motorbike:    { name: "Motorbike", factor: 0.095, icon: "bi-bicycle" }
};

// Curated verified Indian places index for instant offline / fallback resolution
const VERIFIED_LOCATIONS = [
    { name: "Dhule, Maharashtra", subtitle: "District Headquarters, Maharashtra", type: "city", lat: 20.9042, lon: 74.7749 },
    { name: "Dhule Railway Station", subtitle: "Central Railway, Dhule", type: "station", lat: 20.9015, lon: 74.7770 },
    { name: "Deopur, Dhule", subtitle: "Key Urban Area, Dhule, Maharashtra", type: "locality", lat: 20.9167, lon: 74.7725 },
    { name: "Agrasen Maharaj Chowk, Dhule", subtitle: "Central Junction, Dhule", type: "landmark", lat: 20.9055, lon: 74.7758 },
    { name: "Shirpur, Maharashtra", subtitle: "Dhule District, Maharashtra (55 km)", type: "city", lat: 21.3500, lon: 74.8800 },
    { name: "Sakri, Maharashtra", subtitle: "Dhule District, Maharashtra (52 km)", type: "city", lat: 20.9333, lon: 74.3167 },
    { name: "Dondaicha, Maharashtra", subtitle: "Dhule District, Maharashtra (48 km)", type: "city", lat: 21.3292, lon: 74.5714 },
    { name: "Malegaon, Maharashtra", subtitle: "Textile Hub, Nashik District (50 km from Dhule)", type: "city", lat: 20.5539, lon: 74.5269 },
    { name: "Jalgaon, Maharashtra", subtitle: "North Maharashtra Hub (90 km from Dhule)", type: "city", lat: 21.0077, lon: 75.5626 },
    { name: "Nashik, Maharashtra", subtitle: "Kumbh City, Maharashtra (158 km from Dhule)", type: "city", lat: 19.9975, lon: 73.7898 },
    { name: "New Delhi, Delhi", subtitle: "National Capital of India (984 km from Dhule)", type: "city", lat: 28.6139, lon: 77.2090 },
    { name: "Connaught Place, New Delhi", subtitle: "Central Delhi Commercial Center", type: "landmark", lat: 28.6315, lon: 77.2167 },
    { name: "Indira Gandhi International Airport (DEL)", subtitle: "Terminal 3, New Delhi", type: "airport", lat: 28.5562, lon: 77.1000 },
    { name: "India Gate, New Delhi", subtitle: "Rajpath / Kartavya Path, New Delhi", type: "landmark", lat: 28.6129, lon: 77.2295 },
    { name: "Delhi Cantt, Delhi", subtitle: "Cantonment & Transit Hub, Delhi", type: "station", lat: 28.5983, lon: 77.1264 },
    { name: "Mumbai, Maharashtra", subtitle: "Financial Capital of India (325 km from Dhule)", type: "city", lat: 19.0760, lon: 72.8777 },
    { name: "Chhatrapati Shivaji Maharaj Terminus (CSMT)", subtitle: "Historic Rail Hub, South Mumbai", type: "station", lat: 18.9401, lon: 72.8354 },
    { name: "Bandra Kurla Complex (BKC), Mumbai", subtitle: "Prime Business District, Mumbai", type: "landmark", lat: 19.0664, lon: 72.8688 },
    { name: "Pune, Maharashtra", subtitle: "IT & Automobile Capital, Maharashtra (335 km)", type: "city", lat: 18.5204, lon: 73.8567 },
    { name: "Indore, Madhya Pradesh", subtitle: "Cleanest City, Madhya Pradesh (260 km from Dhule)", type: "city", lat: 22.7196, lon: 75.8577 },
    { name: "Surat, Gujarat", subtitle: "Diamond & Textile City, Gujarat (230 km)", type: "city", lat: 21.1702, lon: 72.8311 },
    { name: "Ahmedabad, Gujarat", subtitle: "Mega City, Gujarat (460 km from Dhule)", type: "city", lat: 23.0225, lon: 72.5714 },
    { name: "Chhatrapati Sambhajinagar (Aurangabad), MH", subtitle: "Heritage Tourism Hub (150 km from Dhule)", type: "city", lat: 19.8762, lon: 75.3433 },
    { name: "Nagpur, Maharashtra", subtitle: "Orange City & Zero Mile, Maharashtra", type: "city", lat: 21.1458, lon: 79.0882 },
    { name: "Bengaluru, Karnataka", subtitle: "Silicon Valley of India", type: "city", lat: 12.9716, lon: 77.5946 },
    { name: "Hyderabad, Telangana", subtitle: "Cyberabad & Charminar City", type: "city", lat: 17.3850, lon: 78.4867 },
    { name: "Jaipur, Rajasthan", subtitle: "Pink City, Rajasthan", type: "city", lat: 26.9124, lon: 75.7873 }
];

// Global MARKA State
const TrackerState = {
    isTracking: false,
    mode: "idle", // "gps" | "sim" | "paused" | "idle"
    watchId: null,
    simTimer: null,
    simIndex: 0,
    
    // Journey Routing
    origin: {
        name: "Dhule, Maharashtra",
        lat: 20.9042,
        lon: 74.7749,
        isCustom: false
    },
    destination: {
        name: "New Delhi, Delhi",
        lat: 28.6139,
        lon: 77.2090,
        isCustom: false
    },
    plannedDistanceKm: 984.0,
    totalTripEstimatedFootprint: 0.0,
    
    // Vehicle & Occupancy Parameters
    vehicleType: "petrol_sedan",
    passengers: 2,
    
    // Live Accumulators (Automatically calculated)
    startTime: null,
    durationSeconds: 0,
    timerInterval: null,
    totalDistanceKm: 0.0,
    totalVehicleCarbonKg: 0.0,
    passengerCarbonKg: 0.0,
    carbonSavedKg: 0.0,
    currentSpeedKmh: 0.0,
    liveEmissionRateGpm: 0.0, // Grams CO2 per minute
    
    // Telemetry & Corridor Waypoints
    lastCoords: null,
    activeRouteWaypoints: []
};

// Leaflet map objects
let mapInstance = null;
let vehicleMarker = null;
let originMarker = null;
let destMarker = null;
let accuracyCircle = null;
let routePolyline = null;
let activeMapPickerMode = null; // null | 'origin' | 'dest'
let originSearchTimer = null;
let destSearchTimer = null;

/* ---------------------------------------------------------
   LEAFLET MAP INITIALIZATION
--------------------------------------------------------- */
function initTrackingMap(initialLat = 20.9042, initialLon = 74.7749) {
    const mapElement = document.getElementById("leafletMap");
    if (!mapElement || typeof L === "undefined") return;

    if (mapInstance) {
        mapInstance.remove();
        mapInstance = null;
    }

    try {
        mapInstance = L.map("leafletMap", {
            zoomControl: false,
            attributionControl: false
        }).setView([initialLat, initialLon], 12);

        L.control.zoom({ position: "topright" }).addTo(mapInstance);

        // OpenStreetMap CartoDB Voyager tiles
        L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
            maxZoom: 19
        }).addTo(mapInstance);

        // Vehicle icon
        const carIcon = L.divIcon({
            className: "custom-leaflet-car",
            html: `
                <div style="
                    width: 38px; 
                    height: 38px; 
                    background: #059669; 
                    border: 3px solid #ffffff; 
                    border-radius: 50%; 
                    box-shadow: 0 4px 14px rgba(5,150,105,0.45); 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    color: #ffffff; 
                    font-size: 18px;">
                    <i class="bi bi-car-front-fill"></i>
                </div>
            `,
            iconSize: [38, 38],
            iconAnchor: [19, 19]
        });

        vehicleMarker = L.marker([initialLat, initialLon], { icon: carIcon }).addTo(mapInstance);
        vehicleMarker.bindPopup(`<strong>MARKA Telemetry Active</strong><br><span id="mapPopupAddress">${TrackerState.origin.name}</span>`);

        // Accuracy circle
        accuracyCircle = L.circle([initialLat, initialLon], {
            radius: 50,
            color: "#059669",
            fillColor: "#10b981",
            fillOpacity: 0.12,
            weight: 1.5
        }).addTo(mapInstance);

        // Real Road Polyline
        routePolyline = L.polyline([[initialLat, initialLon]], {
            color: "#059669",
            weight: 6,
            opacity: 0.9,
            smoothFactor: 1,
            lineJoin: "round"
        }).addTo(mapInstance);

        // Click on map listener for "Pick on Map" mode
        mapInstance.on("click", (e) => {
            if (activeMapPickerMode) {
                const target = activeMapPickerMode;
                activeMapPickerMode = null;
                const mapEl = document.getElementById("leafletMap");
                if (mapEl) mapEl.style.cursor = "";

                const lat = e.latlng.lat;
                const lon = e.latlng.lng;

                reverseGeocode(lat, lon, (formattedName) => {
                    if (target === "origin") {
                        TrackerState.origin = { name: formattedName, lat, lon, isCustom: true };
                        const input = document.getElementById("originInput");
                        if (input) input.value = formattedName;
                        updateVerifiedBadge("origin", formattedName, lat, lon);
                    } else {
                        TrackerState.destination = { name: formattedName, lat, lon, isCustom: true };
                        const input = document.getElementById("destInput");
                        if (input) input.value = formattedName;
                        updateVerifiedBadge("dest", formattedName, lat, lon);
                    }
                    showToast(`📍 Selected on map: ${formattedName}`, "success");
                    planCustomJourney();
                });
            }
        });

    } catch (err) {
        console.warn("Map init error:", err);
    }
}

/* ---------------------------------------------------------
   LOCATION AUTOCOMPLETE & PROPER SELECTION ENGINE
--------------------------------------------------------- */
function setupLocationAutocomplete() {
    setupInputAutocomplete("originInput", "originDropdown", "origin");
    setupInputAutocomplete("destInput", "destDropdown", "dest");
}

function setupInputAutocomplete(inputId, dropdownId, target) {
    const input = document.getElementById(inputId);
    const dropdown = document.getElementById(dropdownId);
    if (!input || !dropdown) return;

    // Show suggestions on focus
    input.addEventListener("focus", () => {
        fetchAndRenderSuggestions(input.value.trim(), dropdown, target);
    });

    // Debounced search on input
    input.addEventListener("input", (e) => {
        const query = e.target.value.trim();
        if (target === "origin") {
            clearTimeout(originSearchTimer);
            originSearchTimer = setTimeout(() => {
                fetchAndRenderSuggestions(query, dropdown, target);
            }, 250);
        } else {
            clearTimeout(destSearchTimer);
            destSearchTimer = setTimeout(() => {
                fetchAndRenderSuggestions(query, dropdown, target);
            }, 250);
        }
    });

    // Close dropdown on outside click
    document.addEventListener("click", (e) => {
        if (!input.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.remove("active");
        }
    });

    // Keyboard support: Enter to select first item or plan
    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            const firstItem = dropdown.querySelector(".autocomplete-item");
            if (firstItem && dropdown.classList.contains("active")) {
                firstItem.click();
            } else {
                dropdown.classList.remove("active");
                planCustomJourney();
            }
        } else if (e.key === "Escape") {
            dropdown.classList.remove("active");
        }
    });
}

function fetchAndRenderSuggestions(query, dropdown, target) {
    fetch(`/api/search-locations?q=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .then(data => {
            if (data.status === "success" && data.results) {
                renderDropdownResults(data.results, dropdown, target);
            }
        })
        .catch(() => {
            // Local fallback
            const q = query.toLowerCase();
            const filtered = VERIFIED_LOCATIONS.filter(item => 
                !q || item.name.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q)
            );
            renderDropdownResults(filtered, dropdown, target);
        });
}

function renderDropdownResults(results, dropdown, target) {
    dropdown.innerHTML = "";

    // 1. Contextual Action Items
    if (target === "origin") {
        const gpsItem = document.createElement("div");
        gpsItem.className = "autocomplete-item";
        gpsItem.innerHTML = `
            <div class="autocomplete-item-icon action">
                <i class="bi bi-crosshair"></i>
            </div>
            <div class="autocomplete-item-text">
                <span class="autocomplete-item-title">Use Current GPS Location</span>
                <span class="autocomplete-item-subtitle">Detect device coordinates (Dhule & vicinity)</span>
            </div>
            <span class="autocomplete-badge">GPS</span>
        `;
        gpsItem.onclick = () => {
            dropdown.classList.remove("active");
            autoRequestDeviceLocation();
        };
        dropdown.appendChild(gpsItem);
    }

    // "Pick on Map" action for both
    const pickMapItem = document.createElement("div");
    pickMapItem.className = "autocomplete-item";
    pickMapItem.innerHTML = `
        <div class="autocomplete-item-icon action">
            <i class="bi bi-pin-map-fill"></i>
        </div>
        <div class="autocomplete-item-text">
            <span class="autocomplete-item-title">Click & Pick on Map</span>
            <span class="autocomplete-item-subtitle">Select precise ${target === 'origin' ? 'Starting' : 'Ending'} point on map</span>
        </div>
        <span class="autocomplete-badge">Interactive</span>
    `;
    pickMapItem.onclick = () => {
        dropdown.classList.remove("active");
        activateMapPicker(target);
    };
    dropdown.appendChild(pickMapItem);

    // 2. Location Items
    results.forEach(item => {
        const div = document.createElement("div");
        div.className = "autocomplete-item";

        let iconClass = "bi-geo-alt-fill";
        let iconCat = "";
        if (item.type === "station") { iconClass = "bi-train-front-fill"; iconCat = "station"; }
        else if (item.type === "airport") { iconClass = "bi-airplane-fill"; iconCat = "airport"; }
        else if (item.type === "landmark") { iconClass = "bi-bank"; iconCat = ""; }

        div.innerHTML = `
            <div class="autocomplete-item-icon ${iconCat}">
                <i class="bi ${iconClass}"></i>
            </div>
            <div class="autocomplete-item-text">
                <span class="autocomplete-item-title">${item.name}</span>
                <span class="autocomplete-item-subtitle">${item.subtitle}</span>
            </div>
            <span class="autocomplete-badge">${item.lat.toFixed(2)}°, ${item.lon.toFixed(2)}°</span>
        `;

        div.onclick = () => {
            selectVerifiedLocation(target, item);
            dropdown.classList.remove("active");
        };

        dropdown.appendChild(div);
    });

    dropdown.classList.add("active");
}

function selectVerifiedLocation(target, item) {
    const input = document.getElementById(target === "origin" ? "originInput" : "destInput");
    if (input) input.value = item.name;

    TrackerState[target] = {
        name: item.name,
        lat: item.lat,
        lon: item.lon,
        isCustom: true
    };

    updateVerifiedBadge(target, item.name, item.lat, item.lon);

    if (mapInstance) {
        if (target === "origin" && originMarker) {
            originMarker.setLatLng([item.lat, item.lon]);
        } else if (target === "dest" && destMarker) {
            destMarker.setLatLng([item.lat, item.lon]);
        }
    }

    showToast(`✓ Selected: ${item.name}`, "info");

    // Automatically trace the real road network route
    planCustomJourney();
}

function updateVerifiedBadge(target, name, lat, lon) {
    const badgeText = document.getElementById(`${target}VerifiedText`);
    if (badgeText) {
        badgeText.innerText = `Verified: ${name.split(',')[0]} (${lat.toFixed(3)}°N, ${lon.toFixed(3)}°E)`;
    }
}

function activateMapPicker(target) {
    activeMapPickerMode = target;
    const mapEl = document.getElementById("leafletMap");
    if (mapEl) mapEl.style.cursor = "crosshair";
    showToast(`Click anywhere on the map to set your ${target === 'origin' ? 'Starting' : 'Ending'} location.`, "info");
}

/* ---------------------------------------------------------
   AUTO DEVICE LOCATION SENSING ON PAGE LOAD
--------------------------------------------------------- */
function autoRequestDeviceLocation() {
    if (!navigator.geolocation) {
        showToast("Geolocation is not supported by your browser.", "warning");
        return;
    }

    safeSetText("liveStatusText", "Sensing Device Location...");
    safeSetText("currentPlaceName", "Detecting device GPS...");

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            const accuracy = Math.round(position.coords.accuracy || 20);

            TrackerState.origin.lat = lat;
            TrackerState.origin.lon = lon;

            if (mapInstance) {
                mapInstance.flyTo([lat, lon], 14, { animate: true, duration: 1.0 });
                if (vehicleMarker) vehicleMarker.setLatLng([lat, lon]);
                if (accuracyCircle) {
                    accuracyCircle.setLatLng([lat, lon]);
                    accuracyCircle.setRadius(accuracy);
                }
            }

            // Reverse geocode to find exact locality/city
            reverseGeocode(lat, lon, (formattedName) => {
                TrackerState.origin.name = formattedName;
                const originInput = document.getElementById("originInput");
                if (originInput) originInput.value = formattedName;
                updateVerifiedBadge("origin", formattedName, lat, lon);
                safeSetText("currentPlaceName", formattedName);
                safeSetText("locationDetailAddress", formattedName);
                safeSetText("liveCoordinates", `${lat.toFixed(4)}° N, ${lon.toFixed(4)}° E (±${accuracy}m)`);
                planCustomJourney();
            });

            const statusPill = document.getElementById("topbarLiveStatusPill");
            if (statusPill) statusPill.className = "live-pill-badge active-gps";
            safeSetText("liveStatusText", "Device Location Active");

            showToast("📍 Starting location automatically sensed from your device!", "success");
        },
        (error) => {
            console.warn("Geolocation sensing notice:", error.message);
            safeSetText("liveStatusText", "Location Ready");
            showToast("Starting location set to Dhule, Maharashtra.", "info");
            
            // Clean Default: Dhule, Maharashtra
            const originInput = document.getElementById("originInput");
            if (originInput) originInput.value = "Dhule, Maharashtra";
            updateVerifiedBadge("origin", "Dhule, Maharashtra", 20.9042, 74.7749);
            safeSetText("currentPlaceName", "Dhule, Maharashtra");
            safeSetText("locationDetailAddress", "Dhule, Maharashtra");
            safeSetText("liveCoordinates", "20.9042° N, 74.7749° E");
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
}

/* ---------------------------------------------------------
   REAL HIGHWAY ROAD NETWORK ROUTING & TRACING
--------------------------------------------------------- */
async function planCustomJourney() {
    const origin = TrackerState.origin;
    const dest = TrackerState.destination;

    if (!dest || !dest.name) {
        showToast("Please choose or enter your ending location (destination).", "warning");
        return;
    }

    safeSetText("liveStatusText", "Tracing Highway Route...");

    try {
        const res = await fetch(`/api/route?start_lat=${origin.lat}&start_lon=${origin.lon}&dest_lat=${dest.lat}&dest_lon=${dest.lon}`);
        const data = await res.json();

        if (data.status === "success" && data.coordinates && data.coordinates.length > 0) {
            TrackerState.plannedDistanceKm = data.distance_km;
            const fullRoadCoords = data.coordinates; // [[lat, lon], ...]

            // Draw actual road highway polyline
            if (mapInstance && routePolyline) {
                routePolyline.setLatLngs(fullRoadCoords);
            }

            // Downsample real road coordinates for smooth driving simulation along actual turns
            TrackerState.activeRouteWaypoints = sampleWaypointsAlongRoad(fullRoadCoords, data.distance_km, dest.name);

            // Update DOM metrics
            safeSetText("plannedDistanceDisplay", `${data.distance_km} km`);
            safeSetText("destCityLabel", dest.name.split(',')[0]);
            safeSetText("originCityLabel", origin.name.split(',')[0]);
            safeSetText("currentPlaceName", `${origin.name.split(',')[0]} ➔ ${dest.name.split(',')[0]}`);
            safeSetText("locationDetailAddress", `${origin.name.split(',')[0]} ➔ ${dest.name}`);

            // Update Road Route Summary Pill
            const summaryCard = document.getElementById("roadRouteSummaryCard");
            if (summaryCard) {
                summaryCard.style.display = "flex";
                safeSetText("roadRouteSummaryDist", `${data.distance_km} km`);
                const hrs = Math.floor(data.duration_min / 60);
                const mins = data.duration_min % 60;
                safeSetText("roadRouteSummaryTime", `~${hrs > 0 ? hrs + 'h ' : ''}${mins}m`);
                safeSetText("roadRouteSummaryVia", `via ${data.summary || 'National Highways'}`);
            }

            // Calculate estimated passenger footprint
            const veh = VEHICLE_EMISSIONS[TrackerState.vehicleType];
            const totalEst = data.distance_km * veh.factor;
            const passEst = totalEst / TrackerState.passengers;
            TrackerState.totalTripEstimatedFootprint = passEst;
            safeSetText("vitalTripEstimatedFootprint", `${passEst.toFixed(1)} kg`);

            // Fit map bounds and plot draggable pins
            plotJourneyOnMap(origin, dest, fullRoadCoords);

            showToast(`🛣️ Highway route traced! ${data.distance_km} km via ${data.summary || 'National Highways'}.`, "success");
            safeSetText("liveStatusText", "Route Ready");
            return;
        }
    } catch (err) {
        console.warn("Road routing fetch notice:", err);
    }

    // Fallback if network issue occurs
    const aerialDist = haversineDistance(origin.lat, origin.lon, dest.lat, dest.lon);
    TrackerState.plannedDistanceKm = Math.max(2.0, Math.round(aerialDist * 1.22));
    plotJourneyOnMap(origin, dest, [[origin.lat, origin.lon], [dest.lat, dest.lon]]);
}

function sampleWaypointsAlongRoad(fullCoords, totalDistKm, destName) {
    if (!fullCoords || fullCoords.length === 0) return [];
    
    // Choose between 40 and 80 progressive waypoints along the actual road
    const targetCount = Math.min(80, Math.max(30, fullCoords.length));
    const step = Math.max(1, Math.floor(fullCoords.length / targetCount));
    
    const waypoints = [];
    let accumulatedDist = 0;
    let prev = fullCoords[0];

    for (let i = 0; i < fullCoords.length; i += step) {
        const pt = fullCoords[i];
        accumulatedDist += haversineDistance(prev[0], prev[1], pt[0], pt[1]);
        prev = pt;

        const speed = 65 + Math.sin(i * 0.2) * 15;
        waypoints.push({
            lat: pt[0],
            lon: pt[1],
            speed: Math.round(speed),
            name: `${Math.round(accumulatedDist)} km towards ${destName.split(',')[0]}`
        });
    }

    // Ensure final point is included
    const last = fullCoords[fullCoords.length - 1];
    waypoints.push({
        lat: last[0],
        lon: last[1],
        speed: 40,
        name: `Arriving in ${destName.split(',')[0]}`
    });

    return waypoints;
}

function plotJourneyOnMap(origin, dest, routeCoords) {
    if (!mapInstance) return;

    if (originMarker) mapInstance.removeLayer(originMarker);
    if (destMarker) mapInstance.removeLayer(destMarker);

    // Origin Pin (Green, Draggable)
    const originIcon = L.divIcon({
        className: "custom-pin",
        html: `<div style="background:#059669; color:#fff; padding:4px 9px; border-radius:12px; font-weight:700; font-size:11px; box-shadow:0 3px 10px rgba(0,0,0,0.3); border:2px solid #fff; cursor:move;"><i class="bi bi-geo-alt-fill"></i> Start: ${origin.name.split(',')[0]}</div>`,
        iconAnchor: [30, 20]
    });
    originMarker = L.marker([origin.lat, origin.lon], { icon: originIcon, draggable: true }).addTo(mapInstance);
    originMarker.bindTooltip("Drag to adjust Starting Location", { direction: "top" });

    originMarker.on("dragend", (e) => {
        const pos = e.target.getLatLng();
        TrackerState.origin.lat = pos.lat;
        TrackerState.origin.lon = pos.lon;
        reverseGeocode(pos.lat, pos.lon, (formattedName) => {
            TrackerState.origin.name = formattedName;
            const input = document.getElementById("originInput");
            if (input) input.value = formattedName;
            updateVerifiedBadge("origin", formattedName, pos.lat, pos.lon);
            planCustomJourney();
        });
    });

    // Destination Pin (Red, Draggable)
    const destIcon = L.divIcon({
        className: "custom-pin",
        html: `<div style="background:#ef4444; color:#fff; padding:4px 9px; border-radius:12px; font-weight:700; font-size:11px; box-shadow:0 3px 10px rgba(0,0,0,0.3); border:2px solid #fff; cursor:move;"><i class="bi bi-flag-fill"></i> Finish: ${dest.name.split(',')[0]}</div>`,
        iconAnchor: [30, 20]
    });
    destMarker = L.marker([dest.lat, dest.lon], { icon: destIcon, draggable: true }).addTo(mapInstance);
    destMarker.bindTooltip("Drag to adjust Ending Destination", { direction: "top" });

    destMarker.on("dragend", (e) => {
        const pos = e.target.getLatLng();
        TrackerState.destination.lat = pos.lat;
        TrackerState.destination.lon = pos.lon;
        reverseGeocode(pos.lat, pos.lon, (formattedName) => {
            TrackerState.destination.name = formattedName;
            const input = document.getElementById("destInput");
            if (input) input.value = formattedName;
            updateVerifiedBadge("dest", formattedName, pos.lat, pos.lon);
            planCustomJourney();
        });
    });

    // Fit map bounds to show whole journey
    if (routeCoords && routeCoords.length > 0) {
        mapInstance.fitBounds(L.polyline(routeCoords).getBounds(), { padding: [50, 50] });
    } else {
        mapInstance.fitBounds([[origin.lat, origin.lon], [dest.lat, dest.lon]], { padding: [50, 50] });
    }

    if (vehicleMarker) vehicleMarker.setLatLng([origin.lat, origin.lon]);
}

function fillDestination(cityName) {
    const matched = VERIFIED_LOCATIONS.find(item => item.name.toLowerCase().includes(cityName.toLowerCase()));
    if (matched) {
        selectVerifiedLocation("dest", matched);
    } else {
        const destInput = document.getElementById("destInput");
        if (destInput) destInput.value = cityName;
        planCustomJourney();
    }

    document.querySelectorAll(".dest-chip").forEach(chip => {
        chip.classList.toggle("active", chip.innerText.toLowerCase().includes(cityName.toLowerCase()));
    });
}

function swapLocations() {
    const temp = { ...TrackerState.origin };
    TrackerState.origin = { ...TrackerState.destination };
    TrackerState.destination = temp;

    const originInput = document.getElementById("originInput");
    const destInput = document.getElementById("destInput");
    if (originInput && destInput) {
        originInput.value = TrackerState.origin.name;
        destInput.value = TrackerState.destination.name;
    }

    updateVerifiedBadge("origin", TrackerState.origin.name, TrackerState.origin.lat, TrackerState.origin.lon);
    updateVerifiedBadge("dest", TrackerState.destination.name, TrackerState.destination.lat, TrackerState.destination.lon);

    planCustomJourney();
}

/* ---------------------------------------------------------
   REVERSE GEOCODING HELPER
--------------------------------------------------------- */
function reverseGeocode(lat, lon, callback) {
    const distToDhule = haversineDistance(lat, lon, 20.9042, 74.7749);
    const distToDelhi = haversineDistance(lat, lon, 28.6139, 77.2090);

    if (distToDhule < 15) {
        callback("Dhule, Maharashtra");
        return;
    } else if (distToDelhi < 25) {
        callback("New Delhi, Delhi");
        return;
    }

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1`;
    fetch(url, { headers: { "Accept-Language": "en" } })
        .then(res => res.json())
        .then(data => {
            if (data && data.address) {
                const addr = data.address;
                const city = addr.city || addr.town || addr.village || addr.suburb || "Local Area";
                const state = addr.state || "";
                callback(`${city}${state ? ', ' + state : ''}`);
            } else {
                callback(`Lat ${lat.toFixed(4)}, Lon ${lon.toFixed(4)}`);
            }
        })
        .catch(() => callback(`Lat ${lat.toFixed(4)}, Lon ${lon.toFixed(4)}`));
}

/* ---------------------------------------------------------
   AUTOMATIC REAL-TIME CALCULATION & TELEMETRY
--------------------------------------------------------- */
function registerMovement(lat, lon, speedKmh, deltaDistKm) {
    TrackerState.currentSpeedKmh = speedKmh;
    TrackerState.totalDistanceKm += deltaDistKm;

    const veh = VEHICLE_EMISSIONS[TrackerState.vehicleType];
    const pass = TrackerState.passengers;

    // Gross vehicle carbon
    const deltaTotalCarbon = deltaDistKm * veh.factor;
    TrackerState.totalVehicleCarbonKg += deltaTotalCarbon;

    // Allocated passenger footprint: Total vehicle emissions divided by occupants
    const deltaPassengerCarbon = deltaTotalCarbon / pass;
    TrackerState.passengerCarbonKg += deltaPassengerCarbon;

    // Carbon saved through carpooling / multi-passenger occupancy
    const soloBaseline = deltaDistKm * 0.180;
    const currentSaved = Math.max(0, soloBaseline - deltaPassengerCarbon);
    TrackerState.carbonSavedKg += currentSaved;

    // Real-time Emission Burn Rate in grams/min
    const emissionFactorGrams = veh.factor * 1000;
    TrackerState.liveEmissionRateGpm = Math.round((speedKmh * emissionFactorGrams) / (60 * pass));

    // Update map marker and polyline trace
    if (mapInstance && vehicleMarker && routePolyline) {
        const newLatLng = [lat, lon];
        vehicleMarker.setLatLng(newLatLng);
        routePolyline.addLatLng(newLatLng);
        mapInstance.panTo(newLatLng, { animate: true, duration: 0.5 });
    }

    updateTelemetryHUD();
}

function updateTelemetryHUD() {
    // 1. Live Emission Rate (g CO2 / min)
    safeSetText("vitalBurnRate", TrackerState.liveEmissionRateGpm);
    safeSetText("vitalBurnRateBpm", TrackerState.liveEmissionRateGpm);
    
    // 2. Cumulative Passenger Footprint (kg CO2)
    safeSetText("vitalPassengerCarbon", TrackerState.passengerCarbonKg.toFixed(2));
    safeSetText("hudPassengerCarbon", TrackerState.passengerCarbonKg.toFixed(2));
    safeSetText("kpiLivePassengerCarbon", TrackerState.passengerCarbonKg.toFixed(2));

    // 3. Carbon Avoided / Saved (kg CO2)
    safeSetText("vitalCarbonSaved", TrackerState.carbonSavedKg.toFixed(2));
    safeSetText("hudCarbonSaved", TrackerState.carbonSavedKg.toFixed(2));
    safeSetText("kpiLiveCarbonSaved", TrackerState.carbonSavedKg.toFixed(2));

    // 4. Progress towards Destination
    const planned = TrackerState.plannedDistanceKm || 984;
    const current = TrackerState.totalDistanceKm;
    const pct = Math.min(100, Math.round((current / planned) * 100));

    const progressFill = document.getElementById("journeyProgressFill");
    if (progressFill) progressFill.style.width = `${pct}%`;
    safeSetText("journeyProgressPct", `${pct}%`);
    safeSetText("journeyProgressKm", `${current.toFixed(1)} / ${planned} km`);

    // 5. Speed, Distance & Gross Vehicle Emissions
    safeSetText("hudSpeed", TrackerState.currentSpeedKmh.toFixed(1));
    safeSetText("hudDistance", TrackerState.totalDistanceKm.toFixed(2));
    safeSetText("hudVehicleCarbon", TrackerState.totalVehicleCarbonKg.toFixed(2));

    safeSetText("kpiLiveDistance", TrackerState.totalDistanceKm.toFixed(2));
    safeSetText("kpiLiveVehicleCarbon", TrackerState.totalVehicleCarbonKg.toFixed(2));
}

function recalculateLiveFootprint() {
    const veh = VEHICLE_EMISSIONS[TrackerState.vehicleType];
    const pass = TrackerState.passengers;

    TrackerState.totalVehicleCarbonKg = TrackerState.totalDistanceKm * veh.factor;
    TrackerState.passengerCarbonKg = TrackerState.totalVehicleCarbonKg / pass;
    
    const soloBaseline = TrackerState.totalDistanceKm * 0.180;
    TrackerState.carbonSavedKg = Math.max(0, soloBaseline - TrackerState.passengerCarbonKg);

    updateTelemetryHUD();
}

function safeSetText(id, text) {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
}

/* ---------------------------------------------------------
   VEHICLE & OCCUPANCY STEPPER
--------------------------------------------------------- */
function selectVehicle(type) {
    if (!VEHICLE_EMISSIONS[type]) return;
    TrackerState.vehicleType = type;

    document.querySelectorAll(".vehicle-btn").forEach(btn => {
        btn.classList.toggle("selected", btn.dataset.vehicle === type);
    });

    updatePassengerAllocationMath();
    recalculateLiveFootprint();
    planCustomJourney();
}

function updatePassengerCount(delta) {
    const minPass = 1;
    const maxPass = TrackerState.vehicleType === "public_bus" ? 60 : 8;
    
    let newCount = TrackerState.passengers + delta;
    if (newCount < minPass) newCount = minPass;
    if (newCount > maxPass) newCount = maxPass;

    TrackerState.passengers = newCount;
    safeSetText("passengerCountDisplay", newCount);

    renderPassengerIcons(newCount);
    updatePassengerAllocationMath();
    recalculateLiveFootprint();
}

function renderPassengerIcons(count) {
    const row = document.getElementById("passengerIconsRow");
    if (!row) return;

    row.innerHTML = "";
    const displayCount = Math.min(count, 12);

    for (let i = 0; i < displayCount; i++) {
        const icon = document.createElement("div");
        icon.className = `passenger-seat-icon ${i === 0 ? 'driver' : 'rider'}`;
        icon.innerHTML = `<i class="bi ${i === 0 ? 'bi-person-badge-fill' : 'bi-person-fill'}"></i>`;
        icon.title = i === 0 ? "Driver" : `Passenger #${i+1}`;
        row.appendChild(icon);
    }

    if (count > 12) {
        const more = document.createElement("span");
        more.className = "passenger-more-badge";
        more.innerText = `+${count - 12} more`;
        row.appendChild(more);
    }
}

function updatePassengerAllocationMath() {
    const mathElem = document.getElementById("passengerMathDisplay");
    if (!mathElem) return;

    const veh = VEHICLE_EMISSIONS[TrackerState.vehicleType];
    const pass = TrackerState.passengers;
    const perPassengerRate = (veh.factor / pass).toFixed(3);
    const savingsPercent = pass > 1 ? Math.round(((pass - 1) / pass) * 100) : 0;

    mathElem.innerHTML = `
        <span>Vehicle emits <strong>${(veh.factor * 1000).toFixed(0)}g CO₂/km</strong>.</span><br>
        <span>Shared by <strong>${pass} passenger${pass > 1 ? 's' : ''}</strong> = <strong>${(perPassengerRate * 1000).toFixed(0)}g CO₂/km</strong> per person.</span>
        ${pass > 1 ? `<span style="display: block; color: #059669; font-weight: 700; margin-top: 2px;">🌱 Saves ${savingsPercent}% vs driving solo!</span>` : ''}
    `;
}

/* ---------------------------------------------------------
   TRACKING LIFECYCLE: LIVE GPS & CORRIDOR SIMULATION
--------------------------------------------------------- */
function startLiveGpsTracking() {
    if (!navigator.geolocation) {
        showToast("GPS is not supported in this browser.", "warning");
        return;
    }

    resetTripState();
    TrackerState.isTracking = true;
    TrackerState.mode = "gps";
    setUIActiveTracking("gps");

    showToast("MARKA GPS Tracking Active. Monitoring your travel footprint automatically!", "info");

    TrackerState.watchId = navigator.geolocation.watchPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            let speedKmh = position.coords.speed ? position.coords.speed * 3.6 : 0;

            if (TrackerState.lastCoords) {
                const dist = haversineDistance(
                    TrackerState.lastCoords.lat,
                    TrackerState.lastCoords.lon,
                    lat,
                    lon
                );
                if (!position.coords.speed && dist > 0.005) {
                    speedKmh = Math.min(120, dist / ((Date.now() - TrackerState.lastCoords.time) / 3600000));
                }
                registerMovement(lat, lon, speedKmh, dist);
            } else {
                if (mapInstance && vehicleMarker) {
                    vehicleMarker.setLatLng([lat, lon]);
                    mapInstance.panTo([lat, lon]);
                }
            }

            TrackerState.lastCoords = { lat, lon, time: Date.now() };
        },
        (error) => {
            console.warn("GPS error:", error);
            showToast("GPS warning: " + error.message, "warning");
        },
        { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    );

    startDurationTimer();
}

function startSimulatedDrive() {
    if (TrackerState.activeRouteWaypoints.length === 0) {
        planCustomJourney().then(() => runSimulationLoop());
    } else {
        runSimulationLoop();
    }
}

function runSimulationLoop() {
    resetTripState();
    TrackerState.isTracking = true;
    TrackerState.mode = "sim";
    TrackerState.simIndex = 0;
    setUIActiveTracking("sim");

    showToast(`MARKA Journey Active: ${TrackerState.origin.name.split(',')[0]} ➔ ${TrackerState.destination.name.split(',')[0]}!`, "info");

    const startPt = TrackerState.activeRouteWaypoints[0] || TrackerState.origin;
    if (mapInstance && vehicleMarker) {
        vehicleMarker.setLatLng([startPt.lat, startPt.lon]);
        mapInstance.panTo([startPt.lat, startPt.lon], { animate: true });
    }
    TrackerState.lastCoords = { lat: startPt.lat, lon: startPt.lon, time: Date.now() };

    startDurationTimer();

    TrackerState.simTimer = setInterval(() => {
        TrackerState.simIndex++;
        if (TrackerState.simIndex >= TrackerState.activeRouteWaypoints.length) {
            TrackerState.simIndex = 0;
        }

        const targetPt = TrackerState.activeRouteWaypoints[TrackerState.simIndex];
        const dist = haversineDistance(
            TrackerState.lastCoords.lat,
            TrackerState.lastCoords.lon,
            targetPt.lat,
            targetPt.lon
        );

        registerMovement(targetPt.lat, targetPt.lon, targetPt.speed, dist);
        TrackerState.lastCoords = { lat: targetPt.lat, lon: targetPt.lon, time: Date.now() };
        
        if (targetPt.name) {
            safeSetText("locationDetailAddress", targetPt.name);
        }
    }, 1200);
}

function pauseTracking() {
    if (!TrackerState.isTracking) return;

    if (TrackerState.mode === "gps" && TrackerState.watchId) {
        navigator.geolocation.clearWatch(TrackerState.watchId);
        TrackerState.watchId = null;
    }
    if (TrackerState.simTimer) {
        clearInterval(TrackerState.simTimer);
        TrackerState.simTimer = null;
    }
    if (TrackerState.timerInterval) {
        clearInterval(TrackerState.timerInterval);
        TrackerState.timerInterval = null;
    }

    TrackerState.isTracking = false;
    TrackerState.mode = "paused";
    safeSetText("liveStatusText", "Monitoring Paused");
    showToast("Journey monitoring paused.", "info");

    const pauseBtn = document.getElementById("btnPauseTracking");
    if (pauseBtn) {
        pauseBtn.innerHTML = `<i class="bi bi-play-fill"></i> Resume`;
        pauseBtn.onclick = resumeTracking;
    }
}

function resumeTracking() {
    TrackerState.isTracking = true;
    startDurationTimer();

    if (TrackerState.mode === "sim" || !TrackerState.watchId) {
        TrackerState.mode = "sim";
        setUIActiveTracking("sim");
        TrackerState.simTimer = setInterval(() => {
            TrackerState.simIndex = (TrackerState.simIndex + 1) % TrackerState.activeRouteWaypoints.length;
            const targetPt = TrackerState.activeRouteWaypoints[TrackerState.simIndex];
            const dist = haversineDistance(
                TrackerState.lastCoords.lat,
                TrackerState.lastCoords.lon,
                targetPt.lat,
                targetPt.lon
            );
            registerMovement(targetPt.lat, targetPt.lon, targetPt.speed, dist);
            TrackerState.lastCoords = { lat: targetPt.lat, lon: targetPt.lon, time: Date.now() };
        }, 1200);
    }

    const pauseBtn = document.getElementById("btnPauseTracking");
    if (pauseBtn) {
        pauseBtn.innerHTML = `<i class="bi bi-pause-fill"></i> Pause`;
        pauseBtn.onclick = pauseTracking;
    }
    showToast("Journey monitoring resumed.", "info");
}

function finishAndSaveTrip() {
    pauseTracking();

    if (TrackerState.totalDistanceKm < 0.05) {
        showToast("Trip distance too short to log.", "warning");
        resetToIdleUI();
        return;
    }

    const payload = {
        timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
        vehicle_type: TrackerState.vehicleType,
        vehicle_name: VEHICLE_EMISSIONS[TrackerState.vehicleType].name,
        passengers: TrackerState.passengers,
        distance_km: parseFloat(TrackerState.totalDistanceKm.toFixed(2)),
        total_carbon_kg: parseFloat(TrackerState.totalVehicleCarbonKg.toFixed(2)),
        passenger_carbon_kg: parseFloat(TrackerState.passengerCarbonKg.toFixed(2)),
        carbon_saved_kg: parseFloat(TrackerState.carbonSavedKg.toFixed(2)),
        duration_sec: TrackerState.durationSeconds,
        avg_speed_kmh: parseFloat((TrackerState.totalDistanceKm / (Math.max(1, TrackerState.durationSeconds) / 3600)).toFixed(1)),
        route_name: `${TrackerState.origin.name.split(',')[0]} ➔ ${TrackerState.destination.name.split(',')[0]} (${TrackerState.passengers} pass)`
    };

    fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        showToast(`🎉 Journey Logged in MARKA! Passenger share: ${payload.passenger_carbon_kg} kg CO₂. You saved ${payload.carbon_saved_kg} kg!`, "success");
        resetToIdleUI();
        
        if (typeof loadDashboardData === "function") {
            loadDashboardData();
        }
    })
    .catch(err => {
        console.error("Save error:", err);
        showToast("Error saving trip to database.", "error");
    });
}

function resetTripState() {
    if (TrackerState.watchId) navigator.geolocation.clearWatch(TrackerState.watchId);
    if (TrackerState.simTimer) clearInterval(TrackerState.simTimer);
    if (TrackerState.timerInterval) clearInterval(TrackerState.timerInterval);

    TrackerState.isTracking = false;
    TrackerState.watchId = null;
    TrackerState.simTimer = null;
    TrackerState.timerInterval = null;
    TrackerState.durationSeconds = 0;
    TrackerState.totalDistanceKm = 0.0;
    TrackerState.totalVehicleCarbonKg = 0.0;
    TrackerState.passengerCarbonKg = 0.0;
    TrackerState.carbonSavedKg = 0.0;
    TrackerState.currentSpeedKmh = 0.0;
    TrackerState.liveEmissionRateGpm = 0;
    TrackerState.lastCoords = null;

    safeSetText("hudDuration", "00:00:00");
    updateTelemetryHUD();
}

function startDurationTimer() {
    TrackerState.startTime = Date.now() - (TrackerState.durationSeconds * 1000);
    TrackerState.timerInterval = setInterval(() => {
        TrackerState.durationSeconds = Math.floor((Date.now() - TrackerState.startTime) / 1000);
        const hrs = String(Math.floor(TrackerState.durationSeconds / 3600)).padStart(2, "0");
        const mins = String(Math.floor((TrackerState.durationSeconds % 3600) / 60)).padStart(2, "0");
        const secs = String(TrackerState.durationSeconds % 60).padStart(2, "0");
        safeSetText("hudDuration", `${hrs}:${mins}:${secs}`);
    }, 1000);
}

/* ---------------------------------------------------------
   UI STATE HELPERS
--------------------------------------------------------- */
function setUIActiveTracking(mode) {
    const triggerButtons = document.getElementById("trackingTriggerButtons");
    const activeButtons = document.getElementById("trackingActiveActions");
    const statusPill = document.getElementById("topbarLiveStatusPill");
    const statusText = document.getElementById("liveStatusText");

    if (triggerButtons) triggerButtons.style.display = "none";
    if (activeButtons) activeButtons.style.display = "flex";

    if (statusPill) {
        statusPill.className = `live-pill-badge ${mode === "gps" ? "active-gps" : "active-sim"}`;
    }
    if (statusText) {
        statusText.innerText = mode === "gps" ? "Live GPS Monitoring" : "Active Journey Monitoring";
    }
}

function resetToIdleUI() {
    const triggerButtons = document.getElementById("trackingTriggerButtons");
    const activeButtons = document.getElementById("trackingActiveActions");
    const statusPill = document.getElementById("topbarLiveStatusPill");
    const statusText = document.getElementById("liveStatusText");

    if (triggerButtons) triggerButtons.style.display = "flex";
    if (activeButtons) activeButtons.style.display = "none";

    if (statusPill) statusPill.className = "live-pill-badge";
    if (statusText) statusText.innerText = "Monitoring Ready";

    TrackerState.mode = "idle";
}

/* ---------------------------------------------------------
   HAVERSINE DISTANCE MATH
--------------------------------------------------------- */
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/* ---------------------------------------------------------
   TOAST HELPER
--------------------------------------------------------- */
function showToast(message, type = "info") {
    let toast = document.getElementById("appToast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "appToast";
        toast.className = "toast-box";
        document.body.appendChild(toast);
    }

    let icon = "bi-check-circle-fill";
    if (type === "warning") icon = "bi-exclamation-triangle-fill";
    if (type === "error") icon = "bi-x-circle-fill";

    toast.innerHTML = `<i class="bi ${icon}"></i> <span>${message}</span>`;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 4000);
}

// Global initialization hook: Auto senses device location on page load
document.addEventListener("DOMContentLoaded", () => {
    initTrackingMap(20.9042, 74.7749);
    setupLocationAutocomplete();
    renderPassengerIcons(TrackerState.passengers);
    updatePassengerAllocationMath();

    // Trace initial route from Dhule to Delhi along actual road network
    planCustomJourney();

    // Automatically sense device location
    setTimeout(() => {
        autoRequestDeviceLocation();
    }, 800);
});