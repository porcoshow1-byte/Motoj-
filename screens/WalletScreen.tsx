import React, { useState } from 'react';
import { ArrowLeft, ChevronRight, Copy, CheckCircle, Wallet, Plus, Banknote } from 'lucide-react';
import { Button, Input } from '../components/UI';
import { WalletTransaction } from '../types';

interface WalletScreenProps {
    balance: number;
    history: WalletTransaction[];
    onBack: () => void;
    onAddFunds: (amount: number) => void;
}

export const WalletScreen: React.FC<WalletScreenProps> = ({ balance, history, onBack, onAddFunds }) => {
    const [view, setView] = useState<'main' | 'add'>('main');
    const [amount, setAmount] = useState('');
    const [showPix, setShowPix] = useState(false);

    // Formata moeda (R$ 0,00)
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    const handleQuickAmount = (val: number) => {
        setAmount(val.toString());
    };

    const handleGeneratePix = () => {
        if (!amount || parseFloat(amount) < 1) return;
        setShowPix(true);
    };

    const handleConfirmPayment = () => {
        // Simula confirmação de pagamento
        setTimeout(() => {
            onAddFunds(parseFloat(amount));
            setShowPix(false);
            setAmount('');
            setView('main');
        }, 1500); // 1.5s delay fake
    };

    if (view === 'add') {
        return (
            <div className="h-full bg-white flex flex-col animate-fade-in font-sans">
                <div className="p-4 flex items-center gap-3 shadow-sm z-10">
                    <button onClick={() => { setView('main'); setShowPix(false); }} className="p-2 -ml-2 text-gray-700 hover:bg-gray-100 rounded-full">
                        <ArrowLeft size={24} />
                    </button>
                    <h2 className="text-xl font-bold text-gray-800">Adicionar saldo</h2>
                </div>

                {!showPix ? (
                    <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-gray-800 mb-6 leading-tight">
                            Quanto você quer recarregar de saldo na carteira?
                        </h3>

                        <div className="mb-8">
                            <Input
                                value={amount ? `R$ ${amount}` : ''}
                                onChange={(e) => {
                                    // Apenas números
                                    const val = e.target.value.replace(/[^0-9]/g, '');
                                    setAmount(val);
                                }}
                                placeholder="R$ 0,00"
                                className="text-3xl font-bold p-4 h-16 border-gray-300 focus:border-orange-500 rounded-xl"
                            />
                            <p className="text-xs text-gray-500 mt-2">Digite um valor entre R$2,00 e R$500,00</p>
                        </div>

                        <div className="flex gap-3 mb-10 overflow-x-auto pb-2">
                            {[20, 50, 100, 200].map((val) => (
                                <button
                                    key={val}
                                    onClick={() => handleQuickAmount(val)}
                                    className={`px-6 py-2 rounded-full border border-gray-300 font-medium whitespace-nowrap transition-colors ${amount === val.toString() ? 'bg-orange-50 border-orange-500 text-orange-700' : 'text-gray-600 hover:bg-gray-50'}`}
                                >
                                    R$ {val},00
                                </button>
                            ))}
                        </div>

                        <div className="mt-auto">
                            <p className="text-sm font-bold text-gray-700 mb-4">Método de recarga</p>
                            <div className="flex items-center justify-between p-4 border border-orange-200 bg-orange-50/50 rounded-xl cursor-pointer">
                                <div className="flex items-center gap-3">
                                    {/* Pix Icon SVG (Simulated) */}
                                    <div className="w-8 h-8 flex items-center justify-center">
                                        <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-green-600" xmlns="http://www.w3.org/2000/svg"><path d="M16.5 3.5L12 8L7.5 3.5M3.5 7.5L8 12L3.5 16.5M7.5 20.5L12 16L16.5 20.5M20.5 16.5L16 12L20.5 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    </div>
                                    <span className="font-bold text-gray-800">Pix</span>
                                </div>
                                <div className="w-5 h-5 rounded-full border-2 border-orange-500 flex items-center justify-center">
                                    <div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div>
                                </div>
                            </div>

                            <Button
                                onClick={handleGeneratePix}
                                disabled={!amount || parseFloat(amount) < 2}
                                className="w-full mt-6 py-4 text-lg font-bold shadow-lg bg-orange-600 hover:bg-orange-700 text-white rounded-full"
                            >
                                Adicionar saldo
                            </Button>
                        </div>
                    </div>
                ) : (
                    /* TELA DO PIX (Simulada) */
                    <div className="p-6 flex-1 flex flex-col items-center animate-fade-in">
                        <div className="w-full bg-orange-50 border border-orange-100 rounded-2xl p-6 text-center mb-6">
                            <p className="text-sm text-gray-500 mb-2">Valor da recarga</p>
                            <h2 className="text-4xl font-bold text-orange-600">{formatCurrency(parseFloat(amount))}</h2>
                        </div>

                        <div className="bg-white p-4 rounded-xl border-2 border-dashed border-gray-300 mb-6 aspect-square w-64 flex items-center justify-center">
                            {/* QR Code Placeholder */}
                            <div className="grid grid-cols-5 gap-1 w-full h-full opacity-50">
                                {[...Array(25)].map((_, i) => (
                                    <div key={i} className={`bg-black ${Math.random() > 0.5 ? 'opacity-100' : 'opacity-0'}`}></div>
                                ))}
                            </div>
                        </div>

                        <p className="text-gray-500 text-center mb-6 text-sm">Escaneie o QR Code ou copie a chave Pix abaixo para pagar.</p>

                        <div className="flex items-center gap-2 bg-gray-100 p-3 rounded-xl w-full mb-8">
                            <span className="flex-1 truncate text-xs text-gray-500 font-mono">00020126360014BR.GOV.BCB.PIX0114+551199999999520400005303986540510.005802BR5913MotoJa Recarga6008SAO PAULO62070503***6304E2CA</span>
                            <button className="text-orange-600 font-bold text-sm flex items-center gap-1 hover:bg-orange-50 p-2 rounded-lg transition">
                                <Copy size={16} /> Copiar
                            </button>
                        </div>

                        <Button
                            onClick={handleConfirmPayment}
                            className="w-full mt-auto py-4 text-lg font-bold shadow-lg bg-green-600 hover:bg-green-700 text-white rounded-full flex items-center justify-center gap-2"
                        >
                            <CheckCircle size={20} /> Feito! Já paguei
                        </Button>
                    </div>
                )}
            </div>
        );
    }

    // MAIN VIEW
    return (
        <div className="h-full bg-white flex flex-col animate-fade-in font-sans">
            <div className="p-4 flex items-center gap-3 shadow-sm z-10 bg-white">
                <button onClick={onBack} className="p-2 -ml-2 text-gray-700 hover:bg-gray-100 rounded-full">
                    <ArrowLeft size={24} />
                </button>
                <h2 className="text-xl font-bold text-gray-800">Carteira</h2>
            </div>

            <div className="p-6">
                <p className="text-gray-500 font-medium mb-1">Saldo da carteira</p>
                <h1 className="text-5xl font-bold text-gray-900 mb-8 tracking-tight">{formatCurrency(balance)}</h1>

                <Button
                    onClick={() => setView('add')}
                    className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-full shadow-lg shadow-orange-500/20 active:scale-95 transition-all"
                >
                    <Plus size={20} strokeWidth={3} /> Adicionar
                </Button>
            </div>

            <div className="flex-1 bg-gray-50 rounded-t-3xl p-6 mt-4 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] overflow-hidden flex flex-col">
                <h3 className="text-lg font-bold text-gray-800 mb-6">Histórico</h3>

                {history && history.length > 0 ? (
                    <div className="space-y-4 overflow-y-auto pb-safe">
                        {history.slice().reverse().map((tx) => (
                            <div key={tx.id} className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-full ${tx.type === 'credit' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                        {tx.type === 'credit' ? <Plus size={20} /> : <Banknote size={20} />}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-800">{tx.description}</p>
                                        <p className="text-xs text-gray-400">{new Date(tx.date).toLocaleDateString()} às {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                </div>
                                <span className={`font-bold ${tx.type === 'credit' ? 'text-green-600' : 'text-gray-800'}`}>
                                    {tx.type === 'credit' ? '+' : '-'} {formatCurrency(tx.amount)}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60">
                        <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-4 text-gray-400">
                            <Wallet size={40} />
                        </div>
                        <p className="text-gray-500 font-medium">Sem transações até o momento</p>
                    </div>
                )}
            </div>
        </div>
    );
};
