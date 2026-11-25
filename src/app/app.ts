import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppHeader } from './shared/components/app-header/app-header';
import { BottomNavigation } from './shared/components/bottom-navigation/bottom-navigation';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AppHeader, BottomNavigation],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
