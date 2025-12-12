import { Injectable } from '@angular/core';
import { Transaction } from '../../../shared/models/transaction.model';
import { NavigationService } from '../../../shared/services/navigation.service';

@Injectable({
  providedIn: 'root'
})
export class HistoryService {
  private readonly TRANSACTIONS_KEY = 'transactions';
  private readonly NEW_TRANSACTION_KEY = 'newTransaction';

  constructor(private navigationService: NavigationService) { }

  // Obtener todas las transacciones
  getTransactions(): Transaction[] {
    const transactionsJson = localStorage.getItem(this.TRANSACTIONS_KEY);
    let transactions = transactionsJson ? JSON.parse(transactionsJson) : [];
    console.log('Retrieved transactions from localStorage:', transactions);
    return transactions;
  }

  // Obtener una transacción por ID
  getTransactionById(id: string): Transaction | undefined {
    const transactions = this.getTransactions();
    return transactions.find(transaction => transaction.id === id);
  }

  // Agregar una nueva transacción
  addTransaction(transaction: Omit<Transaction, 'id'>): Transaction {
    const transactions = this.getTransactions();

    const newTransaction: Transaction = {
      id: this.generateId(),
      ...transaction
    };

    transactions.push(newTransaction);
    console.log('Saving transaction to localStorage:', newTransaction);
    localStorage.setItem(this.TRANSACTIONS_KEY, JSON.stringify(transactions));

    return newTransaction;
  }

  // Actualizar una transacción
  updateTransaction(id: string, updates: Partial<Transaction>): Transaction | null {
    const transactions = this.getTransactions();
    const index = transactions.findIndex(transaction => transaction.id === id);

    if (index === -1) {
      return null;
    }

    transactions[index] = {
      ...transactions[index],
      ...updates
    };

    localStorage.setItem(this.TRANSACTIONS_KEY, JSON.stringify(transactions));
    return transactions[index];
  }

  // Eliminar una transacción
  deleteTransaction(id: string): boolean {
    const transactions = this.getTransactions();
    const initialLength = transactions.length;
    const filteredTransactions = transactions.filter(transaction => transaction.id !== id);

    if (filteredTransactions.length === initialLength) {
      return false; // No se encontró la transacción
    }

    localStorage.setItem(this.TRANSACTIONS_KEY, JSON.stringify(filteredTransactions));
    return true;
  }

  // Guardar una transacción temporalmente (antes de confirmar)
  saveNewTransaction(transaction: Omit<Transaction, 'id'>) {
    sessionStorage.setItem(this.NEW_TRANSACTION_KEY, JSON.stringify(transaction));
  }

  // Obtener la transacción temporal
  getNewTransaction(): Transaction | null {
    const transactionJson = sessionStorage.getItem(this.NEW_TRANSACTION_KEY);
    return transactionJson ? JSON.parse(transactionJson) : null;
  }

  // Eliminar la transacción temporal
  clearNewTransaction() {
    sessionStorage.removeItem(this.NEW_TRANSACTION_KEY);
  }

  // Generar un ID único
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
