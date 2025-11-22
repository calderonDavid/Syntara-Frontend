import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { SubscriptionComponent } from './subscription/subscription.component';
import { PaymentComponent } from './payment/payment.component';
import { authGuard } from './auth.guard';
import { HistoryComponent } from './history/history.component';

export const routes: Routes = [
  { path: '', component: HomeComponent, data: { animation: 'HomePage' } },
  {
    path: 'login',
    component: LoginComponent,
    data: { hideHeaderLinks: true, animation: 'LoginPage' }
  },
  {
    path: 'register',
    component: RegisterComponent,
    data: { hideHeaderLinks: true, animation: 'RegisterPage' }
  },
  {
    path: 'subscription',
    component: SubscriptionComponent,
    canActivate: [authGuard],
    data: { hideHeaderLinks: true, animation: 'SubscriptionPage' }
  },
  {
    path: 'payment',
    component: PaymentComponent,
    canActivate: [authGuard],
    data: { hideHeaderLinks: true, animation: 'PaymentPage' }
  },
  {
    path: 'history',
    component: HistoryComponent,
    canActivate: [authGuard],
    data: { animation: 'HistoryPage' }
  },
  { path: '**', redirectTo: '', pathMatch: 'full' }
];
