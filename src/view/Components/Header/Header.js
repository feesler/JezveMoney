import {
    ge,
    show,
    Component,
    setEmptyClick,
    removeEmptyClick,
    setEvents,
    re,
    insertAfter,
} from 'jezvejs';
import { Switch } from 'jezvejs/Switch';
import { Offcanvas } from 'jezvejs/Offcanvas';
import { DARK_THEME } from '../../js/Application.js';
import './style.scss';

/**
 * Header component
 */
export class Header extends Component {
    constructor(props) {
        super(props);

        this.userNavEmptyClick = () => this.hideUserNavigation();

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
        this.navigation = Offcanvas.create({
            content: this.navigationContent,
            className: 'navigation main-navigation-offcanvas',
        });

        this.navToggleBtn = this.elem.querySelector('.nav-toggle-btn');
        setEvents(this.navToggleBtn, { click: () => this.onToggleNav() });
        this.closeNavBtn = this.navigationContent.querySelector('.navigation__close-btn');
        setEvents(this.closeNavBtn, { click: () => this.hideNavigation() });

        this.titleElem = this.elem.querySelector('.header-title');

        this.userBtn = ge('userbtn');
        setEvents(this.userBtn, { click: (e) => this.showUserNavigation(e) });

        this.actionsContainer = null;

        this.userNameElem = this.userBtn.querySelector('.user-btn__title');
        if (this.userNameElem) {
            this.userName = this.userNameElem.textContent;
        }

        this.userNavContent = document.querySelector('.user-navigation-content');
        this.userNavigation = Offcanvas.create({
            content: this.userNavContent,
            placement: 'right',
            className: 'user-navigation',
        });
        show(this.userNavContent, false);

        this.navUserNameElem = this.userNavContent.querySelector('.user-btn__title');
        this.closeUserNavBtn = this.userNavContent.querySelector('.user-navigation__close-btn');
        setEvents(this.closeUserNavBtn, { click: () => this.hideUserNavigation() });

        this.themeSwitch = Switch.fromElement(ge('theme-check'), {
            onChange: (checked) => this.onToggleTheme(checked),
        });
        const currentTheme = window.app.getCurrentTheme();
        this.themeSwitch.check(currentTheme === DARK_THEME);
    }

    /** Shows user button and hides actions */
    showUserMenu() {
        re(this.actionsContainer);
        this.actionsContainer = null;
        show(this.userBtn, true);
    }

    /** Shows actions and hides user button */
    showActions(actionsContainer) {
        if (!actionsContainer) {
            return;
        }

        this.actionsContainer = actionsContainer;
        show(this.userBtn, false);
        insertAfter(actionsContainer, this.userBtn);
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
    showUserNavigation(e) {
        e.stopPropagation();

        this.hideNavigation();
        show(this.userNavContent, true);
        this.userNavigation.open();

        setEmptyClick(this.userNavEmptyClick, [this.userNavContent]);
    }

    /** Hide user navigation */
    hideUserNavigation() {
        this.userNavigation.close();
        show(this.userNavContent, false);

        removeEmptyClick(this.userNavEmptyClick);
    }

    /**
     * Theme switch 'change' event handler
     * @param {Boolean} checked - current state
     */
    onToggleTheme(checked) {
        window.app.setTheme(checked);
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
