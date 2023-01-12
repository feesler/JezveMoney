import {
    asArray,
    assert,
    asyncMap,
    query,
    prop,
    closest,
    navigation,
    waitForFunction,
    click,
    queryAll,
} from 'jezve-test';
import { IconButton } from 'jezvejs-test';
import { AppView } from './AppView.js';
import { WarningPopup } from './component/WarningPopup.js';
import { App } from '../Application.js';
import { Counter } from './component/Counter.js';
import { CategoryItem } from './component/CategoryItem.js';

const listMenuItems = [
    'selectModeBtn',
    'selectAllBtn',
    'deselectAllBtn',
    'deleteBtn',
];

const contextMenuItems = [
    'ctxUpdateBtn', 'ctxDeleteBtn',
];

/** List of categories view class */
export class CategoryListView extends AppView {
    static render(state) {
        return {
            items: state.categories.map((item) => CategoryItem.render(item)),
        };
    }

    async parseContent() {
        const res = {
            createBtn: await IconButton.create(this, await query('#createBtn')),
            listModeBtn: await IconButton.create(this, await query('#listModeBtn')),
            listMenuContainer: {
                elem: await query('.heading-actions .popup-menu'),
                menuBtn: await query('.heading-actions .popup-menu-btn'),
            },
            listMenu: { elem: await query('#listMenu') },
            totalCounter: await Counter.create(this, await query('#itemsCounter')),
            selectedCounter: await Counter.create(this, await query('#selectedCounter')),
        };

        Object.keys(res).forEach((child) => (
            assert(res[child]?.elem, `Invalid structure of view: ${child} component not found`)
        ));

        await this.parseMenuItems(res, listMenuItems);

        // Context menu
        res.contextMenu = { elem: await query('#contextMenu') };
        const contextParent = await closest(res.contextMenu.elem, '.category-item');
        if (contextParent) {
            const itemId = await prop(contextParent, 'dataset.id');
            res.contextMenu.itemId = parseInt(itemId, 10);
            assert(res.contextMenu.itemId, 'Invalid category');

            await this.parseMenuItems(res, contextMenuItems);
        }

        // Categories list
        const listContainer = await query('#contentContainer .categories-list');
        const listItems = await queryAll(listContainer, '.category-item');
        res.items = await asyncMap(listItems, (item) => CategoryItem.create(this, item));
        res.renderTime = await prop(listContainer, 'dataset.time');

        res.loadingIndicator = { elem: await query('#contentContainer .loading-indicator') };
        res.delete_warning = await WarningPopup.create(this, await query('#delete_warning'));

        return res;
    }

    async parseMenuItems(cont, ids) {
        const itemIds = asArray(ids);
        if (!itemIds.length) {
            return cont;
        }

        const res = cont;
        await asyncMap(itemIds, async (id) => {
            res[id] = await IconButton.create(this, await query(`#${id}`));
            assert(res[id], `Menu item '${id}' not found`);
            return res[id];
        });

        return res;
    }

    getViewMode(cont) {
        if (!cont.listMenuContainer.visible) {
            return 'nodata';
        }

        if (!cont.createBtn.content.visible) {
            return 'select';
        }

        return 'list';
    }

    buildModel(cont) {
        const contextMenuVisible = cont.contextMenu.visible;
        const res = {
            locale: cont.locale,
            items: cont.items.map((item) => item.model),
            loading: cont.loadingIndicator.visible,
            renderTime: cont.renderTime,
            contextItem: cont.contextMenu.itemId,
            mode: this.getViewMode(cont),
            listMenuVisible: cont.listMenu.visible,
            contextMenuVisible,
        };

        return res;
    }

    getExpectedState(model = this.model) {
        const itemsCount = model.items.length;
        const selectedItems = this.getSelectedItems(model);
        const totalSelected = selectedItems.length;
        const isListMode = model.mode === 'list';

        const showSelectItems = (
            itemsCount > 0
            && model.listMenuVisible
            && model.mode === 'select'
        );

        const res = {
            header: {
                localeSelect: { value: model.locale },
            },
            createBtn: { visible: isListMode },
            listModeBtn: { visible: !isListMode },
            loadingIndicator: { visible: model.loading },
            totalCounter: { visible: true, value: itemsCount },
            selectedCounter: { visible: model.mode === 'select', value: totalSelected },
            listMenuContainer: { visible: itemsCount > 0 },
            listMenu: { visible: model.listMenuVisible },
            selectModeBtn: { visible: model.listMenuVisible && isListMode },
            selectAllBtn: {
                visible: showSelectItems && totalSelected < itemsCount,
            },
            deselectAllBtn: {
                visible: showSelectItems && totalSelected > 0,
            },
            deleteBtn: { visible: showSelectItems && totalSelected > 0 },
        };

        if (model.contextMenuVisible) {
            const ctxCategory = App.state.categories.getItem(model.contextItem);
            assert(ctxCategory, 'Invalid state');

            res.contextMenu = {
                visible: true,
                itemId: model.contextItem,
            };

            res.ctxUpdateBtn = { visible: true };
            res.ctxDeleteBtn = { visible: true };
        }

        return res;
    }

    getSelectedItems(model = this.model) {
        return model.items.filter((item) => item.selected);
    }

    onDeselectAll() {
        this.model.items = this.model.items.map((item) => ({ ...item, selected: false }));
    }

    /** Click on add button */
    async goToCreateCategory() {
        await navigation(() => this.content.createBtn.click());
    }

    /** Select specified category, click on edit button */
    async goToUpdateCategory(num) {
        await this.openContextMenu(num);

        await navigation(() => this.content.ctxUpdateBtn.click());
    }

    async waitForList(action) {
        await this.parse();

        const prevTime = this.model.renderTime;
        await action();

        await waitForFunction(async () => {
            await this.parse();
            return (
                !this.model.loading
                && prevTime !== this.model.renderTime
            );
        });

        await this.parse();
    }

    async openContextMenu(index) {
        assert.arrayIndex(this.model.items, index, 'Invalid category index');

        await this.cancelSelectMode();

        const item = this.model.items[index];
        this.model.contextMenuVisible = true;
        this.model.contextItem = item.id;
        const expected = this.getExpectedState();

        const categoryItem = this.content.items[index];
        await this.performAction(() => categoryItem.clickMenu());

        return this.checkState(expected);
    }

    async openListMenu() {
        assert(!this.content.listMenu.visible, 'List menu already opened');

        this.model.listMenuVisible = true;
        const expected = this.getExpectedState();

        await this.performAction(() => click(this.content.listMenuContainer.menuBtn));

        return this.checkState(expected);
    }

    async toggleSelectMode() {
        const isListMode = (this.model.mode === 'list');
        if (isListMode) {
            await this.openListMenu();
        }

        this.model.listMenuVisible = false;
        this.model.mode = (isListMode) ? 'select' : 'list';
        this.onDeselectAll();
        const expected = this.getExpectedState();

        const buttonName = (isListMode) ? 'selectModeBtn' : 'listModeBtn';
        await this.performAction(() => this.content[buttonName].click());

        return this.checkState(expected);
    }

    async setSelectMode() {
        if (this.model.mode === 'select') {
            return true;
        }

        return this.toggleSelectMode();
    }

    async cancelSelectMode() {
        if (this.model.mode === 'list') {
            return true;
        }

        return this.toggleSelectMode();
    }

    async selectCategories(data) {
        assert.isDefined(data, 'No categories specified');

        await this.setSelectMode();

        const indexes = asArray(data);
        for (const index of indexes) {
            assert.arrayIndex(this.model.items, index, 'Invalid category index');

            const item = this.model.items[index];
            item.selected = !item.selected;

            const expected = this.getExpectedState();

            const categoryItem = this.content.items[index];
            await this.waitForList(() => categoryItem.click());

            this.checkState(expected);
        }

        return true;
    }

    async selectAll() {
        await this.setSelectMode();
        await this.openListMenu();

        this.model.listMenuVisible = false;
        this.model.items = this.model.items.map((item) => ({ ...item, selected: true }));
        const expected = this.getExpectedState();

        await this.performAction(() => this.content.selectAllBtn.click());

        return this.checkState(expected);
    }

    async deselectAll() {
        assert(this.model.mode === 'select', 'Invalid state');

        await this.openListMenu();

        this.model.listMenuVisible = false;
        this.onDeselectAll();
        const expected = this.getExpectedState();

        await this.performAction(() => this.content.deselectAllBtn.click());

        return this.checkState(expected);
    }

    async deleteCategories(categories) {
        await this.selectCategories(categories);

        await this.openListMenu();

        this.model.listMenuVisible = false;
        const expected = this.getExpectedState();

        await this.performAction(() => this.content.deleteBtn.click());
        this.checkState(expected);

        assert(this.content.delete_warning?.content?.visible, 'Delete categories warning popup not appear');

        await this.waitForList(() => this.content.delete_warning.clickOk());
    }
}
