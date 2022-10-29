import 'jezvejs/style';
import {
    asArray,
    ge,
    createElement,
    setEvents,
    removeChilds,
    insertAfter,
    show,
} from 'jezvejs';
import { Application } from '../../js/Application.js';
import '../../css/app.scss';
import { View } from '../../js/View.js';
import { API } from '../../js/api/index.js';
import { PersonList } from '../../js/model/PersonList.js';
import { ConfirmDialog } from '../../Components/ConfirmDialog/ConfirmDialog.js';
import { Tile } from '../../Components/Tile/Tile.js';
import { LoadingIndicator } from '../../Components/LoadingIndicator/LoadingIndicator.js';
import { PopupMenu } from '../../Components/PopupMenu/PopupMenu.js';
import './style.scss';

/** CSS classes */
const NO_DATA_CLASS = 'nodata-message';
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

        this.state = {
            items: {
                visible: PersonList.create(window.app.model.visiblePersons),
                hidden: PersonList.create(window.app.model.hiddenPersons),
            },
            loading: false,
            listMode: 'list',
            contextItem: null,
            renderTime: Date.now(),
        };
    }

    /**
     * View initialization
     */
    onStart() {
        this.tilesContainer = ge('tilesContainer');
        this.hiddenTilesHeading = ge('hiddenTilesHeading');
        this.hiddenTilesContainer = ge('hiddenTilesContainer');
        if (
            !this.tilesContainer
            || !this.hiddenTilesHeading
            || !this.hiddenTilesContainer
        ) {
            throw new Error('Failed to initialize Person List view');
        }
        const tileEvents = { click: (e) => this.onTileClick(e) };
        setEvents(this.tilesContainer, tileEvents);
        setEvents(this.hiddenTilesContainer, tileEvents);

        this.createBtn = ge('add_btn');
        this.createMenu();
        insertAfter(this.menu.elem, this.createBtn);

        this.createContextMenu();

        this.loadingIndicator = LoadingIndicator.create();
        insertAfter(this.loadingIndicator.elem, this.hiddenTilesContainer);

        this.render(this.state);
    }

    createMenu() {
        this.menu = PopupMenu.create({ id: 'listMenu' });

        this.selectModeBtn = this.menu.addIconItem({
            id: 'selectModeBtn',
            icon: 'select',
            title: 'Select',
            onClick: () => this.toggleSelectMode(),
        });
        this.separator1 = this.menu.addSeparator();

        this.selectAllBtn = this.menu.addIconItem({
            id: 'selectAllBtn',
            title: 'Select all',
            onClick: () => this.selectAll(),
        });
        this.deselectAllBtn = this.menu.addIconItem({
            id: 'deselectAllBtn',
            title: 'Clear selection',
            onClick: () => this.deselectAll(),
        });
        this.separator2 = this.menu.addSeparator();

        this.showBtn = this.menu.addIconItem({
            id: 'showBtn',
            icon: 'show',
            title: 'Restore',
            onClick: () => this.showItems(),
        });
        this.hideBtn = this.menu.addIconItem({
            id: 'hideBtn',
            icon: 'hide',
            title: 'Hide',
            onClick: () => this.showItems(false),
        });
        this.deleteBtn = this.menu.addIconItem({
            id: 'deleteBtn',
            icon: 'del',
            title: 'Delete',
            onClick: () => this.confirmDelete(),
        });
    }

    createContextMenu() {
        this.contextMenu = PopupMenu.create({
            id: 'contextMenu',
            attachTo: this.tilesContainer,
        });

        this.ctxUpdateBtn = this.contextMenu.addIconItem({
            id: 'ctxUpdateBtn',
            type: 'link',
            icon: 'update',
            title: 'Edit',
        });
        this.ctxShowBtn = this.contextMenu.addIconItem({
            id: 'ctxShowBtn',
            icon: 'show',
            title: 'Restore',
            onClick: () => this.showItems(),
        });
        this.ctxHideBtn = this.contextMenu.addIconItem({
            id: 'ctxHideBtn',
            icon: 'hide',
            title: 'Hide',
            onClick: () => this.showItems(false),
        });
        this.ctxDeleteBtn = this.contextMenu.addIconItem({
            id: 'ctxDeleteBtn',
            icon: 'del',
            title: 'Delete',
            onClick: () => this.confirmDelete(),
        });
    }

    /**
     * Tile click event handler
     */
    onTileClick(e) {
        const tile = e?.target?.closest('.tile');
        if (!tile || !tile.dataset) {
            return;
        }

        const personId = parseInt(tile.dataset.id, 10);
        const person = window.app.model.persons.getItem(personId);
        if (!person) {
            return;
        }

        if (this.state.listMode === 'list') {
            this.showContextMenu(personId);
        } else if (this.state.listMode === 'select') {
            this.toggleSelectItem(personId);
            this.setRenderTime();
        }
    }

    showContextMenu(itemId) {
        if (this.state.contextItem === itemId) {
            return;
        }

        this.setState({ ...this.state, contextItem: itemId });
    }

    toggleSelectItem(itemId) {
        const person = window.app.model.persons.getItem(itemId);
        if (!person) {
            return;
        }

        const toggleItem = (item) => (
            (item.id === itemId)
                ? { ...item, selected: !item.selected }
                : item
        );

        const { visible, hidden } = this.state.items;
        this.setState({
            ...this.state,
            items: {
                visible: (person.isVisible()) ? visible.map(toggleItem) : visible,
                hidden: (!person.isVisible()) ? hidden.map(toggleItem) : hidden,
            },
        });
    }

    reduceSelectAll(state = this.state) {
        const selectItem = (item) => (
            (item.selected)
                ? item
                : { ...item, selected: true }
        );

        return {
            ...state,
            items: {
                visible: state.items.visible.map(selectItem),
                hidden: state.items.hidden.map(selectItem),
            },
        };
    }

    reduceDeselectAll(state = this.state) {
        const deselectItem = (item) => (
            (item.selected)
                ? { ...item, selected: false }
                : item
        );

        return {
            ...state,
            items: {
                visible: state.items.visible.map(deselectItem),
                hidden: state.items.hidden.map(deselectItem),
            },
        };
    }

    selectAll() {
        this.setState(this.reduceSelectAll());
    }

    deselectAll() {
        this.setState(this.reduceDeselectAll());
    }

    toggleSelectMode() {
        let newState = {
            ...this.state,
            listMode: (this.state.listMode === 'list') ? 'select' : 'list',
            contextItem: null,
        };
        if (newState.listMode === 'list') {
            newState = this.reduceDeselectAll(newState);
        }

        this.setState(newState);
    }

    startLoading() {
        if (this.state.loading) {
            return;
        }

        this.setState({ ...this.state, loading: true });
    }

    stopLoading() {
        if (!this.state.loading) {
            return;
        }

        this.setState({ ...this.state, loading: false });
    }

    setRenderTime() {
        this.setState({ ...this.state, renderTime: Date.now() });
    }

    getVisibleSelectedItems(state = this.state) {
        return state.items.visible.filter((item) => item.selected);
    }

    getHiddenSelectedItems(state = this.state) {
        return state.items.hidden.filter((item) => item.selected);
    }

    getSelectedIds(state = this.state) {
        const selArr = this.getVisibleSelectedItems(state);
        const hiddenSelArr = this.getHiddenSelectedItems(state);
        return selArr.concat(hiddenSelArr).map((item) => item.id);
    }

    getContextIds(state = this.state) {
        if (state.listMode === 'list') {
            return asArray(state.contextItem);
        }

        return this.getSelectedIds(state);
    }

    async showItems(value = true) {
        if (this.state.loading) {
            return;
        }

        const ids = this.getContextIds();
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
        if (this.state.loading) {
            return;
        }

        const ids = this.getContextIds();
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

            this.setState({
                ...this.state,
                items: {
                    visible: PersonList.create(window.app.model.visiblePersons),
                    hidden: PersonList.create(window.app.model.hiddenPersons),
                },
                listMode: 'list',
                contextItem: null,
            });
        } catch (e) {
            window.app.createMessage(e.message, 'msg_error');
        }

        this.stopLoading();
        this.setRenderTime();
    }

    /** Show person(s) delete confirmation popup */
    confirmDelete() {
        const ids = this.getContextIds();
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

    renderTilesList(persons, listMode) {
        return persons.map((person) => Tile.create({
            type: 'button',
            attrs: { 'data-id': person.id },
            title: person.name,
            selected: person.selected,
            selectMode: listMode === 'select',
        }));
    }

    renderContextMenu(state) {
        if (state.listMode !== 'list') {
            this.contextMenu.detach();
            return;
        }

        const { contextItem } = state;
        if (!contextItem) {
            return;
        }
        const person = window.app.model.persons.getItem(contextItem);
        if (!person) {
            return;
        }

        const tile = document.querySelector(`.tile[data-id="${person.id}"]`);
        if (!tile) {
            return;
        }

        if (this.contextMenu.menuList.parentNode !== tile) {
            PopupMenu.hideActive();
            this.contextMenu.attachTo(tile);
            this.contextMenu.toggleMenu();
        }

        const { baseURL } = window.app;
        this.ctxUpdateBtn.setURL(`${baseURL}persons/update/${person.id}`);
        this.ctxShowBtn.show(!person.isVisible());
        this.ctxHideBtn.show(person.isVisible());
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

        const selectModeTitle = (isSelectMode) ? 'Cancel' : 'Select';
        this.selectModeBtn.setTitle(selectModeTitle);
        this.selectModeBtn.setIcon((isSelectMode) ? null : 'select');
        show(this.separator1, isSelectMode);

        this.selectAllBtn.show(isSelectMode && itemsCount > 0 && totalSelCount < itemsCount);
        this.deselectAllBtn.show(isSelectMode && itemsCount > 0 && totalSelCount > 0);
        show(this.separator2, isSelectMode);

        this.showBtn.show(hiddenSelCount > 0);
        this.hideBtn.show(selCount > 0);
        this.deleteBtn.show(totalSelCount > 0);
    }

    render(state) {
        if (!state) {
            throw new Error('Invalid state');
        }

        if (state.loading) {
            this.loadingIndicator.show();
        }

        // Render visible persons
        const visibleTiles = this.renderTilesList(state.items.visible, state.listMode);
        removeChilds(this.tilesContainer);
        if (visibleTiles.length > 0) {
            visibleTiles.forEach((item) => this.tilesContainer.appendChild(item.elem));
        } else {
            const noDataMsg = createElement('span', {
                props: { className: NO_DATA_CLASS, textContent: MSG_NO_PERSONS },
            });
            this.tilesContainer.append(noDataMsg);
        }

        // Render hidden persons
        const hiddenTiles = this.renderTilesList(state.items.hidden, state.listMode);
        removeChilds(this.hiddenTilesContainer);
        const hiddenItemsAvailable = (hiddenTiles.length > 0);
        if (hiddenItemsAvailable) {
            hiddenTiles.forEach((item) => this.hiddenTilesContainer.appendChild(item.elem));
        }
        show(this.hiddenTilesHeading, hiddenItemsAvailable);

        this.renderContextMenu(state);
        this.renderMenu(state);

        this.tilesContainer.dataset.time = state.renderTime;

        if (!state.loading) {
            this.loadingIndicator.hide();
        }
    }
}

window.app = new Application(window.appProps);
window.app.createView(PersonListView);
