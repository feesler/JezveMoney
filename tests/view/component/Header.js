import {
    TestComponent,
    assert,
    query,
    queryAll,
    prop,
    click,
} from 'jezve-test';
import { asyncMap } from '../../common.js';

const DEFAULT_USER_MENU_ITEMS = 2;

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

        res.logo.linkElem = await query(res.logo.elem, 'a');
        assert(res.logo.linkElem, 'Logo link element not found');

        res.user = { elem: await query(this.elem, '.user-block') };
        if (res.user.elem) {
            res.user.menuBtn = await query(this.elem, 'button.user-menu-btn');
            assert(res.user.menuBtn, 'User button not found');
            const el = await query(res.user.menuBtn, '.user__title');
            assert(el, 'User title element not found');
            res.user.name = await prop(el, 'textContent');

            res.user.menuEl = await query(this.elem, '.user-menu');
            assert(res.user.menuEl, 'Menu element not found');

            const menuLinks = await queryAll(res.user.menuEl, 'ul > li > a');
            res.user.menuItems = await asyncMap(menuLinks, async (elem) => ({
                elem,
                link: await prop(elem, 'href'),
                text: await prop(elem, 'textContent'),
            }));
            assert(res.user.menuItems.length >= DEFAULT_USER_MENU_ITEMS, 'Invalid user menu');

            const itemShift = (res.user.menuItems.length > DEFAULT_USER_MENU_ITEMS) ? 1 : 0;

            res.user.profileBtn = res.user.menuItems[itemShift].elem;
            res.user.logoutBtn = res.user.menuItems[itemShift + 1].elem;
        }

        return res;
    }

    async clickLogo() {
        await click(this.content.logo.linkElem);
    }

    async clickMenuButton() {
        await click(this.content.user.menuBtn);
    }

    async clickProfileMenuItem() {
        await this.clickMenuButton();
        await click(this.content.user.profileBtn);
    }

    async clickLogoutMenuItem() {
        await this.clickMenuButton();
        await click(this.content.user.logoutBtn);
    }
}
