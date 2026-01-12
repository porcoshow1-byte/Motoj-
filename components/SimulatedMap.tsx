import React, { useEffect, useState, useCallback } from 'react';
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

          {/* Single Driver Marker */}
          {showDriver && driverLocation && !drivers && (
              <Marker 
                position={driverLocation}
                icon={{
                    path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                    scale: 6,
                    fillColor: "#16a34a",
                    fillOpacity: 1,
                    strokeWeight: 1,
                    strokeColor: "#ffffff",
                    rotation: 0
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
                    icon={{
                        path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                        scale: 5,
                        fillColor: driver.status === 'online' ? "#16a34a" : "#9ca3af",
                        fillOpacity: 1,
                        strokeWeight: 1,
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