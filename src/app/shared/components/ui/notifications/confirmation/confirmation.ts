import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../../services/notification.service';

@Component({
  selector: 'app-confirmation',
  imports: [CommonModule],
  templateUrl: './confirmation.html',
  styleUrl: './confirmation.css'
})
export class Confirmation {
  @Input() title: string = 'Confirmación';
  @Input() message: string = '¿Está seguro de que desea continuar?';
  @Input() confirmText: string = 'Confirmar';
  @Input() cancelText: string = 'Cancelar';
  @Input() type: 'success' | 'error' | 'warning' | 'info' = 'warning';

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  constructor(private notificationService: NotificationService) {}

  onConfirm() {
    this.confirm.emit();
    // Show success notification
    this.notificationService.success('Confirmado', 'Acción confirmada exitosamente', 3000);
  }

  onCancel() {
    this.cancel.emit();
    // Show info notification
    this.notificationService.info('Cancelado', 'Acción cancelada', 3000);
  }
}
