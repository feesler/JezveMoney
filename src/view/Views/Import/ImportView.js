import 'jezvejs/style';
import {
    ge,
    re,
    createElement,
    show,
    removeChilds,
    setEvents,
    enable,
    insertAfter,
} from 'jezvejs';
import { DropDown } from 'jezvejs/DropDown';
import { Paginator } from 'jezvejs/Paginator';
import { Sortable } from 'jezvejs/Sortable';
import { timestampFromString } from '../../js/utils.js';
import { Application } from '../../js/Application.js';
import '../../css/app.scss';
import { View } from '../../js/View.js';
import { CurrencyList } from '../../js/model/CurrencyList.js';
import { AccountList } from '../../js/model/AccountList.js';
import { PersonList } from '../../js/model/PersonList.js';
import { ImportRuleList } from '../../js/model/ImportRuleList.js';
import { ImportTemplateList } from '../../js/model/ImportTemplateList.js';
import { IconButton } from '../../Components/IconButton/IconButton.js';
import { PopupMenu } from '../../Components/PopupMenu/PopupMenu.js';
import './style.scss';
import { ImportUploadDialog } from '../../Components/Import/UploadDialog/Dialog/ImportUploadDialog.js';
import { ImportRulesDialog, IMPORT_RULES_DIALOG_CLASS } from '../../Components/Import/RulesDialog/Dialog/ImportRulesDialog.js';
import { ImportTransactionForm } from '../../Components/Import/TransactionForm/ImportTransactionForm.js';
import { LoadingIndicator } from '../../Components/LoadingIndicator/LoadingIndicator.js';
import { API } from '../../js/api/index.js';
import { ImportTransactionItem } from '../../Components/Import/TransactionItem/ImportTransactionItem.js';
import { createStore } from '../../js/store.js';
import { actions, reducer, getPageIndex } from './reducer.js';

/* CSS classes */
const SELECT_MODE_CLASS = 'import-list_select';
const SORT_MODE_CLASS = 'import-list_sort';

/* Strings */
const STR_ENABLE_ITEM = 'Enable';
const STR_DISABLE_ITEM = 'Disable';
const MSG_IMPORT_SUCCESS = 'All transactions have been successfully imported';
const MSG_IMPORT_FAIL = 'Fail to import transactions';
const MSG_NO_TRANSACTIONS = 'No transactions to import';
/* Other */
const SUBMIT_LIMIT = 100;
const SHOW_ON_PAGE = 20;

const defaultPagination = {
    onPage: SHOW_ON_PAGE,
    page: 1,
    pagesCount: 0,
    total: 0,
};

/**
 * Import view constructor
 */
class ImportView extends View {
    constructor(...args) {
        super(...args);

        this.transactionRows = [];

        const initialState = {
            items: [],
            pagination: {
                ...defaultPagination,
            },
            activeItemIndex: -1,
            originalItemData: null,
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

        this.submitBtn = ge('submitbtn');
        this.transCountElem = ge('trcount');
        this.enabledTransCountElem = ge('entrcount');
        this.rowsContainer = ge('rowsContainer');
        if (
            !this.submitBtn
            || !this.transCountElem
            || !this.enabledTransCountElem
            || !this.rowsContainer
        ) {
            throw new Error('Failed to initialize Import view');
        }

        setEvents(this.rowsContainer, { click: (e) => this.onItemClick(e) });
        setEvents(this.submitBtn, { click: () => this.onSubmitClick() });

        this.accountDropDown = DropDown.create({
            elem: 'acc_id',
            onchange: () => this.onMainAccChange(),
            className: 'dd__main-account',
        });
        window.app.initAccountsList(this.accountDropDown);

        this.uploadBtn = IconButton.fromElement('uploadBtn', {
            onClick: () => this.showUploadDialog(),
        });

        this.createMenu();
        insertAfter(this.menu.elem, this.uploadBtn.elem);

        // Submit progress indicator
        this.submitProgress = LoadingIndicator.create({ title: 'Saving items...' });
        this.submitProgressIndicator = createElement('div');
        this.submitProgress.elem.append(this.submitProgressIndicator);
        const contentWrapper = document.querySelector('.content_wrap');
        if (!contentWrapper) {
            throw new Error('Failed to initialize Import view');
        }
        contentWrapper.append(this.submitProgress.elem);

        this.noDataMsg = this.rowsContainer.querySelector('.nodata-message');

        this.paginator = Paginator.create({
            arrows: true,
            onChange: (page) => this.setPage(page),
        });

        // Data loading indicator
        this.loadingInd = LoadingIndicator.create({ fixed: false });
        this.rowsContainer.append(this.loadingInd.elem);

        const selectedAccount = this.accountDropDown.getSelectionData();
        if (!selectedAccount) {
            throw new Error('Invalid selection data');
        }

        this.createContextMenu();

        this.setMainAccount(selectedAccount.id);
        this.setRenderTime();
    }

    createSortable(state) {
        if (state.listMode !== 'sort' || this.listSortable) {
            return;
        }

        this.listSortable = new Sortable({
            oninsertat: (orig, replaced) => this.onTransPosChanged(orig, replaced),
            elem: 'rowsContainer',
            group: 'transactions',
            selector: '.import-item.import-item_sort,.import-form.import-item_sort',
            placeholderClass: 'import-form__placeholder',
            copyWidth: true,
            handles: [{ query: 'div' }, { query: 'label' }],
        });
    }

    createMenu() {
        this.menu = PopupMenu.create({ id: 'listMenu' });

        this.createItemBtn = this.menu.addIconItem({
            id: 'createItemBtn',
            icon: 'plus',
            title: 'Add item',
            onClick: () => this.createItem(),
        });
        this.menu.addSeparator();
        this.listModeBtn = this.menu.addIconItem({
            id: 'listModeBtn',
            title: 'Done',
            onClick: () => this.setListMode('list'),
        });
        this.selectModeBtn = this.menu.addIconItem({
            id: 'selectModeBtn',
            icon: 'select',
            title: 'Select',
            onClick: () => this.setListMode('select'),
        });
        this.sortModeBtn = this.menu.addIconItem({
            id: 'sortModeBtn',
            icon: 'sort',
            title: 'Sort',
            onClick: () => this.setListMode('sort'),
        });
        this.separator2 = this.menu.addSeparator();

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
        this.enableSelectedBtn = this.menu.addIconItem({
            id: 'enableSelectedBtn',
            title: 'Enable selected',
            onClick: () => this.enableSelected(true),
        });
        this.disableSelectedBtn = this.menu.addIconItem({
            id: 'disableSelectedBtn',
            title: 'Disable selected',
            onClick: () => this.enableSelected(false),
        });
        this.deleteSelectedBtn = this.menu.addIconItem({
            id: 'deleteSelectedBtn',
            icon: 'del',
            title: 'Delete selected',
            onClick: () => this.deleteSelected(),
        });
        this.deleteAllBtn = this.menu.addIconItem({
            id: 'deleteAllBtn',
            icon: 'del',
            title: 'Delete all',
            onClick: () => this.removeAllItems(),
        });
        this.separator3 = this.menu.addSeparator();
        this.rulesCheck = this.menu.addCheckboxItem({
            id: 'rulesCheck',
            label: 'Enable rules',
            checked: true,
            onChange: () => this.onToggleEnableRules(),
        });
        this.rulesBtn = this.menu.addIconItem({
            id: 'rulesBtn',
            icon: 'update',
            title: 'Edit rules',
            onClick: () => this.onRulesClick(),
        });
        this.menu.addSeparator();
        this.similarCheck = this.menu.addCheckboxItem({
            id: 'similarCheck',
            label: 'Check similar transactions',
            checked: true,
            onChange: () => this.onToggleCheckSimilar(),
        });
    }

    createContextMenu() {
        this.contextMenu = PopupMenu.create({
            id: 'contextMenu',
            attached: true,
        });

        this.ctxEnableBtn = this.contextMenu.addIconItem({
            id: 'ctxEnableBtn',
            title: STR_DISABLE_ITEM,
            onClick: () => this.onToggleEnableItem(),
        });
        this.ctxUpdateBtn = this.contextMenu.addIconItem({
            id: 'ctxUpdateBtn',
            icon: 'update',
            title: 'Edit',
            onClick: () => this.onUpdateItem(),
        });
        this.ctxDeleteBtn = this.contextMenu.addIconItem({
            id: 'ctxDeleteBtn',
            icon: 'del',
            title: 'Delete',
            onClick: () => this.onRemoveItem(),
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
        this.rowsContainer.dataset.time = Date.now();
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
        this.applyRules(false);

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
            if (!item.isImported) {
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
        if (!state.checkSimilarEnabled) {
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
        if (state.listMode === listMode) {
            return;
        }
        if (state.listMode === 'list' && !this.saveItem()) {
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

    /** Transaction item collapse/expand event handler */
    onCollapseItem(i, value) {
        const index = this.getItemIndex(i);
        if (index === -1) {
            return;
        }

        this.store.dispatch(actions.collapseItem({ index, collapsed: value }));
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

    onItemClick(e) {
        const index = this.getItemIndexByElem(e.target);
        if (index === -1) {
            return;
        }

        const { listMode } = this.store.getState();
        if (listMode === 'list') {
            if (!e.target.closest('.actions-menu-btn')) {
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

    /** Save form data and replace it by item component */
    saveItem() {
        const state = this.store.getState();
        const { activeItemIndex } = state;
        if (activeItemIndex === -1) {
            return true;
        }

        const formItem = state.items[activeItemIndex];
        const valid = formItem.validate();
        if (!valid) {
            // Navigate to the page with transaction form if needed
            const pageIndex = getPageIndex(activeItemIndex, state);
            this.setPage(pageIndex.page);
            // Render form validation
            const form = this.transactionRows[pageIndex.index];
            form.validate();
            form.elem.scrollIntoView();

            return false;
        }

        this.store.dispatch(actions.saveItem());

        return true;
    }

    cancelEditItem() {
        this.store.dispatch(actions.cancelEditItem());
    }

    /** Add new transaction row and insert it into list */
    createItem() {
        if (!this.saveItem()) {
            return;
        }

        this.store.dispatch(actions.createItem());

        const state = this.store.getState();
        const pageIndex = getPageIndex(state.activeItemIndex, state);
        if (pageIndex.page !== state.pagination.page) {
            throw new Error('Invalid page');
        }

        const form = this.transactionRows[pageIndex.index];
        form.elem.scrollIntoView();
    }

    onUpdateItem() {
        const { activeItemIndex, contextItemIndex } = this.store.getState();
        if (
            contextItemIndex === -1
            || contextItemIndex === activeItemIndex
            || !this.saveItem()
        ) {
            this.hideContextMenu();
            return;
        }

        this.store.dispatch(actions.editItem(contextItemIndex));
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

        if (this.uploadDialog) {
            const state = this.store.getState();
            this.uploadDialog.setMainAccount(state.mainAccount);
        }

        if (!this.uploadDialog || !this.uploadDialog.isVisible()) {
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
        this.submitProgress.show();

        if (!this.saveItem()) {
            this.submitProgress.hide();
            return;
        }

        const state = this.store.getState();
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
    applyRules(restore = true) {
        this.store.dispatch(actions.applyRules(restore));
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
            this.rulesDialog = new ImportRulesDialog({
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

    /** Returns item index in the list */
    getItemIndex(item) {
        const index = this.transactionRows.indexOf(item);
        return this.getAbsoluteIndex(index, this.store.getState());
    }

    /**
     * Search list item by specified element
     * @param {Element} elem - item root element
     */
    getItemIndexByElem(elem) {
        const itemElem = elem?.closest('.import-item,.import-form');
        if (!itemElem) {
            return -1;
        }

        const index = this.transactionRows.findIndex((item) => (itemElem === item.elem));
        return this.getAbsoluteIndex(index, this.store.getState());
    }

    /**
     * Transaction reorder handler
     * @param {Object} original - original item object
     * @param {Object} replaced - new item object
     */
    onTransPosChanged(original, replaced) {
        const state = this.store.getState();
        if (state.items.length < 2) {
            return;
        }

        const fromIndex = this.getItemIndexByElem(original);
        const toIndex = this.getItemIndexByElem(replaced);
        this.store.dispatch(actions.changeItemPosition({ fromIndex, toIndex }));
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

        const listItem = this.transactionRows[pageIndex.index];
        const menuContainer = listItem?.elem?.querySelector('.actions-menu');
        if (!menuContainer) {
            return;
        }

        const item = state.items[index];
        const title = (item.enabled) ? STR_DISABLE_ITEM : STR_ENABLE_ITEM;
        this.ctxEnableBtn.setTitle(title);

        this.ctxUpdateBtn.show(!item.isForm);

        this.contextMenu.attachAndShow(menuContainer);
    }

    renderMenu(state) {
        const isListMode = state.listMode === 'list';
        const isSelectMode = state.listMode === 'select';
        const hasItems = state.items.length > 0;
        const selectedItems = this.getSelectedItems(state);
        const hasEnabled = selectedItems.some((item) => item.enabled);
        const hasDisabled = selectedItems.some((item) => !item.enabled);

        this.createItemBtn.show(isListMode);

        this.listModeBtn.show(!isListMode);
        this.selectModeBtn.show(isListMode && hasItems);
        this.sortModeBtn.show(isListMode && state.items.length > 1);
        show(this.separator2, isSelectMode);
        show(this.separator3, isSelectMode);

        this.selectAllBtn.show(isSelectMode && selectedItems.length < state.items.length);
        this.deselectAllBtn.show(isSelectMode && selectedItems.length > 0);
        this.enableSelectedBtn.show(isSelectMode && hasDisabled);
        this.disableSelectedBtn.show(isSelectMode && hasEnabled);
        this.deleteSelectedBtn.show(isSelectMode && selectedItems.length > 0);
        this.deleteAllBtn.enable(state.items.length > 0);

        this.rulesCheck.show(isListMode);
        this.rulesBtn.show(isListMode);
        this.rulesBtn.enable(state.rulesEnabled);
        this.similarCheck.show(isListMode);
    }

    renderList(state, prevState) {
        if (
            state.items === prevState.items
            && state.pagination === prevState.pagination
            && state.listMode === prevState.listMode
        ) {
            return;
        }

        const hasItems = (state.items.length > 0);

        const firstItem = this.getAbsoluteIndex(0, state);
        const lastItem = firstItem + state.pagination.onPage;
        const items = state.items.slice(firstItem, lastItem);

        let prevItems = null;
        if (prevState.items) {
            const prevFirstItem = this.getAbsoluteIndex(0, prevState);
            const prevLastItem = prevFirstItem + prevState.pagination.onPage;
            prevItems = prevState.items.slice(prevFirstItem, prevLastItem);
        }

        const rows = items.map((item, index) => {
            // Check item not changed
            const isSameItem = !!(prevItems && prevItems[index] && prevItems[index] === item);
            if (isSameItem) {
                return this.transactionRows[index];
            }

            const itemProps = {
                data: item,
                onCollapse: (i, val) => this.onCollapseItem(i, val),
            };

            if (item.isForm) {
                return ImportTransactionForm.create({
                    ...itemProps,
                    onSave: () => this.saveItem(),
                    onCancel: () => this.cancelEditItem(),
                    onUpdate: (data) => this.onFormUpdate(data),
                });
            }

            return ImportTransactionItem.create({
                ...itemProps,
            });
        });

        this.transactionRows = rows;

        removeChilds(this.rowsContainer);
        this.transactionRows.forEach((item) => this.rowsContainer.append(item.elem));

        if (state.pagination.pagesCount > 1) {
            this.rowsContainer.append(this.paginator.elem);
            this.paginator.setState((paginatorState) => ({
                ...paginatorState,
                pagesCount: state.pagination.pagesCount,
                pageNum: state.pagination.page,
            }));
        }

        if (hasItems) {
            re(this.noDataMsg);
            this.noDataMsg = null;
        } else {
            if (!this.noDataMsg) {
                this.noDataMsg = createElement('span', {
                    props: {
                        className: 'nodata-message',
                        textContent: MSG_NO_TRANSACTIONS,
                    },
                });
            }
            this.rowsContainer.append(this.noDataMsg);
        }

        this.createSortable(state);

        this.rowsContainer.classList.toggle(SELECT_MODE_CLASS, state.listMode === 'select');
        this.rowsContainer.classList.toggle(SORT_MODE_CLASS, state.listMode === 'sort');
    }

    render(state, prevState = {}) {
        if (!state) {
            throw new Error('Invalid state');
        }

        this.renderList(state, prevState);

        const accountId = state.mainAccount.id;
        this.accountDropDown.selectItem(accountId.toString());

        const enabledList = this.getEnabledItems(state);

        enable(this.submitBtn, (enabledList.length > 0));
        this.enabledTransCountElem.textContent = enabledList.length;
        this.transCountElem.textContent = state.items.length;

        this.renderContextMenu(state, prevState);
        this.renderMenu(state);
    }
}

window.app = new Application(window.appProps);
window.app.createView(ImportView);
