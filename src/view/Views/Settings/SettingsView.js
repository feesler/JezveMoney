import 'jezvejs/style';
import {
    asArray,
    isFunction,
} from 'jezvejs';
import { Button } from 'jezvejs/Button';
import { DropDown } from 'jezvejs/DropDown';
import { MenuButton } from 'jezvejs/MenuButton';
import { SortableListContainer } from 'jezvejs/SortableListContainer';
import { createStore } from 'jezvejs/Store';
import { TabList } from 'jezvejs/TabList';

import { __ } from '../../utils/utils.js';
import { CurrencyList } from '../../Models/CurrencyList.js';
import { UserCurrencyList } from '../../Models/UserCurrencyList.js';
import { Application } from '../../Application/Application.js';
import { View } from '../../utils/View.js';
import { API } from '../../API/index.js';

import { Heading } from '../../Components/Heading/Heading.js';
import { CurrencyItem } from './components/CurrencyItem/CurrencyItem.js';
import { DateFormatSelect } from '../../Components/DateFormatSelect/DateFormatSelect.js';
import { LoadingIndicator } from '../../Components/LoadingIndicator/LoadingIndicator.js';
import { LocaleSelect } from '../../Components/LocaleSelect/LocaleSelect.js';
import { ThemeSwitch } from '../../Components/ThemeSwitch/ThemeSwitch.js';
import { CurrencyListMainMenu } from './components/MainMenu/CurrencyListMainMenu.js';
import { CurrencyListContextMenu } from './components/ContextMenu/CurrencyListContextMenu.js';

import { actions, createItemsFromModel, reducer } from './reducer.js';
import '../../Components/Heading/Heading.scss';
import '../../Components/Field/Field.scss';
import '../../Application/Application.scss';
import './SettingsView.scss';

/* CSS classes */
const SELECT_MODE_CLASS = 'currencies-list_select';

/**
 * Settings view
 */
class SettingsView extends View {
    constructor(...args) {
        super(...args);

        this.menuActions = {
            selectModeBtn: () => this.setListMode('select'),
            sortModeBtn: () => this.setListMode('sort'),
            selectAllBtn: () => this.selectAll(),
            deselectAllBtn: () => this.deselectAll(),
            deleteBtn: () => this.deleteItems(),
        };

        this.contextMenuActions = {
            ctxDeleteBtn: () => this.deleteItems(),
        };

        window.app.loadModel(CurrencyList, 'currency', window.app.props.currency);
        window.app.loadModel(UserCurrencyList, 'userCurrencies', window.app.props.userCurrencies);

        const { settings } = window.app.model.profile;

        const initialState = {
            ...this.props,
            userCurrencies: createItemsFromModel(),
            renderTime: Date.now(),
            loading: false,
            listMode: 'list',
            showMenu: false,
            showContextMenu: false,
            contextItem: null,
            dateLocale: settings.date_locale,
            decimalLocale: settings.decimal_locale,
            dateRenderTime: Date.now(),
        };

        this.store = createStore(reducer, { initialState });
    }

    /** View initialization */
    onStart() {
        this.loadElementsByIds([
            'localeSelect',
            'themeSwitch',
            'userCurrenciesHeading',
            'userCurrenciesContainer',
            'dateFormatContainer',
            'decimalFormatContainer',
            'tabsContainer',
            'mainTab',
            'userCurrenciesTab',
            'regionalTab',
        ]);

        // Locale select
        this.localeSelect = LocaleSelect.fromElement(this.localeSelect);

        // Theme swtich
        this.themeSwitch = ThemeSwitch.fromElement(this.themeSwitch);

        // User currencies
        this.userCurrenciesHeading = Heading.fromElement(this.userCurrenciesHeading, {
            title: __('SETTINGS_CURRENCIES'),
        });

        this.createBtn = Button.create({
            id: 'createBtn',
            className: 'circle-btn',
            icon: 'plus',
        });

        this.listModeBtn = Button.create({
            id: 'listModeBtn',
            className: 'action-button',
            title: __('DONE'),
            onClick: () => this.setListMode('list'),
        });

        this.menuButton = MenuButton.create({
            className: 'circle-btn',
            onClick: (e) => this.showMenu(e),
        });

        this.userCurrenciesHeading.actionsContainer.append(
            this.createBtn.elem,
            this.listModeBtn.elem,
            this.menuButton.elem,
        );

        this.currencySelect = DropDown.create({
            elem: this.createBtn.elem,
            listAttach: true,
            enableFilter: true,
            onItemSelect: (sel) => this.onCurrencySelect(sel),
        });

        window.app.initCurrencyList(this.currencySelect);

        this.list = SortableListContainer.create({
            ItemComponent: CurrencyItem,
            getItemProps: (item, { listMode }) => ({
                item,
                selected: item.selected,
                listMode,
                showControls: (listMode === 'list'),
            }),
            getItemById: (id) => this.getItemById(id),
            className: 'currencies-list',
            itemSelector: '.currency-item',
            itemSortSelector: '.currency-item.currency-item_sort',
            selectModeClass: SELECT_MODE_CLASS,
            sortModeClass: 'currencies-list_sort',
            placeholderClass: 'currency-item_placeholder',
            listMode: 'list',
            noItemsMessage: __('USER_CURRENCIES_NO_DATA'),
            onItemClick: (id, e) => this.onItemClick(id, e),
            onSort: (info) => this.onSort(info),
        });
        this.userCurrenciesContainer.append(this.list.elem);

        this.loadingIndicator = LoadingIndicator.create({
            fixed: false,
        });

        // Date format
        this.dateFormatSelect = DateFormatSelect.create({
            onItemSelect: (sel) => this.onDateFormatSelect(sel),
        });
        this.dateFormatContainer.append(this.dateFormatSelect.elem);

        // Decimal format
        this.decimalFormatSelect = DropDown.create({
            onItemSelect: (sel) => this.onDecimalFormatSelect(sel),
            data: [
                { id: 'ru', title: '1 234 567,89' },
                { id: 'es', title: '1.234.567,89' },
                { id: 'en', title: '1,234,567.89' },
                { id: 'de-ch', title: '1’234’567.89' },
                { id: 'hi', title: '12,34,567.345' },
            ],
        });
        this.decimalFormatContainer.append(this.decimalFormatSelect.elem);

        // Tabs
        this.tabs = TabList.create({
            items: [{
                id: 'main',
                value: 'main',
                title: __('SETTINGS_MAIN'),
                content: this.mainTab,
            }, {
                id: 'currencies',
                value: 'currencies',
                title: __('SETTINGS_CURRENCIES'),
                content: this.userCurrenciesTab,
            }, {
                id: 'regional',
                value: 'regional',
                title: __('SETTINGS_REGIONAL'),
                content: this.regionalTab,
            }],
        });
        this.tabsContainer.append(this.tabs.elem);

        this.subscribeToStore(this.store);
    }

    showMenu() {
        this.store.dispatch(actions.showMenu());
    }

    hideMenu() {
        this.store.dispatch(actions.hideMenu());
    }

    onMenuClick(item) {
        this.menu.hideMenu();

        const menuAction = this.menuActions[item];
        if (isFunction(menuAction)) {
            menuAction();
        }
    }

    onContextMenuClick(item) {
        this.hideContextMenu();

        const menuAction = this.contextMenuActions[item];
        if (isFunction(menuAction)) {
            menuAction();
        }
    }

    showContextMenu(itemId) {
        this.store.dispatch(actions.showContextMenu(itemId));
    }

    hideContextMenu() {
        this.store.dispatch(actions.hideContextMenu());
    }

    toggleSelectItem(itemId) {
        this.store.dispatch(actions.toggleSelectItem(itemId));
    }

    selectAll() {
        this.store.dispatch(actions.selectAllItems());
    }

    deselectAll() {
        this.store.dispatch(actions.deselectAllItems());
    }

    startLoading() {
        this.store.dispatch(actions.startLoading());
    }

    stopLoading() {
        this.store.dispatch(actions.stopLoading());
    }

    setDateRenderTime() {
        this.store.dispatch(actions.setDateRenderTime());
    }

    setListMode(listMode) {
        this.store.dispatch(actions.changeListMode(listMode));
    }

    getSelectedItems(state) {
        return state.userCurrencies.filter((item) => item.selected);
    }

    getSelectedIds(state) {
        const selArr = this.getSelectedItems(state);
        return selArr.map((item) => item.id);
    }

    getContextIds(state) {
        if (state.listMode === 'list') {
            return asArray(state.contextItem);
        }

        return this.getSelectedIds(state);
    }

    onCurrencySelect(selection) {
        this.sendCreateRequest({ curr_id: selection.id, flags: 0 });
    }

    onItemClick(itemId, e) {
        const id = parseInt(itemId, 10);
        if (!id) {
            return;
        }

        const { listMode } = this.store.getState();
        if (listMode === 'list') {
            const menuBtn = e?.target?.closest('.menu-btn');
            if (menuBtn) {
                this.showContextMenu(id);
            }
        } else if (listMode === 'select') {
            if (e?.target?.closest('.checkbox') && e.pointerType !== '') {
                e.preventDefault();
            }

            this.toggleSelectItem(id);
        }
    }

    onSort(info) {
        const { userCurrencies } = window.app.model;
        const item = userCurrencies.getItem(info.itemId);
        const prevItem = userCurrencies.getItem(info.prevId);
        const nextItem = userCurrencies.getItem(info.nextId);
        if (!prevItem && !nextItem) {
            return;
        }

        let pos = null;
        if (prevItem) {
            pos = (item.pos < prevItem.pos) ? prevItem.pos : (prevItem.pos + 1);
        } else {
            pos = nextItem.pos;
        }

        this.sendChangePosRequest(item.id, pos);
    }

    getListRequest() {
        return {};
    }

    prepareRequest(data) {
        return {
            ...data,
            returnState: {
                userCurrencies: this.getListRequest(),
            },
        };
    }

    getListDataFromResponse(response) {
        return response?.data?.state?.userCurrencies?.data;
    }

    setListData(data, keepState = false) {
        window.app.model.userCurrencies.setData(data);
        this.store.dispatch(actions.listRequestLoaded(keepState));
    }

    /**
     * Sents API request to server to add currency to the list of user
     * @param {Object} data - new user currency entry data
     */
    async sendCreateRequest(data) {
        this.startLoading();

        try {
            const request = this.prepareRequest(data);
            const response = await API.userCurrency.create(request);
            const listData = this.getListDataFromResponse(response);
            this.setListData(listData, true);
        } catch (e) {
            this.cancelPosChange();
        }

        this.stopLoading();
    }

    /**
     * Sent API request to server to change position of currency
     * @param {number} id - identifier of item to change position
     * @param {number} pos - new position of item
     */
    async sendChangePosRequest(id, pos) {
        this.startLoading();

        try {
            const request = this.prepareRequest({ id, pos });
            const response = await API.userCurrency.setPos(request);
            const data = this.getListDataFromResponse(response);
            this.setListData(data, true);
        } catch (e) {
            this.cancelPosChange();
        }

        this.stopLoading();
    }

    /**
     * Cancel local changes on position update fail
     */
    cancelPosChange() {
        this.render(this.store.getState());

        window.app.createErrorNotification(__('ERR_USER_CURRENCY_CHANGE_POS'));
    }

    async deleteItems() {
        const state = this.store.getState();
        if (state.loading) {
            return;
        }

        const ids = this.getContextIds(state);
        if (ids.length === 0) {
            return;
        }

        this.startLoading();

        try {
            const request = this.prepareRequest({ id: ids });
            const response = await API.userCurrency.del(request);
            const data = this.getListDataFromResponse(response);
            this.setListData(data);
        } catch (e) {
            window.app.createErrorNotification(e.message);
        }

        this.stopLoading();
    }

    onDateFormatSelect(format) {
        this.requestDateLocale(format.id);
    }

    async requestDateLocale(locale) {
        const { settings } = window.app.model.profile;
        if (settings.date_locale === locale) {
            return;
        }

        this.startLoading();

        try {
            await API.profile.updateSettings({
                date_locale: locale,
            });
            settings.date_locale = locale;

            this.store.dispatch(actions.changeDateLocale(locale));
        } catch (e) {
            window.app.createErrorNotification(e.message);
        }

        this.stopLoading();
        this.setDateRenderTime();
    }

    onDecimalFormatSelect(format) {
        this.requestDecimalLocale(format.id);
    }

    async requestDecimalLocale(locale) {
        const { settings } = window.app.model.profile;
        if (settings.decimal_locale === locale) {
            return;
        }

        this.startLoading();

        try {
            await API.profile.updateSettings({
                decimal_locale: locale,
            });
            settings.decimal_locale = locale;

            this.store.dispatch(actions.changeDecimalLocale(locale));
        } catch (e) {
            window.app.createErrorNotification(e.message);
        }

        this.stopLoading();
        this.setDateRenderTime();
    }

    renderContextMenu(state) {
        if (!state.showContextMenu && !this.contextMenu) {
            return;
        }

        if (!this.contextMenu) {
            this.contextMenu = CurrencyListContextMenu.create({
                id: 'contextMenu',
                onItemClick: (item) => this.onContextMenuClick(item),
                onClose: () => this.hideContextMenu(),
            });
        }

        this.contextMenu.setState({
            showContextMenu: state.showContextMenu,
            contextItem: state.contextItem,
        });
    }

    renderMenu(state) {
        const itemsCount = state.userCurrencies.length;
        const isListMode = state.listMode === 'list';
        const isSortMode = state.listMode === 'sort';

        this.createBtn.show(isListMode);
        this.listModeBtn.show(!isListMode);
        this.menuButton.show(itemsCount > 0 && !isSortMode);

        if (!state.showMenu && !this.menu) {
            return;
        }

        const showFirstTime = !this.menu;
        if (!this.menu) {
            this.menu = CurrencyListMainMenu.create({
                id: 'listMenu',
                attachTo: this.menuButton.elem,
                onItemClick: (item) => this.onMenuClick(item),
                onClose: () => this.hideMenu(),
            });
        }

        this.menu.setState({
            listMode: state.listMode,
            showMenu: state.showMenu,
            items: state.userCurrencies,
        });

        if (showFirstTime) {
            this.menu.showMenu();
        }
    }

    renderUserCurrenciesSelect(state, prevState) {
        if (
            state.userCurrencies === prevState?.userCurrencies
        ) {
            return;
        }

        const ids = state.userCurrencies.map((item) => item.curr_id.toString());

        this.currencySelect.setState((selectState) => ({
            ...selectState,
            items: selectState.items.map((item) => ({
                ...item,
                hidden: ids.includes(item.id.toString()),
            })),
        }));
    }

    renderUserCurrenciesList(state, prevState) {
        if (
            state.userCurrencies === prevState?.userCurrencies
            && state.listMode === prevState?.listMode
            && state.renderTime === prevState?.renderTime
        ) {
            return;
        }

        this.list.setState((listState) => ({
            ...listState,
            items: state.userCurrencies,
            listMode: state.listMode,
            renderTime: state.renderTime,
        }));
    }

    renderDateFormat(state) {
        this.dateFormatSelect.selectItem(state.dateLocale);
        this.dateFormatContainer.dataset.time = state.dateRenderTime;
    }

    renderDecimalFormat(state) {
        this.decimalFormatSelect.selectItem(state.decimalLocale);
        this.decimalFormatContainer.dataset.time = state.dateRenderTime;
    }

    render(state, prevState = {}) {
        if (!state) {
            throw new Error('Invalid state');
        }

        if (state.loading) {
            this.loadingIndicator.show();
        }

        this.renderUserCurrenciesSelect(state, prevState);
        this.renderUserCurrenciesList(state, prevState);
        this.renderContextMenu(state);
        this.renderMenu(state);
        this.renderDateFormat(state);
        this.renderDecimalFormat(state);

        if (!state.loading) {
            this.loadingIndicator.hide();
        }
    }
}

window.app = new Application(window.appProps);
window.app.createView(SettingsView);
