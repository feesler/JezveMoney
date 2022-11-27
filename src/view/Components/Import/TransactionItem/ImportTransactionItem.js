import {
    createElement,
    enable,
    show,
} from 'jezvejs';
import { ImportTransactionBase } from '../TransactionBase/ImportTransactionBase.js';
import { Field } from '../../Field/Field.js';
import './style.scss';
import { ImportTransaction } from '../../../js/model/ImportTransaction.js';

/** CSS classes */
const CONTAINER_CLASS = 'import-item';
const MAIN_CONTENT_CLASS = 'main-content';
const ITEM_CONTAINER_CLASS = 'item-container';
const COLUMN_CLASS = 'item-column';
const ROW_CLASS = 'item-row';
const AMOUNT_COLUMN_CLASS = 'amount-col';
const TYPE_COLUMN_CLASS = 'type-col';
/* Fields */
const TYPE_FIELD_CLASS = 'type-field';
const ACCOUNT_FIELD_CLASS = 'account-field';
const PERSON_FIELD_CLASS = 'person-field';
const AMOUNT_FIELD_CLASS = 'amount-field';
const DATE_FIELD_CLASS = 'date-field';
const COMMENT_FIELD_CLASS = 'comment-field';
/* Field values */
const TYPE_CLASS = 'import-item__type';
const ACCOUNT_CLASS = 'import-item__account';
const PERSON_CLASS = 'import-item__person';
const AMOUNT_CLASS = 'import-item__amount';
const DATE_CLASS = 'import-item__date';
const COMMENT_CLASS = 'import-item__comment';
/* Controls */
const CONTROLS_CLASS = 'controls';
/* Sort state */
const SORT_CLASS = 'import-item_sort';

/** Strings */
const TITLE_FIELD_SRC_ACCOUNT = 'Source account';
const TITLE_FIELD_DEST_ACCOUNT = 'Destination account';
const TITLE_FIELD_AMOUNT = 'Amount';
const TITLE_FIELD_SRC_AMOUNT = 'Source amount';

const typeStrings = {
    expense: 'Expense',
    income: 'Income',
    transferfrom: 'Transfer from',
    transferto: 'Transfer to',
    debtfrom: 'Debt from',
    debtto: 'Debt to',
};

const defaultProps = {
    onSelect: null,
    onCollapse: null,
    onUpdate: null,
    onEnable: null,
    onRemove: null,
};

/**
 * ImportTransactionForm component
 */
export class ImportTransactionItem extends ImportTransactionBase {
    constructor(...args) {
        super(...args);

        if (!this.props?.data?.mainAccount) {
            throw new Error('Invalid props');
        }

        this.props = {
            ...defaultProps,
            ...this.props,
        };

        this.state = {
            transaction: new ImportTransaction(this.props.data),
            collapsed: this.props.collapsed,
        };

        this.init();
    }

    init() {
        const { createContainer } = window.app;

        this.trTypeTitle = createElement('span', { props: { className: TYPE_CLASS } });
        this.trTypeField = Field.create({
            title: 'Type',
            content: this.trTypeTitle,
            className: TYPE_FIELD_CLASS,
        });

        this.accountTitle = createElement('span', { props: { className: ACCOUNT_CLASS } });
        this.accountField = Field.create({
            title: 'Account',
            content: this.accountTitle,
            className: ACCOUNT_FIELD_CLASS,
        });

        this.personTitle = createElement('span', { props: { className: PERSON_CLASS } });
        this.personField = Field.create({
            title: 'Person',
            content: this.personTitle,
            className: PERSON_FIELD_CLASS,
        });

        this.srcAmountTitle = createElement('span', { props: { className: AMOUNT_CLASS } });
        this.srcAmountField = Field.create({
            title: 'Amount',
            content: this.srcAmountTitle,
            className: AMOUNT_FIELD_CLASS,
        });

        this.destAmountTitle = createElement('span', { props: { className: AMOUNT_CLASS } });
        this.destAmountField = Field.create({
            title: 'Destination amount',
            content: this.destAmountTitle,
            className: AMOUNT_FIELD_CLASS,
        });

        this.dateTitle = createElement('span', { props: { className: DATE_CLASS } });
        this.dateField = Field.create({
            title: 'Date',
            content: this.dateTitle,
            className: DATE_FIELD_CLASS,
        });

        this.commentTitle = createElement('span', { props: { className: COMMENT_CLASS } });
        this.commentField = Field.create({
            title: 'Comment',
            content: this.commentTitle,
            className: COMMENT_FIELD_CLASS,
        });

        this.topRow = createContainer(ROW_CLASS, [
            this.dateField.elem,
            this.commentField.elem,
        ]);

        this.itemContainer = createContainer(ITEM_CONTAINER_CLASS, [
            createContainer(`${COLUMN_CLASS} ${TYPE_COLUMN_CLASS}`, [
                this.trTypeField.elem,
                this.accountField.elem,
                this.personField.elem,
            ]),
            createContainer(`${COLUMN_CLASS} ${AMOUNT_COLUMN_CLASS}`, [
                this.srcAmountField.elem,
                this.destAmountField.elem,
            ]),
            createContainer(COLUMN_CLASS, [
                this.topRow,
            ]),
        ]);

        this.createMenuButton();
        this.controls = createContainer(CONTROLS_CLASS, [
            this.menuContainer,
        ]);

        this.createSelectControls();
        this.mainContainer = createContainer(MAIN_CONTENT_CLASS, [
            this.selectControls,
            this.itemContainer,
            this.controls,
        ]);

        this.initContainer(CONTAINER_CLASS, [this.mainContainer]);

        this.render();
    }

    /** Render component */
    render(state = this.state) {
        if (!state) {
            throw new Error('Invalid state');
        }

        const isDiff = state.transaction.isDiff();
        const transaction = state.transaction.state;

        const { userAccounts, persons, currency } = window.app.model;
        const isTransfer = ['transferfrom', 'transferto'].includes(transaction.type);
        const isDebt = ['debtfrom', 'debtto'].includes(transaction.type);

        enable(this.elem, transaction.enabled);

        this.elem.classList.toggle(SORT_CLASS, transaction.listMode === 'sort');

        // Select controls
        this.renderSelectControls(state);

        // Types field
        if (!(transaction.type in typeStrings)) {
            throw new Error('Invalid transaction type');
        }
        this.trTypeTitle.textContent = typeStrings[transaction.type];

        // Account field
        this.accountField.show(isTransfer);
        if (isTransfer) {
            const isTransferFrom = transaction.type === 'transferfrom';
            const accountId = (isTransferFrom)
                ? transaction.destAccountId
                : transaction.sourceAccountId;
            const account = userAccounts.getItem(accountId);
            this.accountTitle.textContent = account.name;

            const accountTitle = (isTransferFrom)
                ? TITLE_FIELD_DEST_ACCOUNT
                : TITLE_FIELD_SRC_ACCOUNT;
            this.accountField.setTitle(accountTitle);
        }
        // Person field
        this.personField.show(isDebt);
        if (isDebt) {
            const person = persons.getItem(transaction.personId);
            this.personTitle.textContent = person.name;
        }

        // Amount fields
        const srcAmountLabel = (isDiff) ? TITLE_FIELD_SRC_AMOUNT : TITLE_FIELD_AMOUNT;
        this.srcAmountField.setTitle(srcAmountLabel);
        const srcAmount = currency.formatCurrency(transaction.sourceAmount, transaction.srcCurrId);
        this.srcAmountTitle.textContent = srcAmount;

        this.srcAmountField.elem.dataset.amount = transaction.sourceAmount;
        this.srcAmountField.elem.dataset.curr = transaction.srcCurrId;

        this.destAmountField.show(isDiff);
        const destAmount = (isDiff)
            ? currency.formatCurrency(transaction.destAmount, transaction.destCurrId)
            : '';
        this.destAmountTitle.textContent = destAmount;

        this.destAmountField.elem.dataset.amount = transaction.destAmount;
        this.destAmountField.elem.dataset.curr = transaction.destCurrId;

        // Date field
        this.dateTitle.textContent = transaction.date;

        // Comment field
        this.commentTitle.textContent = transaction.comment;

        show(this.menuContainer, transaction.listMode === 'list');

        if (this.collapse) {
            if (transaction.collapsed) {
                this.collapse.collapse();
            } else {
                this.collapse.expand();
            }
        }
    }
}
