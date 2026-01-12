import { useState, useEffect, useCallback } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

export const useGeoLocation = () => {
  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const getCurrentLocation = useCallback(async () => {
    setLoading(true);
    try {
      // Verificar permissão
      const permission = await Geolocation.checkPermissions();
      if (permission.location !== 'granted') {
        const requested = await Geolocation.requestPermissions();
        if (requested.location !== 'granted') {
          throw new Error("Permissão de localização negada.");
        }
      }

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0
      });

      setLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      });
      setLoading(false);
    } catch (err: any) {
      console.warn("Erro ao obter localização (Native/Web):", err);
      setError(err.message || "Erro desconhecido");

      // Fallback para Web API se falhar o nativo (apenas garantia)
      if (!Capacitor.isNativePlatform() && "geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            setLoading(false);
          },
          (webErr) => {
            setError(webErr.message);
            setLoading(false);
          }
        );
      } else {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    getCurrentLocation();

    // Configurar Watcher
    let watcherId: string | number | null = null;

    const startWatcher = async () => {
      try {
        watcherId = await Geolocation.watchPosition({
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }, (position, err) => {
          if (err) {
            console.warn("Erro no watchPosition:", err);
            return;
          }
          if (position) {
            setLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
            setLoading(false);
          }
        });
      } catch (error) {
        console.error("Falha ao iniciar Watcher GPS:", error);
      }
    };

    startWatcher();

    return () => {
      if (watcherId !== null) {
        Geolocation.clearWatch({ id: watcherId as string });
      }
    };
  }, [getCurrentLocation]);

  return { location, error, loading, getCurrentLocation };
};