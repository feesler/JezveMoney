import {
    ge,
    ce,
    re,
    removeChilds,
    show,
    insertAfter,
} from 'jezvejs';
import { Component } from 'jezvejs/Component';
import { Popup } from 'jezvejs/Popup';
import { createMessage } from '../../js/app.js';
import { ImportRule } from '../../js/model/ImportRule.js';
import { ImportRuleForm } from '../ImportRuleForm/ImportRuleForm.js';
import { ImportRuleItem } from '../ImportRuleItem/ImportRuleItem.js';
import { ConfirmDialog } from '../ConfirmDialog/ConfirmDialog.js';
import './style.css';

/** Strings */
const TITLE_RULE_DELETE = 'Delete import rule';
const MSG_RULE_DELETE = 'Are you sure to delete this import rule?';
const MSG_RULE_SUBMIT_FAIL = 'Fail to submit import rule request';
const MSG_RULE_LIST_REQUEST_FAIL = 'Fail to read list of import rules';
const MSG_NO_RULES = 'No rules';
const TITLE_RULES_LIST = 'Import rules';
const TITLE_CREATE_RULE = 'Create import rule';
const TITLE_UPDATE_RULE = 'Update import rule';

/**
 * ImportRulesDialog component constructor
 */
export class ImportRulesDialog extends Component {
    constructor(...args) {
        super(...args);

        if (
            !this.parent
            || !this.props
        ) {
            throw new Error('Invalid props');
        }

        this.LIST_STATE = 1;
        this.CREATE_STATE = 2;
        this.UPDATE_STATE = 3;

        this.popup = Popup.create({
            id: 'rules_popup',
            content: this.elem,
            onclose: () => this.onClose(),
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

        this.createRuleBtn.addEventListener('click', () => this.onCreateRuleClick());

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
        const item = window.app.model.rules.getItem(ruleId);
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
            title: TITLE_RULE_DELETE,
            content: MSG_RULE_DELETE,
            onconfirm: () => this.deleteRule(ruleId),
        });
    }

    /** Send create/update import rule request to API */
    async submitRule(data) {
        if (!data) {
            throw new Error('Invalid data');
        }

        const { baseURL } = window.app;
        let reqURL = `${baseURL}api/importrule/`;
        reqURL += (data.id) ? 'update' : 'create';

        this.startLoading();

        const response = await fetch(reqURL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        const apiResult = await response.json();
        this.onRuleRequestResult(apiResult);
    }

    /** Send delete import rule request to API */
    async deleteRule(ruleId) {
        const data = {};
        const { baseURL } = window.app;
        const reqURL = `${baseURL}api/importrule/del`;

        data.id = parseInt(ruleId, 10);
        if (!data.id) {
            throw new Error('Invalid rule id');
        }

        this.startLoading();

        const response = await fetch(reqURL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        const apiResult = await response.json();
        this.onRuleRequestResult(apiResult);
    }

    /** API response handler for rule create/update/delete requests */
    onRuleRequestResult(apiResult) {
        try {
            if (!apiResult || apiResult.result !== 'ok') {
                const errorMessage = (apiResult && 'msg' in apiResult)
                    ? apiResult.msg
                    : MSG_RULE_SUBMIT_FAIL;
                throw new Error(errorMessage);
            }

            this.requestRulesList();
        } catch (e) {
            createMessage(e.message, 'msg_error');
            this.stopLoading();
        }
    }

    /** Send API request to obain list of import rules */
    async requestRulesList() {
        const { baseURL } = window.app;

        try {
            const response = await fetch(`${baseURL}api/importrule/list/?extended=true`);
            const apiResult = await response.json();

            if (!apiResult || apiResult.result !== 'ok' || !Array.isArray(apiResult.data)) {
                const errorMessage = (apiResult && 'msg' in apiResult)
                    ? apiResult.msg
                    : MSG_RULE_LIST_REQUEST_FAIL;
                throw new Error(errorMessage);
            }

            window.app.model.rules.setData(apiResult.data);
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
        const ruleItems = window.app.model.rules.map((rule) => (
            new ImportRuleItem({
                parent: this.parent,
                data: rule,
                update: (ruleId) => this.onUpdateItem(ruleId),
                remove: (ruleId) => this.onDeleteItem(ruleId),
            })
        ));

        this.listContainer.dataset.time = state.renderTime;
        removeChilds(this.listContainer);
        if (!ruleItems.length) {
            this.noDataMsg = ce('span', { className: 'nodata-message', textContent: MSG_NO_RULES });
            this.listContainer.appendChild(this.noDataMsg);
        } else {
            ruleItems.forEach((item) => this.listContainer.appendChild(item.elem));
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
            submit: (data) => this.onSubmitItem(data),
            cancel: () => this.onCancelItem(),
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
            this.titleElem.textContent = TITLE_RULES_LIST;

            this.renderList(state);
        } else if (state.id === this.CREATE_STATE || state.id === this.UPDATE_STATE) {
            this.titleElem.textContent = (state.id === this.CREATE_STATE)
                ? TITLE_CREATE_RULE
                : TITLE_UPDATE_RULE;

            this.renderForm(state);
        }

        if (!state.listLoading) {
            show(this.loadingIndicator, false);
        }
    }
}
