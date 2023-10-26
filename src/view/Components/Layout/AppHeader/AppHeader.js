import { isFunction } from '@jezvejs/types';
import {
    re,
    createElement,
} from '@jezvejs/dom';
import { Button } from 'jezvejs/Button';
import { Header } from 'jezvejs/Header';
import { HeaderMenuButton } from 'jezvejs/HeaderMenuButton';

import { App } from '../../../Application/App.js';
import { getApplicationURL } from '../../../utils/utils.js';

import { Badge } from '../../Common/Badge/Badge.js';
import { Logo } from '../../Common/Logo/Logo.js';
import { AppNavigation } from '../AppNavigation/AppNavigation.js';
import { UserNavigation } from '../UserNavigation/UserNavigation.js';

import './AppHeader.scss';

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

        this.onActionsShown = null;

        this.actionsContainer = null;
        this.userName = App.model.profile?.name ?? null;
    }

    /**
     * Component initialization
     */
    init() {
        this.logo = Logo.create({
            className: 'header-logo',
            tabIndex: 1,
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
            this.logo.elem,
            this.menuButton.elem,
            this.container,
        ];

        super.init();

        // Main menu
        this.navigation = AppNavigation.create();

        // User navigation Offcanvas
        this.userNavigation = UserNavigation.create();
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
        this.userNavigation.close();
        this.navigation.open();
    }

    /** Show user navigation */
    showUserNavigation() {
        this.navigation.close();
        this.userNavigation.open();
    }

    /**
     * Updates title of logo
     */
    setLogoTitle(title) {
        this.logo.setTitle(title);
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
        this.userNavigation.setUserName(this.userName);
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
