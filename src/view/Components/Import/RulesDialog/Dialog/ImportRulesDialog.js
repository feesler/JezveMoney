import {
    re,
    show,
    insertAfter,
    isFunction,
    Component,
    createElement,
} from 'jezvejs';
import { Button } from 'jezvejs/Button';
import { ListContainer } from 'jezvejs/ListContainer';
import { Paginator } from 'jezvejs/Paginator';
import { Popup } from 'jezvejs/Popup';
import { PopupMenu } from 'jezvejs/PopupMenu';
import { __ } from '../../../../js/utils.js';
import { API } from '../../../../js/api/index.js';
import { ImportRule } from '../../../../js/model/ImportRule.js';
import { ImportRuleForm } from '../RuleForm/ImportRuleForm.js';
import { ImportRuleItem } from '../RuleItem/ImportRuleItem.js';
import { ConfirmDialog } from '../../../ConfirmDialog/ConfirmDialog.js';
import { LoadingIndicator } from '../../../LoadingIndicator/LoadingIndicator.js';
import { SearchInput } from '../../../SearchInput/SearchInput.js';
import './style.scss';

/** CSS classes */
export const IMPORT_RULES_DIALOG_CLASS = 'rules-dialog';
const IMPORT_RULES_POPUP_CLASS = 'rules-popup';
const UPDATE_BUTTON_CLASS = 'update-btn';
const DEL_BUTTON_CLASS = 'delete-btn';

/** Other */
const SHOW_ON_PAGE = 20;

/**
 * ImportRulesDialog component
 */
export class ImportRulesDialog extends Component {
    constructor(...args) {
        super(...args);

        this.LIST_STATE = 1;
        this.CREATE_STATE = 2;
        this.UPDATE_STATE = 3;

        this.headerElem = this.elem.querySelector('.rules-header');
        this.titleElem = this.headerElem?.querySelector('label');
        this.rulesContent = this.elem.querySelector('.rules-content');
        if (
            !this.titleElem
            || !this.rulesContent
        ) {
            throw new Error('Failed to initialize import rules dialog');
        }

        this.createRuleBtn = Button.create({
            id: 'createRuleBtn',
            className: 'create-btn',
            icon: 'plus',
            onClick: () => this.onCreateRuleClick(),
        });
        this.headerElem.append(this.createRuleBtn.elem);

        this.rulesList = ListContainer.create({
            ItemComponent: ImportRuleItem,
            className: 'rules-list',
            itemSelector: '.rule-item',
            getItemProps: (rule) => ({
                data: rule,
                ruleId: rule.id,
                conditions: rule.conditions,
                actions: rule.actions,
            }),
            onItemClick: (id, e) => this.onItemClick(id, e),
        });

        this.listContainer = createElement('div', {
            props: { className: 'rules-list-container' },
            children: this.rulesList.elem,
        });
        this.rulesContent.append(this.listContainer);

        this.searchInput = SearchInput.create({
            placeholder: __('TYPE_TO_FILTER'),
            onChange: (value) => this.onSearchInputChange(value),
        });
        insertAfter(this.searchInput.elem, this.headerElem);

        this.paginator = Paginator.create({
            arrows: true,
            onChange: (page) => this.onChangePage(page),
        });

        this.listContainer.append(this.paginator.elem);

        this.popup = Popup.create({
            id: 'rules_popup',
            content: this.elem,
            title: this.headerElem,
            closeButton: true,
            onClose: () => this.onClose(),
            className: IMPORT_RULES_POPUP_CLASS,
        });
        show(this.elem, true);

        this.createContextMenu();

        this.loadingIndicator = LoadingIndicator.create({ fixed: false });
        this.elem.append(this.loadingIndicator.elem);

        this.reset();
    }

    createContextMenu() {
        this.contextMenu = PopupMenu.create({
            attached: true,
            items: [{
                icon: 'update',
                title: __('UPDATE'),
                className: UPDATE_BUTTON_CLASS,
                onClick: (e) => this.onUpdateItem(e),
            }, {
                icon: 'del',
                title: __('DELETE'),
                className: DEL_BUTTON_CLASS,
                onClick: (e) => this.onDeleteItem(e),
            }],
        });
    }

    /** Show/hide dialog */
    show(val) {
        this.updateList();
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
            contextItem: null,
            renderTime: Date.now(),
        };
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
        this.setState({ ...this.state, listLoading: true });
    }

    /** Remove loading state and render component */
    stopLoading() {
        this.setState({
            ...this.state,
            listLoading: false,
            renderTime: Date.now(),
        });
    }

    /** Hide dialog */
    onClose() {
        this.reset();
    }

    /** Search input */
    onSearchInputChange(value) {
        if (this.state.filter.toLowerCase() === value.toLowerCase()) {
            return;
        }

        this.state.filter = value;
        if (value.length === 0) {
            this.state.pagination.page = 1;
        }
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

    onItemClick(itemId, e) {
        if (
            this.state.id !== this.LIST_STATE
            || !e.target.closest('.popup-menu-btn')
        ) {
            return;
        }

        this.showContextMenu(itemId);
    }

    showContextMenu(itemId) {
        if (this.state.contextItem === itemId) {
            return;
        }

        this.setState({ ...this.state, contextItem: itemId });
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
        this.updateList();
        this.render(this.state);
    }

    /** Rule 'update' event handler */
    onUpdateItem() {
        const ruleId = this.state.contextItem;
        this.setUpdateRuleState(ruleId);
    }

    /** Rule 'delete' event handler */
    onDeleteItem() {
        const ruleId = this.state.contextItem;
        ConfirmDialog.create({
            id: 'rule_delete_warning',
            title: __('IMPORT_RULE_DELETE'),
            content: __('MSG_RULE_DELETE'),
            onConfirm: () => this.deleteRule(ruleId),
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
            window.app.createErrorNotification(e.message);
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
            window.app.createErrorNotification(e.message);
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
                    : __('ERR_RULE_LIST_READ');
                throw new Error(errorMessage);
            }

            rules.setData(result.data);
            this.state.id = this.LIST_STATE;
            this.state.contextItem = null;
            this.updateList();

            delete this.state.rule;
            this.stopLoading();

            if (isFunction(this.props.onUpdate)) {
                this.props.onUpdate();
            }
        } catch (e) {
            window.app.createErrorNotification(e.message);
            this.stopLoading();
        }
    }

    renderContextMenu(state) {
        if (state.id !== this.LIST_STATE) {
            this.contextMenu.detach();
            return;
        }
        const itemId = state.contextItem;
        if (!itemId) {
            this.contextMenu.detach();
            return;
        }
        const listItem = this.rulesList.getListItemById(itemId);
        const menuContainer = listItem?.elem?.querySelector('.popup-menu');
        if (!menuContainer) {
            return;
        }

        this.contextMenu.attachAndShow(menuContainer);
    }

    /** Render list state of component */
    renderList(state) {
        const firstItem = state.pagination.onPage * (state.pagination.page - 1);
        const lastItem = firstItem + state.pagination.onPage;
        const items = state.items.slice(firstItem, lastItem);

        this.rulesList.setState((listState) => ({
            ...listState,
            items,
            noItemsMessage: (state.filter !== '') ? __('IMPORT_RULES_NOT_FOUND') : __('IMPORT_RULES_NO_DATA'),
            renderTime: state.renderTime,
        }));

        this.searchInput.value = state.filter;

        const showPaginator = state.pagination.pagesCount > 1;
        this.paginator.show(showPaginator);
        if (showPaginator) {
            this.paginator.setState((paginatorState) => ({
                ...paginatorState,
                pagesCount: state.pagination.pagesCount,
                pageNum: state.pagination.page,
            }));
        }

        this.searchInput.show(true);
        this.rulesList.show(true);
        show(this.listContainer, true);
        this.createRuleBtn.show(true);
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
            onSubmit: (data) => this.onSubmitItem(data),
            onCancel: () => this.onCancelItem(),
        });
        this.rulesContent.append(this.formContainer.elem);

        this.searchInput.show(false);
        show(this.listContainer, false);
        this.createRuleBtn.show(false);
        show(this.formContainer.elem, true);
    }

    /** Render component state */
    render(state) {
        if (state.listLoading) {
            this.loadingIndicator.show();
        }

        if (state.id === this.LIST_STATE) {
            this.titleElem.textContent = __('IMPORT_RULES');

            this.renderList(state);
        } else if (state.id === this.CREATE_STATE || state.id === this.UPDATE_STATE) {
            this.titleElem.textContent = (state.id === this.CREATE_STATE)
                ? __('IMPORT_RULE_CREATE')
                : __('IMPORT_RULE_UPDATE');

            this.renderForm(state);
        }

        this.renderContextMenu(state);

        if (!state.listLoading) {
            this.loadingIndicator.hide();
        }
    }
}
