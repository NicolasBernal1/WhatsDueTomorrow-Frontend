import { Task } from '@serenity-js/core';
import { Click, Enter } from '@serenity-js/web';

import { Navbar } from '../ui/Navbar';
import { ProfileMenu } from '../ui/ProfileMenu';

export const OpenTheProfileMenu = {
  now: () => Task.where(`#actor abre el menu de perfil`, Click.on(Navbar.profileButton())),
};

export const LogOut = {
  now: () => Task.where(`#actor cierra sesion`,
    OpenTheProfileMenu.now(),
    Click.on(Navbar.logOutItem()),
  ),
};

export const VerifyCurrentPassword = {
  as: (password: string) => Task.where(`#actor verifica su contraseña actual`,
    OpenTheProfileMenu.now(),
    Enter.theValue(password).into(ProfileMenu.currentPassword()),
    Click.on(ProfileMenu.verifyButton()),
  ),
};

export const ChangePassword = {
  from: (current: string, next: string) => Task.where(`#actor cambia su contraseña`,
    VerifyCurrentPassword.as(current),
    Enter.theValue(next).into(ProfileMenu.newPassword()),
    Click.on(ProfileMenu.changeButton()),
  ),
};