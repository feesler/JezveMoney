import 'jezvejs/style';
import {
    asArray,
    insertAfter,
    isFunction,
    show,
} from 'jezvejs';
import { Button } from 'jezvejs/Button';
import { MenuButton } from 'jezvejs/MenuButton';
import { PopupMenu } from 'jezvejs/PopupMenu';
import { SortableListContainer } from 'jezvejs/SortableListContainer';
import {
    listData,
    getSortByDateIcon,
    getSortByNameIcon,
    SORT_BY_CREATEDATE_ASC,
    SORT_BY_CREATEDATE_DESC,
    SORT_BY_NAME_ASC,
    SORT_BY_NAME_DESC,
    SORT_MANUALLY,
    __,
} from '../../js/utils.js';
import { Application } from '../../js/Application.js';
import '../../css/app.scss';
import { View } from '../../js/View.js';
import { API } from '../../js/api/index.js';
import { CurrencyList } from '../../js/model/CurrencyList.js';
import { PersonList } from '../../js/model/PersonList.js';
import { ConfirmDialog } from '../../Components/ConfirmDialog/ConfirmDialog.js';
import { LoadingIndicator } from '../../Components/LoadingIndicator/LoadingIndicator.js';
import { Heading } from '../../Components/Heading/Heading.js';
import { PersonDetails } from './components/PersonDetails/PersonDetails.js';
import { Tile } from '../../Components/Tile/Tile.js';
import { createStore } from '../../js/store.js';
import { actions, createList, reducer } from './reducer.js';
import './style.scss';

/**
 * List of persons view
 */
class PersonListView extends View {
    constructor(...args) {
        super(...args);

        window.app.loadModel(CurrencyList, 'currency', window.app.props.currency);
        window.app.loadModel(PersonList, 'persons', window.app.props.persons);
        window.app.checkPersonModels();

        const { visiblePersons, hiddenPersons } = window.app.model;
        const { settings } = window.app.model.profile;
        const sortMode = settings.sort_persons;

        const initialState = {
            ...this.props,
            detailsItem: null,
            items: {
                visible: createList(visiblePersons, sortMode),
                hidden: createList(hiddenPersons, sortMode),
            },
            loading: false,
            listMode: 'list',
            showMenu: false,
            sortMode,
            contextItem: null,
            renderTime: Date.now(),
        };

        this.store = createStore(reducer, { initialState });
    }

    /**
     * View initialization
     */
    onStart() {
        const listProps = {
            ItemComponent: Tile,
            getItemProps: (person, { listMode }) => ({
                id: person.id,
                type: 'button',
                title: person.name,
                selected: person.selected ?? false,
                listMode,
            }),
            className: 'tiles',
            itemSelector: Tile.selector,
            itemSortSelector: Tile.sortSelector,
            selectModeClass: 'tiles_select',
            sortModeClass: 'tiles_sort',
            placeholderClass: 'tile_placeholder',
            listMode: 'list',
            noItemsMessage: __('PERSONS_NO_DATA'),
            onItemClick: (id, e) => this.onItemClick(id, e),
            onSort: (id, pos) => this.sendChangePosRequest(id, pos),
        };

        this.loadElementsByIds([
            'contentHeader',
            'itemsCount',
            'hiddenCount',
            'selectedCounter',
            'selItemsCount',
            'heading',
            'contentContainer',
            'hiddenTilesHeading',
            'itemInfo',
        ]);

        this.heading = Heading.fromElement(this.heading, {
            title: __('PERSONS'),
        });

        this.createBtn = Button.create({
            id: 'createBtn',
            type: 'link',
            className: 'circle-btn',
            icon: 'plus',
            url: `${window.app.baseURL}persons/create/`,
        });
        this.heading.actionsContainer.prepend(this.createBtn.elem);

        this.visibleTiles = SortableListContainer.create({
            ...listProps,
            sortGroup: 'visiblePersons',
        });
        this.contentContainer.prepend(this.visibleTiles.elem);

        this.hiddenTiles = SortableListContainer.create({
            ...listProps,
            sortGroup: 'hiddenPersons',
        });
        this.contentContainer.append(this.hiddenTiles.elem);

        this.listModeBtn = Button.create({
            id: 'listModeBtn',
            className: 'action-button',
            title: __('DONE'),
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

    createMenu() {
        if (this.menu) {
            return;
        }

        this.menu = PopupMenu.create({
            id: 'listMenu',
            attachTo: this.menuButton.elem,
            onClose: () => this.hideMenu(),
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
                onClick: () => this.onMenuClick('sortByNameBtn'),
            }, {
                id: 'sortByDateBtn',
                title: __('SORT_BY_DATE'),
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
                id: 'exportBtn',
                type: 'link',
                icon: 'export',
                title: __('TR_EXPORT_CSV'),
                onClick: () => this.onMenuClick('exportBtn'),
            }, {
                id: 'showBtn',
                icon: 'show',
                title: __('SHOW'),
                onClick: () => this.onMenuClick('showBtn'),
            }, {
                id: 'hideBtn',
                icon: 'hide',
                title: __('HIDE'),
                onClick: () => this.onMenuClick('hideBtn'),
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
            showBtn: () => this.showItems(true),
            hideBtn: () => this.showItems(false),
            deleteBtn: () => this.confirmDelete(),
        };
    }

    createContextMenu() {
        if (this.contextMenu) {
            return;
        }

        this.contextMenu = PopupMenu.create({
            id: 'contextMenu',
            fixed: false,
            onClose: () => this.showContextMenu(null),
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
                id: 'ctxExportBtn',
                type: 'link',
                icon: 'export',
                title: __('TR_EXPORT_CSV'),
            }, {
                id: 'ctxShowBtn',
                icon: 'show',
                title: __('SHOW'),
                onClick: () => this.showItems(),
            }, {
                id: 'ctxHideBtn',
                icon: 'hide',
                title: __('HIDE'),
                onClick: () => this.showItems(false),
            }, {
                id: 'ctxDeleteBtn',
                icon: 'del',
                title: __('DELETE'),
                onClick: () => this.confirmDelete(),
            }],
        });
    }

    showMenu() {
        this.store.dispatch(actions.showMenu());
    }

    hideMenu() {
        this.store.dispatch(actions.hideMenu());
    }

    onMenuClick(item) {
        this.menu.hideMenu();

        const menuAction = this.menuActions[item];
        if (!isFunction(menuAction)) {
            return;
        }

        menuAction();
    }

    onItemClick(itemId, e) {
        const id = parseInt(itemId, 10);
        if (!id) {
            return;
        }

        const { listMode } = this.store.getState();
        if (listMode === 'list') {
            this.showContextMenu(id);
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
        this.store.dispatch(actions.changeListMode(listMode));

        const state = this.store.getState();
        if (listMode === 'sort' && state.sortMode !== SORT_MANUALLY) {
            await this.requestSortMode(SORT_MANUALLY);
        }
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
            window.app.createErrorNotification(e.message);
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
            window.app.createErrorNotification(e.message);
            this.stopLoading();
        }
    }

    async requestList(options = {}) {
        const { keepState = false } = options;

        try {
            const { data } = await API.person.list({ visibility: 'all' });
            window.app.model.persons.setData(data);
            window.app.model.visiblePersons = null;
            window.app.checkPersonModels();

            this.store.dispatch(actions.listRequestLoaded(keepState));
        } catch (e) {
            window.app.createErrorNotification(e.message);
        }

        this.stopLoading();
    }

    async requestItem() {
        const state = this.store.getState();
        if (!state.detailsId) {
            return;
        }

        try {
            const { data } = await API.person.read(state.detailsId);
            const [item] = data;

            this.store.dispatch(actions.itemDetailsLoaded(item));
        } catch (e) {
            window.app.createErrorNotification(e.message);
        }
    }

    /**
     * Sent API request to server to change position of person
     * @param {number} itemId - identifier of item to change position
     * @param {number} newPos  - new position of item
     */
    async sendChangePosRequest(itemId, newPos) {
        this.startLoading();

        try {
            await API.person.setPos(itemId, newPos);
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

        window.app.createErrorNotification(__('ERR_PERSON_CHANGE_POS'));
    }

    getSortMode() {
        return window.app.model.profile.settings.sort_persons;
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
        if (settings.sort_persons === sortMode) {
            return;
        }

        this.startLoading();

        try {
            await API.profile.updateSettings({
                sort_persons: sortMode,
            });
            settings.sort_persons = sortMode;

            this.store.dispatch(actions.changeSortMode(sortMode));
        } catch (e) {
            window.app.createErrorNotification(e.message);
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
            title: (multiple) ? __('PERSON_DELETE_MULTIPLE') : __('PERSON_DELETE'),
            content: (multiple) ? __('MSG_PERSON_DELETE_MULTIPLE') : __('MSG_PERSON_DELETE'),
            onConfirm: () => this.deleteItems(),
        });
    }

    /** Returns URL to export transaction of selected persons */
    getExportURL(selectedIds) {
        const ids = asArray(selectedIds);
        const res = new URL(`${window.app.baseURL}transactions/export/`);
        ids.forEach((id) => {
            res.searchParams.append('person_id[]', id);
        });
        return res;
    }

    renderContextMenu(state) {
        if (state.listMode !== 'list') {
            this.contextMenu?.detach();
            return;
        }
        const person = window.app.model.persons.getItem(state.contextItem);
        if (!person) {
            this.contextMenu?.detach();
            return;
        }
        const tile = document.querySelector(`.tile[data-id="${person.id}"]`);
        if (!tile) {
            this.contextMenu?.detach();
            return;
        }

        if (!this.contextMenu) {
            this.createContextMenu();
        }

        const { baseURL } = window.app;
        const { items } = this.contextMenu;
        items.ctxDetailsBtn.setURL(`${baseURL}persons/${person.id}`);
        items.ctxUpdateBtn.setURL(`${baseURL}persons/update/${person.id}`);

        const exportURL = this.getExportURL(person.id);
        items.ctxExportBtn.setURL(exportURL.toString());
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
        const isListMode = state.listMode === 'list';
        const isSelectMode = state.listMode === 'select';
        const isSortMode = state.listMode === 'sort';
        const sortMode = this.getSortMode();

        this.createBtn.show(isListMode);
        this.listModeBtn.show(!isListMode);

        this.menuButton.show(itemsCount > 0 && !isSortMode);

        if (!state.showMenu) {
            this.menu?.hideMenu();
            return;
        }

        const showFirstTime = !this.menu;
        this.createMenu();

        const { items } = this.menu;

        items.selectModeBtn.show(isListMode && itemsCount > 0);
        items.sortModeBtn.show(isListMode && itemsCount > 1);

        items.sortByNameBtn.setIcon(getSortByNameIcon(sortMode));
        items.sortByNameBtn.show(isListMode && itemsCount > 1);

        items.sortByDateBtn.setIcon(getSortByDateIcon(sortMode));
        items.sortByDateBtn.show(isListMode && itemsCount > 1);

        items.selectAllBtn.show(isSelectMode && itemsCount > 0 && totalSelCount < itemsCount);
        items.deselectAllBtn.show(isSelectMode && itemsCount > 0 && totalSelCount > 0);
        show(items.separator2, isSelectMode);

        items.exportBtn.show(isSelectMode && totalSelCount > 0);

        items.showBtn.show(hiddenSelCount > 0);
        items.hideBtn.show(selCount > 0);
        items.deleteBtn.show(totalSelCount > 0);

        if (totalSelCount > 0) {
            const selectedIds = this.getSelectedIds(state);
            const exportURL = this.getExportURL(selectedIds);
            items.exportBtn.setURL(exportURL.toString());
        }

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

        const { persons } = window.app.model;
        const item = state.detailsItem ?? persons.getItem(state.detailsId);
        if (!item) {
            throw new Error('Person not found');
        }

        if (!this.personDetails) {
            this.personDetails = PersonDetails.create({
                item,
                onClose: () => this.closeDetails(),
            });
            this.itemInfo.append(this.personDetails.elem);
        } else {
            this.personDetails.setItem(item);
        }

        show(this.itemInfo, true);
    }

    /** Returns URL for specified state */
    getURL(state) {
        const { baseURL } = window.app;
        const itemPart = (state.detailsId) ? state.detailsId : '';
        return new URL(`${baseURL}persons/${itemPart}`);
    }

    renderHistory(state, prevState) {
        if (state.detailsId === prevState?.detailsId) {
            return;
        }

        const url = this.getURL(state);
        const pageTitle = `${__('APP_NAME')} | ${__('PERSONS')}`;
        window.history.replaceState({}, pageTitle, url);
    }

    renderList(state) {
        // Counters
        const itemsCount = state.items.visible.length + state.items.hidden.length;
        this.itemsCount.textContent = itemsCount;
        this.hiddenCount.textContent = state.items.hidden.length;
        const isSelectMode = (state.listMode === 'select');
        show(this.selectedCounter, isSelectMode);
        const selected = (isSelectMode) ? this.getSelectedIds(state) : [];
        this.selItemsCount.textContent = selected.length;

        // Visible persons
        this.visibleTiles.setState((visibleState) => ({
            ...visibleState,
            items: listData(state.items.visible),
            listMode: state.listMode,
            renderTime: Date.now(),
        }));

        // Hidden persons
        this.hiddenTiles.setState((hiddenState) => ({
            ...hiddenState,
            items: listData(state.items.hidden),
            listMode: state.listMode,
        }));

        const hiddenItemsAvailable = (state.items.hidden.length > 0);
        this.hiddenTiles.show(hiddenItemsAvailable);
        show(this.hiddenTilesHeading, hiddenItemsAvailable);
    }

    render(state, prevState = {}) {
        if (!state) {
            throw new Error('Invalid state');
        }

        this.renderHistory(state, prevState);

        if (state.loading) {
            this.loadingIndicator.show();
        }

        this.renderList(state);
        this.renderContextMenu(state);
        this.renderMenu(state);
        this.renderDetails(state, prevState);

        if (!state.loading) {
            this.loadingIndicator.hide();
        }
    }
}

window.app = new Application(window.appProps);
window.app.createView(PersonListView);
