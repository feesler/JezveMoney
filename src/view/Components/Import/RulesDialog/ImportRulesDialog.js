import {
    ce,
    re,
    removeChilds,
    show,
    insertAfter,
    Component,
    Popup,
} from 'jezvejs';
import { createMessage } from '../../../js/app.js';
import { API } from '../../../js/API.js';
import { ImportRule } from '../../../js/model/ImportRule.js';
import { ImportRuleForm } from '../RuleForm/ImportRuleForm.js';
import { ImportRuleItem } from '../RuleItem/ImportRuleItem.js';
import { ConfirmDialog } from '../../ConfirmDialog/ConfirmDialog.js';
import './style.scss';
import { LoadingIndicator } from '../../LoadingIndicator/LoadingIndicator.js';

/** CSS classes */
export const IMPORT_RULES_DIALOG_CLASS = 'rules-dialog';
const IMPORT_RULES_POPUP_CLASS = 'rules-popup';

/** Strings */
const TITLE_RULE_DELETE = 'Delete import rule';
const MSG_RULE_DELETE = 'Are you sure to delete this import rule?';
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
            additional: IMPORT_RULES_POPUP_CLASS,
        });

        this.createRuleBtn = this.elem.querySelector('.create-btn');
        this.titleElem = this.elem.querySelector('.rules-header label');
        this.listContainer = this.elem.querySelector('.rules-list');
        if (!this.createRuleBtn
            || !this.titleElem
            || !this.listContainer) {
            throw new Error('Failed to initialize import rules dialog');
        }

        this.createRuleBtn.addEventListener('click', () => this.onCreateRuleClick());

        this.loadingIndicator = LoadingIndicator.create({ fixed: false });
        this.elem.append(this.loadingIndicator.elem);

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

        this.startLoading();

        try {
            if (data.id) {
                await API.importRule.update(data);
            } else {
                await API.importRule.create(data);
            }

            this.requestRulesList();
        } catch (e) {
            createMessage(e.message, 'msg_error');
            this.stopLoading();
        }
    }

    /** Send delete import rule request to API */
    async deleteRule(ruleId) {
        const id = parseInt(ruleId, 10);
        if (!id) {
            throw new Error('Invalid rule id');
        }

        this.startLoading();

        try {
            await API.importRule.del(id);
            this.requestRulesList();
        } catch (e) {
            createMessage(e.message, 'msg_error');
            this.stopLoading();
        }
    }

    /** Send API request to obain list of import rules */
    async requestRulesList() {
        try {
            const result = await API.importRule.list({ extended: true });
            if (!Array.isArray(result.data)) {
                const errorMessage = (result && 'msg' in result)
                    ? result.msg
                    : MSG_RULE_LIST_REQUEST_FAIL;
                throw new Error(errorMessage);
            }

            window.app.model.rules.setData(result.data);
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
