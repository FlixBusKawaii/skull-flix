import { Routes } from '@angular/router';
import { GamePage } from './features/game/pages/game-page/game-page';
import { HistoryPage } from './features/history/pages/history-page/history-page';
import { SettingsPage } from './features/settings/pages/settings-page/settings-page';

export const routes: Routes = [
  {
    path: '',
    component: GamePage,
  },
  {
    path: 'game/:id',
    component: GamePage,
  },
  {
    path: 'history',
    component: HistoryPage,
  },
  {
    path: 'settings',
    component: SettingsPage,
  },
];
