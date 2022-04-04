import { AppComponent } from './AppComponent.js';
import { asyncMap } from '../../common.js';

export class Header extends AppComponent {
    async parseContent() {
        // no header is ok for login view
        if (!this.elem) {
            return {};
        }

        const res = {
            logo: { elem: await this.query(this.elem, '.logo') },
        };

        if (!res.logo.elem) {
            throw new Error('Logo element not found');
        }

        res.logo.linkElem = await this.query(res.logo.elem, 'a');
        if (!res.logo.linkElem) {
            throw new Error('Logo link element not found');
        }

        res.user = { elem: await this.query(this.elem, '.user-block') };
        if (res.user.elem) {
            res.user.menuBtn = await this.query(this.elem, 'button.user-menu-btn');
            if (!res.user.menuBtn) {
                throw new Error('User button not found');
            }
            const el = await this.query(res.user.menuBtn, '.user__title');
            if (!el) {
                throw new Error('User title element not found');
            }
            res.user.name = await this.prop(el, 'textContent');

            res.user.menuEl = await this.query(this.elem, '.user-menu');
            if (!res.user.menuEl) {
                throw new Error('Menu element not found');
            }

            const menuLinks = await this.queryAll(res.user.menuEl, 'ul > li > a');
            res.user.menuItems = await asyncMap(menuLinks, async (elem) => ({
                elem,
                link: await this.prop(elem, 'href'),
                text: await this.prop(elem, 'textContent'),
            }));
            if (res.user.menuItems.length < 2) {
                throw new Error('Invalid user menu');
            }

            const itemShift = (res.user.menuItems.length > 2) ? 1 : 0;

            res.user.profileBtn = res.user.menuItems[itemShift].elem;
            res.user.logoutBtn = res.user.menuItems[itemShift + 1].elem;
        }

        return res;
    }
}
