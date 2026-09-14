export type BrowserCoordinates = { lat: number; lng: number };

function geolocationErrorMessage(error: GeolocationPositionError) {
  if (error.code === error.PERMISSION_DENIED) {
    return "Location access was denied. Allow location for this site in your browser settings, then try again.";
  }
  if (error.code === error.POSITION_UNAVAILABLE) {
    return "Your location is currently unavailable. Check your device location services and try again.";
  }
  if (error.code === error.TIMEOUT) {
    return "Finding your location took too long. Please try again.";
  }
  return "We couldn’t access your location. Please try again.";
}

export function getBrowserLocation(): Promise<BrowserCoordinates> {
  if (!window.isSecureContext) {
    return Promise.reject(new Error("Location requires a secure HTTPS connection."));
  }
  if (!("geolocation" in navigator)) {
    return Promise.reject(new Error("Geolocation is not supported in this browser."));
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      }),
      (error) => reject(new Error(geolocationErrorMessage(error))),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5 * 60 * 1000 },
    );
  });
}
