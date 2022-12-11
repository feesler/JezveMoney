import 'jezvejs/style';
import {
    asArray,
    ge,
    insertAfter,
    show,
} from 'jezvejs';
import { IconButton } from 'jezvejs/IconButton';
import { PopupMenu } from 'jezvejs/PopupMenu';
import { Application } from '../../js/Application.js';
import '../../css/app.scss';
import { View } from '../../js/View.js';
import { API } from '../../js/api/index.js';
import { CategoryList } from '../../js/model/CategoryList.js';
import { ConfirmDialog } from '../../Components/ConfirmDialog/ConfirmDialog.js';
import { ListContainer } from '../../Components/ListContainer/ListContainer.js';
import { LoadingIndicator } from '../../Components/LoadingIndicator/LoadingIndicator.js';
import { Tile } from '../../Components/Tile/Tile.js';
import './style.scss';
import { createStore } from '../../js/store.js';
import { actions, reducer } from './reducer.js';
import { Heading } from '../../Components/Heading/Heading.js';

/** Strings */
const STR_TITLE = 'Categories';
const TITLE_SINGLE_CATEGORY_DELETE = 'Delete category';
const TITLE_MULTI_CATEGORY_DELETE = 'Delete categories';
const MSG_MULTI_CATEGORY_DELETE = 'Are you sure want to delete selected categories?';
const MSG_SINGLE_CATEGORY_DELETE = 'Are you sure want to delete selected category?';
const MSG_NO_DATA = 'No categories';

/**
 * List of persons view
 */
class PersonListView extends View {
    constructor(...args) {
        super(...args);

        window.app.loadModel(CategoryList, 'categories', window.app.props.categories);

        const initialState = {
            items: CategoryList.create(window.app.model.categories),
            loading: false,
            listMode: 'list',
            contextItem: null,
            renderTime: Date.now(),
        };

        this.store = createStore(reducer, initialState);
        this.store.subscribe((state, prevState) => {
            if (state !== prevState) {
                this.render(state, prevState);
            }
        });
    }

    /**
     * View initialization
     */
    onStart() {
        const state = this.store.getState();
        const listProps = {
            ItemComponent: Tile,
            getItemProps: (category, { listMode }) => ({
                type: 'button',
                attrs: { 'data-id': category.id },
                className: 'tiles',
                title: category.name,
                selected: category.selected,
                selectMode: listMode === 'select',
            }),
            className: 'tiles',
            itemSelector: '.tile',
            listMode: state.listMode,
            noItemsMessage: MSG_NO_DATA,
            onItemClick: (id, e) => this.onItemClick(id, e),
        };

        const elemIds = [
            'contentHeader',
            'itemsCount',
            'selectedCounter',
            'selItemsCount',
            'heading',
        ];
        elemIds.forEach((id) => {
            this[id] = ge(id);
            if (!this[id]) {
                throw new Error('Failed to initialize view');
            }
        });

        this.heading = Heading.fromElement(this.heading, {
            title: STR_TITLE,
        });

        this.tiles = ListContainer.create(listProps);
        insertAfter(this.tiles.elem, this.contentHeader);

        this.createBtn = ge('add_btn');

        this.listModeBtn = IconButton.create({
            id: 'listModeBtn',
            className: 'no-icon',
            title: 'Done',
            onClick: () => this.toggleSelectMode(),
        });
        insertAfter(this.listModeBtn.elem, this.createBtn);

        this.createMenu();
        insertAfter(this.menu.elem, this.listModeBtn.elem);

        this.createContextMenu();

        this.loadingIndicator = LoadingIndicator.create();
        insertAfter(this.loadingIndicator.elem, this.tiles.elem);

        this.render(state);
    }

    createMenu() {
        this.menu = PopupMenu.create({
            id: 'listMenu',
            items: [{
                id: 'selectModeBtn',
                icon: 'select',
                title: 'Select',
                onClick: () => this.toggleSelectMode(),
            }, {
                id: 'selectAllBtn',
                title: 'Select all',
                onClick: () => this.selectAll(),
            }, {
                id: 'deselectAllBtn',
                title: 'Clear selection',
                onClick: () => this.deselectAll(),
            }, {
                id: 'separator2',
                type: 'separator',
            }, {
                id: 'deleteBtn',
                icon: 'del',
                title: 'Delete',
                onClick: () => this.confirmDelete(),
            }],
        });
    }

    createContextMenu() {
        this.contextMenu = PopupMenu.create({
            id: 'contextMenu',
            attached: true,
            items: [{
                id: 'ctxUpdateBtn',
                type: 'link',
                icon: 'update',
                title: 'Edit',
            }, {
                id: 'ctxDeleteBtn',
                icon: 'del',
                title: 'Delete',
                onClick: () => this.confirmDelete(),
            }],
        });
    }

    onItemClick(itemId, e) {
        const { listMode } = this.store.getState();
        if (listMode === 'list') {
            this.showContextMenu(itemId);
        } else if (listMode === 'select') {
            if (e?.target?.closest('.checkbox')) {
                e.preventDefault();
            }

            this.toggleSelectItem(itemId);
        }
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

    toggleSelectMode() {
        this.store.dispatch(actions.toggleSelectMode());
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
            await API.category.del({ id: ids });
            this.requestList();
        } catch (e) {
            window.app.createMessage(e.message, 'msg_error');
            this.stopLoading();
        }
    }

    async requestList() {
        try {
            const { data } = await API.category.list();
            window.app.model.categories.setData(data);

            this.store.dispatch(actions.listRequestLoaded());
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

        const multiple = (ids.length > 1);
        ConfirmDialog.create({
            id: 'delete_warning',
            title: (multiple) ? TITLE_MULTI_CATEGORY_DELETE : TITLE_SINGLE_CATEGORY_DELETE,
            content: (multiple) ? MSG_MULTI_CATEGORY_DELETE : MSG_SINGLE_CATEGORY_DELETE,
            onconfirm: () => this.deleteItems(),
        });
    }

    renderContextMenu(state) {
        if (state.listMode !== 'list') {
            this.contextMenu.detach();
            return;
        }
        const category = window.app.model.categories.getItem(state.contextItem);
        if (!category) {
            this.contextMenu.detach();
            return;
        }
        const tile = document.querySelector(`.tile[data-id="${category.id}"]`);
        if (!tile) {
            this.contextMenu.detach();
            return;
        }

        const { baseURL } = window.app;
        const { items } = this.contextMenu;
        items.ctxUpdateBtn.setURL(`${baseURL}categories/update/${category.id}`);

        this.contextMenu.attachAndShow(tile);
    }

    renderMenu(state) {
        const itemsCount = state.items.length;
        const selArr = this.getSelectedItems(state);
        const selCount = selArr.length;
        const isSelectMode = (state.listMode === 'select');

        show(this.createBtn, !isSelectMode);
        this.listModeBtn.show(isSelectMode);

        this.menu.show(itemsCount > 0);

        const { items } = this.menu;

        items.selectModeBtn.show(!isSelectMode);
        items.selectAllBtn.show(isSelectMode && itemsCount > 0 && selCount < itemsCount);
        items.deselectAllBtn.show(isSelectMode && itemsCount > 0 && selCount > 0);
        show(items.separator2, isSelectMode);

        items.deleteBtn.show(selCount > 0);
    }

    render(state) {
        if (!state) {
            throw new Error('Invalid state');
        }

        if (state.loading) {
            this.loadingIndicator.show();
        }

        // Counters
        const itemsCount = state.items.length;
        this.itemsCount.textContent = itemsCount;
        const isSelectMode = (state.listMode === 'select');
        show(this.selectedCounter, isSelectMode);
        const selected = (isSelectMode) ? this.getSelectedIds(state) : [];
        this.selItemsCount.textContent = selected.length;

        // List of categories
        this.tiles.setState((listState) => ({
            ...listState,
            items: state.items,
            listMode: state.listMode,
            renderTime: Date.now(),
        }));

        this.renderContextMenu(state);
        this.renderMenu(state);

        if (!state.loading) {
            this.loadingIndicator.hide();
        }
    }
}

window.app = new Application(window.appProps);
window.app.createView(PersonListView);
