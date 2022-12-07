import {
    ge,
    createElement,
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

    get dateFormatLocale() {
        return this.config.dateFormatLocale;
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

    /** Set validation state for element */
    setValidation(elem, valid) {
        const el = (typeof elem === 'string') ? ge(elem) : elem;
        el?.classList?.toggle(INVALID_BLOCK_CLASS, !valid);
    }

    /** Create simple container element */
    createContainer(elemClass, children, events) {
        return createElement('div', { props: { className: elemClass }, children, events });
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

        this.model.currency.forEach(
            (curr) => ddlist.addItem({ id: curr.id, title: curr.name }),
        );
    }

    appendListItems(ddlist, items, options = {}) {
        if (!ddlist || !items || items.length === 0) {
            return;
        }

        const {
            idPrefix = '',
            group = null,
        } = options;

        const itemsGroup = (typeof group === 'string' && group.length > 0)
            ? ddlist.addGroup(group)
            : null;
        items.forEach(
            (item) => ddlist.addItem({
                id: `${idPrefix}${item.id}`,
                title: item.name,
                group: itemsGroup,
            }),
        );
    }

    appendAccounts(ddlist, options = {}) {
        if (!ddlist) {
            return;
        }

        const { visible = true, ...rest } = options;

        this.checkUserAccountModels();
        const { visibleUserAccounts, hiddenUserAccounts } = this.model;
        const items = (visible) ? visibleUserAccounts : hiddenUserAccounts;
        this.appendListItems(ddlist, items, rest);
    }

    appendPersons(ddlist, options = {}) {
        if (!ddlist) {
            return;
        }

        const { visible = true, ...rest } = options;

        this.checkPersonModels();
        const { visiblePersons, hiddenPersons } = this.model;
        const items = (visible) ? visiblePersons : hiddenPersons;
        this.appendListItems(ddlist, items, rest);
    }

    /** Initialize acconts DropDown */
    initAccountsList(ddlist) {
        if (!ddlist) {
            return;
        }

        this.appendAccounts(ddlist, { visible: true });
        this.appendAccounts(ddlist, { visible: false, group: HIDDEN_GROUP_TITLE });
    }

    /** Initialize DropDown for debt account tile */
    initPersonsList(ddlist) {
        this.appendPersons(ddlist, { visible: true });
        this.appendPersons(ddlist, { visible: false, group: HIDDEN_GROUP_TITLE });
    }
}
