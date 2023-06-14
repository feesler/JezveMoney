import {
    ge,
    show,
    Component,
    setEmptyClick,
    removeEmptyClick,
    setEvents,
    re,
    isFunction,
} from 'jezvejs';
import { Offcanvas } from 'jezvejs/Offcanvas';
import './Header.scss';
import { NavigationMenu } from '../NavigationMenu/NavigationMenu.js';

/* CSS classes */
const SHOW_ACTIONS_CLASS = 'show-actions';

/**
 * Header component
 */
export class Header extends Component {
    constructor(props) {
        super(props);

        this.userNavEmptyClick = () => this.hideUserNavigation();
        this.onActionsShown = null;

        if (this.elem) {
            this.parse();
        }
    }

    /**
     * Parse DOM to obtain child elements and build state of component
     */
    parse() {
        if (!this.elem) {
            throw new Error('Invalid element specified');
        }

        this.navigationContent = document.querySelector('.main-navigation');

        const navList = this.navigationContent.querySelector('.nav-list');
        if (!navList) {
            this.navigationMenu = NavigationMenu.create();
            this.navigationContent.append(this.navigationMenu.elem);
        }

        this.navigation = Offcanvas.create({
            content: this.navigationContent,
            className: 'navigation main-navigation-offcanvas',
        });

        this.navToggleBtn = this.elem.querySelector('.nav-toggle-btn');
        setEvents(this.navToggleBtn, { click: () => this.onToggleNav() });
        this.closeNavBtn = this.navigationContent.querySelector('.close-btn');
        setEvents(this.closeNavBtn, { click: () => this.hideNavigation() });

        // Actions
        this.container = this.elem.querySelector('.header__container');
        setEvents(this.container, {
            transitionend: (e) => this.onContentTransitionEnd(e),
        });

        this.headerActions = this.elem.querySelector('.header-actions');
        this.titleElem = this.headerActions.querySelector('.header-title');

        this.userBtn = ge('userbtn');
        setEvents(this.userBtn, { click: (e) => this.showUserNavigation(e) });

        this.actionsContainer = null;

        this.userNameElem = this.userBtn.querySelector('.btn__content');
        if (this.userNameElem) {
            this.userName = this.userNameElem.textContent;
        }

        this.userNavContent = document.querySelector('.user-navigation-content');
        this.userNavigation = Offcanvas.create({
            content: this.userNavContent,
            placement: 'right',
            className: 'user-navigation',
            onOpened: () => this.onUserNavigationOpened(),
            onClosed: () => this.onUserNavigationClosed(),
        });
        show(this.userNavContent, false);

        this.navUserNameElem = this.userNavContent.querySelector('.user-btn .btn__content');
        this.closeUserNavBtn = this.userNavContent.querySelector('.close-btn');
        setEvents(this.closeUserNavBtn, { click: () => this.hideUserNavigation() });
    }

    onContentTransitionEnd() {
        if (this.container.classList.contains(SHOW_ACTIONS_CLASS)) {
            return;
        }

        re(this.actionsContainer);
        this.actionsContainer = null;

        if (isFunction(this.onActionsShown)) {
            this.onActionsShown();
        }
        this.onActionsShown = null;
    }

    /** Shows user button and hides actions */
    showUserMenu(onShown = null) {
        this.onActionsShown = onShown;
        this.container.classList.remove(SHOW_ACTIONS_CLASS);
    }

    /** Shows actions and hides user button */
    showActions(actionsContainer) {
        if (!actionsContainer) {
            return;
        }

        this.onActionsShown = null;
        this.actionsContainer = actionsContainer;
        this.headerActions.append(actionsContainer);
        this.container.classList.add(SHOW_ACTIONS_CLASS);
    }

    /** Show navigation */
    onToggleNav() {
        this.hideUserNavigation();
        this.navigation?.open();
    }

    /** Hide navigation */
    hideNavigation() {
        this.navigation?.close();
    }

    /** Show user navigation */
    showUserNavigation() {
        this.hideNavigation();
        show(this.userNavContent, true);
        this.userNavigation.open();
    }

    /** Hide user navigation */
    hideUserNavigation() {
        this.userNavigation.close();
    }

    /** User navigation 'opened' event handler */
    onUserNavigationOpened() {
        setEmptyClick(this.userNavEmptyClick, [this.userNavContent]);
    }

    /** User navigation 'closed' event handler */
    onUserNavigationClosed() {
        show(this.userNavContent, false);
        removeEmptyClick(this.userNavEmptyClick);
    }

    /**
     * Set new user name
     * @param {string} name - user name
     */
    setUserName(name) {
        if (typeof name !== 'string') {
            throw new Error('Invalid name specified');
        }

        if (this.userName === name) {
            return;
        }

        this.userName = name;
        this.userNameElem.textContent = this.userName;
        this.navUserNameElem.textContent = this.userName;
    }

    setTitle(title = null) {
        if (!this.titleElem) {
            return;
        }
        if (typeof title !== 'string' && title !== null) {
            return;
        }

        this.titleElem.textContent = title ?? '';
    }
}
