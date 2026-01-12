# Guia de Implantação (Deployment)

Este guia descreve como colocar o **MotoJá** em produção.

## 1. Variáveis de Ambiente

Para o app funcionar (Login, Banco de Dados, Pagamentos), você precisa configurar as variáveis de ambiente no seu provedor de hospedagem (Vercel, Netlify, etc.).

Crie as seguintes variáveis (copie os valores do seu `.env` local ou gere novos no painel do Firebase/Mercado Pago):

```bash
# Firebase (Configurações do Projeto)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

# Mercado Pago (Pagamentos)
VITE_MP_PUBLIC_KEY=...
VITE_MP_ACCESS_TOKEN=...
```

> **Nota:** Não inclua o arquivo `.env` no Git. Ele serve apenas para desenvolvimento local.

## 2. Build de Produção

Para gerar a versão otimizada do app:

```bash
npm run build
```

Isso criará a pasta `dist` com os arquivos estáticos.

## 3. Hospedagem (Exemplo: Vercel)

O MotoJá é um SPA (Single Page Application). Certifique-se de configurar o "Output Directory" como `dist`.

Normalmente a Vercel detecta automaticamente:
- **Build Command:** `npm run build` or `vite build`
- **Output Directory:** `dist`

## 4. PWA (Progressive Web App)

O app já está configurado com `manifest.json` e ícones.
- Certifique-se de que os arquivos em `public` (icon-192.png, icon-512.png) estão presentes.
- O navegador deve exibir o prompt "Adicionar à Tela Inicial" em dispositivos móveis.

## 5. Regras de Segurança (Firebase)

No console do Firebase (Firestore Database -> Rules), use regras que protejam seus dados. Exemplo básico para desenvolvimento (ajuste para produção!):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```
