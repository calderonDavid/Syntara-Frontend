import { trigger, transition, style, query, animate } from '@angular/animations';

export const routeAnimations = trigger('routeAnimations', [
  transition('* <=> *', [
    // Al iniciar, ocultamos la página que entra
    query(':enter', [
      style({ opacity: 0, transform: 'translateY(20px)' })
    ], { optional: true }),

    // Animamos la página que entra
    query(':enter', [
      animate('600ms cubic-bezier(0.35, 0, 0.25, 1)',
        style({ opacity: 1, transform: 'translateY(0)' })
      )
    ], { optional: true })
  ])
]);
