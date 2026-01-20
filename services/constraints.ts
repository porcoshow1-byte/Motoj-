import { db, isMockMode } from './firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getMockCompanies } from './company';

type UniquenessCheckResult = {
    exists: boolean;
    message?: string;
};

// Helper to normalize strings for comparison
const normalize = (val: string, type: 'email' | 'digits' = 'digits') => {
    if (!val) return '';
    if (type === 'email') return val.trim().toLowerCase();
    return val.replace(/\D/g, ''); // Keep only digits for phone, cpf, cnpj
};

export const checkUniqueness = async (
    field: 'email' | 'phone' | 'cpf' | 'cnpj',
    value: string
): Promise<UniquenessCheckResult> => {
    if (!value) return { exists: false };

    const isEmail = field === 'email';
    const cleanValue = normalize(value, isEmail ? 'email' : 'digits');

    console.log(`🔍 Checking uniqueness for ${field}: ${cleanValue} (Raw: ${value})`);

    // --- MOCK MODE ---
    if (isMockMode || !db) {
        // Check in LocalStorage Users
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('motoja_user_')) {
                try {
                    const userData = JSON.parse(localStorage.getItem(key) || '{}');
                    const userVal = normalize(userData[field] || '', isEmail ? 'email' : 'digits');

                    if (userVal && userVal === cleanValue) {
                        console.warn(`❌ Duplicate found in MOCK User (${key}): ${field} = ${userVal}`);
                        if (field === 'cpf') return { exists: true, message: 'Este CPF já possui cadastro. Por favor, redefina sua senha de acesso.' };
                        return { exists: true, message: `Este ${field === 'email' ? 'e-mail' : 'telefone'} já está cadastrado. Por favor, utilize outra opção.` };
                    }
                } catch (e) { }
            }
        }

        // Check in Mock Companies
        const companies = getMockCompanies();
        for (const company of companies) {
            const compVal = normalize((company as any)[field] || '', isEmail ? 'email' : 'digits');
            if (compVal && compVal === cleanValue) {
                console.warn(`❌ Duplicate found in MOCK Company: ${field} = ${compVal}`);
                if (field === 'cnpj') return { exists: true, message: 'Este CNPJ já possui cadastro. Por favor, redefina sua senha de acesso.' };
                return { exists: true, message: `Este ${field === 'email' ? 'e-mail' : 'telefone'} já está em uso por uma empresa. Por favor, utilize outra opção.` };
            }
        }

        return { exists: false };
    }

    // --- FIREBASE MODE ---
    try {
        // Check Users Collection
        const userQ = query(collection(db, 'users'), where(field, '==', value)); // Field names match? need to be careful.
        // NOTE: 'users' collection usually has 'email', 'phone'. 'cpf' might be inside data structures.
        // Firestore queries are exact match usually. 
        // We'll trust the exact value passed or standard formatting.

        const userSnap = await getDocs(userQ);
        if (!userSnap.empty) {
            if (field === 'cpf') return { exists: true, message: 'Este CPF já possui cadastro. Por favor, redefina sua senha de acesso.' };
            return { exists: true, message: `Este ${field === 'email' ? 'e-mail' : 'telefone'} já está cadastrado. Por favor, utilize outra opção.` };
        }

        // Check Companies Collection
        // Companies have 'cnpj', 'email', 'phone'
        if (['email', 'cnpj', 'phone'].includes(field)) {
            const compQ = query(collection(db, 'companies'), where(field, '==', value));
            const compSnap = await getDocs(compQ);
            if (!compSnap.empty) {
                if (field === 'cnpj') return { exists: true, message: 'Este CNPJ já possui cadastro. Por favor, redefina sua senha de acesso.' };
                return { exists: true, message: `Este ${field === 'email' ? 'e-mail' : 'telefone'} já está cadastrado. Por favor, utilize outra opção.` };
            }
        }

        return { exists: false };

    } catch (error) {
        console.error("Error checking uniqueness:", error);
        // Fail safe: allow if error, or block? 
        // Blocking is safer for consistency, allowing is better for UX in outages.
        // Let's assume false to not block legitimate users if DB is flaking, 
        // but log heavily.
        return { exists: false };
    }
};
