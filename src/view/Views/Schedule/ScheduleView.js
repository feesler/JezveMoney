import 'jezvejs/style';
import {
    asArray,
    insertAfter,
    isFunction,
    show,
} from 'jezvejs';

import { Button } from 'jezvejs/Button';
import { MenuButton } from 'jezvejs/MenuButton';
import { Offcanvas } from 'jezvejs/Offcanvas';
import { Paginator } from 'jezvejs/Paginator';
import { Spinner } from 'jezvejs/Spinner';
import { ListContainer } from 'jezvejs/ListContainer';
import { createStore } from 'jezvejs/Store';

import { App } from '../../Application/App.js';
import '../../Application/Application.scss';
import { View } from '../../utils/View.js';
import {
    listData,
    __,
    getSelectedItems,
    getApplicationURL,
} from '../../utils/utils.js';
import { API } from '../../API/index.js';

import { CurrencyList } from '../../Models/CurrencyList.js';
import { AccountList } from '../../Models/AccountList.js';
import { PersonList } from '../../Models/PersonList.js';
import { CategoryList } from '../../Models/CategoryList.js';
import { Schedule } from '../../Models/Schedule.js';
import { ScheduledTransaction } from '../../Models/ScheduledTransaction.js';

import { Heading } from '../../Components/Heading/Heading.js';
import { ConfirmDialog } from '../../Components/ConfirmDialog/ConfirmDialog.js';
import { LoadingIndicator } from '../../Components/LoadingIndicator/LoadingIndicator.js';
import { ToggleDetailsButton } from '../../Components/ToggleDetailsButton/ToggleDetailsButton.js';

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
import './ScheduleView.scss';

/* CSS classes */
const LIST_CLASS = 'schedule-list';
const SELECT_MODE_CLASS = 'schedule-list_select';

const SHOW_ON_PAGE = 10;

/**
 * List of scheduled transactions view
 */
class ScheduleView extends View {
    constructor(...args) {
        super(...args);

        this.menuActions = {
            selectModeBtn: () => this.setListMode('select'),
            selectAllBtn: () => this.selectAll(),
            deselectAllBtn: () => this.deselectAll(),
            deleteBtn: () => this.confirmDelete(),
        };

        this.contextMenuActions = {
            ctxDetailsBtn: () => this.showDetails(),
            ctxDeleteBtn: () => this.confirmDelete(),
        };

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
            'contentHeader',
            'itemsCount',
            'selectedCounter',
            'selItemsCount',
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
            placeholderClass: 'schedule-item_placeholder',
            listMode: 'list',
            noItemsMessage: __('schedule.noData'),
            onItemClick: (id, e) => this.onItemClick(id, e),
        });

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

        this.contentContainer.append(
            this.scheduleList.elem,
            this.loadingIndicator.elem,
        );

        // List mode selected
        const listHeader = document.querySelector('.list-header');
        this.modeSelector = ToggleDetailsButton.create({
            onClick: (e) => this.onToggleMode(e),
        });
        listHeader.append(this.modeSelector.elem);

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
            breakLimit: 3,
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

    showMore() {
        this.store.dispatch(actions.showMore());
    }

    onChangePage(page) {
        this.store.dispatch(actions.changePage(page));
    }

    onToggleMode(e) {
        e.preventDefault();

        this.store.dispatch(actions.toggleMode());
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

    async setListMode(listMode) {
        this.store.dispatch(actions.changeListMode(listMode));
    }

    startLoading() {
        this.store.dispatch(actions.startLoading());
    }

    stopLoading() {
        this.store.dispatch(actions.stopLoading());
    }

    /** Updates render time */
    setRenderTime() {
        this.store.dispatch(actions.setRenderTime());
    }

    getSelectedIds(state) {
        const selArr = getSelectedItems(state.items);
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
            const request = this.prepareRequest({ id: ids });
            const response = await API.schedule.del(request);
            const data = this.getListDataFromResponse(response);
            this.setListData(data);
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
            const { data } = await API.schedule.list(request);
            this.setListData(data, keepState);
        } catch (e) {
            App.createErrorNotification(e.message);
        }

        this.stopLoading();
    }

    getListRequest() {
        return {};
    }

    prepareRequest(data) {
        return {
            ...data,
            returnState: {
                schedule: this.getListRequest(),
            },
        };
    }

    getListDataFromResponse(response) {
        return response?.data?.state?.schedule?.data;
    }

    setListData(data, keepState = false) {
        App.model.schedule.setData(data);
        this.store.dispatch(actions.listRequestLoaded(keepState));
    }

    async requestItem() {
        const state = this.store.getState();
        if (!state.detailsId) {
            return;
        }

        try {
            const { data } = await API.schedule.read(state.detailsId);
            const [item] = data;

            this.store.dispatch(actions.itemDetailsLoaded(item));
        } catch (e) {
            App.createErrorNotification(e.message);
        }
    }

    /** Show person(s) delete confirmation popup */
    confirmDelete() {
        const state = this.store.getState();
        const ids = this.getContextIds(state);
        if (ids.length === 0) {
            return;
        }

        const multiple = (ids.length > 1);
        const title = (multiple)
            ? __('schedule.deleteMultiple')
            : __('schedule.delete');
        const content = (multiple)
            ? __('schedule.deleteMultipleMessage')
            : __('schedule.deleteMessage');

        ConfirmDialog.create({
            id: 'delete_warning',
            title,
            content,
            onConfirm: () => this.deleteItems(),
        });
    }

    renderContextMenu(state) {
        if (!state.showContextMenu && !this.contextMenu) {
            return;
        }

        if (!this.contextMenu) {
            this.contextMenu = ScheduleItemContextMenu.create({
                id: 'contextMenu',
                onItemClick: (item) => this.onContextMenuClick(item),
                onClose: () => this.hideContextMenu(),
            });
        }

        this.contextMenu.setState({
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
                onItemClick: (item) => this.onMenuClick(item),
                onClose: () => this.hideMenu(),
            });
        }

        this.menu.setState({
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

        return getApplicationURL(`schedule/${itemPart}`, params);
    }

    /** Returns absolute index for relative index on current page */
    getAbsoluteIndex(index, state) {
        if (index === -1) {
            return index;
        }

        const { pagination } = state;
        if (!pagination) {
            return index;
        }

        const firstItemIndex = (pagination.page - 1) * pagination.onPage;
        return firstItemIndex + index;
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
        ) {
            return;
        }

        // Counters
        const itemsCount = state.items.length;
        this.itemsCount.textContent = itemsCount;
        const isSelectMode = (state.listMode === 'select');
        show(this.selectedCounter, isSelectMode);
        const selected = (isSelectMode) ? this.getSelectedIds(state) : [];
        this.selItemsCount.textContent = selected.length;

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

        const firstItem = this.getAbsoluteIndex(0, state);
        const lastItem = firstItem + state.pagination.onPage * state.pagination.range;
        const items = listData(state.items).slice(firstItem, lastItem);

        // List of scheduled transactions
        this.scheduleList.setState((listState) => ({
            ...listState,
            items,
            mode: state.mode,
            listMode: state.listMode,
            renderTime: Date.now(),
        }));
    }

    render(state, prevState = {}) {
        if (!state) {
            throw new Error('Invalid state');
        }

        this.renderHistory(state, prevState);

        if (state.loading && !state.isLoadingMore) {
            this.loadingIndicator.show();
        }

        const isDetails = (state.mode === 'details');

        const modeURL = this.getURL(state);
        modeURL.searchParams.set('mode', (isDetails) ? 'classic' : 'details');

        this.modeSelector.show(state.items.length > 0);
        this.modeSelector.setState((modeSelectorState) => ({
            ...modeSelectorState,
            details: isDetails,
            url: modeURL.toString(),
        }));

        this.renderList(state, prevState);
        this.renderContextMenu(state);
        this.renderMenu(state);
        this.renderDetails(state, prevState);

        if (!state.loading) {
            this.loadingIndicator.hide();
        }
    }
}

App.createView(ScheduleView);
