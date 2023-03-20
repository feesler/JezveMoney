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
} from 'jezve-test';
import { Button, DropDown } from 'jezvejs-test';
import { AppView } from './AppView.js';
import { App } from '../Application.js';
import { CurrenciesList } from './component/Currency/CurrenciesList.js';

const modeButtons = {
    list: 'listModeBtn',
    select: 'selectModeBtn',
    sort: 'sortModeBtn',
};

const listMenuSelector = '#listMenu';
const listMenuItems = [
    'selectModeBtn',
    'sortModeBtn',
    'selectAllBtn',
    'deselectAllBtn',
    'deleteBtn',
];

const contextMenuItems = [
    'ctxDeleteBtn',
];

/** Settings view class */
export class SettingsView extends AppView {
    async parseContent() {
        const res = {
            localeSelect: await DropDown.createFromChild(this, await query('#localeSelect')),
            createBtn: { elem: await query('#createBtn') },
            listModeBtn: await Button.create(this, await query('#listModeBtn')),
            menuBtn: { elem: await query('.heading-actions .menu-btn') },
            currenciesList: await CurrenciesList.create(this, await query('.currencies-list')),
        };

        Object.keys(res).forEach((child) => (
            assert(res[child]?.elem, `Invalid structure of view: ${child} component not found`)
        ));

        res.addCurrencyDropDown = await DropDown.createFromChild(this, res.createBtn.elem);

        // Main menu
        res.listMenu = { elem: await query(listMenuSelector) };
        if (res.listMenu.elem) {
            await this.parseMenuItems(res, listMenuItems);
        }

        // Context menu
        res.contextMenu = { elem: await query('#contextMenu') };
        res.contextMenu.itemId = await evaluate((menuEl) => {
            const contextParent = menuEl?.closest('.currency-item');
            return (contextParent)
                ? parseInt(contextParent.dataset.id, 10)
                : null;
        }, res.contextMenu.elem);

        if (res.contextMenu.itemId) {
            await this.parseMenuItems(res, contextMenuItems);
        }

        res.loadingIndicator = { elem: await query('#userCurrenciesContainer .loading-indicator') };

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
            loading: cont.loadingIndicator.visible,
            contextItem: cont.contextMenu.itemId,
            listMenuVisible: cont.listMenu.visible,
            contextMenuVisible: cont.contextMenu.visible,
            currenciesList: {
                items: cont.currenciesList.items.map((item) => item.model),
                mode: cont.currenciesList.mode,
                renderTime: cont.currenciesList.renderTime,
            },
        };

        return res;
    }

    getExpectedState(model = this.model) {
        const currenciesCount = model.currenciesList.items.length;
        const selectedCurrencies = this.getSelectedCurrencies(model);
        const selectedCurrenciesCount = selectedCurrencies.length;
        const isListMode = model.currenciesList.mode === 'list';
        const showSelectItems = model.listMenuVisible && model.currenciesList.mode === 'select';
        const showSortItems = model.listMenuVisible && isListMode && currenciesCount > 1;

        const res = {
            createBtn: { visible: isListMode },
            listModeBtn: { visible: !isListMode },
            currenciesList: {
                visible: true,
                mode: model.currenciesList.mode,
                items: model.currenciesList.items.map((item) => {
                    const expectedItem = { ...item };

                    if (!item.id) {
                        return expectedItem;
                    }

                    const userCurrency = App.state.userCurrencies.getItem(item.id);
                    const currency = App.currency.getItem(userCurrency?.curr_id);
                    assert(currency, 'Invalid user currency item');

                    expectedItem.title = currency.formatName(model.locale);

                    return expectedItem;
                }),
            },
        };

        if (model.listMenuVisible) {
            res.selectModeBtn = { visible: model.listMenuVisible && isListMode };
            res.sortModeBtn = { visible: showSortItems };
            res.selectAllBtn = {
                visible: showSelectItems && selectedCurrenciesCount < currenciesCount,
            };
            res.deselectAllBtn = {
                visible: showSelectItems && selectedCurrenciesCount > 0,
            };
            res.deleteBtn = { visible: showSelectItems && selectedCurrenciesCount > 0 };
        }

        res.contextMenu = {
            visible: model.contextMenuVisible,
        };

        if (model.contextMenuVisible) {
            const ctxCurrency = App.state.userCurrencies.getItem(model.contextItem);
            assert(ctxCurrency, 'Invalid state');

            res.contextMenu.itemId = model.contextItem;

            res.ctxDeleteBtn = { visible: true };
        }

        return res;
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

    async changeLocale(value) {
        await navigation(() => this.content.localeSelect.setSelection(value));
    }

    async openCurrencyContextMenu(index) {
        assert.arrayIndex(this.model.currenciesList.items, index, 'Invalid currency index');

        await this.setCurrenciesListMode();

        const item = this.model.currenciesList.items[index];
        this.model.contextMenuVisible = true;
        this.model.contextItem = item.id;
        const expected = this.getExpectedState();

        await this.performAction(async () => {
            const currencyItem = this.content.currenciesList.items[index];
            await currencyItem.clickMenu();
            return wait('#ctxDeleteBtn', { visible: true });
        });

        return this.checkState(expected);
    }

    async openCurrenciesListMenu() {
        assert(!this.content.listMenu.visible, 'List menu already opened');

        this.model.listMenuVisible = true;
        const expected = this.getExpectedState();

        await this.performAction(async () => {
            await click(this.content.menuBtn.elem);
            return wait(listMenuSelector, { visible: true });
        });

        return this.checkState(expected);
    }

    async changeCurrenciesListMode(mode) {
        if (this.model.currenciesList.mode === mode) {
            return true;
        }

        assert(
            this.model.currenciesList.mode === 'list' || mode === 'list',
            `Can't change list mode from ${this.model.currenciesList.mode} to ${mode}.`,
        );

        if (mode !== 'list') {
            await this.openCurrenciesListMenu();
        }

        this.model.listMenuVisible = false;
        this.model.currenciesList.mode = mode;
        this.onDeselectAllCurrencies();

        const expected = this.getExpectedState();

        const buttonName = modeButtons[mode];
        const button = this.content[buttonName];
        assert(button, `Button ${buttonName} not found`);

        await this.performAction(() => this.content[buttonName].click());

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
        await this.setCurrenciesSelectMode();
        await this.openCurrenciesListMenu();

        this.model.listMenuVisible = false;
        this.onSelectAllCurrencies();
        const expected = this.getExpectedState();

        await this.performAction(() => this.content.selectAllBtn.click());

        return this.checkState(expected);
    }

    async deselectAllCurrencies() {
        assert(this.model.currenciesList.mode === 'select', 'Invalid state');

        await this.openCurrenciesListMenu();

        this.model.listMenuVisible = false;
        this.onDeselectAllCurrencies();
        const expected = this.getExpectedState();

        await this.performAction(() => this.content.deselectAllBtn.click());

        return this.checkState(expected);
    }

    /** Delete secified currency from context menu */
    async deleteCurrencyFromContextMenu(index) {
        await this.openCurrencyContextMenu(index);

        this.model.contextMenuVisible = false;
        this.model.contextItem = null;
        this.onDeleteCurrencyByIndex(index);
        const expected = this.getExpectedState();

        await this.waitForList(() => this.content.ctxDeleteBtn.click());

        return this.checkState(expected);
    }

    async deleteCurrencies(currencies) {
        await this.selectCurrencies(currencies);

        await this.openCurrenciesListMenu();

        this.model.listMenuVisible = false;
        this.onDeleteSelectedCurrencies();
        const expected = this.getExpectedState();

        await this.waitForList(() => this.content.deleteBtn.click());

        return this.checkState(expected);
    }
}
