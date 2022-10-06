import { ge, Component } from 'jezvejs';
import { Switch } from 'jezvejs/Switch';
import { Offcanvas } from 'jezvejs/Offcanvas';
import { DARK_THEME } from '../../js/Application.js';
import './style.scss';

/**
 * Header component
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

        this.userBtn = ge('userbtn');
        this.userBtn.addEventListener('click', () => this.showUserNavigation());
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

        this.navUserNameElem = this.userNavContent.querySelector('.user-btn__title');
        this.closeUserNavBtn = this.userNavContent.querySelector('.user-navigation__close-btn');
        this.closeUserNavBtn.addEventListener('click', () => this.hideUserNavigation());

        this.themeSwitch = Switch.fromElement(ge('theme-check'), {
            onChange: (checked) => this.onToggleTheme(checked),
        });
        const currentTheme = window.app.getCurrentTheme();
        this.themeSwitch.check(currentTheme === DARK_THEME);
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
        this.userNavigation.open();
    }

    /** Hide user navigation */
    hideUserNavigation() {
        this.userNavigation.close();
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
