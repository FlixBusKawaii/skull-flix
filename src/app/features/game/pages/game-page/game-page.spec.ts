import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { GameService } from '../../../../core/services/game.service';
import { GamePage } from './game-page';

describe('GamePage', () => {
  let component: GamePage;
  let fixture: ComponentFixture<GamePage>;
  let gameId: string;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GamePage],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: () => gameId,
              },
            },
          },
        },
      ],
    }).compileComponents();

    const gameService = TestBed.inject(GameService);
    const game = gameService.createGame(['Alice', 'Bob']);

    if (!game) {
      throw new Error('Impossible de créer la partie de test');
    }

    gameId = game.id;

    fixture = TestBed.createComponent(GamePage);
    component = fixture.componentInstance;
    fixture.detectChanges();

    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the game information', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Partie en cours');
    expect(compiled.textContent).toContain('Tableau des scores');
    expect(compiled.textContent).toContain('Alice');
    expect(compiled.textContent).toContain('Bob');

    expect(compiled.textContent).toContain('Total');
  });

  it('should update a score and recalculate the total', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const inputs = compiled.querySelectorAll('input[type="number"]');

    const firstInput = inputs[0] as HTMLInputElement;

    firstInput.value = '120';
    firstInput.dispatchEvent(new Event('input'));

    fixture.detectChanges();

    expect(firstInput.value).toBe('120');
    expect(compiled.textContent).toContain('120');
  });

  it('should accept zero as a valid score', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const inputs = compiled.querySelectorAll('input[type="number"]');

    const firstInput = inputs[0] as HTMLInputElement;

    firstInput.value = '0';
    firstInput.dispatchEvent(new Event('input'));

    fixture.detectChanges();

    expect(firstInput.value).toBe('0');
  });

  it('should clear a score when the input is emptied', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const inputs = compiled.querySelectorAll('input[type="number"]');

    const firstInput = inputs[0] as HTMLInputElement;

    firstInput.value = '120';
    firstInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    firstInput.value = '';
    firstInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(firstInput.value).toBe('');
  });

  it('should persist scores in localStorage', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const inputs = compiled.querySelectorAll('input[type="number"]');

    const firstInput = inputs[0] as HTMLInputElement;

    firstInput.value = '150';
    firstInput.dispatchEvent(new Event('input'));

    const storedGames = JSON.parse(localStorage.getItem('skullflix_games_v1') ?? '[]');

    const savedGame = storedGames.find((game: { id: string }) => game.id === gameId);

    expect(savedGame).toBeDefined();
    expect(savedGame.rounds[0].scores[0].points).toBe(150);
  });
});
