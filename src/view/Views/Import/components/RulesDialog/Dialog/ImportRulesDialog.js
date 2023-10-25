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

import { __, getAbsoluteIndex } from '../../../../../utils/utils.js';

import { ConfirmDialog } from '../../../../../Components/Common/ConfirmDialog/ConfirmDialog.js';
import { LoadingIndicator } from '../../../../../Components/Common/LoadingIndicator/LoadingIndicator.js';
import { SearchInput } from '../../../../../Components/Form/Inputs/SearchInput/SearchInput.js';
import { RuleListContextMenu } from '../ContextMenu/RuleListContextMenu.js';
import { NoDataMessage } from '../../../../../Components/Common/NoDataMessage/NoDataMessage.js';
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
import { deleteRule, submitRule } from './actions.js';
import './ImportRulesDialog.scss';

/** CSS classes */
const DIALOG_CLASS = 'rules-dialog';
const POPUP_CLASS = 'rules-popup';
const HEADER_CLASS = 'rules-header';
const CREATE_BTN_CLASS = 'create-btn circle-btn';
const DIALOG_CONTENT_CLASS = 'rules-content';
const LIST_CONTAINER_CLASS = 'rules-list-container';
const LIST_CLASS = 'rules-list';

const defaultProps = {
    onClose: null,
};

/**
 * ImportRulesDialog component
 */
export class ImportRulesDialog extends Component {
    constructor(props = {}) {
        super({
            ...defaultProps,
            ...props,
        });

        this.store = createStore(reducer, { initialState: getInitialState() });

        this.init();

        this.subscribeToStore(this.store);
    }

    init() {
        // Header title
        this.titleElem = createElement('label', { props: { textContent: __('import.rules.listTitle') } });

        // Create new rule button
        this.createRuleBtn = Button.create({
            id: 'createRuleBtn',
            className: CREATE_BTN_CLASS,
            icon: 'plus',
            onClick: () => this.store.dispatch(actions.createRule()),
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
            placeholder: __('typeToFilter'),
            onChange: (value) => this.onSearchInputChange(value),
        });

        // Rules list
        this.rulesList = ListContainer.create({
            ItemComponent: ImportRuleItem,
            className: LIST_CLASS,
            itemSelector: ImportRuleItem.selector,
            getItemProps: (item) => ({
                item,
                collapsed: item.collapsed,
                toggleButton: true,
                showControls: true,
            }),
            PlaceholderComponent: NoDataMessage,
            getPlaceholderProps: (state) => ({
                title: (state.filter !== '')
                    ? __('import.rules.notFound')
                    : __('import.rules.noData'),
            }),
            onItemClick: (id, e) => this.onItemClick(id, e),
        });

        // 'Show more' button
        this.showMoreBtn = Button.create({
            className: 'show-more-btn',
            title: __('actions.showMore'),
            onClick: () => this.showMore(),
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
                this.showMoreBtn.elem,
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

    /** Hide dialog */
    onClose() {
        this.reset();

        if (isFunction(this.props.onClose)) {
            this.props.onClose();
        }
    }

    /** Search input */
    onSearchInputChange(value) {
        this.store.dispatch(actions.changeSearchQuery(value));
    }

    /** Change page event handler */
    onChangePage(page) {
        this.store.dispatch(actions.changePage(page));
    }

    /** 'Show more' button 'click' event handler */
    showMore() {
        this.store.dispatch(actions.showMore());
    }

    /** Create rule button 'click' event handler */
    onCreateRuleClick() {
        this.store.dispatch(actions.createRule());
    }

    onItemClick(itemId, e) {
        const state = this.store.getState();

        if (e.target.closest('.toggle-btn')) {
            this.store.dispatch(actions.toggleCollapseItem(itemId));
            return;
        }

        if (
            state.id === LIST_STATE
            && e.target.closest('.menu-btn')
        ) {
            this.store.dispatch(actions.showContextMenu(itemId));
        }
    }

    renderDeleteConfirmDialog(state, prevState) {
        if (state.showDeleteConfirmDialog === prevState.showDeleteConfirmDialog) {
            return;
        }

        if (!state.showDeleteConfirmDialog) {
            return;
        }

        const { contextItem } = this.store.getState();

        ConfirmDialog.create({
            id: 'rule_delete_warning',
            title: __('import.rules.delete'),
            content: __('import.rules.deleteMessage'),
            onConfirm: () => this.store.dispatch(deleteRule(contextItem)),
            onReject: () => this.store.dispatch(actions.hideDeleteConfirmDialog()),
        });
    }

    renderContextMenu(state) {
        if (!state.showContextMenu && !this.contextMenu) {
            return;
        }

        if (!this.contextMenu) {
            this.contextMenu = RuleListContextMenu.create({
                dispatch: (action) => this.store.dispatch(action),
                onClose: () => this.store.dispatch(actions.hideContextMenu()),
            });
        }

        this.contextMenu.setContext({
            showContextMenu: state.showContextMenu,
            contextItem: state.contextItem,
        });
    }

    /** Render list state of component */
    renderList(state) {
        const firstItem = getAbsoluteIndex(0, state);
        const lastItem = firstItem + state.pagination.onPage * state.pagination.range;
        const items = state.items.slice(firstItem, lastItem);

        this.rulesList.setState((listState) => ({
            ...listState,
            items,
            renderTime: state.renderTime,
        }));

        this.searchInput.value = state.filter;

        // Paginator
        const range = state.pagination.range ?? 1;
        const pageNum = state.pagination.page + range - 1;

        const showPaginator = state.pagination.pagesCount > 1;
        this.paginator.show(showPaginator);
        if (showPaginator) {
            this.paginator.setState((paginatorState) => ({
                ...paginatorState,
                pagesCount: state.pagination.pagesCount,
                pageNum,
            }));
        }

        // 'Show more' button
        this.showMoreBtn.show(
            state.items.length > 0
            && pageNum < state.pagination.pagesCount,
        );

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
            onSubmit: (data) => this.store.dispatch(submitRule(data)),
            onCancel: () => this.reset(),
        });
        this.rulesContent.append(this.formContainer.elem);

        this.searchInput.show(false);
        show(this.listContainer, false);
        this.createRuleBtn.show(false);
        show(this.formContainer.elem, true);
    }

    /** Render component state */
    render(state, prevState = {}) {
        if (state.listLoading) {
            this.loadingIndicator.show();
        }

        if (state.id === LIST_STATE) {
            this.titleElem.textContent = __('import.rules.listTitle');

            this.renderList(state);
        } else if (state.id === CREATE_STATE || state.id === UPDATE_STATE) {
            this.titleElem.textContent = (state.id === CREATE_STATE)
                ? __('import.rules.create')
                : __('import.rules.update');

            this.renderForm(state);
        }

        this.renderContextMenu(state, prevState);
        this.renderDeleteConfirmDialog(state, prevState);

        if (!state.listLoading) {
            this.loadingIndicator.hide();
        }
    }
}
