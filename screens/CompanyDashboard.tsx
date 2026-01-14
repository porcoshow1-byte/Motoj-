import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getCompany } from '../services/company';
import { getRideHistory } from '../services/ride';
import { generateInvoicePayment } from '../services/billing';
import { Company, RideRequest } from '../types';
import { Button, Card, Badge, Input } from '../components/UI';
import {
    Building2, Users, CreditCard, Calendar, ArrowLeft,
    TrendingUp, Download, Search, CheckCircle, Clock, AlertCircle
} from 'lucide-react';

export const CompanyDashboard = ({ onBack }: { onBack: () => void }) => {
    const { user } = useAuth();
    const [company, setCompany] = useState<Company | null>(null);
    const [rides, setRides] = useState<RideRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPaying, setIsPaying] = useState(false);
    const [invoicePayment, setInvoicePayment] = useState<any>(null);

    const handlePayInvoice = async () => {
        if (!company) return;
        setIsPaying(true);
        // Mock invoice ID generation
        const invoiceId = `inv_${new Date().getMonth() + 1}_${new Date().getFullYear()}`;

        try {
            const result = await generateInvoicePayment(company.id, invoiceId, openInvoices, company.email);
            if (result.success) {
                setInvoicePayment(result);
            } else {
                alert('Erro ao gerar fatura: ' + result.message);
            }
        } catch (error) {
            console.error(error);
            alert('Erro ao processar pagamento');
        } finally {
            setIsPaying(false);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            if (!user) return;

            // In a real app we would get this from the user's profile
            // For now we mock it or fetch if we know the ID
            // Let's assume the user is linked to a company. 
            // WE MOCK fetching company "1" for demo purposes if user has no company
            // In production check user.companyId

            try {
                const mockCompanyId = '1';
                const companyData = await getCompany(mockCompanyId);
                setCompany(companyData);

                // Fetch corporate rides
                // We would ideally filter by companyId in the query
                const allRides = await getRideHistory(user.uid, 'passenger'); // Mock: fetch all user rides
                const corporateRides = allRides.filter(r => r.paymentMethod === 'corporate');
                setRides(corporateRides);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [user]);

    if (loading) {
        return <div className="h-screen flex items-center justify-center text-gray-500">Carregando painel corporativo...</div>;
    }

    if (!company) {
        return <div className="p-8 text-center">Empresa não encontrada.</div>;
    }

    const totalSpent = rides.reduce((acc, r) => acc + r.price, 0);
    const openInvoices = totalSpent; // Mock concept: all recent rides are pending invoice

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between sticky top-0 z-30">
                <div className="flex items-center gap-4">
                    <Button variant="outline" className="border-none shadow-none hover:bg-gray-100 p-2" onClick={onBack}><ArrowLeft size={20} /></Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <Building2 className="text-blue-600" /> {company.name}
                        </h1>
                        <p className="text-sm text-gray-500">Painel de Gestão Corporativa • CNPJ: {company.cnpj}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <p className="text-xs text-gray-500 font-medium uppercase">Limite de Crédito</p>
                        <p className="font-bold text-gray-900">R$ {company.creditLimit.toFixed(2)}</p>
                    </div>
                    <div className="h-8 w-px bg-gray-200 mx-2"></div>
                    <Button variant="outline" className="flex items-center gap-2"><Download size={16} /> Exportar Relatório</Button>
                </div>
            </div>

            <div className="p-8 max-w-7xl w-full mx-auto space-y-8 animate-fade-in">

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="p-6 border-l-4 border-blue-500 shadow-sm hover:shadow-md transition">
                        <div className="flex items-start justify-between mb-4">
                            <div className="bg-blue-50 p-3 rounded-xl text-blue-600"><TrendingUp size={24} /></div>
                            <Badge color="blue">Mês Atual</Badge>
                        </div>
                        <p className="text-gray-500 text-sm font-medium">Total Gasto</p>
                        <h3 className="text-3xl font-bold text-gray-900 mt-1">R$ {totalSpent.toFixed(2)}</h3>
                        <p className="text-xs text-gray-400 mt-2">+12% vs mês anterior</p>
                    </Card>

                    <Card className="p-6 border-l-4 border-orange-500 shadow-sm hover:shadow-md transition">
                        <div className="flex items-start justify-between mb-4">
                            <div className="bg-orange-50 p-3 rounded-xl text-orange-600"><CreditCard size={24} /></div>
                            <Badge color="orange">A Vencer</Badge>
                        </div>
                        <p className="text-gray-500 text-sm font-medium">Faturas em Aberto</p>
                        <h3 className="text-3xl font-bold text-gray-900 mt-1">R$ {openInvoices.toFixed(2)}</h3>
                        <div className="flex justify-between items-center mt-2">
                            <p className="text-xs text-gray-400">Vencimento: 10/06</p>
                            {openInvoices > 0 && (
                                <Button className="py-1 px-3 text-sm" onClick={handlePayInvoice} disabled={isPaying}>
                                    {isPaying ? 'Gerando...' : 'Pagar Agora'}
                                </Button>
                            )}
                        </div>
                    </Card>

                    <Card className="p-6 border-l-4 border-green-500 shadow-sm hover:shadow-md transition">
                        <div className="flex items-start justify-between mb-4">
                            <div className="bg-green-50 p-3 rounded-xl text-green-600"><Users size={24} /></div>
                            <Badge color="green">Ativos</Badge>
                        </div>
                        <p className="text-gray-500 text-sm font-medium">Colaboradores</p>
                        <h3 className="text-3xl font-bold text-gray-900 mt-1">12</h3>
                        <p className="text-xs text-green-600 mt-2">+2 novos este mês</p>
                    </Card>
                </div>

                {/* Recent Rides Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2"><Calendar size={20} className="text-gray-400" /> Corridas Recentes</h3>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input type="text" placeholder="Buscar colaborador..." className="pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-100 outline-none" />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100 uppercase text-xs tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Data</th>
                                    <th className="px-6 py-4">Colaborador</th>
                                    <th className="px-6 py-4">Origem / Destino</th>
                                    <th className="px-6 py-4 text-right">Valor</th>
                                    <th className="px-6 py-4 text-center">Fatura</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {rides.length === 0 ? (
                                    <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Nenhuma corrida corporativa registrada ainda.</td></tr>
                                ) : (
                                    rides.map(ride => (
                                        <tr key={ride.id} className="hover:bg-blue-50/30 transition-colors group cursor-default">
                                            <td className="px-6 py-4">
                                                {ride.status === 'completed' ?
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700"><CheckCircle size={12} /> Concluída</span> :
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700"><Clock size={12} /> {ride.status}</span>
                                                }
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {new Date(ride.createdAt).toLocaleDateString()} <span className="text-xs text-gray-400">{new Date(ride.createdAt).toLocaleTimeString().slice(0, 5)}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                                                        {ride.passenger.name.charAt(0)}
                                                    </div>
                                                    <span className="font-medium text-gray-900">{ride.passenger.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 max-w-xs truncate">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-xs truncate" title={ride.origin}>From: {ride.origin}</span>
                                                    <span className="text-xs font-bold text-gray-800 truncate" title={ride.destination}>To: {ride.destination}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono font-bold text-gray-900">
                                                R$ {ride.price.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <Badge color="orange">Pendente</Badge>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Payment Modal */}
            {invoicePayment && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-scale-in">
                        <div className="text-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900">Pagamento de Fatura</h3>
                            <p className="text-gray-500 mt-1">Escaneie o QR Code para pagar</p>
                        </div>

                        {invoicePayment.qrCodeBase64 ? (
                            <div className="flex justify-center mb-6">
                                <img src={`data:image/png;base64,${invoicePayment.qrCodeBase64}`} alt="QR Code PIX" className="w-64 h-64" />
                            </div>
                        ) : (
                            <div className="bg-gray-100 p-4 rounded-lg mb-6 break-all text-xs font-mono text-gray-600">
                                {invoicePayment.qrCode || invoicePayment.paymentLink}
                            </div>
                        )}

                        <div className="space-y-3">
                            <Button fullWidth onClick={() => {
                                navigator.clipboard.writeText(invoicePayment.qrCode || invoicePayment.paymentLink);
                                alert('Código copiado!');
                            }}>
                                Copiar Código PIX
                            </Button>
                            <Button variant="outline" fullWidth onClick={() => setInvoicePayment(null)}>
                                Fechar
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
