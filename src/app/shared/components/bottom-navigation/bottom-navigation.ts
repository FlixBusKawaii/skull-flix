import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-bottom-navigation',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './bottom-navigation.html',
  styleUrl: './bottom-navigation.css',
})
export class BottomNavigation {
  private readonly router = inject(Router);

  isGameRoute(): boolean {
    return this.router.url === '/' || this.router.url.startsWith('/game/');
  }
}
