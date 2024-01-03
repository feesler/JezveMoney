import { isDate, isFunction } from '@jezvejs/types';
import {
    ge,
    createElement,
    getClassName,
} from '@jezvejs/dom';
import {
    formatDate,
    getLocaleDateFormat,
    isValidDateString,
} from '@jezvejs/datetime';
import { hasFlag } from 'jezvejs';
import { Notification } from 'jezvejs/Notification';

import { API } from '../API/index.js';
import {
    parseCookies,
    setCookie,
    __,
    timeToDate,
    createURL,
} from '../utils/utils.js';

/** CSS classes */
const INVALID_BLOCK_CLASS = 'invalid-block';

export const DEFAULT_LOCALE = 'en';

/** Theme constants */
export const WHITE_THEME = 0;
export const DARK_THEME = 1;

const ADMIN_FLAG = 1;
const TESTER_FLAG = 2;

/** Application class */
export class Application {
    static instance = null;

    static getInstance() {
        if (!this.instance) {
            this.instance = new this(window.appProps);
        }

        return this.instance;
    }

    constructor(props = {}) {
        if (Application.instance) {
            throw new Error('Application instance already created');
        }

        this.props = { ...props };

        // Setup view properties
        if (!this.props.view) {
            this.props.view = {};
        }

        this.config = {
            dateFormatLocale: this.locale,
            dateFormatOptions: {
                dateStyle: 'short',
            },
            decimalFormatLocale: this.locale,
            decimalFormatOptions: {
                style: 'decimal',
            },
        };

        // Setup models
        this.model = {};
        this.modelClass = {};

        if (this.props.profile) {
            this.updateProfile(this.props.profile);
        }

        this.notification = null;
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
        const model = ModelClass.create(data);
        this.model[name] = model;

        this.onModelDataLoaded(name, model);

        return model;
    }

    setModelData(name, data) {
        const model = this.model[name] ?? null;
        if (model === null) {
            return;
        }

        model.setData(data);
        this.onModelDataLoaded(name);
    }

    onModelDataLoaded(name) {
        if (name === 'userCurrencies') {
            this.model.userCurrencies.defaultSort();
        }
    }

    get baseURL() {
        return this.props.baseURL;
    }

    get themes() {
        return this.props.themes;
    }

    get locale() {
        return this.props.locale;
    }

    get locales() {
        return this.props.locales;
    }

    get message() {
        return this.props.message;
    }

    get dateFormatLocale() {
        return this.config.dateFormatLocale;
    }

    get dateFormatOptions() {
        return this.config.dateFormatOptions;
    }

    get decimalFormatLocale() {
        return this.config.decimalFormatLocale;
    }

    get decimalFormatOptions() {
        return this.config.decimalFormatOptions;
    }

    get userLogin() {
        return this.model.profile?.login;
    }

    get userName() {
        return this.model.profile?.name;
    }

    isUserLoggedIn() {
        return !!this.model.profile?.user_id;
    }

    isAdminUser() {
        return hasFlag(this.model.profile?.access ?? 0, ADMIN_FLAG);
    }

    isTesterUser() {
        return hasFlag(this.model.profile?.access ?? 0, TESTER_FLAG);
    }

    /** Returns URL instance for specified path and search params */
    getURL(path = '', params = {}) {
        return createURL(`${this.baseURL}${path}`, params);
    }

    isValidDateString(value, params = {}) {
        return isValidDateString(value, {
            locales: this.dateFormatLocale,
            options: this.dateFormatOptions,
            ...params,
        });
    }

    formatDate(value, params = {}) {
        const date = (isDate(value)) ? value : timeToDate(value);
        if (!isDate(date)) {
            throw new Error('Invalid date object');
        }

        return formatDate(date, {
            locales: params?.locales ?? this.dateFormatLocale,
            options: params?.options ?? this.dateFormatOptions,
        });
    }

    formatInputDate(date, params = {}) {
        const locales = params?.locales ?? this.dateFormatLocale;
        const options = params?.options ?? this.dateFormatOptions;
        const format = getLocaleDateFormat({ locales, options });

        return this.formatDate(date, {
            locales,
            options: {
                day: '2-digit',
                month: '2-digit',
                year: (format.yearLength === 2) ? '2-digit' : 'numeric',
            },
        });
    }

    formatNumber(value, params = {}) {
        const locales = params?.locales ?? this.decimalFormatLocale;
        const options = params?.options ?? this.decimalFormatOptions;

        const formatter = new Intl.NumberFormat(locales, options);
        return formatter.format(value);
    }

    getThemeCookie() {
        const cookies = parseCookies();
        return cookies.find((item) => item.name === 'theme');
    }

    getLocaleCookie() {
        const cookies = parseCookies();
        return cookies.find((item) => item.name === 'locale');
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
        const themeId = (dark) ? DARK_THEME : WHITE_THEME;
        const theme = this.props.themes[themeId];

        if (this.isCurrentTheme(theme)) {
            return;
        }

        const themeColor = ge('themeColor');
        if (themeColor) {
            themeColor.content = theme.color;
        }

        document.body.className = theme.className;

        setCookie('theme', themeId);
    }

    getCurrrentLocale() {
        return this.locale ?? DEFAULT_LOCALE;
    }

    setupLocale() {
        const localeCookie = this.getLocaleCookie();
        if (localeCookie?.value === this.locale) {
            return;
        }

        setCookie('locale', this.locale);
    }

    setLocale(locale) {
        if (this.getCurrrentLocale() === locale) {
            return;
        }

        setCookie('locale', locale);
        window.location.reload();
    }

    getTimezoneOffset() {
        const date = new Date();
        return date.getTimezoneOffset();
    }

    async updateTimeZone() {
        if (!this.model.profile) {
            return;
        }

        const { settings } = this.model.profile;
        const timezoneOffset = this.getTimezoneOffset();
        if (settings.tz_offset === timezoneOffset) {
            return;
        }

        try {
            await API.profile.updateSettings({
                tz_offset: timezoneOffset,
            });
            settings.tz_offset = timezoneOffset;
        } catch (e) {
            this.createErrorNotification(e.message);
        }
    }

    updateProfile(profile) {
        if (!profile) {
            this.model.profile = null;
            return;
        }

        this.model.profile = { ...profile };

        const { settings } = this.model.profile;
        if (settings) {
            this.config.dateFormatLocale = settings.date_locale;
            this.config.decimalFormatLocale = settings.decimal_locale;
        }

        this.updateRemindersBadge();
    }

    getProfileFromResponse(response) {
        return response?.data?.state?.profile;
    }

    updateProfileFromResponse(response) {
        const profile = this.getProfileFromResponse(response);
        this.updateProfile(profile);
    }

    /**
     * Updates reminders count badge
     */
    updateRemindersBadge() {
        const header = this.view?.header;
        if (!this.model.profile || !header) {
            return;
        }

        const { remindersCount } = this.model.profile;
        header.setRemindersCount(remindersCount);
    }

    /**
     * Navigates to the next URL
     */
    navigateNext() {
        const { referrer } = document;
        const nextURL = (referrer?.startsWith(this.baseURL)) ? referrer : this.baseURL;
        window.location = nextURL;
    }

    /**
     * Creates notification message
     * @param {string} message - notification text
     * @param {string} type - type of notification
     */
    createNotification(message, type) {
        if (this.notification) {
            this.notification.destroy();
        }

        this.notification = Notification.create({
            id: 'notificationPopup',
            type,
            content: message,
        });

        this.notification.show();
    }

    /**
     * Creates success notification message
     * @param {string} message - notification text
     */
    createSuccessNotification(message) {
        this.createNotification(message, 'success');
    }

    /**
     * Creates error notification message
     * @param {string} message - notification text
     */
    createErrorNotification(message) {
        this.createNotification(message, 'error');
    }

    /** Set validation state for element */
    setValidation(elem, valid) {
        const el = (typeof elem === 'string') ? ge(elem) : elem;
        el?.classList?.toggle(INVALID_BLOCK_CLASS, !valid);
    }

    /** Create simple container element */
    createContainer(elemClass, children, events) {
        return createElement('div', {
            props: { className: getClassName(elemClass) },
            children,
            events,
        });
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

        // Sort user accounts according to current settings
        const { settings } = this.model.profile;
        userAccounts.sortBy(settings.sort_accounts);

        const visibleUserAccounts = ModelClass.create(userAccounts.getVisible());
        visibleUserAccounts.sortBy(settings.sort_accounts);

        const hiddenUserAccounts = ModelClass.create(userAccounts.getHidden());
        hiddenUserAccounts.sortBy(settings.sort_accounts);

        userAccounts.setData([
            ...visibleUserAccounts,
            ...hiddenUserAccounts,
        ]);

        this.model.userAccounts = userAccounts;
        this.model.visibleUserAccounts = visibleUserAccounts;
        this.model.hiddenUserAccounts = hiddenUserAccounts;
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

        // Sort persons according to current settings
        const { settings } = this.model.profile;
        persons.sortBy(settings.sort_persons);

        const visiblePersons = ModelClass.create(persons.getVisible());
        visiblePersons.sortBy(settings.sort_persons);

        const hiddenPersons = ModelClass.create(persons.getHidden());
        hiddenPersons.sortBy(settings.sort_persons);

        persons.setData([
            ...visiblePersons,
            ...hiddenPersons,
        ]);

        this.model.visiblePersons = visiblePersons;
        this.model.hiddenPersons = hiddenPersons;
    }

    initCategoriesModel() {
        if (this.model.categoriesSorted) {
            return;
        }

        const { categories } = this.model;

        // Sort categories according to current settings
        const { settings } = this.model.profile;
        categories.sortBy(settings.sort_categories);

        this.model.categoriesSorted = true;
    }

    /** Initialize currency DropDown */
    initCurrencyList(ddlist) {
        if (!ddlist) {
            return;
        }

        this.model.currency.forEach(
            (curr) => ddlist.addItem({ id: curr.id, title: curr.formatName() }),
        );
    }

    /** Initialize user currencies DropDown */
    initUserCurrencyList(ddlist) {
        if (!ddlist) {
            return;
        }

        const ids = [];
        const items = [];

        this.model.userCurrencies.forEach((userCurr) => {
            const currency = this.model.currency.getItem(userCurr.curr_id);
            ids.push(currency.id);
            items.push({ ...currency, name: currency.formatName() });
        });

        this.appendListItems(ddlist, items);

        const otherCurrencies = [];
        this.model.currency.forEach((currency) => {
            if (ids.includes(currency.id)) {
                return;
            }

            otherCurrencies.push({ ...currency, name: currency.formatName() });
        });

        this.appendListItems(ddlist, otherCurrencies, { group: __('currencies.other') });
    }

    appendListItems(ddlist, items, options = {}) {
        if (!ddlist || !items || items.length === 0) {
            return;
        }

        const {
            idPrefix = '',
            group = null,
        } = options;
        let {
            groupId = null,
        } = options;

        if (typeof group === 'string' && group.length > 0) {
            groupId = groupId ?? ddlist.generateGroupId();
            ddlist.addGroup({ id: groupId, title: group });
        }

        items.forEach((item) => ddlist.addItem({
            id: `${idPrefix}${item.id}`,
            title: item.name,
            group: groupId,
        }));
    }

    appendAccounts(ddlist, options = {}) {
        if (!ddlist) {
            return;
        }

        const { visible = true, filter = null, ...rest } = options;

        this.checkUserAccountModels();
        const { visibleUserAccounts, hiddenUserAccounts } = this.model;
        let items = (visible) ? visibleUserAccounts : hiddenUserAccounts;
        if (isFunction(filter)) {
            items = items.filter(filter);
        }

        this.appendListItems(ddlist, items, rest);
    }

    appendPersons(ddlist, options = {}) {
        if (!ddlist) {
            return;
        }

        const { visible = true, filter = null, ...rest } = options;

        this.checkPersonModels();
        const { visiblePersons, hiddenPersons } = this.model;
        let items = (visible) ? visiblePersons : hiddenPersons;
        if (isFunction(filter)) {
            items = items.filter(filter);
        }

        this.appendListItems(ddlist, items, rest);
    }

    /** Initialize acconts DropDown */
    initAccountsList(ddlist, options = {}) {
        this.appendAccounts(ddlist, { ...options, visible: true });
        this.appendAccounts(ddlist, { ...options, visible: false, group: __('list.hiddenItemsCounter') });
    }

    /** Initialize persons DropDown */
    initPersonsList(ddlist, options = {}) {
        this.appendPersons(ddlist, { ...options, visible: true });
        this.appendPersons(ddlist, { ...options, visible: false, group: __('list.hiddenItemsCounter') });
    }
}
