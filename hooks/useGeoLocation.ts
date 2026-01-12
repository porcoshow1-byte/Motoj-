import { useState, useEffect, useCallback } from 'react';

export const useGeoLocation = () => {
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const getCurrentLocation = useCallback(() => {
    setLoading(true);
    if (!("geolocation" in navigator)) {
      setError("Geolocalização não suportada pelo navegador.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0
      }
    );
  }, []);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setError("Geolocalização não suportada.");
      setLoading(false);
      return;
    }

    // Primeira busca rápida
    getCurrentLocation();

    // Watch para movimento
    const watcher = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLoading(false);
      },
      (err) => {
        console.warn("Erro no watchPosition:", err);
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 1000
      }
    );

    return () => navigator.geolocation.clearWatch(watcher);
  }, [getCurrentLocation]);

  return { location, error, loading, getCurrentLocation };
};