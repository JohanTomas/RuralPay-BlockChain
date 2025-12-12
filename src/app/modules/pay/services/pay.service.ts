import { Injectable } from '@angular/core';
import { Transaction } from '../../../shared/models/transaction.model';
import { HistoryService } from '../../history/services/history.service';
import { NavigationService } from '../../../shared/services/navigation.service';

@Injectable({
  providedIn: 'root'
})
export class PayService {

  constructor(
    private historyService: HistoryService,
    private navigationService: NavigationService
  ) { }

  // Registrar una transacción en el historial
  recordTransaction(transactionData: Omit<Transaction, 'id' | 'status' | 'hash'>) {
    // Obtener el chainId actual del NavigationService, con fallback al localStorage
    const chainId = this.navigationService.getChainId() || localStorage.getItem('chainId');

    // Verificar que chainId no sea null
    const chainIdValue = chainId !== null ? chainId : '0x1';

    const transaction: Omit<Transaction, 'id'> = {
      ...transactionData,
      chainId: chainIdValue, // Incluir la información de la red
      status: 'completed',
      hash: this.generateTransactionHash()
    };

    console.log('Recording transaction with chainId:', chainIdValue);
    return this.historyService.addTransaction(transaction);
  }

  // Generar un hash de transacción simulado
  private generateTransactionHash(): string {
    return '0x' + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('');
  }
}
