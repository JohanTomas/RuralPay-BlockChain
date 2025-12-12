import { Routes } from '@angular/router';
import { PagesHomeComponent } from './layouts/components/pages-home/pages-home.component';
import { LoginComponent } from './modules/authentication/components/login/login.component';
import { DashboardComponent } from './layouts/components/dashboard/dashboard.component';
import { MyQrComponent } from './modules/my-qr/components/my-qr/my-qr.component';
import { PayComponent } from './modules/pay/components/pay/pay.component';
import { ContactComponent } from './modules/contact/components/contact/contact.component';
import { HistoryComponent } from './modules/history/components/history/history.component';
import { ProfileComponent } from './modules/profile/components/profile/profile.component';

export const routes: Routes = [
  { path: '', component: PagesHomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'my-qr', component: MyQrComponent },
  { path: 'pay', component: PayComponent },
  { path: 'contact', component: ContactComponent },
  { path: 'history', component: HistoryComponent },
  { path: 'profile', component: ProfileComponent },
  { path: '**', redirectTo: '' }
];
