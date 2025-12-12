import { Injectable } from '@angular/core';
import { Contact } from '../../../shared/models/contact.model';

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  private readonly CONTACTS_KEY = 'contacts';

  constructor() { }

  // Obtener todos los contactos
  getContacts(): Contact[] {
    const contactsJson = localStorage.getItem(this.CONTACTS_KEY);
    return contactsJson ? JSON.parse(contactsJson) : [];
  }

  // Obtener un contacto por ID
  getContactById(id: string): Contact | undefined {
    const contacts = this.getContacts();
    return contacts.find(contact => contact.id === id);
  }

  // Agregar un nuevo contacto
  addContact(name: string, address: string): Contact {
    const contacts = this.getContacts();

    // Verificar si el contacto ya existe
    const existingContact = contacts.find(contact => contact.address === address);
    if (existingContact) {
      throw new Error('Ya existe un contacto con esta dirección');
    }

    const newContact: Contact = {
      id: this.generateId(),
      name,
      address,
      createdAt: new Date().toISOString()
    };

    contacts.push(newContact);
    localStorage.setItem(this.CONTACTS_KEY, JSON.stringify(contacts));

    return newContact;
  }

  // Actualizar un contacto
  updateContact(id: string, name: string, address: string): Contact | null {
    const contacts = this.getContacts();
    const index = contacts.findIndex(contact => contact.id === id);

    if (index === -1) {
      return null;
    }

    // Verificar si otra contacto ya tiene esta dirección
    const existingContact = contacts.find(contact => contact.address === address && contact.id !== id);
    if (existingContact) {
      throw new Error('Ya existe un contacto con esta dirección');
    }

    contacts[index] = {
      ...contacts[index],
      name,
      address
    };

    localStorage.setItem(this.CONTACTS_KEY, JSON.stringify(contacts));
    return contacts[index];
  }

  // Eliminar un contacto
  deleteContact(id: string): boolean {
    const contacts = this.getContacts();
    const initialLength = contacts.length;
    const filteredContacts = contacts.filter(contact => contact.id !== id);

    if (filteredContacts.length === initialLength) {
      return false; // No se encontró el contacto
    }

    localStorage.setItem(this.CONTACTS_KEY, JSON.stringify(filteredContacts));
    return true;
  }

  // Generar un ID único
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
