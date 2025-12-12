import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { NotificationService } from '../../../shared/services/notification.service';
import { ConfirmationService } from '../../../shared/services/confirmation.service';
import { NavigationService } from '../../../shared/services/navigation.service';
import { CommonModule } from '@angular/common';

// Declare ethereum property on window object
declare global {
  interface Window {
    ethereum: any;
  }
}

@Component({
  selector: 'app-dashboard',
  imports: [RouterModule, CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, OnDestroy {
  isProfileMenuOpen = false;
  walletAddress: string | null = null;
  chainId: string | null = null;
  networkName: string = 'Desconocida';

  // Profile properties
  firstName: string = 'Juan';
  lastName: string = 'Pérez';
  profileImage: string | null = null;

  // Balance properties - now we'll use a single balance object
  currentBalance: {
    amount: string,
    symbol: string,
    usdValue: string
  } = { amount: '0.0000', symbol: 'ETH', usdValue: '0.00' };

  // Network balances for display
  networkBalances: { [key: string]: { amount: string, symbol: string, usdValue: string } } = {
    '0x1': { amount: '0.25', symbol: 'ETH', usdValue: '450.00' },
    '0x4268': { amount: '0.35', symbol: 'ETH', usdValue: '630.00' },
    '0xaa36a7': { amount: '0.10', symbol: 'SepoliaETH', usdValue: '180.00' },
    '0x1234': { amount: '0.55', symbol: 'ETH', usdValue: '990.00' },
    '0x89': { amount: '125.00', symbol: 'MATIC', usdValue: '125.00' },
    '0x38': { amount: '0.5', symbol: 'BNB', usdValue: '150.00' }
  };

  // Custom networks added by user
  customNetworks: Array<{
    chainId: string;
    chainName: string;
    rpcUrls: string[];
    nativeCurrency: {
      name: string;
      symbol: string;
      decimals: number;
    };
    blockExplorerUrls: string[];
  }> = [];

  constructor(
    public navigationService: NavigationService,
    private router: Router,
    private notificationService: NotificationService,
    private confirmationService: ConfirmationService
  ) {}

  private profileUpdateListener: any;
  private accountsChangedListener: any;
  private chainChangedListener: any;

  async ngOnInit() {
    // Only run localStorage and window-related code in the browser
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      // Load wallet information from localStorage
      this.walletAddress = localStorage.getItem('walletAddress');
      this.chainId = localStorage.getItem('chainId');

      // Set initial chainId in navigation service
      this.navigationService.setChainId(this.chainId);
      console.log('Dashboard: Initial chainId set to', this.chainId);

      // Load custom networks from localStorage
      const savedCustomNetworks = localStorage.getItem('customNetworks');
      if (savedCustomNetworks) {
        try {
          this.customNetworks = JSON.parse(savedCustomNetworks);
        } catch (e) {
          console.error('Error parsing custom networks:', e);
        }
      }

      // Map chainId to network name
      this.networkName = this.getNetworkName(this.chainId);

      // Load profile data from localStorage
      this.loadProfileData();

      // Listen for profile updates
      this.profileUpdateListener = (event: any) => {
        console.log('Dashboard received profileUpdated event:', event.detail);
        this.firstName = event.detail.firstName;
        this.lastName = event.detail.lastName;
        this.profileImage = event.detail.profileImage;
      };
      window.addEventListener('profileUpdated', this.profileUpdateListener);

      // Listen for account changes
      if (typeof window.ethereum !== 'undefined') {
        this.accountsChangedListener = (accounts: string[]) => {
          if (accounts.length > 0) {
            this.walletAddress = accounts[0];
            localStorage.setItem('walletAddress', accounts[0]);
            this.notificationService.success('Cuenta cambiada', `Conectado con ${accounts[0].substring(0, 6)}...${accounts[0].substring(accounts[0].length - 4)}`, 3000);
            // Update balance when account changes
            this.updateCurrentBalance();
          }
        };
        window.ethereum.on('accountsChanged', this.accountsChangedListener);

        this.chainChangedListener = (chainId: string) => {
          console.log('Ethereum chain changed to:', chainId);
          this.chainId = chainId;
          this.networkName = this.getNetworkName(chainId);
          localStorage.setItem('chainId', chainId);
          this.navigationService.setChainId(chainId); // Update navigation service
          this.notificationService.info('Red cambiada', `Conectado a ${this.networkName}`, 3000);
          // Update balance when network changes
          this.updateCurrentBalance();
        };
        window.ethereum.on('chainChanged', this.chainChangedListener);
      }

      // Set the current balance based on the selected network
      // This needs to be called after setting up the event listeners
      await this.updateCurrentBalance();
    } else {
      // Set default values for server-side rendering
      this.networkName = 'Desconocida';
      this.currentBalance = { amount: '0.0000', symbol: 'ETH', usdValue: '0.00' };
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

  async updateCurrentBalance() {
    // Always try to get live balance from MetaMask if we have a wallet connected
    if (this.walletAddress && typeof window.ethereum !== 'undefined') {
      try {
        const balanceHex = await window.ethereum.request({
          method: 'eth_getBalance',
          params: [this.walletAddress, 'latest'],
        });

        // Convert balance from hex to decimal
        const balanceWei = parseInt(balanceHex, 16);
        const balanceEth = (balanceWei / 1e18).toFixed(4);

        this.currentBalance.amount = balanceEth;
        this.currentBalance.symbol = this.getNetworkSymbol(this.chainId);
        this.currentBalance.usdValue = this.calculateUsdValue(balanceEth, this.chainId);

        // Also save to localStorage for persistence
        localStorage.setItem('balance', balanceEth);
        return;
      } catch (error) {
        console.error('Error fetching balance:', error);
      }
    }

    // Fallback to localStorage or hardcoded values
    const savedBalance = localStorage.getItem('balance');
    if (savedBalance) {
      // Use saved balance and update USD value based on network
      this.currentBalance.amount = savedBalance;
      this.currentBalance.symbol = this.getNetworkSymbol(this.chainId);
      this.currentBalance.usdValue = this.calculateUsdValue(savedBalance, this.chainId);
    } else if (this.chainId && this.networkBalances[this.chainId]) {
      // Fallback to hardcoded values
      this.currentBalance = { ...this.networkBalances[this.chainId] };
    } else {
      // Default to ETH if network not found
      this.currentBalance = { amount: '0.0000', symbol: 'ETH', usdValue: '0.00' };
    }
  }

  openAddNetworkModal() {
    const modal = document.getElementById('addNetworkModal');
    if (modal) {
      modal.style.display = 'block';
    }
  }

  closeAddNetworkModal() {
    const modal = document.getElementById('addNetworkModal');
    if (modal) {
      modal.style.display = 'none';
    }

    // Clear form fields
    const formFields = ['networkName', 'rpcUrl', 'chainId', 'currencySymbol', 'blockExplorerUrl'];
    formFields.forEach(field => {
      const element = document.getElementById(field) as HTMLInputElement;
      if (element) {
        element.value = '';
      }
    });
  }

  addCustomNetwork() {
    // Only run document-related code in the browser
    if (typeof document === 'undefined') {
      return;
    }

    // Get form values
    const networkNameInput = document.getElementById('networkName') as HTMLInputElement;
    const rpcUrlInput = document.getElementById('rpcUrl') as HTMLInputElement;
    const chainIdInput = document.getElementById('chainId') as HTMLInputElement;
    const currencySymbolInput = document.getElementById('currencySymbol') as HTMLInputElement;
    const blockExplorerUrlInput = document.getElementById('blockExplorerUrl') as HTMLInputElement;

    const networkName = networkNameInput.value.trim();
    const rpcUrl = rpcUrlInput.value.trim();
    const chainId = chainIdInput.value.trim();
    const currencySymbol = currencySymbolInput.value.trim();
    const blockExplorerUrl = blockExplorerUrlInput.value.trim();

    // Validate inputs
    if (!networkName || !rpcUrl || !chainId || !currencySymbol) {
      this.notificationService.error('Error', 'Todos los campos son requeridos', 3000);
      return;
    }

    // Create network object
    const newNetwork = {
      chainId,
      chainName: networkName,
      rpcUrls: [rpcUrl],
      nativeCurrency: {
        name: networkName,
        symbol: currencySymbol,
        decimals: 18
      },
      blockExplorerUrls: blockExplorerUrl ? [blockExplorerUrl] : []
    };

    // Add to custom networks array
    this.customNetworks.push(newNetwork);

    // Save to localStorage
    try {
      localStorage.setItem('customNetworks', JSON.stringify(this.customNetworks));
    } catch (e) {
      console.error('Error saving custom networks:', e);
    }

    // Clear form and close modal
    this.closeAddNetworkModal();

    // Show success message
    this.notificationService.success('Red agregada', 'Red personalizada agregada exitosamente!', 3000);

    // Dispatch network change event
    window.dispatchEvent(new CustomEvent('networkChanged'));
  }

  async switchNetwork(event: any) {
    // Only run Ethereum-related code in the browser
    if (typeof window === 'undefined' || typeof window.ethereum === 'undefined') {
      return;
    }

    try {
      const selectedChainId = event.target.value;
      console.log('Switching to network:', selectedChainId);

      // Check if Ethereum provider exists
      if (typeof window.ethereum === 'undefined') {
        this.notificationService.error('Billetera no encontrada', 'Por favor instale MetaMask para continuar', 5000);
        return;
      }

      // Switch to the selected network
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: selectedChainId }],
        });
        console.log('Successfully switched to network:', selectedChainId);
      } catch (switchError: any) {
        // This error code indicates that the chain has not been added to MetaMask.
        if (switchError.code === 4902) {
          this.notificationService.error('Red no encontrada', 'La red no está disponible en MetaMask. Por favor agréguela manualmente.', 5000);
        } else {
          console.error('Failed to switch network:', switchError);
          this.notificationService.error('Error', 'No se pudo cambiar a la red seleccionada', 5000);
        }
        return;
      }

      // Update chainId and network name only after successful switch
      this.chainId = selectedChainId;
      this.networkName = this.getNetworkName(this.chainId);

      // Update the current balance
      await this.updateCurrentBalance();

      // Save to localStorage and update navigation service
      if (this.chainId) {
        localStorage.setItem('chainId', this.chainId);
        this.navigationService.setChainId(this.chainId);
        console.log('ChainId saved and navigation service updated:', this.chainId);
      }
    } catch (error) {
      console.error('Error switching network:', error);
      this.notificationService.error('Error de conexión', 'No se pudo cambiar la red. Por favor intente nuevamente.', 5000);
    }
  }

  getNetworkName(chainId: string | null): string {
    if (!chainId) return 'Desconocida';

    // Check custom networks first
    const customNetwork = this.customNetworks.find(network => network.chainId === chainId);
    if (customNetwork) {
      return customNetwork.chainName;
    }

    const networks: { [key: string]: string } = {
      '0x1': 'Ethereum Mainnet',
      '0x4268': 'Holesky',
      '0xaa36a7': 'Sepolia',
      '0x88bb0': 'Ethereum Hoodi',
      '0x259df89': 'Ephemery Testnet',
      '0x89': 'Polygon Mainnet',
      '0x38': 'Binance Smart Chain'
    };

    return networks[chainId] || `Red desconocida (${chainId})`;
  }

  getNetworkSymbol(chainId: string | null): string {
    if (!chainId) return 'ETH';

    // Check custom networks first
    const customNetwork = this.customNetworks.find(network => network.chainId === chainId);
    if (customNetwork) {
      return customNetwork.nativeCurrency.symbol;
    }

    const symbols: { [key: string]: string } = {
      '0x1': 'ETH',
      '0x4268': 'ETH',
      '0xaa36a7': 'SepoliaETH',
      '0x88bb0': 'ETH',
      '0x259df89': 'ETH',
      '0x89': 'MATIC',
      '0x38': 'BNB'
    };

    return symbols[chainId] || 'ETH';
  }

  calculateUsdValue(amount: string, chainId: string | null): string {
    // Simple conversion based on network type
    // In a real app, you would fetch current prices from an API
    const ethPrice = 3000; // ETH price in USD
    const maticPrice = 0.8; // MATIC price in USD
    const bnbPrice = 300; // BNB price in USD

    const amountNum = parseFloat(amount);

    if (!chainId) return '0.00';

    // Check custom networks first
    const customNetwork = this.customNetworks.find(network => network.chainId === chainId);
    if (customNetwork) {
      // For custom networks, we'll use ETH price as default
      return (amountNum * ethPrice).toFixed(2);
    }

    const symbols: { [key: string]: number } = {
      '0x1': ethPrice,
      '0x4268': ethPrice,
      '0xaa36a7': ethPrice,
      '0x88bb0': ethPrice,
      '0x259df89': ethPrice,
      '0x89': maticPrice,
      '0x38': bnbPrice
    };

    const price = symbols[chainId] || ethPrice;
    return (amountNum * price).toFixed(2);
  }

  formatAddress(address: string | null): string {
    if (!address) return 'No conectado';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }

  copyToClipboard(text: string | null) {
    // Only run document-related code in the browser
    if (typeof document === 'undefined') {
      return;
    }

    if (!text) return;

    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);

    this.notificationService.success('Copiado', 'Dirección copiada al portapapeles', 3000);
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
      if (this.accountsChangedListener && window.ethereum) {
        window.ethereum.removeListener('accountsChanged', this.accountsChangedListener);
      }
      if (this.chainChangedListener && window.ethereum) {
        window.ethereum.removeListener('chainChanged', this.chainChangedListener);
      }
    }
  }
}
