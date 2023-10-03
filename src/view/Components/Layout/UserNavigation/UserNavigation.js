import {
    Component,
    createElement,
    removeEmptyClick,
    setEmptyClick,
    show,
} from 'jezvejs';
import { Button } from 'jezvejs/Button';
import { CloseButton } from 'jezvejs/CloseButton';
import { Offcanvas } from 'jezvejs/Offcanvas';

import { App } from '../../../Application/App.js';

import { LocaleSelectField } from '../../Form/Fields/LocaleSelectField/LocaleSelectField.js';
import { ThemeSwitchField } from '../../Form/Fields/ThemeSwitchField/ThemeSwitchField.js';
import { NavigationMenu } from '../NavigationMenu/NavigationMenu.js';

import './UserNavigation.scss';

/* CSS classes */
const NAV_CLASS = 'user-navigation';
const CONTAINER_CLASS = 'user-navigation-content';
const CONTROLS_CLASS = 'user-navigation-controls';
const USER_BTN_CLASS = 'header-btn user-btn';
const CLOSE_BTN_CLASS = 'circle-btn right-align';

/**
 * User navigation container component
 */
export class UserNavigation extends Component {
    constructor(props = {}) {
        super(props);

        this.navEmptyClick = () => this.close();

        this.init();
    }

    init() {
        const loggedIn = App.isUserLoggedIn();

        const controlsChildren = [];
        if (loggedIn) {
            this.userButton = Button.create({
                className: USER_BTN_CLASS,
                icon: 'user',
                title: App.model.profile.name,
                onClick: () => this.close(),
            });
            controlsChildren.push(this.userButton.elem);
        }

        this.closeButton = CloseButton.create({
            className: CLOSE_BTN_CLASS,
            small: false,
            tabIndex: 3,
            onClick: () => this.close(),
        });
        controlsChildren.push(this.closeButton.elem);

        const children = [
            createElement('div', {
                props: { className: CONTROLS_CLASS },
                children: controlsChildren,
            }),
        ];

        if (loggedIn) {
            const menuItems = [
                { url: 'profile/', titleToken: 'profile.title' },
                { url: 'settings/', titleToken: 'settings.title' },
                { url: 'logout/', titleToken: 'actions.logout' },
            ];
            if (App.isAdminUser()) {
                menuItems.push(
                    { type: 'separator' },
                    { url: 'admin/', titleToken: 'adminPanel' },
                );
            }

            this.menu = NavigationMenu.create({
                items: menuItems,
            });

            children.push(this.menu.elem);
        } else {
            this.localeField = LocaleSelectField.create();
            this.themeField = ThemeSwitchField.create();
            children.push(this.localeField.elem, this.themeField.elem);
        }

        this.elem = createElement('nav', {
            props: { className: CONTAINER_CLASS },
            children,
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

    /** Shows navigation */
    open() {
        show(this.elem, true);
        this.navigation.open();
    }

    /** Hides navigation */
    close() {
        this.navigation.close();
    }

    /**
     * Set new user name
     * @param {string} name - user name
     */
    setUserName(name) {
        if (typeof name !== 'string') {
            throw new Error('Invalid name specified');
        }

        this.userButton?.setTitle(name);
    }

    /** Navigation 'opened' event handler */
    onNavigationOpened() {
        setEmptyClick(this.navEmptyClick, [this.elem]);
    }

    /** Navigation 'closed' event handler */
    onNavigationClosed() {
        show(this.elem, false);
        removeEmptyClick(this.navEmptyClick);
    }
}
