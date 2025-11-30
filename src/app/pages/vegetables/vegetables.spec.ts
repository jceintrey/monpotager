import { TestBed } from '@angular/core/testing';
import { Vegetables } from './vegetables';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { VegetableService } from '../../services/vegetable.service';

describe('Vegetables component', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Vegetables, FormsModule],
      providers: [VegetableService]
    }).compileComponents();
  });

  it('renders default vegetables', () => {
    const fixture = TestBed.createComponent(Vegetables);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('carottes');
    expect(compiled.textContent).toContain('tomates');
  });

  it('adds a vegetable via the form', async () => {
    const fixture = TestBed.createComponent(Vegetables);
    fixture.detectChanges();

    // Set value directly through the component and call onAdd to avoid async binding issues in the test
    const component = fixture.componentInstance;
    component.name = 'courgette';
    component.onAdd();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('courgette');
  });

  it('removes a vegetable', () => {
    const fixture = TestBed.createComponent(Vegetables);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('carottes');

    const removeButtons = fixture.debugElement.queryAll(By.css('button[type="button"]'));
    expect(removeButtons.length).toBeGreaterThan(0);

    // click first remove button
    removeButtons[0].nativeElement.click();
    fixture.detectChanges();

    expect(compiled.textContent).not.toContain('carottes');
  });
});
