import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export interface ConfirmationDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'success' | 'error' | 'warning' | 'info';
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmationService {
  private confirmationSubject = new Subject<ConfirmationDialogData>();
  private responseSubject = new Subject<boolean>();

  confirmation$ = this.confirmationSubject.asObservable();
  response$ = this.responseSubject.asObservable();

  /**
   * Shows a confirmation dialog
   * @param data The confirmation dialog data
   * @returns Observable that emits true if confirmed, false if cancelled
   */
  confirm(data: ConfirmationDialogData): Observable<boolean> {
    this.confirmationSubject.next(data);
    return this.responseSubject.asObservable();
  }

  /**
   * Called when user confirms the action
   */
  confirmAction(): void {
    this.responseSubject.next(true);
  }

  /**
   * Called when user cancels the action
   */
  cancelAction(): void {
    this.responseSubject.next(false);
  }
}
