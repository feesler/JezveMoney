import 'jezvejs/style';
import {
    asArray,
    ge,
    insertAfter,
    show,
} from 'jezvejs';
import { Application } from '../../js/Application.js';
import '../../css/app.scss';
import { View } from '../../js/View.js';
import { API } from '../../js/api/index.js';
import { PersonList } from '../../js/model/PersonList.js';
import { ConfirmDialog } from '../../Components/ConfirmDialog/ConfirmDialog.js';
import { ListContainer } from '../../Components/ListContainer/ListContainer.js';
import { LoadingIndicator } from '../../Components/LoadingIndicator/LoadingIndicator.js';
import { PopupMenu } from '../../Components/PopupMenu/PopupMenu.js';
import { Tile } from '../../Components/Tile/Tile.js';
import './style.scss';

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
        const listProps = {
            ItemComponent: Tile,
            getItemProps: (person, state) => ({
                type: 'button',
                attrs: { 'data-id': person.id },
                className: 'tiles',
                title: person.name,
                selected: person.selected,
                selectMode: state.listMode === 'select',
            }),
            className: 'tiles',
            itemSelector: '.tile',
            listMode: this.state.listMode,
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
            attached: true,
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

    onItemClick(itemId, e) {
        if (this.state.listMode === 'list') {
            this.showContextMenu(itemId);
        } else if (this.state.listMode === 'select') {
            if (e?.target?.closest('.checkbox')) {
                e.preventDefault();
            }

            this.toggleSelectItem(itemId);
        }
    }

    showContextMenu(itemId) {
        if (this.state.contextItem === itemId) {
            return;
        }

        this.setState({ ...this.state, contextItem: itemId });
    }

    getPersonById(id) {
        return window.app.model.persons.getItem(id);
    }

    toggleSelectItem(itemId) {
        const person = this.getPersonById(itemId);
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

    renderContextMenu(state) {
        if (state.listMode !== 'list') {
            this.contextMenu.detach();
            return;
        }
        const person = this.getPersonById(state.contextItem);
        if (!person) {
            return;
        }
        const tile = document.querySelector(`.tile[data-id="${person.id}"]`);
        if (!tile) {
            return;
        }

        const { baseURL } = window.app;
        this.ctxUpdateBtn.setURL(`${baseURL}persons/update/${person.id}`);
        this.ctxShowBtn.show(!person.isVisible());
        this.ctxHideBtn.show(person.isVisible());

        if (this.contextMenu.menuList.parentNode !== tile) {
            PopupMenu.hideActive();
            this.contextMenu.attachTo(tile);
            this.contextMenu.toggleMenu();
        }
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

        const selectModeTitle = (isSelectMode) ? 'Done' : 'Select';
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
