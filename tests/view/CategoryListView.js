import {
    asArray,
    assert,
    asyncMap,
    query,
    navigation,
    waitForFunction,
    click,
    queryAll,
    evaluate,
    isVisible,
    goTo,
    baseUrl,
    wait,
} from 'jezve-test';
import { Button, PopupMenu } from 'jezvejs-test';
import { AppView } from './AppView.js';
import { DeleteCategoryDialog } from './component/Category/DeleteCategoryDialog.js';
import { App } from '../Application.js';
import { Counter } from './component/Counter.js';
import { CategoryItem } from './component/Category/CategoryItem.js';
import { Transaction } from '../model/Transaction.js';
import { CategoryDetails } from './component/Category/CategoryDetails.js';
import { Category } from '../model/Category.js';
import {
    SORT_BY_CREATEDATE_ASC,
    SORT_BY_CREATEDATE_DESC,
    SORT_BY_NAME_ASC, SORT_BY_NAME_DESC,
    SORT_MANUALLY,
} from '../common.js';
import { CategoryList } from '../model/CategoryList.js';

const listMenuSelector = '#listMenu';

const ANY_TYPE = 0;
const transTypes = [...Transaction.availTypes.map((type) => parseInt(type, 10)), ANY_TYPE];

/** List of categories view class */
export class CategoryListView extends AppView {
    static getExpectedState(model = this.model, state = App.state) {
        const itemsCount = state.categories.length;
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
            createBtn: { visible: isListMode },
            listModeBtn: { visible: !isListMode },
            loadingIndicator: { visible: model.loading },
            totalCounter: { visible: true, value: itemsCount },
            selectedCounter: { visible: model.mode === 'select', value: totalSelected },
            menuBtn: { visible: itemsCount > 0 && !isSortMode },
        };

        const sortMode = state.getCategoriesSortMode();

        const categories = model.items.map((item) => {
            const category = state.categories.getItem(item.id);
            return {
                ...item,
                ...category,
            };
        });

        res.sections = transTypes.map((type) => {
            const typeItems = categories.filter((item) => item.type === type);
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
                name: Category.typeToString(type, model.locale),
            };
            if (visible) {
                section.items = expectedItems.map((item) => ({
                    content: CategoryItem.getExpectedState(item, state),
                }));
            }

            return section;
        });

        if (model.detailsItem) {
            res.itemInfo = CategoryDetails.getExpectedState(model.detailsItem, state);
            res.itemInfo.visible = true;
        }

        if (model.listMenuVisible) {
            res.listMenu = {
                visible: model.listMenuVisible,
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
        }

        if (model.contextMenuVisible) {
            const ctxCategory = state.categories.getItem(model.contextItem);
            assert(ctxCategory, 'Invalid state');

            res.contextMenu = {
                visible: true,
                itemId: model.contextItem,
                ctxDetailsBtn: { visible: true },
                ctxUpdateBtn: { visible: true },
                ctxDeleteBtn: { visible: true },
            };
        }

        return res;
    }

    static getSelectedItems(model = this.model) {
        return model.items.filter((item) => item.selected);
    }

    static getInitialState(options = {}, state = App.state) {
        const {
            detailsItem = null,
        } = options;

        const model = {
            locale: App.view.locale,
            mode: 'list',
            loading: false,
            listMenuVisible: false,
            contextMenuVisible: false,
            detailsItem,
            items: state.categories.clone(),
        };

        return this.getExpectedState(model, state);
    }

    get listMenu() {
        return this.content.listMenu;
    }

    get contextMenu() {
        return this.content.contextMenu;
    }

    async parseContent() {
        const res = {
            createBtn: await Button.create(this, await query('#createBtn')),
            listModeBtn: await Button.create(this, await query('#listModeBtn')),
            menuBtn: { elem: await query('.heading-actions .menu-btn') },
            totalCounter: await Counter.create(this, await query('#itemsCounter')),
            selectedCounter: await Counter.create(this, await query('#selectedCounter')),
        };

        Object.keys(res).forEach((child) => (
            assert(res[child]?.elem, `Invalid structure of view: ${child} component not found`)
        ));

        // Main menu
        res.listMenu = await PopupMenu.create(this, await query(listMenuSelector));

        // Context menu
        res.contextMenu = await PopupMenu.create(this, await query('#contextMenu'));
        if (res.contextMenu?.elem) {
            res.contextMenu.content.itemId = await evaluate((menuEl) => {
                const contextParent = menuEl?.closest('.category-item');
                return (contextParent)
                    ? parseInt(contextParent.dataset.id, 10)
                    : null;
            }, res.contextMenu.elem);
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

    buildModel(cont) {
        const contextMenuVisible = cont.contextMenu?.visible;
        const res = {
            locale: cont.locale,
            loading: cont.loadingIndicator.visible,
            renderTime: cont.renderTime,
            contextItem: cont.contextMenu?.itemId,
            mode: cont.listMode,
            sortMode: App.state.getCategoriesSortMode(),
            listMenuVisible: cont.listMenu?.visible,
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
        return CategoryListView.getExpectedState(model);
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
            await this.performAction(() => this.contextMenu.select('ctxDetailsBtn'));
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

        await navigation(() => this.contextMenu.select('ctxUpdateBtn'));
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

        await this.performAction(async () => {
            await categoryItem.clickMenu();
            return wait('#ctxDeleteBtn', { visible: true });
        });

        return this.checkState(expected);
    }

    async openListMenu() {
        assert(!this.listMenu?.visible, 'List menu already opened');

        this.model.listMenuVisible = true;
        const expected = this.getExpectedState();

        await this.performAction(async () => {
            await click(this.content.menuBtn.elem);
            return wait(listMenuSelector, { visible: true });
        });

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

        if (listMode !== 'list') {
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

        if (listMode === 'list') {
            await this.performAction(() => this.content.listModeBtn.click());
        } else if (listMode === 'select') {
            await this.performAction(() => this.listMenu.select('selectModeBtn'));
        } else if (listMode === 'sort') {
            await this.waitForList(() => this.listMenu.select('sortModeBtn'));
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

        const expected = this.getExpectedState();

        await this.waitForList(() => this.listMenu.select('sortByNameBtn'));

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

        const expected = this.getExpectedState();

        await this.waitForList(() => this.listMenu.select('sortByDateBtn'));

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

            await this.waitForList(() => this.getItemByIndex(index).click());

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

        await this.performAction(() => this.listMenu.select('selectAllBtn'));

        return this.checkState(expected);
    }

    async deselectAll() {
        assert(this.model.mode === 'select', 'Invalid state');

        await this.openListMenu();

        this.model.listMenuVisible = false;
        this.onDeselectAll();
        const expected = this.getExpectedState();

        await this.performAction(() => this.listMenu.select('deselectAllBtn'));

        return this.checkState(expected);
    }

    /** Delete secified category from context menu */
    async deleteFromContextMenu(index, removeChildren = true) {
        await this.openContextMenu(index);

        this.model.contextMenuVisible = false;
        this.model.contextItem = null;
        const expected = this.getExpectedState();

        await this.performAction(() => this.contextMenu.select('ctxDeleteBtn'));

        this.checkState(expected);

        assert(this.content.delete_warning?.content?.visible, 'Delete account warning popup not appear');

        if (removeChildren !== this.content.delete_warning.removeChildren) {
            await this.content.delete_warning.toggleDeleteChilds();
        }

        await this.waitForList(() => this.content.delete_warning.clickOk());
    }

    async deleteCategories(categories, removeChildren = true) {
        await this.selectCategories(categories);

        await this.openListMenu();

        this.model.listMenuVisible = false;
        const expected = this.getExpectedState();

        await this.performAction(() => this.listMenu.select('deleteBtn'));
        this.checkState(expected);

        assert(this.content.delete_warning?.content?.visible, 'Delete categories warning popup not appear');

        if (removeChildren !== this.content.delete_warning.removeChildren) {
            await this.content.delete_warning.toggleDeleteChilds();
        }

        await this.waitForList(() => this.content.delete_warning.clickOk());
    }
}
