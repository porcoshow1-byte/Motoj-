import { markRideAsPaid } from './ride';
import { initMercadoPago } from '@mercadopago/sdk-react';

// ==========================================
// CONFIGURAÇÃO
// ==========================================
const getEnv = (key: string) => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      return import.meta.env[key];
    }
  } catch (e) { }
  return "";
}

const PUBLIC_KEY = getEnv('VITE_MP_PUBLIC_KEY');
const ACCESS_TOKEN = getEnv('VITE_MP_ACCESS_TOKEN');

// Inicializa o SDK se tiver chave pública
if (PUBLIC_KEY && !PUBLIC_KEY.includes('0000')) {
  initMercadoPago(PUBLIC_KEY);
}

// Verifica se estamos em modo real ou simulado
const isRealPaymentMode = () => {
  return ACCESS_TOKEN && !ACCESS_TOKEN.includes('0000');
};


// ==========================================
// TIPOS
// ==========================================
interface PixPaymentResponse {
  id: string;
  status: string;
  qr_code: string;
  qr_code_base64: string;
  ticket_url: string;
}

// ==========================================
// FUNÇÕES DE PAGAMENTO REAL (MERCADO PAGO)
// ==========================================

/**
 * Cria um pagamento PIX real usando a API do Mercado Pago
 * @warning SECURITY: Isso deve ser movido para o backend em produção para não expor o ACCESS_TOKEN
 */
const createRealPixPayment = async (rideId: string, price: number, email: string): Promise<PixPaymentResponse> => {
  const idempotencyKey = `ride_${rideId}_${Date.now()}`;

  const response = await fetch('https://api.mercadopago.com/v1/payments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'X-Idempotency-Key': idempotencyKey
    },
    body: JSON.stringify({
      transaction_amount: Number(price.toFixed(2)),
      payment_method_id: 'pix',
      payer: {
        email: email || 'passenger@motoja.com'
      },
      description: `Corrida MotoJá #${rideId.slice(0, 6)}`,
      external_reference: rideId
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Erro MP:', errorData);
    throw new Error('Falha ao criar PIX: ' + (errorData.message || response.statusText));
  }

  const data = await response.json();

  return {
    id: data.id.toString(),
    status: data.status,
    qr_code: data.point_of_interaction.transaction_data.qr_code,
    qr_code_base64: data.point_of_interaction.transaction_data.qr_code_base64,
    ticket_url: data.point_of_interaction.transaction_data.ticket_url
  };
};

/**
 * Verifica o status de um pagamento real
 */
const checkRealPaymentStatus = async (paymentId: string): Promise<string> => {
  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`
    }
  });

  if (!response.ok) return 'unknown';

  const data = await response.json();
  return data.status; // 'approved', 'pending', etc.
};


// ==========================================
// FUNÇÕES PÚBLICAS (FACADE)
// ==========================================

export const createPixPayment = async (rideId: string, price: number, email: string) => {
  if (isRealPaymentMode()) {
    console.log("💰 Modo Real: Criando PIX no Mercado Pago...");
    return await createRealPixPayment(rideId, price, email);
  } else {
    console.log("⚠️ Modo Simulado: Criando PIX fake (configure .env para real)");
    // Retorna dados falsos para teste
    return {
      id: "sim_" + rideId,
      status: "pending",
      qr_code: "00020126580014BR.GOV.BCB.PIX0136123e4567-e89b-12d3-a456-426614174000520400005303986540510.005802BR5913MotoJa Teste6008Brasilia62070503***6304ABCD",
      qr_code_base64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg==", // Pixel transparente base64
      ticket_url: "https://mercadopago.com.br"
    };
  }
};

export const checkPayment = async (paymentId: string) => {
  if (isRealPaymentMode()) {
    return await checkRealPaymentStatus(paymentId);
  } else {
    // Simulado: sempre retorna pendente até processar explicitamente
    return 'pending';
  }
};

// Mantém compatibilidade com código antigo (simulador manual)
export const processSimulatedPayment = async (rideId: string) => {
  // Simula delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  await markRideAsPaid(rideId);
  return true;
};