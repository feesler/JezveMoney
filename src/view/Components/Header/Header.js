import {
    ge,
    isVisible,
    show,
    setEmptyClick,
    removeEmptyClick,
    Component,
    Switch,
} from 'jezvejs';
import './style.scss';

// Theme constants
export const WHITE_THEME = 0;
export const DARK_THEME = 1;

const NAV_CLOSED_CLASS = 'navigation_closed';

/**
 * Header component constructor
 * @param {Object} props
 */
export class Header extends Component {
    /**
     * Parse DOM to obtain child elements and build state of component
     */
    parse() {
        this.elem = document.querySelector('.header');
        if (!this.elem) {
            throw new Error('Invalid element specified');
        }

        this.navigation = document.querySelector('.navigation');
        this.navigationContent = document.querySelector('.navigation-content');
        this.navigationBackground = document.querySelector('.navigation-bg');
        if (this.navigationBackground) {
            this.navigationBackground.addEventListener('click', () => this.hideNavigation());
        }
        this.navToggleBtn = this.elem.querySelector('.nav-toggle-btn');
        if (this.navToggleBtn) {
            this.navToggleBtn.addEventListener('click', () => this.onToggleNav());
        }
        this.closeNavBtn = document.querySelector('.navigation__close-btn');
        if (this.closeNavBtn) {
            this.closeNavBtn.addEventListener('click', () => this.hideNavigation());
        }

        this.menuPopup = ge('menupopup');
        this.userBtn = ge('userbtn');
        if (this.userBtn) {
            this.userBtn.addEventListener('click', () => this.onUserClick());
        }

        Switch.fromElement(ge('theme-check'), {
            onChange: (checked) => this.onToggleTheme(checked),
        });

        this.userNameElem = this.elem.querySelector('.user__title');
        if (this.userNameElem) {
            this.userName = this.userNameElem.textContent;
        }
    }

    /** Show navigation container */
    onToggleNav() {
        if (!this.navigation) {
            return;
        }

        this.navigation.classList.remove(NAV_CLOSED_CLASS);
    }

    /** Hide navigation container */
    hideNavigation() {
        this.navigation.classList.add(NAV_CLOSED_CLASS);
    }

    /**
     * User button 'click' event handler
     */
    onUserClick() {
        if (isVisible(this.menuPopup)) {
            this.hidePopup();
        } else {
            show(this.menuPopup, true);
            this.emptyClickHandler = () => this.hidePopup();
            setEmptyClick(this.emptyClickHandler, [this.menuPopup, this.userBtn]);
        }
    }

    /**
     * Hide user menu drop down
     */
    hidePopup() {
        show(this.menuPopup, false);
        removeEmptyClick(this.emptyClickHandler);
    }

    /**
     * Theme switch 'change' event handler
     * @param {Boolean} checked - current state
     */
    onToggleTheme(checked) {
        const { baseURL, themes } = window.app;
        const newTheme = checked ? DARK_THEME : WHITE_THEME;

        const linkElem = ge('theme-style');
        if (linkElem) {
            linkElem.href = `${baseURL}view/css/themes/${themes[newTheme].file}`;
        }

        document.body.className = themes[newTheme].className;

        fetch(`${baseURL}main/setTheme/?theme=${newTheme}`);
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
    }

    /**
     * Create new Header from specified element
     */
    static create() {
        let res;

        try {
            res = new Header();
            res.parse();
        } catch (e) {
            res = null;
        }

        return res;
    }
}
