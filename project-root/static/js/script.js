document.addEventListener('DOMContentLoaded', () => {
    initializeSpeechRecognition();
    requestLocation();
});

let recognition;
let map;
let userLocation;

function initializeSpeechRecognition() {
    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = true;

    // Event handlers
    recognition.onstart = () => {
        document.getElementById('face').classList.add('listening');
        document.getElementById('statusMessage').textContent = "Listening...";
    };

    recognition.onresult = async (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        document.getElementById('responseText').textContent = `User: ${transcript}`;
        
        try {
            const response = await fetch('/process', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ message: transcript })
            });
            
            const data = await response.json();
            await handleResponse(data);
        } catch (error) {
            console.error('Processing error:', error);
        }
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        recognition.stop();
        setTimeout(() => recognition.start(), 1000);
    };

    recognition.onend = () => {
        document.getElementById('face').classList.remove('listening');
        recognition.start();
    };

    try {
        recognition.start();
    } catch (error) {
        console.log('Auto-start failed:', error);
    }
}

async function handleResponse(data) {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(data.response);
    
    if(data.emergency) {
        // Emergency handling
        document.getElementById('mickeyContainer').classList.add('minimized');
        recognition.stop();
        showMap();
        await sendEmergencyAlerts();
        
        utterance.text = "Emergency detected! Help is on the way. Please stay calm.";
        document.getElementById('statusMessage').textContent = "EMERGENCY! Assistance arriving";
    } else {
        document.getElementById('responseText').textContent = `AI: ${data.response}`;
        document.getElementById('statusMessage').textContent = "Processing...";
    }

    synth.speak(utterance);
}

async function sendEmergencyAlerts() {
    const hospitalLocation = {
        lat: 12.8168, 
        lng: 79.6967  // SRM Hospital coordinates
    };

    try {
        await fetch('/send-emergency', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                location: userLocation,
                hospital: hospitalLocation,
                message: `YOUR LOVED ONE IS HURT! Nearest hospital (SRM) contacted.\nUser Location: ${userLocation.lat},${userLocation.lng}\nHospital Location: ${hospitalLocation.lat},${hospitalLocation.lng}`
            })
        });
    } catch (error) {
        console.error('Emergency alert failed:', error);
    }
}

function requestLocation() {
    if(navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
            },
            error => {
                console.error('Geolocation error:', error);
                userLocation = { lat: 12.8231, lng: 80.0444 }; // Default location
            }
        );
    }
}

function showMap() {
    const mapContainer = document.getElementById('mapContainer');
    mapContainer.style.display = 'block';
    mapContainer.classList.add('fullscreen');

    if(!map) {
        map = L.map(mapContainer, {
            center: [userLocation.lat, userLocation.lng],
            zoom: 15,
            zoomControl: true,
            maxBounds: [
                [userLocation.lat - 0.1, userLocation.lng - 0.1],
                [userLocation.lat + 0.1, userLocation.lng + 0.1]
            ]
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // User marker with pulse animation
        L.marker([userLocation.lat, userLocation.lng], {
            icon: L.divIcon({className: 'emergency-marker'})
        }).addTo(map).bindPopup('Your Location');

        // Hospital marker
        L.marker([12.8168, 79.6967], {
            icon: L.divIcon({className: 'hospital-marker'})
        }).addTo(map).bindPopup('SRM Hospital Chengalpattu');

        map.on('loaderror', () => {
            alert('Map loading failed. Check internet connection.');
        });
    } else {
        map.setView([userLocation.lat, userLocation.lng], 15);
    }
}