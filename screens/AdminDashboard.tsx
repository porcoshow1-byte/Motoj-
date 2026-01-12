import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, Bike, Settings, FileText, Bell, Search, 
  TrendingUp, MoreVertical, LogOut, Map, Filter, ChevronDown, ArrowUpDown, 
  Loader2, RefreshCcw, AlertTriangle, Download, Calendar, CheckSquare, Square,
  X, Phone, Car, Star, Shield
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, ResponsiveContainer } from 'recharts';
import { Card, Button, Badge, Input } from '../components/UI';
import { fetchDashboardData, DashboardData } from '../services/admin';
import { SimulatedMap } from '../components/SimulatedMap';
import { Driver, RideRequest } from '../types';

export const RechartsWrapper = ({ children }: { children?: React.ReactNode }) => (
    <div style={{ width: '100%', height: 300 }}>
       <ResponsiveContainer width="100%" height="100%">
         {children as any}
       </ResponsiveContainer>
    </div>
);

const SimpleTooltip = ({ content, children }: { content: string, children?: React.ReactNode }) => (
  <div className="relative group flex items-center justify-center">
    {children}
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-md">
      {content}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
    </div>
  </div>
);

// --- Subcomponent: Driver Details Modal ---
const DriverDetailModal = ({ driver, onClose }: { driver: Driver, onClose: () => void }) => {
  if (!driver) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-slide-up">
         <div className="bg-gray-900 p-6 flex justify-between items-start text-white">
            <div className="flex items-center gap-4">
               <img src={driver.avatar} className="w-16 h-16 rounded-full border-2 border-white object-cover" />
               <div>
                  <h2 className="text-xl font-bold">{driver.name}</h2>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                     <span className="flex items-center gap-1"><Star size={12} className="text-yellow-400 fill-current" /> {driver.rating}</span>
                     <span>•</span>
                     <span className="capitalize">{driver.status}</span>
                  </div>
               </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full transition"><X size={20} /></button>
         </div>
         
         <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <p className="text-xs text-gray-500 uppercase mb-1">Veículo</p>
                  <div className="flex items-center gap-2">
                     <Car size={16} className="text-orange-500" />
                     <div>
                        <p className="font-bold text-gray-800">{driver.plate}</p>
                        <p className="text-xs text-gray-500">{driver.vehicle}</p>
                     </div>
                  </div>
               </div>
               <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <p className="text-xs text-gray-500 uppercase mb-1">Contato</p>
                  <div className="flex items-center gap-2">
                     <Phone size={16} className="text-green-500" />
                     <p className="font-bold text-gray-800">{driver.phone || "N/A"}</p>
                  </div>
               </div>
            </div>

            <div>
               <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><FileText size={18}/> Histórico Recente</h3>
               <div className="space-y-2">
                  <div className="flex justify-between text-sm p-2 bg-gray-50 rounded-lg">
                     <span>Faturamento Hoje</span>
                     <span className="font-bold text-green-600">R$ {driver.earningsToday?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm p-2 bg-gray-50 rounded-lg">
                     <span>Status da Conta</span>
                     <span className="text-green-600 font-medium flex items-center gap-1"><Shield size={12}/> Ativa</span>
                  </div>
               </div>
            </div>
            
            <div className="flex gap-3 pt-2">
               <Button fullWidth variant="outline" onClick={onClose}>Fechar</Button>
               <Button fullWidth variant="danger">Bloquear Motorista</Button>
            </div>
         </div>
      </div>
    </div>
  );
};

export const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  
  // Dashboard Date Filter
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Drivers Tab State
  const [filterStatus, setFilterStatus] = useState<'all' | 'online' | 'offline' | 'busy'>('all');
  const [sortField, setSortField] = useState<'name' | 'rating'>('name');
  const [selectedDriverIds, setSelectedDriverIds] = useState<string[]>([]);
  const [viewDriver, setViewDriver] = useState<Driver | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchDashboardData();
      setDashboardData(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const SidebarItem = ({ id, icon, label }: { id: string, icon: React.ReactNode, label: string }) => (
    <div 
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all mb-1 ${activeTab === id ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </div>
  );

  if (loading && !dashboardData) {
    return <div className="h-screen flex items-center justify-center bg-gray-50 text-orange-500"><Loader2 size={48} className="animate-spin" /></div>;
  }

  // Fallback se não houver dados
  const safeData: DashboardData = dashboardData || {
      stats: { totalRides: 0, revenue: 0, activeDrivers: 0, pendingRides: 0 },
      chartData: [],
      drivers: [],
      recentRides: []
  };

  // --- Logic for Filters & Actions ---

  // 1. Date Filtering for Recent Rides
  const filteredRides = safeData.recentRides.filter(ride => {
    if (!ride.createdAt) return true;
    const rideDate = new Date(ride.createdAt);
    
    // Reset hours for comparison
    const start = startDate ? new Date(startDate) : null;
    if(start) start.setHours(0,0,0,0);

    const end = endDate ? new Date(endDate) : null;
    if(end) end.setHours(23,59,59,999);

    if (start && rideDate < start) return false;
    if (end && rideDate > end) return false;
    return true;
  });

  // 2. Driver Filtering & Sorting
  const filteredDrivers = safeData.drivers
    .filter(d => filterStatus === 'all' || d.status === filterStatus)
    .sort((a, b) => {
        if (sortField === 'name') return a.name.localeCompare(b.name);
        return b.rating - a.rating; // Descending for rating
    });

  // 3. Bulk Selection Logic
  const handleSelectAll = () => {
    if (selectedDriverIds.length === filteredDrivers.length) {
      setSelectedDriverIds([]);
    } else {
      setSelectedDriverIds(filteredDrivers.map(d => d.id));
    }
  };

  const handleSelectDriver = (id: string) => {
    if (selectedDriverIds.includes(id)) {
      setSelectedDriverIds(selectedDriverIds.filter(sid => sid !== id));
    } else {
      setSelectedDriverIds([...selectedDriverIds, id]);
    }
  };

  const handleBulkAction = (action: 'approve' | 'block') => {
    alert(`${action === 'approve' ? 'Aprovando' : 'Bloqueando'} ${selectedDriverIds.length} motoristas.`);
    // Here you would call an API function
    setSelectedDriverIds([]);
  };

  // 4. Export Functionality
  const handleExport = (type: 'csv' | 'pdf') => {
    if (type === 'pdf') {
       alert("Exportação PDF iniciada (simulado).");
       return;
    }
    
    // Simple CSV implementation
    const headers = ["ID", "Passageiro", "Origem", "Destino", "Valor", "Status", "Data"];
    const rows = safeData.recentRides.map(r => [
      r.id, 
      r.passenger.name, 
      `"${r.origin}"`, 
      `"${r.destination}"`, 
      r.price.toFixed(2), 
      r.status, 
      new Date(r.createdAt).toLocaleDateString()
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `relatorio_corridas_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {viewDriver && <DriverDetailModal driver={viewDriver} onClose={() => setViewDriver(null)} />}

      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white flex flex-col shadow-2xl z-20 hidden md:flex">
        <div className="p-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span className="text-orange-500">Moto</span>Já
          </h1>
          <p className="text-gray-500 text-xs mt-1">Painel Administrativo v1.0</p>
        </div>
        
        <div className="flex-1 px-4 overflow-y-auto no-scrollbar">
          <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-3 px-2">Principal</p>
          <SidebarItem id="dashboard" icon={<LayoutDashboard size={20} />} label="Visão Geral" />
          <SidebarItem id="live_map" icon={<Map size={20} />} label="Mapa ao Vivo" />
          
          <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-3 mt-6 px-2">Gestão</p>
          <SidebarItem id="drivers" icon={<Bike size={20} />} label="Pilotos" />
          <SidebarItem id="users" icon={<Users size={20} />} label="Passageiros" />
          <SidebarItem id="reports" icon={<FileText size={20} />} label="Relatórios" />
          
          <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-3 mt-6 px-2">Configuração</p>
          <SidebarItem id="settings" icon={<Settings size={20} />} label="Ajustes" />
        </div>

        <div className="p-4 border-t border-gray-800">
           <div 
             className="flex items-center gap-3 cursor-pointer hover:bg-gray-800 p-2 rounded-lg transition"
             onClick={() => window.location.reload()}
           >
             <img src="https://ui-avatars.com/api/?background=random&color=fff&name=Admin" className="w-8 h-8 rounded-full" alt="Admin" />
             <div className="flex-1">
               <p className="text-sm font-bold">Admin</p>
               <p className="text-xs text-gray-500">Sair do Sistema</p>
             </div>
             <LogOut size={16} className="text-gray-500" />
           </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Navbar */}
        <div className="bg-white h-16 border-b border-gray-200 flex items-center justify-between px-6 z-10">
          <h2 className="text-xl font-bold text-gray-800 capitalize flex items-center gap-2">
            {activeTab.replace('_', ' ')}
            {loading && <Loader2 size={16} className="animate-spin text-orange-500" />}
          </h2>
          <div className="flex items-center gap-4">
             <div className="relative hidden md:block">
               <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
               <input className="pl-10 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm w-64 focus:ring-2 focus:ring-orange-500 outline-none" placeholder="Buscar..." />
             </div>
             <button onClick={loadData} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full" title="Atualizar dados">
                <RefreshCcw size={20} />
             </button>
             <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full">
               <Bell size={20} />
               <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
             </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {!dashboardData && !loading ? (
             <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <AlertTriangle size={64} className="mb-4 text-orange-200" />
                <h3 className="text-xl font-medium text-gray-600">Erro ao carregar dados</h3>
                <p className="text-sm mb-4">Verifique sua conexão ou se o banco de dados está vazio.</p>
                <Button onClick={loadData}>Tentar Novamente</Button>
             </div>
          ) : activeTab === 'dashboard' ? (
            <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="p-6 border-l-4 border-l-orange-500">
                   <div className="flex justify-between items-start">
                      <div>
                        <p className="text-gray-500 text-sm font-medium">Corridas Totais</p>
                        <h3 className="text-3xl font-bold text-gray-900 mt-1">{safeData.stats.totalRides}</h3>
                      </div>
                      <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                        <Bike size={24} />
                      </div>
                   </div>
                </Card>

                <Card className="p-6 border-l-4 border-l-blue-500">
                   <div className="flex justify-between items-start">
                      <div>
                        <p className="text-gray-500 text-sm font-medium">Receita Total</p>
                        <h3 className="text-3xl font-bold text-gray-900 mt-1">R$ {safeData.stats.revenue.toFixed(2)}</h3>
                      </div>
                      <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                        <DollarSign />
                      </div>
                   </div>
                </Card>

                <Card className="p-6 border-l-4 border-l-green-500">
                   <div className="flex justify-between items-start">
                      <div>
                        <p className="text-gray-500 text-sm font-medium">Pilotos Online</p>
                        <h3 className="text-3xl font-bold text-gray-900 mt-1">{safeData.stats.activeDrivers}</h3>
                      </div>
                      <div className="bg-green-100 p-2 rounded-lg text-green-600">
                        <Users size={24} />
                      </div>
                   </div>
                </Card>

                <Card className="p-6 border-l-4 border-l-red-500">
                   <div className="flex justify-between items-start">
                      <div>
                        <p className="text-gray-500 text-sm font-medium">Pendentes</p>
                        <h3 className="text-3xl font-bold text-gray-900 mt-1">{safeData.stats.pendingRides}</h3>
                      </div>
                      <div className="bg-red-100 p-2 rounded-lg text-red-600">
                        <FileText size={24} />
                      </div>
                   </div>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <Card className="p-6">
                    <h3 className="text-lg font-bold mb-6">Volume de Corridas (7 dias)</h3>
                    <RechartsWrapper>
                      <BarChart data={safeData.chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                        <Bar dataKey="rides" fill="#f97316" radius={[4, 4, 0, 0]} barSize={30} />
                      </BarChart>
                    </RechartsWrapper>
                 </Card>

                 <Card className="p-6">
                    <h3 className="text-lg font-bold mb-6">Faturamento (R$)</h3>
                    <RechartsWrapper>
                      <LineChart data={safeData.chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                        <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                      </LineChart>
                    </RechartsWrapper>
                 </Card>
              </div>

              {/* Recent Activity Table with Date Filters */}
              <Card className="overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <h3 className="text-lg font-bold">Corridas Recentes</h3>
                  
                  {/* Date Filter Inputs */}
                  <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                         <Calendar size={16} />
                         <span>De:</span>
                         <input type="date" className="bg-transparent border-none outline-none text-xs" value={startDate} onChange={e => setStartDate(e.target.value)} />
                      </div>
                      <div className="w-px h-4 bg-gray-300"></div>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                         <span>Até:</span>
                         <input type="date" className="bg-transparent border-none outline-none text-xs" value={endDate} onChange={e => setEndDate(e.target.value)} />
                      </div>
                      {(startDate || endDate) && (
                          <button onClick={() => { setStartDate(''); setEndDate(''); }} className="text-red-500 hover:bg-red-50 p-1 rounded">
                             <X size={14} />
                          </button>
                      )}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-gray-900 font-semibold">
                      <tr>
                        <th className="p-4">ID</th>
                        <th className="p-4">Origem &rarr; Destino</th>
                        <th className="p-4">Passageiro</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Valor</th>
                        <th className="p-4">Data</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredRides.length === 0 ? (
                        <tr><td colSpan={6} className="p-4 text-center text-gray-400">Nenhuma corrida encontrada no período.</td></tr>
                      ) : (
                        filteredRides.map((ride) => (
                          <tr key={ride.id} className="hover:bg-gray-50 transition">
                            <td className="p-4 font-mono text-xs">#{ride.id.substring(0, 6)}</td>
                            <td className="p-4">
                               <div className="max-w-[200px] truncate" title={`${ride.origin} -> ${ride.destination}`}>
                                 {ride.origin.split(',')[0]} &rarr; {ride.destination.split(',')[0]}
                               </div>
                            </td>
                            <td className="p-4 flex items-center gap-2">
                               <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden">
                                 <img src={ride.passenger?.avatar || `https://ui-avatars.com/api/?name=${ride.passenger?.name || 'U'}`} alt="" className="w-full h-full object-cover"/>
                               </div>
                               <span>{ride.passenger?.name?.split(' ')[0] || 'Usuario'}</span>
                            </td>
                            <td className="p-4">
                              <Badge color={
                                ride.status === 'completed' ? 'green' : 
                                ride.status === 'cancelled' ? 'red' : 
                                ride.status === 'in_progress' ? 'blue' : 'orange'
                              }>
                                {ride.status === 'completed' ? 'Concluído' : 
                                 ride.status === 'cancelled' ? 'Cancelado' :
                                 ride.status === 'in_progress' ? 'Em andamento' : 'Pendente'}
                              </Badge>
                            </td>
                            <td className="p-4 font-bold text-gray-900">R$ {ride.price?.toFixed(2)}</td>
                            <td className="p-4 text-xs text-gray-400">
                              {ride.createdAt ? new Date(ride.createdAt).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit'}) : '-'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          ) : activeTab === 'live_map' ? (
             <div className="h-full rounded-2xl overflow-hidden shadow-2xl relative border border-gray-200 animate-fade-in">
                <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur p-4 rounded-xl shadow-lg border-l-4 border-green-500 max-w-xs">
                   <h3 className="font-bold text-gray-900 mb-1">Mapa ao Vivo</h3>
                   <p className="text-sm text-gray-500 mb-3">Monitorando {safeData.drivers.filter(d => d.status === 'online').length} pilotos online em tempo real.</p>
                   <div className="flex gap-2">
                      <div className="flex items-center gap-1 text-xs"><div className="w-2 h-2 rounded-full bg-green-500"></div> Online</div>
                      <div className="flex items-center gap-1 text-xs"><div className="w-2 h-2 rounded-full bg-gray-400"></div> Offline</div>
                   </div>
                </div>
                <SimulatedMap drivers={safeData.drivers} />
             </div>
          ) : activeTab === 'drivers' ? (
            <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
               <div className="flex justify-between items-center">
                 <h2 className="text-2xl font-bold text-gray-800">Gerenciar Pilotos</h2>
                 <Button className="py-2">Adicionar Novo</Button>
               </div>

               <Card className="p-6">
                 {/* Filters */}
                 <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between">
                    <div className="flex gap-2">
                       <SimpleTooltip content="Filtrar por Status">
                          <div className="relative">
                            <Filter className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <select 
                              className="pl-10 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg appearance-none outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
                              value={filterStatus}
                              onChange={(e) => setFilterStatus(e.target.value as any)}
                            >
                              <option value="all">Todos os Status</option>
                              <option value="online">Online</option>
                              <option value="busy">Ocupado</option>
                              <option value="offline">Offline</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-3 text-gray-400 pointer-events-none" size={14} />
                          </div>
                       </SimpleTooltip>
                    </div>
                 </div>
                 
                 {/* Bulk Actions Bar */}
                 {selectedDriverIds.length > 0 && (
                    <div className="bg-orange-50 border border-orange-200 p-3 rounded-xl mb-4 flex items-center justify-between animate-fade-in">
                       <span className="text-sm text-orange-800 font-bold ml-2">{selectedDriverIds.length} selecionados</span>
                       <div className="flex gap-2">
                          <Button variant="outline" className="py-1 px-3 h-8 text-xs bg-white" onClick={() => setSelectedDriverIds([])}>Cancelar</Button>
                          <Button variant="danger" className="py-1 px-3 h-8 text-xs" onClick={() => handleBulkAction('block')}>Bloquear</Button>
                          <Button variant="success" className="py-1 px-3 h-8 text-xs" onClick={() => handleBulkAction('approve')}>Aprovar</Button>
                       </div>
                    </div>
                 )}

                 {/* Table */}
                 <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600 min-w-[800px]">
                      <thead className="bg-gray-50 text-gray-900 font-semibold border-b border-gray-200">
                        <tr>
                          <th className="p-4 w-10">
                            <button onClick={handleSelectAll} className="text-gray-400 hover:text-orange-500">
                               {selectedDriverIds.length === filteredDrivers.length && filteredDrivers.length > 0 ? <CheckSquare size={20} className="text-orange-500" /> : <Square size={20} />}
                            </button>
                          </th>
                          {/* Coluna Nome com Ordenação */}
                          <th 
                             className={`p-4 whitespace-nowrap cursor-pointer hover:bg-gray-100 transition rounded-lg ${sortField === 'name' ? 'text-orange-600' : ''}`}
                             onClick={() => setSortField('name')}
                          >
                             <div className="flex items-center gap-1">
                                Piloto <ArrowUpDown size={14} />
                             </div>
                          </th>
                          <th className="p-4 whitespace-nowrap">Status</th>
                          {/* Coluna Avaliação com Ordenação */}
                          <th 
                            className={`p-4 flex items-center gap-1 cursor-pointer hover:bg-gray-100 transition rounded-lg whitespace-nowrap ${sortField === 'rating' ? 'text-orange-600' : ''}`} 
                            onClick={() => setSortField('rating')}
                          >
                            Avaliação <ArrowUpDown size={14} />
                          </th>
                          <th className="p-4 whitespace-nowrap">Ganhos Hoje</th>
                          <th className="p-4 whitespace-nowrap">Placa / Veículo</th>
                          <th className="p-4 text-right whitespace-nowrap">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredDrivers.map((driver) => (
                          <tr key={driver.id} className={`hover:bg-gray-50 transition group cursor-pointer ${selectedDriverIds.includes(driver.id) ? 'bg-orange-50' : ''}`} onClick={() => setViewDriver(driver)}>
                            <td className="p-4" onClick={(e) => { e.stopPropagation(); handleSelectDriver(driver.id); }}>
                                {selectedDriverIds.includes(driver.id) ? <CheckSquare size={20} className="text-orange-500" /> : <Square size={20} className="text-gray-300" />}
                            </td>
                            <td className="p-4 whitespace-nowrap">
                               <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold shrink-0 overflow-hidden">
                                   {driver.avatar ? <img src={driver.avatar} className="w-full h-full object-cover"/> : driver.name.charAt(0)}
                                 </div>
                                 <div>
                                   <p className="font-semibold text-gray-900">{driver.name}</p>
                                   <p className="text-xs text-gray-400">ID: {driver.id.substring(0,8)}...</p>
                                 </div>
                               </div>
                            </td>
                            <td className="p-4 whitespace-nowrap">
                               <Badge color={driver.status === 'online' ? 'green' : driver.status === 'busy' ? 'orange' : 'gray'}>
                                 {driver.status === 'online' ? 'Online' : driver.status === 'busy' ? 'Em corrida' : 'Offline'}
                               </Badge>
                            </td>
                            <td className="p-4 whitespace-nowrap">
                               <div className="flex items-center gap-1 font-medium text-gray-900">
                                 <span className="text-yellow-500">★</span> {driver.rating}
                               </div>
                            </td>
                            <td className="p-4 font-mono text-gray-900 whitespace-nowrap">R$ {driver.earningsToday?.toFixed(2) || '0.00'}</td>
                            <td className="p-4 whitespace-nowrap text-xs">
                              <span className="font-bold block">{driver.plate}</span>
                              <span className="text-gray-400">{driver.vehicle}</span>
                            </td>
                            <td className="p-4 text-right whitespace-nowrap">
                              <button className="p-2 hover:bg-gray-200 rounded-full transition text-gray-400 hover:text-gray-600">
                                <MoreVertical size={18} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredDrivers.length === 0 && (
                      <div className="p-8 text-center text-gray-500">
                        Nenhum piloto encontrado com os filtros atuais.
                      </div>
                    )}
                 </div>
               </Card>
            </div>
          ) : activeTab === 'reports' ? (
             <div className="max-w-4xl mx-auto animate-fade-in">
                <div className="flex justify-between items-center mb-6">
                   <h2 className="text-2xl font-bold text-gray-800">Relatórios & Exportação</h2>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                   <Card className="p-6">
                      <div className="bg-orange-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                         <FileText className="text-orange-600" />
                      </div>
                      <h3 className="text-lg font-bold mb-2">Relatório de Corridas</h3>
                      <p className="text-gray-500 text-sm mb-6">Exporte o histórico completo de corridas, incluindo valores, rotas e status em formato CSV para análise em planilhas.</p>
                      <Button onClick={() => handleExport('csv')} className="w-full flex items-center justify-center gap-2">
                         <Download size={18} /> Baixar CSV
                      </Button>
                   </Card>

                   <Card className="p-6">
                      <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                         <TrendingUp className="text-blue-600" />
                      </div>
                      <h3 className="text-lg font-bold mb-2">Fechamento Financeiro</h3>
                      <p className="text-gray-500 text-sm mb-6">Gere um PDF com o resumo financeiro, comissões de motoristas e faturamento da plataforma.</p>
                      <Button variant="secondary" onClick={() => handleExport('pdf')} className="w-full flex items-center justify-center gap-2">
                         <FileText size={18} /> Gerar PDF
                      </Button>
                   </Card>
                </div>
             </div>
          ) : (
             <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Settings size={64} className="mb-4 text-gray-200" />
                <h3 className="text-xl font-medium text-gray-500">Módulo em desenvolvimento</h3>
                <p className="text-sm">Esta tela faz parte do protótipo completo.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
  
  function DollarSign({ size = 24 }: { size?: number }) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
      )
  }
};