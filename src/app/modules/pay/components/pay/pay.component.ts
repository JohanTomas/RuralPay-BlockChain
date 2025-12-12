import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PayService } from '../../services/pay.service';
import { ContactService } from '../../../contact/services/contact.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { Contact } from '../../../../shared/models/contact.model';
import { Transaction } from '../../../../shared/models/transaction.model';
import { CommonModule } from '@angular/common';
import { NavigationService } from '../../../../shared/services/navigation.service';

@Component({
  selector: 'app-pay',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './pay.component.html',
  styleUrl: './pay.component.css'
})
export class PayComponent implements OnInit {
  contacts: Contact[] = [];
  selectedContact: Contact | null = null;
  amount: string = '';
  description: string = '';
  walletAddress: string | null = null;
  firstName: string = 'Juan';
  lastName: string = 'Pérez';
  profileImage: string | null = null;
  isProfileMenuOpen: boolean = false;

  constructor(
    public router: Router, // Hacer router público para usarlo en la plantilla
    private payService: PayService,
    private contactService: ContactService,
    private notificationService: NotificationService,
    public navigationService: NavigationService // Agregar NavigationService
  ) {}

  ngOnInit() {
    // Obtener la dirección de billetera del localStorage
    this.walletAddress = localStorage.getItem('walletAddress');

    // Cargar contactos
    this.loadContacts();

    // Cargar datos del perfil
    this.loadProfileData();
  }

  loadProfileData() {
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

  loadContacts() {
    this.contacts = this.contactService.getContacts();
  }

  selectContact(contact: Contact) {
    this.selectedContact = contact;
  }

  // Método auxiliar para usar parseFloat en la plantilla
  parseAmount(amount: string): number {
    return parseFloat(amount) || 0;
  }

  // Métodos para el menú móvil y perfil
  toggleMobileMenu() {
    this.navigationService.toggleMobileMenu();
  }

  toggleProfileMenu() {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }

  closeProfileMenu() {
    this.isProfileMenuOpen = false;
  }

  logout() {
    // Limpiar datos de sesión
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('chainId');
    localStorage.removeItem('balance');
    localStorage.removeItem('userProfile');

    // Redirigir a la página de inicio
    this.router.navigate(['/']);
  }

  async sendTransaction() {
    if (!this.selectedContact) {
      this.notificationService.error('Error', 'Por favor seleccione un contacto', 3000);
      return;
    }

    if (!this.amount || this.parseAmount(this.amount) <= 0) {
      this.notificationService.error('Error', 'Por favor ingrese un monto válido', 3000);
      return;
    }

    if (!this.walletAddress) {
      this.notificationService.error('Error', 'No se ha encontrado la dirección de billetera', 3000);
      return;
    }

    try {
      // Preparar la transacción
      const transactionData = {
        from: this.walletAddress,
        to: this.selectedContact.address,
        amount: this.amount,
        description: this.description,
        timestamp: new Date().toISOString()
      };

      // Solicitar confirmación mediante MetaMask
      const result = await this.confirmTransactionWithMetaMask(transactionData);

      if (result) {
        // Registrar la transacción en el historial
        this.payService.recordTransaction(transactionData);

        // Mostrar mensaje de éxito
        this.notificationService.success('Transacción exitosa', 'La transacción se ha realizado correctamente', 3000);

        // Limpiar el formulario
        this.amount = '';
        this.description = '';
        this.selectedContact = null;

        // Redirigir al historial
        this.router.navigate(['/history']);
      }
    } catch (error) {
      console.error('Error sending transaction:', error);
      this.notificationService.error('Error', 'No se pudo completar la transacción', 3000);
    }
  }

  async confirmTransactionWithMetaMask(transaction: Omit<Transaction, 'id' | 'status' | 'hash'>) {
    try {
      // Verificar si MetaMask está disponible
      if (typeof window.ethereum === 'undefined') {
        this.notificationService.error('Billetera no encontrada', 'Por favor instale MetaMask para continuar', 5000);
        return false;
      }

      // Formatear el monto a wei (para Ethereum)
      const amountInWei = (this.parseAmount(transaction.amount) * 1e18).toString(16);

      // Crear la transacción
      const txParams = {
        from: transaction.from,
        to: transaction.to,
        value: '0x' + amountInWei,
        gasPrice: '0x3B9ACA00', // 1 Gwei en hexadecimal
        gasLimit: '0x5208' // 21000 en hexadecimal
      };

      // Solicitar firma de la transacción
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [txParams]
      });

      console.log('Transaction hash:', txHash);
      return true;
    } catch (error: any) {
      console.error('Error confirming transaction with MetaMask:', error);
      if (error.code === 4001) {
        this.notificationService.error('Transacción rechazada', 'Ha rechazado la transacción en MetaMask', 5000);
      } else {
        this.notificationService.error('Error', 'No se pudo confirmar la transacción con MetaMask', 5000);
      }
      return false;
    }
  }
}
