import { ComponentFixture, TestBed } from '@angular/core/testing';

import Harvests from './harvests';

describe('Harvests', () => {
  let component: Harvests;
  let fixture: ComponentFixture<Harvests>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Harvests],
    }).compileComponents();

    fixture = TestBed.createComponent(Harvests);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
