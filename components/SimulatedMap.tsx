import React, { useEffect, useState, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer } from '@react-google-maps/api';
import { APP_CONFIG } from '../constants';
import { Coords, Driver } from '../types';
import { Loader2, AlertTriangle } from 'lucide-react';

// Fix for Google Maps types when @types/google.maps is not installed
declare global {
  interface Window {
    google: any;
  }
}

// IMPORTANTE: Definir bibliotecas fora do componente para manter referência estável
const libraries: ("places" | "geometry")[] = ['places', 'geometry'];

interface MapProps {
  showDriver?: boolean;
  showRoute?: boolean;
  status?: string;
  origin?: Coords | null;
  destination?: Coords | null;
  waypoints?: Coords[];
  driverLocation?: Coords | null;
  drivers?: Driver[];
}

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

// Ponto central padrão (Avaré - SP)
const defaultCenter = {
  lat: -23.1047,
  lng: -48.9213,
};

const InternalMap: React.FC<MapProps> = ({ showDriver, showRoute, status, origin, destination, driverLocation, drivers, waypoints }) => {
  const [map, setMap] = useState<any | null>(null);
  const [directionsResponse, setDirectionsResponse] = useState<any | null>(null);

  // Estado para animação suave do marcador do motorista
  const [animatedDriverLocation, setAnimatedDriverLocation] = useState<Coords | null>(null);
  const [driverRotation, setDriverRotation] = useState(0);
  const prevDriverLocationRef = useRef<Coords | null>(null);

  const onLoad = useCallback((map: any) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Calcular Rota
  useEffect(() => {
    if (showRoute && origin && destination && window.google) {
      const directionsService = new window.google.maps.DirectionsService();

      const formattedWaypoints = waypoints ? waypoints.map(p => ({
        location: p,
        stopover: true
      })) : [];

      directionsService.route({
        origin: origin,
        destination: destination,
        waypoints: formattedWaypoints,
        optimizeWaypoints: true,
        travelMode: window.google.maps.TravelMode.DRIVING,
      }, (result: any, status: any) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          setDirectionsResponse(result);
        } else {
          console.error(`Erro ao buscar rota: ${status}`);
        }
      });
    } else {
      setDirectionsResponse(null);
    }
  }, [showRoute, origin, destination, waypoints]);

  // Animar movimento do motorista suavemente
  useEffect(() => {
    if (!driverLocation) {
      setAnimatedDriverLocation(null);
      return;
    }

    const prev = prevDriverLocationRef.current;

    // Calcular rotação baseado na direção do movimento
    if (prev && (prev.lat !== driverLocation.lat || prev.lng !== driverLocation.lng)) {
      const deltaLat = driverLocation.lat - prev.lat;
      const deltaLng = driverLocation.lng - prev.lng;
      const angle = Math.atan2(deltaLng, deltaLat) * (180 / Math.PI);
      setDriverRotation(angle);
    }

    // Animação suave com interpolação
    if (prev && animatedDriverLocation) {
      const startLat = animatedDriverLocation.lat;
      const startLng = animatedDriverLocation.lng;
      const endLat = driverLocation.lat;
      const endLng = driverLocation.lng;

      let startTime: number | null = null;
      const duration = 1000; // 1 segundo de animação

      const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing suave (ease-in-out)
        const easeProgress = progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        const currentLat = startLat + (endLat - startLat) * easeProgress;
        const currentLng = startLng + (endLng - startLng) * easeProgress;

        setAnimatedDriverLocation({ lat: currentLat, lng: currentLng });

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    } else {
      // Primeira vez, define direto
      setAnimatedDriverLocation(driverLocation);
    }

    prevDriverLocationRef.current = driverLocation;
  }, [driverLocation]);

  // Ajustar Zoom e Centralização
  useEffect(() => {
    if (!map) return;

    if (drivers && drivers.length > 0) {
      // Modo Admin: Fit bounds para todos os motoristas
      const bounds = new window.google.maps.LatLngBounds();
      let hasValidLoc = false;
      drivers.forEach(d => {
        if (d.location && d.location.lat !== 0) {
          bounds.extend(d.location);
          hasValidLoc = true;
        }
      });
      if (hasValidLoc) {
        map.fitBounds(bounds);
      } else {
        map.panTo(defaultCenter);
        map.setZoom(13);
      }
    } else if (origin && !destination && !showRoute) {
      // Modo Acompanhar Usuário (Home)
      map.panTo(origin);
      map.setZoom(15);
    }
  }, [map, origin, destination, showRoute, drivers]);

  return (
    <div className="relative w-full h-full animate-fade-in">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={origin || defaultCenter}
        zoom={14}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          disableDefaultUI: true,
          zoomControl: false,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          rotateControl: false,
          clickableIcons: false,
          styles: [
            { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }
          ]
        }}
      >
        {/* User Marker (Origin) */}
        {origin && !drivers && (
          <Marker position={origin} icon={{
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#f97316",
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: "#ffffff",
          }} />
        )}

        {/* Destination Marker */}
        {destination && showRoute && (
          <Marker position={destination} />
        )}

        {/* Single Driver Marker - Com animação suave */}
        {showDriver && animatedDriverLocation && !drivers && (
          <Marker
            position={animatedDriverLocation}
            icon={{
              path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
              scale: 6,
              fillColor: "#16a34a",
              fillOpacity: 1,
              strokeWeight: 1,
              strokeColor: "#ffffff",
              rotation: driverRotation
            }}
          />
        )}

        {/* Multiple Drivers Markers (Admin) */}
        {drivers && drivers.map(driver => (
          driver.location && driver.location.lat !== 0 && (
            <Marker
              key={driver.id}
              position={driver.location}
              title={`${driver.name} - ${driver.status}`}
              onClick={() => {
                if (map) {
                  const infoWindow = new window.google.maps.InfoWindow({
                    content: `
                      <div style="padding: 8px; font-family: system-ui;">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                          <img src="${driver.avatar || 'https://ui-avatars.com/api/?name=' + driver.name}" 
                               style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover;" />
                          <div>
                            <strong style="font-size: 14px;">${driver.name}</strong>
                            <div style="font-size: 11px; color: #666;">⭐ ${driver.rating}</div>
                          </div>
                        </div>
                        <div style="display: flex; gap: 8px; font-size: 11px; color: #888;">
                          <span style="background: ${driver.status === 'online' ? '#dcfce7' : '#f3f4f6'}; 
                                       color: ${driver.status === 'online' ? '#16a34a' : '#6b7280'}; 
                                       padding: 2px 8px; border-radius: 12px; text-transform: capitalize;">
                            ${driver.status === 'online' ? '● Online' : driver.status === 'busy' ? '● Ocupado' : '○ Offline'}
                          </span>
                          <span>🏍️ ${driver.vehicle || 'Moto'}</span>
                        </div>
                      </div>
                    `,
                    position: driver.location
                  });
                  infoWindow.open(map);
                }
              }}
              icon={{
                path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                scale: 6,
                fillColor: driver.status === 'online' ? "#16a34a" : driver.status === 'busy' ? "#f59e0b" : "#9ca3af",
                fillOpacity: 1,
                strokeWeight: 2,
                strokeColor: "#ffffff",
                rotation: Math.random() * 360
              }}
            />
          )
        ))}

        {/* Route Line */}
        {directionsResponse && (
          <DirectionsRenderer
            directions={directionsResponse}
            options={{
              suppressMarkers: true,
              polylineOptions: {
                strokeColor: "#f97316",
                strokeWeight: 5
              }
            }}
          />
        )}
      </GoogleMap>

      {status && (
        <div className="absolute top-12 left-4 right-4 z-30">
          <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-lg shadow-sm border-l-4 border-orange-500 text-sm font-medium text-gray-800">
            {status}
          </div>
        </div>
      )}
    </div>
  );
};

// Componente Principal que gerencia o carregamento da API
export const SimulatedMap: React.FC<MapProps> = (props) => {
  const apiKey = APP_CONFIG.googleMapsApiKey;

  // Se não houver chave, mostramos um erro explícito em vez do mapa simulado
  if (!apiKey) {
    return (
      <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-red-100 p-4 rounded-full mb-4">
          <AlertTriangle className="text-red-500" size={32} />
        </div>
        <h3 className="text-lg font-bold text-gray-800 mb-2">Google Maps não configurado</h3>
        <p className="text-sm text-gray-600 mb-4">
          Para visualizar o mapa real, você precisa adicionar sua Chave de API no arquivo <code>.env</code> ou <code>constants.ts</code>.
        </p>
        <div className="bg-white p-3 rounded border border-gray-200 text-xs font-mono text-gray-500 break-all">
          VITE_GOOGLE_MAPS_API_KEY=sua_chave_aqui
        </div>
      </div>
    );
  }

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
    preventGoogleFontsLoading: true,
    libraries: libraries
  });

  if (loadError) {
    return (
      <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center text-red-500">
        <AlertTriangle size={32} className="mb-2" />
        <p>Erro ao carregar Google Maps API.</p>
        <p className="text-xs mt-1">Verifique se a chave é válida e tem as permissões corretas.</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-full bg-gray-50 flex flex-col items-center justify-center text-orange-500">
        <Loader2 size={32} className="animate-spin mb-2" />
        <p className="text-sm font-medium">Carregando Mapa...</p>
      </div>
    );
  }

  return <InternalMap {...props} />;
};