import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScoreTable } from './score-table';

describe('ScoreTable', () => {
  let component: ScoreTable;
  let fixture: ComponentFixture<ScoreTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScoreTable],
    }).compileComponents();

    fixture = TestBed.createComponent(ScoreTable);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('players', [
      { id: 'player-1', name: 'Alice' },
      { id: 'player-2', name: 'Bob' },
    ]);

    fixture.componentRef.setInput('rounds', [
      {
        number: 1,
        scores: [
          { playerId: 'player-1', bid: null, tricks: null, bonus: 0, points: null },
          { playerId: 'player-2', bid: null, tricks: null, bonus: 0, points: null },
        ],
      },
    ]);

    fixture.componentRef.setInput(
      'totals',
      new Map([
        ['player-1', 0],
        ['player-2', 0],
      ]),
    );

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit negative scores', () => {
    const emittedValues: {
      roundNumber: number;
      playerId: string;
      points: number | null;
    }[] = [];

    component.scoreChange.subscribe((value) => {
      emittedValues.push(value);
    });

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    input.value = '-50';
    input.dispatchEvent(new Event('input'));

    expect(emittedValues).toEqual([
      {
        roundNumber: 1,
        playerId: 'player-1',
        points: -50,
      },
    ]);
  });
});
