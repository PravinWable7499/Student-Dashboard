// Helper function to get live GPS coordinates (OPTIMIZED FOR SPEED)
function getLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error("Geolocation is not supported by your browser."));
        } else {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => {
                    let errorMsg = "Unable to retrieve your location.";
                    if (error.code === error.PERMISSION_DENIED) {
                        errorMsg = "Location access denied. Please allow location permissions in your browser.";
                    } else if (error.code === error.TIMEOUT) {
                        errorMsg = "Location request timed out. Please check your internet/GPS signal and try again.";
                    } else if (error.code === error.POSITION_UNAVAILABLE) {
                        errorMsg = "Location information is currently unavailable.";
                    }
                    reject(new Error(errorMsg));
                },
                { 
                    enableHighAccuracy: false, // MUCH FASTER: Uses WiFi/Cell towers instead of waiting for GPS satellites
                    timeout: 5000,             // Fail fast after 5 seconds instead of hanging
                    maximumAge: 0              // Always get a fresh location, never use a cached old one
                }
            );
        }
    });
}

async function postAttendance(url) {
    const btn = document.getElementById('btnAttendance');
    if (!btn || btn.disabled) return;

    const originalText = btn.innerHTML; // Save original button content
    
    try {
        // 1. Request Location First
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Locating...';
        
        const location = await getLocation();

        // 2. Send to Backend with Location Data
        const res = await fetch(url, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat: location.lat, lng: location.lng })
        });
        
        const data = await res.json();

        if (!data.success) {
            alert(data.message || 'Something went wrong.');
            btn.disabled = false;
            btn.innerHTML = originalText; // Restore button
            return;
        }

        // 3. Success: Reload page to update UI
        window.location.reload();
        
    } catch (err) {
        console.error(err);
        alert(err.message || 'Network error. Please try again.');
        btn.disabled = false;
        btn.innerHTML = originalText; // Restore button
    }
}

function handleClockIn()  { return postAttendance('/api/clock_in'); }
function handleClockOut() { return postAttendance('/api/clock_out'); }

function handleAttendanceToggle() {
    const btn = document.getElementById('btnAttendance');
    if (!btn || btn.disabled) return;
    
    // If the button is red (Clock Out), trigger Clock Out
    if (btn.classList.contains('btn-out')) {
        handleClockOut();
    } else {
        handleClockIn();
    }
}