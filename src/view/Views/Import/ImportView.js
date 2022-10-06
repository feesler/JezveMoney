import 'jezvejs/style';
import {
    ge,
    re,
    ce,
    show,
    removeChilds,
    setEvents,
    enable,
    setEmptyClick,
    removeEmptyClick,
} from 'jezvejs';
import { Checkbox } from 'jezvejs/Checkbox';
import { DropDown } from 'jezvejs/DropDown';
import { Paginator } from 'jezvejs/Paginator';
import { Sortable } from 'jezvejs/Sortable';
import { fixFloat, timestampFromString } from '../../js/utils.js';
import { Application } from '../../js/Application.js';
import { View } from '../../js/View.js';
import { IconLink } from '../../Components/IconLink/IconLink.js';
import '../../css/app.scss';
import './style.scss';
import { ImportUploadDialog } from '../../Components/Import/UploadDialog/Dialog/ImportUploadDialog.js';
import { ImportRulesDialog, IMPORT_RULES_DIALOG_CLASS } from '../../Components/Import/RulesDialog/Dialog/ImportRulesDialog.js';
import { ImportTransactionForm } from '../../Components/Import/TransactionForm/ImportTransactionForm.js';
import { LoadingIndicator } from '../../Components/LoadingIndicator/LoadingIndicator.js';
import { API } from '../../js/api/index.js';
import { ImportTransactionItem } from '../../Components/Import/TransactionItem/ImportTransactionItem.js';
import {
    EXPENSE,
    INCOME,
    TRANSFER,
    DEBT,
} from '../../js/model/Transaction.js';
import { ImportTransaction } from '../../js/model/ImportTransaction.js';

/** Messages */
const MSG_IMPORT_SUCCESS = 'All transactions have been successfully imported';
const MSG_IMPORT_FAIL = 'Fail to import transactions';
const MSG_NO_TRANSACTIONS = 'No transactions to import';
/** Other */
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
        };

        this.menuEmptyClickHandler = () => this.hideActionsMenu();
    }

    /**
     * View initialization
     */
    onStart() {
        if (window.app.model.accounts.length === 0) {
            return;
        }

        this.actionsMenuBtn = ge('toggleActionsMenuBtn');
        setEvents(this.actionsMenuBtn, { click: () => this.toggleActionsMenu() });
        this.actionsList = ge('actionsList');

        this.newItemBtn = IconLink.fromElement({
            elem: 'newItemBtn',
            onclick: () => this.createItem(),
        });
        this.clearFormBtn = IconLink.fromElement({
            elem: 'clearFormBtn',
            onclick: () => this.removeAllItems(),
        });
        this.uploadBtn = IconLink.fromElement({
            elem: 'uploadBtn',
            onclick: () => this.showUploadDialog(),
        });
        this.accountDropDown = DropDown.create({
            elem: 'acc_id',
            onchange: () => this.onMainAccChange(),
            className: 'dd__main-account',
        });
        this.rulesCheck = Checkbox.fromElement(
            ge('rulesCheck'),
            { onChange: () => this.onToggleEnableRules() },
        );
        this.similarCheck = Checkbox.fromElement(
            ge('similarCheck'),
            { onChange: () => this.onToggleCheckSimilar() },
        );

        this.submitBtn = ge('submitbtn');
        this.transCountElem = ge('trcount');
        this.enabledTransCountElem = ge('entrcount');
        this.rulesBtn = ge('rulesBtn');
        this.rowsContainer = ge('rowsContainer');
        if (
            !this.newItemBtn
            || !this.uploadBtn
            || !this.submitBtn
            || !this.transCountElem
            || !this.enabledTransCountElem
            || !this.accountDropDown
            || !this.rulesCheck
            || !this.rulesBtn
            || !this.rowsContainer
        ) {
            throw new Error('Failed to initialize Import view');
        }

        window.app.initAccountsList(this.accountDropDown);

        this.submitBtn.addEventListener('click', () => this.onSubmitClick());
        this.rulesBtn.addEventListener('click', () => this.onRulesClick());
        // Submit progress indicator
        this.submitProgress = LoadingIndicator.create({ title: 'Saving items...' });
        this.submitProgressIndicator = ce('div');
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

        this.trListSortable = new Sortable({
            oninsertat: (orig, replaced) => this.onTransPosChanged(orig, replaced),
            elem: 'rowsContainer',
            group: 'transactions',
            selector: '.import-item,.import-form',
            placeholderClass: 'import-form__placeholder',
            copyWidth: true,
            handles: [{ query: 'div' }, { query: 'label' }],
        });

        const selectedAccount = this.accountDropDown.getSelectionData();
        if (!selectedAccount) {
            throw new Error('Invalid selection data');
        }

        this.setMainAccount(selectedAccount.id);
        this.setRenderTime();
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

    hideActionsMenu() {
        show(this.actionsList, false);
        removeEmptyClick(this.menuEmptyClickHandler);
    }

    toggleActionsMenu() {
        if (this.actionsList.hasAttribute('hidden')) {
            show(this.actionsList, true);
            setEmptyClick(this.menuEmptyClickHandler);
        } else {
            this.hideActionsMenu();
        }
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

                const enableItem = !transaction;
                if (item.enabled === enableItem) {
                    return item;
                }

                const newItem = new ImportTransaction(item);
                newItem.enable(enableItem);
                return newItem;
            }),
        };

        this.setState(state);

        this.loadingInd.hide();
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
        return transactions.find((item) => (
            item
            && !item.picked
            && this.isSameTransaction(item, reference)
        ));
    }

    /** Initial account of upload change callback */
    onUploadAccChange(accountId) {
        this.setMainAccount(accountId);
    }

    /** Remove all transaction rows */
    removeAllItems() {
        this.hideActionsMenu();

        const state = {
            ...this.state,
            items: [],
            activeItemIndex: -1,
            originalItemData: null,
        };
        state.pagination = this.updateList(state);

        this.setState(state);
    }

    /** Transaction item enable/disable event handler */
    onEnableItem(i, value) {
        const index = this.getItemIndex(i);
        if (index === -1) {
            return;
        }

        const state = {
            ...this.state,
            items: this.state.items.map((item, ind) => {
                if (ind !== index) {
                    return item;
                }
                if (item.enabled === value) {
                    return item;
                }

                const newItem = new ImportTransaction(item);
                newItem.enable(value);
                return newItem;
            }),
        };
        this.setState(state);
    }

    /**
     * Transaction item remove event handler
     * Return boolean result confirming remove action
     * @param {ImportTransactionBase} item - item to remove
     */
    onRemoveItem(item) {
        const index = this.getItemIndex(item);
        if (index === -1) {
            return;
        }

        const state = {
            ...this.state,
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

        const form = this.transactionRows[pageIndex.index];
        if (!originalItemData) {
            this.onRemoveItem(form);
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
        this.hideActionsMenu();

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

    onUpdateItem(transactionItem) {
        const { activeItemIndex } = this.state;
        const index = this.getItemIndex(transactionItem);
        if (index === -1 || index === activeItemIndex) {
            return;
        }

        if (activeItemIndex !== -1) {
            const saveResult = this.saveItem();
            if (!saveResult) {
                return;
            }
        }

        const itemToUpdate = this.state.items[index];
        const originalItemData = new ImportTransaction(itemToUpdate);
        const state = {
            ...this.state,
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

    setItemMainAccount(item, accountId) {
        if (!item) {
            return null;
        }

        if (item?.mainAccount?.id === accountId) {
            return item;
        }

        const newItem = new ImportTransaction(item);
        newItem.setMainAccount(accountId);
        return newItem;
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

        const state = {
            ...this.state,
            mainAccount,
            items: this.state.items.map((item) => this.setItemMainAccount(item, mainAccount.id)),
            originalItemData: this.setItemMainAccount(this.state.originalItemData, mainAccount.id),
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
        this.hideActionsMenu();

        const state = {
            ...this.state,
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
        this.hideActionsMenu();

        const checkSimilarEnabled = !!this.similarCheck.checked;
        this.setState({
            ...this.state,
            checkSimilarEnabled,
        });

        if (checkSimilarEnabled) {
            this.requestSimilar();
        } else {
            this.enableAll();
        }
    }

    /** Rules button 'click' event handler */
    onRulesClick() {
        this.hideActionsMenu();

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
        const index = this.transactionRows.findIndex((item) => (elem === item.elem));
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

    setState(state) {
        if (this.state === state) {
            return;
        }

        this.render(state, this.state);
        this.state = state;
    }

    renderList(state, prevState) {
        if (
            state.items === prevState.items
            && state.pagination === prevState.pagination
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
                onEnable: (i, val) => this.onEnableItem(i, val),
                onRemove: (i) => this.onRemoveItem(i),
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
                onUpdate: (i) => this.onUpdateItem(i),
            });
        });

        this.transactionRows = rows;

        removeChilds(this.rowsContainer);
        this.transactionRows.forEach((item) => this.rowsContainer.append(item.elem));

        if (state.pagination.pagesCount > 1) {
            this.rowsContainer.append(this.paginator.elem);
            this.paginator.setPagesCount(state.pagination.pagesCount);
            this.paginator.setPage(state.pagination.page);
        }

        if (hasItems) {
            re(this.noDataMsg);
            this.noDataMsg = null;
        } else {
            if (!this.noDataMsg) {
                this.noDataMsg = ce('span', { className: 'nodata-message', textContent: MSG_NO_TRANSACTIONS });
            }
            this.rowsContainer.append(this.noDataMsg);
        }
    }

    render(state, prevState = {}) {
        if (!state) {
            throw new Error('Invalid state');
        }

        this.renderList(state, prevState);

        const accountId = state.mainAccount.id;
        this.accountDropDown.selectItem(accountId.toString());

        const hasItems = (state.items.length > 0);
        const enabledList = this.getEnabledItems(state);

        enable(this.submitBtn, (enabledList.length > 0));
        this.enabledTransCountElem.textContent = enabledList.length;
        this.transCountElem.textContent = state.items.length;

        this.clearFormBtn.enable(hasItems);
        enable(this.rulesBtn, this.state.rulesEnabled);
    }
}

window.app = new Application(window.appProps);
window.app.createView(ImportView);
