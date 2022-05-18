import {
    ge,
    isVisible,
    show,
    setEmptyClick,
    ajax,
} from 'jezvejs';
import { Component } from 'jezvejs/Component';
import './style.css';

/* global baseURL, themes */

// Theme constants
export const WHITE_THEME = 0;
export const DARK_THEME = 1;

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
        if (!(this.elem instanceof Element)) {
            throw new Error('Invalid element specified');
        }

        this.menuPopup = ge('menupopup');
        this.userBtn = ge('userbtn');
        if (this.userBtn) {
            this.userBtn.addEventListener('click', () => this.onUserClick());
        }
        this.themeCheck = ge('theme-check');
        if (!this.themeCheck) {
            throw new Error('Invalid structure of header');
        }
        this.themeCheck.addEventListener('change', (e) => this.onToggleTheme(e));

        this.userNameElem = this.elem.querySelector('.user__title');
        if (this.userNameElem) {
            this.userName = this.userNameElem.textContent;
        }
    }

    /**
     * User button 'click' event handler
     */
    onUserClick() {
        if (isVisible(this.menuPopup)) {
            this.hidePopup();
        } else {
            show(this.menuPopup, true);
            setEmptyClick(() => this.hidePopup(), [this.menuPopup, this.userBtn]);
        }
    }

    /**
     * Hide user menu drop down
     */
    hidePopup() {
        show(this.menuPopup, false);
        setEmptyClick();
    }

    /**
     * Theme switch 'click' handler
     * @param {Event} e - event object
     */
    onToggleTheme(e) {
        const newTheme = e.target.checked ? DARK_THEME : WHITE_THEME;

        const linkElem = ge('theme-style');
        if (linkElem) {
            linkElem.href = `${baseURL}view/themes/${themes[newTheme].file}`;
        }

        document.body.className = themes[newTheme].className;

        ajax.get({
            url: `${baseURL}main/setTheme/?theme=${newTheme}`,
        });
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
