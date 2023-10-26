import 'jezvejs/style';
import {
    createElement,
    insertAfter,
    show,
} from '@jezvejs/dom';
import { Button } from 'jezvejs/Button';
import { MenuButton } from 'jezvejs/MenuButton';
import { createStore } from 'jezvejs/Store';
import { SortableListContainer } from 'jezvejs/SortableListContainer';

// Application
import {
    __,
    getApplicationURL,
    getHideableContextIds,
} from '../../utils/utils.js';
import { App } from '../../Application/App.js';
import '../../Application/Application.scss';
import { AppView } from '../../Components/Layout/AppView/AppView.js';

// Models
import { CurrencyList } from '../../Models/CurrencyList.js';
import { PersonList } from '../../Models/PersonList.js';

// Common components
import { ConfirmDialog } from '../../Components/Common/ConfirmDialog/ConfirmDialog.js';
import { LoadingIndicator } from '../../Components/Common/LoadingIndicator/LoadingIndicator.js';
import { ExportDialog } from '../../Components/Transaction/ExportDialog/ExportDialog.js';
import { Heading } from '../../Components/Layout/Heading/Heading.js';
import { ListCounter } from '../../Components/List/ListCounter/ListCounter.js';
import { Tile } from '../../Components/Common/Tile/Tile.js';
import { NoDataMessage } from '../../Components/Common/NoDataMessage/NoDataMessage.js';

// Local components
import { PersonListContextMenu } from './components/ContextMenu/PersonListContextMenu.js';
import { PersonListMainMenu } from './components/MainMenu/PersonListMainMenu.js';
import { PersonDetails } from './components/PersonDetails/PersonDetails.js';

import { actions, createList, reducer } from './reducer.js';
import {
    deleteItems,
    requestItem,
    sendChangePosRequest,
    setListMode,
} from './actions.js';
import { getSelectedIds } from './helpers.js';
import './PersonListView.scss';

/**
 * List of persons view
 */
class PersonListView extends AppView {
    constructor(...args) {
        super(...args);

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
            showDeleteConfirmDialog: false,
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
            animated: true,
            vertical: false,
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
            onClick: () => this.store.dispatch(setListMode('list')),
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
            this.store.dispatch(requestItem());
        }
    }

    showMenu() {
        this.store.dispatch(actions.showMenu());
    }

    hideMenu() {
        this.store.dispatch(actions.hideMenu());
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

    closeDetails() {
        this.store.dispatch(actions.closeDetails());
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

        this.store.dispatch(sendChangePosRequest(item.id, pos));
    }

    renderDeleteConfirmDialog(state, prevState) {
        if (state.showDeleteConfirmDialog === prevState.showDeleteConfirmDialog) {
            return;
        }

        if (!state.showDeleteConfirmDialog) {
            return;
        }

        const ids = getHideableContextIds(state);
        if (ids.length === 0) {
            return;
        }

        const multiple = (ids.length > 1);
        ConfirmDialog.create({
            id: 'delete_warning',
            title: (multiple) ? __('persons.deleteMultiple') : __('persons.delete'),
            content: (multiple) ? __('persons.deleteMultipleMessage') : __('persons.deleteMessage'),
            onConfirm: () => this.store.dispatch(deleteItems()),
            onReject: () => this.store.dispatch(actions.hideDeleteConfirmDialog()),
        });
    }

    renderContextMenu(state) {
        if (!state.showContextMenu && !this.contextMenu) {
            return;
        }

        if (!this.contextMenu) {
            this.contextMenu = PersonListContextMenu.create({
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
                dispatch: (action) => this.store.dispatch(action),
                attachTo: this.menuButton.elem,
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
            items: state.items.visible,
            listMode: state.listMode,
            renderTime: Date.now(),
        }));

        // Hidden persons
        this.hiddenTiles.setState((hiddenState) => ({
            ...hiddenState,
            items: state.items.hidden,
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
        this.renderDeleteConfirmDialog(state, prevState);
        this.renderExportDialog(state, prevState);

        if (!state.loading) {
            this.loadingIndicator.hide();
        }
    }
}

App.createView(PersonListView);
