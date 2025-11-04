import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddAssignmentModalComponent } from './add-assignment-modal.component';

describe('AddAssignmentModalComponent', () => {
  let component: AddAssignmentModalComponent;
  let fixture: ComponentFixture<AddAssignmentModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddAssignmentModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddAssignmentModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
