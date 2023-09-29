import 'jezvejs/style';
import {
    createElement,
    insertAfter,
    isFunction,
    show,
} from 'jezvejs';
import { Button } from 'jezvejs/Button';
import { MenuButton } from 'jezvejs/MenuButton';
import { createStore } from 'jezvejs/Store';
import { SortableListContainer } from 'jezvejs/SortableListContainer';

// Application
import {
    listData,
    SORT_BY_CREATEDATE_ASC,
    SORT_BY_CREATEDATE_DESC,
    SORT_BY_NAME_ASC,
    SORT_BY_NAME_DESC,
    SORT_MANUALLY,
    __,
    getApplicationURL,
    getHideableContextIds,
} from '../../utils/utils.js';
import { App } from '../../Application/App.js';
import '../../Application/Application.scss';
import { AppView } from '../../Components/AppView/AppView.js';
import { API } from '../../API/index.js';

// Models
import { CurrencyList } from '../../Models/CurrencyList.js';
import { PersonList } from '../../Models/PersonList.js';

// Common components
import { ConfirmDialog } from '../../Components/ConfirmDialog/ConfirmDialog.js';
import { LoadingIndicator } from '../../Components/LoadingIndicator/LoadingIndicator.js';
import { ExportDialog } from '../../Components/ExportDialog/ExportDialog.js';
import { Heading } from '../../Components/Heading/Heading.js';
import { ListCounter } from '../../Components/ListCounter/ListCounter.js';
import { Tile } from '../../Components/Tile/Tile.js';
import { NoDataMessage } from '../../Components/NoDataMessage/NoDataMessage.js';

// Local components
import { PersonListContextMenu } from './components/ContextMenu/PersonListContextMenu.js';
import { PersonListMainMenu } from './components/MainMenu/PersonListMainMenu.js';
import { PersonDetails } from './components/PersonDetails/PersonDetails.js';

import { actions, createList, reducer } from './reducer.js';
import { getPersonsSortMode, getSelectedIds } from './helpers.js';
import './PersonListView.scss';

/**
 * List of persons view
 */
class PersonListView extends AppView {
    constructor(...args) {
        super(...args);

        this.menuActions = {
            selectModeBtn: () => this.setListMode('select'),
            sortModeBtn: () => this.setListMode('sort'),
            sortByNameBtn: () => this.toggleSortByName(),
            sortByDateBtn: () => this.toggleSortByDate(),
            selectAllBtn: () => this.selectAll(),
            deselectAllBtn: () => this.deselectAll(),
            exportBtn: () => this.showExportDialog(),
            showBtn: () => this.showItems(true),
            hideBtn: () => this.showItems(false),
            deleteBtn: () => this.confirmDelete(),
        };

        this.contextMenuActions = {
            ctxDetailsBtn: () => this.showDetails(),
            ctxExportBtn: () => this.showExportDialog(),
            ctxShowBtn: () => this.showItems(),
            ctxHideBtn: () => this.showItems(false),
            ctxDeleteBtn: () => this.confirmDelete(),
        };

        App.loadModel(CurrencyList, 'currency', App.props.currency);
        App.loadModel(PersonList, 'persons', App.props.persons);
        App.checkPersonModels();

        const { visiblePersons, hiddenPersons } = App.model;
        const { settings } = App.model.profile;
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
            showContextMenu: false,
            contextItem: null,
            showExportDialog: false,
            exportFilter: null,
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
            PlaceholderComponent: NoDataMessage,
            getPlaceholderProps: () => ({ title: __('persons.noData') }),
            onItemClick: (id, e) => this.onItemClick(id, e),
            onSort: (info) => this.onSort(info),
        };

        this.loadElementsByIds([
            'heading',
            'contentContainer',
            'hiddenTilesHeading',
            'itemInfo',
        ]);

        this.heading = Heading.fromElement(this.heading, {
            title: __('persons.listTitle'),
        });

        this.createBtn = Button.create({
            id: 'createBtn',
            type: 'link',
            className: 'circle-btn',
            icon: 'plus',
            url: `${App.baseURL}persons/create/`,
        });
        this.heading.actionsContainer.prepend(this.createBtn.elem);

        // List header
        // Counters
        this.itemsCounter = ListCounter.create({
            title: __('list.itemsCounter'),
            className: 'items-counter',
        });
        this.hiddenCounter = ListCounter.create({
            title: __('list.hiddenItemsCounter'),
            className: 'hidden-counter',
        });
        this.selectedCounter = ListCounter.create({
            title: __('list.selectedItemsCounter'),
            className: 'selected-counter',
        });

        const counters = createElement('div', {
            props: { className: 'counters' },
            children: [
                this.itemsCounter.elem,
                this.hiddenCounter.elem,
                this.selectedCounter.elem,
            ],
        });

        this.contentHeader = createElement('header', {
            props: { className: 'content-header' },
            children: counters,
        });
        this.contentContainer.before(this.contentHeader);

        // Visible persons
        this.visibleTiles = SortableListContainer.create({
            ...listProps,
            sortGroup: 'visiblePersons',
        });
        this.contentContainer.prepend(this.visibleTiles.elem);

        // Hidden persons
        this.hiddenTiles = SortableListContainer.create({
            ...listProps,
            sortGroup: 'hiddenPersons',
        });
        this.contentContainer.append(this.hiddenTiles.elem);

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

    onMenuClick(item) {
        this.menu.hideMenu();

        const menuAction = this.menuActions[item];
        if (isFunction(menuAction)) {
            menuAction();
        }
    }

    onContextMenuClick(item) {
        this.hideContextMenu();

        const menuAction = this.contextMenuActions[item];
        if (isFunction(menuAction)) {
            menuAction();
        }
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

    showDetails() {
        this.store.dispatch(actions.showDetails());

        this.requestItem();
    }

    closeDetails() {
        this.store.dispatch(actions.closeDetails());
    }

    showExportDialog() {
        const state = this.store.getState();
        const ids = getHideableContextIds(state);
        if (ids.length === 0) {
            return;
        }

        this.store.dispatch(actions.showExportDialog(ids));
    }

    hideExportDialog() {
        this.store.dispatch(actions.hideExportDialog());
    }

    showContextMenu(itemId) {
        this.store.dispatch(actions.showContextMenu(itemId));
    }

    hideContextMenu() {
        this.store.dispatch(actions.hideContextMenu());
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

    async showItems(value = true) {
        const state = this.store.getState();
        if (state.loading) {
            return;
        }

        const ids = getHideableContextIds(state);
        if (ids.length === 0) {
            return;
        }

        this.startLoading();

        try {
            const request = this.prepareRequest({ id: ids });
            const response = (value)
                ? await API.person.show(request)
                : await API.person.hide(request);

            const data = this.getListDataFromResponse(response);
            this.setListData(data);

            App.updateProfileFromResponse(response);
        } catch (e) {
            App.createErrorNotification(e.message);
        }

        this.stopLoading();
    }

    async deleteItems() {
        const state = this.store.getState();
        if (state.loading) {
            return;
        }

        const ids = getHideableContextIds(state);
        if (ids.length === 0) {
            return;
        }

        this.startLoading();

        try {
            const request = this.prepareRequest({ id: ids });
            const response = await API.person.del(request);

            const data = this.getListDataFromResponse(response);
            this.setListData(data);

            App.updateProfileFromResponse(response);
        } catch (e) {
            App.createErrorNotification(e.message);
        }

        this.stopLoading();
    }

    async requestList(options = {}) {
        const { keepState = false } = options;

        this.startLoading();

        try {
            const request = this.getListRequest();
            const { data } = await API.person.list(request);
            this.setListData(data, keepState);
        } catch (e) {
            App.createErrorNotification(e.message);
        }

        this.stopLoading();
    }

    getListRequest() {
        return { visibility: 'all' };
    }

    prepareRequest(data) {
        return {
            ...data,
            returnState: {
                persons: this.getListRequest(),
                profile: {},
            },
        };
    }

    getListDataFromResponse(response) {
        return response?.data?.state?.persons?.data;
    }

    setListData(data, keepState = false) {
        App.model.persons.setData(data);
        App.model.visiblePersons = null;
        App.checkPersonModels();

        this.store.dispatch(actions.listRequestLoaded(keepState));
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
            App.createErrorNotification(e.message);
        }
    }

    onSort(info) {
        const { persons } = App.model;
        const item = persons.getItem(info.itemId);
        const prevItem = persons.getItem(info.prevId);
        const nextItem = persons.getItem(info.nextId);
        if (!prevItem && !nextItem) {
            return;
        }

        let pos = null;
        if (prevItem) {
            pos = (item.pos < prevItem.pos) ? prevItem.pos : (prevItem.pos + 1);
        } else {
            pos = nextItem.pos;
        }

        this.sendChangePosRequest(item.id, pos);
    }

    /**
     * Sent API request to server to change position of person
     * @param {number} id - identifier of item to change position
     * @param {number} pos  - new position of item
     */
    async sendChangePosRequest(id, pos) {
        this.startLoading();

        try {
            const request = this.prepareRequest({ id, pos });
            const response = await API.person.setPos(request);

            const data = this.getListDataFromResponse(response);
            this.setListData(data, true);

            App.updateProfileFromResponse(response);
        } catch (e) {
            this.cancelPosChange();
        }

        this.stopLoading();
    }

    /**
     * Cancel local changes on position update fail
     */
    cancelPosChange() {
        this.render(this.store.getState());

        App.createErrorNotification(__('persons.errors.changePos'));
    }

    toggleSortByName() {
        const current = getPersonsSortMode();
        const sortMode = (current === SORT_BY_NAME_ASC)
            ? SORT_BY_NAME_DESC
            : SORT_BY_NAME_ASC;

        this.requestSortMode(sortMode);
    }

    toggleSortByDate() {
        const current = getPersonsSortMode();
        const sortMode = (current === SORT_BY_CREATEDATE_ASC)
            ? SORT_BY_CREATEDATE_DESC
            : SORT_BY_CREATEDATE_ASC;

        this.requestSortMode(sortMode);
    }

    async requestSortMode(sortMode) {
        const { settings } = App.model.profile;
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
            App.createErrorNotification(e.message);
        }

        this.stopLoading();
    }

    /** Show person(s) delete confirmation popup */
    confirmDelete() {
        const state = this.store.getState();
        const ids = getHideableContextIds(state);
        if (ids.length === 0) {
            return;
        }

        const multiple = (ids.length > 1);
        ConfirmDialog.create({
            id: 'delete_warning',
            title: (multiple) ? __('persons.deleteMultiple') : __('persons.delete'),
            content: (multiple) ? __('persons.deleteMultipleMessage') : __('persons.deleteMessage'),
            onConfirm: () => this.deleteItems(),
        });
    }

    renderContextMenu(state) {
        if (!state.showContextMenu && !this.contextMenu) {
            return;
        }

        if (!this.contextMenu) {
            this.contextMenu = PersonListContextMenu.create({
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
        const itemsCount = state.items.visible.length + state.items.hidden.length;
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
            this.menu = PersonListMainMenu.create({
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

        const { persons } = App.model;
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
        const itemPart = (state.detailsId) ? state.detailsId : '';
        return getApplicationURL(`persons/${itemPart}`);
    }

    renderHistory(state, prevState) {
        if (state.detailsId === prevState?.detailsId) {
            return;
        }

        const url = this.getURL(state);
        const pageTitle = `${__('appName')} | ${__('persons.listTitle')}`;
        window.history.replaceState({}, pageTitle, url);
    }

    renderCounters(state, prevState) {
        if (
            state.items === prevState?.items
            && state.listMode === prevState?.listMode
        ) {
            return;
        }

        const itemsCount = state.items.visible.length + state.items.hidden.length;
        const hiddenCount = state.items.hidden.length;
        const isSelectMode = (state.listMode === 'select');
        const selected = (isSelectMode) ? getSelectedIds(state) : [];

        this.itemsCounter.setContent(itemsCount.toString());
        this.hiddenCounter.setContent(hiddenCount.toString());
        this.selectedCounter.show(isSelectMode);
        this.selectedCounter.setContent(selected.length.toString());
    }

    renderList(state) {
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

    renderExportDialog(state, prevState) {
        if (state.showExportDialog === prevState?.showExportDialog) {
            return;
        }

        if (!state.showExportDialog) {
            this.exportDialog?.hide();
            return;
        }

        if (!this.exportDialog) {
            this.exportDialog = ExportDialog.create({
                filter: state.exportFilter,
                onCancel: () => this.hideExportDialog(),
            });
        } else {
            this.exportDialog.setFilter(state.exportFilter);
        }

        this.exportDialog.show();
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
        this.renderContextMenu(state, prevState);
        this.renderMenu(state, prevState);
        this.renderDetails(state, prevState);
        this.renderExportDialog(state, prevState);

        if (!state.loading) {
            this.loadingIndicator.hide();
        }
    }
}

App.createView(PersonListView);
