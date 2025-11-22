import { Directive, ElementRef, Input, OnChanges, SimpleChanges } from '@angular/core';

@Directive({
  selector: '[appTypewriter]',
  standalone: true
})
export class TypewriterDirective implements OnChanges {
  @Input('appTypewriter') textToType: string = '';
  @Input() typingSpeed: number = 50; // Velocidad en ms

  constructor(private el: ElementRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['textToType'] && this.textToType) {
      this.typeText();
    }
  }

  private typeText() {
    const element = this.el.nativeElement;
    element.textContent = ''; // Limpiar
    const chars = this.textToType.split('');
    let i = 0;

    // Intervalo para añadir letras
    const interval = setInterval(() => {
      if (i < chars.length) {
        element.textContent += chars[i];
        i++;
      } else {
        clearInterval(interval);
      }
    }, this.typingSpeed);
  }
}
