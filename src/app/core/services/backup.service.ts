import { Injectable, inject } from '@angular/core';
import { StorageService } from './storage.service';
import type { BackupFile } from '../../models/backup.model';
import { isBackupFile } from './backup.validator';

@Injectable({
  providedIn: 'root',
})
export class BackupService {
  private readonly storage = inject(StorageService);

  exportBackup(): boolean {
    if (typeof document === 'undefined') return false;

    const backup: BackupFile = {
      app: 'SkullFlix',
      version: 1,
      exportedAt: new Date().toISOString(),
      games: this.storage.getGames(),
    };

    const json = JSON.stringify(backup, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `skullflix-backup-${backup.exportedAt.slice(0, 10)}.json`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    return true;
  }

  async readBackupFile(file: File): Promise<BackupFile> {
    let content: string;

    try {
      content = await file.text();
    } catch {
      throw new Error('Impossible de lire le fichier sélectionné.');
    }

    let data: unknown;

    try {
      data = JSON.parse(content);
    } catch {
      throw new Error('Le fichier sélectionné ne contient pas un JSON valide.');
    }

    if (!isBackupFile(data)) {
      throw new Error(
        'Le fichier de sauvegarde est invalide ou incompatible avec cette version de SkullFlix.',
      );
    }

    return data;
  }
}
