import React, { useState } from 'react';
import { User as UserIcon, Phone, Car, Save, ArrowLeft, Camera } from 'lucide-react';
import { Button, Input, Card } from '../components/UI';
import { User, Driver } from '../types';
import { updateUserProfile } from '../services/user';

interface ProfileScreenProps {
  user: User | Driver;
  isDriver: boolean;
  onBack: () => void;
  onSave: (updatedUser: any) => void;
}

export const ProfileScreen = ({ user, isDriver, onBack, onSave }: ProfileScreenProps) => {
  const [formData, setFormData] = useState({
    name: user.name,
    phone: user.phone || '',
    vehicle: isDriver ? (user as Driver).vehicle : '',
    plate: isDriver ? (user as Driver).plate : '',
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateUserProfile(user.id, formData);
      onSave({ ...user, ...formData });
    } catch (error) {
      alert("Erro ao salvar perfil.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full bg-gray-50 flex flex-col animate-fade-in">
      {/* Header */}
      <div className="bg-white p-4 shadow-sm sticky top-0 z-10 flex items-center gap-3">
        <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full text-gray-700">
           <ArrowLeft size={24} />
        </button>
        <h2 className="text-xl font-bold text-gray-800">Meu Perfil</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col items-center mb-8 mt-4">
          <div className="relative">
            <img 
              src={user.avatar} 
              alt="Avatar" 
              className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover"
            />
            <button className="absolute bottom-0 right-0 bg-orange-500 text-white p-2 rounded-full shadow-md hover:bg-orange-600">
              <Camera size={16} />
            </button>
          </div>
          <p className="mt-3 text-gray-500 text-sm">Toque para alterar foto</p>
        </div>

        <Card className="space-y-4 p-6">
          <h3 className="font-bold text-gray-800 mb-2">Dados Pessoais</h3>
          
          <Input 
            label="Nome Completo"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            icon={<UserIcon size={18} />}
            placeholder="Seu nome"
          />

          <Input 
            label="Telefone / WhatsApp"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            icon={<Phone size={18} />}
            placeholder="(00) 00000-0000"
          />

          {isDriver && (
            <>
              <div className="my-6 border-t border-gray-100"></div>
              <h3 className="font-bold text-gray-800 mb-2">Dados do Veículo</h3>
              
              <Input 
                label="Modelo da Moto"
                value={formData.vehicle}
                onChange={(e) => setFormData({...formData, vehicle: e.target.value})}
                icon={<Car size={18} />}
                placeholder="Ex: Honda CG 160 Titan"
              />

              <Input 
                label="Placa"
                value={formData.plate}
                onChange={(e) => setFormData({...formData, plate: e.target.value})}
                icon={<div className="font-bold text-xs border border-gray-400 rounded px-0.5">ABC</div>}
                placeholder="ABC-1234"
              />
            </>
          )}

          <div className="pt-4">
            <Button fullWidth onClick={handleSave} isLoading={loading}>
              <Save size={20} /> Salvar Alterações
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};