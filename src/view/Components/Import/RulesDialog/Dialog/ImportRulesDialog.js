import {
    ge,
    ce,
    re,
    removeChilds,
    show,
    insertAfter,
    isFunction,
    Component,
    Popup,
    InputGroup,
    Paginator,
} from 'jezvejs';
import { API } from '../../../../js/API.js';
import { ImportRule } from '../../../../js/model/ImportRule.js';
import { ImportRuleForm } from '../RuleForm/ImportRuleForm.js';
import { ImportRuleItem } from '../RuleItem/ImportRuleItem.js';
import { ConfirmDialog } from '../../../ConfirmDialog/ConfirmDialog.js';
import './style.scss';
import { LoadingIndicator } from '../../../LoadingIndicator/LoadingIndicator.js';

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

/** Other */
const SHOW_ON_PAGE = 20;

/**
 * ImportRulesDialog component
 */
export class ImportRulesDialog extends Component {
    static create(props) {
        return new ImportRulesDialog(props);
    }

    constructor(...args) {
        super(...args);

        this.LIST_STATE = 1;
        this.CREATE_STATE = 2;
        this.UPDATE_STATE = 3;

        this.headerElem = this.elem.querySelector('.rules-header');
        this.titleElem = this.headerElem?.querySelector('label');
        this.createRuleBtn = this.headerElem?.querySelector('.create-btn');
        this.searchField = ge('searchField');
        this.searchInp = ge('searchInp');
        this.clearSearchBtn = ge('clearSearchBtn');
        this.listContainer = this.elem.querySelector('.rules-list');
        if (
            !this.createRuleBtn
            || !this.titleElem
            || !this.searchField
            || !this.searchInp
            || !this.clearSearchBtn
            || !this.listContainer
        ) {
            throw new Error('Failed to initialize import rules dialog');
        }

        InputGroup.fromElement(this.searchField);

        this.searchInp.addEventListener('input', () => this.onSearchInput());
        this.clearSearchBtn.addEventListener('click', () => this.onClearSearch());

        this.paginator = Paginator.create({
            arrows: true,
            onChange: (page) => this.onChangePage(page),
        });

        this.popup = Popup.create({
            id: 'rules_popup',
            content: this.elem,
            title: this.headerElem,
            scrollMessage: true,
            onclose: () => this.onClose(),
            btn: {
                closeBtn: true,
            },
            className: IMPORT_RULES_POPUP_CLASS,
        });
        show(this.elem, true);

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
            filter: '',
            items: [],
            pagination: {
                onPage: SHOW_ON_PAGE,
                page: 1,
                pagesCount: 0,
                total: 0,
            },
            renderTime: Date.now(),
        };

        this.updateList();
    }

    /** Updates rules list state */
    updateList() {
        const { rules } = window.app.model;
        const { pagination } = this.state;

        const items = (this.state.filter !== '')
            ? rules.filter((rule) => rule.isMatchFilter(this.state.filter))
            : rules.data;
        this.state.items = items;

        pagination.pagesCount = Math.ceil(items.length / pagination.onPage);
        pagination.page = (pagination.pagesCount > 0)
            ? Math.min(pagination.pagesCount, pagination.page)
            : 1;
        pagination.total = items.length;
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

    /** Search input */
    onSearchInput() {
        const { value } = this.searchInp;

        if (this.state.filter.toLowerCase() === value.toLowerCase()) {
            return;
        }

        this.state.filter = value;
        this.updateList();
        this.render(this.state);
    }

    /** Clear search */
    onClearSearch() {
        if (this.state.filter === '') {
            return;
        }

        this.state.filter = '';
        this.state.pagination.page = 1;
        this.updateList();
        this.render(this.state);
    }

    /** Change page event handler */
    onChangePage(page) {
        if (this.state.pagination.page === page) {
            return;
        }

        this.state.pagination.page = page;
        this.render(this.state);
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
            window.app.createMessage(e.message, 'msg_error');
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
            window.app.createMessage(e.message, 'msg_error');
            this.stopLoading();
        }
    }

    /** Send API request to obain list of import rules */
    async requestRulesList() {
        const { rules } = window.app.model;

        try {
            const result = await API.importRule.list({ extended: true });
            if (!Array.isArray(result.data)) {
                const errorMessage = (result && 'msg' in result)
                    ? result.msg
                    : MSG_RULE_LIST_REQUEST_FAIL;
                throw new Error(errorMessage);
            }

            rules.setData(result.data);
            this.state.id = this.LIST_STATE;
            this.updateList();

            delete this.state.rule;
            this.stopLoading();

            if (isFunction(this.props.onUpdate)) {
                this.props.onUpdate();
            }
        } catch (e) {
            window.app.createMessage(e.message, 'msg_error');
            this.stopLoading();
        }
    }

    /** Render list state of component */
    renderList(state) {
        const firstItem = state.pagination.onPage * (state.pagination.page - 1);
        const lastItem = firstItem + state.pagination.onPage;
        const items = state.items.slice(firstItem, lastItem);

        const ruleItems = items.map((rule) => ImportRuleItem.create({
            data: rule,
            onUpdate: (ruleId) => this.onUpdateItem(ruleId),
            onRemove: (ruleId) => this.onDeleteItem(ruleId),
        }));

        this.listContainer.dataset.time = state.renderTime;
        removeChilds(this.listContainer);
        if (!ruleItems.length) {
            this.noDataMsg = ce('span', { className: 'nodata-message', textContent: MSG_NO_RULES });
            this.listContainer.append(this.noDataMsg);
        } else {
            ruleItems.forEach((item) => this.listContainer.append(item.elem));
        }

        show(this.searchField, true);
        this.searchInp.value = state.filter;
        show(this.clearSearchBtn, (state.filter !== ''));

        if (state.pagination.pagesCount > 1) {
            this.listContainer.append(this.paginator.elem);
            this.paginator.setPagesCount(state.pagination.pagesCount);
            this.paginator.setPage(state.pagination.page);
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

        this.formContainer = ImportRuleForm.create({
            data: state.rule,
            submit: (data) => this.onSubmitItem(data),
            cancel: () => this.onCancelItem(),
        });

        insertAfter(this.formContainer.elem, this.listContainer);

        show(this.searchField, false);
        show(this.listContainer, false);
        show(this.createRuleBtn, false);
        show(this.formContainer.elem, true);
    }

    /** Render component state */
    render(state) {
        if (state.listLoading) {
            this.loadingIndicator.show();
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
            this.loadingIndicator.hide();
        }
    }
}
