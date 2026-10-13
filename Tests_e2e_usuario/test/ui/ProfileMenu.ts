import { By, PageElement } from '@serenity-js/web';

export const ProfileMenu = {
  userName: () => PageElement.located(By.css('.profile-info h3')).describedAs('nombre del perfil'),
  userEmail: () => PageElement.located(By.css('.profile-info p')).describedAs('correo del perfil'),
  currentPassword: () => PageElement.located(By.css('.password-section input[type="password"]')).describedAs('campo contraseña actual'),
  verifyButton: () => PageElement.located(By.css('.password-section button')).describedAs('boton Verify Password'),
  incorrectMessage: () => PageElement.located(By.css('.password-section .error-message')).describedAs('mensaje Incorrect password'),
  verifiedMessage: () => PageElement.located(By.css('.password-section .verified-message')).describedAs('mensaje de contraseña verificada'),
  newPassword: () => PageElement.located(By.css('.password-section input[type="password"]')).describedAs('campo nueva contraseña'),
  changeButton: () => PageElement.located(By.css('.password-section button')).describedAs('boton Change Password'),
};