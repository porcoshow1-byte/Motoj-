import React from 'react';
import { ArrowLeft, Star, Heart, Trash2, User } from 'lucide-react';
import { Button } from '../components/UI';

// Mock Driver Data for display (In a real app, this would come from an API)
const MOCK_ALL_DRIVERS = [
    { id: 'd1', name: 'João Silva', rating: 4.8, avatar: '', vehicle: 'Honda CG 160' },
    { id: 'd2', name: 'Maria Oliveira', rating: 4.9, avatar: '', vehicle: 'Yamaha Fazer 250' },
    { id: 'd3', name: 'Carlos Pereira', rating: 4.7, avatar: '', vehicle: 'Honda Biz' },
    { id: 'mock_driver_1', name: 'João da Silva', rating: 4.8, avatar: 'https://i.pravatar.cc/150?img=11', vehicle: 'Honda CG 160 Titan' }, // Matches MOCK_DRIVER constant
];

interface FavoriteDriversScreenProps {
    favoriteDriverIds: string[];
    onBack: () => void;
    onRemoveFavorite: (driverId: string) => void;
}

export const FavoriteDriversScreen: React.FC<FavoriteDriversScreenProps> = ({ favoriteDriverIds, onBack, onRemoveFavorite }) => {

    // Filter drivers that are in the favorites list
    const favoriteDrivers = MOCK_ALL_DRIVERS.filter(d => favoriteDriverIds.includes(d.id));

    // If we have IDs but no matching mock data, create placeholders (fallback)
    // This handles the case where we just favorited a "random" driver ID not in our static list
    favoriteDriverIds.forEach(id => {
        if (!favoriteDrivers.find(d => d.id === id)) {
            favoriteDrivers.push({
                id,
                name: 'Motorista Desconhecido',
                rating: 5.0,
                avatar: '',
                vehicle: 'Moto'
            });
        }
    });

    return (
        <div className="h-full bg-gray-50 flex flex-col animate-fade-in font-sans">
            {/* Header */}
            <div className="bg-white p-4 shadow-sm z-10 flex items-center gap-3">
                <button onClick={onBack} className="p-2 -ml-2 text-gray-700 hover:bg-gray-100 rounded-full">
                    <ArrowLeft size={24} />
                </button>
                <h2 className="text-xl font-bold text-gray-800">Mototaxistas favoritos</h2>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
                {favoriteDrivers.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center -mt-10">
                        <div className="relative mb-6">
                            <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                                <User size={64} className="text-gray-400 translate-y-2" />
                            </div>
                            <div className="absolute top-0 right-0 bg-white p-2 rounded-full shadow-md">
                                <Heart size={24} className="text-gray-300 fill-gray-300" />
                            </div>
                        </div>

                        <h3 className="text-gray-500 font-bold text-lg max-w-xs mx-auto">
                            Você ainda não favoritou nenhum mototaxista
                        </h3>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {favoriteDrivers.map(driver => (
                            <div key={driver.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <img
                                        src={driver.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(driver.name)}&background=random`}
                                        alt={driver.name}
                                        className="w-14 h-14 rounded-full object-cover"
                                    />
                                    <div>
                                        <h3 className="font-bold text-gray-800">{driver.name}</h3>
                                        <p className="text-xs text-gray-500 mb-1">{driver.vehicle}</p>
                                        <div className="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded-md w-fit">
                                            <Star size={12} className="text-orange-500 fill-orange-500" />
                                            <span className="text-xs font-bold text-gray-700">{driver.rating.toFixed(1)}</span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => onRemoveFavorite(driver.id)}
                                    className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors"
                                >
                                    <Heart size={20} className="fill-red-500" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
