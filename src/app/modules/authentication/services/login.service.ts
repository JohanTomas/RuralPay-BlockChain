import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  constructor() { }

  // Simulate Google login (in a real implementation, you would use the Google Identity Services library)
  signInWithGoogle(): Observable<any> {
    // This is a simulation - in a real app you would use the Google Identity Services library
    // For demo purposes, we'll return mock user data
    const mockUser = {
      email: 'usuario@example.com',
      firstName: 'Usuario',
      lastName: 'Demo',
      photoUrl: null
    };

    return of(mockUser);
  }

  // Create account with Google and password
  createAccountWithGoogleAndPassword(userData: {firstName: string, lastName: string, email: string, phone: string, address: string, password: string}): Observable<boolean> {
    // In a real implementation, you would send this data to your backend
    // For demo purposes, we'll just save it to localStorage

    const accountData = {
      ...userData,
      createdAt: new Date().toISOString(),
      // In a real app, you would hash the password before saving
      password: userData.password
    };

    // Save to localStorage (in a real app, this would be sent to a backend)
    localStorage.setItem('userAccount', JSON.stringify(accountData));

    return of(true);
  }

  // Save user profile to localStorage
  saveUserProfile(profile: any): void {
    localStorage.setItem('userProfile', JSON.stringify(profile));
  }

  // Get user profile from localStorage
  getUserProfile(): any {
    const profile = localStorage.getItem('userProfile');
    return profile ? JSON.parse(profile) : null;
  }

  // Get user account from localStorage
  getUserAccount(): any {
    const account = localStorage.getItem('userAccount');
    return account ? JSON.parse(account) : null;
  }

  // Validate user credentials (simplified for demo)
  validateCredentials(email: string, password: string): boolean {
    const account = this.getUserAccount();
    if (account && account.email === email && account.password === password) {
      return true;
    }
    return false;
  }
}
