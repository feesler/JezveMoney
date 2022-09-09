import {
    TestComponent,
    assert,
    query,
    queryAll,
    prop,
    click,
} from 'jezve-test';
import { asyncMap } from '../../common.js';

export class Header extends TestComponent {
    async parseContent() {
        // no header is ok for login view
        if (!this.elem) {
            return {};
        }

        const res = {
            logo: { elem: await query(this.elem, '.header-logo') },
        };

        assert(res.logo.elem, 'Logo element not found');

        res.userBtn = { elem: await query(this.elem, '.header .user-btn') };
        assert(res.userBtn.elem, 'User button not found');

        res.userBtn.titleElem = await query(res.userBtn.elem, '.user-btn__title');
        if (res.userBtn.titleElem) {
            res.userBtn.title = await prop(res.userBtn.titleElem, 'textContent');
        }

        res.userNav = { elem: await query('.user-navigation') };
        assert(res.userNav.elem, 'User navigation not found');

        res.userNav.menuEl = await query(res.userNav.elem, '.nav-list');
        if (res.userNav.menuEl) {
            const menuLinks = await queryAll(res.userNav.menuEl, 'a.nav-link');
            res.userNav.menuItems = await asyncMap(menuLinks, async (elem) => ({
                elem,
                title: await prop(elem, 'textContent'),
            }));

            for (const item of res.userNav.menuItems) {
                if (item.title.toLowerCase() === 'profile') {
                    res.userNav.profileBtn = item;
                }
                if (item.title.toLowerCase() === 'logout') {
                    res.userNav.logoutBtn = item;
                }
            }
        }

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

    async clickLogoutMenuItem() {
        await this.clickUserButton();
        await click(this.content.userNav.logoutBtn.elem);
    }
}
