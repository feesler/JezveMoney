import {
    ge,
    ce,
    isFunction,
    addChilds,
    removeChilds,
    copyObject,
    show,
    enable,
    ajax,
    Component,
    DropDown,
} from 'jezvejs';
import { createMessage } from '../../js/app.js';
import { ImportTemplate } from '../../js/model/ImportTemplate.js';
import { ConfirmDialog } from '../ConfirmDialog/ConfirmDialog.js';
import './style.css';

/* global baseURL */

/**
 * ImportTemplateManager component constructor
 */
export class ImportTemplateManager extends Component {
    constructor(...args) {
        super(...args);

        if (
            !this.parent
            || !this.props
            || !this.props.currencyModel
            || !this.props.tplModel
            || !this.props.rulesModel
        ) {
            throw new Error('Failed to initialize upload file dialog');
        }

        this.model = {
            currency: this.props.currencyModel,
            template: this.props.tplModel,
            rules: this.props.rulesModel
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

        this.statusHandler = this.props.templateStatus;

        this.templateDropDown = DropDown.create({
            input_id: 'templateSel',
            onchange: this.onTemplateChange.bind(this),
            editable: false
        });
        this.columnDropDown = DropDown.create({
            input_id: 'columnSel',
            editable: false
        });

        this.tplHeading = ge('tplHeading');
        this.tplStateLbl = ge('tplStateLbl');
        this.tplField = ge('tplField');
        this.nameField = ge('nameField');
        this.tplNameInp = ge('tplNameInp');
        this.createTplBtn = ge('createTplBtn');
        this.updateTplBtn = ge('updateTplBtn');
        this.deleteTplBtn = ge('deleteTplBtn');
        this.columnField = ge('columnField');
        this.tplControls = ge('tplControls');
        this.submitTplBtn = ge('submitTplBtn');
        this.cancelTplBtn = ge('cancelTplBtn');
        this.loadingIndicator = ge('loadingIndicator');
        this.tableDescr = ge('tableDescr');
        this.rawDataTable = ge('rawDataTable');
        this.tplFeedback = ge('tplFeedback');
        if (!this.tplHeading
            || !this.tplStateLbl
            || !this.templateDropDown
            || !this.tplField
            || !this.nameField
            || !this.tplNameInp
            || !this.createTplBtn
            || !this.updateTplBtn
            || !this.deleteTplBtn
            || !this.columnField
            || !this.columnDropDown
            || !this.tplControls
            || !this.submitTplBtn
            || !this.cancelTplBtn
            || !this.loadingIndicator
            || !this.tableDescr
            || !this.rawDataTable
            || !this.tplFeedback) {
            throw new Error('Failed to initialize upload file dialog');
        }

        this.tplNameInp.addEventListener('input', this.onTemplateNameInput.bind(this));
        this.createTplBtn.addEventListener('click', this.onCreateTemplateClick.bind(this));
        this.updateTplBtn.addEventListener('click', this.onUpdateTemplateClick.bind(this));
        this.deleteTplBtn.addEventListener('click', this.onDeleteTemplateClick.bind(this));
        this.submitTplBtn.addEventListener('click', this.onSubmitTemplateClick.bind(this));
        this.cancelTplBtn.addEventListener('click', this.onCancelTemplateClick.bind(this));

        this.reset();
    }

    /**
     * Return data rows from raw data
     * @param {Object} state - component state object
     * @param {boolean} limit - if true then maximum count of rows returned is state.rowsToShow
     */
    getDataRows(state, limit) {
        if (!state || !Array.isArray(state.rawData)) {
            throw new Error('Invalid state');
        }

        const start = state.startFromRow - 1;
        let end;
        if (limit) {
            end = Math.min(state.rawData.length, state.rowsToShow);
        }

        return state.rawData.slice(start, end);
    }

    /** Apply currently selected template to raw data and return array of import data items */
    applyTemplate() {
        if (
            !this.state
            || !Array.isArray(this.state.rawData)
            || !this.state.template
        ) {
            throw new Error('Invalid state');
        }

        const data = this.getDataRows(this.state, false);

        return data.map((item) => this.state.template.applyTo(item, this.model.currency));
    }

    /** Reset component state */
    reset() {
        this.state = {
            id: this.LOADING_STATE,
            rawData: null,
            startFromRow: 2,
            rowsToShow: 3,
            listLoading: false
        };
        this.render(this.state);
        this.hide();
    }

    /** Show/hide loading indication */
    setLoading() {
        this.state.id = this.LOADING_STATE;
        this.render(this.state);
    }

    /** Copy specified data to component */
    setRawData(data) {
        this.state.rawData = copyObject(data);

        if (this.model.template.length > 0) {
            this.state.id = this.RAW_DATA_STATE;
            const selectedTemplate = this.templateDropDown.getSelectionData();
            if (!selectedTemplate) {
                throw new Error('Invalid selection');
            }

            this.setTemplate(selectedTemplate.id);
        } else {
            this.setCreateTemplateState();
        }
    }

    /** Import template select 'change' event handler */
    onTemplateChange(selectedTemplate) {
        if (this.state.id !== this.RAW_DATA_STATE) {
            return;
        }

        if (!selectedTemplate) {
            throw new Error('Invalid selection');
        }

        this.setTemplate(selectedTemplate.id);
    }

    /**
     * Set specified template
     * @param {number} value - import template id
     */
    setTemplate(value) {
        const template = this.model.template.getItem(value);
        if (template) {
            this.state.template = new ImportTemplate(template);
        } else {
            this.state.template = null;
        }

        this.render(this.state);
    }

    /** Template name field 'input' event handler */
    onTemplateNameInput() {
        this.state.template.name = this.tplNameInp.value;

        this.parent.clearBlockValidation(this.nameField);
    }

    /** Create template button 'click' event handler */
    onCreateTemplateClick() {
        this.setCreateTemplateState();
    }

    /** Set create template state */
    setCreateTemplateState() {
        this.state.id = this.TPL_UPDATE_STATE;
        this.state.template = new ImportTemplate({
            name: '',
            type_id: 0,
            columns: {}
        });

        this.render(this.state);
    }

    /** Update template button 'click' event handler */
    onUpdateTemplateClick() {
        this.state.id = this.TPL_UPDATE_STATE;

        this.render(this.state);
    }

    /** Delete template button 'click' event handler */
    onDeleteTemplateClick() {
        const requestObj = {
            id: this.state.template.id,
        };

        ConfirmDialog.create({
            id: 'tpl_delete_warning',
            title: this.templateDeleteTitle,
            content: this.templateDeleteMsg,
            onconfirm: () => {
                this.state.listLoading = true;
                this.render(this.state);
                ajax.post({
                    url: baseURL + 'api/importtpl/delete',
                    data: JSON.stringify(requestObj),
                    headers: { 'Content-Type': 'application/json' },
                    callback: this.onTemplateRequestResult.bind(this),
                });
            },
        });
    }

    /** Save template button 'click' event handler */
    onSubmitTemplateClick() {
        const requestObj = {
            name: this.state.template.name,
            type_id: this.state.template.type_id,
            date_col: this.state.template.columns.date,
            comment_col: this.state.template.columns.comment,
            trans_curr_col: this.state.template.columns.transactionCurrency,
            trans_amount_col: this.state.template.columns.transactionAmount,
            account_curr_col: this.state.template.columns.accountCurrency,
            account_amount_col: this.state.template.columns.accountAmount,
        };

        if (!this.state.template.name.length) {
            this.parent.invalidateBlock(this.nameField);
            return;
        }

        let reqURL = `${baseURL}api/importtpl/`;
        if (this.state.template.id) {
            reqURL += 'update';
            requestObj.id = this.state.template.id;
        } else {
            reqURL += 'create';
        }

        this.state.listLoading = true;
        this.render(this.state);
        ajax.post({
            url: reqURL,
            data: JSON.stringify(requestObj),
            headers: { 'Content-Type': 'application/json' },
            callback: this.onTemplateRequestResult.bind(this),
        });
    }

    /** API response handler for template create/update/delete request */
    onTemplateRequestResult(response) {
        const defErrorMessage = 'Import template request failed';

        let jsondata;
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
    }

    /** Send API request to obain list of import templates */
    requestTemplatesList() {
        ajax.get({
            url: baseURL + 'api/importtpl/list/',
            callback: this.onTemplateListResult.bind(this)
        });
    }

    /** API response handler for templates list request */
    onTemplateListResult(response) {
        const defErrorMessage = 'Fail to read list of import templates';

        let jsondata;
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

            this.state.listLoading = false;
            this.model.template.setData(jsondata.data);
            if (this.model.template.length > 0) {
                this.state.id = this.RAW_DATA_STATE;
                this.renderTemplateSelect();
            } else {
                this.setCreateTemplateState();
            }

            this.requestRulesList();
        } catch (e) {
            createMessage(e.message, 'msg_error');
        }
    }

    /** Send API request to obain list of import rules */
    requestRulesList() {
        ajax.get({
            url: baseURL + 'api/importrule/list/?extended=true',
            callback: this.onRulesListResult.bind(this)
        });
    }

    /** API response handler for rules list request */
    onRulesListResult(response) {
        const defErrorMessage = 'Fail to read list of import rules';

        let jsondata;
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

            this.model.rules.setData(jsondata.data);
            this.parent.onUpdateRules();
        } catch (e) {
            createMessage(e.message, 'msg_error');
        }
    }

    /** Render import template select element according to the data in model */
    renderTemplateSelect() {
        let selectedTemplate = null;

        // Find template with same name as currently selected
        if (this.state.template) {
            selectedTemplate = this.model.template
                .find((item) => item.name === this.state.template.name);
        }

        this.templateDropDown.removeAll();

        const templateItems = this.model.template
            .map((item) => ({ id: item.id, title: item.name }));
        this.templateDropDown.append(templateItems);

        // Restore selection
        if (!selectedTemplate) {
            selectedTemplate = templateItems[0];
        }
        this.templateDropDown.selectItem(selectedTemplate.id);

        this.setTemplate(selectedTemplate.id);
    }

    /** Cancel template button 'click' event handler */
    onCancelTemplateClick() {
        if (this.state.id !== this.TPL_UPDATE_STATE) {
            return;
        }

        this.state.id = this.RAW_DATA_STATE;
        // Restore previously selected template
        const selectedTemplate = this.templateDropDown.getSelectionData();
        this.setTemplate(selectedTemplate.id);
    }

    /** Raw data table column 'click' event handler */
    onDataColumnClick(index) {
        if (this.state.id !== this.TPL_UPDATE_STATE) {
            return;
        }

        const selectedColumn = this.columnDropDown.getSelectionData();
        if (!selectedColumn) {
            throw new Error('Invalid column selection');
        }
        this.state.template.columns[selectedColumn.id] = index + 1;

        this.render(this.state);
    }

    /** Validate current template on raw data */
    setTemplateFeedback(message) {
        if (typeof message === 'string' && message.length) {
            this.tplFeedback.textContent = message;
            show(this.tplFeedback, true);
        } else {
            this.tplFeedback.textContent = '';
            show(this.tplFeedback, false);
        }
    }

    /** Validate current template on raw data */
    onInvalidPropertyValue(state, propName) {
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
            this.columnDropDown.selectItem(propName);
        }

        return false;
    }

    /** Validate current template on raw data */
    validateTemplate(state) {
        if (!state) {
            throw new Error('Invalid state');
        }

        if (!state.template) {
            return false;
        }

        const data = state.rawData.slice(1, 2)[0];
        // Account amount
        let value = state.template.getProperty('accountAmount', data, true);
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
        let currency = this.model.currency.findByName(value);
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
        // Comment
        value = state.template.getProperty('comment', data, true);
        if (!value) {
            return this.onInvalidPropertyValue(state, 'comment');
        }

        return true;
    }

    /** Render component */
    render(state) {
        const templateAvail = (this.model.template.length > 0);
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

        this.templateDropDown.enable(!state.listLoading);
        this.columnDropDown.enable(!state.listLoading);
        enable(this.tplNameInp, !state.listLoading);
        enable(this.createTplBtn, !state.listLoading);
        enable(this.updateTplBtn, !state.listLoading);
        enable(this.deleteTplBtn, !state.listLoading);
        enable(this.submitTplBtn, !state.listLoading);
        enable(this.cancelTplBtn, !state.listLoading);

        this.tplNameInp.value = (state.template) ? state.template.name : '';

        // Check there is data to render
        if (!Array.isArray(state.rawData) || !state.rawData.length) {
            removeChilds(this.rawDataTable);
            return;
        }
        // Render data table
        let propertiesPerColumn = 0;
        const headerRow = state.rawData.slice(0, 1)[0];
        const dataRows = this.getDataRows(state, true);
        const colElems = headerRow.map((title, columnInd) => {
            const tplElem = ce('div', { className: 'raw-data-column__tpl' });
            if (state.template) {
                const columnsInfo = state.template.getColumnsByIndex(columnInd + 1);
                if (Array.isArray(columnsInfo)) {
                    const columnElems = columnsInfo.map((column) =>
                        ce('div', { className: 'raw-data-column__tpl-prop', textContent: column.title }),
                    );
                    addChilds(tplElem, columnElems);

                    propertiesPerColumn = Math.max(propertiesPerColumn, columnElems.length);
                }
            }

            const headElem = ce('div', { className: 'raw-data-column__header', textContent: title });
            const columnData = dataRows.map((row) =>
                ce('div', { className: 'raw-data-column__cell', textContent: row[columnInd] }),
            );

            return ce(
                'div',
                { className: 'raw-data-column' },
                [tplElem, headElem].concat(columnData),
                { click: this.onDataColumnClick.bind(this, columnInd) }
            );
        }, this);

        const tableElem = ce('div', { className: 'raw-data-table' }, colElems);
        if (propertiesPerColumn > 1) {
            tableElem.classList.add('raw-data-table__tpl-' + propertiesPerColumn);
        }

        removeChilds(this.rawDataTable);
        this.rawDataTable.appendChild(tableElem);

        let isValid = false;
        if (state.id === this.LOADING_STATE) {
            this.setTemplateFeedback();
        } else {
            isValid = this.validateTemplate(state);
            if (isValid) {
                enable(this.submitTplBtn, true);
                this.setTemplateFeedback('Valid template');
            } else {
                enable(this.submitTplBtn, false);
                if (state.id === this.RAW_DATA_STATE) {
                    this.setTemplateFeedback('Template does not match data');
                }
            }
        }

        if (isFunction(this.statusHandler)) {
            this.statusHandler(state.id === this.RAW_DATA_STATE && isValid);
        }
    }
}
