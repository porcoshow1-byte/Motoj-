import { Company } from '../types';

const MOCK_COMPANIES: Company[] = [
    {
        id: 'comp_001',
        name: 'Tech Solutions Ltda',
        cnpj: '12.345.678/0001-90',
        email: 'financeiro@techsolutions.com',
        status: 'active',
        address: 'Av. Paulista, 1000 - SP',
        creditLimit: 5000,
        usedCredit: 1250,
        logoUrl: 'https://ui-avatars.com/api/?name=Tech+Solutions&background=0D8ABC&color=fff'
    },
    {
        id: 'comp_002',
        name: 'Logística Express',
        cnpj: '98.765.432/0001-10',
        email: 'contato@logex.com',
        status: 'active',
        address: 'Rua das Flores, 500 - RJ',
        creditLimit: 2000,
        usedCredit: 1980, // Quase estourando
        logoUrl: 'https://ui-avatars.com/api/?name=Log+Express&background=ff0000&color=fff'
    }
];

export const getCompany = async (companyId: string): Promise<Company | null> => {
    // Simulating API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return MOCK_COMPANIES.find(c => c.id === companyId) || null;
};

export const getMockCompanies = (): Company[] => {
    return MOCK_COMPANIES;
};

export const canBookCorporateRide = (company: Company, estimatedPrice: number): boolean => {
    if (company.status !== 'active') return false;
    const availableCredit = (company.creditLimit || 0) - (company.usedCredit || 0);
    return availableCredit >= estimatedPrice;
};
