import { Component, EventEmitter, Output } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationService } from '../../../../shared/services/notification.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-google-register',
  imports: [CommonModule, FormsModule],
  templateUrl: './google-register.component.html',
  styleUrl: './google-register.component.css'
})
export class GoogleRegisterComponent {
  firstName: string = '';
  lastName: string = '';
  phone: string = '';
  address: string = '';
  password: string = '';
  confirmPassword: string = '';

  @Output() registrationComplete = new EventEmitter<{firstName: string, lastName: string, phone: string, address: string, password: string}>();
  @Output() cancelRegistration = new EventEmitter<void>();

  constructor(
    private router: Router,
    private notificationService: NotificationService
  ) {}

  onSubmit() {
    // Validate required fields
    if (!this.firstName || !this.lastName) {
      this.notificationService.error('Campos requeridos', 'Nombre y apellido son obligatorios', 3000);
      return;
    }

    // Validate password
    if (!this.password || this.password.length < 8) {
      this.notificationService.error('Contraseña débil', 'La contraseña debe tener al menos 8 caracteres', 3000);
      return;
    }

    // Validate password confirmation
    if (this.password !== this.confirmPassword) {
      this.notificationService.error('Contraseña inválida', 'Las contraseñas no coinciden', 3000);
      return;
    }

    // Emit the registration data
    this.registrationComplete.emit({
      firstName: this.firstName,
      lastName: this.lastName,
      phone: this.phone,
      address: this.address,
      password: this.password
    });
  }

  onCancel() {
    this.cancelRegistration.emit();
  }
}
