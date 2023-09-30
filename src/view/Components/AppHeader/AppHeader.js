import {
    show,
    setEmptyClick,
    removeEmptyClick,
    setEvents,
    re,
    isFunction,
    createElement,
} from 'jezvejs';
import { Button } from 'jezvejs/Button';
import { Header } from 'jezvejs/Header';
import { HeaderMenuButton } from 'jezvejs/HeaderMenuButton';
import { Icon } from 'jezvejs/Icon';
import { Offcanvas } from 'jezvejs/Offcanvas';

import { NavigationMenu } from '../NavigationMenu/NavigationMenu.js';

import './AppHeader.scss';
import { Badge } from '../Badge/Badge.js';
import { getApplicationURL } from '../../utils/utils.js';
import { App } from '../../Application/App.js';

/* CSS classes */
const SHOW_ACTIONS_CLASS = 'show-actions';

const defaultProps = {
    title: null,
};

/**
 * Header component
 */
export class AppHeader extends Header {
    constructor(props = {}) {
        super({
            ...defaultProps,
            ...props,
        });

        this.userNavEmptyClick = () => this.hideUserNavigation();
        this.onActionsShown = null;

        this.actionsContainer = null;
        this.userName = App.model.profile?.name ?? null;
    }

    /**
     * Component initialization
     */
    init() {
        this.logoTitle = createElement('span', {
            props: {
                className: 'header-logo__title',
                textContent: 'Jezve',
            },
            children: createElement('b', { props: { textContent: 'Money' } }),
        });

        this.logo = createElement('a', {
            props: {
                className: 'header-logo',
                href: getApplicationURL(),
                tabIndex: 1,
            },
            children: [
                createElement('span', {
                    props: { className: 'header-logo__icon' },
                    children: Icon.create({
                        icon: 'header-logo',
                        className: 'logo-icon',
                    }).elem,
                }),
                this.logoTitle,
            ],
        });

        this.menuButton = HeaderMenuButton.create({
            onClick: () => this.onToggleNav(),
        });

        const loggedIn = App.isUserLoggedIn();

        this.userBtn = Button.create({
            id: 'userbtn',
            className: 'header-btn user-btn',
            tabIndex: 2,
            icon: loggedIn ? 'user' : 'ellipsis',
            title: (loggedIn && App.model.profile.name) ?? null,
            onClick: (e) => this.showUserNavigation(e),
        });

        this.titleElem = createElement('div', {
            props: { className: 'header-title' },
        });
        this.headerActions = createElement('div', {
            props: { className: 'header__content header-actions' },
            children: this.titleElem,
        });

        this.container = createElement('div', {
            props: { className: 'header__container' },
            events: {
                transitionend: (e) => this.onContentTransitionEnd(e),
            },
            children: [
                createElement('div', {
                    props: { className: 'header__content main-header-content' },
                    children: this.userBtn.elem,
                }),
                this.headerActions,
            ],
        });

        this.state.content = [
            this.logo,
            this.menuButton.elem,
            this.container,
        ];

        super.init();

        // Main menu
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

        this.closeNavBtn = this.navigationContent.querySelector('.close-btn');
        setEvents(this.closeNavBtn, { click: () => this.hideNavigation() });

        // User navigation Offcanvas
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
     * Updates title of logo
     */
    setLogoTitle(title) {
        this.logoTitle.textContent = title;
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
        this.userBtn.setTitle(this.userName);

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

    setRemindersCount(count) {
        const showButton = count > 0;
        if (!showButton) {
            this.remindersBtn?.show(false);
            return;
        }

        if (!this.remindersBtn) {
            this.remindersBadge = Badge.create();
            this.remindersBtn = Button.create({
                id: 'remindersBtn',
                type: 'link',
                url: getApplicationURL('reminders'),
                icon: 'notification',
                title: this.remindersBadge.elem,
                className: 'header-btn',
            });
            this.userBtn.elem.before(this.remindersBtn.elem);
        }

        this.remindersBadge.setTitle(count);
        this.remindersBtn.show(true);
    }
}
