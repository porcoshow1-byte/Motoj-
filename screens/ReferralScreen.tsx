import React, { useState } from 'react';
import { ArrowLeft, Gift, Copy, Share2, Users, ChevronRight } from 'lucide-react';
import { Button } from '../components/UI';

interface ReferralScreenProps {
    referralCode: string;
    onBack: () => void;
    referralStats?: {
        total: number;
        earnings: number;
        pending: number;
    };
}

export const ReferralScreen: React.FC<ReferralScreenProps> = ({ referralCode, onBack, referralStats = { total: 0, earnings: 0, pending: 0 } }) => {
    const [activeTab, setActiveTab] = useState<'campaign' | 'referrals'>('campaign');
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(referralCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Ganhe R$ 1 no MotoJá!',
                    text: `Use meu código ${referralCode} e ganhe descontos no MotoJá!`,
                    url: 'https://motoja.app.br'
                });
            } catch (err) {
                console.log('Error sharing:', err);
            }
        } else {
            handleCopy();
            alert('Link copiado para a área de transferência!');
        }
    };

    // Mock Referrals List
    const mockReferrals = [
        { id: 1, name: 'Pedro Santos', status: 'completed', date: '28/01/2026', reward: 1.00 },
        { id: 2, name: 'Ana Clara', status: 'pending', date: '30/01/2026', reward: 0 },
    ];

    return (
        <div className="h-full bg-white flex flex-col animate-fade-in font-sans">
            {/* Header */}
            <div className="bg-white p-4 shadow-sm z-10 flex items-center gap-3">
                <button onClick={onBack} className="p-2 -ml-2 text-gray-700 hover:bg-gray-100 rounded-full">
                    <ArrowLeft size={24} />
                </button>
                <h2 className="text-xl font-bold text-gray-800">Indique e ganhe R$ 1</h2>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100">
                <button
                    onClick={() => setActiveTab('campaign')}
                    className={`flex-1 py-4 font-bold text-sm text-center border-b-2 transition-colors ${activeTab === 'campaign' ? 'border-orange-600 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Campanha
                </button>
                <button
                    onClick={() => setActiveTab('referrals')}
                    className={`flex-1 py-4 font-bold text-sm text-center border-b-2 transition-colors ${activeTab === 'referrals' ? 'border-orange-600 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Minhas indicações
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                {activeTab === 'campaign' ? (
                    <div className="flex flex-col items-center">
                        <div className="w-full max-w-sm">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800 leading-tight mb-4">Indique o app e <br />ganhe R$ 1</h2>
                                    <p className="text-gray-600">
                                        Convide seus amigos para <span className="font-bold">se cadastrarem no app com seu código</span> e receba R$ 1 em créditos quando eles completarem 1 corrida.
                                    </p>
                                </div>
                                <div className="bg-orange-100 p-4 rounded-2xl rotate-3">
                                    <Gift size={48} className="text-orange-600" />
                                </div>
                            </div>

                            <div className="mb-8">
                                <label className="text-sm font-bold text-gray-700 mb-2 block">Código de indicação</label>
                                <div className="flex gap-2">
                                    <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center p-4">
                                        <span className="text-xl font-bold text-gray-800 tracking-widest">{referralCode}</span>
                                    </div>
                                    <button
                                        onClick={handleCopy}
                                        className={`p-4 rounded-xl border-2 transition-all ${copied ? 'bg-green-50 border-green-500 text-green-600' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400'}`}
                                    >
                                        {copied ? <Share2 size={24} /> : <Copy size={24} />}
                                    </button>
                                </div>
                                {copied && <p className="text-green-600 text-xs mt-2 font-bold text-center">Código copiado!</p>}
                            </div>

                            <Button
                                onClick={handleShare}
                                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-full shadow-lg flex items-center justify-center gap-2"
                            >
                                <Share2 size={20} /> Compartilhar
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div>
                        <div className="bg-orange-50 rounded-xl p-4 mb-6 flex items-center justify-between border border-orange-100">
                            <div>
                                <p className="text-orange-800 text-sm font-bold">Total ganho</p>
                                <h3 className="text-2xl font-bold text-orange-600">R$ {referralStats.earnings.toFixed(2).replace('.', ',')}</h3>
                            </div>
                            <div className="text-right">
                                <p className="text-gray-500 text-xs">Indicações</p>
                                <p className="font-bold text-gray-800">{referralStats.total} amigos</p>
                            </div>
                        </div>

                        <h3 className="font-bold text-gray-800 mb-4">Histórico</h3>

                        <div className="space-y-3">
                            {mockReferrals.map((ref) => (
                                <div key={ref.id} className="bg-white border border-gray-100 p-4 rounded-xl flex items-center justify-between shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${ref.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                            <Users size={18} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800">{ref.name}</p>
                                            <p className="text-xs text-gray-400">{ref.date}</p>
                                        </div>
                                    </div>
                                    {ref.status === 'completed' ? (
                                        <span className="text-green-600 font-bold text-sm">+ R$ {ref.reward.toFixed(2)}</span>
                                    ) : (
                                        <span className="text-orange-500 text-xs font-bold bg-orange-50 px-2 py-1 rounded-full">Pendente</span>
                                    )}
                                </div>
                            ))}

                            {/* Exemplo de lista vazia se necessário */}
                            {/* <div className="text-center py-10 opacity-50">
                        <Users size={40} className="mx-auto mb-2 text-gray-400" />
                        <p className="text-gray-500">Nenhuma indicação ainda</p>
                    </div> */}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
