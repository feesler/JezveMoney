import 'jezvejs/style';
import {
    ge,
    re,
    ce,
    show,
    enable,
    urlJoin,
    ajax,
} from 'jezvejs';
import { Sortable } from 'jezvejs/Sortable';
import { DropDown } from 'jezvejs/DropDown';
import { formatDate, timestampFromString, createMessage } from '../../js/app.js';
import { View } from '../../js/View.js';
import { AccountList } from '../../js/model/AccountList.js';
import { CurrencyList } from '../../js/model/CurrencyList.js';
import { PersonList } from '../../js/model/PersonList.js';
import { ImportRuleList } from '../../js/model/ImportRuleList.js';
import { ImportTemplateList } from '../../js/model/ImportTemplateList.js';
import { IconLink } from '../../Components/IconLink/IconLink.js';
import '../../css/app.css';
import './style.css';
import { ImportUploadDialog } from '../../Components/ImportUploadDialog/ImportUploadDialog.js';
import { ImportRulesDialog } from '../../Components/ImportRulesDialog/ImportRulesDialog.js';
import { ImportTransactionItem } from '../../Components/ImportTransactionItem/ImportTransactionItem.js';

/* eslint no-bitwise: "off" */
/* global baseURL */

/**
 * Import view constructor
 */
class ImportView extends View {
    constructor(...args) {
        super(...args);

        this.model = {
            transactionRows: [],
            mainAccount: null,
            transCache: null,
            rulesEnabled: true,
        };

        this.model.accounts = AccountList.create(this.props.accounts);
        this.model.currency = CurrencyList.create(this.props.currencies);
        this.model.persons = PersonList.create(this.props.persons);
        this.model.rules = ImportRuleList.create(this.props.rules);
        this.model.templates = ImportTemplateList.create(this.props.templates);
    }

    /**
     * View initialization
     */
    onStart() {
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
            onchange: this.onMainAccChange.bind(this),
            editable: false,
            extraClass: 'dd__fullwidth',
        });

        this.submitBtn = ge('submitbtn');
        this.transCountElem = ge('trcount');
        this.enabledTransCountElem = ge('entrcount');
        this.rulesCheck = ge('rulesCheck');
        this.rulesBtn = ge('rulesBtn');
        this.rulesCountElem = ge('rulescount');
        this.rowsContainer = ge('rowsContainer');
        if (!this.newItemBtn
            || !this.uploadBtn
            || !this.submitBtn
            || !this.transCountElem
            || !this.enabledTransCountElem
            || !this.accountDropDown
            || !this.rulesCheck
            || !this.rulesBtn
            || !this.rulesCountElem
            || !this.rowsContainer) {
            throw new Error('Failed to initialize Import view');
        }

        this.submitBtn.addEventListener('click', this.onSubmitClick.bind(this));
        this.rulesCheck.addEventListener('change', this.onToggleEnableRules.bind(this));
        this.rulesBtn.addEventListener('click', this.onRulesClick.bind(this));

        this.noDataMsg = this.rowsContainer.querySelector('.nodata-message');
        this.loadingInd = this.rowsContainer.querySelector('.data-container__loading');
        if (!this.loadingInd) {
            throw new Error('Failed to initialize Import view');
        }

        this.trListSortable = new Sortable({
            oninsertat: this.onTransPosChanged.bind(this),
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
        const rulesCount = this.model.rules.length;

        this.rulesCountElem.textContent = rulesCount;

        this.reApplyRules();
    }

    /** Show upload file dialog popup */
    showUploadDialog() {
        if (!this.uploadDialog) {
            this.uploadDialog = new ImportUploadDialog({
                parent: this,
                currencyModel: this.model.currency,
                accountModel: this.model.accounts,
                personModel: this.model.persons,
                rulesModel: this.model.rules,
                tplModel: this.model.templates,
                mainAccount: this.model.mainAccount,
                elem: 'uploadDialog',
                onaccountchange: this.onUploadAccChange.bind(this),
                onuploaddone: this.onImportDone.bind(this),
            });
        }

        this.uploadDialog.show();
    }

    /** File upload done handler */
    onImportDone(items) {
        this.uploadDialog.hide();

        this.mapImportedItems(items);

        this.updateItemsCount();
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

            item.pos = this.model.transactionRows.length;
            this.model.transactionRows.push(item);
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
            currencyModel: this.model.currency,
            accountModel: this.model.accounts,
            personModel: this.model.persons,
            mainAccount: this.model.mainAccount,
            originalData: data,
        });

        if (this.model.rulesEnabled) {
            this.model.rules.applyTo(item);
        }
        item.render();

        return item;
    }

    /** Send API request to obtain transactions similar to imported */
    requestSimilar() {
        show(this.loadingInd, true);

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
        const reqParams = urlJoin({
            count: 0,
            stdate: formatDate(new Date(importedDateRange.start)),
            enddate: formatDate(new Date(importedDateRange.end)),
            acc_id: this.model.mainAccount.id,
        });
        // Send request
        ajax.get({
            url: `${baseURL}api/transaction/list/?${reqParams}`,
            callback: this.onTrCacheResult.bind(this),
        });
    }

    /**
     * Transactions list API request callback
     * Compare list of import items with transactions already in DB
     *  and disable import item if same(similar) transaction found
     * @param {string} response - server response string
     */
    onTrCacheResult(response) {
        let jsondata;

        try {
            jsondata = JSON.parse(response);
            if (!jsondata || jsondata.result !== 'ok') {
                throw new Error('Invalid server response');
            }
        } catch (e) {
            show(this.loadingInd, false);
            return;
        }

        this.model.transCache = jsondata.data;
        const importedItems = this.getImportedItems();
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

        show(this.loadingInd, false);
        this.updateItemsCount();
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
        return this.model.transCache.find(
            (item) => (item && !item.picked && this.isSameTransaction(item, reference)),
        );
    }

    /** Initial account of upload change callback */
    onUploadAccChange(accountId) {
        this.accountDropDown.selectItem(accountId.toString());
        this.onMainAccChange();
    }

    /** Refresh main account at model according to current selection */
    updMainAccObj() {
        let account = null;

        const selectedAccount = this.accountDropDown.getSelectionData();
        if (selectedAccount) {
            account = this.model.accounts.getItem(selectedAccount.id);
        }
        if (!account) {
            throw new Error('Account not found');
        }

        this.model.mainAccount = account;
    }

    /** Set positions of rows as they follows */
    updateRowsPos() {
        const updatedRows = this.model.transactionRows.map((item, ind) => {
            const res = item;
            res.pos = ind;
            return res;
        });

        this.model.transactionRows = updatedRows;
    }

    /** Update count of total/enabled import items and perform related actions */
    updateItemsCount() {
        const hasItems = (this.model.transactionRows.length > 0);
        const enabledList = this.getEnabledItems();

        enable(this.submitBtn, (enabledList.length > 0));
        this.enabledTransCountElem.textContent = enabledList.length;
        this.transCountElem.textContent = this.model.transactionRows.length;

        this.clearFormBtn.enable(hasItems);
        if (hasItems) {
            re(this.noDataMsg);
            this.noDataMsg = null;
        } else {
            if (!this.noDataMsg) {
                this.noDataMsg = ce('span', { className: 'nodata-message', textContent: 'No transactions to import' });
            }
            this.rowsContainer.appendChild(this.noDataMsg);
        }
    }

    /** Remove all transaction rows */
    removeAllItems() {
        this.model.transactionRows.forEach((item) => re(item.elem));
        this.model.transactionRows = [];
        this.updateItemsCount();
    }

    /** Transaction item enable/disable event handler */
    onEnableItem(item) {
        if (!item) {
            return;
        }

        this.updateItemsCount();
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
        this.model.transactionRows.splice(delPos, 1);
        this.updateRowsPos();
        this.updateItemsCount();

        return true;
    }

    /** Add new transaction row and insert it into list */
    createItem() {
        this.updMainAccObj();
        if (!this.model.mainAccount) {
            return;
        }

        const item = ImportTransactionItem.create({
            parent: this,
            currencyModel: this.model.currency,
            accountModel: this.model.accounts,
            personModel: this.model.persons,
            mainAccount: this.model.mainAccount,
        });
        item.enable(true);
        item.render();

        this.rowsContainer.appendChild(item.elem);
        item.pos = this.model.transactionRows.length;
        this.model.transactionRows.push(item);

        this.updateItemsCount();
    }

    /**
     * Main account select event handler
     */
    onMainAccChange() {
        this.updMainAccObj();
        if (!this.model.mainAccount) {
            return;
        }

        this.model.transactionRows.forEach(
            (item) => item.onMainAccountChanged(this.model.mainAccount.id),
        );

        this.reApplyRules();

        if (!this.uploadDialog || !this.uploadDialog.isVisible()) {
            this.requestSimilar();
        } else {
            this.setRenderTime();
        }
    }

    /** Filter imported transaction items */
    getImportedItems() {
        if (!this.model || !Array.isArray(this.model.transactionRows)) {
            throw new Error('Invalid state');
        }

        return this.model.transactionRows.filter((item) => item.getOriginal() !== null);
    }

    /** Filter enabled transaction items */
    getEnabledItems() {
        if (!this.model || !Array.isArray(this.model.transactionRows)) {
            throw new Error('Invalid state');
        }

        return this.model.transactionRows.filter((item) => item.isEnabled());
    }

    /** Submit buttom 'click' event handler */
    onSubmitClick() {
        const enabledList = this.getEnabledItems();
        if (!Array.isArray(enabledList) || !enabledList.length) {
            throw new Error('Invalid list of items');
        }

        const valid = enabledList.every((item) => item.validate());
        if (!valid) {
            return;
        }

        const requestObj = enabledList.map((item) => {
            const res = item.getData();
            if (!res) {
                throw new Error('Invalid transaction object');
            }

            return res;
        });

        ajax.post({
            url: `${baseURL}api/transaction/createMultiple/`,
            data: JSON.stringify(requestObj),
            headers: { 'Content-Type': 'application/json' },
            callback: this.onSubmitResult.bind(this),
        });
    }

    /**
     * Submit response handler
     * @param {String} response - response text
     */
    onSubmitResult(response) {
        let status = false;
        let message = 'Fail to import transactions';

        try {
            const respObj = JSON.parse(response);
            status = (respObj && respObj.result === 'ok');
            if (status) {
                message = 'All transactions have been successfully imported';
                this.removeAllItems();
            } else if (respObj && respObj.msg) {
                message = respObj.msg;
            }
        } catch (e) {
            message = e.message;
        }

        createMessage(message, (status ? 'msg_success' : 'msg_error'));
    }

    /** Apply rules to imported items */
    reApplyRules() {
        if (!this.model.rulesEnabled) {
            return;
        }

        const importedItems = this.getImportedItems();
        importedItems.forEach((item) => {
            item.restoreOriginal();
            const applied = this.model.rules.applyTo(item);
            if (applied) {
                item.render();
            }
        });
    }

    /** Rules checkbox 'change' event handler */
    onToggleEnableRules() {
        this.model.rulesEnabled = !!this.rulesCheck.checked;
        enable(this.rulesBtn, this.model.rulesEnabled);

        const importedItems = this.getImportedItems();
        importedItems.forEach(function (item) {
            if (this.model.rulesEnabled) {
                this.model.rules.applyTo(item);
            } else {
                item.restoreOriginal();
            }
            item.render();
        }, this);
    }

    /** Rules button 'click' event handler */
    onRulesClick() {
        if (!this.model.rulesEnabled) {
            return;
        }

        this.showRulesDialog();
    }

    /** Show rules dialog popup */
    showRulesDialog() {
        if (!this.rulesDialog) {
            this.rulesDialog = new ImportRulesDialog({
                parent: this,
                tplModel: this.model.templates,
                currencyModel: this.model.currency,
                accountModel: this.model.accounts,
                personModel: this.model.persons,
                rulesModel: this.model.rules,
                elem: 'rulesDialog',
            });
        }

        this.rulesDialog.show();
    }

    /**
     * Search row object by specified element
     * @param {Element} rowEl - row root element
     */
    getRowByElem(rowEl) {
        return this.model.transactionRows.find((rowObj) => (rowEl === rowObj.elem));
    }

    /**
     * Transaction reorder handler
     * @param {Object} original - original item object
     * @param {Object} replaced - new item object
     */
    onTransPosChanged(original, replaced) {
        if (this.model.transactionRows.length < 2) {
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
        const cutItem = this.model.transactionRows.splice(origItem.pos, 1)[0];
        this.model.transactionRows.splice(replacedItem.pos, 0, cutItem);

        this.updateRowsPos();
    }
}

window.view = new ImportView(window.app);
