import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { availableCities } from './data';

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
  return +distance.toFixed(1);
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

/**
 * Multi-Tier Intelligent Location Detector:
 * 1. Device GPS via expo-location
 * 2. Web browser navigator.geolocation
 * 3. IP-based Network Geolocation API (detects Pune / user's actual city automatically)
 * 4. Fallback to Pune, Maharashtra default
 */
export async function detectRealLocation() {
  const defaultPune = availableCities.find((c) => c.id === 'pune') || {
    latitude: 18.5204,
    longitude: 73.8567,
    name: 'Pune, Maharashtra',
    shortName: 'Pune',
  };

  // Tier 1: Try Expo Native Location
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = position.coords;
      let placeName = 'Live GPS Location';

      try {
        const reverse = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (reverse && reverse.length > 0) {
          const p = reverse[0];
          placeName = [p.district || p.subregion || p.name, p.city || p.region]
            .filter(Boolean)
            .join(', ');
        }
      } catch (e) {
        placeName = `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`;
      }

      return {
        latitude,
        longitude,
        cityName: placeName,
        source: 'gps',
      };
    }
  } catch (err) {
    // Continue to tier 2/3
  }

  // Tier 2: Try Web Navigator Geolocation
  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.geolocation) {
    try {
      const webPos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
      });
      return {
        latitude: webPos.coords.latitude,
        longitude: webPos.coords.longitude,
        cityName: 'Live Browser GPS',
        source: 'browser_gps',
      };
    } catch (e) {
      // Continue to Tier 3
    }
  }

  // Tier 3: Network IP-based Geolocation (Auto-detects actual city like Pune seamlessly without permission prompts)
  try {
    const ipRes = await fetch('https://ipapi.co/json/');
    if (ipRes.ok) {
      const ipData = await ipRes.json();
      if (ipData.latitude && ipData.longitude) {
        return {
          latitude: ipData.latitude,
          longitude: ipData.longitude,
          cityName: `${ipData.city || 'Pune'}, ${ipData.region || 'Maharashtra'}`,
          source: 'ip_network',
        };
      }
    }
  } catch (e) {
    // Continue to default
  }

  // Default: Pune, Maharashtra
  return {
    latitude: defaultPune.latitude,
    longitude: defaultPune.longitude,
    cityName: defaultPune.name,
    source: 'default',
  };
}
