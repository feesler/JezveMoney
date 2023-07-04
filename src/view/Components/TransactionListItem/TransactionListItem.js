import {
    createElement,
    removeChilds,
    show,
    Component,
} from 'jezvejs';
import { Checkbox } from 'jezvejs/Checkbox';
import { MenuButton } from 'jezvejs/MenuButton';

import { __ } from '../../utils/utils.js';
import { App } from '../../Application/App.js';

import {
    EXPENSE,
    INCOME,
    TRANSFER,
    DEBT,
    LIMIT_CHANGE,
    Transaction,
} from '../../Models/Transaction.js';

import { Field } from '../Fields/Field/Field.js';

import './TransactionListItem.scss';

/** CSS classes */
const TRANS_ITEM_CLASS = 'trans-item';
const CONTENT_CLASS = 'trans-item__content';
const TITLE_CLASS = 'trans-item__title';
const AMOUNT_CLASS = 'trans-item__amount';
const DATE_CLASS = 'trans-item__date';
const CATEGORY_CLASS = 'trans-item__category';
const COMMENT_CLASS = 'trans-item__comment';
const AMOUNT_CATEGORY_CLASS = 'trans-item__amount-category';
const DATE_COMMENT_CLASS = 'trans-item__date-comment';
/* Details mode */
const DETAILS_CLASS = 'trans-item_details';
const COLUMN_CLASS = 'trans-item__column';
/* Fields */
const TYPE_FIELD_CLASS = 'trans-item__type-field';
const TITLE_FIELD_CLASS = 'trans-item__account-field';
const AMOUNT_FIELD_CLASS = 'trans-item__amount-field';
const RESULT_FIELD_CLASS = 'trans-item__result-field';
const DATE_FIELD_CLASS = 'trans-item__date-field';
const CATEGORY_FIELD_CLASS = 'trans-item__category-field';
const COMMENT_FIELD_CLASS = 'trans-item__comment-field';
/* Select controls */
const SELECT_CONTROLS_CLASS = 'trans-item__select';
/* Controls */
const CONTROLS_CLASS = 'trans-item__controls';
/* Other */
const SELECTED_CLASS = 'trans-item_selected';
const SORT_CLASS = 'trans-item_sort';

const defaultProps = {
    selected: false,
    listMode: 'list',
    showControls: false,
    showDate: true,
};

/**
 * Transaction list item component
 */
export class TransactionListItem extends Component {
    constructor(props) {
        super(props);

        this.props = {
            ...defaultProps,
            ...this.props,
        };

        this.state = { ...this.props };

        this.selectControls = null;
        this.controlsElem = null;

        this.init();
    }

    get id() {
        return this.state.item.id;
    }

    init() {
        this.contentElem = createElement('div', { props: { className: CONTENT_CLASS } });
        this.elem = createElement('div', {
            props: { className: TRANS_ITEM_CLASS },
            children: this.contentElem,
        });

        this.render(this.state);
    }

    initClassic() {
        this.titleElem = createElement('div', { props: { className: TITLE_CLASS } });
        this.amountElem = createElement('div', { props: { className: AMOUNT_CLASS } });
        this.categoryElem = createElement('div', { props: { className: CATEGORY_CLASS } });
        const amountCategoryElem = createElement('div', {
            props: { className: AMOUNT_CATEGORY_CLASS },
            children: [
                this.amountElem,
                this.categoryElem,
            ],
        });

        this.dateElem = createElement('div', { props: { className: DATE_CLASS } });
        this.commentElem = createElement('div', { props: { className: COMMENT_CLASS } });
        const dateCommentElem = createElement('div', {
            props: { className: DATE_COMMENT_CLASS },
            children: [
                this.dateElem,
                this.commentElem,
            ],
        });

        this.contentElem.append(this.titleElem, amountCategoryElem, dateCommentElem);
    }

    initDetails() {
        // Type
        this.typeField = Field.create({
            title: __('transactions.type'),
            className: TYPE_FIELD_CLASS,
        });
        // Accounts
        this.sourceField = Field.create({
            title: __('transactions.source'),
            className: TITLE_FIELD_CLASS,
        });
        this.destField = Field.create({
            title: __('transactions.destination'),
            className: TITLE_FIELD_CLASS,
        });
        const sourceDestGroup = createElement('div', {
            props: { className: COLUMN_CLASS },
            children: [this.sourceField.elem, this.destField.elem],
        });
        // Amount
        this.srcAmountField = Field.create({
            title: __('transactions.sourceAmount'),
            className: AMOUNT_FIELD_CLASS,
        });
        this.destAmountField = Field.create({
            title: __('transactions.destAmount'),
            className: AMOUNT_FIELD_CLASS,
        });
        const amountGroup = createElement('div', {
            props: { className: COLUMN_CLASS },
            children: [this.srcAmountField.elem, this.destAmountField.elem],
        });
        // Result balance
        this.srcResultField = Field.create({
            title: __('transactions.sourceResult'),
            className: RESULT_FIELD_CLASS,
        });
        this.destResultField = Field.create({
            title: __('transactions.destResult'),
            className: RESULT_FIELD_CLASS,
        });
        const resultsGroup = createElement('div', {
            props: { className: COLUMN_CLASS },
            children: [this.srcResultField.elem, this.destResultField.elem],
        });

        const amountResultGroup = createElement('div', {
            props: { className: COLUMN_CLASS },
            children: [amountGroup, resultsGroup],
        });
        // Date
        this.dateElem = createElement('div', { props: { className: DATE_CLASS } });
        this.dateField = Field.create({
            title: __('transactions.date'),
            content: this.dateElem,
            className: DATE_FIELD_CLASS,
        });
        // Category
        this.categoryElem = createElement('div', { props: { className: CATEGORY_CLASS } });
        this.categoryField = Field.create({
            title: __('transactions.category'),
            content: this.categoryElem,
            className: CATEGORY_FIELD_CLASS,
        });
        // Comment
        this.commentElem = createElement('div', { props: { className: COMMENT_CLASS } });
        this.commentField = Field.create({
            title: __('transactions.comment'),
            content: this.commentElem,
            className: COMMENT_FIELD_CLASS,
        });

        const dateCategoryGroup = createElement('div', {
            props: { className: COLUMN_CLASS },
            children: [
                this.dateField.elem,
                this.categoryField.elem,
            ],
        });

        this.contentElem.append(
            this.typeField.elem,
            sourceDestGroup,
            amountResultGroup,
            dateCategoryGroup,
            this.commentField.elem,
        );
    }

    resetContent() {
        removeChilds(this.contentElem);
        // Classic mode elements
        this.titleElem = null;
        this.amountElem = null;
        // Details mode elements
        this.typeField = null;
        this.sourceField = null;
        this.destField = null;
        this.srcAmountField = null;
        this.destAmountField = null;
        this.srcResultField = null;
        this.destResultField = null;
        this.dateField = null;
        this.categoryField = null;
        this.commentField = null;
        // Common
        this.dateElem = null;
        this.categoryElem = null;
        this.commentElem = null;
    }

    createSelectControls() {
        const { createContainer } = App;

        if (this.selectControls) {
            return;
        }

        this.checkbox = Checkbox.create();
        this.selectControls = createContainer(SELECT_CONTROLS_CLASS, [
            this.checkbox.elem,
        ]);

        this.elem.prepend(this.selectControls);
    }

    createControls() {
        if (this.controlsElem) {
            return;
        }

        this.menuButton = MenuButton.create();
        this.controlsElem = createElement('div', {
            props: { className: CONTROLS_CLASS },
            children: this.menuButton.elem,
        });

        this.elem.append(this.controlsElem);
    }

    getDebtType(item) {
        if (item.type !== DEBT) {
            throw new Error('Invalid item type');
        }

        const { profile, accounts } = App.model;
        const srcAcc = accounts.getItem(item.src_id);
        return (!!srcAcc && srcAcc.owner_id !== profile.owner_id);
    }

    getAccountOrPerson(accountId) {
        const { profile, accounts, persons } = App.model;
        const account = accounts.getItem(accountId);
        if (!account) {
            return null;
        }
        if (account.owner_id === profile.owner_id) {
            return account.name;
        }

        const person = persons.getItem(account.owner_id);
        return person.name;
    }

    formatAccounts(item) {
        if (!item) {
            throw new Error('Invalid transaction');
        }

        const accountModel = App.model.accounts;
        const srcAcc = accountModel.getItem(item.src_id);
        const destAcc = accountModel.getItem(item.dest_id);

        if (item.type === EXPENSE) {
            return srcAcc.name;
        }

        if (item.type === INCOME) {
            return destAcc.name;
        }

        if (item.type === TRANSFER) {
            return `${srcAcc.name} → ${destAcc.name}`;
        }

        if (item.type === LIMIT_CHANGE) {
            return srcAcc?.name ?? destAcc?.name;
        }

        if (item.type !== DEBT) {
            throw new Error('Invalid type of transaction');
        }

        const personModel = App.model.persons;
        const debtType = this.getDebtType(item);
        const personAcc = (debtType) ? srcAcc : destAcc;
        const person = personModel.getItem(personAcc.owner_id);
        if (!person) {
            throw new Error(`Person ${personAcc.owner_id} not found`);
        }

        const acc = (debtType) ? destAcc : srcAcc;
        if (acc) {
            return (debtType)
                ? `${person.name} → ${acc.name}`
                : `${acc.name} → ${person.name}`;
        }

        return person.name;
    }

    formatAmount(item) {
        if (!item) {
            throw new Error('Invalid transaction');
        }

        const currencyModel = App.model.currency;
        const srcAmountFmt = currencyModel.formatCurrency(item.src_amount, item.src_curr);
        const destAmountFmt = currencyModel.formatCurrency(item.dest_amount, item.dest_curr);
        const diffCurrency = item.src_curr !== item.dest_curr;

        let sign = '';
        if (item.type === EXPENSE) {
            sign = '- ';
        }
        if (item.type === INCOME) {
            sign = '+ ';
        }

        if (item.type === DEBT) {
            const debtType = this.getDebtType(item);
            const acc = (debtType) ? item.dest_id : item.src_id;
            if (!acc) {
                sign = (debtType) ? '- ' : '+ ';
            }
        }

        if (item.type === LIMIT_CHANGE) {
            sign = (item.src_id !== 0) ? '- ' : '+ ';
        }

        return (diffCurrency)
            ? `${sign}${srcAmountFmt} (${sign}${destAmountFmt})`
            : `${sign}${srcAmountFmt}`;
    }

    getCategoryTitle(state) {
        const { item } = state;
        if (item.category_id === 0) {
            return null;
        }

        const { categories } = App.model;
        const category = categories.getItem(item.category_id);
        if (!category) {
            throw new Error('Invalid category');
        }

        return category.name;
    }

    renderSelectControls(state, prevState) {
        if (state.listMode === prevState.listMode) {
            return;
        }

        this.createSelectControls();
    }

    renderControls(state, prevState) {
        if (state.showControls === prevState.showControls) {
            return;
        }

        if (state.showControls) {
            this.createControls();
        }

        show(this.controlsElem, state.showControls);
    }

    renderClassic(state) {
        const { item } = state;

        const accountTitle = this.formatAccounts(item);
        this.titleElem.textContent = accountTitle;
        this.titleElem.setAttribute('title', accountTitle);

        this.amountElem.textContent = this.formatAmount(item);

        this.dateElem.textContent = App.formatDate(item.date);
        show(this.dateElem, state.showDate);

        const categoryTitle = this.getCategoryTitle(state);
        show(this.categoryElem, !!categoryTitle);
        this.categoryElem.textContent = categoryTitle;

        this.commentElem.textContent = item.comment;
        this.commentElem.setAttribute('title', item.comment);
    }

    renderDetails(state) {
        const { item } = state;
        const { currency } = App.model;

        // Type
        this.typeField.setContent(Transaction.getTypeTitle(item.type));

        // Source
        const showSource = (item.src_id !== 0);
        if (showSource) {
            const sourceContent = this.getAccountOrPerson(item.src_id);
            this.sourceField.setContent(sourceContent);
        }
        this.sourceField.show(showSource);

        // Destination
        const showDest = (item.dest_id !== 0);
        if (showDest) {
            const destContent = this.getAccountOrPerson(item.dest_id);
            this.destField.setContent(destContent);
        }
        this.destField.show(showDest);

        // Amount
        const isDiff = (item.src_curr !== item.dest_curr);
        const srcAmountLabel = (isDiff) ? __('transactions.sourceAmount') : __('transactions.amount');
        this.srcAmountField.setTitle(srcAmountLabel);
        if (isDiff) {
            const srcAmountFmt = currency.formatCurrency(item.src_amount, item.src_curr);
            this.srcAmountField.setContent(srcAmountFmt);
            const destAmountFmt = currency.formatCurrency(item.dest_amount, item.dest_curr);
            this.destAmountField.setContent(destAmountFmt);
        } else {
            const amountFmt = this.formatAmount(item);
            this.srcAmountField.setContent(amountFmt);
        }
        this.destAmountField.show(isDiff);

        // Source result
        if (showSource) {
            const srcResultLabel = (showDest) ? __('transactions.sourceResult') : __('transactions.result');
            this.srcResultField.setTitle(srcResultLabel);
            const srcResult = currency.formatCurrency(item.src_result, item.src_curr);
            this.srcResultField.setContent(srcResult);
        }
        this.srcResultField.show(showSource);

        // Destination result
        if (showDest) {
            const destResultLabel = (showSource) ? __('transactions.destResult') : __('transactions.result');
            this.destResultField.setTitle(destResultLabel);
            const destResult = currency.formatCurrency(item.dest_result, item.dest_curr);
            this.destResultField.setContent(destResult);
        }
        this.destResultField.show(showDest);

        // Date
        this.dateField.setContent(App.formatDate(item.date));
        this.dateField.show(state.showDate);

        // Category field
        const categoryTitle = this.getCategoryTitle(state);
        this.categoryField.show(!!categoryTitle);
        this.categoryField.setContent(categoryTitle);

        // Comment
        const hasComment = item.comment.length > 0;
        this.commentField.show(hasComment);
        this.commentField.setContent(item.comment);
    }

    renderContent(state, prevState) {
        if (state.mode !== prevState.mode) {
            this.resetContent();
            if (state.mode === 'details') {
                this.initDetails();
            } else {
                this.initClassic();
            }
        }

        if (state.mode === 'details') {
            this.renderDetails(state);
        } else {
            this.renderClassic(state);
        }
    }

    render(state, prevState = {}) {
        if (!state) {
            throw new Error('Invalid state object');
        }

        const { item } = state;
        if (!item) {
            throw new Error('Invalid transaction object');
        }

        this.elem.setAttribute('data-id', item.id);
        this.elem.setAttribute('data-type', item.type);
        this.elem.setAttribute('data-group', item.date);

        this.renderSelectControls(state, prevState);
        this.renderControls(state, prevState);

        this.elem.classList.toggle(DETAILS_CLASS, state.mode === 'details');
        this.elem.classList.toggle(SORT_CLASS, state.listMode === 'sort');

        this.renderContent(state, prevState);

        const selectMode = state.listMode === 'select';
        const selected = selectMode && !!state.selected;
        this.elem.classList.toggle(SELECTED_CLASS, selected);
        this.checkbox?.check(selected);
        if (this.checkbox) {
            this.checkbox.input.tabIndex = (selectMode) ? 0 : -1;
        }
    }
}
