import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NotificationService } from './notification.service';
import { Should } from '../common/fluent-assertions';

describe('NotificationService', () => {
  let service: NotificationService;
  let snackBarMock: jasmine.SpyObj<MatSnackBar>;

  beforeEach(() => {
    snackBarMock = jasmine.createSpyObj('MatSnackBar', ['open']);

    TestBed.configureTestingModule({
      providers: [
        NotificationService,
        { provide: MatSnackBar, useValue: snackBarMock },
      ],
    });

    service = TestBed.inject(NotificationService);
  });

  it('should be created', () => {
    service.Should().NotBeNull().And.BeDefined();
  });

  describe('success', () => {
    it('should open a snackbar with the success panel class and the default duration', () => {
      service.success('Profile updated successfully.');

      Should(snackBarMock.open).HaveBeenCalledWith(
        'Profile updated successfully.',
        'Close',
        {
          duration: 4000,
          panelClass: ['notification-success'],
        },
      );
    });
  });

  describe('error', () => {
    it('should open a snackbar with the error panel class and the default duration', () => {
      service.error('Could not update your profile');

      Should(snackBarMock.open).HaveBeenCalledWith(
        'Could not update your profile',
        'Close',
        {
          duration: 4000,
          panelClass: ['notification-error'],
        },
      );
    });
  });
});