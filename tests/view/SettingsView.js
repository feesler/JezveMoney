import {
    assert,
    query,
    click,
    asyncMap,
    evaluate,
    waitForFunction,
    wait,
    asArray,
    navigation,
    goTo,
    baseUrl,
} from 'jezve-test';
import {
    Button,
    DropDown,
    TabList,
    PopupMenu,
} from 'jezvejs-test';
import { AppView } from './AppView.js';
import { App } from '../Application.js';
import { CurrenciesList } from './component/Currency/CurrenciesList.js';

const MAIN_TAB_ID = 'index';
const CURRENCIES_TAB_ID = 'currencies';
const REGIONAL_TAB_ID = 'regional';
const listMenuSelector = '#listMenu';

/** Settings view class */
export class SettingsView extends AppView {
    get tabs() {
        return this.content.tabs;
    }

    get currenciesList() {
        return this.content.currenciesList;
    }

    get listMenu() {
        return this.content.listMenu;
    }

    get contextMenu() {
        return this.content.contextMenu;
    }

    async parseContent() {
        const res = {
            tabs: await TabList.create(this, await query('.tab-list')),
            localeSelect: await DropDown.create(this, await query('#localeField .dd__container')),
            createBtn: { elem: await query('#createBtn') },
            listModeBtn: await Button.create(this, await query('#listModeBtn')),
            menuBtn: { elem: await query('#userCurrencies .heading-actions .menu-btn') },
            currenciesList: await CurrenciesList.create(this, await query('#userCurrencies .currencies-list')),
        };

        Object.keys(res).forEach((child) => (
            assert(res[child]?.elem, `Invalid structure of view: ${child} component not found`)
        ));

        res.addCurrencyDropDown = await DropDown.createFromChild(this, res.createBtn.elem);

        // Main menu
        res.listMenu = await PopupMenu.create(this, await query(listMenuSelector));

        // Context menu
        res.contextMenu = await PopupMenu.create(this, await query('#contextMenu'));
        if (res.contextMenu?.elem) {
            res.contextMenu.content.itemId = await evaluate((menuEl) => {
                const contextParent = menuEl?.closest('.currency-item');
                return (contextParent)
                    ? parseInt(contextParent.dataset.id, 10)
                    : null;
            }, res.contextMenu.elem);
        }

        // Date format
        [
            res.dateRenderTime,
            res.decimalRenderTime,
        ] = await evaluate(() => {
            const dateEl = document.querySelector('#dateFormat .settings-block__content');
            const decimalEl = document.querySelector('#numberFormat .settings-block__content');
            return [
                dateEl?.dataset?.time,
                decimalEl?.dataset?.time,
            ];
        });

        const dateLocaleDropDownEl = await query('#dateFormat .dd__container');
        res.dateLocaleDropDown = await DropDown.create(this, dateLocaleDropDownEl);

        const decimalLocaleDropDownEl = await query('#numberFormat .dd__container');
        res.decimalLocaleDropDown = await DropDown.create(this, decimalLocaleDropDownEl);

        res.loadingIndicator = { elem: await query('#userCurrencies .loading-indicator') };

        return res;
    }

    async parseMenuItems(cont, ids) {
        const itemIds = asArray(ids);
        if (!itemIds.length) {
            return cont;
        }

        const res = cont;
        await asyncMap(itemIds, async (id) => {
            res[id] = await Button.create(this, await query(`#${id}`));
            assert(res[id], `Menu item '${id}' not found`);
            return res[id];
        });

        return res;
    }

    buildModel(cont) {
        const res = {
            locale: cont.locale,
            selectedTab: cont.tabs.selectedId,
            loading: cont.loadingIndicator.visible,
            contextItem: cont.contextMenu?.content?.itemId,
            listMenuVisible: cont.listMenu?.visible,
            contextMenuVisible: cont.contextMenu?.visible,
            currenciesList: {
                items: cont.currenciesList.items.map((item) => item.model),
                mode: cont.currenciesList.mode,
                renderTime: cont.currenciesList.renderTime,
            },
            dateLocale: cont.dateLocaleDropDown.value,
            dateRenderTime: cont.dateRenderTime,
            decimalLocale: cont.decimalLocaleDropDown.value,
            decimalRenderTime: cont.decimalRenderTime,
        };

        return res;
    }

    getExpectedState(model = this.model, state = App.state) {
        const isMainTab = model.selectedTab === MAIN_TAB_ID;
        const isCurrenciesTab = model.selectedTab === CURRENCIES_TAB_ID;
        const isRegionalTab = model.selectedTab === REGIONAL_TAB_ID;

        const currenciesCount = model.currenciesList.items.length;
        const selectedCurrencies = this.getSelectedCurrencies(model);
        const selectedCurrenciesCount = selectedCurrencies.length;
        const isListMode = model.currenciesList.mode === 'list';
        const showSelectItems = (
            isCurrenciesTab && model.listMenuVisible && model.currenciesList.mode === 'select'
        );
        const showSortItems = (
            isCurrenciesTab && model.listMenuVisible && isListMode && currenciesCount > 1
        );

        const res = {
            header: this.getHeaderExpectedState(state),
            localeSelect: {
                visible: isMainTab,
                value: model.locale,
            },
            createBtn: { visible: isCurrenciesTab && isListMode },
            listModeBtn: { visible: isCurrenciesTab && !isListMode },
            currenciesList: CurrenciesList.getExpectedState(model.currenciesList),
            dateLocaleDropDown: {
                visible: isRegionalTab,
                value: model.dateLocale,
            },
            decimalLocaleDropDown: {
                visible: isRegionalTab,
                value: model.decimalLocale,
            },
        };

        res.currenciesList.visible = isCurrenciesTab;

        if (model.listMenuVisible) {
            res.listMenu = {
                visible: true,
                selectModeBtn: {
                    visible: isCurrenciesTab && model.listMenuVisible && isListMode,
                },
                sortModeBtn: { visible: isCurrenciesTab && showSortItems },
                selectAllBtn: {
                    visible: showSelectItems && selectedCurrenciesCount < currenciesCount,
                },
                deselectAllBtn: {
                    visible: showSelectItems && selectedCurrenciesCount > 0,
                },
                deleteBtn: { visible: showSelectItems && selectedCurrenciesCount > 0 },
            };
        }

        if (model.contextMenuVisible) {
            const ctxCurrency = App.state.userCurrencies.getItem(model.contextItem);
            assert(ctxCurrency, 'Invalid state');

            res.contextMenu = {
                visible: model.contextMenuVisible,
                itemId: model.contextItem,
                ctxDeleteBtn: { visible: isCurrenciesTab },
            };
        }

        return res;
    }

    getExpectedURL(model = this.model) {
        const selectedTab = model.selectedTab.toLowerCase();
        const path = (selectedTab === MAIN_TAB_ID) ? '' : `${selectedTab}/`;
        const res = new URL(`${baseUrl()}settings/${path}`);

        return res.toString();
    }

    getSelectedCurrencies(model = this.model) {
        return model.currenciesList.items.filter((item) => item.selected);
    }

    onSelectAllCurrencies() {
        const { items } = this.model.currenciesList;
        this.model.currenciesList.items = items.map((item) => ({ ...item, selected: true }));
    }

    onDeselectAllCurrencies() {
        const { items } = this.model.currenciesList;
        this.model.currenciesList.items = items.map((item) => ({ ...item, selected: false }));
    }

    onDeleteCurrencyByIndex(index) {
        const { items } = this.model.currenciesList;
        assert.arrayIndex(items, index);

        items.splice(index, 1);
    }

    onDeleteSelectedCurrencies() {
        const { items } = this.model.currenciesList;
        this.model.currenciesList.items = items.filter((item) => !item.selected);
        this.model.currenciesList.mode = 'list';
    }

    async waitForList(action) {
        await this.parse();

        const prevTime = this.model.currenciesList.renderTime;

        await action();

        await waitForFunction(async () => {
            await this.parse();
            return (
                !this.model.loading
                && prevTime !== this.model.currenciesList.renderTime
            );
        });

        await this.parse();
    }

    async waitForDateFormat(action) {
        await this.parse();

        const prevTime = this.model.dateRenderTime;

        await action();

        await waitForFunction(async () => {
            await this.parse();
            return (
                !this.model.loading
                && prevTime !== this.model.dateRenderTime
            );
        });

        await this.parse();
    }

    async waitForDecimalFormat(action) {
        await this.parse();

        const prevTime = this.model.decimalRenderTime;

        await action();

        await waitForFunction(async () => {
            await this.parse();
            return (
                !this.model.loading
                && prevTime !== this.model.decimalRenderTime
            );
        });

        await this.parse();
    }

    async showTabById(tabId, directNavigate = false) {
        if (this.model.selectedTab === tabId) {
            return true;
        }

        this.model.selectedTab = tabId;
        const expected = this.getExpectedState();

        if (directNavigate) {
            await goTo(this.getExpectedURL());
        } else {
            await this.performAction(() => this.tabs.selectTabById(tabId));
        }

        return App.view.checkState(expected);
    }

    async showMainTab(directNavigate = false) {
        return this.showTabById(MAIN_TAB_ID, directNavigate);
    }

    async showUserCurrenciesTab(directNavigate) {
        return this.showTabById(CURRENCIES_TAB_ID, directNavigate);
    }

    async showRegionalTab(directNavigate) {
        return this.showTabById(REGIONAL_TAB_ID, directNavigate);
    }

    async changeLocale(value) {
        await this.showMainTab();

        await navigation(() => this.content.localeSelect.setSelection(value));
    }

    async openCurrencyContextMenu(index) {
        await this.showUserCurrenciesTab();

        assert.arrayIndex(this.model.currenciesList.items, index, 'Invalid currency index');

        await this.setCurrenciesListMode();

        const item = this.model.currenciesList.items[index];
        this.model.contextMenuVisible = true;
        this.model.contextItem = item.id;
        const expected = this.getExpectedState();

        await this.performAction(async () => {
            const currencyItem = this.content.currenciesList.items[index];
            await currencyItem.clickMenu();
            return wait('[data-id="ctxDeleteBtn"]', { visible: true });
        });

        return this.checkState(expected);
    }

    async openCurrenciesListMenu() {
        await this.showUserCurrenciesTab();

        assert(!this.listMenu?.visible, 'List menu already opened');

        this.model.listMenuVisible = true;
        const expected = this.getExpectedState();

        await this.performAction(async () => {
            await click(this.content.menuBtn.elem);
            return wait(listMenuSelector, { visible: true });
        });

        return this.checkState(expected);
    }

    async changeCurrenciesListMode(listMode) {
        await this.showUserCurrenciesTab();

        if (this.model.currenciesList.mode === listMode) {
            return true;
        }

        assert(
            this.model.currenciesList.mode === 'list' || listMode === 'list',
            `Can't change list mode from ${this.model.currenciesList.mode} to ${listMode}.`,
        );

        if (listMode !== 'list') {
            await this.openCurrenciesListMenu();
        }

        this.model.listMenuVisible = false;
        this.model.currenciesList.mode = listMode;
        this.onDeselectAllCurrencies();

        const expected = this.getExpectedState();

        if (listMode === 'list') {
            await this.performAction(() => this.content.listModeBtn.click());
        } else if (listMode === 'select') {
            await this.performAction(() => this.listMenu.select('selectModeBtn'));
        } else if (listMode === 'sort') {
            await this.performAction(() => this.listMenu.select('sortModeBtn'));
        }

        await this.performAction(async () => {
            await wait(async () => {
                const mode = await CurrenciesList.getListMode(this.currenciesList.elem);
                return mode === listMode;
            });
        });

        return this.checkState(expected);
    }

    async setCurrenciesListMode() {
        return this.changeCurrenciesListMode('list');
    }

    async setCurrenciesSelectMode() {
        return this.changeCurrenciesListMode('select');
    }

    async setCurrenciesSortMode() {
        return this.changeCurrenciesListMode('sort');
    }

    async addCurrencyById(id) {
        await this.showUserCurrenciesTab();

        const currencyId = parseInt(id, 10);
        const currency = App.currency.getItem(currencyId);
        assert(currency, `Invalid currency id: ${id}`);

        const newItem = {
            title: currency.formatName(this.locale),
        };
        this.model.currenciesList.items.push(newItem);
        const expected = this.getExpectedState();

        await this.waitForList(() => this.content.addCurrencyDropDown.setSelection(id));

        return this.checkState(expected);
    }

    async selectCurrencies(data) {
        await this.showUserCurrenciesTab();

        assert.isDefined(data, 'No currencies specified');

        await this.setCurrenciesSelectMode();

        const indexes = asArray(data);
        for (const index of indexes) {
            assert.arrayIndex(this.model.currenciesList.items, index, 'Invalid category index');

            const item = this.model.currenciesList.items[index];
            assert(item, `Failed to obtain item [${index}]`);

            item.selected = !item.selected;

            const expected = this.getExpectedState();

            await this.performAction(() => {
                const currencyItem = this.content.currenciesList.items[index];
                return currencyItem.click();
            });

            this.checkState(expected);
        }

        return true;
    }

    async selectAllCurrencies() {
        await this.showUserCurrenciesTab();

        await this.setCurrenciesSelectMode();
        await this.openCurrenciesListMenu();

        this.model.listMenuVisible = false;
        this.onSelectAllCurrencies();
        const expected = this.getExpectedState();

        await this.performAction(() => this.listMenu.select('selectAllBtn'));

        return this.checkState(expected);
    }

    async deselectAllCurrencies() {
        await this.showUserCurrenciesTab();

        assert(this.model.currenciesList.mode === 'select', 'Invalid state');

        await this.openCurrenciesListMenu();

        this.model.listMenuVisible = false;
        this.onDeselectAllCurrencies();
        const expected = this.getExpectedState();

        await this.performAction(() => this.listMenu.select('deselectAllBtn'));

        return this.checkState(expected);
    }

    /** Delete secified currency from context menu */
    async deleteCurrencyFromContextMenu(index) {
        await this.showUserCurrenciesTab();

        await this.openCurrencyContextMenu(index);

        this.model.contextMenuVisible = false;
        this.model.contextItem = null;
        this.onDeleteCurrencyByIndex(index);
        const expected = this.getExpectedState();

        await this.waitForList(() => this.contextMenu.select('ctxDeleteBtn'));

        return this.checkState(expected);
    }

    async deleteCurrencies(currencies) {
        await this.showUserCurrenciesTab();

        await this.selectCurrencies(currencies);

        await this.openCurrenciesListMenu();

        this.model.listMenuVisible = false;
        this.onDeleteSelectedCurrencies();
        const expected = this.getExpectedState();

        await this.waitForList(() => this.listMenu.select('deleteBtn'));

        return this.checkState(expected);
    }

    async selectDateLocale(locale) {
        await this.showRegionalTab();

        this.model.dateLocale = locale;
        const expected = this.getExpectedState();

        await this.waitForDateFormat(() => (
            this.content.dateLocaleDropDown.setSelection(locale)
        ));

        return this.checkState(expected);
    }

    async selectDecimalLocale(locale) {
        await this.showRegionalTab();

        this.model.decimalLocale = locale;
        const expected = this.getExpectedState();

        await this.waitForDateFormat(() => (
            this.content.decimalLocaleDropDown.setSelection(locale)
        ));

        return this.checkState(expected);
    }
}
