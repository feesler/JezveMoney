import 'jezvejs/style';
import {
    ge,
    createElement,
    show,
    setEvents,
    enable,
    insertAfter,
} from 'jezvejs';
import { DropDown } from 'jezvejs/DropDown';
import { IconButton } from 'jezvejs/IconButton';
import { Paginator } from 'jezvejs/Paginator';
import { PopupMenu } from 'jezvejs/PopupMenu';
import { timestampFromString } from '../../js/utils.js';
import { Application } from '../../js/Application.js';
import { API } from '../../js/api/index.js';
import { ImportTransactionForm } from '../../Components/Import/TransactionForm/ImportTransactionForm.js';
import '../../css/app.scss';
import { View } from '../../js/View.js';
import { CurrencyList } from '../../js/model/CurrencyList.js';
import { AccountList } from '../../js/model/AccountList.js';
import { PersonList } from '../../js/model/PersonList.js';
import { ImportRuleList } from '../../js/model/ImportRuleList.js';
import { ImportTemplateList } from '../../js/model/ImportTemplateList.js';
import './style.scss';
import { ImportUploadDialog } from '../../Components/Import/UploadDialog/Dialog/ImportUploadDialog.js';
import { ImportRulesDialog, IMPORT_RULES_DIALOG_CLASS } from '../../Components/Import/RulesDialog/Dialog/ImportRulesDialog.js';
import { LoadingIndicator } from '../../Components/LoadingIndicator/LoadingIndicator.js';
import { Heading } from '../../Components/Heading/Heading.js';
import { createStore } from '../../js/store.js';
import { actions, reducer, getPageIndex } from './reducer.js';
import { ImportTransactionList } from '../../Components/Import/List/ImportTransactionList.js';

/* Strings */
const STR_TITLE = 'Import';
const STR_ENABLE_ITEM = 'Enable';
const STR_DISABLE_ITEM = 'Disable';
const MSG_IMPORT_SUCCESS = 'All transactions have been successfully imported';
const MSG_IMPORT_FAIL = 'Fail to import transactions';
/* 'Show more' button */
const TITLE_SHOW_MORE = 'Show more...';
/* Other */
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
class ImportView extends View {
    constructor(...args) {
        super(...args);

        const initialState = {
            items: [],
            pagination: {
                ...defaultPagination,
            },
            form: {},
            lastId: 0,
            activeItemIndex: -1,
            mainAccount: null,
            rulesEnabled: true,
            checkSimilarEnabled: true,
            contextItemIndex: -1,
            listMode: 'list',
        };

        window.app.loadModel(CurrencyList, 'currency', window.app.props.currency);
        window.app.loadModel(AccountList, 'accounts', window.app.props.accounts);
        window.app.loadModel(PersonList, 'persons', window.app.props.persons);
        window.app.loadModel(ImportRuleList, 'rules', window.app.props.rules);
        window.app.loadModel(ImportTemplateList, 'templates', window.app.props.templates);

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
        if (window.app.model.accounts.length === 0) {
            return;
        }

        const elemIds = [
            'heading',
            'dataHeaderControls',
            'submitBtn',
            'itemsCount',
            'enabledCount',
            'selectedCounter',
            'selectedCount',
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

        setEvents(this.submitBtn, { click: () => this.onSubmitClick() });

        this.accountDropDown = DropDown.create({
            elem: 'acc_id',
            onchange: () => this.onMainAccChange(),
            className: 'dd__main-account dd_ellipsis',
        });
        window.app.initAccountsList(this.accountDropDown);

        this.uploadBtn = IconButton.fromElement('uploadBtn', {
            onClick: () => this.showUploadDialog(),
        });

        this.listModeBtn = IconButton.create({
            id: 'listModeBtn',
            className: 'no-icon',
            title: 'Done',
            onClick: () => this.setListMode('list'),
        });
        insertAfter(this.listModeBtn.elem, this.uploadBtn.elem);

        this.createMenu();
        insertAfter(this.menu.elem, this.listModeBtn.elem);

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
                textContent: TITLE_SHOW_MORE,
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

        const selectedAccount = this.accountDropDown.getSelectionData();
        if (!selectedAccount) {
            throw new Error('Invalid selection data');
        }

        this.createContextMenu();

        this.setMainAccount(selectedAccount.id);
        this.setRenderTime();
    }

    createMenu() {
        this.menu = PopupMenu.create({
            id: 'listMenu',
            items: [{
                id: 'createItemBtn',
                icon: 'plus',
                title: 'Add item',
                onClick: () => this.createItem(),
            }, {
                id: 'separator1',
                type: 'separator',
            }, {
                id: 'selectModeBtn',
                icon: 'select',
                title: 'Select',
                onClick: () => this.setListMode('select'),
            }, {
                id: 'sortModeBtn',
                icon: 'sort',
                title: 'Sort',
                onClick: () => this.setListMode('sort'),
            }, {
                id: 'separator2',
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
                id: 'enableSelectedBtn',
                title: 'Enable selected',
                onClick: () => this.enableSelected(true),
            }, {
                id: 'disableSelectedBtn',
                title: 'Disable selected',
                onClick: () => this.enableSelected(false),
            }, {
                id: 'deleteSelectedBtn',
                icon: 'del',
                title: 'Delete selected',
                onClick: () => this.deleteSelected(),
            }, {
                id: 'deleteAllBtn',
                icon: 'del',
                title: 'Delete all',
                onClick: () => this.removeAllItems(),
            }, {
                id: 'separator3',
                type: 'separator',
            }, {
                id: 'rulesCheck',
                type: 'checkbox',
                label: 'Enable rules',
                checked: true,
                onChange: () => this.onToggleEnableRules(),
            }, {
                id: 'rulesBtn',
                icon: 'update',
                title: 'Edit rules',
                onClick: () => this.onRulesClick(),
            }, {
                id: 'separator4',
                type: 'separator',
            }, {
                id: 'similarCheck',
                type: 'checkbox',
                label: 'Check similar transactions',
                checked: true,
                onChange: () => this.onToggleCheckSimilar(),
            }],
        });
    }

    createContextMenu() {
        this.contextMenu = PopupMenu.create({
            id: 'contextMenu',
            attached: true,
            onClose: () => this.hideContextMenu(),
            items: [{
                id: 'ctxEnableBtn',
                title: STR_DISABLE_ITEM,
                onClick: () => this.onToggleEnableItem(),
            }, {
                id: 'ctxUpdateBtn',
                icon: 'update',
                title: 'Edit',
                onClick: () => this.onUpdateItem(),
            }, {
                id: 'ctxDeleteBtn',
                icon: 'del',
                title: 'Delete',
                onClick: () => this.onRemoveItem(),
            }],
        });
    }

    showContextMenu(itemIndex) {
        this.store.dispatch(actions.showContextMenu(itemIndex));
    }

    hideContextMenu() {
        this.showContextMenu(-1);
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

            const date = item.getDate();
            const time = timestampFromString(date);
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
                count: 0,
                stdate: window.app.formatDate(new Date(range.start)),
                enddate: window.app.formatDate(new Date(range.end)),
                acc_id: state.mainAccount.id,
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
    }

    toggleCollapseItem(index) {
        this.store.dispatch(actions.toggleCollapseItem(index));
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
            if (!e.target.closest('.popup-menu-btn')) {
                return;
            }
            this.showContextMenu(index);
        } else if (listMode === 'select') {
            if (e.target.closest('.checkbox')) {
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

    /** ImportTransaction 'update' event handler */
    onFormUpdate(data) {
        this.store.dispatch(actions.formChanged(data));
    }

    /**
     * Main account select event handler
     */
    onMainAccChange() {
        const selected = this.accountDropDown.getSelectionData();
        if (!selected) {
            throw new Error('Invalid selection data');
        }

        this.setMainAccount(selected.id);
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

    /** Filter enabled transaction items */
    getSelectedItems(state) {
        if (!Array.isArray(state?.items)) {
            throw new Error('Invalid state');
        }

        return state.items.filter((item) => item.selected);
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
        const chunk = this.submitQueue.pop();
        const result = await API.transaction.createMultiple(chunk);
        this.onSubmitResult(result);
    }

    /**
     * Submit response handler
     * @param {String} response - response text
     */
    onSubmitResult(apiResult) {
        let status = false;
        let message = MSG_IMPORT_FAIL;

        try {
            status = (apiResult && apiResult.result === 'ok');
            if (status) {
                this.submitDone = Math.min(this.submitDone + SUBMIT_LIMIT, this.submitTotal);
                this.renderSubmitProgress();

                if (this.submitQueue.length === 0) {
                    message = MSG_IMPORT_SUCCESS;
                    this.removeAllItems();
                } else {
                    this.submitChunk();
                    return;
                }
            } else if (apiResult && apiResult.msg) {
                message = apiResult.msg;
            }
        } catch (e) {
            message = e.message;
        }

        this.submitProgress.hide();
        window.app.createMessage(message, (status ? 'msg_success' : 'msg_error'));
    }

    /** Apply rules to imported items */
    applyRules() {
        this.store.dispatch(actions.applyRules());
    }

    /** Rules checkbox 'change' event handler */
    onToggleEnableRules() {
        this.store.dispatch(actions.toggleEnableRules());
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
                elem: document.querySelector(`.${IMPORT_RULES_DIALOG_CLASS}`),
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

    renderContextMenu(state, prevState) {
        if (state === prevState) {
            return;
        }
        if (state.listMode !== 'list') {
            this.contextMenu.detach();
            return;
        }
        if (state.contextItemIndex === prevState.contextItemIndex) {
            return;
        }

        const index = state.contextItemIndex;
        if (index === -1) {
            this.contextMenu.detach();
            return;
        }

        const pageIndex = getPageIndex(index, state);
        if (state.pagination.page !== pageIndex.page) {
            return;
        }

        const item = state.items[index];
        const listItem = this.list.getListItemById(item.id);
        const menuContainer = listItem?.elem?.querySelector('.popup-menu');
        if (!menuContainer) {
            this.contextMenu.detach();
            return;
        }

        const title = (item.enabled) ? STR_DISABLE_ITEM : STR_ENABLE_ITEM;
        this.contextMenu.items.ctxEnableBtn.setTitle(title);

        this.contextMenu.attachAndShow(menuContainer);
    }

    renderMenu(state) {
        const isListMode = state.listMode === 'list';
        const isSelectMode = state.listMode === 'select';
        const hasItems = state.items.length > 0;
        const selectedItems = this.getSelectedItems(state);
        const hasEnabled = selectedItems.some((item) => item.enabled);
        const hasDisabled = selectedItems.some((item) => !item.enabled);

        this.uploadBtn.show(isListMode);
        this.listModeBtn.show(!isListMode);

        const { items } = this.menu;

        items.createItemBtn.show(isListMode);
        show(items.separator1, isListMode);

        items.selectModeBtn.show(isListMode && hasItems);
        items.sortModeBtn.show(isListMode && state.items.length > 1);
        show(items.separator2, isListMode && hasItems);
        show(items.separator3, isListMode);
        show(items.separator4, isListMode);

        items.selectAllBtn.show(isSelectMode && selectedItems.length < state.items.length);
        items.deselectAllBtn.show(isSelectMode && selectedItems.length > 0);
        items.enableSelectedBtn.show(isSelectMode && hasDisabled);
        items.disableSelectedBtn.show(isSelectMode && hasEnabled);
        items.deleteSelectedBtn.show(isSelectMode && selectedItems.length > 0);
        items.deleteAllBtn.enable(state.items.length > 0);

        items.rulesCheck.show(isListMode);
        items.rulesBtn.show(isListMode);
        items.rulesBtn.enable(state.rulesEnabled);
        items.similarCheck.show(isListMode);
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
        const selectedItems = (isSelectMode) ? this.getSelectedItems(state) : [];

        this.accountDropDown.selectItem(state.mainAccount.id);
        this.accountDropDown.enable(isListMode);

        enable(this.submitBtn, (enabledList.length > 0 && isListMode));
        this.enabledCount.textContent = enabledList.length;
        this.itemsCount.textContent = state.items.length;

        show(this.selectedCounter, isSelectMode);
        this.selectedCount.textContent = selectedItems.length;

        this.renderContextMenu(state, prevState);
        this.renderMenu(state);
    }
}

window.app = new Application(window.appProps);
window.app.createView(ImportView);
