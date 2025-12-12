import { Component, HostListener, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { NotificationService } from '../../../../shared/services/notification.service';
import { ConfirmationService } from '../../../../shared/services/confirmation.service';
import { NavigationService } from '../../../../shared/services/navigation.service';
import { CommonModule } from '@angular/common';
import QRCode from 'qrcode';

@Component({
  selector: 'app-my-qr',
  imports: [RouterModule, CommonModule],
  templateUrl: './my-qr.component.html',
  styleUrl: './my-qr.component.css'
})
export class MyQrComponent implements OnDestroy {
  isProfileMenuOpen = false;
  walletAddress: string | null = null;
  qrCodeDataUrl: string | null = null;

  // Profile properties
  firstName: string = 'Juan';
  lastName: string = 'Pérez';
  profileImage: string | null = null;

  constructor(
    private router: Router,
    private notificationService: NotificationService,
    private confirmationService: ConfirmationService,
    public navigationService: NavigationService
  ) {}

  private profileUpdateListener: any;

  ngOnInit() {
    // Only run localStorage and window-related code in the browser
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      // Load profile data from localStorage
      this.loadProfileData();

      // Load wallet address from localStorage
      this.walletAddress = localStorage.getItem('walletAddress');

      // Generate initial QR code if wallet address exists
      if (this.walletAddress) {
        this.generateQRCode(this.walletAddress);
      }

      // Listen for profile updates
      this.profileUpdateListener = (event: any) => {
        this.firstName = event.detail.firstName;
        this.lastName = event.detail.lastName;
        this.profileImage = event.detail.profileImage;
      };
      window.addEventListener('profileUpdated', this.profileUpdateListener);
    }
  }

  loadProfileData() {
    // Only run localStorage-related code in the browser
    if (typeof localStorage === 'undefined') {
      return;
    }

    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      try {
        const profile = JSON.parse(savedProfile);
        this.firstName = profile.firstName || this.firstName;
        this.lastName = profile.lastName || this.lastName;
        this.profileImage = profile.profileImage || this.profileImage;
      } catch (e) {
        console.error('Error parsing profile data:', e);
      }
    }
  }

  async generateQRCode(data: string) {
    try {
      this.qrCodeDataUrl = await QRCode.toDataURL(data, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
    } catch (err) {
      console.error('Error generating QR code:', err);
      this.notificationService.error('Error', 'No se pudo generar el código QR', 3000);
    }
  }

  copyToClipboard(elementId: string) {
    // Only run document-related code in the browser
    if (typeof document === 'undefined') {
      return;
    }

    const element = document.getElementById(elementId) as HTMLInputElement;
    if (element) {
      element.select();
      document.execCommand('copy');
      this.notificationService.success('Copiado', 'Dirección copiada al portapapeles!', 3000);
    }
  }

  async generateQR() {
    if (this.walletAddress) {
      await this.generateQRCode(this.walletAddress);
      this.notificationService.success('QR Generado', 'Nuevo código QR generado!', 3000);
    } else {
      this.notificationService.error('Error', 'No hay dirección de billetera disponible', 3000);
    }
  }

  async downloadQR() {
    if (this.qrCodeDataUrl) {
      const link = document.createElement('a');
      link.href = this.qrCodeDataUrl;
      link.download = 'mi-qr-code.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      this.notificationService.success('QR Descargado', 'Código QR descargado!', 3000);
    } else {
      this.notificationService.error('Error', 'No hay código QR para descargar', 3000);
    }
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

  toggleMobileMenu() {
    this.navigationService.toggleMobileMenu();
  }

  ngOnDestroy() {
    // Only run window-related code in the browser
    if (typeof window !== 'undefined') {
      // Remove event listeners
      if (this.profileUpdateListener) {
        window.removeEventListener('profileUpdated', this.profileUpdateListener);
      }
    }
  }
}
