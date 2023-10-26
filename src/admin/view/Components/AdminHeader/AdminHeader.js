import { createElement } from '@jezvejs/dom';
import { Button } from 'jezvejs/Button';
import { HeaderMenuButton } from 'jezvejs/HeaderMenuButton';

import { App } from '../../../../view/Application/App.js';
import { getApplicationURL } from '../../../../view/utils/utils.js';

import { AdminNavigation } from '../AdminNavigation/AdminNavigation.js';
import { AdminUserNavigation } from '../AdminUserNavigation/AdminUserNavigation.js';
import { Logo } from '../../../../view/Components/Common/Logo/Logo.js';
import { AppHeader } from '../../../../view/Components/Layout/AppHeader/AppHeader.js';

const defaultProps = {
    title: null,
};

/**
 * Header component
 */
export class AdminHeader extends AppHeader {
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
            title: 'Admin',
            tabIndex: 1,
            url: getApplicationURL('admin/'),
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

        this.elem = createElement('header');

        // Main menu
        this.navigation = AdminNavigation.create();

        // User navigation Offcanvas
        this.userNavigation = AdminUserNavigation.create();
    }
}
