import React, { useState, useEffect, useRef } from 'react';
import { Shield, Power, DollarSign, User, MessageSquare, Phone, History, Calendar, X, Settings, Loader2, AlertCircle, RefreshCw, Lock, ArrowRight, Navigation, MapPin } from 'lucide-react';
import { Button, Badge, Card, Input } from '../components/UI';
import { SimulatedMap } from '../components/SimulatedMap';
import { ChatModal } from '../components/ChatModal';
import { ProfileScreen } from './ProfileScreen';
import { APP_CONFIG } from '../constants';
import { useAuth } from '../context/AuthContext';
import { subscribeToPendingRides, acceptRide, startRide, completeRide, getRideHistory, subscribeToRide, updateDriverLocation } from '../services/ride';
import { getOrCreateUserProfile } from '../services/user';
import { RideRequest, Driver, Coords } from '../types';
import { playSound, initAudio } from '../services/audio';
import { useGeoLocation } from '../hooks/useGeoLocation';
import { showNotification, ensureNotificationPermission } from '../services/notifications';

export const DriverApp = () => {
  const { user: authUser } = useAuth();
  const [currentDriver, setCurrentDriver] = useState<Driver | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [isOnline, setIsOnline] = useState(false);
  const [incomingRides, setIncomingRides] = useState<RideRequest[]>([]);
  const [activeRide, setActiveRide] = useState<RideRequest | null>(null);
  const [earnings, setEarnings] = useState(0);

  // Modals & Inputs
  const [showChat, setShowChat] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');

  const [historyRides, setHistoryRides] = useState<RideRequest[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Controle de Animação do Modal de Corrida
  const [requestAnimation, setRequestAnimation] = useState('animate-slide-in-bottom');

  // Referência para rastrear contagem anterior de corridas (para tocar som)
  const prevIncomingCountRef = useRef(0);

  // GPS em tempo real do motorista
  const { location: driverGpsLocation } = useGeoLocation();
  const [currentDriverLocation, setCurrentDriverLocation] = useState<Coords | null>(null);
  const lastLocationUpdateRef = useRef<number>(0);

  const loadDriverProfile = async () => {
    if (!authUser) return;
    setLoadingProfile(true);
    setProfileError(null);
    try {
      const profile = await getOrCreateUserProfile(authUser.uid, authUser.email || '', 'driver');
      setCurrentDriver(profile as Driver);
    } catch (err: any) {
      console.error("Erro ao carregar perfil de motorista:", err);
      setProfileError("Falha ao carregar perfil do motorista.");
    } finally {
      setLoadingProfile(false);
    }
  };

  // Fetch Driver Profile on Mount
  useEffect(() => {
    loadDriverProfile();
  }, [authUser]);

  // Subscribe to pending rides when online and no active ride
  useEffect(() => {
    let unsubscribe: any;
    if (isOnline && !activeRide) {
      unsubscribe = subscribeToPendingRides((rides) => {
        // Tocar som e mostrar notificação se chegou nova corrida
        if (rides.length > 0 && prevIncomingCountRef.current === 0) {
          playSound('newRequest');
          setRequestAnimation('animate-slide-in-bottom');

          // Mostrar notificação push se app não estiver em foco
          const firstRide = rides[0];
          showNotification('newRideRequest', {
            price: firstRide.price,
            origin: firstRide.origin,
            destination: firstRide.destination
          });
        }
        prevIncomingCountRef.current = rides.length;
        setIncomingRides(rides);
      });
    } else {
      setIncomingRides([]);
      prevIncomingCountRef.current = 0;
    }
    return () => { if (unsubscribe) unsubscribe(); };
  }, [isOnline, activeRide]);

  // Subscribe to active ride updates (to detect cancellations etc)
  useEffect(() => {
    let unsubscribe: any;
    if (activeRide) {
      unsubscribe = subscribeToRide(activeRide.id, (updatedRide) => {
        // Se foi cancelada, limpa
        if (updatedRide.status === 'cancelled') {
          setActiveRide(null);
          alert("A corrida foi cancelada pelo passageiro.");
        } else {
          // Atualiza status localmente
          setActiveRide(prev => prev ? { ...prev, ...updatedRide } : null);
        }
      });
    }
    return () => { if (unsubscribe) unsubscribe(); };
  }, [activeRide?.id]);

  useEffect(() => {
    if (showHistory && currentDriver) {
      const fetchHistory = async () => {
        const rides = await getRideHistory(currentDriver.id, 'driver');
        setHistoryRides(rides);
        const total = rides.reduce((acc, ride) => ride.status === 'completed' ? acc + ride.price : acc, 0);
        setEarnings(total);
      };
      fetchHistory();
    }
  }, [showHistory, currentDriver]);

  // Atualizar localização do motorista localmente quando GPS muda
  useEffect(() => {
    if (driverGpsLocation) {
      setCurrentDriverLocation(driverGpsLocation);
      // Atualiza também o driver local para mostrar no mapa
      if (currentDriver) {
        setCurrentDriver(prev => prev ? { ...prev, location: driverGpsLocation } : null);
      }
    }
  }, [driverGpsLocation]);

  // Enviar localização para o banco de dados durante corrida ativa
  useEffect(() => {
    if (!activeRide || !currentDriverLocation) return;

    // Limitar updates para evitar sobrecarregar o banco (máx 1x a cada 3 segundos)
    const now = Date.now();
    if (now - lastLocationUpdateRef.current < 3000) return;

    lastLocationUpdateRef.current = now;

    // Enviar localização para o Firestore/Mock
    updateDriverLocation(activeRide.id, currentDriverLocation).catch(err => {
      console.warn("Erro ao enviar localização:", err);
    });

  }, [activeRide?.id, currentDriverLocation]);

  const toggleOnline = () => {
    if (!isOnline) {
      initAudio(); // Inicializa áudio na primeira interação
      ensureNotificationPermission(); // Solicita permissão de notificação
    }
    setIsOnline(!isOnline);
  };

  // Função para rejeitar com animação de saída (descendo)
  const handleRejectRide = () => {
    setRequestAnimation('animate-fade-out-down');
    setTimeout(() => {
      setIncomingRides(prev => prev.slice(1));
      setRequestAnimation('animate-slide-in-bottom');
    }, 500); // Tempo da animação CSS
  };

  // Função para aceitar com animação de saída (direita)
  const handleAcceptRide = async (ride: RideRequest) => {
    if (!currentDriver) return;
    setProcessingId(ride.id);

    // Inicia animação de saída
    setRequestAnimation('animate-slide-out-right');

    // Aguarda animação terminar antes de processar lógica visual
    await new Promise(r => setTimeout(r, 500));

    try {
      await acceptRide(ride.id, currentDriver);
      // Som de aceitação
      playSound('rideAccepted');
      // Optimistic update
      setActiveRide({ ...ride, status: 'accepted', driver: currentDriver });
      setIncomingRides([]);
      setVerificationCode(''); // Reset code input
    } catch (error) {
      playSound('error');
      alert("Erro ao aceitar. Talvez outro motorista já tenha aceitado.");
      setRequestAnimation('animate-slide-in-bottom'); // Reseta se der erro
    } finally {
      setProcessingId(null);
    }
  };

  const handleStartRide = async () => {
    if (!activeRide) return;

    // Security Code Validation
    if (activeRide.securityCode) {
      if (verificationCode !== activeRide.securityCode) {
        playSound('error');
        alert("Código incorreto. Peça ao passageiro o código de 4 dígitos.");
        return;
      }
    }

    setProcessingId('starting');
    try {
      await startRide(activeRide.id);
      playSound('rideStarted');
    } catch (error) {
      console.error(error);
      playSound('error');
      alert("Erro ao iniciar corrida.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleFinishRide = async () => {
    if (activeRide) {
      await completeRide(activeRide.id);
      playSound('rideCompleted');
      setActiveRide(null);
      setShowChat(false);
      setVerificationCode('');
    }
  };

  // Loading State
  if (loadingProfile) {
    return (
      <div className="h-full bg-gray-900 flex items-center justify-center text-white flex-col">
        <Loader2 className="animate-spin mb-4" size={40} />
        <p>Carregando perfil...</p>
      </div>
    );
  }

  // Error State
  if (profileError || !currentDriver) {
    return (
      <div className="h-full bg-gray-900 flex flex-col items-center justify-center text-white p-6 text-center">
        <AlertCircle className="text-red-500 mb-4" size={48} />
        <h2 className="text-xl font-bold mb-2">Erro de Conexão</h2>
        <p className="text-gray-400 mb-6">{profileError || "Não foi possível carregar os dados."}</p>
        <Button onClick={loadDriverProfile} className="flex items-center gap-2">
          <RefreshCw size={20} /> Tentar Novamente
        </Button>
      </div>
    );
  }

  const currentRequest = incomingRides.length > 0 ? incomingRides[0] : null;

  if (showProfile) {
    return (
      <ProfileScreen
        user={currentDriver}
        isDriver={true}
        onBack={() => setShowProfile(false)}
        onSave={(updated) => { setCurrentDriver(updated); setShowProfile(false); }}
      />
    );
  }

  return (
    <div className="h-full bg-gray-900 flex flex-col text-white">
      {/* Header */}
      <div className="bg-gray-800 p-4 flex justify-between items-center shadow-lg z-20">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setShowProfile(true)}>
          <img src={currentDriver.avatar} className="w-10 h-10 rounded-full border border-gray-600" alt="Avatar" />
          <div>
            <h3 className="font-bold text-sm">{currentDriver.name}</h3>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <span className="bg-gray-700 px-1.5 rounded text-white font-bold">{currentDriver.rating} ★</span>
              <span className="text-[10px] ml-1">{currentDriver.vehicle}</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowHistory(true)}
          className="bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-700 flex items-center gap-2 hover:bg-gray-700 transition"
        >
          <DollarSign size={14} className="text-green-400" />
          <span className="font-bold text-green-400">{APP_CONFIG.currency} {earnings.toFixed(2)}</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative overflow-hidden">
        {!isOnline ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-gray-900 z-10">
            <div className="bg-gray-800 p-8 rounded-full mb-8 shadow-2xl border-4 border-gray-700">
              <Power size={64} className="text-gray-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Você está offline</h2>
            <Button onClick={toggleOnline} className="w-full max-w-xs text-lg py-4 bg-green-500 hover:bg-green-600 shadow-green-900/50">
              Ficar Online
            </Button>
          </div>
        ) : (
          <>
            <SimulatedMap
              showDriver={true}
              status={activeRide?.status === 'in_progress' ? "Em viagem" : activeRide ? "Indo até passageiro" : "Procurando corridas..."}
              driverLocation={currentDriver.location}
              origin={activeRide?.originCoords}
              destination={activeRide?.destinationCoords}
              showRoute={!!activeRide}
            />

            {/* Estado Procurando - Moderno */}
            {!activeRide && !currentRequest && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
                {/* Radar Animation */}
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-orange-500 rounded-full animate-ping opacity-20 duration-1000"></div>
                  <div className="absolute inset-0 bg-orange-500 rounded-full animate-ping opacity-10 duration-2000 delay-300"></div>
                  <div className="bg-white p-5 rounded-full shadow-2xl border-4 border-orange-100 relative z-10 flex items-center justify-center">
                    <Loader2 size={32} className="text-orange-500 animate-spin" />
                  </div>
                </div>

                <div className="bg-gray-900/90 backdrop-blur-md px-6 py-3 rounded-full shadow-lg border border-gray-700 text-center animate-fade-in">
                  <p className="font-bold text-white text-lg">Procurando passageiros...</p>
                  <p className="text-xs text-gray-400">Mantenha o app aberto</p>
                </div>

                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
                  <button
                    onClick={toggleOnline}
                    className="bg-red-500/90 backdrop-blur text-white px-6 py-3 rounded-full font-bold shadow-lg flex items-center gap-2 hover:bg-red-600 transition hover:scale-105 active:scale-95"
                  >
                    <Power size={18} /> Ficar Offline
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Modal de Nova Corrida (Real) */}
        {currentRequest && !activeRide && (
          <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end p-4">
            <div className={`w-full bg-gray-800 rounded-2xl p-5 shadow-2xl border border-gray-700 ${requestAnimation}`}>
              <div className="flex justify-between items-start mb-4">
                <Badge color="orange">{currentRequest.serviceType}</Badge>
                <span className="text-xl font-bold text-white">R$ {currentRequest.price.toFixed(2)}</span>
              </div>

              <div className="flex flex-col gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-green-500"></div>
                  <div>
                    <p className="text-xs text-gray-400">Origem</p>
                    <p className="font-semibold text-white">{currentRequest.origin}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                  <div>
                    <p className="text-xs text-gray-400">Destino</p>
                    <p className="font-semibold text-white">{currentRequest.destination}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 h-14">
                <Button className="flex-1 bg-gray-700" onClick={handleRejectRide}>Recusar</Button>
                <Button
                  onClick={() => handleAcceptRide(currentRequest)}
                  isLoading={processingId === currentRequest.id}
                  className="flex-[2] bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/20 animate-pulse"
                >
                  Aceitar Corrida
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* UI de Corrida em Andamento */}
        {activeRide && (
          <div className="absolute bottom-0 left-0 right-0 z-30 bg-white text-gray-900 rounded-t-3xl p-5 shadow-2xl animate-slide-up">
            {/* Info Passageiro */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 p-2 rounded-full">
                  <User size={24} className="text-orange-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{activeRide.passenger.name}</h3>
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    <Navigation size={12} /> {activeRide.status === 'in_progress' ? 'Em direção ao destino' : 'Buscando passageiro'}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowChat(true)}
                  className="bg-gray-100 p-3 rounded-full text-gray-700 hover:bg-gray-200"
                >
                  <MessageSquare size={20} />
                </button>
                <button className="bg-gray-100 p-3 rounded-full text-gray-700 hover:bg-gray-200">
                  <Phone size={20} />
                </button>
              </div>
            </div>

            {/* Ações de Controle da Corrida */}
            <div className="space-y-3">
              {activeRide.status === 'accepted' ? (
                <div className="animate-fade-in">
                  {activeRide.securityCode && (
                    <div className="mb-3">
                      <label className="text-xs font-bold text-gray-500 uppercase ml-1">Código de Segurança</label>
                      <div className="flex gap-2 mt-1">
                        <div className="relative flex-1">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                          <input
                            type="tel"
                            maxLength={4}
                            placeholder="Digite o código do passageiro"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 font-mono font-bold text-lg tracking-widest focus:ring-2 focus:ring-orange-500 outline-none"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  <Button
                    fullWidth
                    variant="primary"
                    onClick={handleStartRide}
                    isLoading={processingId === 'starting'}
                    className={activeRide.securityCode && verificationCode.length < 4 ? 'opacity-50' : ''}
                  >
                    <ArrowRight size={20} /> Iniciar Corrida
                  </Button>
                </div>
              ) : (
                <Button fullWidth variant="success" onClick={handleFinishRide}>
                  <Shield size={20} /> Finalizar Corrida
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {showHistory && (
        <div className="absolute inset-0 z-50 bg-gray-900 flex flex-col animate-slide-up">
          <div className="p-4 bg-gray-800 flex items-center justify-between shadow-md">
            <h2 className="text-xl font-bold">Extrato de Ganhos</h2>
            <button onClick={() => setShowHistory(false)} className="p-2 bg-gray-700 rounded-full text-gray-300">
              <X size={20} />
            </button>
          </div>
          <div className="p-4 flex-1 overflow-y-auto space-y-3">
            <div className="bg-gray-800 p-6 rounded-2xl mb-6 text-center border border-gray-700">
              <p className="text-gray-400 text-sm mb-1">Ganhos Totais (Simulado)</p>
              <h3 className="text-4xl font-bold text-green-400">R$ {earnings.toFixed(2)}</h3>
            </div>
            {historyRides.length === 0 ? <p className="text-gray-500 text-center py-10">Nenhuma corrida finalizada ainda.</p> : historyRides.map((ride) => <div key={ride.id} className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex justify-between items-center"><div><p className="font-bold text-white">{ride.destination}</p></div><div className="text-right"><p className="font-bold text-green-400">+ R$ {ride.price.toFixed(2)}</p></div></div>)}
          </div>
        </div>
      )}

      {showChat && activeRide && currentDriver && <ChatModal rideId={activeRide.id} currentUserId={currentDriver.id} otherUserName={activeRide.passenger.name} onClose={() => setShowChat(false)} />}
    </div>
  );
};