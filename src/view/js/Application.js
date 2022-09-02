import {
    ge,
    ce,
    svg,
    Popup,
} from 'jezvejs';
import { parseCookies, setCookie } from './utils.js';
import { AccountList } from './model/AccountList.js';
import { CurrencyList } from './model/CurrencyList.js';
import { IconList } from './model/IconList.js';
import { ImportRuleList } from './model/ImportRuleList.js';
import { ImportTemplateList } from './model/ImportTemplateList.js';
import { PersonList } from './model/PersonList.js';

/** CSS classes */
const INVALID_BLOCK_CLASS = 'invalid-block';

/** Theme constants */
export const WHITE_THEME = 0;
export const DARK_THEME = 1;

const HIDDEN_GROUP_TITLE = 'Hidden';

export class Application {
    constructor(props = {}) {
        this.props = { ...props };

        // Setup view properties
        if (!this.props.view) {
            this.props.view = {};
        }

        // Setup models
        this.model = {};

        if (this.props.profile) {
            this.model.profile = { ...this.props.profile };
        }

        if (this.props.currency) {
            this.model.currency = CurrencyList.create(this.props.currency);
        }

        if (this.props.icons) {
            this.model.icons = IconList.create(this.props.icons);
        }

        if (this.props.accounts) {
            this.model.accounts = AccountList.create(this.props.accounts);
        }

        if (this.props.persons) {
            this.model.persons = PersonList.create(this.props.persons);
        }

        if (this.props.rules) {
            this.model.rules = ImportRuleList.create(this.props.rules);
        }

        if (this.props.templates) {
            this.model.templates = ImportTemplateList.create(this.props.templates);
        }

        this.messageBox = null;
    }

    createView(ViewClass) {
        this.view = new ViewClass(this.props.view);
    }

    get baseURL() {
        return this.props.baseURL;
    }

    get themes() {
        return this.props.themes;
    }

    get message() {
        return this.props.message;
    }

    getThemeCookie() {
        const cookies = parseCookies();
        return cookies.find((item) => item.name === 'theme');
    }

    isPrefersDarkTheme() {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    isCurrentTheme(theme) {
        return document.body.classList.contains(theme?.className);
    }

    getCurrentTheme() {
        const { themes } = this.props;

        const themeId = Object.keys(themes).find(
            (key) => this.isCurrentTheme(themes[key]),
        );

        return (themeId) ? parseInt(themeId, 10) : WHITE_THEME;
    }

    setupTheme() {
        const themeCookie = this.getThemeCookie();
        if (themeCookie) {
            return;
        }

        if (this.isPrefersDarkTheme()) {
            this.setTheme(true);
        }
    }

    setTheme(dark) {
        const { baseURL, themes } = this.props;
        const themeId = (dark) ? DARK_THEME : WHITE_THEME;
        const theme = themes[themeId];

        if (this.isCurrentTheme(theme)) {
            return;
        }

        const linkElem = ge('theme-style');
        if (linkElem) {
            linkElem.href = `${baseURL}view/css/themes/${theme.file}`;
        }

        document.body.className = theme.className;

        setCookie('theme', themeId);
        fetch(`${baseURL}main/setTheme/?theme=${themeId}`);
    }

    /**
     * Create notification message
     * @param {string} message - notification text
     * @param {string} msgClass - CSS class for message box
     */
    createMessage(message, msgClass) {
        if (this.messageBox) {
            this.messageBox.destroy();
        }

        this.messageBox = Popup.create({
            id: 'notificationPopup',
            content: message,
            btn: { closeBtn: true },
            className: ['msg', msgClass],
            nodim: true,
            closeOnEmptyClick: true,
        });

        this.messageBox.show();
    }

    /**
     * Clear validation state of block
     * @param {string|Element} block - block to clear validation state
     */
    clearBlockValidation(block) {
        const blockElem = (typeof block === 'string') ? ge(block) : block;
        blockElem?.classList?.remove(INVALID_BLOCK_CLASS);
    }

    /**
     * Set invalid state for block
     * @param {string|Element} block - block to invalidate
     */
    invalidateBlock(block) {
        const blockElem = (typeof block === 'string') ? ge(block) : block;
        blockElem?.classList?.add(INVALID_BLOCK_CLASS);
    }

    /** Create simple container element */
    createContainer(elemClass, children, events) {
        return ce('div', { className: elemClass }, children, events);
    }

    /** Create SVG icon element */
    createIcon(icon, className = null) {
        const useElem = svg('use');
        const res = svg('svg', {}, useElem);
        if (className) {
            res.setAttribute('class', className);
        }

        useElem.href.baseVal = (icon) ? `#${icon}` : '';

        return res;
    }

    /** Create field element from given input element */
    createField({ title, content, className = null }) {
        const elemClasses = ['field'];
        if (typeof className === 'string' && className.length > 0) {
            elemClasses.push(className);
        }

        const labelElem = ce('label', { textContent: title });
        const contentElem = ce('div', {}, content);
        const res = {
            elem: ce('div', { className: elemClasses.join(' ') }, [labelElem, contentElem]),
            labelElem,
            contentElem,
        };

        return res;
    }

    checkUserAccountModels() {
        if (this.model.userAccounts) {
            return;
        }

        const userAccounts = AccountList.create(
            this.model.accounts.getUserAccounts(this.model.profile.owner_id),
        );
        // Sort user accounts by visibility: [...visible, ...hidden]
        userAccounts.sort((a, b) => a.flags - b.flags);
        this.model.userAccounts = userAccounts;
        this.model.visibleUserAccounts = AccountList.create(userAccounts.getVisible());
        this.model.hiddenUserAccounts = AccountList.create(userAccounts.getHidden());
    }

    checkPersonModels() {
        if (this.model.visiblePersons) {
            return;
        }

        const { persons } = this.model;
        // Sort persons by visibility: [...visible, ...hidden]
        persons.sort((a, b) => a.flags - b.flags);
        this.model.visiblePersons = PersonList.create(persons.getVisible());
        this.model.hiddenPersons = PersonList.create(persons.getHidden());
    }

    /** Initialize currency DropDown */
    initCurrencyList(ddlist) {
        if (!ddlist) {
            return;
        }

        window.app.model.currency.forEach(
            (curr) => ddlist.addItem({ id: curr.id, title: curr.name }),
        );
    }

    /** Initialize acconts DropDown */
    initAccountsList(ddlist) {
        if (!ddlist) {
            return;
        }

        window.app.checkUserAccountModels();

        const { visibleUserAccounts, hiddenUserAccounts } = window.app.model;

        visibleUserAccounts.forEach(
            (item) => ddlist.addItem({ id: item.id, title: item.name }),
        );
        if (hiddenUserAccounts.length === 0) {
            return;
        }

        const group = ddlist.addGroup(HIDDEN_GROUP_TITLE);
        hiddenUserAccounts.forEach(
            (item) => ddlist.addItem({
                id: item.id,
                title: item.name,
                group,
            }),
        );
    }

    /** Initialize DropDown for debt account tile */
    initPersonsList(ddlist) {
        if (!ddlist) {
            return;
        }

        window.app.checkPersonModels();

        const { visiblePersons, hiddenPersons } = window.app.model;

        visiblePersons.forEach(
            (person) => ddlist.addItem({ id: person.id, title: person.name }),
        );
        if (hiddenPersons.length === 0) {
            return;
        }

        const group = ddlist.addGroup(HIDDEN_GROUP_TITLE);
        hiddenPersons.forEach(
            (person) => ddlist.addItem({
                id: person.id,
                title: person.name,
                group,
            }),
        );
    }
}
