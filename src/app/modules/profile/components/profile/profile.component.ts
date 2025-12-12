import { Component, HostListener, ViewChild, ElementRef } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { NotificationService } from '../../../../shared/services/notification.service';
import { ConfirmationService } from '../../../../shared/services/confirmation.service';
import { NavigationService } from '../../../../shared/services/navigation.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-profile',
  imports: [RouterModule, CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent {
  isProfileMenuOpen = false;

  // Profile properties (display values)
  firstName: string = 'Juan';
  lastName: string = 'Pérez';
  email: string = 'juan.perez@example.com';
  phone: string = '+1 (555) 123-4567';
  address: string = 'Calle Principal 123, Ciudad, País';
  walletAddress: string | null = null;

  // Preferences
  notifications: boolean = true;
  newsletter: boolean = true;

  // Security
  currentPassword: string = '';
  newPassword: string = '';
  confirmPassword: string = '';

  // Profile image
  profileImage: string | null = null;

  // Buffer properties (temporary values)
  bufferFirstName: string = 'Juan';
  bufferLastName: string = 'Pérez';
  bufferEmail: string = 'juan.perez@example.com';
  bufferPhone: string = '+1 (555) 123-4567';
  bufferAddress: string = 'Calle Principal 123, Ciudad, País';
  bufferNotifications: boolean = true;
  bufferNewsletter: boolean = true;

  @ViewChild('fileInput') fileInput!: ElementRef;

  constructor(
    private router: Router,
    private notificationService: NotificationService,
    private confirmationService: ConfirmationService,
    public navigationService: NavigationService
  ) {}

  ngOnInit() {
    // Only run localStorage-related code in the browser
    if (typeof localStorage !== 'undefined') {
      // Load wallet address from localStorage
      this.walletAddress = localStorage.getItem('walletAddress');

      // Load profile data from localStorage if available
      const savedProfile = localStorage.getItem('userProfile');
      if (savedProfile) {
        try {
          const profile = JSON.parse(savedProfile);
          this.firstName = profile.firstName || this.firstName;
          this.lastName = profile.lastName || this.lastName;
          this.email = profile.email || this.email;
          this.phone = profile.phone || this.phone;
          this.address = profile.address || this.address;
          this.notifications = profile.notifications !== undefined ? profile.notifications : this.notifications;
          this.newsletter = profile.newsletter !== undefined ? profile.newsletter : this.newsletter;
          this.profileImage = profile.profileImage || this.profileImage;

          // Initialize buffer values
          this.bufferFirstName = this.firstName;
          this.bufferLastName = this.lastName;
          this.bufferEmail = this.email;
          this.bufferPhone = this.phone;
          this.bufferAddress = this.address;
          this.bufferNotifications = this.notifications;
          this.bufferNewsletter = this.newsletter;
        } catch (e) {
          console.error('Error parsing profile data:', e);
        }
      } else {
        // Initialize buffer values with defaults
        this.bufferFirstName = this.firstName;
        this.bufferLastName = this.lastName;
        this.bufferEmail = this.email;
        this.bufferPhone = this.phone;
        this.bufferAddress = this.address;
        this.bufferNotifications = this.notifications;
        this.bufferNewsletter = this.newsletter;
      }
    }
  }

  toggleMobileMenu() {
    this.navigationService.toggleMobileMenu();
  }

  triggerFileInput() {
    // Only run ElementRef-related code in the browser
    if (typeof window !== 'undefined' && this.fileInput && this.fileInput.nativeElement) {
      this.fileInput.nativeElement.click();
    }
  }

  onFileSelected(event: any) {
    // Only run FileReader-related code in the browser
    if (typeof window === 'undefined' || typeof FileReader === 'undefined') {
      return;
    }

    const file: File = event.target.files[0];
    if (file) {
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        this.notificationService.error('Imagen muy grande', 'La imagen debe ser menor a 2MB', 3000);
        return;
      }

      // Check file type
      if (!file.type.match('image.*')) {
        this.notificationService.error('Tipo de archivo inválido', 'Por favor seleccione un archivo de imagen', 3000);
        return;
      }

      // Create a preview of the image
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.profileImage = e.target.result;
        // For image uploads, we apply the change immediately
        // Save to localStorage
        this.saveProfileToLocalStorage();
        this.notificationService.success('Imagen actualizada', 'La imagen de perfil se ha actualizado exitosamente', 3000);
      };
      reader.onerror = (e: any) => {
        this.notificationService.error('Error al cargar imagen', 'No se pudo cargar la imagen seleccionada', 3000);
      };
      reader.readAsDataURL(file);
    }
  }

  formatAddress(address: string | null): string {
    if (!address) return 'No conectado';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }

  cancelChanges() {
    // Show confirmation dialog before canceling
    this.confirmationService.confirm({
      title: 'Cancelar cambios',
      message: '¿Está seguro de que desea cancelar los cambios? Se perderán todos los datos no guardados.',
      confirmText: 'Sí, cancelar',
      cancelText: 'No, continuar editando'
    }).subscribe(confirmed => {
      if (confirmed) {
        // Reset buffer values to current saved values
        this.bufferFirstName = this.firstName;
        this.bufferLastName = this.lastName;
        this.bufferEmail = this.email;
        this.bufferPhone = this.phone;
        this.bufferAddress = this.address;
        this.bufferNotifications = this.notifications;
        this.bufferNewsletter = this.newsletter;

        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
        this.notificationService.info('Cambios cancelados', 'Los cambios han sido cancelados exitosamente', 3000);
      }
    });
  }

  saveChanges(form: any) {
    // Mark all fields as touched to show validation errors
    if (form) {
      Object.keys(form.controls).forEach(field => {
        const control = form.controls[field];
        control.markAsTouched({ onlySelf: true });
      });
    }

    // Validate form
    if (form && form.invalid) {
      this.notificationService.error('Formulario inválido', 'Por favor complete todos los campos requeridos correctamente', 3000);
      return;
    }

    // In a real implementation, you would validate the current password first
    if (this.currentPassword && this.currentPassword.length > 0) {
      // Simulate password validation
      // In a real app, you would check this against a backend service
      console.log('Validating current password...');
    }

    if (this.newPassword && this.newPassword !== this.confirmPassword) {
      this.notificationService.error('Contraseña inválida', 'Las contraseñas no coinciden', 3000);
      return;
    }

    // Apply buffer values to actual properties
    this.firstName = this.bufferFirstName;
    this.lastName = this.bufferLastName;
    this.email = this.bufferEmail;
    this.phone = this.bufferPhone;
    this.address = this.bufferAddress;
    this.notifications = this.bufferNotifications;
    this.newsletter = this.bufferNewsletter;

    // Save profile data to localStorage
    this.saveProfileToLocalStorage();

    // Show success message
    this.notificationService.success('Perfil actualizado', 'Perfil actualizado exitosamente!', 3000);

    // Reset password fields
    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
  }

  private saveProfileToLocalStorage() {
    // Only run localStorage and window-related code in the browser
    if (typeof localStorage === 'undefined' || typeof window === 'undefined') {
      return;
    }

    const profile = {
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      phone: this.phone,
      address: this.address,
      notifications: this.notifications,
      newsletter: this.newsletter,
      profileImage: this.profileImage
    };
    localStorage.setItem('userProfile', JSON.stringify(profile));

    // Dispatch a custom event to notify other components of profile changes
    console.log('Dispatching profileUpdated event with profile:', profile);
    window.dispatchEvent(new CustomEvent('profileUpdated', { detail: profile }));
  }

  toggleProfileMenu() {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }

  closeProfileMenu() {
    this.isProfileMenuOpen = false;
  }

  logout() {
    // Show confirmation dialog before logging out
    this.confirmationService.confirm({
      title: 'Cerrar sesión',
      message: '¿Está seguro de que desea cerrar sesión?',
      confirmText: 'Sí, cerrar sesión',
      cancelText: 'Cancelar'
    }).subscribe(confirmed => {
      if (confirmed) {
        // Close the profile menu
        this.closeProfileMenu();

        // In a real implementation, you would clear user session data
        console.log('User logged out');

        // Show success message
        this.notificationService.success('Sesión cerrada', 'Has cerrado sesión exitosamente', 3000);

        // Redirect to login page
        this.router.navigate(['/login']);
      }
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    // Only run document-related code in the browser
    if (typeof document !== 'undefined') {
      const profileMenuContainer = document.getElementById('profile-menu-container');
      if (profileMenuContainer && !profileMenuContainer.contains(event.target as Node)) {
        this.closeProfileMenu();
      }
    }
  }
}
