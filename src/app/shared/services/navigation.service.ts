import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  private isMobileMenuOpenSubject = new BehaviorSubject<boolean>(false);
  public isMobileMenuOpen$ = this.isMobileMenuOpenSubject.asObservable();

  private currentChainIdSubject = new BehaviorSubject<string | null>(null);
  public currentChainId$ = this.currentChainIdSubject.asObservable();

  toggleMobileMenu() {
    this.isMobileMenuOpenSubject.next(!this.isMobileMenuOpenSubject.value);
  }

  setChainId(chainId: string | null) {
    console.log('NavigationService: Setting chainId to', chainId);
    this.currentChainIdSubject.next(chainId);
    // También guardar en localStorage para persistencia
    if (chainId) {
      localStorage.setItem('chainId', chainId);
    } else {
      localStorage.removeItem('chainId');
    }
  }

  getChainId(): string | null {
    return this.currentChainIdSubject.value;
  }
}
