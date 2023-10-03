import {
    createElement,
    show,
} from 'jezvejs';
import { Button } from 'jezvejs/Button';
import { CloseButton } from 'jezvejs/CloseButton';
import { Offcanvas } from 'jezvejs/Offcanvas';

import { App } from '../../../../view/Application/App.js';

import { ThemeSwitchField } from '../../../../view/Components/Form/Fields/ThemeSwitchField/ThemeSwitchField.js';
import { NavigationMenu } from '../../../../view/Components/Layout/NavigationMenu/NavigationMenu.js';
import { UserNavigation } from '../../../../view/Components/Layout/UserNavigation/UserNavigation.js';

/* CSS classes */
const NAV_CLASS = 'user-navigation';
const CONTAINER_CLASS = 'user-navigation-content';
const CONTROLS_CLASS = 'user-navigation-controls';
const USER_BTN_CLASS = 'header-btn user-btn';
const CLOSE_BTN_CLASS = 'circle-btn right-align';

/**
 * User navigation container component
 */
export class AdminUserNavigation extends UserNavigation {
    constructor(props = {}) {
        super(props);

        this.navEmptyClick = () => this.close();

        this.init();
    }

    init() {
        if (!App.isUserLoggedIn() || !App.isAdminUser()) {
            return;
        }

        this.userButton = Button.create({
            className: USER_BTN_CLASS,
            icon: 'user',
            title: App.model.profile.name,
            onClick: () => this.close(),
        });

        this.closeButton = CloseButton.create({
            className: CLOSE_BTN_CLASS,
            small: false,
            tabIndex: 3,
            onClick: () => this.close(),
        });

        const controls = createElement('div', {
            props: { className: CONTROLS_CLASS },
            children: [
                this.userButton.elem,
                this.closeButton.elem,
            ],
        });

        this.themeField = ThemeSwitchField.create();

        const menuItems = [
            { content: this.themeField.elem },
            { type: 'separator' },
            { url: 'profile/', titleToken: 'profile.title' },
            { url: 'settings/', titleToken: 'settings.title' },
            { url: 'logout/', titleToken: 'actions.logout' },
            { type: 'separator' },
            { url: '', title: 'Back' },
        ];

        this.menu = NavigationMenu.create({
            items: menuItems,
        });

        this.elem = createElement('nav', {
            props: { className: CONTAINER_CLASS },
            children: [
                controls,
                this.menu.elem,
            ],
        });
        show(this.elem, false);

        this.navigation = Offcanvas.create({
            content: this.elem,
            className: NAV_CLASS,
            placement: 'right',
            onOpened: () => this.onNavigationOpened(),
            onClosed: () => this.onNavigationClosed(),
        });
    }
}
