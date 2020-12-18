'use strict';

/* global ge, ce, addChilds, removeChilds, copyObject, isDate, isFunction, show, extend */
/* global selectedValue, selectByValue, urlJoin, ajax, createMessage, baseURL */
/* global Component, Popup, ImportTemplate, ConfirmDialog, ImportTransactionItem */
/* global ImportFileUploader */

var jsonParseErrorMessage = 'Fail to parse server response';
var templateDeleteTitle = 'Delete import template';
var templateDeleteMsg = 'Are you sure to delete this import template?';

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
        || !this.props.tplModel
    ) {
        throw new Error('Invalid props');
    }

    this.model = {
        currency: this.props.currencyModel,
        accounts: this.props.accountModel,
        persons: this.props.personModel,
        rules: this.props.rulesModel,
        templates: this.props.tplModel,
        mainAccount: this.props.mainAccount
    };

    if (!isFunction(this.props.onuploaddone)) {
        throw new Error('uploaddone handler not specified');
    }
    this.uploadDoneHandler = this.props.onuploaddone;
    this.accountChangeHandler = this.props.onaccountchange;

    this.BROWSE_STATE = 1;
    this.RAW_DATA_STATE = 2;
    this.TPL_UPDATE_STATE = 3;
    this.TPL_APPLIED_STATE = 4;

    this.state = { id: this.BROWSE_STATE };
    this.importedItems = null;

    this.uploader = new ImportFileUploader({
        elem: 'fileBlock',
        uploaded: this.onUploaded.bind(this)
    });

    this.popup = Popup.create({
        id: 'fileupload_popup',
        title: 'Upload',
        content: this.elem,
        onclose: this.onClose.bind(this),
        btn: {
            closeBtn: true
        },
        additional: 'center_only upload-popup'
    });

    this.initialAccountSel = ge('initialAccount');
    this.templateSel = ge('templateSel');
    this.nameInpBlock = ge('nameInpBlock');
    this.tplNameInp = ge('tplNameInp');
    this.createTplBtn = ge('createTplBtn');
    this.updateTplBtn = ge('updateTplBtn');
    this.deleteTplBtn = ge('deleteTplBtn');
    this.columnTypeBlock = ge('columnTypeBlock');
    this.columnSel = ge('columnSel');
    this.tplControls = ge('tplControls');
    this.submitTplBtn = ge('submitTplBtn');
    this.cancelTplBtn = ge('cancelTplBtn');
    this.rawDataTable = ge('rawDataTable');
    this.importControls = ge('importControls');
    if (
        !this.initialAccountSel
        || !this.templateSel
        || !this.nameInpBlock
        || !this.tplNameInp
        || !this.createTplBtn
        || !this.updateTplBtn
        || !this.deleteTplBtn
        || !this.columnTypeBlock
        || !this.columnSel
        || !this.tplControls
        || !this.submitTplBtn
        || !this.cancelTplBtn
        || !this.rawDataTable
        || !this.importControls
    ) {
        throw new Error('Failed to initialize upload file dialog');
    }

    this.templateSel.addEventListener('change', this.onTemplateChange.bind(this));
    this.tplNameInp.addEventListener('input', this.onTemplateNameInput.bind(this));
    this.createTplBtn.addEventListener('click', this.onCreateTemplateClick.bind(this));
    this.updateTplBtn.addEventListener('click', this.onUpdateTemplateClick.bind(this));
    this.deleteTplBtn.addEventListener('click', this.onDeleteTemplateClick.bind(this));
    this.submitTplBtn.addEventListener('click', this.onSubmitTemplateClick.bind(this));
    this.cancelTplBtn.addEventListener('click', this.onCancelTemplateClick.bind(this));
    this.initialAccountSel.addEventListener('change', this.onAccountChange.bind(this));
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

/** Hide dialog */
ImportUploadDialog.prototype.onClose = function () {
    this.uploader.reset();
};

/** Enable/disable upload button */
ImportUploadDialog.prototype.enableUploadButton = function (val) {
    var submitBtn;

    if (val) {
        submitBtn = { value: 'Import' };
    } else {
        submitBtn = false;
    }

    this.popup.setControls({
        okBtn: submitBtn,
        closeBtn: true
    });
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

/** Import template select 'change' event handler */
ImportUploadDialog.prototype.onTemplateChange = function () {
    var value;
    var template;

    if (this.state.id !== this.RAW_DATA_STATE) {
        return;
    }

    value = selectedValue(this.templateSel);
    template = this.model.templates.getItem(value);
    this.state.template = template;

    this.renderRawData(this.state);
};

/** Template name field 'input' event handler */
ImportUploadDialog.prototype.onTemplateNameInput = function () {
    this.state.template.name = this.tplNameInp.value;

    this.parent.clearBlockValidation(this.nameInpBlock);
};

/** Create template button 'click' event handler */
ImportUploadDialog.prototype.onCreateTemplateClick = function () {
    this.state.id = this.TPL_UPDATE_STATE;
    this.state.template = new ImportTemplate({
        name: '',
        type_id: 0
    });

    this.renderRawData(this.state);
};

/** Update template button 'click' event handler */
ImportUploadDialog.prototype.onUpdateTemplateClick = function () {
    this.state.id = this.TPL_UPDATE_STATE;

    this.renderRawData(this.state);
};

/** Delete template button 'click' event handler */
ImportUploadDialog.prototype.onDeleteTemplateClick = function () {
    var requestObj = {
        id: this.state.template.id
    };

    ConfirmDialog.create({
        id: 'tpl_delete_warning',
        title: templateDeleteTitle,
        content: templateDeleteMsg,
        onconfirm: function () {
            ajax.post({
                url: baseURL + 'api/importtpl/delete',
                data: JSON.stringify(requestObj),
                headers: { 'Content-Type': 'application/json' },
                callback: this.onDeleteTemplateResult.bind(this)
            });
        }.bind(this)
    });
};

/** Delete template API request result handler */
ImportUploadDialog.prototype.onDeleteTemplateResult = function (response) {
    var defErrorMessage = 'Fail to delete import template';
    var jsondata;

    try {
        jsondata = JSON.parse(response);
    } catch (e) {
        createMessage(jsonParseErrorMessage, 'msg_error');
        return;
    }

    try {
        if (!jsondata || jsondata.result !== 'ok') {
            throw new Error((jsondata && 'msg' in jsondata) ? jsondata.msg : defErrorMessage);
        }

        this.state.id = this.RAW_DATA_STATE;
        this.requestTemplatesList();
    } catch (e) {
        createMessage(e.message, 'msg_error');
    }
};

/** Save template button 'click' event handler */
ImportUploadDialog.prototype.onSubmitTemplateClick = function () {
    var reqURL = baseURL + 'api/importtpl/';
    var requestObj = {
        name: this.state.template.name,
        type_id: this.state.template.type_id,
        date_col: this.state.template.dateColumn,
        comment_col: this.state.template.commentColumn,
        trans_curr_col: this.state.template.transactionCurrColumn,
        trans_amount_col: this.state.template.transactionAmountColumn,
        account_curr_col: this.state.template.accountCurrColumn,
        account_amount_col: this.state.template.accountAmountColumn
    };

    if (!this.state.template.name.length) {
        this.parent.invalidateBlock(this.nameInpBlock);
        return;
    }

    if (this.state.template.id) {
        reqURL += 'update';
        requestObj.id = this.state.template.id;
    } else {
        reqURL += 'create';
    }

    ajax.post({
        url: reqURL,
        data: JSON.stringify(requestObj),
        headers: { 'Content-Type': 'application/json' },
        callback: this.onSubmitTemplateResult.bind(this)
    });
};

/** Cancel template button 'click' event handler */
ImportUploadDialog.prototype.onSubmitTemplateResult = function (response) {
    var defErrorMessage = 'Fail to submit import template';
    var jsondata;

    try {
        jsondata = JSON.parse(response);
    } catch (e) {
        createMessage(jsonParseErrorMessage, 'msg_error');
        return;
    }

    try {
        if (!jsondata || jsondata.result !== 'ok') {
            throw new Error((jsondata && 'msg' in jsondata) ? jsondata.msg : defErrorMessage);
        }

        this.state.id = this.RAW_DATA_STATE;
        this.requestTemplatesList();
    } catch (e) {
        createMessage(e.message, 'msg_error');
    }
};

/** Send API request to obain list of import templates */
ImportUploadDialog.prototype.requestTemplatesList = function () {
    ajax.get({
        url: baseURL + 'api/importtpl/list/',
        callback: this.onTemplateListResult.bind(this)
    });
};

/** Send API request to obain list of import templates */
ImportUploadDialog.prototype.onTemplateListResult = function (response) {
    var defErrorMessage = 'Fail to read list of import templates';
    var jsondata;

    try {
        jsondata = JSON.parse(response);
    } catch (e) {
        createMessage(jsonParseErrorMessage, 'msg_error');
        return;
    }

    try {
        if (!jsondata || jsondata.result !== 'ok' || !Array.isArray(jsondata.data)) {
            throw new Error((jsondata && 'msg' in jsondata) ? jsondata.msg : defErrorMessage);
        }

        this.model.templates.setData(jsondata.data);
        this.renderTemplateSelect();
        this.renderRawData(this.state);
    } catch (e) {
        createMessage(e.message, 'msg_error');
    }
};

/** Render import template select element according to the data in model */
ImportUploadDialog.prototype.renderTemplateSelect = function () {
    var dataOptions;
    var noItemOption;

    removeChilds(this.templateSel);

    noItemOption = ce('option', { value: 0, textContent: 'No template selected' });
    this.templateSel.appendChild(noItemOption);

    dataOptions = this.model.templates.data.map(function (item) {
        return ce('option', { value: item.id, textContent: item.name });
    });
    addChilds(this.templateSel, dataOptions);

    selectByValue(this.templateSel, 0);
    this.state.template = null;
};

/** Cancel template button 'click' event handler */
ImportUploadDialog.prototype.onCancelTemplateClick = function () {
    var value;
    var template;

    if (this.state.id !== this.TPL_UPDATE_STATE) {
        return;
    }

    this.state.id = this.RAW_DATA_STATE;
    // Restore previously selected template
    value = selectedValue(this.templateSel);
    template = this.model.templates.getItem(value);
    this.state.template = template;
    this.renderRawData(this.state);
};

/** Raw data table column 'click' event handler */
ImportUploadDialog.prototype.onDataColumnClick = function (index) {
    var value;

    if (this.state.id !== this.TPL_UPDATE_STATE) {
        return;
    }

    value = selectedValue(this.columnSel);
    this.state.template[value] = index + 1;

    this.renderRawData(this.state);
};

/**
 * Import data request callback
 * @param {Array} data - data from uploader file
 */
ImportUploadDialog.prototype.onUploaded = function (data) {
    try {
        if (!data) {
            throw new Error('Invalid import data');
        }

        this.state = {
            id: this.RAW_DATA_STATE,
            rawData: copyObject(data),
            rowsToShow: 3
        };

        show(this.importControls, true);
        this.renderRawData(this.state);
    } catch (e) {
        createMessage(e.message, 'msg_error');
        this.importedItems = null;
        this.importDone();
    }
};

/** Apply import template */
ImportUploadDialog.prototype.applyTemplate = function (data) {
    var importedDateRange = { start: 0, end: 0 };
    var reqParams;

    this.state = { id: this.TPL_APPLIED_STATE };
    this.importedItems = data.map(function (row) {
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
};

/** Render raw data table to select/create import template */
ImportUploadDialog.prototype.renderRawData = function (state) {
    var headerRow;
    var dataRows;
    var colElems;
    var tableElem;

    if (this.state.id === this.RAW_DATA_STATE) {
        show(this.templateSel, true);
        show(this.nameInpBlock, false);
        show(this.columnTypeBlock, false);

        show(this.createTplBtn, true);
        show(this.updateTplBtn, !!state.template);
        show(this.deleteTplBtn, !!state.template);

        show(this.tplControls, false);
    } else if (this.state.id === this.TPL_UPDATE_STATE) {
        show(this.templateSel, false);
        show(this.nameInpBlock, true);
        show(this.columnTypeBlock, true);

        show(this.createTplBtn, false);
        show(this.updateTplBtn, false);
        show(this.deleteTplBtn, false);

        show(this.tplControls, true);
    }

    headerRow = state.rawData.slice(0, 1)[0];
    dataRows = state.rawData.slice(1, state.rowsToShow);

    this.tplNameInp.value = (state.template) ? state.template.name : '';

    colElems = headerRow.map(function (title, columnInd) {
        var columnInfo;
        var tplElem;
        var headElem;
        var columnData;

        tplElem = ce('div', { className: 'raw-data-column__tpl' });
        if (state.template) {
            columnInfo = state.template.getColumnByIndex(columnInd + 1);
            if (columnInfo) {
                tplElem.textContent = columnInfo.title;
            }
        }

        headElem = ce('div', { className: 'raw-data-column__header', textContent: title });
        columnData = dataRows.map(function (row) {
            return ce('div', { className: 'raw-data-column__cell', textContent: row[columnInd] });
        });

        return ce(
            'div',
            { className: 'raw-data-column' },
            [tplElem, headElem].concat(columnData),
            { click: this.onDataColumnClick.bind(this, columnInd) }
        );
    }, this);

    tableElem = ce('div', { className: 'raw-data-table' }, colElems);

    removeChilds(this.rawDataTable);
    this.rawDataTable.appendChild(tableElem);
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
    this.uploader.reset();

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
