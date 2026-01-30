import { db, isMockMode } from './firebase';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { User, Driver } from '../types';

export const USERS_COLLECTION = 'users';

interface InitialUserData {
  name?: string;
  phone?: string;
  cpf?: string;
  vehicle?: string;
  plate?: string;
  cnhUrl?: string;
  address?: string;
  addressComponents?: any;
}

// Check if user already exists by specific field
export const checkUniqueness = async (field: 'cpf' | 'phone' | 'email', value: string): Promise<{ exists: boolean, message?: string }> => {
  if (isMockMode || !db || !value) return { exists: false };

  // Skip unique check for empty/incomplete values during typing
  if (field === 'cpf' && value.length < 11) return { exists: false };
  if (field === 'phone' && value.length < 10) return { exists: false };
  if (field === 'email' && !value.includes('@')) return { exists: false };

  const usersRef = collection(db, USERS_COLLECTION);
  const q = query(usersRef, where(field, '==', value));

  try {
    const snap = await getDocs(q);
    if (!snap.empty) {
      const msgs = {
        cpf: 'Este CPF já está cadastrado.',
        phone: 'Este telefone já está cadastrado.',
        email: 'Este e-mail já está cadastrado.'
      };
      return { exists: true, message: msgs[field] };
    }
    return { exists: false };
  } catch (err) {
    console.error(`Error checking uniqueness for ${field}:`, err);
    return { exists: false };
  }
};

// Deprecated: Keeping for backward compatibility if needed, but redirects to new function
export const checkUserExists = async (cpf: string, phone: string): Promise<{ exists: boolean, field: 'cpf' | 'phone' | null }> => {
  const cpfCheck = await checkUniqueness('cpf', cpf);
  if (cpfCheck.exists) return { exists: true, field: 'cpf' };

  const phoneCheck = await checkUniqueness('phone', phone);
  if (phoneCheck.exists) return { exists: true, field: 'phone' };

  return { exists: false, field: null };
};

export const getOrCreateUserProfile = async (
  uid: string,
  email: string,
  role: 'user' | 'driver' | 'company',
  initialData?: InitialUserData
): Promise<User | Driver> => {

  // MOCK MODE: Fallback para localStorage se não houver DB
  if (isMockMode || !db) {
    const storageKey = `motoja_user_${uid}`;
    const stored = localStorage.getItem(storageKey);

    if (stored) {
      const parsed = JSON.parse(stored);
      // Atualiza dados se vierem no login e não existirem no mock antigo
      if (role === 'driver' && initialData && (!parsed.vehicle || !parsed.plate)) {
        const updated = { ...parsed, ...initialData };
        localStorage.setItem(storageKey, JSON.stringify(updated));
        return updated;
      }
      return parsed;
    }

    const displayName = initialData?.name || email.split('@')[0];
    const baseData = {
      id: uid,
      name: displayName,
      email: email,
      phone: initialData?.phone || '',
      cpf: initialData?.cpf || '',
      address: initialData?.address || '',
      addressComponents: initialData?.addressComponents,
      rating: 5.0,
      avatar: `https://ui-avatars.com/api/?background=${role === 'user' ? 'orange' : '000'}&color=fff&name=${displayName}`,
      createdAt: Date.now(),
      role: role
    };

    let newProfile: any = baseData;
    if (role === 'driver') {
      newProfile = {
        ...baseData,
        vehicle: initialData?.vehicle || 'Moto Demo',
        plate: initialData?.plate || 'DEMO-9999',
        status: 'online', // Default to online in mock for ease
        location: { lat: -23.1047, lng: -48.9213 },
        earningsToday: 0
      };
    }

    localStorage.setItem(storageKey, JSON.stringify(newProfile));
    return newProfile;
  }

  // FIREBASE MODE
  const userRef = doc(db, USERS_COLLECTION, uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const data = userSnap.data() as any;

    if (role === 'driver' && (!data.vehicle || !data.plate || !data.cnhUrl) && initialData) {
      const updateData = {
        role: 'driver',
        vehicle: initialData.vehicle || data.vehicle,
        plate: initialData.plate || data.plate,
        status: data.status || 'offline',
        location: data.location || { lat: 0, lng: 0 },
        earningsToday: data.earningsToday || 0,
        verificationStatus: data.verificationStatus || 'pending',
        cnhUrl: initialData.cnhUrl || data.cnhUrl || ''
      };
      await updateDoc(userRef, updateData);
      return { ...data, ...updateData };
    }
    return data as User | Driver;
  } else {
    // FIRST: Check localStorage for saved profile (user might have edited offline)
    const storageKey = `motoja_user_${uid}`;
    const storedLocal = localStorage.getItem(storageKey);
    if (storedLocal) {
      const localProfile = JSON.parse(storedLocal);
      console.log("📂 Recovered profile from localStorage:", localProfile.name);
      // Save to Firestore for sync
      await setDoc(userRef, localProfile);
      return localProfile as User | Driver;
    }

    // Create new profile
    const displayName = initialData?.name || email.split('@')[0];
    const displayPhone = initialData?.phone || '';

    const baseData = {
      id: uid,
      name: displayName,
      email: email,
      phone: displayPhone,
      cpf: initialData?.cpf || '',
      rating: 5.0,
      avatar: `https://ui-avatars.com/api/?background=${role === 'user' ? 'orange' : '000'}&color=fff&name=${displayName}`,
      createdAt: Date.now(),
      role: role
    };

    let newProfile: any = baseData;

    if (role === 'driver') {
      newProfile = {
        ...baseData,
        vehicle: initialData?.vehicle || 'Veículo não cadastrado',
        plate: initialData?.plate || 'AAA-0000',
        status: 'offline',
        location: { lat: 0, lng: 0 },
        earningsToday: 0,
        verificationStatus: 'pending',
        cnhUrl: initialData?.cnhUrl || ''
      };
    }

    await setDoc(userRef, newProfile);
    return newProfile;
  }
};

export const updateUserProfile = async (uid: string, data: Partial<User | Driver>) => {
  if (isMockMode || !db) {
    const storageKey = `motoja_user_${uid}`;
    const stored = localStorage.getItem(storageKey);
    let updated;

    if (stored) {
      const parsed = JSON.parse(stored);
      updated = { ...parsed, ...data };
    } else {
      // Create new entry if doesn't exist (Backup / Recovery)
      updated = { id: uid, ...data };
    }

    localStorage.setItem(storageKey, JSON.stringify(updated));
    console.log('✅ User Profile Persisted:', storageKey, updated);
    return;
  }

  const userRef = doc(db, USERS_COLLECTION, uid);
  // Using setDoc with merge is safer/more robust than updateDoc for profile patches
  await setDoc(userRef, data, { merge: true });
};

// ============ SESSION CONTROL (Single Device Login) ============

// Generate unique session ID
const generateSessionId = () => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
};

// Get current session ID from localStorage
export const getLocalSessionId = () => {
  return localStorage.getItem('motoja_session_id');
};

// Set session ID locally
const setLocalSessionId = (sessionId: string) => {
  localStorage.setItem('motoja_session_id', sessionId);
};

// Register new session (called on login)
export const registerSession = async (uid: string): Promise<string> => {
  const sessionId = generateSessionId();
  setLocalSessionId(sessionId);

  if (isMockMode || !db) {
    const storageKey = `motoja_user_${uid}`;
    const stored = localStorage.getItem(storageKey);
    let parsed: any = {};
    if (stored) {
      parsed = JSON.parse(stored);
    }
    // Ensure we write even if file didn't exist (creating minimal profile/session)
    localStorage.setItem(storageKey, JSON.stringify({ ...parsed, id: uid, activeSessionId: sessionId }));

    return sessionId;
  }

  const userRef = doc(db, USERS_COLLECTION, uid);
  // Use setDoc with merge to ensure document exists
  await setDoc(userRef, { activeSessionId: sessionId }, { merge: true });
  return sessionId;
};

// Validate session (check if current session is still active)
export const validateSession = async (uid: string): Promise<boolean> => {
  const localSessionId = getLocalSessionId();
  if (!localSessionId) return false;

  if (isMockMode || !db) {
    const storageKey = `motoja_user_${uid}`;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const parsed = JSON.parse(stored);
      // If activeSessionId is missing in DB but we have a local session, 
      // in Mock Mode we can optionally self-heal or allow. 
      // Stricter: return parsed.activeSessionId === localSessionId;

      // Fix: If DB has NO session ID (e.g. data wipe), allow 'claiming' it? 
      // No, that overrides security. But for Mock/Demo stability:
      if (!parsed.activeSessionId) return true;

      return parsed.activeSessionId === localSessionId;
    }
    // If profile doesn't exist but we are logged in (auth.ts), allow it to avoid loop
    return true;
  }

  const userRef = doc(db, USERS_COLLECTION, uid);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    const data = userSnap.data();
    return data.activeSessionId === localSessionId;
  }
  return false;
};

// Clear session (called on logout)
export const clearSession = () => {
  localStorage.removeItem('motoja_session_id');
};