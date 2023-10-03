import { Component, createElement } from 'jezvejs';
import { Button } from 'jezvejs/Button';
import { Offcanvas } from 'jezvejs/Offcanvas';

import { Logo } from '../../Common/Logo/Logo.js';
import { NavigationMenu } from '../NavigationMenu/NavigationMenu.js';

import './AppNavigation.scss';

/* CSS classes */
const NAV_CLASS = 'navigation main-navigation-offcanvas';
const CONTAINER_CLASS = 'main-navigation navigation-content';
const CONTROLS_CLASS = 'navigation-controls';
const LOGO_CONTAINER_CLASS = 'navigation-logo';
const LOGO_CLASS = 'header-logo';
const BACK_BTN_CLASS = 'close-btn circle-btn';

const menuItems = [
    { url: 'accounts/', titleToken: 'accounts.listTitle', createButton: 'accounts/create/' },
    { url: 'persons/', titleToken: 'persons.listTitle', createButton: 'persons/create/' },
    { url: 'categories/', titleToken: 'categories.listTitle', createButton: 'categories/create/' },
    { url: 'transactions/', titleToken: 'transactions.listTitle', createButton: 'transactions/create/' },
    { url: 'schedule/', titleToken: 'schedule.listTitle', createButton: 'schedule/create/' },
    { url: 'reminders/', titleToken: 'reminders.listTitle' },
    { url: 'statistics/', titleToken: 'statistics.title' },
    { url: 'import/', titleToken: 'import.listTitle' },
    { type: 'separator' },
    { url: 'about/', titleToken: 'about.title', loggedOut: true },
];

/**
 * Application navigation container component
 */
export class AppNavigation extends Component {
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

    /** Shows navigation */
    open() {
        this.navigation.open();
    }

    /** Hides navigation */
    close() {
        this.navigation.close();
    }

    /**
     * Updates title of logo
     */
    setLogoTitle(title) {
        this.logo.setTitle(title);
    }
}
