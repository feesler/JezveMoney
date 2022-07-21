import 'jezvejs/style';
import {
    ge,
    re,
    ce,
    enable,
} from 'jezvejs';
import { formatDate } from 'jezvejs/DateUtils';
import { Sortable } from 'jezvejs/Sortable';
import { DropDown } from 'jezvejs/DropDown';
import { Checkbox } from 'jezvejs/Checkbox';
import { timestampFromString, createMessage } from '../../js/app.js';
import { Application } from '../../js/Application.js';
import { View } from '../../js/View.js';
import { IconLink } from '../../Components/IconLink/IconLink.js';
import '../../css/app.css';
import './style.css';
import { ImportUploadDialog } from '../../Components/ImportUploadDialog/ImportUploadDialog.js';
import { ImportRulesDialog, IMPORT_RULES_DIALOG_CLASS } from '../../Components/ImportRulesDialog/ImportRulesDialog.js';
import { ImportTransactionItem } from '../../Components/ImportTransactionItem/ImportTransactionItem.js';
import { LoadingIndicator } from '../../Components/LoadingIndicator/LoadingIndicator.js';
import { API } from '../../js/API.js';

const SUBMIT_LIMIT = 100;
/** Messages */
const MSG_IMPORT_SUCCESS = 'All transactions have been successfully imported';
const MSG_IMPORT_FAIL = 'Fail to import transactions';
const MSG_NO_TRANSACTIONS = 'No transactions to import';

/**
 * Import view constructor
 */
class ImportView extends View {
    constructor(...args) {
        super(...args);

        this.state = {
            transactionRows: [],
            mainAccount: null,
            transCache: null,
            rulesEnabled: true,
        };
    }

    /**
     * View initialization
     */
    onStart() {
        if (window.app.model.accounts.length === 0) {
            return;
        }

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
            input_id: 'acc_id',
            onchange: () => this.onMainAccChange(),
            editable: false,
            className: 'dd__fullwidth',
        });

        this.rulesCheck = Checkbox.fromElement(
            ge('rulesCheck'),
            { onChange: () => this.onToggleEnableRules() },
        );

        this.submitBtn = ge('submitbtn');
        this.transCountElem = ge('trcount');
        this.enabledTransCountElem = ge('entrcount');
        this.rulesBtn = ge('rulesBtn');
        this.rulesCountElem = ge('rulescount');
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
            || !this.rulesCountElem
            || !this.rowsContainer
        ) {
            throw new Error('Failed to initialize Import view');
        }

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
        // Data loading indicator
        this.loadingInd = LoadingIndicator.create({ fixed: false });
        this.rowsContainer.append(this.loadingInd.elem);

        this.trListSortable = new Sortable({
            oninsertat: (orig, replaced) => this.onTransPosChanged(orig, replaced),
            container: 'rowsContainer',
            group: 'transactions',
            selector: '.import-item',
            placeholderClass: 'import-item__placeholder',
            copyWidth: true,
            handles: [{ query: 'div' }, { query: 'label' }],
        });

        this.updMainAccObj();
        this.setRenderTime();
    }

    /** Update render time data attribute of list container */
    setRenderTime() {
        this.rowsContainer.dataset.time = Date.now();
    }

    /** Import rules 'update' event handler */
    onUpdateRules() {
        const rulesCount = window.app.model.rules.length;

        this.rulesCountElem.textContent = rulesCount;

        this.reApplyRules();
    }

    /** Show upload file dialog popup */
    showUploadDialog() {
        if (!this.uploadDialog) {
            this.uploadDialog = new ImportUploadDialog({
                parent: this,
                mainAccount: this.state.mainAccount,
                elem: 'uploadDialog',
                onaccountchange: (accountId) => this.onUploadAccChange(accountId),
                onuploaddone: (items) => this.onImportDone(items),
            });
        }

        this.uploadDialog.show();
    }

    /** File upload done handler */
    onImportDone(items) {
        this.uploadDialog.hide();

        this.mapImportedItems(items);

        this.render(this.state);
    }

    /** Map data after template applied and request API for transactions in same date range */
    mapImportedItems(data) {
        if (!Array.isArray(data)) {
            throw new Error('Invalid data');
        }

        data.forEach((row) => {
            const item = this.mapImportItem(row);
            if (!item) {
                throw new Error('Failed to map data row');
            }

            item.pos = this.state.transactionRows.length;
            this.state.transactionRows.push(item);
            this.rowsContainer.appendChild(item.elem);
        });

        this.requestSimilar();
    }

    /**
     * Map import row to new transaction
     * @param {Object} data - import data
     */
    mapImportItem(data) {
        if (!data) {
            throw new Error('Invalid data');
        }

        const item = new ImportTransactionItem({
            parent: this,
            mainAccount: this.state.mainAccount,
            originalData: data,
        });

        if (this.state.rulesEnabled) {
            window.app.model.rules.applyTo(item);
        }
        item.render();

        return item;
    }

    /**
     * Send API request to obtain transactions similar to imported.
     * Compare list of import items with transactions already in DB
     *  and disable import item if same(similar) transaction found
     */
    async requestSimilar() {
        this.loadingInd.show();

        // Obtain date region of imported transactions
        const importedDateRange = { start: 0, end: 0 };
        const importedItems = this.getImportedItems();
        importedItems.forEach((item) => {
            let timestamp;

            try {
                const date = item.getDate();
                timestamp = timestampFromString(date);
            } catch (e) {
                return;
            }

            if (importedDateRange.start === 0 || importedDateRange.start > timestamp) {
                importedDateRange.start = timestamp;
            }
            if (importedDateRange.end === 0 || importedDateRange.end < timestamp) {
                importedDateRange.end = timestamp;
            }
        });
        // Prepare request data
        const reqParams = {
            count: 0,
            stdate: formatDate(new Date(importedDateRange.start)),
            enddate: formatDate(new Date(importedDateRange.end)),
            acc_id: this.state.mainAccount.id,
        };

        // Send request
        try {
            const result = await API.transaction.list(reqParams);
            this.state.transCache = result.data.items;
        } catch (e) {
            this.loadingInd.hide();
            return;
        }

        importedItems.forEach((item) => {
            item.enable(true);
            const data = item.getData();
            const transaction = this.findSameTransaction(data);
            if (transaction) {
                transaction.picked = true;
                item.enable(false);
            }
            item.render();
        });

        /* Print imported items with no similar trasaction */
        console.log('Not picked import items:');
        importedItems.forEach((item) => {
            if (item.state.enabled) {
                const dateFmt = formatDate(new Date(item.data.date));

                console.log(`tr_amount: ${item.data.transactionAmount} acc_amount: ${item.data.accountAmount} date: ${dateFmt} comment: ${item.data.comment}`);
            }
        });

        /* Print transactions not matched to imported list */
        console.log('Not picked transactions:');
        this.state.transCache.forEach((tr) => {
            if (!tr.picked) {
                console.log(`id: ${tr.id} src_amount: ${tr.src_amount} dest_amount: ${tr.dest_amount} date: ${tr.date} comment: ${tr.comment}`);
            }
        });

        this.render(this.state);
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
        if (item.src_id !== reference.src_id
            || item.dest_id !== reference.dest_id
            || item.date !== reference.date) {
            return false;
        }

        // Check amounts
        // Source and destination amount can be swapped
        const refSrcAmount = Math.abs(reference.src_amount);
        const refDestAmount = Math.abs(reference.dest_amount);
        if ((item.src_amount !== refSrcAmount && item.src_amount !== refDestAmount)
            || (item.dest_amount !== refDestAmount && item.dest_amount !== refSrcAmount)) {
            return false;
        }

        return true;
    }

    /** Return first found transaction with same date and amount as reference */
    findSameTransaction(reference) {
        return this.state.transCache.find(
            (item) => (item && !item.picked && this.isSameTransaction(item, reference)),
        );
    }

    /** Initial account of upload change callback */
    onUploadAccChange(accountId) {
        if (this.state.mainAccount.id === accountId) {
            return;
        }

        this.accountDropDown.selectItem(accountId.toString());
        this.onMainAccChange();
    }

    /** Refresh main account at model according to current selection */
    updMainAccObj() {
        let account = null;

        const selectedAccount = this.accountDropDown.getSelectionData();
        if (selectedAccount) {
            account = window.app.model.accounts.getItem(selectedAccount.id);
        }
        if (!account) {
            throw new Error('Account not found');
        }

        this.state.mainAccount = account;
    }

    /** Set positions of rows as they follows */
    updateRowsPos() {
        const updatedRows = this.state.transactionRows.map((item, ind) => {
            const res = item;
            res.pos = ind;
            return res;
        });

        this.state.transactionRows = updatedRows;
    }

    /** Remove all transaction rows */
    removeAllItems() {
        this.state.transactionRows.forEach((item) => re(item.elem));
        this.state.transactionRows = [];
        this.render(this.state);
    }

    /** Transaction item enable/disable event handler */
    onEnableItem(item) {
        if (!item) {
            return;
        }

        this.render(this.state);
    }

    /**
     * Transaction item remove event handler
     * Return boolean result confirming remove action
     * @param {ImportTransactionItem} item - item to remove
     */
    onRemoveItem(item) {
        if (!item) {
            return false;
        }

        const delPos = item.pos;
        this.state.transactionRows.splice(delPos, 1);
        this.updateRowsPos();
        this.render(this.state);

        return true;
    }

    /** Add new transaction row and insert it into list */
    createItem() {
        this.updMainAccObj();
        if (!this.state.mainAccount) {
            return;
        }

        const item = ImportTransactionItem.create({
            parent: this,
            mainAccount: this.state.mainAccount,
        });
        item.enable(true);
        item.render();

        this.rowsContainer.appendChild(item.elem);
        item.pos = this.state.transactionRows.length;
        this.state.transactionRows.push(item);

        this.render(this.state);
    }

    /**
     * Main account select event handler
     */
    onMainAccChange() {
        this.updMainAccObj();
        if (!this.state.mainAccount) {
            return;
        }

        this.state.transactionRows.forEach(
            (item) => item.onMainAccountChanged(this.state.mainAccount.id),
        );

        this.reApplyRules();

        if (this.uploadDialog) {
            this.uploadDialog.setMainAccount(this.state.mainAccount);
        }

        if (!this.uploadDialog || !this.uploadDialog.isVisible()) {
            this.requestSimilar();
        } else {
            this.setRenderTime();
        }
    }

    /** Filter imported transaction items */
    getImportedItems() {
        if (!this.state || !Array.isArray(this.state.transactionRows)) {
            throw new Error('Invalid state');
        }

        return this.state.transactionRows.filter((item) => item.getOriginal() !== null);
    }

    /** Filter enabled transaction items */
    getEnabledItems() {
        if (!this.state || !Array.isArray(this.state.transactionRows)) {
            throw new Error('Invalid state');
        }

        return this.state.transactionRows.filter((item) => item.isEnabled());
    }

    /** Submit buttom 'click' event handler */
    onSubmitClick() {
        this.submitProgress.show();

        const enabledList = this.getEnabledItems();
        if (!Array.isArray(enabledList) || !enabledList.length) {
            throw new Error('Invalid list of items');
        }

        const valid = enabledList.every((item) => item.validate());
        if (!valid) {
            this.submitProgress.hide();
            return;
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
        createMessage(message, (status ? 'msg_success' : 'msg_error'));
    }

    /** Apply rules to imported items */
    reApplyRules() {
        if (!this.state.rulesEnabled) {
            return;
        }

        const importedItems = this.getImportedItems();
        importedItems.forEach((item) => {
            item.restoreOriginal();
            const applied = window.app.model.rules.applyTo(item);
            if (applied) {
                item.render();
            }
        });
    }

    /** Rules checkbox 'change' event handler */
    onToggleEnableRules() {
        this.state.rulesEnabled = !!this.rulesCheck.checked;
        enable(this.rulesBtn, this.state.rulesEnabled);

        const importedItems = this.getImportedItems();
        importedItems.forEach((item) => {
            if (this.state.rulesEnabled) {
                window.app.model.rules.applyTo(item);
            } else {
                item.restoreOriginal();
            }
            item.render();
        });
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
                parent: this,
                elem: document.querySelector(`.${IMPORT_RULES_DIALOG_CLASS}`),
            });
        }

        this.rulesDialog.show();
    }

    /**
     * Search row object by specified element
     * @param {Element} rowEl - row root element
     */
    getRowByElem(rowEl) {
        return this.state.transactionRows.find((rowObj) => (rowEl === rowObj.elem));
    }

    /**
     * Transaction reorder handler
     * @param {Object} original - original item object
     * @param {Object} replaced - new item object
     */
    onTransPosChanged(original, replaced) {
        if (this.state.transactionRows.length < 2) {
            return;
        }

        const origItem = this.getRowByElem(original);
        if (!origItem || !replaced) {
            return;
        }

        const replacedItem = this.getRowByElem(replaced);
        if (!replacedItem) {
            return;
        }
        const cutItem = this.state.transactionRows.splice(origItem.pos, 1)[0];
        this.state.transactionRows.splice(replacedItem.pos, 0, cutItem);

        this.updateRowsPos();
    }

    render(state) {
        if (!state) {
            throw new Error('Invalid state');
        }

        const hasItems = (state.transactionRows.length > 0);
        const enabledList = this.getEnabledItems();

        enable(this.submitBtn, (enabledList.length > 0));
        this.enabledTransCountElem.textContent = enabledList.length;
        this.transCountElem.textContent = state.transactionRows.length;

        this.clearFormBtn.enable(hasItems);
        if (hasItems) {
            re(this.noDataMsg);
            this.noDataMsg = null;
        } else {
            if (!this.noDataMsg) {
                this.noDataMsg = ce('span', { className: 'nodata-message', textContent: MSG_NO_TRANSACTIONS });
            }
            this.rowsContainer.appendChild(this.noDataMsg);
        }
    }
}

window.app = new Application(window.appProps);
window.app.createView(ImportView);
