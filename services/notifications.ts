/**
 * MotoJá Notifications Service
 * Sistema de notificações push para motoristas e passageiros
 * Usa a Notification API do browser para enviar notificações locais
 */

// Verificar se o navegador suporta notificações
export const isNotificationSupported = (): boolean => {
    return 'Notification' in window;
};

// Verificar status atual da permissão
export const getPermissionStatus = (): NotificationPermission | 'unsupported' => {
    if (!isNotificationSupported()) return 'unsupported';
    return Notification.permission;
};

/**
 * Solicita permissão para enviar notificações
 * Deve ser chamado após interação do usuário (click em botão)
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
    if (!isNotificationSupported()) {
        console.warn('Notificações não são suportadas neste navegador');
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission === 'denied') {
        console.warn('Usuário negou permissão de notificações anteriormente');
        return false;
    }

    try {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    } catch (error) {
        console.error('Erro ao solicitar permissão de notificação:', error);
        return false;
    }
};

// Ícone padrão para notificações
const DEFAULT_ICON = '/favicon.ico';

// Badge para PWA (ícone pequeno)
const DEFAULT_BADGE = '/favicon.ico';

/**
 * Tipos de notificação suportados
 */
export type NotificationType =
    | 'newRideRequest'     // Motorista: nova solicitação
    | 'rideAccepted'       // Passageiro: corrida aceita
    | 'driverArrived'      // Passageiro: motorista chegou
    | 'rideStarted'        // Passageiro: corrida iniciada
    | 'rideCompleted'      // Ambos: corrida finalizada
    | 'rideCancelled'      // Ambos: corrida cancelada
    | 'newMessage'         // Ambos: nova mensagem no chat
    | 'paymentConfirmed';  // Passageiro: pagamento confirmado

interface NotificationData {
    title: string;
    body: string;
    icon?: string;
    tag?: string;          // Agrupa notificações do mesmo tipo
    requireInteraction?: boolean;  // Não fecha automaticamente
    data?: any;            // Dados extras para click handler
}

/**
 * Configurações de notificação por tipo
 */
const notificationConfigs: Record<NotificationType, (data?: any) => NotificationData> = {
    newRideRequest: (data) => ({
        title: '🏍️ Nova corrida disponível!',
        body: `R$ ${data?.price?.toFixed(2) || '0,00'} - ${data?.origin || 'Origem'} → ${data?.destination || 'Destino'}`,
        tag: 'new-ride',
        requireInteraction: true,
    }),

    rideAccepted: (data) => ({
        title: '✅ Motorista a caminho!',
        body: `${data?.driverName || 'Seu motorista'} está indo até você`,
        tag: 'ride-status',
    }),

    driverArrived: (data) => ({
        title: '📍 Motorista chegou!',
        body: `${data?.driverName || 'Seu motorista'} está te esperando`,
        tag: 'ride-status',
        requireInteraction: true,
    }),

    rideStarted: () => ({
        title: '🚀 Corrida iniciada',
        body: 'Boa viagem! Aproveite o trajeto.',
        tag: 'ride-status',
    }),

    rideCompleted: () => ({
        title: '🎉 Corrida concluída!',
        body: 'Obrigado por usar o MotoJá. Avalie sua experiência!',
        tag: 'ride-status',
    }),

    rideCancelled: () => ({
        title: '❌ Corrida cancelada',
        body: 'A corrida foi cancelada.',
        tag: 'ride-status',
    }),

    newMessage: (data) => ({
        title: `💬 ${data?.senderName || 'Nova mensagem'}`,
        body: data?.message || 'Você recebeu uma nova mensagem',
        tag: 'chat-message',
    }),

    paymentConfirmed: (data) => ({
        title: '💰 Pagamento confirmado!',
        body: `R$ ${data?.amount?.toFixed(2) || '0,00'} processado com sucesso`,
        tag: 'payment',
    }),
};

/**
 * Envia uma notificação local para o usuário
 * @param type Tipo da notificação
 * @param data Dados opcionais para personalizar a mensagem
 */
export const showNotification = async (
    type: NotificationType,
    data?: Record<string, any>
): Promise<boolean> => {
    // Verificar permissão
    if (Notification.permission !== 'granted') {
        console.warn('Permissão de notificação não concedida');
        return false;
    }

    // Não mostrar se a página estiver visível e em foco
    // (deixa para o app mostrar via UI)
    if (document.visibilityState === 'visible' && document.hasFocus()) {
        return false;
    }

    try {
        const config = notificationConfigs[type](data);

        const notification = new Notification(config.title, {
            body: config.body,
            icon: config.icon || DEFAULT_ICON,
            badge: DEFAULT_BADGE,
            tag: config.tag,
            requireInteraction: config.requireInteraction || false,
            data: config.data,
            silent: false, // Permite som do sistema
        });

        // Handler para quando usuário clica na notificação
        notification.onclick = () => {
            // Foca na janela do app
            window.focus();
            notification.close();
        };

        return true;
    } catch (error) {
        console.error('Erro ao mostrar notificação:', error);
        return false;
    }
};

/**
 * Verifica e solicita permissão se necessário
 * Retorna true se permissão foi concedida
 */
export const ensureNotificationPermission = async (): Promise<boolean> => {
    const status = getPermissionStatus();

    if (status === 'granted') return true;
    if (status === 'denied' || status === 'unsupported') return false;

    return requestNotificationPermission();
};
