import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmationService, ConfirmationDialogData } from '../../../../services/confirmation.service';

@Component({
  selector: 'app-confirmation-dialog',
  imports: [CommonModule],
  templateUrl: './confirmation-dialog.component.html',
  styleUrl: '../confirmation/confirmation.css'
})
export class ConfirmationDialogComponent implements OnInit {
  isVisible = false;
  data: ConfirmationDialogData = {
    title: 'Confirmación',
    message: '¿Está seguro de que desea continuar?',
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    type: 'warning'
  };

  constructor(private confirmationService: ConfirmationService) {}

  ngOnInit() {
    this.confirmationService.confirmation$.subscribe(data => {
      this.data = { ...this.data, ...data };
      this.isVisible = true;
    });
  }

  onConfirm() {
    this.isVisible = false;
    this.confirmationService.confirmAction();
  }

  onCancel() {
    this.isVisible = false;
    this.confirmationService.cancelAction();
  }
}
