import {
    ge,
    isVisible,
    show,
    setEmptyClick,
    removeEmptyClick,
    Component,
    Switch,
    Offcanvas,
} from 'jezvejs';
import { DARK_THEME } from '../../js/Application.js';
import './style.scss';

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

        this.navigationContent = document.querySelector('.navigation-content');
        this.navigation = Offcanvas.create({
            content: this.navigationContent,
            className: 'navigation',
        });

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

        this.themeSwitch = Switch.fromElement(ge('theme-check'), {
            onChange: (checked) => this.onToggleTheme(checked),
        });
        const currentTheme = window.app.getCurrentTheme();
        this.themeSwitch.check(currentTheme === DARK_THEME);

        this.userNameElem = this.elem.querySelector('.user__title');
        if (this.userNameElem) {
            this.userName = this.userNameElem.textContent;
        }
    }

    /** Show navigation container */
    onToggleNav() {
        this.navigation?.open();
    }

    /** Hide navigation container */
    hideNavigation() {
        this.navigation?.close();
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
