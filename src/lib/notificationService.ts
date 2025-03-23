import { toast } from "@/hooks/use-toast";

// Use the browser's native PushSubscription type
type BrowserPushSubscription = PushSubscription;

export interface CustomPushSubscription {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
  actions?: NotificationAction[];
  url?: string;
  silent?: boolean;
}

type NotificationPermission = 'granted' | 'denied' | 'default';

export class NotificationService {
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private subscription: BrowserPushSubscription | null = null;
  private permissionCallbacks: ((permission: NotificationPermission) => void)[] = [];
  private onNotificationClickHandler: ((action: string, tag: string) => void) | null = null;
  
  constructor() {
    this.init();
  }
  
  public async init(): Promise<void> {
    if (!this.isSupported()) {
      console.warn('Push notifications are not supported in this browser');
      return;
    }
    
    try {
      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'NOTIFICATION_ACTION') {
          if (this.onNotificationClickHandler) {
            this.onNotificationClickHandler(event.data.action, event.data.tag);
          }
        } else if (event.data && event.data.type === 'SUBSCRIPTION_UPDATED') {
          this.subscription = event.data.subscription;
          this.saveSubscription();
        }
      });
      
      // Register service worker if not already registered
      this.serviceWorkerRegistration = await this.registerServiceWorker();
      
      // Get existing subscription if any
      this.subscription = await this.getExistingSubscription();
      
      // Save the subscription to local storage
      if (this.subscription) {
        this.saveSubscription();
      }
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
    }
  }
  
  public isSupported(): boolean {
    return 'serviceWorker' in navigator && 
           'PushManager' in window && 
           'Notification' in window;
  }
  
  public async getPermissionStatus(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      return 'denied';
    }
    
    return Notification.permission as NotificationPermission;
  }
  
  public async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      return 'denied';
    }
    
    let permission: NotificationPermission;
    
    try {
      permission = await Notification.requestPermission() as NotificationPermission;
      
      // Notify all callbacks
      this.permissionCallbacks.forEach(callback => {
        callback(permission);
      });
      
      if (permission === 'granted') {
        // If permission granted, subscribe to push
        await this.subscribeToPush();
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      permission = 'denied';
    }
    
    return permission;
  }
  
  public onPermissionChange(callback: (permission: NotificationPermission) => void): void {
    this.permissionCallbacks.push(callback);
    
    // Call immediately with current status
    this.getPermissionStatus().then(permission => {
      callback(permission);
    });
  }
  
  public async showNotification(options: NotificationOptions): Promise<boolean> {
    const permission = await this.getPermissionStatus();
    
    if (permission !== 'granted') {
      console.warn('Notification permission not granted');
      return false;
    }
    
    try {
      // If we have service worker, use it
      if (this.serviceWorkerRegistration) {
        await this.serviceWorkerRegistration.showNotification(options.title, {
          body: options.body,
          icon: options.icon || '/notification-icon.png',
          badge: options.badge || '/notification-badge.png',
          tag: options.tag || 'default',
          data: {
            url: options.url || window.location.href,
            ...options.data
          },
          actions: options.actions || [],
          requireInteraction: options.requireInteraction || false,
          silent: options.silent || false
        });
      } else {
        // Fallback to browser notification
        const notification = new Notification(options.title, {
          body: options.body,
          icon: options.icon || '/notification-icon.png',
          tag: options.tag || 'default',
          silent: options.silent || false
        });
        
        notification.onclick = () => {
          if (options.url) {
            window.open(options.url, '_blank');
          }
          notification.close();
        };
      }
      
      return true;
    } catch (error) {
      console.error('Error showing notification:', error);
      return false;
    }
  }
  
  public onNotificationClick(handler: (action: string, tag: string) => void): void {
    this.onNotificationClickHandler = handler;
  }
  
  public async subscribeToPush(): Promise<BrowserPushSubscription | null> {
    if (!this.serviceWorkerRegistration) {
      console.warn('Service worker not registered');
      return null;
    }
    
    try {
      // Check if already subscribed
      let subscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
      
      if (!subscription) {
        // Get public VAPID key from server
        // In a real app, this would be fetched from your server
        const publicVapidKey = 'BD9VXdcINg6lWbf9e37H1gP_TqpnPMwGaFKh7KBDbBQYHcRvvY7lIzXB1i7XJzZOr7jAjZQeK_M57XKlHC2jfhw';
        
        // Convert VAPID key to Uint8Array
        const convertedVapidKey = this.urlBase64ToUint8Array(publicVapidKey);
        
        // Subscribe
        subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey
        });
        
        // Save the subscription
        this.subscription = subscription;
        this.saveSubscription();
        
        // Send the subscription to your server
        await this.sendSubscriptionToServer(subscription);
      }
      
      return subscription;
    } catch (error) {
      console.error('Error subscribing to push:', error);
      
      if (Notification.permission === 'denied') {
        toast({
          title: "Notification Permission Denied",
          description: "Please enable notifications in your browser settings.",
          variant: "destructive",
        });
      }
      
      return null;
    }
  }
  
  public async unsubscribe(): Promise<boolean> {
    if (!this.serviceWorkerRegistration) {
      return false;
    }
    
    try {
      const subscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        
        // Remove from server
        await this.sendUnsubscriptionToServer(subscription);
        
        // Clear local storage
        localStorage.removeItem('pushSubscription');
        this.subscription = null;
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error unsubscribing from push:', error);
      return false;
    }
  }
  
  private async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      return null;
    }
    
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      console.log('Service worker registered:', registration);
      
      // Wait for the service worker to be activated
      if (registration.active) {
        return registration;
      }
      
      return new Promise((resolve) => {
        if (registration.installing) {
          registration.installing.addEventListener('statechange', (e) => {
            if ((e.target as ServiceWorker).state === 'activated') {
              resolve(registration);
            }
          });
        } else if (registration.waiting) {
          registration.waiting.addEventListener('statechange', (e) => {
            if ((e.target as ServiceWorker).state === 'activated') {
              resolve(registration);
            }
          });
        } else {
          resolve(registration);
        }
      });
    } catch (error) {
      console.error('Service worker registration failed:', error);
      return null;
    }
  }
  
  private async getExistingSubscription(): Promise<BrowserPushSubscription | null> {
    if (!this.serviceWorkerRegistration) {
      return null;
    }
    
    try {
      // Try to get from browser
      const subscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
      
      if (subscription) {
        return subscription;
      }
      
      // Try to get from localStorage
      const savedSubscription = localStorage.getItem('pushSubscription');
      
      if (savedSubscription) {
        try {
          // Convert from stored format back to PushSubscription
          // Note: This won't fully restore the PushSubscription object's methods
          const parsedSubscription = JSON.parse(savedSubscription);
          return parsedSubscription;
        } catch (e) {
          console.error('Error parsing saved subscription', e);
          return null;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error getting existing subscription:', error);
      return null;
    }
  }
  
  private saveSubscription(): void {
    if (this.subscription) {
      try {
        localStorage.setItem('pushSubscription', JSON.stringify(this.subscription));
      } catch (e) {
        console.error('Error saving subscription to localStorage', e);
      }
    }
  }
  
  private async sendSubscriptionToServer(subscription: BrowserPushSubscription): Promise<boolean> {
    // In a real app, you would send the subscription to your server
    // This is a placeholder
    console.log('Sending subscription to server:', subscription);
    
    // Extract the necessary data to send to the server
    const subscriptionData = {
      endpoint: subscription.endpoint,
      expirationTime: subscription.expirationTime,
      keys: {
        p256dh: btoa(String.fromCharCode.apply(null, 
          new Uint8Array(subscription.getKey('p256dh') || new ArrayBuffer(0))
        )),
        auth: btoa(String.fromCharCode.apply(null, 
          new Uint8Array(subscription.getKey('auth') || new ArrayBuffer(0))
        ))
      }
    };
    
    // Mock API call
    try {
      // In a real app, this would be an actual API call
      // const response = await fetch('/api/push/subscribe', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({ subscription: subscriptionData })
      // });
      
      // return response.ok;
      
      // Mock success
      return true;
    } catch (error) {
      console.error('Error sending subscription to server:', error);
      return false;
    }
  }
  
  private async sendUnsubscriptionToServer(subscription: BrowserPushSubscription): Promise<boolean> {
    // In a real app, you would send the unsubscription to your server
    // This is a placeholder
    console.log('Sending unsubscription to server:', subscription);
    
    // Mock API call
    try {
      // In a real app, this would be an actual API call
      // const response = await fetch('/api/push/unsubscribe', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({ endpoint: subscription.endpoint })
      // });
      
      // return response.ok;
      
      // Mock success
      return true;
    } catch (error) {
      console.error('Error sending unsubscription to server:', error);
      return false;
    }
  }
  
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
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

// Export a singleton instance
export const notificationService = new NotificationService(); 