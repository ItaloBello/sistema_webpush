// Configuração - Substitua com sua chave pública VAPID
const VAPID_PUBLIC_KEY = 'BMReun7q58yoM2DTiOq_Cr3bQpfjz2TyBNGg0xoYIGP_4Q5NYgGCvnnkcCnxRUUd6QA05pxXWCKyZgF5Fl08UeE';
const SERVICE_WORKER_PATH = '/frontend/sw.js';
const BACKEND_URL = 'http://localhost:8080'; // Altere para seu backend

class WebPushFrontend {
    constructor() {
        this.subscription = null;
        this.isSubscribed = false;
        this.permission = Notification.permission;
        this.init();
    }

    async init() {
        this.updateStatus();
        this.setupEventListeners();
        await this.checkServiceWorker();
        this.updateControls();
    }

    // Log de eventos
    log(message, type = 'info') {
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        logEntry.innerHTML = `[${new Date().toLocaleTimeString()}] ${message}`;
        
        const logContainer = document.getElementById('event-log');
        logContainer.appendChild(logEntry);
        logContainer.scrollTop = logContainer.scrollHeight;
        
        console.log(`[${type.toUpperCase()}] ${message}`);  
    }

    // Atualizar status na interface
    updateStatus() {
        // Service Worker status
        const swStatus = document.getElementById('sw-status');
        swStatus.textContent = 'serviceWorker' in navigator ? '✅ Suportado' : '❌ Não suportado';
        swStatus.className = 'status-badge ' + ('serviceWorker' in navigator ? 'success' : 'error');

        // Push API status
        const pushStatus = document.getElementById('push-status');
        pushStatus.textContent = 'PushManager' in window ? '✅ Suportado' : '❌ Não suportado';
        pushStatus.className = 'status-badge ' + ('PushManager' in window ? 'success' : 'error');

        // Permission status
        const permissionStatus = document.getElementById('permission-status');
        let permissionText = '❓ Desconhecido';
        let permissionClass = 'warning';
        
        switch(this.permission) {
            case 'granted':
                permissionText = '✅ Concedida';
                permissionClass = 'success';
                break;
            case 'denied':
                permissionText = '❌ Negada';
                permissionClass = 'error';
                break;
            case 'default':
                permissionText = '⏳ Não solicitada';
                permissionClass = 'warning';
                break;
        }
        
        permissionStatus.textContent = permissionText;
        permissionStatus.className = 'status-badge ' + permissionClass;
    }

    // Configurar listeners dos botões
    setupEventListeners() {
        document.getElementById('request-permission').addEventListener('click', () => this.requestPermission());
        document.getElementById('subscribe').addEventListener('click', () => this.subscribe());
        document.getElementById('unsubscribe').addEventListener('click', () => this.unsubscribe());
        document.getElementById('test-notification').addEventListener('click', () => this.sendTestNotification());
        document.getElementById('send-custom').addEventListener('click', () => this.toggleCustomForm());
        document.getElementById('send-custom-now').addEventListener('click', () => this.sendCustomNotification());
        document.getElementById('copy-subscription').addEventListener('click', () => this.copySubscription());
        document.getElementById('clear-log').addEventListener('click', () => this.clearLog());

        // Verificar subscription quando a página carrega
        window.addEventListener('load', () => this.checkSubscription());
    }

    // Verificar Service Worker
    async checkServiceWorker() {
        if (!('serviceWorker' in navigator)) {
            this.log('Service Worker não é suportado neste navegador', 'error');
            return;
        }

        try {
            const registration = await navigator.serviceWorker.register(SERVICE_WORKER_PATH);
            this.log(`Service Worker registrado com escopo: ${registration.scope}`, 'success');
            
            // Verificar subscription existente
            registration.pushManager.getSubscription().then(subscription => {
                this.subscription = subscription;
                this.isSubscribed = !(subscription === null);
                this.updateSubscriptionStatus();
                this.updateControls();
            });
            
        } catch (error) {
            this.log(`Falha ao registrar Service Worker: ${error.message}`, 'error');
        }
    }

    // Solicitar permissão
    async requestPermission() {
        if (!('Notification' in window)) {
            this.log('Notificações não são suportadas', 'error');
            return;
        }

        try {
            const permission = await Notification.requestPermission();
            this.permission = permission;
            this.updateStatus();
            this.updateControls();
            
            if (permission === 'granted') {
                this.log('Permissão para notificações concedida!', 'success');
            } else {
                this.log(`Permissão negada: ${permission}`, 'warning');
            }
        } catch (error) {
            this.log(`Erro ao solicitar permissão: ${error.message}`, 'error');
        }
    }

    // Inscrever para push notifications
    async subscribe() {
        if (!('serviceWorker' in navigator)) {
            this.log('Service Worker não disponível', 'error');
            return;
        }

        try {
            const registration = await navigator.serviceWorker.ready;
            
            if (!VAPID_PUBLIC_KEY || VAPID_PUBLIC_KEY === 'SUA_CHAVE_PUBLICA_VAPID_AQUI') {
                this.log('Configure sua chave pública VAPID primeiro!', 'error');
                return;
            }

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });

            this.subscription = subscription;
            this.isSubscribed = true;
            
            // Enviar subscription para o servidor
            await this.sendSubscriptionToBackend(subscription);
            
            this.log('Inscrito para notificações push!', 'success');
            this.updateSubscriptionStatus();
            this.updateControls();
            
        } catch (error) {
            this.log(`Erro na inscrição: ${error.message}`, 'error');
        }
    }

    // Cancelar inscrição
    async unsubscribe() {
        if (!this.subscription) {
            this.log('Nenhuma inscrição ativa', 'warning');
            return;
        }

        try {
            const success = await this.subscription.unsubscribe();
            
            if (success) {
                // Remover do servidor
                await this.removeSubscriptionFromBackend(this.subscription);
                
                this.subscription = null;
                this.isSubscribed = false;
                
                this.log('Inscrição cancelada com sucesso', 'success');
                this.updateSubscriptionStatus();
                this.updateControls();
            }
        } catch (error) {
            this.log(`Erro ao cancelar inscrição: ${error.message}`, 'error');
        }
    }

    // Enviar notificação de teste
    async sendTestNotification() {
        if (!this.isSubscribed) {
            this.log('Inscreva-se primeiro para testar notificações', 'warning');
            return;
        }

        try {
            const response = await fetch(`${BACKEND_URL}/api/send-test`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscription: this.subscription })
            });

            if (response.ok) {
                this.log('Notificação de teste enviada!', 'success');
            } else {
                this.log('Erro ao enviar notificação de teste', 'error');
            }
        } catch (error) {
            this.log(`Erro: ${error.message}`, 'error');
        }
    }

    // Enviar notificação customizada
    async sendCustomNotification() {
        if (!this.isSubscribed) {
            this.log('Inscreva-se primeiro', 'warning');
            return;
        }

        const title = document.getElementById('title').value || 'Notificação';
        const body = document.getElementById('body').value || 'Mensagem';
        const icon = document.getElementById('icon').value || '';
        const url = document.getElementById('url').value || '';

        const notificationData = {
            title,
            body,
            icon,
            url,
            actions: [
                { action: 'open', title: 'Abrir' },
                { action: 'close', title: 'Fechar' }
            ]
        };

        try {
            const response = await fetch(`${BACKEND_URL}/api/send-notification`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subscription: this.subscription,
                    payload: notificationData
                })
            });

            if (response.ok) {
                this.log('Notificação customizada enviada!', 'success');
            } else {
                this.log('Erro ao enviar notificação customizada', 'error');
            }
        } catch (error) {
            this.log(`Erro: ${error.message}`, 'error');
        }
    }

    // Enviar subscription para o backend
    async sendSubscriptionToBackend(subscription) {
        try {
            const response = await fetch(`${BACKEND_URL}/api/save-subscription`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(subscription)
            });

            if (response.ok) {
                this.log('Subscription salva no servidor', 'success');
            }
        } catch (error) {
            this.log(`Erro ao salvar subscription: ${error.message}`, 'warning');
        }
    }

    // Remover subscription do backend
    async removeSubscriptionFromBackend(subscription) {
        try {
            await fetch(`${BACKEND_URL}/api/remove-subscription`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(subscription)
            });
        } catch (error) {
            // Silencioso - não é crítico
        }
    }

    // Verificar subscription atual
    async checkSubscription() {
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            
            this.subscription = subscription;
            this.isSubscribed = !(subscription === null);
            this.updateSubscriptionStatus();
            this.updateControls();
        }
    }

    // Atualizar status da subscription
    updateSubscriptionStatus() {
        const statusElement = document.getElementById('subscription-status');
        const detailsElement = document.getElementById('subscription-details');
        const copyButton = document.getElementById('copy-subscription');
        
        if (this.isSubscribed && this.subscription) {
            statusElement.textContent = '✅ Inscrito';
            statusElement.className = 'status-badge success';
            
            const subJson = JSON.stringify(this.subscription.toJSON(), null, 2);
            detailsElement.textContent = subJson;
            
            copyButton.style.display = 'inline-block';
        } else {
            statusElement.textContent = '❌ Não inscrito';
            statusElement.className = 'status-badge error';
            detailsElement.textContent = 'Nenhuma inscrição ativa';
            copyButton.style.display = 'none';
        }
    }

    // Atualizar controles (habilitar/desabilitar botões)
    updateControls() {
        const requestBtn = document.getElementById('request-permission');
        const subscribeBtn = document.getElementById('subscribe');
        const unsubscribeBtn = document.getElementById('unsubscribe');
        const testBtn = document.getElementById('test-notification');
        const customBtn = document.getElementById('send-custom');
        const customForm = document.getElementById('custom-notification-form');
        const customInfo = document.getElementById('custom-form-info');

        // Habilitar/desabilitar baseado no suporte
        const hasSupport = 'serviceWorker' in navigator && 'PushManager' in window;
        
        requestBtn.disabled = !hasSupport || this.permission !== 'default';
        subscribeBtn.disabled = !hasSupport || !this.isSubscribed && this.permission !== 'granted';
        unsubscribeBtn.disabled = !hasSupport || !this.isSubscribed;
        testBtn.disabled = !hasSupport || !this.isSubscribed;
        customBtn.disabled = !hasSupport || !this.isSubscribed;

        // Mostrar/ocultar formulário customizado
        if (this.isSubscribed) {
            customForm.style.display = 'block';
            customInfo.style.display = 'none';
        } else {
            customForm.style.display = 'none';
            customInfo.style.display = 'block';
        }
    }

    // Mostrar/ocultar formulário customizado
    toggleCustomForm() {
        const form = document.getElementById('custom-notification-form');
        const info = document.getElementById('custom-form-info');
        
        if (form.style.display === 'none') {
            form.style.display = 'block';
            info.style.display = 'none';
        } else {
            form.style.display = 'none';
            info.style.display = 'block';
        }
    }

    // Copiar dados da subscription
    async copySubscription() {
        if (!this.subscription) return;
        
        const subJson = JSON.stringify(this.subscription.toJSON(), null, 2);
        
        try {
            await navigator.clipboard.writeText(subJson);
            this.log('Subscription copiada para a área de transferência!', 'success');
        } catch (err) {
            this.log('Erro ao copiar: ' + err.message, 'error');
        }
    }

    // Limpar log
    clearLog() {
        document.getElementById('event-log').innerHTML = '';
        this.log('Log limpo', 'info');
    }

    // Converter chave VAPID
    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }
}

// Inicializar quando a página carregar
window.addEventListener('DOMContentLoaded', () => {
    window.webPushApp = new WebPushFrontend();
});