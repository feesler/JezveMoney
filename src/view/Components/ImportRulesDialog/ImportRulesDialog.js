import {
    ge,
    ce,
    re,
    removeChilds,
    show,
    insertAfter,
    ajax,
    Component,
    Popup,
} from 'jezvejs';
import { createMessage } from '../../js/app.js';
import { ImportRule } from '../../js/model/ImportRule.js';
import { ImportRuleForm } from '../ImportRuleForm/ImportRuleForm.js';
import { ImportRuleItem } from '../ImportRuleItem/ImportRuleItem.js';
import { ConfirmDialog } from '../ConfirmDialog/ConfirmDialog.js';
import './style.css';

/* global baseURL */

/**
 * ImportRulesDialog component constructor
 */
export class ImportRulesDialog extends Component {
    constructor(...args) {
        super(...args);

        if (
            !this.parent
            || !this.props
            || !this.props.tplModel
            || !this.props.currencyModel
            || !this.props.accountModel
            || !this.props.personModel
            || !this.props.rulesModel
        ) {
            throw new Error('Invalid props');
        }

        this.ruleDeleteTitle = 'Delete import rule';
        this.ruleDeleteMsg = 'Are you sure to delete this import rule?';

        this.model = {
            template: this.props.tplModel,
            currency: this.props.currencyModel,
            accounts: this.props.accountModel,
            persons: this.props.personModel,
            rules: this.props.rulesModel,
        };

        this.LIST_STATE = 1;
        this.CREATE_STATE = 2;
        this.UPDATE_STATE = 3;

        this.popup = Popup.create({
            id: 'rules_popup',
            content: this.elem,
            onclose: this.onClose.bind(this),
            btn: {
                closeBtn: true,
            },
            additional: 'rules-popup',
        });

        this.createRuleBtn = ge('createRuleBtn');
        this.titleElem = this.elem.querySelector('.rules-header label');
        this.loadingIndicator = this.elem.querySelector('.rules-dialog__loading');
        this.listContainer = this.elem.querySelector('.rules-list');
        if (!this.createRuleBtn
            || !this.titleElem
            || !this.loadingIndicator
            || !this.listContainer) {
            throw new Error('Failed to initialize import rules dialog');
        }

        this.createRuleBtn.addEventListener('click', this.onCreateRuleClick.bind(this));

        this.reset();
        this.render(this.state);
    }

    /** Show/hide dialog */
    show(val) {
        this.render(this.state);
        this.popup.show(val);
    }

    /** Hide dialog */
    hide() {
        this.popup.hide();
    }

    /** Reset dialog state */
    reset() {
        this.state = {
            id: this.LIST_STATE,
            listLoading: false,
            renderTime: Date.now(),
        };
    }

    /** Set loading state and render component */
    startLoading() {
        this.state.listLoading = true;
        this.render(this.state);
    }

    /** Remove loading state and render component */
    stopLoading() {
        this.state.listLoading = false;
        this.state.renderTime = Date.now();
        this.render(this.state);
    }

    /** Hide dialog */
    onClose() {
        this.reset();
    }

    /** Create rule button 'click' event handler */
    onCreateRuleClick() {
        this.setCreateRuleState();
    }

    /** Set create rule state */
    setCreateRuleState() {
        this.state.id = this.CREATE_STATE;
        this.state.rule = new ImportRule({
            flags: 0,
            conditions: [],
            actions: [],
        });

        this.render(this.state);
    }

    /** Set update rule state */
    setUpdateRuleState(ruleId) {
        const item = this.model.rules.getItem(ruleId);
        if (!item) {
            throw new Error('Rule not found');
        }

        this.state.id = this.UPDATE_STATE;
        this.state.rule = new ImportRule(item);

        this.render(this.state);
    }

    /** Rule 'submit' event handler */
    onSubmitItem(data) {
        if (!data) {
            throw new Error('Invalid data');
        }

        this.submitRule(data);
    }

    /** Rule create/update 'cancel' event handler */
    onCancelItem() {
        this.reset();
        this.render(this.state);
    }

    /** Rule 'update' event handler */
    onUpdateItem(ruleId) {
        this.setUpdateRuleState(ruleId);
    }

    /** Rule 'delete' event handler */
    onDeleteItem(ruleId) {
        ConfirmDialog.create({
            id: 'rule_delete_warning',
            title: this.ruleDeleteTitle,
            content: this.ruleDeleteMsg,
            onconfirm: () => this.deleteRule(ruleId),
        });
    }

    /** Send create/update import rule request to API */
    submitRule(data) {
        if (!data) {
            throw new Error('Invalid data');
        }

        let reqURL = `${baseURL}api/importrule/`;
        reqURL += (data.id) ? 'update' : 'create';

        this.startLoading();

        ajax.post({
            url: reqURL,
            data: JSON.stringify(data),
            headers: { 'Content-Type': 'application/json' },
            callback: this.onRuleRequestResult.bind(this),
        });
    }

    /** Send delete import rule request to API */
    deleteRule(ruleId) {
        const data = {};
        const reqURL = `${baseURL}api/importrule/del`;

        data.id = parseInt(ruleId, 10);
        if (!data.id) {
            throw new Error('Invalid rule id');
        }

        this.startLoading();

        ajax.post({
            url: reqURL,
            data: JSON.stringify(data),
            headers: { 'Content-Type': 'application/json' },
            callback: this.onRuleRequestResult.bind(this),
        });
    }

    /** API response handler for rule create/update/delete requests */
    onRuleRequestResult(response) {
        const defErrorMessage = 'Fail to submit import rule request';

        let jsondata;
        try {
            jsondata = JSON.parse(response);
        } catch (e) {
            createMessage(this.jsonParseErrorMessage, 'msg_error');
            this.stopLoading();
            return;
        }

        try {
            if (!jsondata || jsondata.result !== 'ok') {
                throw new Error((jsondata && 'msg' in jsondata) ? jsondata.msg : defErrorMessage);
            }

            this.requestRulesList();
        } catch (e) {
            createMessage(e.message, 'msg_error');
            this.stopLoading();
        }
    }

    /** Send API request to obain list of import rules */
    requestRulesList() {
        ajax.get({
            url: `${baseURL}api/importrule/list/?extended=true`,
            callback: this.onRulesListResult.bind(this),
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
            this.stopLoading();
            return;
        }

        try {
            if (!jsondata || jsondata.result !== 'ok' || !Array.isArray(jsondata.data)) {
                throw new Error((jsondata && 'msg' in jsondata) ? jsondata.msg : defErrorMessage);
            }

            this.model.rules.setData(jsondata.data);
            this.state.id = this.LIST_STATE;
            delete this.state.rule;
            this.stopLoading();
            this.parent.onUpdateRules();
        } catch (e) {
            createMessage(e.message, 'msg_error');
            this.stopLoading();
        }
    }

    /** Render list state of component */
    renderList(state) {
        const ruleItems = this.model.rules.map((rule) => (
            new ImportRuleItem({
                parent: this.parent,
                data: rule,
                tplModel: this.model.template,
                currencyModel: this.model.currency,
                accountModel: this.model.accounts,
                personModel: this.model.persons,
                update: this.onUpdateItem.bind(this),
                remove: this.onDeleteItem.bind(this),
            })
        ));

        this.listContainer.dataset.time = state.renderTime;
        removeChilds(this.listContainer);
        if (!ruleItems.length) {
            this.noDataMsg = ce('span', { className: 'nodata-message', textContent: 'No rules' });
            this.listContainer.appendChild(this.noDataMsg);
        } else {
            ruleItems.forEach(function (item) {
                this.listContainer.appendChild(item.elem);
            }, this);
        }

        show(this.listContainer, true);
        show(this.createRuleBtn, true);
        if (this.formContainer) {
            re(this.formContainer.elem);
            this.formContainer = null;
        }
    }

    /** Render form state of component */
    renderForm(state) {
        if (this.formContainer) {
            re(this.formContainer.elem);
        }

        this.formContainer = new ImportRuleForm({
            parent: this.parent,
            data: state.rule,
            tplModel: this.model.template,
            currencyModel: this.model.currency,
            accountModel: this.model.accounts,
            personModel: this.model.persons,
            submit: this.onSubmitItem.bind(this),
            cancel: this.onCancelItem.bind(this),
        });

        insertAfter(this.formContainer.elem, this.listContainer);

        show(this.listContainer, false);
        show(this.createRuleBtn, false);
        show(this.formContainer.elem, true);
    }

    /** Render component state */
    render(state) {
        if (state.listLoading) {
            show(this.loadingIndicator, true);
        }

        if (state.id === this.LIST_STATE) {
            this.titleElem.textContent = 'Import rules';

            this.renderList(state);
        } else if (state.id === this.CREATE_STATE || state.id === this.UPDATE_STATE) {
            this.titleElem.textContent = (state.id === this.CREATE_STATE)
                ? 'Create import rule'
                : 'Update import rule';

            this.renderForm(state);
        }

        if (!state.listLoading) {
            show(this.loadingIndicator, false);
        }
    }
}
