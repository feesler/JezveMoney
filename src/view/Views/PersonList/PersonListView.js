import 'jezvejs/style';
import {
    asArray,
    ge,
    insertAfter,
    show,
} from 'jezvejs';
import { PopupMenu } from 'jezvejs/PopupMenu';
import { Application } from '../../js/Application.js';
import '../../css/app.scss';
import { View } from '../../js/View.js';
import { API } from '../../js/api/index.js';
import { PersonList } from '../../js/model/PersonList.js';
import { ConfirmDialog } from '../../Components/ConfirmDialog/ConfirmDialog.js';
import { ListContainer } from '../../Components/ListContainer/ListContainer.js';
import { LoadingIndicator } from '../../Components/LoadingIndicator/LoadingIndicator.js';
import { Tile } from '../../Components/Tile/Tile.js';
import './style.scss';
import { createStore } from '../../js/store.js';
import { actions, reducer } from './reducer.js';

/** Strings */
const TITLE_SINGLE_PERSON_DELETE = 'Delete person';
const TITLE_MULTI_PERSON_DELETE = 'Delete persons';
const MSG_MULTI_PERSON_DELETE = 'Are you sure want to delete selected persons?<br>Debt operations will be converted into expense or income.';
const MSG_SINGLE_PERSON_DELETE = 'Are you sure want to delete selected person?<br>Debt operations will be converted into expense or income.';
const MSG_NO_PERSONS = 'You have no one person. Please create one.';

/**
 * List of persons view
 */
class PersonListView extends View {
    constructor(...args) {
        super(...args);

        window.app.loadModel(PersonList, 'persons', window.app.props.persons);
        window.app.checkPersonModels();

        const initialState = {
            items: {
                visible: PersonList.create(window.app.model.visiblePersons),
                hidden: PersonList.create(window.app.model.hiddenPersons),
            },
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
            getItemProps: (person, { listMode }) => ({
                type: 'button',
                attrs: { 'data-id': person.id },
                className: 'tiles',
                title: person.name,
                selected: person.selected,
                selectMode: listMode === 'select',
            }),
            className: 'tiles',
            itemSelector: '.tile',
            listMode: state.listMode,
            noItemsMessage: MSG_NO_PERSONS,
            onItemClick: (id, e) => this.onItemClick(id, e),
        };

        const visibleTilesHeading = ge('visibleTilesHeading');
        this.hiddenTilesHeading = ge('hiddenTilesHeading');
        if (!visibleTilesHeading || !this.hiddenTilesHeading) {
            throw new Error('Failed to initialize Account List view');
        }

        this.visibleTiles = ListContainer.create(listProps);
        insertAfter(this.visibleTiles.elem, visibleTilesHeading);

        this.hiddenTiles = ListContainer.create(listProps);
        insertAfter(this.hiddenTiles.elem, this.hiddenTilesHeading);

        this.createBtn = ge('add_btn');
        this.createMenu();
        insertAfter(this.menu.elem, this.createBtn);

        this.createContextMenu();

        this.loadingIndicator = LoadingIndicator.create();
        insertAfter(this.loadingIndicator.elem, this.hiddenTiles.elem);

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
                id: 'separator1',
                type: 'separator',
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
                id: 'showBtn',
                icon: 'show',
                title: 'Restore',
                onClick: () => this.showItems(),
            }, {
                id: 'hideBtn',
                icon: 'hide',
                title: 'Hide',
                onClick: () => this.showItems(false),
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
                id: 'ctxShowBtn',
                icon: 'show',
                title: 'Restore',
                onClick: () => this.showItems(),
            }, {
                id: 'ctxHideBtn',
                icon: 'hide',
                title: 'Hide',
                onClick: () => this.showItems(false),
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

    getVisibleSelectedItems(state) {
        return state.items.visible.filter((item) => item.selected);
    }

    getHiddenSelectedItems(state) {
        return state.items.hidden.filter((item) => item.selected);
    }

    getSelectedIds(state) {
        const selArr = this.getVisibleSelectedItems(state);
        const hiddenSelArr = this.getHiddenSelectedItems(state);
        return selArr.concat(hiddenSelArr).map((item) => item.id);
    }

    getContextIds(state) {
        if (state.listMode === 'list') {
            return asArray(state.contextItem);
        }

        return this.getSelectedIds(state);
    }

    async showItems(value = true) {
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
            if (value) {
                await API.person.show({ id: ids });
            } else {
                await API.person.hide({ id: ids });
            }
            this.requestList();
        } catch (e) {
            window.app.createMessage(e.message, 'msg_error');
            this.stopLoading();
        }
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
            await API.person.del({ id: ids });
            this.requestList();
        } catch (e) {
            window.app.createMessage(e.message, 'msg_error');
            this.stopLoading();
        }
    }

    async requestList() {
        try {
            const { data } = await API.person.list({ visibility: 'all' });
            window.app.model.persons.setData(data);
            window.app.model.visiblePersons = null;
            window.app.checkPersonModels();

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
            title: (multiple) ? TITLE_MULTI_PERSON_DELETE : TITLE_SINGLE_PERSON_DELETE,
            content: (multiple) ? MSG_MULTI_PERSON_DELETE : MSG_SINGLE_PERSON_DELETE,
            onconfirm: () => this.deleteItems(),
        });
    }

    renderContextMenu(state) {
        if (state.listMode !== 'list') {
            this.contextMenu.detach();
            return;
        }
        const person = window.app.model.persons.getItem(state.contextItem);
        if (!person) {
            this.contextMenu.detach();
            return;
        }
        const tile = document.querySelector(`.tile[data-id="${person.id}"]`);
        if (!tile) {
            this.contextMenu.detach();
            return;
        }

        const { baseURL } = window.app;
        const { items } = this.contextMenu;
        items.ctxUpdateBtn.setURL(`${baseURL}persons/update/${person.id}`);
        items.ctxShowBtn.show(!person.isVisible());
        items.ctxHideBtn.show(person.isVisible());

        this.contextMenu.attachAndShow(tile);
    }

    renderMenu(state) {
        const itemsCount = state.items.visible.length + state.items.hidden.length;
        const selArr = this.getVisibleSelectedItems(state);
        const hiddenSelArr = this.getHiddenSelectedItems(state);
        const selCount = selArr.length;
        const hiddenSelCount = hiddenSelArr.length;
        const totalSelCount = selCount + hiddenSelCount;
        const isSelectMode = (state.listMode === 'select');

        this.menu.show(itemsCount > 0);

        const { items } = this.menu;
        const selectModeTitle = (isSelectMode) ? 'Done' : 'Select';
        items.selectModeBtn.setTitle(selectModeTitle);
        items.selectModeBtn.setIcon((isSelectMode) ? null : 'select');
        show(items.separator1, isSelectMode);

        items.selectAllBtn.show(isSelectMode && itemsCount > 0 && totalSelCount < itemsCount);
        items.deselectAllBtn.show(isSelectMode && itemsCount > 0 && totalSelCount > 0);
        show(items.separator2, isSelectMode);

        items.showBtn.show(hiddenSelCount > 0);
        items.hideBtn.show(selCount > 0);
        items.deleteBtn.show(totalSelCount > 0);
    }

    render(state) {
        if (!state) {
            throw new Error('Invalid state');
        }

        if (state.loading) {
            this.loadingIndicator.show();
        }

        // Render visible persons
        this.visibleTiles.setState((visibleState) => ({
            ...visibleState,
            items: state.items.visible,
            listMode: state.listMode,
            renderTime: Date.now(),
        }));
        // Render hidden persons
        this.hiddenTiles.setState((hiddenState) => ({
            ...hiddenState,
            items: state.items.hidden,
            listMode: state.listMode,
        }));

        const hiddenItemsAvailable = (state.items.hidden.length > 0);
        this.hiddenTiles.show(hiddenItemsAvailable);
        show(this.hiddenTilesHeading, hiddenItemsAvailable);

        this.renderContextMenu(state);
        this.renderMenu(state);

        if (!state.loading) {
            this.loadingIndicator.hide();
        }
    }
}

window.app = new Application(window.appProps);
window.app.createView(PersonListView);
