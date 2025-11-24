import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterOutlet, ActivatedRoute, ActivatedRouteSnapshot, ChildrenOutletContexts } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService, User } from './auth.service';
import { routeAnimations } from './route-animations';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  animations: [routeAnimations]
})
export class AppComponent {
  title = 'syntara';
  showHeaderLinks: boolean = true;
  currentUser: User | null = null;
  isLoading: boolean = false;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private authService: AuthService,
    private contexts: ChildrenOutletContexts
  ) {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      const deepest = this.getDeepestRouteSnapshot(this.activatedRoute.snapshot);
      const hide = deepest?.data['hideHeaderLinks'] === true;
      this.showHeaderLinks = !hide;
    });
  }
  getRouteAnimationData() {
    return this.contexts.getContext('primary')?.route?.snapshot?.data?.['animation'];
  }
  goHome() {
    if (this.router.url === '/') {
      window.location.reload();
    } else {
      this.router.navigate(['/']);
    }
  }
  logout() {
    this.isLoading = true;
    setTimeout(() => {
      this.authService.logout();
      this.router.navigate(['/']);
      this.isLoading = false;
      window.location.reload();
    }, 1500);
  }
  private getDeepestRouteSnapshot(snapshot: ActivatedRouteSnapshot): ActivatedRouteSnapshot {
    let current = snapshot;
    while (current.firstChild) {
      current = current.firstChild;
    }
    return current;
  }
}
