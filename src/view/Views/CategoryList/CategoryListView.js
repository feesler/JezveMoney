import 'jezvejs/style';
import {
    asArray,
    createElement,
    insertAfter,
    isFunction,
    show,
} from 'jezvejs';
import { IconButton } from 'jezvejs/IconButton';
import { PopupMenu } from 'jezvejs/PopupMenu';
import { Application } from '../../js/Application.js';
import '../../css/app.scss';
import { View } from '../../js/View.js';
import {
    getSortByDateIcon,
    getSortByNameIcon,
    SORT_BY_CREATEDATE_ASC,
    SORT_BY_CREATEDATE_DESC,
    SORT_BY_NAME_ASC,
    SORT_BY_NAME_DESC,
    SORT_MANUALLY,
    __,
} from '../../js/utils.js';
import { API } from '../../js/api/index.js';
import { Category } from '../../js/model/Category.js';
import { CategoryList } from '../../js/model/CategoryList.js';
import { availTransTypes, Transaction } from '../../js/model/Transaction.js';
import { Heading } from '../../Components/Heading/Heading.js';
import { DeleteCategoryDialog } from '../../Components/DeleteCategoryDialog/DeleteCategoryDialog.js';
import { SortableListContainer } from '../../Components/SortableListContainer/SortableListContainer.js';
import { LoadingIndicator } from '../../Components/LoadingIndicator/LoadingIndicator.js';
import { CategoryItem } from '../../Components/CategoryItem/CategoryItem.js';
import { CategoryDetails } from '../../Components/CategoryDetails/CategoryDetails.js';
import { createStore } from '../../js/store.js';
import { actions, createItemsFromModel, reducer } from './reducer.js';
import './style.scss';

/* CSS classes */
const SELECT_MODE_CLASS = 'categories-list_select';
const CHECK_ITEM_CLASS = 'check-icon-item';

const ANY_TYPE = 0;

/**
 * List of persons view
 */
class CategoryListView extends View {
    constructor(...args) {
        super(...args);

        window.app.loadModel(CategoryList, 'categories', window.app.props.categories);

        const { settings } = window.app.model.profile;
        const sortMode = settings.sort_categories;

        const initialState = {
            ...this.props,
            detailsItem: null,
            items: createItemsFromModel(),
            loading: false,
            listMode: 'list',
            sortMode,
            contextItem: null,
            renderTime: Date.now(),
        };

        this.transTypes = [
            ...Object.keys(availTransTypes).map((type) => parseInt(type, 10)),
            ANY_TYPE,
        ];

        this.store = createStore(reducer, { initialState });
    }

    /**
     * View initialization
     */
    onStart() {
        const listProps = {
            ItemComponent: CategoryItem,
            getItemProps: (item, { listMode }) => ({
                item,
                selected: item.selected,
                listMode,
                showControls: (listMode === 'list'),
            }),
            getItemById: (id) => this.getItemById(id),
            className: 'categories-list',
            itemSelector: '.category-item',
            itemSortSelector: '.category-item.category-item_sort',
            selectModeClass: SELECT_MODE_CLASS,
            sortModeClass: 'categories-list_sort',
            placeholderClass: 'category-item_placeholder',
            treeSort: true,
            childContainerSelector: '.category-item__children',
            listMode: 'list',
            noItemsMessage: __('CATEGORIES_NO_DATA'),
            onItemClick: (id, e) => this.onItemClick(id, e),
            onTreeSort: (...args) => this.sendChangePosRequest(...args),
        };

        this.loadElementsByIds([
            'contentHeader',
            'itemsCount',
            'selectedCounter',
            'selItemsCount',
            'heading',
            'createBtn',
            'contentContainer',
            'itemInfo',
        ]);

        this.heading = Heading.fromElement(this.heading, {
            title: __('CATEGORIES'),
        });

        this.sections = {};

        this.transTypes.forEach((type) => {
            const section = {
                header: createElement('header', {
                    props: {
                        className: 'list-header',
                        textContent: Category.getTypeTitle(type),
                    },
                }),
                list: SortableListContainer.create({
                    ...listProps,
                    sortGroup: type,
                }),
            };

            section.container = createElement('section', {
                props: {
                    className: 'list-section',
                    dataset: { type },
                },
                children: [
                    section.header,
                    section.list.elem,
                ],
            });

            const key = Category.getTypeString(type);
            this.sections[key] = section;

            this.contentContainer.append(section.container);
        });

        this.listModeBtn = IconButton.create({
            id: 'listModeBtn',
            className: 'action-button',
            title: __('DONE'),
            onClick: () => this.setListMode('list'),
        });
        insertAfter(this.listModeBtn.elem, this.createBtn);

        this.createMenu();
        insertAfter(this.menu.elem, this.listModeBtn.elem);

        this.createContextMenu();

        this.loadingIndicator = LoadingIndicator.create({
            fixed: false,
        });
        this.contentContainer.append(this.loadingIndicator.elem);

        this.subscribeToStore(this.store);

        if (this.props.detailsId) {
            this.requestItem();
        }
    }

    createMenu() {
        this.menu = PopupMenu.create({
            id: 'listMenu',
            items: [{
                id: 'selectModeBtn',
                icon: 'select',
                title: __('SELECT'),
                onClick: () => this.onMenuClick('selectModeBtn'),
            }, {
                id: 'sortModeBtn',
                icon: 'sort',
                title: __('SORT'),
                onClick: () => this.onMenuClick('sortModeBtn'),
            }, {
                id: 'sortByNameBtn',
                title: __('SORT_BY_NAME'),
                className: CHECK_ITEM_CLASS,
                onClick: () => this.onMenuClick('sortByNameBtn'),
            }, {
                id: 'sortByDateBtn',
                title: __('SORT_BY_DATE'),
                className: CHECK_ITEM_CLASS,
                onClick: () => this.onMenuClick('sortByDateBtn'),
            }, {
                id: 'selectAllBtn',
                title: __('SELECT_ALL'),
                onClick: () => this.onMenuClick('selectAllBtn'),
            }, {
                id: 'deselectAllBtn',
                title: __('DESELECT_ALL'),
                onClick: () => this.onMenuClick('deselectAllBtn'),
            }, {
                id: 'separator2',
                type: 'separator',
            }, {
                id: 'deleteBtn',
                icon: 'del',
                title: __('DELETE'),
                onClick: () => this.onMenuClick('deleteBtn'),
            }],
        });

        this.menuActions = {
            selectModeBtn: () => this.setListMode('select'),
            sortModeBtn: () => this.setListMode('sort'),
            sortByNameBtn: () => this.toggleSortByName(),
            sortByDateBtn: () => this.toggleSortByDate(),
            selectAllBtn: () => this.selectAll(),
            deselectAllBtn: () => this.deselectAll(),
            deleteBtn: () => this.confirmDelete(),
        };
    }

    createContextMenu() {
        this.contextMenu = PopupMenu.create({
            id: 'contextMenu',
            attached: true,
            items: [{
                id: 'ctxDetailsBtn',
                type: 'link',
                title: __('OPEN_ITEM'),
                onClick: (e) => this.showDetails(e),
            }, {
                type: 'placeholder',
            }, {
                id: 'ctxUpdateBtn',
                type: 'link',
                icon: 'update',
                title: __('UPDATE'),
            }, {
                id: 'ctxDeleteBtn',
                icon: 'del',
                title: __('DELETE'),
                onClick: () => this.confirmDelete(),
            }],
        });
    }

    onMenuClick(item) {
        this.menu.hideMenu();

        const menuAction = this.menuActions[item];
        if (!isFunction(menuAction)) {
            return;
        }

        menuAction();
    }

    getItemById(itemId) {
        return window.app.model.categories.getItem(itemId);
    }

    onItemClick(itemId, e) {
        const { listMode } = this.store.getState();
        if (listMode === 'list') {
            const menuBtn = e?.target?.closest('.popup-menu-btn');
            if (menuBtn) {
                this.showContextMenu(itemId);
            }
        } else if (listMode === 'select') {
            if (e?.target?.closest('.checkbox') && e.pointerType !== '') {
                e.preventDefault();
            }

            this.toggleSelectItem(itemId);
        }
    }

    showDetails(e) {
        e?.preventDefault();
        this.store.dispatch(actions.showDetails());

        this.requestItem();
    }

    closeDetails() {
        this.store.dispatch(actions.closeDetails());
    }

    showContextMenu(itemId) {
        this.store.dispatch(actions.showContextMenu(itemId));
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

    async setListMode(listMode) {
        const state = this.store.getState();
        if (listMode === 'sort' && state.sortMode !== SORT_MANUALLY) {
            await this.requestSortMode(SORT_MANUALLY);
        }

        this.store.dispatch(actions.changeListMode(listMode));
    }

    startLoading() {
        this.store.dispatch(actions.startLoading());
    }

    stopLoading() {
        this.store.dispatch(actions.stopLoading());
    }

    getSelectedItems(state) {
        return state.items.filter((item) => item.selected);
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

    async deleteItems(removeChild = true) {
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
            await API.category.del({ id: ids, removeChild });
            this.requestList();
        } catch (e) {
            window.app.createMessage(e.message, 'msg_error');
            this.stopLoading();
        }
    }

    async requestList(options = {}) {
        const { keepState = false } = options;

        try {
            const { data } = await API.category.list();
            window.app.model.categories.setData(data);

            this.store.dispatch(actions.listRequestLoaded(keepState));
        } catch (e) {
            window.app.createMessage(e.message, 'msg_error');
        }

        this.stopLoading();
    }

    async requestItem() {
        const state = this.store.getState();
        if (!state.detailsId) {
            return;
        }

        try {
            const { data } = await API.category.read(state.detailsId);
            const [item] = data;

            this.store.dispatch(actions.itemDetailsLoaded(item));
        } catch (e) {
            window.app.createMessage(e.message, 'msg_error');
        }
    }

    /**
     * Returns maximum position of child categories
     * @param {number} categoryId
     * @returns
     */
    getLastCategoryPos(categoryId) {
        const { categories } = window.app.model;
        const category = categories.getItem(categoryId);
        const children = categories.findByParent(categoryId);
        return children.reduce((current, item) => Math.max(current, item.pos), category?.pos ?? 0);
    }

    /**
     * Sent API request to server to change position of category
     * @param {number} itemId - identifier of item to change position
     * @param {number} parentId - identifier of parent category
     * @param {number} prevId - identifier of previous item
     * @param {number} nextId - identifier of next item
     */
    async sendChangePosRequest(itemId, parentId, prevId, nextId) {
        const { categories } = window.app.model;

        const item = categories.getItem(itemId);
        const parent = categories.getItem(parentId);
        const prevItem = categories.getItem(prevId);
        const nextItem = categories.getItem(nextId);

        let newPos;
        if (nextItem) {
            if (item.pos < nextItem.pos) { // moving down
                newPos = nextItem.pos - 1;
            } else { // moving up
                newPos = nextItem.pos;
            }
        } else {
            newPos = (prevItem)
                ? this.getLastCategoryPos(prevId) + 1
                : (parent?.pos ?? 0) + 1;
        }

        this.startLoading();

        try {
            await API.category.setPos(itemId, newPos, parentId);
            this.requestList({ keepState: true });
        } catch (e) {
            this.cancelPosChange(itemId);
            this.stopLoading();
        }
    }

    /**
     * Cancel local changes on position update fail
     */
    cancelPosChange() {
        this.render(this.store.getState());

        window.app.createMessage(__('ERR_CATEGORY_CHANGE_POS'), 'msg_error');
    }

    getSortMode() {
        return window.app.model.profile.settings.sort_categories;
    }

    toggleSortByName() {
        const current = this.getSortMode();
        const sortMode = (current === SORT_BY_NAME_ASC)
            ? SORT_BY_NAME_DESC
            : SORT_BY_NAME_ASC;

        this.requestSortMode(sortMode);
    }

    toggleSortByDate() {
        const current = this.getSortMode();
        const sortMode = (current === SORT_BY_CREATEDATE_ASC)
            ? SORT_BY_CREATEDATE_DESC
            : SORT_BY_CREATEDATE_ASC;

        this.requestSortMode(sortMode);
    }

    async requestSortMode(sortMode) {
        const { settings } = window.app.model.profile;
        if (settings.sort_categories === sortMode) {
            return;
        }

        this.startLoading();

        try {
            await API.profile.updateSettings({
                sort_categories: sortMode,
            });
            settings.sort_categories = sortMode;

            this.store.dispatch(actions.changeSortMode(sortMode));
        } catch (e) {
            window.app.createMessage(e.message, 'msg_error');
        }

        this.stopLoading();
    }

    /** Show person(s) delete confirmation popup */
    confirmDelete() {
        const state = this.store.getState();
        const ids = this.getContextIds(state);
        if (ids.length === 0) {
            return;
        }

        const { categories } = window.app.model;
        const showChildrenCheckbox = ids.some((id) => {
            const category = categories.getItem(id);
            return category?.parent_id === 0;
        });

        const multiple = (ids.length > 1);
        DeleteCategoryDialog.create({
            id: 'delete_warning',
            title: (multiple) ? __('CATEGORY_DELETE_MULTIPLE') : __('CATEGORY_DELETE'),
            content: (multiple) ? __('MSG_CATEGORY_DELETE_MULTIPLE') : __('MSG_CATEGORY_DELETE'),
            showChildrenCheckbox,
            onConfirm: (opt) => this.deleteItems(opt),
        });
    }

    renderContextMenu(state) {
        if (state.listMode !== 'list') {
            this.contextMenu.detach();
            return;
        }

        const itemId = state.contextItem;
        const category = window.app.model.categories.getItem(itemId);
        if (!category) {
            this.contextMenu.detach();
            return;
        }

        const selector = `.category-item[data-id="${itemId}"] .popup-menu`;
        const menuContainer = this.contentContainer.querySelector(selector);
        if (!menuContainer) {
            this.contextMenu.detach();
            return;
        }

        const { baseURL } = window.app;
        const { items } = this.contextMenu;
        items.ctxDetailsBtn.setURL(`${baseURL}categories/${itemId}`);
        items.ctxUpdateBtn.setURL(`${baseURL}categories/update/${itemId}`);

        this.contextMenu.attachAndShow(menuContainer);
    }

    renderMenu(state) {
        const itemsCount = state.items.length;
        const selArr = this.getSelectedItems(state);
        const selCount = selArr.length;
        const isListMode = state.listMode === 'list';
        const isSelectMode = state.listMode === 'select';
        const isSortMode = state.listMode === 'sort';
        const sortMode = this.getSortMode();

        show(this.createBtn, isListMode);
        this.listModeBtn.show(!isListMode);

        this.menu.show(itemsCount > 0 && !isSortMode);

        const { items } = this.menu;

        items.selectModeBtn.show(isListMode && itemsCount > 0);
        items.sortModeBtn.show(isListMode && itemsCount > 1);

        items.sortByNameBtn.setIcon(getSortByNameIcon(sortMode));
        items.sortByNameBtn.show(isListMode && itemsCount > 1);

        items.sortByDateBtn.setIcon(getSortByDateIcon(sortMode));
        items.sortByDateBtn.show(isListMode && itemsCount > 1);

        items.selectAllBtn.show(isSelectMode && itemsCount > 0 && selCount < itemsCount);
        items.deselectAllBtn.show(isSelectMode && itemsCount > 0 && selCount > 0);
        show(items.separator2, isSelectMode);

        items.deleteBtn.show(selCount > 0);
    }

    renderDetails(state, prevState) {
        if (
            state.detailsId === prevState?.detailsId
            && state.detailsItem === prevState?.detailsItem
        ) {
            return;
        }

        if (!state.detailsId) {
            show(this.itemInfo, false);
            return;
        }

        const { categories } = window.app.model;
        const item = state.detailsItem ?? categories.getItem(state.detailsId);
        if (!item) {
            throw new Error('Category not found');
        }

        if (!this.categoryDetails) {
            this.categoryDetails = CategoryDetails.create({
                item,
                onClose: () => this.closeDetails(),
            });
            this.itemInfo.append(this.categoryDetails.elem);
        } else {
            this.categoryDetails.setItem(item);
        }

        show(this.itemInfo, true);
    }

    /** Returns URL for specified state */
    getURL(state) {
        const { baseURL } = window.app;
        const itemPart = (state.detailsId) ? state.detailsId : '';
        return new URL(`${baseURL}categories/${itemPart}`);
    }

    renderHistory(state, prevState) {
        if (state.detailsId === prevState?.detailsId) {
            return;
        }

        const url = this.getURL(state);
        const pageTitle = `${__('APP_NAME')} | ${__('CATEGORIES')}`;
        window.history.replaceState({}, pageTitle, url);
    }

    renderList(state, prevState) {
        if (
            state.items === prevState?.items
            && state.listMode === prevState?.listMode
            && state.sortMode === prevState?.sortMode
        ) {
            return;
        }

        // Counters
        const itemsCount = state.items.length;
        this.itemsCount.textContent = itemsCount;
        const isSelectMode = (state.listMode === 'select');
        show(this.selectedCounter, isSelectMode);
        const selected = (isSelectMode) ? this.getSelectedIds(state) : [];
        this.selItemsCount.textContent = selected.length;

        const categories = CategoryList.create(state.items);
        const mainCategories = CategoryList.create(categories.findByParent(0));
        mainCategories.sortBy(state.sortMode);
        mainCategories.forEach((item) => {
            const children = categories.findByParent(item.id);
            item.setChildren(children);
            item.children.sortBy(state.sortMode);
        });

        // List of categories
        this.transTypes.forEach((type) => {
            const key = (type !== 0) ? Transaction.getTypeString(type) : 'any';
            const section = this.sections[key];
            const items = mainCategories.filter((item) => item.type === type);

            section.list.setState((listState) => ({
                ...listState,
                items,
                listMode: state.listMode,
                renderTime: Date.now(),
            }));

            show(section.container, items.length > 0);
        });
    }

    render(state, prevState = {}) {
        if (!state) {
            throw new Error('Invalid state');
        }

        this.renderHistory(state, prevState);

        if (state.loading) {
            this.loadingIndicator.show();
        }

        this.renderList(state, prevState);
        this.renderContextMenu(state);
        this.renderMenu(state);
        this.renderDetails(state, prevState);

        if (!state.loading) {
            this.loadingIndicator.hide();
        }
    }
}

window.app = new Application(window.appProps);
window.app.createView(CategoryListView);
