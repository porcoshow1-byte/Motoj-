import { db, isMockMode } from './firebase';
import { collection, addDoc, updateDoc, doc, onSnapshot, query, where, orderBy, serverTimestamp, limit, getDocs } from 'firebase/firestore';
import { RideRequest, ServiceType, User, Driver, Coords } from '../types';

const RIDES_COLLECTION = 'rides';
const MOCK_STORAGE_KEY = 'motoja_mock_rides';

// Helpers para Mock
const getMockRides = (): RideRequest[] => {
    try {
        return JSON.parse(localStorage.getItem(MOCK_STORAGE_KEY) || '[]');
    } catch { return []; }
};

const saveMockRides = (rides: RideRequest[]) => {
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(rides));
};

const updateMockRide = (rideId: string, updates: Partial<RideRequest>) => {
    const rides = getMockRides();
    const index = rides.findIndex(r => r.id === rideId);
    if (index !== -1) {
        rides[index] = { ...rides[index], ...updates };
        saveMockRides(rides);
    }
};

export const createRideRequest = async (
  passenger: User,
  origin: string,
  destination: string,
  originCoords: Coords | null,
  destinationCoords: Coords | null,
  serviceType: ServiceType,
  price: number,
  distance: string,
  duration: string,
  deliveryDetails?: RideRequest['deliveryDetails'],
  securityCode?: string
): Promise<string> => {
  
  if (isMockMode || !db) {
      const id = `mock_ride_${Date.now()}`;
      const newRide: any = {
          id,
          passenger,
          origin,
          destination,
          originCoords,
          destinationCoords,
          serviceType,
          price,
          distance,
          duration,
          status: 'pending',
          paymentStatus: 'pending',
          createdAt: Date.now(),
          driver: undefined,
          deliveryDetails,
          securityCode
      };
      const rides = getMockRides();
      rides.push(newRide);
      saveMockRides(rides);
      return id;
  }

  try {
    const docRef = await addDoc(collection(db, RIDES_COLLECTION), {
      passenger,
      origin,
      destination,
      originCoords,
      destinationCoords,
      serviceType,
      price,
      distance,
      duration,
      status: 'pending',
      paymentStatus: 'pending',
      createdAt: serverTimestamp(),
      driver: null,
      ...(deliveryDetails && { deliveryDetails }),
      ...(securityCode && { securityCode })
    });
    return docRef.id;
  } catch (error) {
    console.error("Erro ao criar corrida no Firestore:", error);
    throw error;
  }
};

export const subscribeToRide = (rideId: string, onUpdate: (ride: RideRequest) => void) => {
  if (isMockMode || !db) {
      const interval = setInterval(() => {
          const rides = getMockRides();
          const ride = rides.find(r => r.id === rideId);
          if (ride) onUpdate(ride);
      }, 1000);
      return () => clearInterval(interval);
  }

  return onSnapshot(doc(db, RIDES_COLLECTION, rideId), (docSnapshot) => {
    if (docSnapshot.exists()) {
      const data = docSnapshot.data() as any;
      const rideData = { 
          id: docSnapshot.id, 
          ...data,
          createdAt: data.createdAt?.seconds ? data.createdAt.seconds * 1000 : Date.now()
      };
      onUpdate(rideData);
    }
  });
};

export const subscribeToPendingRides = (onUpdate: (rides: RideRequest[]) => void) => {
  if (isMockMode || !db) {
      const interval = setInterval(() => {
          const rides = getMockRides();
          const pending = rides
            .filter(r => r.status === 'pending')
            .sort((a, b) => b.createdAt - a.createdAt);
          onUpdate(pending);
      }, 1000);
      return () => clearInterval(interval);
  }

  const q = query(
    collection(db, RIDES_COLLECTION),
    where("status", "==", "pending")
  );

  return onSnapshot(q, (querySnapshot) => {
    const rides: RideRequest[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      rides.push({ 
          id: doc.id, 
          ...data,
          createdAt: data.createdAt?.seconds ? data.createdAt.seconds * 1000 : Date.now()
      } as RideRequest);
    });
    
    rides.sort((a, b) => b.createdAt - a.createdAt);
    onUpdate(rides.slice(0, 20));
  });
};

export const getRideHistory = async (userId: string, role: 'passenger' | 'driver'): Promise<RideRequest[]> => {
  if (isMockMode || !db) {
      const rides = getMockRides();
      return rides.filter(r => {
          if (role === 'passenger') return r.passenger.id === userId;
          return r.driver?.id === userId;
      }).sort((a,b) => b.createdAt - a.createdAt);
  }

  try {
    const q = query(
      collection(db, RIDES_COLLECTION),
      where(role === 'passenger' ? 'passenger.id' : 'driver.id', '==', userId)
    );

    const querySnapshot = await getDocs(q);
    const rides: RideRequest[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (['completed', 'cancelled'].includes(data.status)) {
         rides.push({ 
           id: doc.id, 
           ...data,
           createdAt: data.createdAt?.seconds ? data.createdAt.seconds * 1000 : Date.now()
         } as RideRequest);
      }
    });

    rides.sort((a, b) => b.createdAt - a.createdAt);
    return rides.slice(0, 50);
  } catch (error) {
    console.error("Erro ao buscar histórico:", error);
    return [];
  }
};

export const acceptRide = async (rideId: string, driver: Driver) => {
  if (isMockMode || !db) {
      updateMockRide(rideId, { status: 'accepted', driver });
      return;
  }
  const rideRef = doc(db, RIDES_COLLECTION, rideId);
  await updateDoc(rideRef, {
    status: 'accepted',
    driver: driver,
    acceptedAt: serverTimestamp()
  });
};

export const startRide = async (rideId: string) => {
  if (isMockMode || !db) {
      updateMockRide(rideId, { status: 'in_progress' });
      return;
  }
  const rideRef = doc(db, RIDES_COLLECTION, rideId);
  await updateDoc(rideRef, {
    status: 'in_progress',
    startedAt: serverTimestamp()
  });
};

export const markRideAsPaid = async (rideId: string) => {
  if (isMockMode || !db) {
      updateMockRide(rideId, { paymentStatus: 'completed' });
      return;
  }
  const rideRef = doc(db, RIDES_COLLECTION, rideId);
  await updateDoc(rideRef, {
    paymentStatus: 'completed'
  });
};

export const completeRide = async (rideId: string) => {
  if (isMockMode || !db) {
      updateMockRide(rideId, { status: 'completed' });
      return;
  }
  const rideRef = doc(db, RIDES_COLLECTION, rideId);
  await updateDoc(rideRef, {
    status: 'completed',
    completedAt: serverTimestamp()
  });
};

export const cancelRide = async (rideId: string) => {
  if (isMockMode || !db) {
      updateMockRide(rideId, { status: 'cancelled' });
      return;
  }
  const rideRef = doc(db, RIDES_COLLECTION, rideId);
  await updateDoc(rideRef, {
    status: 'cancelled',
    cancelledAt: serverTimestamp()
  });
};