import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../../services/notification.service';

@Component({
  selector: 'app-toast',
  imports: [CommonModule],
  templateUrl: './toast.html',
  styleUrl: './toast.css',
  standalone: true
})
export class Toast {
  private readonly notificationService = inject(NotificationService);

  messages = computed(() => this.notificationService.toastMessages());

  onClose(id: string): void {
    this.notificationService.removeMessage(id);
  }

  getToastClasses(type: string): string {
    const baseClasses = 'toast-item animate-slide-in';
    const typeClasses = {
      success: 'toast-success',
      error: 'toast-error',
      warning: 'toast-warning',
      info: 'toast-info'
    };
    return `${baseClasses} ${typeClasses[type as keyof typeof typeClasses] || ''}`;
  }
}
