import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { NotificationService } from '../../../../shared/services/notification.service';
import { CommonModule } from '@angular/common';
import { GoogleRegisterComponent } from '../google-register/google-register.component';
import { LoginService } from '../../services/login.service';

// EIP-6963 interfaces
interface EIP6963ProviderInfo {
  rdns: string;
  uuid: string;
  name: string;
  icon: string;
}

interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo;
  provider: EIP1193Provider;
}


type EIP6963AnnounceProviderEvent = {
  detail: {
    info: EIP6963ProviderInfo,
    provider: Readonly<EIP1193Provider>,
  }
}


interface EIP1193Provider {
  isStatus?: boolean;
  host?: string;
  path?: string;
  sendAsync?: (request: { method: string, params?: Array<unknown> }, callback: (error: Error | null, response: unknown) => void) => void;
  send?: (request: { method: string, params?: Array<unknown> }, callback: (error: Error | null, response: unknown) => void) => void;
  request: (request: { method: string, params?: Array<unknown> }) => Promise<unknown>;
}

@Component({
  selector: 'app-login',
  imports: [RouterModule, CommonModule, GoogleRegisterComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit, OnDestroy {
  hasMetaMask: boolean = false;
  hasMobileWallet: boolean = false;
  showGoogleRegisterForm: boolean = false;
  googleUserEmail: string = '';
  private googleInitialized: boolean = false;
  showAccountCreationSuccess: boolean = false;
  // EIP-6963 providers
  providers: EIP6963ProviderDetail[] = [];
  isMobile: boolean = false;

  constructor(
    private router: Router,
    private notificationService: NotificationService,
    private loginService: LoginService
  ) {}

  ngOnInit() {
    // Detect if we're on mobile device
    this.isMobile = this.detectMobile();

    // Check for traditional MetaMask first
    this.hasMetaMask = typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask;

    // Check for mobile wallet availability
    this.hasMobileWallet = this.checkMobileWalletAvailability();

    // Initialize EIP-6963 provider detection
    this.initializeEIP6963();

    // Initialize Google Sign-In
    this.initializeGoogleSignIn();
  }

  ngOnDestroy() {
    // Clean up Google Sign-In if initialized
    if (this.googleInitialized && typeof window !== 'undefined' && (window as any).google) {
      // Note: Google Identity Services doesn't have a direct cleanup method
    }
  }

  private detectMobile(): boolean {
    if (typeof window === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  private checkMobileWalletAvailability(): boolean {
    if (typeof window === 'undefined') return false;

    // Check for mobile wallet providers
    const hasWalletProvider = typeof window.ethereum !== 'undefined';

    // Check for MetaMask mobile browser
    const isMetaMaskMobile = /MetaMaskMobile/i.test(navigator.userAgent);

    // Check for other common mobile wallets
    const hasOtherMobileWallet = /TrustWallet|CoinbaseWallet|Rainbow|SafePal|BitKeep/i.test(navigator.userAgent);

    return hasWalletProvider || isMetaMaskMobile || hasOtherMobileWallet || this.isMobile;
  }

  private initializeEIP6963() {
    if (typeof window === 'undefined') return;

    // Listen for provider announcements
    window.addEventListener("eip6963:announceProvider", (event: Event) => {
      const customEvent = event as CustomEvent;
      const providerDetail: EIP6963ProviderDetail = customEvent.detail;

      // Add provider to our list if it's not already there
      const exists = this.providers.some(p => p.info.uuid === providerDetail.info.uuid);
      if (!exists) {
        this.providers.push(providerDetail);
        // If we find MetaMask via EIP-6963, update our flag
        if (providerDetail.info.rdns.includes('metamask')) {
          this.hasMetaMask = true;
        }
      }
    });

    // Request providers
    window.dispatchEvent(new Event("eip6963:requestProvider"));
  }

  private initializeGoogleSignIn() {
    // Only run in browser environment
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    // Check if already initialized
    if (this.googleInitialized) {
      return;
    }

    // Load Google Identity Services script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      this.googleInitialized = true;
      console.log('Google Identity Services loaded');
    };
    script.onerror = () => {
      console.error('Failed to load Google Identity Services');
      this.notificationService.error('Error', 'No se pudo cargar el servicio de Google', 3000);
    };
    document.head.appendChild(script);
  }

  async connectWallet(walletType: string) {
    try {
      let ethereumProvider: EIP1193Provider | undefined;

      // First check if we have EIP-6963 providers
      if (this.providers.length > 0) {
        // Prefer MetaMask if available
        const metaMaskProvider = this.providers.find(p => p.info.rdns.includes('metamask'));
        if (metaMaskProvider) {
          ethereumProvider = metaMaskProvider.provider;
        } else {
          // Use the first available provider
          ethereumProvider = this.providers[0].provider;
        }
      }
      // Fallback to traditional window.ethereum
      else if (typeof window.ethereum !== 'undefined') {
        ethereumProvider = window.ethereum;
      }

      // Check if Ethereum provider exists
      if (!ethereumProvider) {
        // If on mobile, try to open MetaMask app via deep link
        if (this.isMobile) {
          this.handleMobileWalletConnection();
          return;
        }

        this.notificationService.error('Billetera no encontrada', 'Por favor instale una billetera compatible como MetaMask para continuar', 5000);
        return;
      }

      // Request account access
      const accounts = await ethereumProvider.request({ method: 'eth_requestAccounts' }) as string[];
      const account = accounts[0];

      // Get network information
      const chainId = await ethereumProvider.request({ method: 'eth_chainId' }) as string;

      // Get balance
      const balanceHex = await ethereumProvider.request({
        method: 'eth_getBalance',
        params: [account, 'latest'],
      }) as string;

      // Convert balance from hex to decimal
      const balanceWei = parseInt(balanceHex, 16);
      const balanceEth = (balanceWei / 1e18).toFixed(4);

      // Store wallet info in localStorage (in a real app, you'd use a service)
      localStorage.setItem('walletAddress', account);
      localStorage.setItem('chainId', chainId);
      localStorage.setItem('balance', balanceEth);

      // Show success message
      this.notificationService.success('Conexión exitosa', `Conectado con ${account.substring(0, 6)}...${account.substring(account.length - 4)}`, 3000);

      // Navigate to dashboard
      this.router.navigate(['/dashboard']);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      this.notificationService.error('Error de conexión', 'No se pudo conectar con la billetera. Por favor intente nuevamente.', 5000);
    }
  }

  private handleMobileWalletConnection() {
    // For mobile devices, show instructions or try to open wallet app
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);

    if (isIOS) {
      // Try to open MetaMask on iOS
      window.location.href = 'metamask://';
      setTimeout(() => {
        // If app doesn't open, redirect to App Store
        window.open('https://apps.apple.com/app/metamask/id1438144202', '_blank');
      }, 500);
    } else if (isAndroid) {
      // Try to open MetaMask on Android
      window.location.href = 'https://metamask.app.link/';
      setTimeout(() => {
        // If app doesn't open, redirect to Play Store
        window.open('https://play.google.com/store/apps/details?id=io.metamask', '_blank');
      }, 500);
    } else {
      // Generic message for other mobile devices
      this.notificationService.info(
        'Billetera móvil requerida',
        'Por favor abra esta aplicación desde una billetera móvil compatible como MetaMask, o descargue una billetera compatible.',
        7000
      );
    }
  }

  // Google Sign In method for account creation
  createAccountWithGoogle() {
    // Check if Google Identity Services is loaded
    if (!this.googleInitialized) {
      this.notificationService.error('Error', 'El servicio de Google aún no está listo. Por favor intente nuevamente.', 3000);
      return;
    }

    // Ensure we're in browser environment
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    // Initialize Google Sign-In client
    const client = (window as any).google?.accounts.oauth2.initTokenClient({
      client_id: '137071039440-p1av1ochvuc1dhn3vt4sio6t0i5s5ac3.apps.googleusercontent.com',
      scope: 'email profile',
      callback: (response: any) => {
        if (response.error) {
          console.error('Google Sign-In error:', response.error);
          this.notificationService.error('Error de autenticación', 'No se pudo iniciar sesión con Google: ' + response.error_description, 3000);
          return;
        }

        // Get user info using the access token
        fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: {
            Authorization: `Bearer ${response.access_token}`
          }
        })
        .then(response => response.json())
        .then(userInfo => {
          this.showGoogleRegisterForm = true;
          this.googleUserEmail = userInfo.email;
          this.notificationService.info('Crear cuenta con Google', 'Por favor completa tu información', 3000);
        })
        .catch(error => {
          console.error('Error fetching user info:', error);
          this.notificationService.error('Error', 'No se pudo obtener la información del usuario', 3000);
        });
      }
    });

    // Prompt user to sign in
    client.requestAccessToken();
  }

  onGoogleRegistrationComplete(userData: {firstName: string, lastName: string, phone: string, address: string, password: string}) {
    // Create account with Google and password
    const accountData = {
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: this.googleUserEmail,
      phone: userData.phone,
      address: userData.address,
      password: userData.password
    };

    this.loginService.createAccountWithGoogleAndPassword(accountData).subscribe({
      next: (success) => {
        if (success) {
          // Save user profile to localStorage
          const userProfile = {
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: this.googleUserEmail,
            phone: userData.phone,
            address: userData.address,
            notifications: true,
            newsletter: true
          };

          this.loginService.saveUserProfile(userProfile);

          // Show account creation success message
          this.showGoogleRegisterForm = false;
          this.showAccountCreationSuccess = true;
          this.notificationService.success('Cuenta creada', 'Tu cuenta ha sido creada exitosamente. Ahora conecta tu billetera MetaMask.', 5000);
        } else {
          this.notificationService.error('Error', 'No se pudo crear la cuenta. Por favor intente nuevamente.', 3000);
        }
      },
      error: (error) => {
        console.error('Account creation error:', error);
        this.notificationService.error('Error', 'No se pudo crear la cuenta. Por favor intente nuevamente.', 3000);
      }
    });
  }

  onGoogleRegistrationCancel() {
    this.showGoogleRegisterForm = false;
    this.notificationService.info('Creación de cuenta cancelada', 'Puedes iniciar sesión con otro método', 3000);
  }

  onContinueToWallet() {
    this.showAccountCreationSuccess = false;
    this.notificationService.info('Conectar billetera', 'Por favor conecta tu billetera MetaMask para continuar', 3000);
  }

  connectCoinbase() {
    // For Coinbase Wallet, you would typically use their SDK
    // This is a simplified version for demonstration
    this.notificationService.info('Conexión Coinbase', 'Conexión con Coinbase Wallet no implementada en esta demo', 3000);
    this.router.navigate(['/dashboard']);
  }

  connectWalletConnect() {
    // For WalletConnect, we'll open the network selection modal
    // This is a simplified version for demonstration
    this.openNetworkSelectionModal();
  }

  openNetworkSelectionModal() {
    const modal = document.getElementById('networkSelectionModal');
    if (modal) {
      modal.style.display = 'block';
    }
  }

  closeNetworkSelectionModal() {
    const modal = document.getElementById('networkSelectionModal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  async connectToTestNetwork(network: string) {
    try {
      let ethereumProvider: EIP1193Provider | undefined;

      // First check if we have EIP-6963 providers
      if (this.providers.length > 0) {
        // Prefer MetaMask if available
        const metaMaskProvider = this.providers.find(p => p.info.rdns.includes('metamask'));
        if (metaMaskProvider) {
          ethereumProvider = metaMaskProvider.provider;
        } else {
          // Use the first available provider
          ethereumProvider = this.providers[0].provider;
        }
      }
      // Fallback to traditional window.ethereum
      else if (typeof window.ethereum !== 'undefined') {
        ethereumProvider = window.ethereum;
      }

      // Check if Ethereum provider exists
      if (!ethereumProvider) {
        this.notificationService.error('Billetera no encontrada', 'Por favor instale una billetera compatible como MetaMask para continuar', 5000);
        this.closeNetworkSelectionModal();
        return;
      }

      // Define network parameters
      const networkParams: { [key: string]: { chainId: string, name: string } } = {
        holesky: { chainId: '0x4268', name: 'Holesky' },
        sepolia: { chainId: '0xaa36a7', name: 'Sepolia' },
        hoodi: { chainId: '0x88bb0', name: 'Ethereum Hoodi' },
        ephemery: { chainId: '0x259df89', name: 'Ephemery Testnet' }
      };

      // Get selected network
      const selectedNetwork = networkParams[network];
      if (!selectedNetwork) {
        this.notificationService.error('Red no válida', 'La red seleccionada no es válida', 5000);
        this.closeNetworkSelectionModal();
        return;
      }

      // Switch to the selected network
      try {
        await ethereumProvider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: selectedNetwork.chainId }],
        });
      } catch (switchError: any) {
        // This error code indicates that the chain has not been added to MetaMask.
        if (switchError.code === 4902) {
          try {
            // Define RPC URLs and block explorer URLs for each network
            const networkConfig: { [key: string]: { rpcUrl: string, blockExplorerUrl: string } } = {
              holesky: {
                rpcUrl: 'https://holesky.drpc.org',
                blockExplorerUrl: 'https://holesky.etherscan.io'
              },
              sepolia: {
                rpcUrl: 'https://ethereum-sepolia-rpc.publicnode.com',
                blockExplorerUrl: 'https://sepolia.etherscan.io'
              },
              hoodi: {
                rpcUrl: 'https://hoodi.drpc.org',
                blockExplorerUrl: 'https://hoodi.etherscan.io'
              },
              ephemery: {
                rpcUrl: 'https://otter.bordel.wtf/erigon',
                blockExplorerUrl: 'https://explorer.ephemery.dev'
              }
            };

            const config = networkConfig[network] || {
              rpcUrl: 'https://ethereum-rpc.publicnode.com',
              blockExplorerUrl: 'https://etherscan.io'
            };

            await ethereumProvider.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: selectedNetwork.chainId,
                  chainName: selectedNetwork.name,
                  nativeCurrency: {
                    name: network === 'sepolia' ? 'SepoliaETH' : 'ETH',
                    symbol: network === 'sepolia' ? 'SepoliaETH' : 'ETH',
                    decimals: 18
                  },
                  rpcUrls: [config.rpcUrl],
                  blockExplorerUrls: [config.blockExplorerUrl]
                },
              ],
            });
          } catch (addError) {
            console.error('Failed to add network:', addError);
            this.notificationService.error('Error', 'No se pudo agregar la red', 5000);
            this.closeNetworkSelectionModal();
            return;
          }
        } else {
          console.error('Failed to switch network:', switchError);
          this.notificationService.error('Error', 'No se pudo cambiar a la red seleccionada', 5000);
          this.closeNetworkSelectionModal();
          return;
        }
      }

      // Request account access
      const accounts = await ethereumProvider.request({ method: 'eth_requestAccounts' }) as string[];
      const account = accounts[0];

      // Get network information
      const chainId = await ethereumProvider.request({ method: 'eth_chainId' }) as string;

      // Get balance
      const balanceHex = await ethereumProvider.request({
        method: 'eth_getBalance',
        params: [account, 'latest'],
      }) as string;

      // Convert balance from hex to decimal
      const balanceWei = parseInt(balanceHex, 16);
      const balanceEth = (balanceWei / 1e18).toFixed(4);

      // Store wallet info in localStorage
      localStorage.setItem('walletAddress', account);
      localStorage.setItem('chainId', chainId);
      localStorage.setItem('balance', balanceEth);

      // Close modal
      this.closeNetworkSelectionModal();

      // Show success message
      this.notificationService.success('Conexión exitosa', `Conectado a ${selectedNetwork.name}`, 3000);

      // Navigate to dashboard
      this.router.navigate(['/dashboard']);
    } catch (error) {
      console.error('Error connecting to test network:', error);
      this.notificationService.error('Error de conexión', 'No se pudo conectar con la red de prueba. Por favor intente nuevamente.', 5000);
      this.closeNetworkSelectionModal();
    }
  }
}
