import {
    re,
    show,
    isFunction,
    Component,
    createElement,
} from 'jezvejs';
import { Button } from 'jezvejs/Button';
import { ListContainer } from 'jezvejs/ListContainer';
import { Paginator } from 'jezvejs/Paginator';
import { Popup } from 'jezvejs/Popup';
import { createStore } from 'jezvejs/Store';

import { __, listData } from '../../../../../utils/utils.js';
import { API } from '../../../../../API/index.js';

import { ConfirmDialog } from '../../../../../Components/ConfirmDialog/ConfirmDialog.js';
import { LoadingIndicator } from '../../../../../Components/LoadingIndicator/LoadingIndicator.js';
import { SearchInput } from '../../../../../Components/SearchInput/SearchInput.js';
import { RuleListContextMenu } from '../ContextMenu/RuleListContextMenu.js';
import { ImportRuleForm } from '../RuleForm/ImportRuleForm.js';
import { ImportRuleItem } from '../RuleItem/ImportRuleItem.js';

import {
    actions,
    reducer,
    getInitialState,
    LIST_STATE,
    CREATE_STATE,
    UPDATE_STATE,
} from './reducer.js';
import './ImportRulesDialog.scss';

/** CSS classes */
const DIALOG_CLASS = 'rules-dialog';
const POPUP_CLASS = 'rules-popup';
const HEADER_CLASS = 'rules-header';
const CREATE_BTN_CLASS = 'create-btn';
const DIALOG_CONTENT_CLASS = 'rules-content';
const LIST_CONTAINER_CLASS = 'rules-list-container';
const LIST_CLASS = 'rules-list';

/**
 * ImportRulesDialog component
 */
export class ImportRulesDialog extends Component {
    constructor(...args) {
        super(...args);

        this.contextMenuActions = {
            ctxUpdateRuleBtn: () => this.onUpdateItem(),
            ctxDeleteRuleBtn: () => this.onDeleteItem(),
        };

        this.store = createStore(reducer, { initialState: getInitialState() });

        this.init();

        this.store.subscribe((state, prevState) => {
            if (state !== prevState) {
                this.render(state, prevState);
            }
        });
    }

    init() {
        // Header title
        this.titleElem = createElement('label', { props: { textContent: __('IMPORT_RULES') } });

        // Create new rule button
        this.createRuleBtn = Button.create({
            id: 'createRuleBtn',
            className: CREATE_BTN_CLASS,
            icon: 'plus',
            onClick: () => this.onCreateRuleClick(),
        });

        // Header
        this.headerElem = createElement('div', {
            props: { className: HEADER_CLASS },
            children: [
                this.titleElem,
                this.createRuleBtn.elem,
            ],
        });

        // Search input
        this.searchInput = SearchInput.create({
            placeholder: __('TYPE_TO_FILTER'),
            onChange: (value) => this.onSearchInputChange(value),
        });

        // Rules list
        this.rulesList = ListContainer.create({
            ItemComponent: ImportRuleItem,
            className: LIST_CLASS,
            itemSelector: ImportRuleItem.selector,
            getItemProps: (rule) => ({
                data: rule,
                ruleId: rule.id,
                conditions: rule.conditions,
                actions: rule.actions,
            }),
            onItemClick: (id, e) => this.onItemClick(id, e),
        });

        // Paginator
        this.paginator = Paginator.create({
            arrows: true,
            onChange: (page) => this.onChangePage(page),
        });

        this.listContainer = createElement('div', {
            props: { className: LIST_CONTAINER_CLASS },
            children: [
                this.rulesList.elem,
                this.paginator.elem,
            ],
        });

        // Dialog content
        this.rulesContent = createElement('div', {
            props: { className: DIALOG_CONTENT_CLASS },
            children: this.listContainer,
        });

        // Loading indicator
        this.loadingIndicator = LoadingIndicator.create({ fixed: false });

        this.elem = createElement('div', {
            props: { className: DIALOG_CLASS },
            children: [
                this.headerElem,
                this.searchInput.elem,
                this.rulesContent,
                this.loadingIndicator.elem,
            ],
        });

        this.popup = Popup.create({
            id: 'rules_popup',
            content: this.elem,
            title: this.headerElem,
            closeButton: true,
            onClose: () => this.onClose(),
            className: POPUP_CLASS,
        });
        show(this.elem, true);
    }

    onContextMenuClick(item) {
        this.hideContextMenu();

        const menuAction = this.contextMenuActions[item];
        if (isFunction(menuAction)) {
            menuAction();
        }
    }

    /** Show/hide dialog */
    show(val) {
        this.reset();
        this.popup.show(val);
    }

    /** Hide dialog */
    hide() {
        this.popup.hide();
    }

    /** Reset dialog state */
    reset() {
        this.store.dispatch(actions.reset());
    }

    /** Set loading state and render component */
    startLoading() {
        this.store.dispatch(actions.startLoading());
    }

    /** Remove loading state and render component */
    stopLoading() {
        this.store.dispatch(actions.stopLoading());
    }

    /** Hide dialog */
    onClose() {
        this.reset();
    }

    /** Search input */
    onSearchInputChange(value) {
        this.store.dispatch(actions.changeSearchQuery(value));
    }

    /** Change page event handler */
    onChangePage(page) {
        this.store.dispatch(actions.changePage(page));
    }

    /** Create rule button 'click' event handler */
    onCreateRuleClick() {
        this.store.dispatch(actions.createRule());
    }

    onItemClick(itemId, e) {
        const state = this.store.getState();

        if (
            state.id !== LIST_STATE
            || !e.target.closest('.menu-btn')
        ) {
            return;
        }

        this.showContextMenu(itemId);
    }

    showContextMenu(itemId) {
        this.store.dispatch(actions.showContextMenu(itemId));
    }

    hideContextMenu() {
        this.store.dispatch(actions.hideContextMenu());
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
    }

    /** Rule 'update' event handler */
    onUpdateItem() {
        this.store.dispatch(actions.updateRule());
    }

    /** Rule 'delete' event handler */
    onDeleteItem() {
        const { contextItem } = this.store.getState();

        ConfirmDialog.create({
            id: 'rule_delete_warning',
            title: __('IMPORT_RULE_DELETE'),
            content: __('MSG_RULE_DELETE'),
            onConfirm: () => this.deleteRule(contextItem),
        });
    }

    prepareRequest(data) {
        return {
            ...data,
            returnState: {
                importrules: {},
            },
        };
    }

    getListDataFromResponse(response) {
        return response?.data?.state?.importrules?.data;
    }

    setListData(data) {
        window.app.model.rules.setData(data);
        this.store.dispatch(actions.listRequestLoaded());

        if (isFunction(this.props.onUpdate)) {
            this.props.onUpdate();
        }
    }

    /** Send create/update import rule request to API */
    async submitRule(data) {
        if (!data) {
            throw new Error('Invalid data');
        }

        this.startLoading();

        try {
            const request = this.prepareRequest(data);
            const response = (data.id)
                ? await API.importRule.update(request)
                : await API.importRule.create(request);

            const rules = this.getListDataFromResponse(response);
            this.setListData(rules);
        } catch (e) {
            window.app.createErrorNotification(e.message);
        }

        this.stopLoading();
    }

    /** Send delete import rule request to API */
    async deleteRule(ruleId) {
        const id = parseInt(ruleId, 10);
        if (!id) {
            throw new Error('Invalid rule id');
        }

        this.startLoading();

        try {
            const request = this.prepareRequest({ id });
            const response = await API.importRule.del(request);
            const rules = this.getListDataFromResponse(response);
            this.setListData(rules);
        } catch (e) {
            window.app.createErrorNotification(e.message);
        }

        this.stopLoading();
    }

    /** Send API request to obain list of import rules */
    async requestRulesList() {
        this.startLoading();

        try {
            const result = await API.importRule.list({ extended: true });
            this.setListData(result.data);
        } catch (e) {
            window.app.createErrorNotification(e.message);
        }

        this.stopLoading();
    }

    renderContextMenu(state) {
        if (!state.showContextMenu && !this.contextMenu) {
            return;
        }

        if (!this.contextMenu) {
            this.contextMenu = RuleListContextMenu.create({
                onItemClick: (item) => this.onContextMenuClick(item),
                onClose: () => this.hideContextMenu(),
            });
        }

        this.contextMenu.setState({
            showContextMenu: state.showContextMenu,
            contextItem: state.contextItem,
        });
    }

    /** Render list state of component */
    renderList(state) {
        const firstItem = state.pagination.onPage * (state.pagination.page - 1);
        const lastItem = firstItem + state.pagination.onPage;
        const items = listData(state.items).slice(firstItem, lastItem);

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

        if (state.id === LIST_STATE) {
            this.titleElem.textContent = __('IMPORT_RULES');

            this.renderList(state);
        } else if (state.id === CREATE_STATE || state.id === UPDATE_STATE) {
            this.titleElem.textContent = (state.id === CREATE_STATE)
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
