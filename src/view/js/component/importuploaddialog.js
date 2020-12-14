'use strict';

/* global ge, isDate, isFunction, show, extend */
/* global selectedValue, urlJoin, ajax, createMessage, baseURL */
/* global Component, Popup, Uploader, ImportTransactionItem */

/**
 * ImportUploadDialog component constructor
 * @param {Object} props
 */
function ImportUploadDialog() {
    ImportUploadDialog.parent.constructor.apply(this, arguments);

    if (
        !this.parent
        || !this.props
        || !this.props.mainAccount
        || !this.props.currencyModel
        || !this.props.accountModel
        || !this.props.personModel
        || !this.props.rulesModel
    ) {
        throw new Error('Invalid props');
    }

    this.model = {
        currency: this.props.currencyModel,
        accounts: this.props.accountModel,
        persons: this.props.personModel,
        rules: this.props.rulesModel,
        mainAccount: this.props.mainAccount
    };

    if (!isFunction(this.props.onuploaddone)) {
        throw new Error('uploaddone handler not specified');
    }
    this.uploadDoneHandler = this.props.onuploaddone;
    this.accountChangeHandler = this.props.onaccountchange;

    this.importedItems = null;

    this.formElem = ge('fileimportfrm');
    if (!this.formElem) {
        throw new Error('Failed to initialize upload file dialog');
    }

    this.formElem.addEventListener('submit', this.onFileImport.bind(this));
    this.formElem.addEventListener('reset', this.onResetFileImport.bind(this));

    this.popup = Popup.create({
        id: 'fileupload_popup',
        title: 'Upload',
        content: this.formElem,
        onclose: this.resetUploadForm.bind(this),
        btn: {
            closeBtn: true
        },
        additional: 'center_only upload-popup'
    });

    this.inputElem = ge('fileInp');
    this.filenameElem = document.querySelector('.import-form .import-form__filename');
    if (!this.inputElem || !this.filenameElem) {
        throw new Error('Failed to initialize upload file dialog');
    }
    this.inputElem.addEventListener('change', this.onChangeUploadFile.bind(this));

    this.initialAccountSel = ge('initialAccount');
    this.templateSel = ge('templateSel');
    this.importControls = ge('importControls');
    this.isEncodeCheck = ge('isEncodeCheck');
    if (
        !this.initialAccountSel
        || !this.templateSel
        || !this.importControls
        || !this.isEncodeCheck
    ) {
        throw new Error('Failed to initialize upload file dialog');
    }

    this.initialAccountSel.addEventListener('change', this.onAccountChange.bind(this));

    if (isFunction(this.initDialogExtras)) {
        this.initDialogExtras();
    }
}

extend(ImportUploadDialog, Component);

/** Show/hide dialog */
ImportUploadDialog.prototype.show = function (val) {
    this.popup.show(val);
};

/** Hide dialog */
ImportUploadDialog.prototype.hide = function () {
    this.popup.hide();
};

/** Enable/disable upload button */
ImportUploadDialog.prototype.enableUploadButton = function (val) {
    var submitBtn;

    if (val) {
        submitBtn = { value: 'Import', onclick: this.onFileImport.bind(this) };
    } else {
        submitBtn = false;
    }

    this.popup.setControls({
        okBtn: submitBtn,
        closeBtn: true
    });
};

/** Copy file name from file input */
ImportUploadDialog.prototype.updateUploadFileName = function () {
    var pos;
    var fileName;

    if (!this.inputElem) {
        throw new Error('Upload dialog not initialized');
    }
    fileName = this.inputElem.value;
    if (fileName.includes('fakepath')) {
        pos = fileName.lastIndexOf('\\');
        fileName = fileName.substr(pos + 1);
    }

    this.filenameElem.textContent = fileName;
};

/** Reset file upload form */
ImportUploadDialog.prototype.resetUploadForm = function () {
    if (!this.formElem) {
        throw new Error('Upload dialog not initialized');
    }

    this.formElem.reset();
};

/** Import form 'reset' event handler */
ImportUploadDialog.prototype.onResetFileImport = function () {
    setTimeout(this.resetImportForm.bind(this));
};

/**
 * File input 'change' event handler
 * Update displayng file name and show control of form
 */
ImportUploadDialog.prototype.onChangeUploadFile = function () {
    this.updateUploadFileName();

    this.enableUploadButton(true);
    show(this.importControls, true);
};

/** Initial account select 'change' event handler */
ImportUploadDialog.prototype.onAccountChange = function () {
    var accountId = selectedValue(this.initialAccountSel);
    var account = this.model.accounts.getItem(accountId);
    if (!account) {
        throw new Error('Account not found');
    }

    this.model.mainAccount = account;

    if (isFunction(this.accountChangeHandler)) {
        this.accountChangeHandler(accountId);
    }
};

/** Update displaying file name and hide controls of form */
ImportUploadDialog.prototype.resetImportForm = function () {
    this.updateUploadFileName();

    this.enableUploadButton(false);
    show(this.importControls, false);
};

/** Upload file to server */
ImportUploadDialog.prototype.onFileImport = function () {
    var file;
    var uploader;
    var templateId = this.templateSel.value;
    var isEncoded = this.isEncodeCheck.checked;

    if (isFunction(this.beforeUpload) && !this.beforeUpload()) {
        return;
    }

    file = this.inputElem.files[0];
    if (!file) {
        return;
    }

    uploader = new Uploader(
        file,
        { template: templateId, encode: isEncoded },
        this.onImportSuccess.bind(this),
        this.onImportError.bind(this),
        this.onImportProgress.bind(this)
    );
    uploader.upload();
};

/** Import error callback */
ImportUploadDialog.prototype.onImportError = function () {
    this.importLoadCallback(null);
};

/** Import progress callback */
ImportUploadDialog.prototype.onImportProgress = function () {
};

/**
 * Import data request callback
 * @param {object} response - data for import request
 */
ImportUploadDialog.prototype.onImportSuccess = function (response) {
    var defErrorMessage = 'Fail to import file';
    var importedDateRange = { start: 0, end: 0 };
    var rows;
    var reqParams;

    try {
        this.resetUploadForm();
        rows = JSON.parse(response);
        if (!rows || rows.result !== 'ok' || !Array.isArray(rows.data)) {
            throw new Error((rows && 'msg' in rows) ? rows.msg : defErrorMessage);
        }
    } catch (e) {
        createMessage(e.message, 'msg_error');
        return;
    }

    try {
        this.importedItems = rows.data.map(function (row) {
            var timestamp;
            var item;

            if (!row) {
                throw new Error('Invalid data row object');
            }

            // Store date region of imported transactions
            timestamp = this.timestampFromDateString(row.date);
            if (importedDateRange.start === 0 || importedDateRange.start > timestamp) {
                importedDateRange.start = timestamp;
            }
            if (importedDateRange.end === 0 || importedDateRange.end < timestamp) {
                importedDateRange.end = timestamp;
            }

            item = this.mapImportItem(row);
            if (!item) {
                throw new Error('Failed to map data row');
            }

            return item;
        }, this);

        reqParams = urlJoin({
            count: 0,
            stdate: this.formatDate(new Date(importedDateRange.start)),
            enddate: this.formatDate(new Date(importedDateRange.end)),
            acc_id: this.model.mainAccount.id
        });

        ajax.get({
            url: baseURL + 'api/transaction/list/?' + reqParams,
            callback: this.onTrCacheResult.bind(this)
        });
    } catch (e) {
        createMessage(e.message, 'msg_error');
        this.importedItems = null;
        this.importDone();
    }
};

/**
 * Map import row to new transaction
 * @param {Object} data - import data
 */
ImportUploadDialog.prototype.mapImportItem = function (data) {
    var accCurr;
    var trCurr;
    var item;

    if (!data) {
        throw new Error('Invalid data');
    }

    accCurr = this.model.currency.findByName(data.accCurrVal);
    if (!accCurr) {
        throw new Error('Unknown currency ' + data.accCurrVal);
    }

    trCurr = this.model.currency.findByName(data.trCurrVal);
    if (!trCurr) {
        throw new Error('Unknown currency ' + data.trCurrVal);
    }

    /** Currency should be same as main account */
    if (accCurr.id !== this.model.mainAccount.curr_id) {
        throw new Error('Currency must be the same as main account');
    }

    item = new ImportTransactionItem({
        parent: this.parent,
        currencyModel: this.model.currency,
        accountModel: this.model.accounts,
        personModel: this.model.persons,
        mainAccount: this.model.mainAccount,
        originalData: data
    });

    item.setAmount(-data.accAmountVal);
    if (trCurr.id !== accCurr.id) {
        item.setCurrency(trCurr.id);
        item.setSecondAmount(-data.trAmountVal);
    }
    item.setDate(data.date);
    item.setComment(data.comment);

    this.model.rules.applyTo(data, item);
    item.render();

    return item;
};

/**
 * Compare transaction item with reference object
 * @param {TransactionItem} item - transaction item object
 * @param {Object} reference - imported transaction object
 */
ImportUploadDialog.prototype.isSameTransaction = function (item, reference) {
    var refSrcAmount;
    var refDestAmount;

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
    refSrcAmount = Math.abs(reference.src_amount);
    refDestAmount = Math.abs(reference.dest_amount);
    if ((item.src_amount !== refSrcAmount && item.src_amount !== refDestAmount)
        || (item.dest_amount !== refDestAmount && item.dest_amount !== refSrcAmount)) {
        return false;
    }

    return true;
};

/** Return first found transaction with same date and amount as reference */
ImportUploadDialog.prototype.findSameTransaction = function (reference) {
    return this.model.transCache.find(function (item) {
        return (item && !item.picked && this.isSameTransaction(item, reference));
    }, this);
};

/**
 * Transactions list API request callback
 * Compare list of import items with transactions already in DB
 *  and disable import item if same(similar) transaction found
 * @param {string} response - server response string
 */
ImportUploadDialog.prototype.onTrCacheResult = function (response) {
    var jsondata;

    try {
        jsondata = JSON.parse(response);
        if (!jsondata || jsondata.result !== 'ok') {
            throw new Error('Invalid server response');
        }
    } catch (e) {
        this.importedItems = null;
        this.importDone();
        return;
    }

    this.model.transCache = jsondata.data;
    this.importedItems.forEach(function (item) {
        var data = item.getData();
        var transaction = this.findSameTransaction(data);
        if (transaction) {
            transaction.picked = true;
            item.enable(false);
            item.render();
        }
    }, this);

    this.importDone();
};

/** Hide import file form */
ImportUploadDialog.prototype.importDone = function () {
    this.enableUploadButton(false);
    show(this.importControls, false);

    this.uploadDoneHandler(this.importedItems);
    this.importedItems = null;
};

/**
 * Format date as DD.MM.YYYY
 * @param {Date} date - date to format
 */
ImportUploadDialog.prototype.formatDate = function (date) {
    var month;
    var year;
    var day;

    if (!isDate(date)) {
        throw new Error('Invalid type of parameter');
    }

    month = date.getMonth();
    year = date.getFullYear();
    day = date.getDate();

    return ((day > 9) ? '' : '0') + day + '.'
        + ((month + 1 > 9) ? '' : '0') + (month + 1) + '.'
        + year;
};

/**
 * Convert date string to timestamp
 * @param {string} str - date string in DD.MM.YYYY format
 */
ImportUploadDialog.prototype.timestampFromDateString = function (str) {
    var dparts;
    var res;

    if (typeof str !== 'string') {
        throw new Error('Invalid type of parameter');
    }

    dparts = str.split('.');
    res = new Date(dparts[2], dparts[1] - 1, dparts[0]);

    return res.getTime();
};
