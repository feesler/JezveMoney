import 'jezvejs/style';
import { Button } from 'jezvejs/Button';
import { DropDown } from 'jezvejs/DropDown';
import { MenuButton } from 'jezvejs/MenuButton';
import { SortableListContainer } from 'jezvejs/SortableListContainer';
import { createStore } from 'jezvejs/Store';
import { TabList } from 'jezvejs/TabList';

// Application
import { __, getApplicationURL } from '../../utils/utils.js';
import { App } from '../../Application/App.js';
import { AppView } from '../../Components/Layout/AppView/AppView.js';

// Models
import { CurrencyList } from '../../Models/CurrencyList.js';
import { UserCurrencyList } from '../../Models/UserCurrencyList.js';

// Common components
import { LocaleSelectField } from '../../Components/Form/Fields/LocaleSelectField/LocaleSelectField.js';
import { ThemeSwitchField } from '../../Components/Form/Fields/ThemeSwitchField/ThemeSwitchField.js';
import { DateFormatSelect } from '../../Components/Form/Inputs/Date/DateFormatSelect/DateFormatSelect.js';
import { LoadingIndicator } from '../../Components/Common/LoadingIndicator/LoadingIndicator.js';
import { NoDataMessage } from '../../Components/Common/NoDataMessage/NoDataMessage.js';
import { NumberFormatSelect } from '../../Components/Form/Inputs/NumberFormatSelect/NumberFormatSelect.js';
import { Section } from '../../Components/Layout/Section/Section.js';

// Local components
import { CurrencyItem } from './components/CurrencyItem/CurrencyItem.js';
import { CurrencyListContextMenu } from './components/ContextMenu/CurrencyListContextMenu.js';
import { CurrencyListMainMenu } from './components/MainMenu/CurrencyListMainMenu.js';

import { actions, createItemsFromModel, reducer } from './reducer.js';
import {
    requestDateLocale,
    requestDecimalLocale,
    sendChangePosRequest,
    sendCreateRequest,
} from './actions.js';
import '../../Application/Application.scss';
import './SettingsView.scss';

/* CSS classes */
const SELECT_MODE_CLASS = 'list_select';

/**
 * Settings view
 */
class SettingsView extends AppView {
    constructor(...args) {
        super(...args);

        App.loadModel(CurrencyList, 'currency', App.props.currency);
        App.loadModel(UserCurrencyList, 'userCurrencies', App.props.userCurrencies);

        const { settings } = App.model.profile;

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
            'tabsContainer',
        ]);

        this.createMainTab();
        this.createUserCurrrenciesTab();
        this.createRegionalTab();

        // Tabs
        this.tabs = TabList.create({
            useURLParam: false,
            onChange: (item) => this.onChangeTab(item),
            items: [{
                id: 'index',
                value: 'index',
                title: __('settings.main'),
                content: this.mainSection.elem,
                url: getApplicationURL('settings/'),
            }, {
                id: 'currencies',
                value: 'currencies',
                title: __('settings.currencies.title'),
                content: this.userCurrenciesSection.elem,
                url: getApplicationURL('settings/currencies/'),
            }, {
                id: 'regional',
                value: 'regional',
                title: __('settings.regional'),
                content: [
                    this.dateFormatSection.elem,
                    this.numberFormatSection.elem,
                ],
                url: getApplicationURL('settings/regional/'),
            }],
        });
        this.tabsContainer.append(this.tabs.elem);

        this.subscribeToStore(this.store);
    }

    createMainTab() {
        // Locale select field
        this.localeField = LocaleSelectField.create({
            id: 'localeField',
            className: 'form-row',
        });

        // Theme switch field
        this.themeField = ThemeSwitchField.create({
            id: 'themeField',
            className: 'form-row',
        });

        this.mainSection = Section.create({
            id: 'mainSection',
            title: __('settings.main'),
            content: [
                this.localeField.elem,
                this.themeField.elem,
            ],
        });
    }

    createUserCurrrenciesTab() {
        // 'Create' button
        this.createBtn = Button.create({
            id: 'createBtn',
            className: 'circle-btn',
            icon: 'plus',
        });

        // 'Done' button
        this.listModeBtn = Button.create({
            id: 'listModeBtn',
            className: 'action-button',
            title: __('actions.done'),
            onClick: () => this.setListMode('list'),
        });

        // Main menu toggle button
        this.menuButton = MenuButton.create({
            className: 'circle-btn',
            onClick: (e) => this.showMenu(e),
        });

        // User currencies list
        this.list = SortableListContainer.create({
            ItemComponent: CurrencyItem,
            getItemProps: (item, { listMode }) => ({
                item,
                selected: item.selected,
                listMode,
                showControls: (listMode === 'list'),
            }),
            className: 'currencies-list',
            itemSelector: '.currency-item',
            itemSortSelector: '.currency-item.list-item_sort',
            selectModeClass: SELECT_MODE_CLASS,
            sortModeClass: 'list_sort',
            placeholderClass: 'currency-item_placeholder',
            listMode: 'list',
            PlaceholderComponent: NoDataMessage,
            animated: true,
            getPlaceholderProps: () => ({ title: __('settings.currencies.noData') }),
            onItemClick: (id, e) => this.onItemClick(id, e),
            onSort: (info) => this.onSort(info),
        });

        // Loading indicator
        this.loadingIndicator = LoadingIndicator.create({ fixed: false });

        this.userCurrenciesSection = Section.create({
            id: 'userCurrencies',
            title: __('settings.currencies.title'),
            actions: [
                this.createBtn.elem,
                this.listModeBtn.elem,
                this.menuButton.elem,
            ],
            content: [
                this.list.elem,
                this.loadingIndicator.elem,
            ],
        });

        // Currency select
        this.currencySelect = DropDown.create({
            elem: this.createBtn.elem,
            listAttach: true,
            enableFilter: true,
            onItemSelect: (sel) => this.onCurrencySelect(sel),
        });

        App.initCurrencyList(this.currencySelect);
    }

    createRegionalTab() {
        // Date format
        this.dateFormatSelect = DateFormatSelect.create({
            onItemSelect: (sel) => this.onDateFormatSelect(sel),
        });

        this.dateFormatSection = Section.create({
            id: 'dateFormat',
            title: __('settings.dateFormat'),
            content: this.dateFormatSelect.elem,
        });

        // Numbers format
        this.decimalFormatSelect = NumberFormatSelect.create({
            onItemSelect: (sel) => this.onDecimalFormatSelect(sel),
        });

        this.numberFormatSection = Section.create({
            id: 'numberFormat',
            title: __('settings.numberFormat'),
            content: this.decimalFormatSelect.elem,
        });
    }

    onChangeTab(item) {
        this.store.dispatch(actions.changeTab(item?.id));
    }

    showMenu() {
        this.store.dispatch(actions.showMenu());
    }

    hideMenu() {
        this.store.dispatch(actions.hideMenu());
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

    startLoading() {
        this.store.dispatch(actions.startLoading());
    }

    stopLoading() {
        this.store.dispatch(actions.stopLoading());
    }

    setRenderTime() {
        this.store.dispatch(actions.setRenderTime());
    }

    setDateRenderTime() {
        this.store.dispatch(actions.setDateRenderTime());
    }

    setListMode(listMode) {
        this.store.dispatch(actions.changeListMode(listMode));
        this.setRenderTime();
    }

    onCurrencySelect(selection) {
        this.store.dispatch(sendCreateRequest({ curr_id: selection.id, flags: 0 }));
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
        const { userCurrencies } = App.model;
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

        this.store.dispatch(sendChangePosRequest(item.id, pos));
    }

    onDateFormatSelect(format) {
        this.store.dispatch(requestDateLocale(format.id));
    }

    onDecimalFormatSelect(format) {
        this.store.dispatch(requestDecimalLocale(format.id));
    }

    renderContextMenu(state) {
        if (!state.showContextMenu && !this.contextMenu) {
            return;
        }

        if (!this.contextMenu) {
            this.contextMenu = CurrencyListContextMenu.create({
                id: 'contextMenu',
                dispatch: (action) => this.store.dispatch(action),
                onClose: () => this.hideContextMenu(),
            });
        }

        this.contextMenu.setContext({
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
                dispatch: (action) => this.store.dispatch(action),
                onClose: () => this.hideMenu(),
            });
        }

        this.menu.setContext({
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
        this.dateFormatSection.contentContainer.dataset.time = state.dateRenderTime;
    }

    renderDecimalFormat(state) {
        this.decimalFormatSelect.selectItem(state.decimalLocale);
        this.numberFormatSection.contentContainer.dataset.time = state.dateRenderTime;
    }

    renderTabList(state, prevState) {
        if (state.action === prevState.action) {
            return;
        }

        this.tabs.setState((tabState) => ({
            ...tabState,
            selectedId: state.action,
        }));
    }

    getViewTitle() {
        return `${__('appName')} | ${__('settings.title')}`;
    }

    replaceHistory(state) {
        const { baseURL } = App;
        const action = (state.action?.toLowerCase() ?? null);
        const urlAction = (action && action !== 'index') ? `${action}/` : '';
        const url = `${baseURL}settings/${urlAction}`;

        const title = this.getViewTitle(state);
        window.history.replaceState({}, title, url);
    }

    render(state, prevState = {}) {
        if (!state) {
            throw new Error('Invalid state');
        }

        this.replaceHistory(state);

        if (state.loading) {
            this.loadingIndicator.show();
        }

        this.renderTabList(state, prevState);
        this.renderUserCurrenciesSelect(state, prevState);
        this.renderUserCurrenciesList(state, prevState);
        this.renderContextMenu(state, prevState);
        this.renderMenu(state, prevState);
        this.renderDateFormat(state, prevState);
        this.renderDecimalFormat(state, prevState);

        if (!state.loading) {
            this.loadingIndicator.hide();
        }
    }
}

App.createView(SettingsView);
