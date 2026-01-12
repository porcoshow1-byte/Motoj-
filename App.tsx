import React, { useState } from 'react';
import { UserApp } from './screens/UserApp';
import { DriverApp } from './screens/DriverApp';
import { AdminDashboard } from './screens/AdminDashboard';
import { AuthScreen } from './screens/AuthScreen';
import { LandingPage } from './screens/LandingPage';
import { Role } from './types';
import { Smartphone, LayoutDashboard, Bike, ArrowLeft, ArrowRight } from 'lucide-react';
import { APP_CONFIG } from './constants';
import { AuthProvider, useAuth } from './context/AuthContext';

const Main = () => {
  const [currentRole, setCurrentRole] = useState<Role>(() => {
    const saved = localStorage.getItem('motoja_role');
    return (saved as Role) || 'landing';
  });
  const { user } = useAuth(); // Pega o usuário do contexto

  // Persist role selection
  React.useEffect(() => {
    localStorage.setItem('motoja_role', currentRole);
  }, [currentRole]);

  // 1. Landing Page (Estado Inicial)
  if (currentRole === 'landing') {
    return <LandingPage onStartDemo={() => setCurrentRole('selection')} />;
  }

  // Se o usuário selecionou um papel (ex: passageiro) mas NÃO está logado, mostra Login
  if (currentRole !== 'selection' && !user) {
    return (
      <AuthScreen 
        role={currentRole} 
        onLoginSuccess={() => {}} // O AuthContext vai atualizar automaticamente o user
        onBack={() => setCurrentRole('selection')} 
      />
    );
  }

  // Se está logado e selecionou passageiro
  if (currentRole === 'user' && user) {
    return <UserApp />;
  }

  // Se está logado e selecionou motorista
  if (currentRole === 'driver' && user) {
    return <DriverApp />;
  }

  // Admin (por enquanto sem login para facilitar o teste, ou poderia exigir login também)
  if (currentRole === 'admin') {
    return <AdminDashboard />;
  }

  // Tela Inicial (Seleção)
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute top-6 left-6 z-10">
         <button 
           onClick={() => setCurrentRole('landing')} 
           className="text-white/80 hover:text-white flex items-center gap-2 font-medium bg-black/20 px-4 py-2 rounded-full hover:bg-black/30 transition"
         >
           <ArrowLeft size={20} /> Voltar ao Site
         </button>
      </div>

      <div className="max-w-4xl w-full">
        <div className="text-center text-white mb-12 animate-slide-up">
          <h1 className="text-5xl font-bold mb-4">{APP_CONFIG.name}</h1>
          <p className="text-xl opacity-90">Demonstração Interativa da Plataforma</p>
          <div className="mt-4 inline-block bg-white/20 backdrop-blur-md px-4 py-1 rounded-full text-sm font-medium border border-white/30">
             Ambiente de Teste • v1.0.0
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up" style={{animationDelay: '0.2s'}}>
          <RoleCard 
            title="Passageiro" 
            description="Solicitar mototáxi e entregas."
            icon={<Smartphone size={40} />}
            onClick={() => setCurrentRole('user')}
          />
          <RoleCard 
            title="Piloto" 
            description="Receber corridas e lucrar."
            icon={<Bike size={40} />}
            onClick={() => setCurrentRole('driver')}
          />
          <RoleCard 
            title="Painel Admin" 
            description="Gestão da plataforma."
            icon={<LayoutDashboard size={40} />}
            onClick={() => setCurrentRole('admin')}
          />
        </div>
        
        {user && (
           <div className="mt-8 text-center animate-fade-in">
             <p className="text-white/80 text-sm mb-2">Logado como: {user.email}</p>
             <button 
               onClick={() => window.location.reload()} // Simples reload para "Sair" neste MVP
               className="text-white underline text-sm"
             >
               Sair / Trocar conta
             </button>
           </div>
        )}
      </div>
    </div>
  );
};

// Envolvemos o App inteiro no AuthProvider
const App = () => {
  return (
    <AuthProvider>
      <Main />
    </AuthProvider>
  );
};

const RoleCard = ({ title, description, icon, onClick }: { title: string, description: string, icon: React.ReactNode, onClick: () => void }) => (
  <div 
    onClick={onClick}
    className="bg-white rounded-3xl p-8 cursor-pointer hover:-translate-y-2 transition-all duration-300 shadow-xl group relative overflow-hidden"
  >
    <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-bl-[100px] -mr-4 -mt-4 z-0 transition-transform group-hover:scale-110"></div>
    <div className="relative z-10">
        <div className="bg-orange-100 w-16 h-16 rounded-2xl flex items-center justify-center text-orange-600 mb-6 group-hover:bg-orange-500 group-hover:text-white transition-colors shadow-sm">
        {icon}
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-500 leading-relaxed mb-4">{description}</p>
        <div className="mt-auto flex items-center text-orange-600 font-bold group-hover:translate-x-2 transition-transform">
        Acessar <ArrowRight size={18} className="ml-2"/>
        </div>
    </div>
  </div>
);

export default App;