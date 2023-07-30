import {
    TestComponent,
    assert,
    query,
    queryAll,
    click,
    evaluate,
} from 'jezve-test';
import { App } from '../../Application.js';
import { REMINDER_SCHEDULED } from '../../model/Reminder.js';

export class Header extends TestComponent {
    static getExpectedState(state = App.state) {
        const res = {};

        const reminders = state.getReminders({ state: REMINDER_SCHEDULED });
        if (reminders.length > 0) {
            res.remindersBtn = {
                visible: true,
                counter: reminders.length.toString(),
            };
        }

        return res;
    }

    get userBtn() {
        return this.content.userBtn;
    }

    async parseContent() {
        // no header is ok for login view
        if (!this.elem) {
            return {};
        }

        const res = {
            logo: { elem: await query(this.elem, '.header-logo') },
        };

        assert(res.logo.elem, 'Logo element not found');

        // Reminders counter button
        res.remindersBtn = { elem: await query(this.elem, '#remindersBtn') };

        // User button
        res.userBtn = { elem: await query(this.elem, '.header .user-btn') };
        assert(res.userBtn.elem, 'User button not found');

        res.userNav = { elem: await query('.user-navigation') };
        assert(res.userNav.elem, 'User navigation not found');

        [
            res.remindersBtn.visible,
            res.remindersBtn.counter,
            res.userBtn.title,
            res.userNav.menuItems,
        ] = await evaluate((remBtn, userBtn, navListEl) => ([
            !!remBtn && !remBtn.hidden,
            remBtn?.querySelector('.badge')?.textContent,
            userBtn?.querySelector('.btn__content')?.textContent,
            Array.from(navListEl?.querySelectorAll('.nav-list a.nav-item__link'))
                .map((el) => el?.href),
        ]), res.remindersBtn.elem, res.userBtn.elem, res.userNav.elem);

        const menuLinks = await queryAll(res.userNav.elem, '.nav-list a.nav-item__link');
        res.userNav.menuItems = res.userNav.menuItems.map((href, index) => {
            const item = {
                href,
                elem: menuLinks[index],
            };

            if (href?.endsWith('/profile/')) {
                res.userNav.profileBtn = item;
            }
            if (href?.endsWith('/settings/')) {
                res.userNav.settingsBtn = item;
            }
            if (href?.endsWith('/logout/')) {
                res.userNav.logoutBtn = item;
            }

            return item;
        });

        return res;
    }

    async clickLogo() {
        await click(this.content.logo.elem);
    }

    async clickUserButton() {
        await click(this.content.userBtn.elem);
    }

    async clickProfileMenuItem() {
        await this.clickUserButton();
        await click(this.content.userNav.profileBtn.elem);
    }

    async clickSettingsMenuItem() {
        await this.clickUserButton();
        await click(this.content.userNav.settingsBtn.elem);
    }

    async clickLogoutMenuItem() {
        await this.clickUserButton();
        await click(this.content.userNav.logoutBtn.elem);
    }
}
