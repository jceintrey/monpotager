import { TestBed } from '@angular/core/testing';
import { VegetableService } from './vegetable.service';
import { DEFAULT_VEGETABLES } from '../models/vegetable';

describe('VegetableService', () => {
  let service: VegetableService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(VegetableService);
  });

  it('should return default vegetables when none are stored', () => {
    const all = service.getAll();
    expect(all).toEqual(DEFAULT_VEGETABLES);
  });

  it('should add and find a vegetable', () => {
    service.clear();
    service.add({ name: 'courgette', unit: 'g' });
    const found = service.findByName('courgette');
    expect(found).toBeDefined();
    expect(found?.name).toBe('courgette');
    expect(found?.unit).toBe('g');
  });

  it('should remove a vegetable', () => {
    service.clear();
    service.add({ name: 'carottes', unit: 'pcs' });
    service.add({ name: 'tomates', unit: 'g' });
    const removed = service.remove('carottes');
    expect(removed.find(v => v.name === 'carottes')).toBeUndefined();
  });
});
