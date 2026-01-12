import { db, isMockMode } from './firebase';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { Driver, RideRequest } from '../types';
import { MOCK_DRIVER } from '../constants';

export interface DashboardData {
  stats: {
    totalRides: number;
    revenue: number;
    activeDrivers: number;
    pendingRides: number;
  };
  chartData: { name: string; rides: number; revenue: number }[];
  drivers: Driver[];
  recentRides: RideRequest[];
}

export const fetchDashboardData = async (): Promise<DashboardData> => {
  // MOCK DATA for Dashboard
  if (isMockMode || !db) {
      // Retornar dados falsos para demonstração
      const mockDrivers: Driver[] = [
          { ...MOCK_DRIVER, id: 'd1', name: 'Carlos Oliveira', status: 'online' },
          { ...MOCK_DRIVER, id: 'd2', name: 'Marcos Santos', status: 'busy', location: { lat: -23.1060, lng: -48.9250 } },
          { ...MOCK_DRIVER, id: 'd3', name: 'Ana Pereira', status: 'offline' }
      ];
      
      const mockRides: any[] = JSON.parse(localStorage.getItem('motoja_mock_rides') || '[]')
         .filter((r: any) => r.status === 'completed' || r.status === 'cancelled');

      const revenue = mockRides.reduce((acc, r) => acc + (r.price || 0), 0) + 1250.00; // + base mock value
      
      return {
          stats: {
              totalRides: mockRides.length + 150,
              revenue: revenue,
              activeDrivers: 2,
              pendingRides: 1
          },
          chartData: [
             { name: 'Seg', rides: 12, revenue: 240 },
             { name: 'Ter', rides: 19, revenue: 380 },
             { name: 'Qua', rides: 15, revenue: 300 },
             { name: 'Qui', rides: 22, revenue: 450 },
             { name: 'Sex', rides: 30, revenue: 600 },
             { name: 'Sab', rides: 45, revenue: 900 },
             { name: 'Dom', rides: 38, revenue: 760 },
          ],
          drivers: mockDrivers,
          recentRides: mockRides.length > 0 ? mockRides : [
             { id: '123456', origin: 'Rua A', destination: 'Rua B', price: 15.50, status: 'completed', passenger: { name: 'João' }, createdAt: Date.now() } as any
          ]
      };
  }

  try {
    let drivers: Driver[] = [];
    let rides: RideRequest[] = [];

    // 1. Fetch Drivers
    try {
      const driversQuery = query(collection(db, 'users'), where('role', '==', 'driver'));
      const driversSnap = await getDocs(driversQuery);
      drivers = driversSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Driver));
    } catch (e) { console.warn("Erro ao buscar motoristas:", e); }

    // 2. Fetch Recent Rides
    try {
      const ridesQuery = query(collection(db, 'rides'), orderBy('createdAt', 'desc'), limit(100));
      const ridesSnap = await getDocs(ridesQuery);
      rides = ridesSnap.docs.map(doc => {
        const data = doc.data();
        const createdAt = data.createdAt?.seconds ? data.createdAt.seconds * 1000 : (data.createdAt || Date.now());
        return { id: doc.id, ...data, createdAt } as RideRequest;
      });
    } catch (e) {
      console.warn("Erro ao buscar corridas:", e);
    }

    const completedRides = rides.filter(r => r.status === 'completed');
    const totalRevenue = completedRides.reduce((acc, curr) => acc + (curr.price || 0), 0);
    const activeDrivers = drivers.filter(d => d.status === 'online').length;
    const pendingRides = rides.filter(r => r.status === 'pending').length;

    // 3. Prepare Chart Data
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
    const chartMap = new Map<string, { rides: number, revenue: number }>();
    
    // Initialize map
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayName = days[d.getDay()];
      chartMap.set(dayName, { rides: 0, revenue: 0 });
    }

    completedRides.forEach(ride => {
      if (!ride.createdAt) return;
      const date = new Date(ride.createdAt);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

      if (diffDays <= 7) {
        const dayName = days[date.getDay()];
        if (chartMap.has(dayName)) {
            const current = chartMap.get(dayName)!;
            chartMap.set(dayName, {
            rides: current.rides + 1,
            revenue: current.revenue + (ride.price || 0)
            });
        }
      }
    });

    const chartData = Array.from(chartMap.entries()).map(([name, val]) => ({
      name,
      rides: val.rides,
      revenue: val.revenue
    }));

    return {
      stats: { totalRides: rides.length, revenue: totalRevenue, activeDrivers, pendingRides },
      chartData,
      drivers,
      recentRides: rides.slice(0, 10)
    };

  } catch (error) {
    console.error("Erro dashboard:", error);
    return {
      stats: { totalRides: 0, revenue: 0, activeDrivers: 0, pendingRides: 0 },
      chartData: [],
      drivers: [],
      recentRides: []
    };
  }
};