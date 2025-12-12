import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ContactService } from '../../services/contact.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { Contact } from '../../../../shared/models/contact.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavigationService } from '../../../../shared/services/navigation.service';

@Component({
  selector: 'app-contact',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css'
})
export class ContactComponent implements OnInit {
  contacts: Contact[] = [];
  newContact = {
    name: '',
    address: ''
  };
  isEditing = false;
  editingContactId: string | null = null;
  firstName: string = 'Juan';
  lastName: string = 'Pérez';
  profileImage: string | null = null;
  isProfileMenuOpen: boolean = false;

  constructor(
    private contactService: ContactService,
    private notificationService: NotificationService,
    public router: Router,
    public navigationService: NavigationService // Agregar NavigationService
  ) {}

  ngOnInit() {
    this.loadContacts();
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

  addContact() {
    if (!this.newContact.name || !this.newContact.address) {
      this.notificationService.error('Error', 'Por favor complete todos los campos', 3000);
      return;
    }

    try {
      if (this.isEditing && this.editingContactId) {
        // Actualizar contacto existente
        this.contactService.updateContact(this.editingContactId, this.newContact.name, this.newContact.address);
        this.notificationService.success('Contacto actualizado', 'El contacto se ha actualizado correctamente', 3000);
        this.isEditing = false;
        this.editingContactId = null;
      } else {
        // Agregar nuevo contacto
        this.contactService.addContact(this.newContact.name, this.newContact.address);
        this.notificationService.success('Contacto agregado', 'El contacto se ha agregado correctamente', 3000);
      }

      // Limpiar formulario
      this.newContact = {
        name: '',
        address: ''
      };

      // Recargar contactos
      this.loadContacts();
    } catch (error: any) {
      this.notificationService.error('Error', error.message || 'No se pudo guardar el contacto', 3000);
    }
  }

  editContact(contact: Contact) {
    this.newContact.name = contact.name;
    this.newContact.address = contact.address;
    this.isEditing = true;
    this.editingContactId = contact.id;
  }

  deleteContact(id: string) {
    if (confirm('¿Está seguro de que desea eliminar este contacto?')) {
      this.contactService.deleteContact(id);
      this.notificationService.success('Contacto eliminado', 'El contacto se ha eliminado correctamente', 3000);
      this.loadContacts();

      // Resetear formulario si estábamos editando este contacto
      if (this.editingContactId === id) {
        this.cancelEdit();
      }
    }
  }

  cancelEdit() {
    this.isEditing = false;
    this.editingContactId = null;
    this.newContact = {
      name: '',
      address: ''
    };
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
}
