  describe('delete account flow', () => {
    it('requestDeleteAccount should set pendingDeleteConfirmation to true', () => {
      component.requestDeleteAccount();
      expect(component.pendingDeleteConfirmation).toBeTrue();
    });

    it('cancelDeleteAccount should set pendingDeleteConfirmation back to false without calling deleteAccount', () => {
      component.pendingDeleteConfirmation = true;
      component.cancelDeleteAccount();
      expect(component.pendingDeleteConfirmation).toBeFalse();
      expect(authServiceMock.deleteAccount).not.toHaveBeenCalled();
    });

    it('confirmDelete should call deleteAccount and then logout', () => {
      const navigateSpy = spyOn(router, 'navigate');
      authServiceMock.deleteAccount.and.returnValue(
        of({ status: 204, message: 'Account deleted' })
      );

      component.confirmDelete();

      expect(authServiceMock.deleteAccount).toHaveBeenCalled();
      expect(authServiceMock.logout).toHaveBeenCalled();
      expect(navigateSpy).toHaveBeenCalledWith(['/login']);
      expect(component.pendingDeleteConfirmation).toBeFalse();
    });

    it('confirmDelete should log the error when deleteAccount fails', () => {
      spyOn(console, 'error');
      authServiceMock.deleteAccount.and.returnValue(throwError(() => ({ status: 500 })));

      component.confirmDelete();

      expect(console.error).toHaveBeenCalled();
      expect(authServiceMock.logout).not.toHaveBeenCalled();
    });
  });