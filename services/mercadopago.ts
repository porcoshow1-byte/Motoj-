// Este arquivo será responsável pela integração de pagamentos.
// Você precisará criar uma conta em mercadopago.com.br/developers
import { markRideAsPaid } from './ride';

// Helper seguro para variáveis de ambiente (evita crash se process não existir)
const getEnv = () => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      return import.meta.env.VITE_MP_PUBLIC_KEY;
    }
  } catch(e) {}
  return "";
}

export const MERCADO_PAGO_PUBLIC_KEY = getEnv() || "APP_USR-08367063-c4e1-4d33-bf13-7eae923a151a";

// Função simulada para criar preferência de pagamento (Checkout Pro ou Link)
export const createPaymentPreference = async (rideId: string, price: number) => {
  console.log(`Criando preferência de pagamento para corrida ${rideId} no valor de R$ ${price}`);
  
  // Aqui faremos a chamada real para a API do Mercado Pago
  // const response = await fetch('https://api.mercadopago.com/...');
  
  return {
    preferenceId: "simulated_pref_123",
    init_point: "https://www.mercadopago.com.br/checkout/v1/redirect?..."
  };
};

// Simula o fluxo de pagamento bem-sucedido e atualiza o banco de dados
export const processSimulatedPayment = async (rideId: string) => {
  // Simula delay de rede (processando pagamento...)
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Atualiza o status no Firebase
  await markRideAsPaid(rideId);
  
  return true;
};