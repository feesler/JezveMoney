import { createElement } from 'jezvejs';
import { Button } from 'jezvejs/Button';
import { Offcanvas } from 'jezvejs/Offcanvas';

import { getApplicationURL } from '../../../../view/utils/utils.js';

import { Logo } from '../../../../view/Components/Common/Logo/Logo.js';
import { NavigationMenu } from '../../../../view/Components/Layout/NavigationMenu/NavigationMenu.js';
import { AppNavigation } from '../../../../view/Components/Layout/AppNavigation/AppNavigation.js';

/* CSS classes */
const NAV_CLASS = 'navigation main-navigation-offcanvas';
const CONTAINER_CLASS = 'main-navigation navigation-content';
const CONTROLS_CLASS = 'navigation-controls';
const LOGO_CONTAINER_CLASS = 'navigation-logo';
const LOGO_CLASS = 'header-logo';
const BACK_BTN_CLASS = 'close-btn circle-btn';

const menuItems = [
    { id: 'currency', url: 'admin/currency/', title: 'Currencies' },
    { id: 'color', url: 'admin/color/', title: 'Colors' },
    { id: 'icon', url: 'admin/icon/', title: 'Icons' },
    { id: 'log', url: 'admin/log/', title: 'Logs' },
    { id: 'balance', url: 'admin/balance/', title: 'Balance' },
    { id: 'tests', url: 'admin/tests/', title: 'Tests' },
    { id: 'apiconsole', url: 'admin/apiconsole/', title: 'API console' },
    { id: 'user', url: 'admin/user/', title: 'Users' },
];

/**
 * Application navigation container component
 */
export class AdminNavigation extends AppNavigation {
    constructor(props = {}) {
        super(props);

        this.init();
    }

    init() {
        this.backButton = Button.create({
            className: BACK_BTN_CLASS,
            icon: 'back',
            onClick: () => this.close(),
        });

        this.logo = Logo.create({
            className: LOGO_CLASS,
            url: getApplicationURL('admin/'),
            title: 'Admin',
        });

        const logoContainer = createElement('div', {
            props: { className: LOGO_CONTAINER_CLASS },
            children: this.logo.elem,
        });

        const controls = createElement('div', {
            props: { className: CONTROLS_CLASS },
            children: [this.backButton.elem, logoContainer],
        });

        this.menu = NavigationMenu.create({
            items: menuItems,
        });

        this.elem = createElement('nav', {
            props: { className: CONTAINER_CLASS },
            children: [controls, this.menu.elem],
        });

        this.navigation = Offcanvas.create({
            content: this.elem,
            className: NAV_CLASS,
        });
    }
}
