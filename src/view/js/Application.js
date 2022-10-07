import {
    ge,
    ce,
    svg,
    isDate,
    formatDate,
} from 'jezvejs';
import { Popup } from 'jezvejs/Popup';
import { parseCookies, setCookie } from './utils.js';

/** CSS classes */
const INVALID_BLOCK_CLASS = 'invalid-block';
/** Strings */
const HIDDEN_GROUP_TITLE = 'Hidden';
/** Theme constants */
export const WHITE_THEME = 0;
export const DARK_THEME = 1;

/** Application class */
export class Application {
    constructor(props = {}) {
        this.props = { ...props };

        // Setup view properties
        if (!this.props.view) {
            this.props.view = {};
        }

        this.config = {
            datePickerLocale: 'en',
            dateFormatLocale: 'ru',
        };

        // Setup models
        this.model = {};
        this.modelClass = {};

        if (this.props.profile) {
            this.model.profile = { ...this.props.profile };
        }

        this.messageBox = null;
    }

    createView(ViewClass) {
        this.view = new ViewClass(this.props.view);
    }

    loadModel(ModelClass, name, data) {
        if (!ModelClass) {
            throw new Error('Invalid model class');
        }
        if (typeof name !== 'string' || name.length === 0) {
            throw new Error('Invalid model name');
        }

        this.modelClass[name] = ModelClass;
        this.model[name] = ModelClass.create(data);

        return this.model[name];
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

    get datePickerLocale() {
        return this.config.datePickerLocale;
    }

    formatDate(date) {
        if (!isDate(date)) {
            throw new Error('Invalid date object');
        }

        return formatDate(date, this.config.dateFormatLocale);
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

    checkUserAccountModels() {
        if (this.model.userAccounts) {
            return;
        }

        const ModelClass = this.modelClass.accounts;
        if (!ModelClass) {
            throw new Error('Accounts model not initialized');
        }

        const userAccounts = ModelClass.create(
            this.model.accounts.getUserAccounts(this.model.profile.owner_id),
        );
        // Sort user accounts by visibility: [...visible, ...hidden]
        userAccounts.sort((a, b) => a.flags - b.flags);
        this.model.userAccounts = userAccounts;
        this.model.visibleUserAccounts = ModelClass.create(userAccounts.getVisible());
        this.model.hiddenUserAccounts = ModelClass.create(userAccounts.getHidden());
    }

    checkPersonModels() {
        if (this.model.visiblePersons) {
            return;
        }

        const ModelClass = this.modelClass.persons;
        if (!ModelClass) {
            throw new Error('Persons model not initialized');
        }

        const { persons } = this.model;
        // Sort persons by visibility: [...visible, ...hidden]
        persons.sort((a, b) => a.flags - b.flags);
        this.model.visiblePersons = ModelClass.create(persons.getVisible());
        this.model.hiddenPersons = ModelClass.create(persons.getHidden());
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
