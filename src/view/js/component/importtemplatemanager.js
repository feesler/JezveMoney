'use strict';

/* global ge, ce, addChilds, removeChilds, copyObject, show, extend */
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
        || !this.props.tplModel) {
        throw new Error('Failed to initialize upload file dialog');
    }

    this.model = {
        template: this.props.tplModel
    };

    this.jsonParseErrorMessage = 'Fail to parse server response';
    this.templateDeleteTitle = 'Delete import template';
    this.templateDeleteMsg = 'Are you sure to delete this import template?';

    this.LOADING_STATE = 1;
    this.RAW_DATA_STATE = 2;
    this.TPL_UPDATE_STATE = 3;
    this.TPL_APPLIED_STATE = 4;

    this.tplHeading = ge('tplHeading');
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
    this.rawDataTable = ge('rawDataTable');
    if (
        !this.tplHeading
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
        || !this.rawDataTable
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

/** Reset component state */
ImportTemplateManager.prototype.reset = function () {
    this.state = {
        id: this.LOADING_STATE,
        rawData: null,
        rowsToShow: 3
    };
    this.render(this.state);
};

/** Show/hide loading indication */
ImportTemplateManager.prototype.setLoading = function () {
    this.state.id = this.LOADING_STATE;
    this.render(this.state);
};

/** Copy specified data to component */
ImportTemplateManager.prototype.setRawData = function (data) {
    this.state.id = this.RAW_DATA_STATE;
    this.state.rawData = copyObject(data);
    this.render(this.state);
};

/** Import template select 'change' event handler */
ImportTemplateManager.prototype.onTemplateChange = function () {
    var value;
    var template;

    if (this.state.id !== this.RAW_DATA_STATE) {
        return;
    }

    value = selectedValue(this.templateSel);
    template = this.model.template.getItem(value);
    this.state.template = template;

    this.render(this.state);
};

/** Template name field 'input' event handler */
ImportTemplateManager.prototype.onTemplateNameInput = function () {
    this.state.template.name = this.tplNameInp.value;

    this.parent.clearBlockValidation(this.nameField);
};

/** Create template button 'click' event handler */
ImportTemplateManager.prototype.onCreateTemplateClick = function () {
    this.state.id = this.TPL_UPDATE_STATE;
    this.state.template = new ImportTemplate({
        name: '',
        type_id: 0
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
        date_col: this.state.template.dateColumn,
        comment_col: this.state.template.commentColumn,
        trans_curr_col: this.state.template.transactionCurrColumn,
        trans_amount_col: this.state.template.transactionAmountColumn,
        account_curr_col: this.state.template.accountCurrColumn,
        account_amount_col: this.state.template.accountAmountColumn
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

        this.state.id = this.RAW_DATA_STATE;
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
        this.renderTemplateSelect();
        this.render(this.state);
    } catch (e) {
        createMessage(e.message, 'msg_error');
    }
};

/** Render import template select element according to the data in model */
ImportTemplateManager.prototype.renderTemplateSelect = function () {
    var dataOptions;
    var noItemOption;
    var selectedTemplate = null;

    // Find template with same name as currently selected
    if (this.state.template) {
        selectedTemplate = this.model.template.data.find(function(item){
            return (item.name === this.state.template.name);
        }, this);
    }

    removeChilds(this.templateSel);

    noItemOption = ce('option', { value: 0, textContent: 'No template selected' });
    this.templateSel.appendChild(noItemOption);

    dataOptions = this.model.template.data.map(function (item) {
        return ce('option', { value: item.id, textContent: item.name });
    });
    addChilds(this.templateSel, dataOptions);

    // Restore selection
    selectByValue(this.templateSel, (selectedTemplate) ? selectedTemplate.id : 0);
    this.state.template = selectedTemplate;
};

/** Cancel template button 'click' event handler */
ImportTemplateManager.prototype.onCancelTemplateClick = function () {
    var value;
    var template;

    if (this.state.id !== this.TPL_UPDATE_STATE) {
        return;
    }

    this.state.id = this.RAW_DATA_STATE;
    // Restore previously selected template
    value = selectedValue(this.templateSel);
    template = this.model.template.getItem(value);
    this.state.template = template;
    this.render(this.state);
};

/** Raw data table column 'click' event handler */
ImportTemplateManager.prototype.onDataColumnClick = function (index) {
    var value;

    if (this.state.id !== this.TPL_UPDATE_STATE) {
        return;
    }

    value = selectedValue(this.columnSel);
    this.state.template[value] = index + 1;

    this.render(this.state);
};

/** Render component */
ImportTemplateManager.prototype.render = function (state) {
    var headerRow;
    var dataRows;
    var colElems;
    var tableElem;

    if (state.id === this.LOADING_STATE) {
        show(this.loadingIndicator, true);
        show(this.rawDataTable, false);
        show(this.tplControls, false);
    } else if (state.id === this.RAW_DATA_STATE) {
        show(this.tplHeading, true);
        show(this.loadingIndicator, false);
        show(this.rawDataTable, true);
        show(this.tplField, true);
        show(this.nameField, false);
        this.parent.clearBlockValidation(this.nameField);
        show(this.columnField, false);
        show(this.createTplBtn, true);
        show(this.updateTplBtn, !!state.template);
        show(this.deleteTplBtn, !!state.template);
        show(this.tplControls, false);
    } else if (state.id === this.TPL_UPDATE_STATE) {
        show(this.tplHeading, true);
        show(this.loadingIndicator, false);
        show(this.rawDataTable, true);
        show(this.tplField, false);
        show(this.nameField, true);
        show(this.columnField, true);
        show(this.createTplBtn, false);
        show(this.updateTplBtn, false);
        show(this.deleteTplBtn, false);
        show(this.tplControls, true);
    }

    this.tplNameInp.value = (state.template) ? state.template.name : '';

    // Check there is data to render
    if (!Array.isArray(state.rawData) || !state.rawData.length) {
        removeChilds(this.rawDataTable);
        return;
    }
    // Render data table
    headerRow = state.rawData.slice(0, 1)[0];
    dataRows = state.rawData.slice(1, Math.min(state.rawData.length, state.rowsToShow));
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
