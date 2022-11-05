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
import { fixFloat, timestampFromString } from '../../js/utils.js';
import { Application } from '../../js/Application.js';
import '../../css/app.scss';
import { View } from '../../js/View.js';
import {
    EXPENSE,
    INCOME,
    TRANSFER,
    DEBT,
} from '../../js/model/Transaction.js';
import { ImportTransaction } from '../../js/model/ImportTransaction.js';
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

        this.state = {
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

    createSortable(state = this.state) {
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
            title: 'Enable selected',
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
        if (this.state.contextItemIndex === itemIndex) {
            return;
        }

        this.setState({ ...this.state, contextItemIndex: itemIndex });
    }

    hideContextMenu() {
        this.showContextMenu(-1);
    }

    /** Updates list state */
    updateList(state) {
        const { items, pagination } = state;

        const pagesCount = Math.ceil(items.length / pagination.onPage);
        const res = {
            ...pagination,
            total: items.length,
            pagesCount,
        };

        res.page = (pagesCount > 0) ? Math.min(pagesCount, res.page) : 1;

        return res;
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
            this.uploadDialog = ImportUploadDialog.create({
                mainAccount: this.state.mainAccount,
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

        this.mapImportedItems(items);
    }

    /** Map data after template applied and request API for transactions in same date range */
    mapImportedItems(itemsData) {
        if (!Array.isArray(itemsData)) {
            throw new Error('Invalid data');
        }

        const state = {
            ...this.state,
            items: [...this.state.items],
        };

        itemsData.forEach((row) => {
            const data = this.mapImportItem(row);
            if (!data) {
                throw new Error('Failed to map data row');
            }

            const props = this.convertItemDataToProps(data, state);
            const item = new ImportTransaction(props.data);
            item.state.listMode = this.state.listMode;
            state.items.push(item);
        });
        state.pagination = this.updateList(state);
        this.setState(state);

        this.applyRules(false);

        if (this.state.checkSimilarEnabled) {
            this.requestSimilar();
        } else {
            this.setRenderTime();
        }
    }

    /**
     * Map import row to new transaction
     * @param {Object} data - import data
     */
    mapImportItem(data) {
        const { mainAccount } = this.state;

        if (!data) {
            throw new Error('Invalid data');
        }

        if (data.accountCurrencyId !== mainAccount.curr_id) {
            throw new Error('Currency must be the same as main account');
        }
        const accAmount = parseFloat(fixFloat(data.accountAmount));
        if (Number.isNaN(accAmount) || accAmount === 0) {
            throw new Error('Invalid account amount value');
        }
        const trAmount = parseFloat(fixFloat(data.transactionAmount));
        if (Number.isNaN(trAmount) || trAmount === 0) {
            throw new Error('Invalid transaction amount value');
        }

        const item = {
            enabled: true,
            type: (accAmount > 0) ? INCOME : EXPENSE,
            originalData: {
                ...data,
                origAccount: { ...mainAccount },
            },
        };

        if (item.type === EXPENSE) {
            item.src_id = mainAccount.id;
            item.dest_id = 0;
            item.dest_amount = Math.abs(trAmount);
            item.dest_curr = data.transactionCurrencyId;
            item.src_amount = Math.abs(accAmount);
            item.src_curr = data.accountCurrencyId;
        } else if (item.type === INCOME) {
            item.src_id = 0;
            item.dest_id = mainAccount.id;
            item.src_amount = Math.abs(trAmount);
            item.src_curr = data.transactionCurrencyId;
            item.dest_amount = Math.abs(accAmount);
            item.dest_curr = data.accountCurrencyId;
        }

        item.date = window.app.formatDate(new Date(data.date));
        item.comment = data.comment;

        return item;
    }

    /** Returns date range for current imported transactions */
    getImportedItemsDateRange(state = this.state) {
        const res = { start: 0, end: 0 };
        state.items.forEach((item) => {
            if (!this.isImportedItem(item)) {
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
            const range = this.getImportedItemsDateRange();
            const result = await API.transaction.list({
                count: 0,
                stdate: window.app.formatDate(new Date(range.start)),
                enddate: window.app.formatDate(new Date(range.end)),
                acc_id: this.state.mainAccount.id,
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
        if (!this.state.checkSimilarEnabled) {
            return;
        }

        this.loadingInd.show();

        const transCache = await this.fetchSimilarTransactions();
        if (!transCache) {
            this.loadingInd.hide();
            return;
        }

        const state = {
            ...this.state,
            items: this.state.items.map((item) => {
                if (!this.isImportedItem(item)) {
                    return item;
                }

                const data = item.getData();
                const transaction = this.findSameTransaction(transCache, data);
                if (transaction) {
                    transaction.picked = true;
                }

                if (item.isSameSimilarTransaction(transaction)) {
                    return item;
                }

                const newItem = new ImportTransaction(item);
                newItem.setSimilarTransaction(transaction);
                return newItem;
            }),
        };

        this.setState(state);

        this.loadingInd.hide();
        this.setRenderTime();
    }

    disableCheckSimilar() {
        const state = {
            ...this.state,
            items: this.state.items.map((item) => {
                if (!this.isImportedItem(item)) {
                    return item;
                }
                if (item.isSameSimilarTransaction(null)) {
                    return item;
                }

                const newItem = new ImportTransaction(item);
                newItem.setSimilarTransaction(null);
                return newItem;
            }),
        };

        this.setState(state);
        this.setRenderTime();
    }

    /**
     * Compare transaction item with reference object
     * @param {TransactionItem} item - transaction item object
     * @param {Object} reference - imported transaction object
     */
    isSameTransaction(item, reference) {
        if (!item || !reference) {
            throw new Error('Invalid parameters');
        }

        // Check date, source and destination accounts
        if (
            item.src_id !== reference.src_id
            || item.dest_id !== reference.dest_id
            || item.date !== reference.date
        ) {
            return false;
        }

        // Check amounts
        // Source and destination amount can be swapped
        const refSrcAmount = Math.abs(reference.src_amount);
        const refDestAmount = Math.abs(reference.dest_amount);
        if (
            (item.src_amount !== refSrcAmount && item.src_amount !== refDestAmount)
            || (item.dest_amount !== refDestAmount && item.dest_amount !== refSrcAmount)
        ) {
            return false;
        }

        return true;
    }

    /** Return first found transaction with same date and amount as reference */
    findSameTransaction(transactions, reference) {
        const res = transactions.find((item) => (
            item
            && !item.picked
            && this.isSameTransaction(item, reference)
        ));
        return res ?? null;
    }

    /** Initial account of upload change callback */
    onUploadAccChange(accountId) {
        this.setMainAccount(accountId);
    }

    reduceSelectAll(state = this.state) {
        return {
            ...state,
            items: state.items.map((item) => {
                const newItem = new ImportTransaction(item);
                newItem.select(true);
                return newItem;
            }),
        };
    }

    reduceDeselectAll(state = this.state) {
        return {
            ...state,
            items: state.items.map((item) => {
                const newItem = new ImportTransaction(item);
                newItem.select(false);
                return newItem;
            }),
        };
    }

    selectAll() {
        this.setState(this.reduceSelectAll());
    }

    deselectAll() {
        this.setState(this.reduceDeselectAll());
    }

    enableSelected(value) {
        if (this.state.listMode !== 'select') {
            return;
        }

        this.setState({
            ...this.state,
            items: this.state.items.map((item) => {
                if (!item.selected) {
                    return item;
                }

                const newItem = new ImportTransaction(item);
                newItem.enable(!!value);
                return newItem;
            }),
        });
    }

    deleteSelected() {
        if (this.state.listMode !== 'select') {
            return;
        }

        const state = {
            ...this.state,
            items: this.state.items.filter((item) => !item.selected),
        };
        state.pagination = this.updateList(state);
        if (state.items.length === 0) {
            state.listMode = 'list';
        }

        this.setState(state);
    }

    setListMode(listMode) {
        if (this.state.listMode === listMode) {
            return;
        }
        if (this.state.listMode === 'list' && !this.saveItem()) {
            return;
        }

        this.setState({
            ...this.state,
            listMode,
            contextItemIndex: -1,
            items: this.state.items.map((item) => {
                const newItem = new ImportTransaction(item);
                newItem.state.listMode = listMode;
                newItem.select(false);
                return newItem;
            }),
        });
    }

    toggleSelectItem(index) {
        if (this.state.listMode !== 'select' || index === -1) {
            return;
        }

        this.setState({
            ...this.state,
            items: this.state.items.map((item, ind) => {
                if (index !== ind) {
                    return item;
                }

                const newItem = new ImportTransaction(item);
                newItem.toggleSelect();
                return newItem;
            }),
        });
    }

    /** Remove all transaction rows */
    removeAllItems() {
        const state = {
            ...this.state,
            items: [],
            activeItemIndex: -1,
            originalItemData: null,
            listMode: 'list',
        };
        state.pagination = this.updateList(state);

        this.setState(state);
    }

    /** Transaction item collapse/expand event handler */
    onCollapseItem(i, value) {
        const index = this.getItemIndex(i);
        if (index === -1) {
            return;
        }

        this.setState({
            ...this.state,
            items: this.state.items.map((item, ind) => {
                if (ind !== index) {
                    return item;
                }
                if (item.collapsed === value) {
                    return item;
                }

                const newItem = new ImportTransaction(item);
                newItem.collapse(value);
                return newItem;
            }),
        });
    }

    /** Transaction item enable/disable event handler */
    onToggleEnableItem() {
        const index = this.state.contextItemIndex;
        if (index === -1) {
            this.hideContextMenu();
            return;
        }

        this.setState({
            ...this.state,
            contextItemIndex: -1,
            items: this.state.items.map((item, ind) => {
                if (ind !== index) {
                    return item;
                }

                const newItem = new ImportTransaction(item);
                newItem.enable(!item.enabled);
                return newItem;
            }),
        });
    }

    onItemClick(e) {
        const index = this.getItemIndexByElem(e.target);
        if (index === -1) {
            return;
        }

        const { listMode } = this.state;
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
        this.removeItem(this.state.contextItemIndex);
    }

    removeItem(index) {
        if (index === -1) {
            return;
        }

        const state = {
            ...this.state,
            contextItemIndex: -1,
            items: this.state.items.filter((_, ind) => (ind !== index)),
        };

        if (state.activeItemIndex === index) {
            state.activeItemIndex = -1;
            state.originalItemData = null;
        } else if (index < state.activeItemIndex) {
            state.activeItemIndex -= 1;
        }

        state.pagination = this.updateList(state);
        this.setState(state);
    }

    /** Enables or disables all items of transaction list */
    // TODO : Add action in menu or remove this method
    enableAll(value = true) {
        const state = {
            ...this.state,
            items: this.state.items.map((item) => {
                if (item.enabled === value) {
                    return item;
                }

                const newItem = new ImportTransaction(item);
                newItem.enable(value);

                return newItem;
            }),
        };

        this.setState(state);
        this.setRenderTime();
    }

    /** Change page of transactions list */
    setPage(page) {
        if (this.state.pagination.page === page) {
            return;
        }

        this.setState({
            ...this.state,
            pagination: {
                ...this.state.pagination,
                page,
            },
        });
    }

    convertItemDataToProps(data, state) {
        const { mainAccount } = state;
        const res = {
            mainAccount,
            isForm: data.isForm,
            enabled: data.enabled,
            sourceAmount: data.src_amount,
            destAmount: data.dest_amount,
            srcCurrId: data.src_curr,
            destCurrId: data.dest_curr,
            date: data.date,
            comment: data.comment,
        };

        if (data.type === EXPENSE) {
            res.type = 'expense';
            res.sourceAccountId = data.src_id;
        } else if (data.type === INCOME) {
            res.type = 'income';
            res.destAccountId = data.dest_id;
        } else if (data.type === TRANSFER) {
            const isTransferFrom = data.src_id === mainAccount.id;
            res.type = (isTransferFrom) ? 'transferfrom' : 'transferto';
            if (isTransferFrom) {
                res.destAccountId = data.dest_id;
            } else {
                res.sourceAccountId = data.src_id;
            }
        } else if (data.type === DEBT) {
            res.type = (data.op === 1) ? 'debtto' : 'debtfrom';
            res.personId = data.person_id;
        }

        if (data.originalData) {
            res.originalData = { ...data.originalData };
        }

        return { data: res };
    }

    /** Returns true if specified item was imported */
    isImportedItem(item) {
        return !!item?.state?.originalData;
    }

    /** Save form data and replace it by item component */
    saveItem() {
        const { activeItemIndex } = this.state;
        if (activeItemIndex === -1) {
            return true;
        }

        const formItem = this.state.items[activeItemIndex];
        const valid = formItem.validate();
        if (!valid) {
            // Navigate to the page with transaction form if needed
            const pageIndex = this.getPageIndex(activeItemIndex);
            this.setPage(pageIndex.page);
            // Render form validation
            const form = this.transactionRows[pageIndex.index];
            form.validate();
            form.elem.scrollIntoView();

            return false;
        }

        const savedItem = new ImportTransaction(formItem);
        savedItem.isForm = false;

        this.setState({
            ...this.state,
            items: this.state.items.map((item, ind) => (
                (ind === activeItemIndex) ? savedItem : item
            )),
            activeItemIndex: -1,
            originalItemData: null,
        });

        return true;
    }

    cancelItemEdit() {
        const { activeItemIndex, originalItemData } = this.state;
        if (activeItemIndex === -1) {
            return;
        }

        const pageIndex = this.getPageIndex(activeItemIndex);
        if (pageIndex.page !== this.state.pagination.page) {
            throw new Error('Invalid page');
        }

        if (!originalItemData) {
            this.removeItem(activeItemIndex);
            return;
        }

        const state = {
            ...this.state,
            items: this.state.items.map((item, ind) => (
                (ind === activeItemIndex) ? originalItemData : item
            )),
            activeItemIndex: -1,
            originalItemData: null,
        };
        this.setState(state);
    }

    /** Add new transaction row and insert it into list */
    createItem() {
        if (this.state.listMode !== 'list') {
            return;
        }

        const { mainAccount } = this.state;
        if (!mainAccount) {
            return;
        }

        if (!this.saveItem()) {
            return;
        }

        const itemData = {
            isForm: true,
            enabled: true,
            type: EXPENSE,
            src_amount: '',
            dest_amount: '',
            src_curr: mainAccount.curr_id,
            dest_curr: mainAccount.curr_id,
            date: window.app.formatDate(new Date()),
            comment: '',
        };
        const itemProps = this.convertItemDataToProps(itemData, this.state);
        const newItem = new ImportTransaction(itemProps.data);
        newItem.state.listMode = 'list';

        const state = {
            ...this.state,
            items: [...this.state.items, newItem],
            activeItemIndex: this.state.items.length,
            originalItemData: null,
        };
        state.pagination = this.updateList(state);
        state.pagination.page = state.pagination.pagesCount;
        this.setState(state);

        const pageIndex = this.getPageIndex(this.state.activeItemIndex);
        if (pageIndex.page !== this.state.pagination.page) {
            throw new Error('Invalid page');
        }

        const form = this.transactionRows[pageIndex.index];
        form.elem.scrollIntoView();
    }

    onUpdateItem() {
        const { activeItemIndex } = this.state;
        const index = this.state.contextItemIndex;
        if (
            index === -1
            || index === activeItemIndex
            || !this.saveItem()
        ) {
            this.hideContextMenu();
            return;
        }

        const itemToUpdate = this.state.items[index];
        const originalItemData = new ImportTransaction(itemToUpdate);
        const state = {
            ...this.state,
            contextItemIndex: -1,
            items: this.state.items.map((item, ind) => {
                const isForm = (ind === index);
                if (item.isForm === isForm) {
                    return item;
                }

                const newItem = new ImportTransaction(item);
                newItem.isForm = isForm;
                return newItem;
            }),
            activeItemIndex: index,
            originalItemData,
        };

        this.setState(state);
    }

    /** ImportTransaction 'update' event handler */
    onFormUpdate(data) {
        const { activeItemIndex } = this.state;
        if (activeItemIndex === -1) {
            return;
        }

        const formData = new ImportTransaction(data);
        this.state.items[activeItemIndex] = formData;
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
            this.uploadDialog.setMainAccount(this.state.mainAccount);
        }

        if (!this.uploadDialog || !this.uploadDialog.isVisible()) {
            this.requestSimilar();
        } else {
            this.setRenderTime();
        }
    }

    /** Set main account */
    setMainAccount(accountId) {
        if (this.state.mainAccount?.id === accountId) {
            return;
        }

        const mainAccount = window.app.model.accounts.getItem(accountId);
        if (!mainAccount) {
            throw new Error(`Account ${accountId} not found`);
        }

        const setItemMainAccount = (item, id) => {
            if (!item || item?.mainAccount?.id === id) {
                return item;
            }

            const newItem = new ImportTransaction(item);
            newItem.setMainAccount(id);
            return newItem;
        };

        const state = {
            ...this.state,
            mainAccount,
            items: this.state.items.map((item) => setItemMainAccount(item, mainAccount.id)),
            originalItemData: setItemMainAccount(this.state.originalItemData, mainAccount.id),
        };

        this.setState(state);
    }

    /** Filter enabled transaction items */
    getEnabledItems(state = this.state) {
        if (!Array.isArray(state?.items)) {
            throw new Error('Invalid state');
        }

        return state.items.filter((item) => item.enabled);
    }

    /** Filter enabled transaction items */
    getSelectedItems(state = this.state) {
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

        const enabledList = this.getEnabledItems();
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
        if (!this.state.rulesEnabled) {
            return;
        }

        const state = {
            ...this.state,
            rulesEnabled: !!this.rulesCheck.checked,
        };

        state.items = this.state.items.map((item) => {
            if (!this.isImportedItem(item)) {
                return item;
            }

            const newItem = new ImportTransaction(item);
            if (restore) {
                newItem.restoreOriginal();
            }
            window.app.model.rules.applyTo(newItem);

            return newItem;
        });

        this.setState(state);
    }

    /** Rules checkbox 'change' event handler */
    onToggleEnableRules() {
        const state = {
            ...this.state,
            contextItemIndex: -1,
            rulesEnabled: !!this.rulesCheck.checked,
        };

        state.items = this.state.items.map((item) => {
            if (!this.isImportedItem(item)) {
                return item;
            }

            const newItem = new ImportTransaction(item);
            if (state.rulesEnabled) {
                window.app.model.rules.applyTo(newItem);
            } else {
                newItem.restoreOriginal();
            }

            return newItem;
        });

        this.setState(state);
    }

    /** Check similar transactions checkbox 'change' event handler */
    onToggleCheckSimilar() {
        const checkSimilarEnabled = !!this.similarCheck.checked;
        this.setState({
            ...this.state,
            contextItemIndex: -1,
            checkSimilarEnabled,
        });

        if (checkSimilarEnabled) {
            this.requestSimilar();
        } else {
            this.disableCheckSimilar();
        }
    }

    /** Rules button 'click' event handler */
    onRulesClick() {
        if (!this.state.rulesEnabled) {
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
    getAbsoluteIndex(index, state = this.state) {
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

    /** Returns page number and relative index of specified absolute index */
    getPageIndex(index, state = this.state) {
        if (index === -1) {
            return { page: 0, index: -1 };
        }

        const { pagination } = state;

        return {
            page: Math.max(1, Math.ceil(index / pagination.onPage)),
            index: index % pagination.onPage,
        };
    }

    /** Returns item index in the list */
    getItemIndex(item) {
        const index = this.transactionRows.indexOf(item);
        return this.getAbsoluteIndex(index);
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
        return this.getAbsoluteIndex(index);
    }

    /**
     * Transaction reorder handler
     * @param {Object} original - original item object
     * @param {Object} replaced - new item object
     */
    onTransPosChanged(original, replaced) {
        if (this.state.items.length < 2) {
            return;
        }

        const origIndex = this.getItemIndexByElem(original);
        const replacedIndex = this.getItemIndexByElem(replaced);
        if (origIndex === -1 || replacedIndex === -1) {
            return;
        }

        const { activeItemIndex } = this.state;

        const state = {
            ...this.state,
            items: [...this.state.items],
        };

        const [cutItem] = state.items.splice(origIndex, 1);
        state.items.splice(replacedIndex, 0, cutItem);

        if (activeItemIndex !== -1) {
            if (activeItemIndex === origIndex) {
                state.activeItemIndex = replacedIndex;
            } else if (activeItemIndex > origIndex && activeItemIndex < replacedIndex) {
                state.activeItemIndex -= 1;
            } else if (activeItemIndex < origIndex && activeItemIndex > replacedIndex) {
                state.activeItemIndex += 1;
            }
        }

        this.setState(state);
    }

    renderContextMenu(state) {
        if (state.listMode !== 'list') {
            this.contextMenu.detach();
            return;
        }
        const index = state.contextItemIndex;
        if (index === -1) {
            return;
        }

        const pageIndex = this.getPageIndex(index, state);
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

        if (this.contextMenu.menuList.parentNode !== menuContainer) {
            PopupMenu.hideActive();
            this.contextMenu.attachTo(menuContainer);
            this.contextMenu.toggleMenu();
        }
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
                    onCancel: () => this.cancelItemEdit(),
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

        this.renderContextMenu(state);
        this.renderMenu(state);
    }
}

window.app = new Application(window.appProps);
window.app.createView(ImportView);
