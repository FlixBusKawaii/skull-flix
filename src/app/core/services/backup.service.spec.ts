import { TestBed } from '@angular/core/testing';
import { BackupService } from './backup.service';
import { StorageService } from './storage.service';
import type { Game } from '../../models/game.model';

describe('BackupService', () => {
  let service: BackupService;
  let storageService: { getGames: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    storageService = {
      getGames: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        BackupService,
        {
          provide: StorageService,
          useValue: storageService,
        },
      ],
    });

    service = TestBed.inject(BackupService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should export all saved games in a JSON file', async () => {
    const games = [{ id: 'game-1' }, { id: 'game-2' }] as Game[];

    storageService.getGames.mockReturnValue(games);

    const createObjectURL = vi.fn().mockReturnValue('blob:test');
    const revokeObjectURL = vi.fn();

    vi.stubGlobal('URL', {
      createObjectURL,
      revokeObjectURL,
    });

    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    const result = service.exportBackup();

    expect(result).toBe(true);
    expect(storageService.getGames).toHaveBeenCalledOnce();
    expect(createObjectURL).toHaveBeenCalledOnce();

    const blob = createObjectURL.mock.calls[0][0] as Blob;
    const content = JSON.parse(await blob.text());

    expect(content.app).toBe('SkullFlix');
    expect(content.version).toBe(1);
    expect(content.games).toEqual(games);
    expect(new Date(content.exportedAt).toString()).not.toBe('Invalid Date');

    expect(revokeObjectURL).toHaveBeenCalledWith('blob:test');
  });

  it('should export an empty backup when no games exist', async () => {
    storageService.getGames.mockReturnValue([]);

    const createObjectURL = vi.fn().mockReturnValue('blob:test');

    vi.stubGlobal('URL', {
      createObjectURL,
      revokeObjectURL: vi.fn(),
    });

    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    const result = service.exportBackup();

    expect(result).toBe(true);

    const blob = createObjectURL.mock.calls[0][0] as Blob;
    const content = JSON.parse(await blob.text());

    expect(content.games).toEqual([]);
  });

  it('should return false when document is unavailable', () => {
    vi.stubGlobal('document', undefined);

    const result = service.exportBackup();

    expect(result).toBe(false);
    expect(storageService.getGames).not.toHaveBeenCalled();
  });

  describe('readBackupFile', () => {
    it('should read a valid backup file', async () => {
      const backup = {
        app: 'SkullFlix',
        version: 1,
        exportedAt: new Date().toISOString(),
        games: [],
      };

      const file = new File([JSON.stringify(backup)], 'backup.json', { type: 'application/json' });

      await expect(service.readBackupFile(file)).resolves.toEqual(backup);
    });

    it('should reject an invalid JSON file', async () => {
      const file = new File(['invalid json'], 'backup.json', { type: 'application/json' });

      await expect(service.readBackupFile(file)).rejects.toThrow(
        'Le fichier sélectionné ne contient pas un JSON valide.',
      );
    });

    it('should reject a backup with an invalid structure', async () => {
      const file = new File([JSON.stringify({ app: 'OtherApp', version: 1 })], 'backup.json', {
        type: 'application/json',
      });

      await expect(service.readBackupFile(file)).rejects.toThrow(
        'Le fichier de sauvegarde est invalide ou incompatible avec cette version de SkullFlix.',
      );
    });

    it('should reject a file that cannot be read', async () => {
      const file = new File(['{}'], 'backup.json');

      vi.spyOn(file, 'text').mockRejectedValue(new Error('Read error'));

      await expect(service.readBackupFile(file)).rejects.toThrow(
        'Impossible de lire le fichier sélectionné.',
      );
    });
  });
});
