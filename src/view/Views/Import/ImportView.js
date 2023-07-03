import 'jezvejs/style';
import {
    createElement,
    show,
    setEvents,
    enable,
    insertAfter,
    isFunction,
} from 'jezvejs';
import { Button } from 'jezvejs/Button';
import { DropDown } from 'jezvejs/DropDown';
import { MenuButton } from 'jezvejs/MenuButton';
import { Paginator } from 'jezvejs/Paginator';
import { createStore } from 'jezvejs/Store';

import { __, getSeconds, getSelectedItems } from '../../utils/utils.js';
import { App } from '../../Application/App.js';
import { API } from '../../API/index.js';
import { AppView } from '../../Components/AppView/AppView.js';

import { CurrencyList } from '../../Models/CurrencyList.js';
import { UserCurrencyList } from '../../Models/UserCurrencyList.js';
import { AccountList } from '../../Models/AccountList.js';
import { PersonList } from '../../Models/PersonList.js';
import { CategoryList } from '../../Models/CategoryList.js';
import { ImportRuleList } from '../../Models/ImportRuleList.js';
import { ImportTemplateList } from '../../Models/ImportTemplateList.js';

import { Heading } from '../../Components/Heading/Heading.js';
import { LoadingIndicator } from '../../Components/LoadingIndicator/LoadingIndicator.js';
import { ImportUploadDialog } from './components/UploadDialog/Dialog/ImportUploadDialog.js';
import { ImportRulesDialog } from './components/RulesDialog/Dialog/ImportRulesDialog.js';
import { ImportListContextMenu } from './components/ContextMenu/ImportListContextMenu.js';
import { ImportTransactionList } from './components/List/ImportTransactionList.js';
import { ImportListMainMenu } from './components/MainMenu/ImportListMainMenu.js';
import { ImportTransactionForm } from './components/TransactionForm/ImportTransactionForm.js';

import { actions, reducer, getPageIndex } from './reducer.js';
import '../../Application/Application.scss';
import './ImportView.scss';

const SUBMIT_LIMIT = 100;
const SHOW_ON_PAGE = 20;

const defaultPagination = {
    onPage: SHOW_ON_PAGE,
    page: 1,
    pagesCount: 0,
    total: 0,
    range: 1,
};

/**
 * Import view constructor
 */
class ImportView extends AppView {
    constructor(...args) {
        super(...args);

        this.menuActions = {
            createItemBtn: () => this.createItem(),
            selectModeBtn: () => this.setListMode('select'),
            sortModeBtn: () => this.setListMode('sort'),
            selectAllBtn: () => this.selectAll(),
            deselectAllBtn: () => this.deselectAll(),
            enableSelectedBtn: () => this.enableSelected(true),
            disableSelectedBtn: () => this.enableSelected(false),
            deleteSelectedBtn: () => this.deleteSelected(),
            deleteAllBtn: () => this.removeAllItems(),
            rulesCheck: () => this.onToggleEnableRules(),
            rulesBtn: () => this.onRulesClick(),
            similarCheck: () => this.onToggleCheckSimilar(),
        };

        this.contextMenuActions = {
            ctxRestoreBtn: () => this.onRestoreItem(),
            ctxEnableBtn: () => this.onToggleEnableItem(),
            ctxUpdateBtn: () => this.onUpdateItem(),
            ctxDeleteBtn: () => this.onRemoveItem(),
        };

        App.loadModel(CurrencyList, 'currency', App.props.currency);
        App.loadModel(UserCurrencyList, 'userCurrencies', App.props.userCurrencies);
        App.loadModel(AccountList, 'accounts', App.props.accounts);
        App.checkUserAccountModels();
        App.loadModel(PersonList, 'persons', App.props.persons);
        App.loadModel(CategoryList, 'categories', App.props.categories);
        App.initCategoriesModel();
        App.loadModel(ImportRuleList, 'rules', App.props.rules);
        App.loadModel(ImportTemplateList, 'templates', App.props.templates);

        const { userAccounts } = App.model;
        const mainAccount = userAccounts.getItemByIndex(0);
        const initialState = {
            items: [],
            pagination: {
                ...defaultPagination,
            },
            form: {},
            lastId: 0,
            activeItemIndex: -1,
            mainAccount,
            rulesEnabled: true,
            checkSimilarEnabled: true,
            showContextMenu: false,
            contextItemIndex: -1,
            listMode: 'list',
            showMenu: false,
        };

        this.store = createStore(reducer, { initialState });
    }

    /**
     * View initialization
     */
    onStart() {
        if (App.model.accounts.length === 0) {
            return;
        }

        this.loadElementsByIds([
            'heading',
            'dataHeaderControls',
            'submitBtn',
            'itemsCount',
            'enabledCount',
            'selectedCounter',
            'selectedCount',
        ]);

        this.heading = Heading.fromElement(this.heading, {
            title: __('import.listTitle'),
        });

        this.uploadBtn = Button.create({
            id: 'uploadBtn',
            className: 'circle-btn',
            icon: 'import',
            onClick: () => this.showUploadDialog(),
        });
        this.heading.actionsContainer.append(this.uploadBtn.elem);

        setEvents(this.submitBtn, { click: () => this.onSubmitClick() });

        this.accountDropDown = DropDown.create({
            elem: 'acc_id',
            enableFilter: true,
            noResultsMessage: __('notFound'),
            onChange: (account) => this.onMainAccChange(account),
            className: 'dd_ellipsis',
        });
        App.initAccountsList(this.accountDropDown);

        this.listModeBtn = Button.create({
            id: 'listModeBtn',
            className: 'action-button',
            title: __('actions.done'),
            onClick: () => this.setListMode('list'),
        });
        insertAfter(this.listModeBtn.elem, this.uploadBtn.elem);

        this.menuButton = MenuButton.create({
            className: 'circle-btn',
            onClick: (e) => this.showMenu(e),
        });
        insertAfter(this.menuButton.elem, this.listModeBtn.elem);

        // List
        this.list = ImportTransactionList.create({
            onItemClick: (...args) => this.onItemClick(...args),
            onSort: (...args) => this.onTransPosChanged(...args),
        });
        const listContainer = document.querySelector('.data-form');
        listContainer.prepend(this.list.elem);

        const listFooter = document.querySelector('.list-footer');
        // 'Show more' button
        this.showMoreBtn = createElement('button', {
            props: {
                className: 'btn show-more-btn',
                type: 'button',
                textContent: __('actions.showMore'),
            },
            events: { click: (e) => this.showMore(e) },
        });
        listFooter.append(this.showMoreBtn);

        // Submit progress indicator
        this.submitProgress = LoadingIndicator.create({ title: 'Saving items...' });
        this.submitProgressIndicator = createElement('div');
        this.submitProgress.elem.append(this.submitProgressIndicator);
        const contentWrapper = document.querySelector('.content_wrap');
        if (!contentWrapper) {
            throw new Error('Failed to initialize Import view');
        }
        contentWrapper.append(this.submitProgress.elem);

        this.paginator = Paginator.create({
            arrows: true,
            onChange: (page) => this.setPage(page),
        });
        listFooter.append(this.paginator.elem);

        // Data loading indicator
        this.loadingInd = LoadingIndicator.create({ fixed: false });
        listContainer.append(this.loadingInd.elem);

        this.subscribeToStore(this.store);
        this.setRenderTime();
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

    showContextMenu(itemIndex) {
        this.store.dispatch(actions.showContextMenu(itemIndex));
    }

    hideContextMenu() {
        this.store.dispatch(actions.hideContextMenu());
    }

    /** Update render time data attribute of list container */
    setRenderTime() {
        this.list.setState((listState) => ({
            ...listState,
            renderTime: Date.now(),
        }));
    }

    /** Import rules 'update' event handler */
    onUpdateRules() {
        this.applyRules();
    }

    /** Show upload file dialog popup */
    showUploadDialog() {
        if (!this.uploadDialog) {
            const state = this.store.getState();
            this.uploadDialog = ImportUploadDialog.create({
                mainAccount: state.mainAccount,
                elem: 'uploadDialog',
                onAccountChange: (accountId) => this.onUploadAccChange(accountId),
                onUploadDone: (items) => this.onImportDone(items),
                onTemplateUpdate: () => this.onUpdateRules(),
            });
        }

        this.uploadDialog.show();
    }

    /** File upload done handler */
    onImportDone(items) {
        this.uploadDialog.hide();

        this.store.dispatch(actions.uploadFileDone(items));
        this.applyRules();

        const state = this.store.getState();
        if (state.checkSimilarEnabled) {
            this.requestSimilar();
        } else {
            this.setRenderTime();
        }
    }

    /** Returns date range for current imported transactions */
    getImportedItemsDateRange(state) {
        const res = { start: 0, end: 0 };
        state.items.forEach((item) => {
            if (!item.originalData) {
                return;
            }

            const time = item.originalData.date.getTime();
            if (res.start === 0) {
                res.start = time;
                res.end = time;
            } else {
                res.start = Math.min(time, res.start);
                res.end = Math.max(time, res.end);
            }
        });

        return res;
    }

    /** Request API for list of transactions similar to imported */
    async fetchSimilarTransactions() {
        try {
            const state = this.store.getState();
            const range = this.getImportedItemsDateRange(state);
            const result = await API.transaction.list({
                onPage: 0,
                startDate: getSeconds(range.start),
                endDate: getSeconds(range.end),
                accounts: state.mainAccount.id,
            });
            return result.data.items;
        } catch (e) {
            return null;
        }
    }

    /**
     * Send API request to obtain transactions similar to imported.
     * Compare list of import items with transactions already in DB
     *  and disable import item if same(similar) transaction found
     */
    async requestSimilar() {
        const state = this.store.getState();
        if (
            !state.checkSimilarEnabled
            || !state.items.some((item) => item.originalData)
        ) {
            this.setRenderTime();
            return;
        }

        this.loadingInd.show();

        const transCache = await this.fetchSimilarTransactions();
        if (!transCache) {
            this.loadingInd.hide();
            return;
        }

        this.store.dispatch(actions.similarTransactionsLoaded(transCache));

        this.loadingInd.hide();
        this.setRenderTime();
    }

    disableCheckSimilar() {
        this.store.dispatch(actions.disableFindSimilar());
        this.setRenderTime();
    }

    /** Initial account of upload change callback */
    onUploadAccChange(accountId) {
        this.setMainAccount(accountId);
    }

    selectAll() {
        this.store.dispatch(actions.selectAllItems());
    }

    deselectAll() {
        this.store.dispatch(actions.deselectAllItems());
    }

    enableSelected(value) {
        const state = this.store.getState();
        if (state.listMode !== 'select') {
            return;
        }

        this.store.dispatch(actions.enableSelectedItems(value));
    }

    deleteSelected() {
        const state = this.store.getState();
        if (state.listMode !== 'select') {
            return;
        }

        this.store.dispatch(actions.deleteSelectedItems());
        this.setRenderTime();
    }

    setListMode(listMode) {
        const state = this.store.getState();
        if (
            state.listMode === listMode
            || state.activeItemIndex !== -1
        ) {
            return;
        }

        this.store.dispatch(actions.changeListMode(listMode));
    }

    toggleSelectItem(index) {
        const state = this.store.getState();
        if (state.listMode !== 'select' || index === -1) {
            return;
        }

        this.store.dispatch(actions.toggleSelectItemByIndex(index));
    }

    /** Remove all transaction rows */
    removeAllItems() {
        this.store.dispatch(actions.deleteAllItems());
        this.setRenderTime();
    }

    toggleCollapseItem(index) {
        this.store.dispatch(actions.toggleCollapseItem(index));
    }

    /** Restore original data of transaction item */
    onRestoreItem() {
        const state = this.store.getState();
        const index = state.contextItemIndex;
        if (index === -1) {
            this.hideContextMenu();
            return;
        }

        this.store.dispatch(actions.restoreItemByIndex(index));
    }

    /** Transaction item enable/disable event handler */
    onToggleEnableItem() {
        const state = this.store.getState();
        const index = state.contextItemIndex;
        if (index === -1) {
            this.hideContextMenu();
            return;
        }

        this.store.dispatch(actions.toggleEnableItemByIndex(index));
    }

    onItemClick(id, e) {
        const state = this.store.getState();
        const relIndex = this.list.getItemIndexById(id);
        const index = this.getAbsoluteIndex(relIndex, state);
        if (index === -1) {
            return;
        }

        if (e.target.closest('.toggle-btn')) {
            this.toggleCollapseItem(index);
            return;
        }

        const { listMode } = state;
        if (listMode === 'list') {
            if (!e.target.closest('.menu-btn')) {
                return;
            }
            this.showContextMenu(index);
        } else if (listMode === 'select') {
            if (e.target.closest('.checkbox') && e.pointerType !== '') {
                e.preventDefault();
            }

            this.toggleSelectItem(index);
        }
    }

    /** Transaction item remove event handler */
    onRemoveItem() {
        const { contextItemIndex } = this.store.getState();
        this.store.dispatch(actions.deleteItemByIndex(contextItemIndex));
    }

    /** Change page of transactions list */
    setPage(page) {
        this.store.dispatch(actions.changePage(page));
    }

    showMore() {
        this.store.dispatch(actions.showMore());
    }

    /** Save form data and replace it by item component */
    onSaveItem(data) {
        if (!data?.validate()) {
            throw new Error('Invalid data');
        }

        this.store.dispatch(actions.saveItem(data));
    }

    onCancelEditItem() {
        this.store.dispatch(actions.cancelEditItem());
    }

    /** Add new transaction row and insert it into list */
    createItem() {
        this.store.dispatch(actions.createItem());
    }

    onUpdateItem() {
        this.store.dispatch(actions.editItem());
    }

    /**
     * Main account select event handler
     */
    onMainAccChange(account) {
        if (!account) {
            throw new Error('Invalid account');
        }

        this.setMainAccount(account.id);
        this.applyRules();

        const state = this.store.getState();
        if (this.uploadDialog) {
            this.uploadDialog.setMainAccount(state.mainAccount);
        }

        if (state.checkSimilarEnabled && !this.uploadDialog?.isVisible()) {
            this.requestSimilar();
        } else {
            this.setRenderTime();
        }
    }

    /** Set main account */
    setMainAccount(accountId) {
        this.store.dispatch(actions.changeMainAccount(accountId));
    }

    /** Filter enabled transaction items */
    getEnabledItems(state) {
        if (!Array.isArray(state?.items)) {
            throw new Error('Invalid state');
        }

        return state.items.filter((item) => item.enabled);
    }

    /** Submit buttom 'click' event handler */
    onSubmitClick() {
        const state = this.store.getState();
        if (state.activeItemIndex !== -1) {
            return;
        }

        this.submitProgress.show();

        const enabledList = this.getEnabledItems(state);
        if (!Array.isArray(enabledList) || !enabledList.length) {
            throw new Error('Invalid list of items');
        }

        const itemsData = enabledList.map((item) => {
            const res = item.getData();
            if (!res) {
                throw new Error('Invalid transaction object');
            }

            return res;
        });

        this.submitDone = 0;
        this.submitTotal = itemsData.length;
        this.renderSubmitProgress();

        // Split list of items to chunks
        this.submitQueue = [];
        while (itemsData.length > 0) {
            const chunkSize = Math.min(itemsData.length, SUBMIT_LIMIT);
            const chunk = itemsData.splice(0, chunkSize);
            this.submitQueue.push(chunk);
        }

        this.submitChunk();
    }

    renderSubmitProgress() {
        this.submitProgressIndicator.textContent = `${this.submitDone} / ${this.submitTotal}`;
    }

    async submitChunk() {
        try {
            const chunk = this.submitQueue.pop();
            await API.transaction.create({ data: chunk });
            this.onSubmitResult();
        } catch (e) {
            this.submitProgress.hide();
            App.createErrorNotification(e.message);
        }
    }

    /**
     * Successfull submit response handler
     */
    onSubmitResult() {
        this.submitDone = Math.min(this.submitDone + SUBMIT_LIMIT, this.submitTotal);
        this.renderSubmitProgress();

        if (this.submitQueue.length > 0) {
            this.submitChunk();
            return;
        }

        this.removeAllItems();
        this.submitProgress.hide();
        App.createSuccessNotification(__('import.successMessage'));
    }

    /** Apply rules to imported items */
    applyRules() {
        this.store.dispatch(actions.applyRules());
    }

    /** Rules checkbox 'change' event handler */
    onToggleEnableRules() {
        this.store.dispatch(actions.toggleEnableRules());
        this.setRenderTime();
    }

    /** Check similar transactions checkbox 'change' event handler */
    onToggleCheckSimilar() {
        this.store.dispatch(actions.toggleCheckSimilar());

        const state = this.store.getState();
        if (state.checkSimilarEnabled) {
            this.requestSimilar();
        } else {
            this.disableCheckSimilar();
        }
    }

    /** Rules button 'click' event handler */
    onRulesClick() {
        const state = this.store.getState();
        if (!state.rulesEnabled) {
            return;
        }

        this.showRulesDialog();
    }

    /** Show rules dialog popup */
    showRulesDialog() {
        if (!this.rulesDialog) {
            this.rulesDialog = ImportRulesDialog.create({
                onUpdate: () => this.onUpdateRules(),
            });
        }

        this.rulesDialog.show();
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

    /**
     * Transaction reorder handler
     * @param {Object} from - original item index
     * @param {Object} to - replaced item index
     */
    onTransPosChanged(from, to) {
        const state = this.store.getState();
        if (state.items.length < 2) {
            return;
        }

        const fromIndex = this.getAbsoluteIndex(from, state);
        const toIndex = this.getAbsoluteIndex(to, state);
        this.store.dispatch(actions.changeItemPosition({ fromIndex, toIndex }));
    }

    /** Show transaction form dialog */
    renderTransactionFormDialog(state) {
        if (state.activeItemIndex === -1) {
            this.transactionDialog?.hide();
            return;
        }

        if (!state.form) {
            throw new Error('Invalid state');
        }

        const isUpdate = (state.activeItemIndex < state.items.length);
        if (!this.transactionDialog) {
            this.transactionDialog = ImportTransactionForm.create({
                transaction: state.form,
                isUpdate,
                onSave: (data) => this.onSaveItem(data),
                onCancel: () => this.onCancelEditItem(),
            });
        } else {
            this.transactionDialog.setState((formState) => ({
                ...formState,
                isUpdate,
                transaction: state.form,
            }));
        }

        this.transactionDialog.show();
    }

    renderContextMenu(state) {
        const index = state.contextItemIndex;
        const pageIndex = getPageIndex(index, state);
        const startPage = state.pagination.page;
        const endPage = startPage + state.pagination.range - 1;
        if (pageIndex.page < startPage || pageIndex.page > endPage) {
            return;
        }

        if (!state.showContextMenu && !this.contextMenu) {
            return;
        }

        if (!this.contextMenu) {
            this.contextMenu = ImportListContextMenu.create({
                id: 'contextMenu',
                onItemClick: (item) => this.onContextMenuClick(item),
                onClose: () => this.hideContextMenu(),
            });
        }

        this.contextMenu.setState({
            showContextMenu: state.showContextMenu,
            contextItemIndex: state.contextItemIndex,
            items: state.items,
        });
    }

    renderMenu(state) {
        const isListMode = state.listMode === 'list';

        this.uploadBtn.show(isListMode);
        this.listModeBtn.show(!isListMode);

        if (!state.showMenu && !this.menu) {
            return;
        }

        const showFirstTime = !this.menu;
        if (!this.menu) {
            this.menu = ImportListMainMenu.create({
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

    renderList(state, prevState) {
        if (
            state.items === prevState.items
            && state.pagination === prevState.pagination
            && state.listMode === prevState.listMode
        ) {
            return;
        }

        const firstItem = this.getAbsoluteIndex(0, state);
        const lastItem = firstItem + state.pagination.onPage * state.pagination.range;
        const items = state.items.slice(firstItem, lastItem);

        // Render list
        this.list.setState((listState) => ({
            ...listState,
            listMode: state.listMode,
            items,
        }));

        const range = state.pagination.range ?? 1;
        const pageNum = state.pagination.page + range - 1;

        const showPaginator = state.pagination.pagesCount > 1;
        this.paginator.show(showPaginator);
        if (showPaginator) {
            this.paginator.setState((paginatorState) => ({
                ...paginatorState,
                pagesCount: state.pagination.pagesCount,
                pageNum,
            }));
        }

        show(
            this.showMoreBtn,
            state.items.length > 0
            && pageNum < state.pagination.pagesCount,
        );
    }

    render(state, prevState = {}) {
        if (!state) {
            throw new Error('Invalid state');
        }

        this.renderList(state, prevState);
        this.renderTransactionFormDialog(state);

        const isSelectMode = (state.listMode === 'select');
        const isListMode = (state.listMode === 'list');
        const enabledList = this.getEnabledItems(state);
        const selectedItems = (isSelectMode) ? getSelectedItems(state.items) : [];

        this.accountDropDown.setSelection(state.mainAccount.id);
        this.accountDropDown.enable(isListMode);

        enable(this.submitBtn, (enabledList.length > 0 && isListMode));
        this.enabledCount.textContent = enabledList.length;
        this.itemsCount.textContent = state.items.length;

        show(this.selectedCounter, isSelectMode);
        this.selectedCount.textContent = selectedItems.length;

        this.renderContextMenu(state);
        this.renderMenu(state);
    }
}

App.createView(ImportView);
