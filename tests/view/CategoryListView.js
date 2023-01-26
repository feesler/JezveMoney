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
    evaluate,
    isVisible,
    goTo,
    baseUrl,
} from 'jezve-test';
import { IconButton } from 'jezvejs-test';
import { AppView } from './AppView.js';
import { DeleteCategoryDialog } from './component/DeleteCategoryDialog.js';
import { App } from '../Application.js';
import { Counter } from './component/Counter.js';
import { CategoryItem } from './component/CategoryItem.js';
import { availTransTypes } from '../model/Transaction.js';
import { CategoryDetails } from './component/Category/CategoryDetails.js';
import { Category } from '../model/Category.js';
import {
    SORT_BY_CREATEDATE_ASC,
    SORT_BY_CREATEDATE_DESC,
    SORT_BY_NAME_ASC, SORT_BY_NAME_DESC,
    SORT_MANUALLY,
} from '../common.js';
import { CategoryList } from '../model/CategoryList.js';

const modeButtons = {
    list: 'listModeBtn',
    select: 'selectModeBtn',
    sort: 'sortModeBtn',
};

const listMenuItems = [
    'selectModeBtn',
    'sortModeBtn',
    'sortByNameBtn',
    'sortByDateBtn',
    'selectAllBtn',
    'deselectAllBtn',
    'deleteBtn',
];

const contextMenuItems = [
    'ctxDetailsBtn',
    'ctxUpdateBtn',
    'ctxDeleteBtn',
];

const ANY_TYPE = 0;
const transTypes = [...availTransTypes.map((type) => parseInt(type, 10)), ANY_TYPE];

/** List of categories view class */
export class CategoryListView extends AppView {
    static render(state) {
        const sortMode = state.getCategoriesSortMode();

        return {
            sections: transTypes.map((type) => {
                const typeItems = state.categories.filter((item) => item.type === type);
                const items = CategoryList.create(typeItems);
                items.sortBy(sortMode);

                const mainCategories = items.findByParent(0);
                const expectedItems = mainCategories.flatMap((item) => {
                    const children = items.findByParent(item.id);
                    return [item, ...children];
                });

                const visible = expectedItems.length > 0;
                const section = {
                    visible,
                    name: Category.typeToString(type, App.view.locale),
                };
                if (visible) {
                    section.items = expectedItems.map((item) => ({
                        content: CategoryItem.render(item),
                    }));
                }

                return section;
            }),
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
        const sectionElems = await queryAll('#contentContainer .list-section');

        res.sections = await asyncMap(sectionElems, async (elem) => {
            const listHeader = await query(elem, '.list-header');
            const listContainer = await query(elem, '.categories-list');

            const [
                type,
                name,
                renderTime,
                isSelectMode,
                isSortMode,
            ] = await evaluate((el, hrdEl, listEl) => ([
                parseInt(el.dataset.type, 10),
                hrdEl.textContent,
                parseInt(listEl.dataset.time, 10),
                listEl.classList.contains('categories-list_select'),
                listEl.classList.contains('categories-list_sort'),
            ]), elem, listHeader, listContainer);

            const listItems = await queryAll(listContainer, '.category-item');

            let listMode = 'list';
            if (isSelectMode) {
                listMode = 'select';
            } else if (isSortMode) {
                listMode = 'sort';
            }

            return {
                elem,
                type,
                visible: await isVisible(elem),
                name,
                listMode,
                renderTime,
                items: await asyncMap(listItems, (item) => CategoryItem.create(this, item)),
            };
        });

        res.renderTime = res.sections[0].renderTime;
        res.listMode = res.sections[0].listMode;

        res.itemInfo = await CategoryDetails.create(this, await query('#itemInfo .list-item-details'));

        res.loadingIndicator = { elem: await query('#contentContainer .loading-indicator') };
        res.delete_warning = await DeleteCategoryDialog.create(
            this,
            await query('#delete_warning'),
        );

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

    buildModel(cont) {
        const contextMenuVisible = cont.contextMenu.visible;
        const res = {
            locale: cont.locale,
            loading: cont.loadingIndicator.visible,
            renderTime: cont.renderTime,
            contextItem: cont.contextMenu.itemId,
            mode: cont.listMode,
            sortMode: App.state.getCategoriesSortMode(),
            listMenuVisible: cont.listMenu.visible,
            contextMenuVisible,
            items: [],
            detailsItem: this.getDetailsItem(this.getDetailsId()),
        };

        cont.sections.forEach((section) => {
            const items = section.items.map((item) => {
                const category = App.state.categories.getItem(item.model.id);
                return {
                    ...item.model,
                    ...category,
                };
            });
            res.items.push(...items);
        });

        return res;
    }

    getDetailsId() {
        const viewPath = '/categories/';
        const { pathname } = new URL(this.location);
        assert(pathname.startsWith(viewPath), `Invalid location path: ${pathname}`);

        if (pathname.length === viewPath.length) {
            return 0;
        }

        const param = pathname.substring(viewPath.length);
        return parseInt(param, 10) ?? 0;
    }

    getDetailsItem(itemId) {
        return App.state.categories.getItem(itemId);
    }

    getExpectedURL(model = this.model) {
        let res = `${baseUrl()}categories/`;

        if (model.detailsItem) {
            res += model.detailsItem.id.toString();
        }

        return res;
    }

    getExpectedState(model = this.model) {
        const itemsCount = model.items.length;
        const selectedItems = this.getSelectedItems(model);
        const totalSelected = selectedItems.length;
        const isListMode = model.mode === 'list';
        const isSortMode = model.mode === 'sort';
        const showSortItems = model.listMenuVisible && isListMode && itemsCount > 1;

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
            listMenuContainer: { visible: itemsCount > 0 && !isSortMode },
            listMenu: { visible: model.listMenuVisible },
            selectModeBtn: { visible: model.listMenuVisible && isListMode },
            sortModeBtn: { visible: showSortItems },
            sortByNameBtn: { visible: showSortItems },
            sortByDateBtn: { visible: showSortItems },
            selectAllBtn: {
                visible: showSelectItems && totalSelected < itemsCount,
            },
            deselectAllBtn: {
                visible: showSelectItems && totalSelected > 0,
            },
            deleteBtn: { visible: showSelectItems && totalSelected > 0 },
        };

        const categories = model.items.map((item) => {
            const category = App.state.categories.getItem(item.id);
            return {
                ...item,
                ...category,
            };
        });

        res.sections = transTypes.map((type) => {
            const items = categories.filter((item) => item.type === type);
            const visible = items.length > 0;
            const section = {
                visible,
                name: Category.typeToString(type, model.locale),
            };
            if (visible) {
                section.items = items.map((item) => ({
                    content: CategoryItem.render(item),
                }));
            }

            return section;
        });

        if (model.detailsItem) {
            res.itemInfo = CategoryDetails.render(model.detailsItem, App.state);
            res.itemInfo.visible = true;
        }

        if (model.contextMenuVisible) {
            const ctxCategory = App.state.categories.getItem(model.contextItem);
            assert(ctxCategory, 'Invalid state');

            res.contextMenu = {
                visible: true,
                itemId: model.contextItem,
            };

            res.ctxDetailsBtn = { visible: true };
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

    /** Clicks by 'Show details' context menu item of specified category */
    async showDetails(num, directNavigate = false) {
        if (!directNavigate) {
            await this.openContextMenu(num);
        }

        this.model.contextMenuVisible = false;
        this.model.contextItem = null;
        this.model.detailsItem = this.model.items[num];
        assert(this.model.detailsItem, 'Item not found');
        const expected = this.getExpectedState();

        if (directNavigate) {
            await goTo(this.getExpectedURL());
        } else {
            await this.performAction(() => this.content.ctxDetailsBtn.click());
        }

        await waitForFunction(async () => {
            await this.parse();
            return (!this.content.itemInfo.loading);
        });

        return App.view.checkState(expected);
    }

    /** Closes item details */
    async closeDetails(directNavigate = false) {
        assert(this.model.detailsItem, 'Details already closed');

        this.model.detailsItem = null;
        const expected = this.getExpectedState();

        if (directNavigate) {
            await goTo(this.getExpectedURL());
        } else {
            await this.performAction(() => this.content.itemInfo.close());
        }

        return App.view.checkState(expected);
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

    getItemByIndex(index) {
        const { sections } = this.content;
        let remain = index;
        for (let i = 0; i < sections.length; i += 1) {
            const section = sections[i];
            if (remain < section.items.length) {
                return section.items[remain];
            }

            remain -= section.items.length;
        }

        return null;
    }

    async openContextMenu(index) {
        assert.arrayIndex(this.model.items, index, 'Invalid category index');

        await this.setListMode();

        const item = this.model.items[index];
        this.model.contextMenuVisible = true;
        this.model.contextItem = item.id;
        const expected = this.getExpectedState();

        const categoryItem = this.getItemByIndex(index);
        assert(categoryItem, `Failed to obtain item [${index}]`);

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

    async changeListMode(listMode) {
        if (this.model.mode === listMode) {
            return true;
        }

        assert(
            this.model.mode === 'list' || listMode === 'list',
            `Can't change list mode from ${this.model.mode} to ${listMode}.`,
        );

        if (listMode === 'list') {
            await this.openListMenu();
        }

        this.model.listMenuVisible = false;
        this.model.mode = listMode;
        this.onDeselectAll();
        if (listMode === 'sort') {
            this.model.sortMode = SORT_MANUALLY;
            App.state.updateSettings({
                sort_categories: this.model.sortMode,
            });

            this.model.items = App.state.getSortedCategories();
        }

        const expected = this.getExpectedState();

        const buttonName = modeButtons[listMode];
        const button = this.content[buttonName];
        assert(button, `Button ${buttonName} not found`);

        if (listMode === 'sort') {
            await this.waitForList(() => button.click());
        } else {
            await this.performAction(() => button.click());
        }

        return this.checkState(expected);
    }

    async setListMode() {
        return this.changeListMode('list');
    }

    async setSelectMode() {
        return this.changeListMode('select');
    }

    async setSortMode() {
        return this.changeListMode('sort');
    }

    async toggleSortByName() {
        await this.setListMode();
        await this.openListMenu();

        this.model.listMenuVisible = false;
        this.model.sortMode = (this.model.sortMode === SORT_BY_NAME_ASC)
            ? SORT_BY_NAME_DESC
            : SORT_BY_NAME_ASC;

        App.state.updateSettings({
            sort_categories: this.model.sortMode,
        });

        const expList = CategoryListView.render(App.state);
        const expected = this.getExpectedState();
        Object.assign(expected, expList);

        const button = this.content.sortByNameBtn;
        assert(button, 'Sort by name button not found');

        await this.performAction(() => button.click());

        return this.checkState(expected);
    }

    async toggleSortByDate() {
        await this.setListMode();
        await this.openListMenu();

        this.model.listMenuVisible = false;
        this.model.sortMode = (this.model.sortMode === SORT_BY_CREATEDATE_ASC)
            ? SORT_BY_CREATEDATE_DESC
            : SORT_BY_CREATEDATE_ASC;

        App.state.updateSettings({
            sort_categories: this.model.sortMode,
        });

        const expList = CategoryListView.render(App.state);
        const expected = this.getExpectedState();
        Object.assign(expected, expList);

        const button = this.content.sortByDateBtn;
        assert(button, 'Sort by date button not found');

        await this.performAction(() => button.click());

        return this.checkState(expected);
    }

    async selectCategories(data) {
        assert.isDefined(data, 'No categories specified');

        await this.setSelectMode();

        const indexes = asArray(data);
        for (const index of indexes) {
            const categoryItem = this.getItemByIndex(index);
            assert(categoryItem, `Failed to obtain item [${index}]`);

            const item = this.model.items.find((category) => (
                category.id === categoryItem.model.id
            ));
            assert(item, `Category '${categoryItem.model.id}' not found`);

            item.selected = !item.selected;

            const expected = this.getExpectedState();

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

    async deleteCategories(categories, removeChildren = true) {
        await this.selectCategories(categories);

        await this.openListMenu();

        this.model.listMenuVisible = false;
        const expected = this.getExpectedState();

        await this.performAction(() => this.content.deleteBtn.click());
        this.checkState(expected);

        assert(this.content.delete_warning?.content?.visible, 'Delete categories warning popup not appear');

        if (removeChildren !== this.content.delete_warning.removeChildren) {
            await this.content.delete_warning.toggleDeleteChilds();
        }

        await this.waitForList(() => this.content.delete_warning.clickOk());
    }
}
