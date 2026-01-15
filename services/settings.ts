/**
 * Settings Service
 * Centralizes all application configuration including Pricing, Company Info, and Integrations.
 * Persists to localStorage for the prototype.
 */

export interface PaymentGatewaySettings {
    provider: 'mercadopago' | 'asaas' | 'stripe' | 'none';
    apiKey: string;
    secretKey?: string;
    webhookUrl?: string; // For callbacks
    publicKey?: string;
}

export interface N8NSettings {
    enabled: boolean;
    webhookUrl: string;
    apiKey?: string;
    events: {
        rideCreated: boolean;
        rideCompleted: boolean;
        driverRegistered: boolean;
    };
}

export interface SMTPSettings {
    host: string;
    port: number;
    user: string;
    pass: string;
    secure: boolean;
    fromName: string;
    fromEmail: string;
}

export interface SystemSettings {
    // Pricing
    basePrice: number;
    pricePerKm: number;
    platformFee: number;

    // Bike Pricing
    bikeBasePrice: number;
    bikePricePerKm: number;
    bikeMaxDistance: number;
    bikePlatformFee: number;

    // Company Info
    appName: string;
    supportPhone: string;
    supportEmail: string;
    companyName: string;
    companyCnpj: string;
    companyAddress: string;
    companyCity: string;
    companyState: string;
    companyCep: string;
    companyEmail: string;
    companyPhone: string;

    // Visual Customization
    visual: {
        loginBackgroundImage: string; // URL or Base64 (Desktop)
        mobileBackgroundImage: string; // URL or Base64 (Mobile)
        appLogoUrl: string; // URL or Base64 (Optional)
        primaryColor: string; // Optional branding
        loginTitle: string; // Custom title
        loginSubtitle: string; // Custom subtitle
    };

    // Integations
    paymentGateway: PaymentGatewaySettings;
    n8n: N8NSettings;
    smtp: SMTPSettings;
}

const DEFAULT_SETTINGS: SystemSettings = {
    basePrice: 5.00,
    pricePerKm: 2.00,
    platformFee: 20,
    bikeBasePrice: 3.00,
    bikePricePerKm: 1.50,
    bikeMaxDistance: 5,
    bikePlatformFee: 15,

    appName: 'MotoJá',
    supportPhone: '(11) 99999-9999',
    supportEmail: 'suporte@motoja.com.br',
    companyName: 'MotoJá Transportes LTDA',
    companyCnpj: '00.000.000/0001-00',
    companyAddress: 'Rua das Motos, 123 - Centro',
    companyCity: 'Avaré',
    companyState: 'SP',
    companyCep: '18700-000',
    companyEmail: 'contato@motoja.com.br',
    companyPhone: '(14) 3732-0000',

    visual: {
        loginBackgroundImage: '/assets/admin_login.png',
        mobileBackgroundImage: '',
        appLogoUrl: '',
        primaryColor: '#f97316', // Orange-500
        loginTitle: 'MotoJá',
        loginSubtitle: 'Gestão completa da plataforma de mobilidade em um único lugar.',
    },

    paymentGateway: {
        provider: 'none',
        apiKey: '',
        secretKey: '',
    },
    n8n: {
        enabled: false,
        webhookUrl: '',
        events: {
            rideCreated: true,
            rideCompleted: true,
            driverRegistered: true,
        }
    },
    smtp: {
        host: 'smtp.example.com',
        port: 587,
        user: 'user@example.com',
        pass: '',
        secure: true,
        fromName: 'MotoJá Notificações',
        fromEmail: 'noreply@motoja.com.br'
    }
};

const STORAGE_KEY = 'motoja_system_settings';

export const getSettings = (): SystemSettings => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            // Deep merge with defaults to ensure all keys exist (especially new nested ones)
            return {
                ...DEFAULT_SETTINGS,
                ...parsed,
                paymentGateway: { ...DEFAULT_SETTINGS.paymentGateway, ...(parsed.paymentGateway || {}) },
                n8n: { ...DEFAULT_SETTINGS.n8n, ...(parsed.n8n || {}) },
                smtp: { ...DEFAULT_SETTINGS.smtp, ...(parsed.smtp || {}) },
                visual: { ...DEFAULT_SETTINGS.visual, ...(parsed.visual || {}) },
            };
        } catch (e) {
            console.error('Failed to parse settings', e);
            return DEFAULT_SETTINGS;
        }
    }
    return DEFAULT_SETTINGS;
};

export const saveSettings = (settings: SystemSettings): void => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
};
