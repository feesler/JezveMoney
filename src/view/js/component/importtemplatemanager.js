'use strict';

/* global isFunction, ge, ce, addChilds, removeChilds, copyObject, show, enable, extend */
/* global selectedValue, selectByValue, ajax, createMessage, baseURL */
/* global Component, ImportTemplate, ConfirmDialog */

/**
 * ImportTemplateManager component constructor
 * @param {Object} props
 */
function ImportTemplateManager() {
    ImportTemplateManager.parent.constructor.apply(this, arguments);

    if (!this.parent
        || !this.props
        || !this.props.currencyModel
        || !this.props.tplModel) {
        throw new Error('Failed to initialize upload file dialog');
    }

    this.model = {
        currency: this.props.currencyModel,
        template: this.props.tplModel
    };

    this.jsonParseErrorMessage = 'Fail to parse server response';
    this.templateDeleteTitle = 'Delete import template';
    this.templateDeleteMsg = 'Are you sure to delete this import template?';

    this.columnFeedback = {
        accountAmount: { msg: 'Please select decimal column for account amount' },
        accountCurrency: { msg: 'Please select correct column for account currency' },
        transactionAmount: { msg: 'Please select decimal column for transaction amount' },
        transactionCurrency: { msg: 'Please select correct column for transaction currency' },
        date: { msg: 'Please select column for date' },
        comment: { msg: 'Please select column for comment' }
    };

    this.LOADING_STATE = 1;
    this.RAW_DATA_STATE = 2;
    this.TPL_UPDATE_STATE = 3;

    this.statusHanlder = this.props.templateStatus;

    this.tplHeading = ge('tplHeading');
    this.tplStateLbl = ge('tplStateLbl');
    this.templateSel = ge('templateSel');
    this.tplField = ge('tplField');
    this.nameField = ge('nameField');
    this.tplNameInp = ge('tplNameInp');
    this.createTplBtn = ge('createTplBtn');
    this.updateTplBtn = ge('updateTplBtn');
    this.deleteTplBtn = ge('deleteTplBtn');
    this.columnField = ge('columnField');
    this.columnSel = ge('columnSel');
    this.tplControls = ge('tplControls');
    this.submitTplBtn = ge('submitTplBtn');
    this.cancelTplBtn = ge('cancelTplBtn');
    this.loadingIndicator = ge('loadingIndicator');
    this.tableDescr = ge('tableDescr');
    this.rawDataTable = ge('rawDataTable');
    this.tplFeedback = ge('tplFeedback');
    if (
        !this.tplHeading
        || !this.tplStateLbl
        || !this.templateSel
        || !this.tplField
        || !this.nameField
        || !this.tplNameInp
        || !this.createTplBtn
        || !this.updateTplBtn
        || !this.deleteTplBtn
        || !this.columnField
        || !this.columnSel
        || !this.tplControls
        || !this.submitTplBtn
        || !this.cancelTplBtn
        || !this.loadingIndicator
        || !this.tableDescr
        || !this.rawDataTable
        || !this.tplFeedback
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

    this.reset();
}

extend(ImportTemplateManager, Component);

/**
 * Return data rows from raw data
 * @param {Object} state - component state object
 * @param {boolean} limit - if true then maximum count of rows returned is state.rowsToShow
 */
ImportTemplateManager.prototype.getDataRows = function (state, limit) {
    var start;
    var end;

    if (!state || !Array.isArray(state.rawData)) {
        throw new Error('Invalid state');
    }

    start = state.startFromRow - 1;
    if (limit) {
        end = Math.min(state.rawData.length, state.rowsToShow);
    }

    return state.rawData.slice(start, end);
};

/** Apply currently selected template to raw data and return array of import data items */
ImportTemplateManager.prototype.applyTemplate = function () {
    var data;

    if (!this.state
        || !Array.isArray(this.state.rawData)
        || !this.state.template) {
        throw new Error('Invalid state');
    }

    data = this.getDataRows(this.state, false);

    return data.map(function (item) {
        return this.state.template.applyTo(item);
    }, this);
};

/** Reset component state */
ImportTemplateManager.prototype.reset = function () {
    this.state = {
        id: this.LOADING_STATE,
        rawData: null,
        startFromRow: 2,
        rowsToShow: 3
    };
    this.render(this.state);
    this.hide();
};

/** Show/hide loading indication */
ImportTemplateManager.prototype.setLoading = function () {
    this.state.id = this.LOADING_STATE;
    this.render(this.state);
};

/** Copy specified data to component */
ImportTemplateManager.prototype.setRawData = function (data) {
    var value;

    this.state.rawData = copyObject(data);

    if (this.model.template.data.length > 0) {
        this.state.id = this.RAW_DATA_STATE;
        value = selectedValue(this.templateSel);
        this.setTemplate(value);
    } else {
        this.setCreateTemplateState();
    }
};

/** Import template select 'change' event handler */
ImportTemplateManager.prototype.onTemplateChange = function () {
    var value;

    if (this.state.id !== this.RAW_DATA_STATE) {
        return;
    }

    value = selectedValue(this.templateSel);
    this.setTemplate(value);
};

/**
 * Set specified template
 * @param {number} value - import template id
 */
ImportTemplateManager.prototype.setTemplate = function (value) {
    var template = this.model.template.getItem(value);
    if (template) {
        this.state.template = new ImportTemplate(template);
    } else {
        this.state.template = null;
    }

    this.render(this.state);
};

/** Template name field 'input' event handler */
ImportTemplateManager.prototype.onTemplateNameInput = function () {
    this.state.template.name = this.tplNameInp.value;

    this.parent.clearBlockValidation(this.nameField);
};

/** Create template button 'click' event handler */
ImportTemplateManager.prototype.onCreateTemplateClick = function () {
    this.setCreateTemplateState();
};

/** Set create template state */
ImportTemplateManager.prototype.setCreateTemplateState = function () {
    this.state.id = this.TPL_UPDATE_STATE;
    this.state.template = new ImportTemplate({
        name: '',
        type_id: 0,
        columns: {}
    });

    this.render(this.state);
};

/** Update template button 'click' event handler */
ImportTemplateManager.prototype.onUpdateTemplateClick = function () {
    this.state.id = this.TPL_UPDATE_STATE;

    this.render(this.state);
};

/** Delete template button 'click' event handler */
ImportTemplateManager.prototype.onDeleteTemplateClick = function () {
    var requestObj = {
        id: this.state.template.id
    };

    ConfirmDialog.create({
        id: 'tpl_delete_warning',
        title: this.templateDeleteTitle,
        content: this.templateDeleteMsg,
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
ImportTemplateManager.prototype.onDeleteTemplateResult = function (response) {
    var defErrorMessage = 'Fail to delete import template';
    var jsondata;

    try {
        jsondata = JSON.parse(response);
    } catch (e) {
        createMessage(this.jsonParseErrorMessage, 'msg_error');
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
ImportTemplateManager.prototype.onSubmitTemplateClick = function () {
    var reqURL = baseURL + 'api/importtpl/';
    var requestObj = {
        name: this.state.template.name,
        type_id: this.state.template.type_id,
        date_col: this.state.template.columns.date,
        comment_col: this.state.template.columns.comment,
        trans_curr_col: this.state.template.columns.transactionCurrency,
        trans_amount_col: this.state.template.columns.transactionAmount,
        account_curr_col: this.state.template.columns.accountCurrency,
        account_amount_col: this.state.template.columns.accountAmount
    };

    if (!this.state.template.name.length) {
        this.parent.invalidateBlock(this.nameField);
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
ImportTemplateManager.prototype.onSubmitTemplateResult = function (response) {
    var defErrorMessage = 'Fail to submit import template';
    var jsondata;

    try {
        jsondata = JSON.parse(response);
    } catch (e) {
        createMessage(this.jsonParseErrorMessage, 'msg_error');
        return;
    }

    try {
        if (!jsondata || jsondata.result !== 'ok') {
            throw new Error((jsondata && 'msg' in jsondata) ? jsondata.msg : defErrorMessage);
        }

        this.requestTemplatesList();
    } catch (e) {
        createMessage(e.message, 'msg_error');
    }
};

/** Send API request to obain list of import templates */
ImportTemplateManager.prototype.requestTemplatesList = function () {
    ajax.get({
        url: baseURL + 'api/importtpl/list/',
        callback: this.onTemplateListResult.bind(this)
    });
};

/** Send API request to obain list of import templates */
ImportTemplateManager.prototype.onTemplateListResult = function (response) {
    var defErrorMessage = 'Fail to read list of import templates';
    var jsondata;

    try {
        jsondata = JSON.parse(response);
    } catch (e) {
        createMessage(this.jsonParseErrorMessage, 'msg_error');
        return;
    }

    try {
        if (!jsondata || jsondata.result !== 'ok' || !Array.isArray(jsondata.data)) {
            throw new Error((jsondata && 'msg' in jsondata) ? jsondata.msg : defErrorMessage);
        }

        this.model.template.setData(jsondata.data);
        this.state.id = this.RAW_DATA_STATE;
        this.renderTemplateSelect();
    } catch (e) {
        createMessage(e.message, 'msg_error');
    }
};

/** Render import template select element according to the data in model */
ImportTemplateManager.prototype.renderTemplateSelect = function () {
    var dataOptions;
    var selectedTemplate = null;
    var templateId;

    // Find template with same name as currently selected
    if (this.state.template) {
        selectedTemplate = this.model.template.data.find(function (item) {
            return (item.name === this.state.template.name);
        }, this);
    }

    removeChilds(this.templateSel);

    dataOptions = this.model.template.data.map(function (item) {
        return ce('option', { value: item.id, textContent: item.name });
    });
    addChilds(this.templateSel, dataOptions);

    // Restore selection
    templateId = (selectedTemplate) ? selectedTemplate.id : 0;
    selectByValue(this.templateSel, templateId);
    this.setTemplate(templateId);
};

/** Cancel template button 'click' event handler */
ImportTemplateManager.prototype.onCancelTemplateClick = function () {
    var value;

    if (this.state.id !== this.TPL_UPDATE_STATE) {
        return;
    }

    this.state.id = this.RAW_DATA_STATE;
    // Restore previously selected template
    value = selectedValue(this.templateSel);
    this.setTemplate(value);
};

/** Raw data table column 'click' event handler */
ImportTemplateManager.prototype.onDataColumnClick = function (index) {
    var value;

    if (this.state.id !== this.TPL_UPDATE_STATE) {
        return;
    }

    value = selectedValue(this.columnSel);
    this.state.template.columns[value] = index + 1;

    this.render(this.state);
};

/** Validate current template on raw data */
ImportTemplateManager.prototype.setTemplateFeedback = function (message) {
    if (typeof message === 'string' && message.length) {
        this.tplFeedback.textContent = message;
        show(this.tplFeedback, true);
    } else {
        this.tplFeedback.textContent = '';
        show(this.tplFeedback, false);
    }
};

/** Validate current template on raw data */
ImportTemplateManager.prototype.onInvalidPropertyValue = function (state, propName) {
    if (!state) {
        throw new Error('Invalid state');
    }
    if (typeof propName !== 'string'
        || !propName.length
        || !this.columnFeedback[propName]) {
        throw new Error('Invalid property');
    }

    if (state.id === this.TPL_UPDATE_STATE) {
        this.setTemplateFeedback(this.columnFeedback[propName].msg);
        selectByValue(this.columnSel, propName);
    }

    return false;
};

/** Validate current template on raw data */
ImportTemplateManager.prototype.validateTemplate = function (state) {
    var data;
    var value;
    var currency;

    if (!state) {
        throw new Error('Invalid state');
    }

    if (!state.template) {
        return false;
    }

    data = state.rawData.slice(1, 2)[0];
    // Account amount
    value = state.template.getProperty('accountAmount', data, true);
    if (!value) {
        return this.onInvalidPropertyValue(state, 'accountAmount');
    }
    // Transaction amount
    value = state.template.getProperty('transactionAmount', data, true);
    if (!value) {
        return this.onInvalidPropertyValue(state, 'transactionAmount');
    }
    // Account currency
    value = state.template.getProperty('accountCurrency', data, true);
    currency = this.model.currency.findByName(value);
    if (!currency) {
        return this.onInvalidPropertyValue(state, 'accountCurrency');
    }
    // Transaction currency
    value = state.template.getProperty('transactionCurrency', data, true);
    currency = this.model.currency.findByName(value);
    if (!currency) {
        return this.onInvalidPropertyValue(state, 'transactionCurrency');
    }
    // Date
    value = state.template.getProperty('date', data, true);
    if (!value) {
        return this.onInvalidPropertyValue(state, 'date');
    }

    return true;
};

/** Render component */
ImportTemplateManager.prototype.render = function (state) {
    var templateAvail;
    var headerRow;
    var dataRows;
    var colElems;
    var tableElem;
    var isValid;

    templateAvail = (this.model.template.data.length > 0);
    if (state.id === this.LOADING_STATE) {
        show(this.loadingIndicator, true);
        show(this.tableDescr, false);
        show(this.rawDataTable, false);
        show(this.tplControls, false);
    } else if (state.id === this.RAW_DATA_STATE) {
        show(this.tplField, templateAvail);
        show(this.noTplLabel, !templateAvail);
        show(this.tplHeading, true);
        show(this.tplStateLbl, false);
        show(this.loadingIndicator, false);
        show(this.tableDescr, false);
        show(this.rawDataTable, false);
        show(this.nameField, false);
        this.parent.clearBlockValidation(this.nameField);
        show(this.columnField, false);
        show(this.createTplBtn, templateAvail);
        show(this.updateTplBtn, !!state.template);
        show(this.deleteTplBtn, !!state.template);
        show(this.tplControls, false);
    } else if (state.id === this.TPL_UPDATE_STATE) {
        this.tplStateLbl.textContent = (state.template && state.template.id)
            ? 'Update template'
            : 'Create template';

        show(this.noTplLabel, false);
        show(this.tplStateLbl, true);
        show(this.tplHeading, true);
        show(this.loadingIndicator, false);
        show(this.tableDescr, true);
        show(this.rawDataTable, true);
        show(this.tplField, false);
        show(this.nameField, true);
        show(this.columnField, true);
        show(this.createTplBtn, false);
        show(this.updateTplBtn, false);
        show(this.deleteTplBtn, false);
        show(this.tplControls, true);
        show(this.cancelTplBtn, templateAvail);
    }

    this.tplNameInp.value = (state.template) ? state.template.name : '';

    // Check there is data to render
    if (!Array.isArray(state.rawData) || !state.rawData.length) {
        removeChilds(this.rawDataTable);
        return;
    }
    // Render data table
    headerRow = state.rawData.slice(0, 1)[0];
    dataRows = this.getDataRows(state, true);
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

    isValid = this.validateTemplate(state);
    if (isValid) {
        enable(this.submitTplBtn, true);
        this.setTemplateFeedback();
    } else {
        enable(this.submitTplBtn, false);
        if (state.id === this.RAW_DATA_STATE) {
            this.setTemplateFeedback('Template does not match data');
        }
    }

    if (state.id === this.RAW_DATA_STATE && isFunction(this.statusHanlder)) {
        this.statusHanlder(isValid);
    }
};
