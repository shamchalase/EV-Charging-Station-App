// Haversine formula and location calculation utilities

/**
 * Calculates the great-circle distance between two coordinates in kilometers using Haversine formula.
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return +(distance.toFixed(1));
}

/**
 * Formats distance in km or meters
 */
export function formatDistance(distanceKm) {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm} km`;
}

/**
 * Estimates travel time in minutes based on urban driving speed (avg 30 km/h)
 */
export function estimateTravelTime(distanceKm) {
  if (!distanceKm || distanceKm <= 0) return '2-3 Mins';
  const minutes = Math.max(3, Math.round((distanceKm / 30) * 60));
  return `${minutes}-${minutes + 4} Mins`;
}
