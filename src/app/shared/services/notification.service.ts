import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
     id?: string;
     type: 'success' | 'error' | 'warning' | 'info';
     title: string;
     message: string;
     duration?: number;
     icon?: string;
}

@Injectable({
     providedIn: 'root'
})
export class NotificationService {
     private messages = signal<ToastMessage[]>([]);

     // Getter público para acceder a los mensajes
     get toastMessages() {
          return this.messages.asReadonly();
     }

     private generateId(): string {
          return Math.random().toString(36).substring(2) + Date.now().toString(36);
     }

     private addMessage(message: ToastMessage): void {
          const id = this.generateId();
          const newMessage: ToastMessage = {
               ...message,
               id,
               duration: message.duration || 5000
          };

          this.messages.update(messages => [...messages, newMessage]);

          // Auto remove after duration
          if (newMessage.duration && newMessage.duration > 0) {
               setTimeout(() => {
                    this.removeMessage(id);
               }, newMessage.duration);
          }
     }

     removeMessage(id: string): void {
          this.messages.update(messages => messages.filter(msg => msg.id !== id));
     }

     // Métodos de conveniencia
     success(title: string, message: string, duration?: number): void {
          this.addMessage({
               type: 'success',
               title,
               message,
               duration,
               icon: '✅'
          });
     }

     error(title: string, message: string, duration?: number): void {
          this.addMessage({
               type: 'error',
               title,
               message,
               duration: duration || 8000, // Errores duran más tiempo
               icon: '❌'
          });
     }

     warning(title: string, message: string, duration?: number): void {
          this.addMessage({
               type: 'warning',
               title,
               message,
               duration,
               icon: '⚠️'
          });
     }

     info(title: string, message: string, duration?: number): void {
          this.addMessage({
               type: 'info',
               title,
               message,
               duration,
               icon: 'ℹ️'
          });
     }

     // Limpiar todos los mensajes
     clear(): void {
          this.messages.set([]);
     }
}
