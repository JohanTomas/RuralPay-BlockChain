import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../../services/notification.service';

@Component({
  selector: 'app-alert',
  imports: [CommonModule],
  templateUrl: './alert.html',
  styleUrl: './alert.css'
})
export class Alert {
  @Input() type: 'success' | 'error' | 'warning' | 'info' = 'info';
  @Input() title: string = '';
  @Input() message: string = '';
  @Input() duration: number = 5000;

  constructor(private notificationService: NotificationService) {}

  ngOnInit() {
    // Automatically show the alert when the component is initialized
    this.showAlert();
  }

  showAlert() {
    switch (this.type) {
      case 'success':
        this.notificationService.success(this.title, this.message, this.duration);
        break;
      case 'error':
        this.notificationService.error(this.title, this.message, this.duration);
        break;
      case 'warning':
        this.notificationService.warning(this.title, this.message, this.duration);
        break;
      default:
        this.notificationService.info(this.title, this.message, this.duration);
        break;
    }
  }
}
