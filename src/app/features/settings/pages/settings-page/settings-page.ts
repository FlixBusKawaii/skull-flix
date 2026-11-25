import { Component, inject, computed, signal } from '@angular/core';
import { BackupService } from '../../../../core/services/backup.service';
import type { BackupFile } from '../../../../models/backup.model';
import { GameService } from '../../../../core/services/game.service';

@Component({
  selector: 'app-settings-page',
  imports: [],
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.css',
})
export class SettingsPage {
  private readonly backupService = inject(BackupService);
  private readonly gameService = inject(GameService);

  readonly exportMessage = signal<string | null>(null);
  readonly exportSuccess = signal(false);

  readonly pendingBackup = signal<BackupFile | null>(null);
  readonly importMessage = signal<string | null>(null);
  readonly importSuccess = signal(false);

  readonly showImportConfirmation = signal(false);

  readonly importSummary = computed(() => {
    const backup = this.pendingBackup();

    if (!backup) return null;

    return {
      total: backup.games.length,
      inProgress: backup.games.filter((game) => game.status === 'in-progress').length,
      completed: backup.games.filter((game) => game.status === 'completed').length,
    };
  });

  exportBackup(): void {
    const success = this.backupService.exportBackup();

    this.exportSuccess.set(success);
    this.exportMessage.set(
      success ? 'Votre sauvegarde a été téléchargée.' : 'Impossible de créer la sauvegarde.',
    );
  }

  async onBackupFileSelected(event: Event): Promise<void> {
    const input = event.target;

    if (!(input instanceof HTMLInputElement)) return;

    const file = input.files?.[0];

    if (!file) return;

    this.pendingBackup.set(null);
    this.importMessage.set(null);

    try {
      const backup = await this.backupService.readBackupFile(file);

      this.pendingBackup.set(backup);
      this.importSuccess.set(true);
      this.importMessage.set('Fichier de sauvegarde vérifié avec succès.');
    } catch (error: unknown) {
      this.importSuccess.set(false);
      this.importMessage.set(
        error instanceof Error
          ? error.message
          : 'Une erreur est survenue pendant la lecture du fichier.',
      );
    } finally {
      input.value = '';
    }
  }

  requestImportConfirmation(): void {
    if (!this.pendingBackup()) return;

    this.showImportConfirmation.set(true);
  }

  cancelImport(): void {
    this.showImportConfirmation.set(false);
  }

  confirmImport(): void {
    const backup = this.pendingBackup();

    if (!backup) {
      this.showImportConfirmation.set(false);
      return;
    }

    const success = this.gameService.replaceGames(backup.games);

    this.showImportConfirmation.set(false);
    this.importSuccess.set(success);

    this.importMessage.set(
      success
        ? 'Vos parties ont été restaurées avec succès.'
        : 'Impossible de restaurer les parties. Vos données existantes ont été conservées.',
    );

    if (success) {
      this.pendingBackup.set(null);
    }
  }
}
