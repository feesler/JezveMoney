import 'jezvejs/style';
import { createElement, show } from '@jezvejs/dom';
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
    __,
    getSelectedIds,
    getContextIds,
} from '../../utils/utils.js';

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
import { ANY_TYPE } from './helpers.js';
import {
    deleteItems,
    requestItem,
    sendChangePosRequest,
    setListMode,
} from './actions.js';
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
            showDeleteConfirmDialog: false,
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
            onClick: () => this.store.dispatch(setListMode('list')),
        });
        this.createBtn.elem.after(this.listModeBtn.elem);

        this.menuButton = MenuButton.create({
            className: 'circle-btn',
            onClick: (e) => this.showMenu(e),
        });
        this.listModeBtn.elem.after(this.menuButton.elem);

        this.loadingIndicator = LoadingIndicator.create({
            fixed: false,
        });
        this.contentContainer.append(this.loadingIndicator.elem);

        this.subscribeToStore(this.store);

        if (this.props.detailsId) {
            this.store.dispatch(requestItem());
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
        this.store.dispatch(actions.setRenderTime());
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

        this.store.dispatch(
            sendChangePosRequest({
                id: itemId,
                pos: newPos,
                parent_id: parentId,
            }),
        );
    }

    renderDeleteConfirmDialog(state, prevState) {
        if (state.showDeleteConfirmDialog === prevState.showDeleteConfirmDialog) {
            return;
        }

        if (!state.showDeleteConfirmDialog) {
            return;
        }

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
            onConfirm: (opt) => this.store.dispatch(deleteItems(opt)),
            onReject: () => this.store.dispatch(actions.hideDeleteConfirmDialog()),
        });
    }

    renderContextMenu(state) {
        if (!state.showContextMenu && !this.contextMenu) {
            return;
        }

        if (!this.contextMenu) {
            this.contextMenu = CategoryListContextMenu.create({
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
                dispatch: (action) => this.store.dispatch(action),
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
        const url = App.getURL(`categories/${itemPart}`);

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

        this.itemsCounter.setContent(App.formatNumber(itemsCount));
        this.selectedCounter.show(isSelectMode);
        this.selectedCounter.setContent(App.formatNumber(selected.length));
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
        this.renderDeleteConfirmDialog(state, prevState);
        this.renderDetails(state, prevState);

        if (!state.loading) {
            this.loadingIndicator.hide();
        }
    }
}

App.createView(CategoryListView);
