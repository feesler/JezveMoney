import { asyncMap } from '../../common.js';
import { Component } from './component.js';

export class Header extends Component {
    async parse() {
        // no header is ok for login view
        if (!this.elem) {
            return;
        }

        this.logo = {};
        this.logo.elem = await this.query(this.elem, '.logo');
        if (!this.logo.elem) {
            throw new Error('Logo element not found');
        }

        this.logo.linkElem = await this.query(this.logo.elem, 'a');
        if (!this.logo.linkElem) {
            throw new Error('Logo link element not found');
        }

        this.user = {};
        this.user.elem = await this.query(this.elem, '.user-block');
        if (this.user.elem) {
            this.user.menuBtn = await this.query(this.elem, 'button.user-menu-btn');
            if (!this.user.menuBtn) {
                throw new Error('User button not found');
            }
            const el = await this.query(this.user.menuBtn, '.user_title');
            if (!el) {
                throw new Error('User title element not found');
            }
            this.user.name = await this.prop(el, 'textContent');

            this.user.menuEl = await this.query(this.elem, '.user-menu');
            if (!this.user.menuEl) {
                throw new Error('Menu element not found');
            }

            const menuLinks = await this.queryAll(this.user.menuEl, 'ul > li > a');
            this.user.menuItems = await asyncMap(menuLinks, async (elem) => ({
                elem,
                link: await this.prop(elem, 'href'),
                text: await this.prop(elem, 'textContent'),
            }));
            if (this.user.menuItems.length < 2) {
                throw new Error('Invalid user menu');
            }

            const itemShift = (this.user.menuItems.length > 2) ? 1 : 0;

            this.user.profileBtn = this.user.menuItems[itemShift].elem;
            this.user.logoutBtn = this.user.menuItems[itemShift + 1].elem;
        }
    }
}
