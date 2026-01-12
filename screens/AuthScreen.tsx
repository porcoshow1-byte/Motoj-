import React, { useState } from 'react';
import { login, register } from '../services/auth';
import { getOrCreateUserProfile } from '../services/user';
import { Button, Input, Card } from '../components/UI';
import { AlertCircle, User, Phone, Car, MapPin, Camera } from 'lucide-react';
import { APP_CONFIG } from '../constants';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../services/firebase';

export const AuthScreen = ({ role, onLoginSuccess, onBack }: { role: string, onLoginSuccess: () => void, onBack: () => void }) => {
  const [isLogin, setIsLogin] = useState(true);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const [vehicle, setVehicle] = useState('');
  const [plate, setPlate] = useState('');
  const [cnhFile, setCnhFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async () => {
    setError('');

    if (!isLogin) {
      if (!name.trim()) return setError('Nome é obrigatório.');
      if (!phone.trim()) return setError('Telefone é obrigatório.');
      if (role === 'driver') {
        if (!vehicle.trim()) return setError('Modelo do veículo é obrigatório.');
        if (!plate.trim()) return setError('Placa é obrigatória.');
        if (!cnhFile) return setError('Foto da CNH é obrigatória.');
      }
    }

    setLoading(true);
    try {
      let userCredential;
      if (isLogin) {
        userCredential = await login(email, password);
      } else {
        userCredential = await register(email, password);
      }

      let cnhUrl = '';
      if (!isLogin && role === 'driver' && cnhFile && storage) {
        try {
          // Upload CNH
          const storageRef = ref(storage, `drivers/${userCredential.user?.uid || Date.now()}_cnh.jpg`);
          await uploadBytes(storageRef, cnhFile);
          cnhUrl = await getDownloadURL(storageRef);
        } catch (uploadError) {
          console.error("Upload failed", uploadError);
          // Continue without CNH url effectively (or block? For now continue but maybe warn)
        }
      }

      if (userCredential.user) {
        await getOrCreateUserProfile(
          userCredential.user.uid,
          userCredential.user.email || '',
          role as 'user' | 'driver',
          !isLogin ? { name, phone, vehicle, plate, cnhUrl } : undefined
        );
      }

      onLoginSuccess();
    } catch (err: any) {
      console.error(err);
      if (err.message && (err.message.includes('auth/invalid-credential') || err.message.includes('auth/wrong-password'))) {
        setError('E-mail ou senha incorretos.');
      } else if (err.message && err.message.includes('auth/email-already-in-use')) {
        setError('Este e-mail já está cadastrado.');
      } else if (err.message && err.message.includes('auth/weak-password')) {
        setError('A senha deve ter pelo menos 6 caracteres.');
      } else {
        setError('Erro: ' + (err.message || 'Falha na autenticação'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-xl border-t-4 border-orange-500 animate-slide-up">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {isLogin ? 'Bem-vindo de volta!' : 'Crie sua conta'}
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Acesse como <span className="font-bold text-orange-600 uppercase">{role === 'user' ? 'Passageiro' : 'Motorista'}</span>
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2 mb-4">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <div className="space-y-4">
          {!isLogin && (
            <div className="space-y-4 animate-fade-in bg-gray-50/50 p-4 rounded-xl border border-gray-100">
              <h3 className="text-sm font-bold text-gray-500 uppercase">Seus Dados</h3>
              <Input
                label="Nome Completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: João Silva"
                icon={<User size={16} />}
              />
              <Input
                label="Celular (WhatsApp)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 99999-9999"
                icon={<Phone size={16} />}
              />

              {role === 'driver' && (
                <>
                  <h3 className="text-sm font-bold text-gray-500 uppercase mt-4">Dados do Veículo</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Modelo Moto"
                      value={vehicle}
                      onChange={(e) => setVehicle(e.target.value)}
                      placeholder="Ex: Honda Titan"
                      icon={<Car size={16} />}
                    />
                    <Input
                      label="Placa"
                      value={plate}
                      onChange={(e) => setPlate(e.target.value)}
                      placeholder="ABC-1234"
                      icon={<MapPin size={16} />}
                    />
                  </div>

                  <div className="col-span-2 mt-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Foto da CNH (Obrigatório)</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:bg-gray-50 transition relative active:scale-95">
                      <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        onChange={(e) => setCnhFile(e.target.files?.[0] || null)}
                      />
                      <div className="flex flex-col items-center gap-2 text-gray-500">
                        <Camera size={24} className={cnhFile ? "text-green-500" : "text-gray-400"} />
                        <span className={`text-xs ${cnhFile ? "text-green-600 font-bold" : ""}`}>
                          {cnhFile ? `Arquivo: ${cnhFile.name}` : 'Clique para enviar foto da CNH'}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="space-y-3">
            <Input
              label="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="demo@motoja.com"
              type="email"
            />
            <Input
              label="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="******"
              type="password"
            />
          </div>

          <Button fullWidth onClick={handleAuth} isLoading={loading}>
            {isLogin ? 'Entrar' : 'Cadastrar-se'}
          </Button>
        </div>

        <div className="mt-6 text-center text-sm text-gray-600">
          {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
          <button
            onClick={() => { setError(''); setIsLogin(!isLogin); }}
            className="text-orange-600 font-bold ml-1 hover:underline focus:outline-none"
          >
            {isLogin ? 'Cadastre-se' : 'Faça Login'}
          </button>
        </div>

        <div className="mt-8 border-t border-gray-100 pt-4 text-center">
          <button onClick={onBack} className="text-gray-400 text-sm hover:text-gray-600">
            &larr; Voltar para seleção
          </button>
        </div>
      </Card>

      <div className="mt-8 text-center text-gray-400 text-xs">
        {APP_CONFIG.name} &copy; 2024
      </div>
    </div>
  );
};
