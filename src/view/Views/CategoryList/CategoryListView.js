import 'jezvejs/style';
import {
    createElement,
    insertAfter,
    isFunction,
    show,
} from 'jezvejs';
import { Button } from 'jezvejs/Button';
import { MenuButton } from 'jezvejs/MenuButton';
import { SortableListContainer } from 'jezvejs/SortableListContainer';
import { TabList } from 'jezvejs/TabList';
import { createStore } from 'jezvejs/Store';

// Application
import { App } from '../../Application/App.js';
import '../../Application/Application.scss';
import { AppView } from '../../Components/Layout/AppView/AppView.js';
import {
    SORT_BY_CREATEDATE_ASC,
    SORT_BY_CREATEDATE_DESC,
    SORT_BY_NAME_ASC,
    SORT_BY_NAME_DESC,
    SORT_MANUALLY,
    __,
    getSelectedIds,
    getApplicationURL,
    getContextIds,
} from '../../utils/utils.js';
import { API } from '../../API/index.js';

// Models
import { Category } from '../../Models/Category.js';
import { CategoryList } from '../../Models/CategoryList.js';
import { Transaction, availTransTypes } from '../../Models/Transaction.js';

// Common components
import { Heading } from '../../Components/Layout/Heading/Heading.js';
import { DeleteCategoryDialog } from '../../Components/Category/DeleteCategoryDialog/DeleteCategoryDialog.js';
import { LoadingIndicator } from '../../Components/Common/LoadingIndicator/LoadingIndicator.js';
import { ListCounter } from '../../Components/List/ListCounter/ListCounter.js';
import { NoDataMessage } from '../../Components/Common/NoDataMessage/NoDataMessage.js';
import { CategoryDetails } from './components/CategoryDetails/CategoryDetails.js';

// Local components
import { CategoryItem } from './components/CategoryItem/CategoryItem.js';
import { CategoryListContextMenu } from './components/ContextMenu/CategoryListContextMenu.js';
import { CategoryListMainMenu } from './components/MainMenu/CategoryListMainMenu.js';

import {
    actions,
    createItemsFromModel,
    reducer,
    selectAvailableType,
} from './reducer.js';
import { ANY_TYPE, getCategoriesSortMode } from './helpers.js';
import './CategoryListView.scss';

/* CSS classes */
const SELECT_MODE_CLASS = 'list_select';
const SORT_MODE_CLASS = 'list_sort';

/**
 * List of persons view
 */
class CategoryListView extends AppView {
    constructor(...args) {
        super(...args);

        this.menuActions = {
            selectModeBtn: () => this.setListMode('select'),
            sortModeBtn: () => this.setListMode('sort'),
            sortByNameBtn: () => this.toggleSortByName(),
            sortByDateBtn: () => this.toggleSortByDate(),
            selectAllBtn: () => this.selectAll(),
            deselectAllBtn: () => this.deselectAll(),
            deleteBtn: () => this.confirmDelete(),
        };

        this.contextMenuActions = {
            ctxDetailsBtn: () => this.showDetails(),
            ctxDeleteBtn: () => this.confirmDelete(),
        };

        App.loadModel(CategoryList, 'categories', App.props.categories);
        App.initCategoriesModel();

        const { settings } = App.model.profile;
        const sortMode = settings.sort_categories;

        const initialState = selectAvailableType({
            ...this.props,
            detailsItem: null,
            items: createItemsFromModel(),
            selectedType: this.props.selectedType ?? null,
            loading: false,
            listMode: 'list',
            showMenu: false,
            sortMode,
            showContextMenu: false,
            contextItem: null,
            renderTime: Date.now(),
        });

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
            itemSortSelector: '.category-item.list-item_sort',
            selectModeClass: SELECT_MODE_CLASS,
            sortModeClass: SORT_MODE_CLASS,
            placeholderClass: 'category-item_placeholder',
            treeSort: true,
            childContainerSelector: '.category-item__children',
            listMode: 'list',
            PlaceholderComponent: NoDataMessage,
            animated: true,
            getPlaceholderProps: () => ({ title: __('categories.noData') }),
            onItemClick: (id, e) => this.onItemClick(id, e),
            onTreeSort: (...args) => this.sendChangePosRequest(...args),
        };

        this.loadElementsByIds([
            'heading',
            'contentContainer',
            'itemInfo',
        ]);

        this.heading = Heading.fromElement(this.heading, {
            title: __('categories.listTitle'),
        });

        this.createBtn = Button.create({
            id: 'createBtn',
            type: 'link',
            className: 'circle-btn',
            icon: 'plus',
            url: `${App.baseURL}categories/create/`,
        });
        this.heading.actionsContainer.prepend(this.createBtn.elem);

        // List header
        // Counters
        this.itemsCounter = ListCounter.create({
            title: __('list.itemsCounter'),
            className: 'items-counter',
        });
        this.selectedCounter = ListCounter.create({
            title: __('list.selectedItemsCounter'),
            className: 'selected-counter',
        });

        const counters = createElement('div', {
            props: { className: 'counters' },
            children: [
                this.itemsCounter.elem,
                this.selectedCounter.elem,
            ],
        });

        this.contentHeader = createElement('header', {
            props: { className: 'content-header' },
            children: counters,
        });
        this.contentContainer.before(this.contentHeader);

        // Tabs
        this.sections = {};
        this.tabs = TabList.create({
            itemParam: 'type',
            onChange: (item) => this.onChangeType(item),
            items: this.transTypes.map((type) => {
                const key = Category.getTypeString(type);
                const section = {
                    list: SortableListContainer.create({
                        ...listProps,
                        sortGroup: type,
                    }),
                };

                this.sections[key] = section;

                return {
                    id: key,
                    value: key,
                    title: Category.getTypeTitle(type),
                    content: section.list.elem,
                };
            }),
        });

        this.contentContainer.append(this.tabs.elem);

        this.listModeBtn = Button.create({
            id: 'listModeBtn',
            className: 'action-button',
            title: __('actions.done'),
            onClick: () => this.setListMode('list'),
        });
        insertAfter(this.listModeBtn.elem, this.createBtn.elem);

        this.menuButton = MenuButton.create({
            className: 'circle-btn',
            onClick: (e) => this.showMenu(e),
        });
        insertAfter(this.menuButton.elem, this.listModeBtn.elem);

        this.loadingIndicator = LoadingIndicator.create({
            fixed: false,
        });
        this.contentContainer.append(this.loadingIndicator.elem);

        this.subscribeToStore(this.store);

        if (this.props.detailsId) {
            this.requestItem();
        }
    }

    showMenu() {
        this.store.dispatch(actions.showMenu());
    }

    hideMenu() {
        this.store.dispatch(actions.hideMenu());
    }

    onChangeType(selected) {
        const type = Category.getTypeByString(selected?.id);
        this.store.dispatch(actions.selectType(type));
    }

    onMenuClick(item) {
        this.menu.hideMenu();

        const menuAction = this.menuActions[item];
        if (!isFunction(menuAction)) {
            return;
        }

        menuAction();
    }

    onContextMenuClick(item) {
        this.hideContextMenu();

        const menuAction = this.contextMenuActions[item];
        if (isFunction(menuAction)) {
            menuAction();
        }
    }

    getItemById(itemId) {
        return App.model.categories.getItem(itemId);
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

    hideContextMenu() {
        this.store.dispatch(actions.hideContextMenu());
    }

    toggleSelectItem(itemId) {
        this.store.dispatch(actions.toggleSelectItem(itemId));
        this.setRenderTime();
    }

    selectAll() {
        this.store.dispatch(actions.selectAllItems());
        this.setRenderTime();
    }

    deselectAll() {
        this.store.dispatch(actions.deselectAllItems());
        this.setRenderTime();
    }

    async setListMode(listMode) {
        this.store.dispatch(actions.changeListMode(listMode));

        const state = this.store.getState();
        if (listMode === 'sort' && state.sortMode !== SORT_MANUALLY) {
            await this.requestSortMode(SORT_MANUALLY);
        } else {
            this.setRenderTime();
        }
    }

    setRenderTime() {
        this.store.dispatch(actions.setRenderTime());
    }

    startLoading() {
        this.store.dispatch(actions.startLoading());
    }

    stopLoading() {
        this.store.dispatch(actions.stopLoading());
    }

    async deleteItems(removeChild = true) {
        const state = this.store.getState();
        if (state.loading) {
            return;
        }

        const ids = getContextIds(state);
        if (ids.length === 0) {
            return;
        }

        this.startLoading();

        try {
            const request = this.prepareRequest({ id: ids, removeChild });
            const response = await API.category.del(request);
            const data = this.getListDataFromResponse(response);
            this.setListData(data);
        } catch (e) {
            App.createErrorNotification(e.message);
        }

        this.stopLoading();
        this.setRenderTime();
    }

    async requestList(options = {}) {
        const { keepState = false } = options;

        this.startLoading();

        try {
            const request = this.getListRequest();
            const { data } = await API.category.list(request);
            this.setListData(data, keepState);
        } catch (e) {
            App.createErrorNotification(e.message);
        }

        this.stopLoading();
        this.setRenderTime();
    }

    getListRequest() {
        return {};
    }

    prepareRequest(data) {
        return {
            ...data,
            returnState: {
                categories: this.getListRequest(),
            },
        };
    }

    getListDataFromResponse(response) {
        return response?.data?.state?.categories?.data;
    }

    setListData(data, keepState = false) {
        App.model.categories.setData(data);
        this.store.dispatch(actions.listRequestLoaded(keepState));
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
            App.createErrorNotification(e.message);
        }
    }

    /**
     * Returns maximum position of child categories
     * @param {number} categoryId
     * @returns
     */
    getLastCategoryPos(categoryId) {
        const { categories } = App.model;
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
        const { categories } = App.model;

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
            const request = this.prepareRequest({
                id: itemId,
                pos: newPos,
                parent_id: parentId,
            });

            const response = await API.category.setPos(request);
            const data = this.getListDataFromResponse(response);
            this.setListData(data, true);
        } catch (e) {
            this.cancelPosChange();
        }

        this.stopLoading();
        this.setRenderTime();
    }

    /**
     * Cancel local changes on position update fail
     */
    cancelPosChange() {
        this.render(this.store.getState());

        App.createErrorNotification(__('categories.errors.changePos'));
    }

    toggleSortByName() {
        const current = getCategoriesSortMode();
        const sortMode = (current === SORT_BY_NAME_ASC)
            ? SORT_BY_NAME_DESC
            : SORT_BY_NAME_ASC;

        this.requestSortMode(sortMode);
    }

    toggleSortByDate() {
        const current = getCategoriesSortMode();
        const sortMode = (current === SORT_BY_CREATEDATE_ASC)
            ? SORT_BY_CREATEDATE_DESC
            : SORT_BY_CREATEDATE_ASC;

        this.requestSortMode(sortMode);
    }

    async requestSortMode(sortMode) {
        const { settings } = App.model.profile;
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
            App.createErrorNotification(e.message);
        }

        this.stopLoading();
        this.setRenderTime();
    }

    /** Show person(s) delete confirmation popup */
    confirmDelete() {
        const state = this.store.getState();
        const ids = getContextIds(state);
        if (ids.length === 0) {
            return;
        }

        const { categories } = App.model;
        const showChildrenCheckbox = ids.some((id) => {
            const category = categories.getItem(id);
            return category?.parent_id === 0;
        });

        const multiple = (ids.length > 1);
        DeleteCategoryDialog.create({
            id: 'delete_warning',
            title: (multiple) ? __('categories.deleteMultiple') : __('categories.delete'),
            content: (multiple) ? __('categories.deleteMultipleMessage') : __('categories.deleteMessage'),
            showChildrenCheckbox,
            onConfirm: (opt) => this.deleteItems(opt),
        });
    }

    renderContextMenu(state) {
        if (!state.showContextMenu && !this.contextMenu) {
            return;
        }

        if (!this.contextMenu) {
            this.contextMenu = CategoryListContextMenu.create({
                id: 'contextMenu',
                onItemClick: (item) => this.onContextMenuClick(item),
                onClose: () => this.hideContextMenu(),
            });
        }

        this.contextMenu.setContext({
            showContextMenu: state.showContextMenu,
            contextItem: state.contextItem,
        });
    }

    renderMenu(state) {
        const itemsCount = state.items.length;
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
            this.menu = CategoryListMainMenu.create({
                id: 'listMenu',
                attachTo: this.menuButton.elem,
                onItemClick: (item) => this.onMenuClick(item),
                onClose: () => this.hideMenu(),
            });
        }

        this.menu.setContext({
            listMode: state.listMode,
            showMenu: state.showMenu,
            items: state.items,
        });

        if (showFirstTime) {
            this.menu.showMenu();
        }
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

        const { categories } = App.model;
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
        const itemPart = (state.detailsId) ? state.detailsId : '';
        const url = getApplicationURL(`categories/${itemPart}`);

        const typeStr = (state.selectedType === 0)
            ? 'any'
            : Transaction.getTypeString(state.selectedType);
        url.searchParams.set('type', typeStr);

        return url;
    }

    renderHistory(state, prevState) {
        if (
            state.detailsId === prevState?.detailsId
            && state.selectedType === prevState?.selectedType
        ) {
            return;
        }

        const url = this.getURL(state);
        const pageTitle = `${__('appName')} | ${__('categories.listTitle')}`;
        window.history.replaceState({}, pageTitle, url);
    }

    renderCounters(state, prevState) {
        if (
            state.items === prevState?.items
            && state.listMode === prevState?.listMode
        ) {
            return;
        }

        const itemsCount = state.items.length;
        const isSelectMode = (state.listMode === 'select');
        const selected = (isSelectMode) ? getSelectedIds(state) : [];

        this.itemsCounter.setContent(itemsCount.toString());
        this.selectedCounter.show(isSelectMode);
        this.selectedCounter.setContent(selected.length.toString());
    }

    renderList(state, prevState) {
        if (
            state.items === prevState?.items
            && state.listMode === prevState?.listMode
            && state.sortMode === prevState?.sortMode
            && state.selectedType === prevState?.selectedType
            && state.renderTime === prevState?.renderTime
        ) {
            return;
        }

        const categories = CategoryList.create(state.items);
        categories.sortBy(state.sortMode);
        const mainCategories = CategoryList.create(categories.findByParent(0));
        mainCategories.forEach((item) => {
            const children = categories.findByParent(item.id);
            item.setChildren(children);
        });

        // List of categories
        this.transTypes.forEach((type) => {
            const key = Category.getTypeString(type);
            const section = this.sections[key];
            const typeCategories = mainCategories.filter((item) => item.type === type);

            section.list.setState((listState) => ({
                ...listState,
                items: typeCategories,
                listMode: state.listMode,
                renderTime: Date.now(),
            }));

            this.tabs.showItem(key, typeCategories.length > 0);
        });

        this.tabs.setState((tabsState) => ({
            ...tabsState,
            selectedId: Category.getTypeString(state.selectedType),
        }));
        this.tabs.elem.dataset.time = state.renderTime;
    }

    render(state, prevState = {}) {
        if (!state) {
            throw new Error('Invalid state');
        }

        this.renderHistory(state, prevState);

        if (state.loading) {
            this.loadingIndicator.show();
        }

        this.renderCounters(state, prevState);
        this.renderList(state, prevState);
        this.renderContextMenu(state);
        this.renderMenu(state);
        this.renderDetails(state, prevState);

        if (!state.loading) {
            this.loadingIndicator.hide();
        }
    }
}

App.createView(CategoryListView);
