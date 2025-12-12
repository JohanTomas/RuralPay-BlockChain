import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule, ActivationEnd } from '@angular/router';
import { HistoryService } from '../../services/history.service';
import { Transaction } from '../../../../shared/models/transaction.model';
import { ContactService } from '../../../contact/services/contact.service';
import { Contact } from '../../../../shared/models/contact.model';
import { CommonModule } from '@angular/common';
import { NavigationService } from '../../../../shared/services/navigation.service';
import { Subscription, filter } from 'rxjs';

@Component({
  selector: 'app-history',
  imports: [CommonModule, RouterModule],
  templateUrl: './history.component.html',
  styleUrl: './history.component.css'
})
export class HistoryComponent implements OnInit, OnDestroy {
  transactions: Transaction[] = [];
  contacts: Contact[] = [];
  firstName: string = 'Juan';
  lastName: string = 'Pérez';
  profileImage: string | null = null;
  isProfileMenuOpen: boolean = false;
  currentChainId: string | null = null;
  userWalletAddress: string | null = null;

  private chainIdSubscription: Subscription | null = null;
  private routerSubscription: Subscription | null = null;

  constructor(
    public router: Router, // Hacer router público para usarlo en la plantilla
    private historyService: HistoryService,
    private contactService: ContactService,
    public navigationService: NavigationService // Agregar NavigationService
  ) {}

  ngOnInit() {
    this.loadUserWalletAddress();
    this.loadTransactions();
    this.loadContacts();
    this.loadProfileData();
    this.loadCurrentNetwork();

    // Suscribirse a cambios de chainId en el NavigationService
    this.chainIdSubscription = this.navigationService.currentChainId$.subscribe(
      (chainId: string | null) => {
        console.log('History component received chainId update:', chainId);
        this.currentChainId = chainId;
        this.loadTransactions();
      }
    );

    // Suscribirse a eventos de navegación para recargar cuando se navega al historial
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof ActivationEnd)
    ).subscribe(() => {
      console.log('History component activated, reloading transactions');
      this.loadCurrentNetwork();
      this.loadTransactions();
    });
  }

  loadUserWalletAddress() {
    this.userWalletAddress = localStorage.getItem('walletAddress');
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

  loadCurrentNetwork() {
    this.currentChainId = this.navigationService.getChainId() || localStorage.getItem('chainId');
    console.log('Current chainId in history:', this.currentChainId);
  }

  loadTransactions() {
    // Obtener todas las transacciones
    let allTransactions = this.historyService.getTransactions().sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    console.log('All transactions:', allTransactions);
    console.log('Current chainId for filtering:', this.currentChainId);

    // Filtrar transacciones por la red actual si hay una red seleccionada
    if (this.currentChainId) {
      allTransactions = allTransactions.filter(transaction => {
        // Mostrar transacciones que coincidan con la red actual
        // Si la transacción no tiene chainId, no se mostrará (solo se muestran transacciones con chainId definido)
        const shouldShow = transaction.chainId === this.currentChainId;
        console.log(`Transaction ${transaction.id} chainId: ${transaction.chainId}, currentChainId: ${this.currentChainId}, show: ${shouldShow}`);
        return shouldShow;
      });
    } else {
      // Si no hay red seleccionada, mostrar solo transacciones sin chainId
      allTransactions = allTransactions.filter(transaction => !transaction.chainId);
    }

    this.transactions = allTransactions;
    console.log('Filtered transactions:', this.transactions);
  }

  loadContacts() {
    this.contacts = this.contactService.getContacts();
  }

  getContactName(address: string): string {
    const contact = this.contacts.find(c => c.address === address);
    return contact ? contact.name : address;
  }

  isReceivedTransaction(transaction: Transaction): boolean {
    // Si la dirección del usuario coincide con la dirección "to" de la transacción, entonces es una transacción recibida
    return this.userWalletAddress ? transaction.to === this.userWalletAddress : false;
  }

  getTransactionDirectionText(transaction: Transaction): string {
    return this.isReceivedTransaction(transaction) ? 'Recibido de' : 'Enviado a';
  }

  getTransactionCounterpartyAddress(transaction: Transaction): string {
    // Si es una transacción recibida, mostrar la dirección del remitente (from)
    // Si es una transacción enviada, mostrar la dirección del destinatario (to)
    return this.isReceivedTransaction(transaction) ? transaction.from : transaction.to;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'completed':
        return 'Completada';
      case 'pending':
        return 'Pendiente';
      case 'failed':
        return 'Fallida';
      default:
        return status;
    }
  }

  // Método para abrir la transacción en Etherscan
  viewOnEtherscan(hash: string | undefined) {
    if (hash) {
      // Obtener el chainId del localStorage para determinar la red
      const chainId = localStorage.getItem('chainId') || '0x1'; // Por defecto Ethereum mainnet
      let etherscanUrl = 'https://etherscan.io/tx/';

      // Configurar URL según la red
      switch (chainId) {
        case '0xaa36a7': // Sepolia
          etherscanUrl = 'https://sepolia.etherscan.io/tx/';
          break;
        case '0x4268': // Holesky
          etherscanUrl = 'https://holesky.etherscan.io/tx/';
          break;
        case '0x88bb0': // Ethereum Hoodi
          etherscanUrl = 'https://hoodi.etherscan.io/tx/';
          break;
        case '0x259df89': // Ephemery Testnet
          etherscanUrl = 'https://explorer.ephemery.dev/tx/';
          break;
        default:
          etherscanUrl = 'https://etherscan.io/tx/';
      }

      window.open(etherscanUrl + hash, '_blank');
    }
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

  ngOnDestroy() {
    // Cancelar las suscripciones cuando el componente se destruye
    if (this.chainIdSubscription) {
      this.chainIdSubscription.unsubscribe();
    }
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }
}
