import {
    TestComponent,
    assert,
    query,
    queryAll,
    prop,
    click,
    asyncMap,
    evaluate,
} from 'jezve-test';

export class Header extends TestComponent {
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

        res.userBtn = { elem: await query(this.elem, '.header .user-btn') };
        assert(res.userBtn.elem, 'User button not found');

        res.userBtn.title = await evaluate((btnEl) => (
            btnEl.querySelector('.btn__content')?.textContent
        ), res.userBtn.elem);

        res.userNav = { elem: await query('.user-navigation') };
        assert(res.userNav.elem, 'User navigation not found');

        res.userNav.menuEl = await query(res.userNav.elem, '.nav-list');
        if (res.userNav.menuEl) {
            const menuLinks = await queryAll(res.userNav.menuEl, 'a.nav-item__link');
            res.userNav.menuItems = await asyncMap(menuLinks, async (elem) => ({
                elem,
                href: await prop(elem, 'href'),
            }));

            res.userNav.menuItems.forEach((item) => {
                if (item.href.endsWith('/profile/')) {
                    res.userNav.profileBtn = item;
                }
                if (item.href.endsWith('/settings/')) {
                    res.userNav.settingsBtn = item;
                }
                if (item.href.endsWith('/logout/')) {
                    res.userNav.logoutBtn = item;
                }
            });
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

    async clickSettingsMenuItem() {
        await this.clickUserButton();
        await click(this.content.userNav.settingsBtn.elem);
    }

    async clickLogoutMenuItem() {
        await this.clickUserButton();
        await click(this.content.userNav.logoutBtn.elem);
    }
}
