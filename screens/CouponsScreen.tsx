import React, { useState } from 'react';
import { ArrowLeft, Ticket, X, CheckCircle } from 'lucide-react';
import { Button, Input } from '../components/UI';

interface Coupon {
    id: string;
    code: string;
    description: string;
    discount: number;
    type: 'percent' | 'fixed';
}

interface CouponsScreenProps {
    coupons: Coupon[];
    onBack: () => void;
    onRedeem: (code: string) => Promise<boolean>;
}

export const CouponsScreen: React.FC<CouponsScreenProps> = ({ coupons, onBack, onRedeem }) => {
    const [showModal, setShowModal] = useState(false);
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleRedeemClick = async () => {
        if (!code) return;
        setLoading(true);
        setError('');

        try {
            const success = await onRedeem(code);
            if (success) {
                setShowModal(false);
                setCode('');
            } else {
                setError('Cupom inválido ou expirado.');
            }
        } catch (err) {
            setError('Erro ao validar cupom.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-full bg-gray-50 flex flex-col animate-fade-in font-sans">
            {/* Header */}
            <div className="bg-white p-4 shadow-sm z-10 flex items-center gap-3">
                <button onClick={onBack} className="p-2 -ml-2 text-gray-700 hover:bg-gray-100 rounded-full">
                    <ArrowLeft size={24} />
                </button>
                <h2 className="text-xl font-bold text-gray-800">Cupons</h2>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col">
                {coupons.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60">
                        <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-6 text-gray-400">
                            <Ticket size={48} className="-rotate-12" />
                            <Ticket size={48} className="rotate-12 absolute" />
                        </div>
                        <p className="text-gray-600 font-bold text-lg mb-1">Você ainda não tem cupons resgatados</p>
                        <p className="text-sm text-gray-400 max-w-xs">Adicione um código promocional para ganhar descontos em suas corridas.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {coupons.map(coupon => (
                            <div key={coupon.id} className="bg-white p-4 rounded-xl border border-l-4 border-l-orange-500 shadow-sm flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-gray-800">{coupon.code}</h3>
                                    <p className="text-sm text-gray-500">{coupon.description}</p>
                                </div>
                                <div className="bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-xs font-bold">
                                    {coupon.type === 'percent' ? `${coupon.discount}% OFF` : `R$ ${coupon.discount} OFF`}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-white border-t border-gray-100">
                <Button
                    onClick={() => setShowModal(true)}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-full shadow-lg"
                >
                    Resgatar cupom
                </Button>
            </div>

            {/* Redeem Modal */}
            {showModal && (
                <div className="absolute inset-0 z-50 bg-black/50 flex items-end justify-center animate-fade-in">
                    <div className="bg-white w-full rounded-t-3xl p-6 animate-slide-up">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-800">Adicionar código</h3>
                            <button onClick={() => setShowModal(false)} className="p-2 bg-gray-100 rounded-full text-gray-500">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="mb-6">
                            <Input
                                placeholder="Digite o código do cupom"
                                value={code}
                                onChange={(e) => {
                                    setCode(e.target.value.toUpperCase());
                                    setError('');
                                }}
                                className="uppercase tracking-widest text-center text-lg font-bold"
                            />
                            {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
                        </div>

                        <Button
                            onClick={handleRedeemClick}
                            disabled={!code || loading}
                            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-full shadow-lg flex items-center justify-center gap-2"
                        >
                            {loading ? 'Validando...' : 'Confirmar'}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};
