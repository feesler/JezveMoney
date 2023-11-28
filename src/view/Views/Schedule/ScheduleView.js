import 'jezvejs/style';
import { createElement } from '@jezvejs/dom';
import { Button } from 'jezvejs/Button';
import { MenuButton } from 'jezvejs/MenuButton';
import { Offcanvas } from 'jezvejs/Offcanvas';
import { Paginator } from 'jezvejs/Paginator';
import { Spinner } from 'jezvejs/Spinner';
import { ListContainer } from 'jezvejs/ListContainer';
import { createStore } from 'jezvejs/Store';

// Application
import { App } from '../../Application/App.js';
import '../../Application/Application.scss';
import { AppView } from '../../Components/Layout/AppView/AppView.js';
import {
    __,
    getSelectedItems,
    getContextIds,
    getAbsoluteIndex,
} from '../../utils/utils.js';

// Models
import { CurrencyList } from '../../Models/CurrencyList.js';
import { AccountList } from '../../Models/AccountList.js';
import { PersonList } from '../../Models/PersonList.js';
import { CategoryList } from '../../Models/CategoryList.js';
import { Schedule } from '../../Models/Schedule.js';
import { ScheduledTransaction } from '../../Models/ScheduledTransaction.js';

// Common components
import { Heading } from '../../Components/Layout/Heading/Heading.js';
import { ConfirmDialog } from '../../Components/Common/ConfirmDialog/ConfirmDialog.js';
import { ListCounter } from '../../Components/List/ListCounter/ListCounter.js';
import { LoadingIndicator } from '../../Components/Common/LoadingIndicator/LoadingIndicator.js';
import { NoDataMessage } from '../../Components/Common/NoDataMessage/NoDataMessage.js';
import { ToggleDetailsButton } from '../../Components/List/ToggleDetailsButton/ToggleDetailsButton.js';

// Local components
import { ScheduleItemContextMenu } from './components/ContextMenu/ScheduleItemContextMenu.js';
import { ScheduleMainMenu } from './components/MainMenu/ScheduleMainMenu.js';
import { ScheduleListItem } from './components/ScheduleListItem/ScheduleListItem.js';
import { ScheduleItemDetails } from './components/ScheduleItemDetails/ScheduleItemDetails.js';

import {
    actions,
    reducer,
    createList,
    updateList,
} from './reducer.js';
import { deleteItems, setListMode } from './actions.js';
import './ScheduleView.scss';

/* CSS classes */
const LIST_CLASS = 'schedule-list';
const DETAILS_CLASS = 'schedule-list_details';
const SELECT_MODE_CLASS = 'list_select';

const SHOW_ON_PAGE = 10;

/**
 * List of scheduled transactions view
 */
class ScheduleView extends AppView {
    constructor(...args) {
        super(...args);

        App.loadModel(CurrencyList, 'currency', App.props.currency);
        App.loadModel(AccountList, 'accounts', App.props.accounts);
        App.loadModel(PersonList, 'persons', App.props.persons);
        App.loadModel(CategoryList, 'categories', App.props.categories);
        App.loadModel(Schedule, 'schedule', App.props.schedule);

        const initialState = {
            ...this.props,
            items: createList(App.model.schedule),
            pagination: {
                onPage: SHOW_ON_PAGE,
                page: 1,
                range: 1,
                pagesCount: 0,
                total: 0,
            },
            loading: false,
            isLoadingMore: false,
            listMode: 'list',
            showDeleteConfirmDialog: false,
            showMenu: false,
            showContextMenu: false,
            contextItem: null,
            renderTime: Date.now(),
        };
        updateList(initialState);

        this.store = createStore(reducer, { initialState });
    }

    /**
     * View initialization
     */
    onStart() {
        this.loadElementsByIds([
            'heading',
            'contentContainer',
        ]);

        this.heading = Heading.fromElement(this.heading, {
            title: __('schedule.listTitle'),
        });

        // Scheduled transaction details
        this.itemInfo = Offcanvas.create({
            placement: 'right',
            className: 'schedule-item-details',
            onClosed: () => this.closeDetails(),
        });

        this.createBtn = Button.create({
            id: 'createBtn',
            type: 'link',
            className: 'circle-btn',
            icon: 'plus',
            url: `${App.baseURL}schedule/create/`,
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

        // Toggle details mode button
        this.modeSelector = ToggleDetailsButton.create({
            onChange: (mode) => this.onChangeMode(mode),
        });

        const contentHeader = createElement('header', {
            props: { className: 'content-header' },
            children: createElement('div', {
                props: { className: 'list-header' },
                children: [counters, this.modeSelector.elem],
            }),
        });
        this.contentContainer.before(contentHeader);

        // Schedule list
        this.scheduleList = ListContainer.create({
            ItemComponent: ScheduleListItem,
            getItemProps: (item, state) => ({
                item: ScheduledTransaction.create(item),
                selected: item.selected,
                listMode: state.listMode,
                mode: state.mode,
                showControls: (state.listMode === 'list'),
            }),
            isListChanged: (state, prevState) => (
                state.items !== prevState.items
                || state.mode !== prevState.mode
                || state.listMode !== prevState.listMode
                || state.showControls !== prevState.showControls
            ),
            getItemById: (id) => this.getItemById(id),
            className: LIST_CLASS,
            itemSelector: ScheduleListItem.selector,
            selectModeClass: SELECT_MODE_CLASS,
            placeholderClass: 'list-item_placeholder',
            listMode: 'list',
            PlaceholderComponent: NoDataMessage,
            getPlaceholderProps: () => ({ title: __('schedule.noData') }),
            onItemClick: (id, e) => this.onItemClick(id, e),
        });

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

        this.contentContainer.append(
            this.scheduleList.elem,
            this.loadingIndicator.elem,
        );

        // 'Show more' button
        this.spinner = Spinner.create({ className: 'request-spinner' });
        this.spinner.hide();
        this.showMoreBtn = Button.create({
            className: 'show-more-btn',
            title: __('actions.showMore'),
            onClick: (e) => this.showMore(e),
        });

        // Paginator
        this.paginator = Paginator.create({
            arrows: true,
            breakLimit: 4,
            onChange: (page) => this.onChangePage(page),
        });

        const listFooter = document.querySelector('.list-footer');
        listFooter.append(this.showMoreBtn.elem, this.spinner.elem, this.paginator.elem);

        this.subscribeToStore(this.store);
    }

    showMenu() {
        this.store.dispatch(actions.showMenu());
    }

    hideMenu() {
        this.store.dispatch(actions.hideMenu());
    }

    showMore() {
        this.store.dispatch(actions.showMore());
        this.setRenderTime();
    }

    onChangePage(page) {
        this.store.dispatch(actions.changePage(page));
        this.setRenderTime();
    }

    onChangeMode(mode) {
        const state = this.store.getState();
        if (state.mode === mode) {
            return;
        }

        this.store.dispatch(actions.toggleMode());
        this.setRenderTime();
    }

    getItemById(itemId) {
        return App.model.schedule.getItem(itemId);
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

    showDetails() {
        this.store.dispatch(actions.showDetails());
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
    }

    selectAll() {
        this.store.dispatch(actions.selectAllItems());
    }

    deselectAll() {
        this.store.dispatch(actions.deselectAllItems());
    }

    /** Updates render time */
    setRenderTime() {
        this.store.dispatch(actions.setRenderTime());
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

        const multiple = (ids.length > 1);
        ConfirmDialog.create({
            id: 'delete_warning',
            title: (multiple) ? __('schedule.deleteMultiple') : __('schedule.delete'),
            content: (multiple) ? __('schedule.deleteMultipleMessage') : __('schedule.deleteMessage'),
            onConfirm: () => this.store.dispatch(deleteItems()),
            onReject: () => this.store.dispatch(actions.hideDeleteConfirmDialog()),
        });
    }

    renderContextMenu(state) {
        if (!state.showContextMenu && !this.contextMenu) {
            return;
        }

        if (!this.contextMenu) {
            this.contextMenu = ScheduleItemContextMenu.create({
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

        this.createBtn.show(isListMode);
        this.listModeBtn.show(!isListMode);
        this.menuButton.show(itemsCount > 0);

        if (!state.showMenu && !this.menu) {
            return;
        }

        const showFirstTime = !this.menu;
        if (!this.menu) {
            this.menu = ScheduleMainMenu.create({
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
            this.itemInfo.close();
            return;
        }

        const { schedule } = App.model;
        const item = state.detailsItem ?? schedule.getItem(state.detailsId);
        if (!item) {
            throw new Error('Scheduled transaction not found');
        }

        if (!this.scheduleItemDetails) {
            this.scheduleItemDetails = ScheduleItemDetails.create({
                item,
                onClose: () => this.closeDetails(),
            });
            this.itemInfo.setContent(this.scheduleItemDetails.elem);
        } else {
            this.scheduleItemDetails.setItem(item);
        }

        this.itemInfo.open();
    }

    /** Returns URL for specified state */
    getURL(state) {
        const itemPart = (state.detailsId) ? state.detailsId : '';
        const params = {};

        if (state.mode === 'details') {
            params.mode = 'details';
        }

        return App.getURL(`schedule/${itemPart}`, params);
    }

    renderHistory(state, prevState) {
        if (
            state.detailsId === prevState?.detailsId
            && state.mode === prevState?.mode
            && state.page === prevState?.page
        ) {
            return;
        }

        const url = this.getURL(state);
        const pageTitle = `${__('appName')} | ${__('schedule.listTitle')}`;
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
        const selected = (isSelectMode) ? getSelectedItems(state.items) : [];

        this.itemsCounter.setContent(App.formatNumber(itemsCount));
        this.selectedCounter.show(isSelectMode);
        this.selectedCounter.setContent(App.formatNumber(selected.length));
    }

    renderModeSelector(state, prevState) {
        if (
            state.items === prevState?.items
            && state.mode === prevState?.mode
        ) {
            return;
        }

        this.modeSelector.setURL(this.getURL(state));
        this.modeSelector.setSelection(state.mode);
        this.modeSelector.show(state.items.length > 0);
    }

    renderList(state, prevState) {
        if (
            state.items === prevState?.items
            && state.mode === prevState?.mode
            && state.listMode === prevState?.listMode
            && state.pagination.page === prevState?.pagination?.page
            && state.pagination.range === prevState?.pagination?.range
            && state.pagination.pagesCount === prevState?.pagination?.pagesCount
            && state.pagination.onPage === prevState?.pagination?.onPage
            && state.loading === prevState?.loading
            && state.isLoadingMore === prevState?.isLoadingMore
            && state.renderTime === prevState?.renderTime
        ) {
            return;
        }

        // Paginator
        const range = state.pagination.range ?? 1;
        const pageNum = state.pagination.page + range - 1;
        if (this.paginator) {
            this.paginator.show(state.items.length > 0);
            this.paginator.setState((paginatorState) => ({
                ...paginatorState,
                url: this.getURL(state),
                pagesCount: state.pagination.pagesCount,
                pageNum,
            }));
        }

        // 'Show more' button
        const loadingMore = state.loading && state.isLoadingMore;
        this.showMoreBtn.show(
            state.items.length > 0
            && pageNum < state.pagination.pagesCount
            && !loadingMore,
        );
        this.spinner.show(loadingMore);

        const firstItem = getAbsoluteIndex(0, state);
        const lastItem = firstItem + state.pagination.onPage * state.pagination.range;
        const items = state.items.slice(firstItem, lastItem);

        // List of scheduled transactions
        this.scheduleList.setState((listState) => ({
            ...listState,
            items,
            mode: state.mode,
            listMode: state.listMode,
            renderTime: state.renderTime,
        }));
        this.scheduleList.elem.classList.toggle(DETAILS_CLASS, state.mode === 'details');
    }

    render(state, prevState = {}) {
        if (!state) {
            throw new Error('Invalid state');
        }

        this.renderHistory(state, prevState);

        if (state.loading && !state.isLoadingMore) {
            this.loadingIndicator.show();
        }

        this.renderCounters(state, prevState);
        this.renderModeSelector(state, prevState);
        this.renderList(state, prevState);
        this.renderContextMenu(state, prevState);
        this.renderMenu(state, prevState);
        this.renderDetails(state, prevState);
        this.renderDeleteConfirmDialog(state, prevState);

        if (!state.loading) {
            this.loadingIndicator.hide();
        }
    }
}

App.createView(ScheduleView);
