import {
    ce,
    enable,
    isFunction,
    Checkbox,
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
const ENABLE_CHECK_CLASS = 'enable-check';
const CONTROLS_CLASS = 'controls';
const DEFAULT_BUTTON_CLASS = 'btn';
const UPDATE_BUTTON_CLASS = 'update-btn';
const DEL_BUTTON_CLASS = 'delete-btn';
const DEFAULT_ICON_CLASS = 'icon';
const UPDATE_ICON_CLASS = 'update-icon';
const DEL_ICON_CLASS = 'delete-icon';

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
    onUpdate: null,
    onEnable: null,
    onRemove: null,
};

/**
 * ImportTransactionForm component
 */
export class ImportTransactionItem extends ImportTransactionBase {
    static create(props) {
        return new ImportTransactionItem(props);
    }

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
        };

        this.init();
    }

    init() {
        // Row enable checkbox
        this.enableCheck = Checkbox.create({
            className: ENABLE_CHECK_CLASS,
            onChange: () => this.onRowChecked(),
        });

        this.trTypeTitle = ce('span', { className: TYPE_CLASS });
        this.trTypeField = Field.create({
            title: 'Type',
            content: this.trTypeTitle,
            className: TYPE_FIELD_CLASS,
        });

        this.accountTitle = ce('span', { className: ACCOUNT_CLASS });
        this.accountField = Field.create({
            title: 'Account',
            content: this.accountTitle,
            className: ACCOUNT_FIELD_CLASS,
        });

        this.personTitle = ce('span', { className: PERSON_CLASS });
        this.personField = Field.create({
            title: 'Person',
            content: this.personTitle,
            className: PERSON_FIELD_CLASS,
        });

        this.srcAmountTitle = ce('span', { className: AMOUNT_CLASS });
        this.srcAmountField = Field.create({
            title: 'Amount',
            content: this.srcAmountTitle,
            className: AMOUNT_FIELD_CLASS,
        });

        this.destAmountTitle = ce('span', { className: AMOUNT_CLASS });
        this.destAmountField = Field.create({
            title: 'Destination amount',
            content: this.destAmountTitle,
            className: AMOUNT_FIELD_CLASS,
        });

        this.dateTitle = ce('span', { className: DATE_CLASS });
        this.dateField = Field.create({
            title: 'Date',
            content: this.dateTitle,
            className: DATE_FIELD_CLASS,
        });

        this.commentTitle = ce('span', { className: COMMENT_CLASS });
        this.commentField = Field.create({
            title: 'Comment',
            content: this.commentTitle,
            className: COMMENT_FIELD_CLASS,
        });

        // Update button
        this.updateBtn = ce(
            'button',
            { className: `${DEFAULT_BUTTON_CLASS} ${UPDATE_BUTTON_CLASS}`, type: 'button' },
            window.app.createIcon('update', `${DEFAULT_ICON_CLASS} ${UPDATE_ICON_CLASS}`),
            { click: () => this.onUpdate() },
        );
        // Delete button
        this.delBtn = ce(
            'button',
            { className: `${DEFAULT_BUTTON_CLASS} ${DEL_BUTTON_CLASS}`, type: 'button' },
            window.app.createIcon('del', `${DEFAULT_ICON_CLASS} ${DEL_ICON_CLASS}`),
            { click: () => this.remove() },
        );

        this.topRow = window.app.createContainer(ROW_CLASS, [
            this.dateField.elem,
            this.commentField.elem,
        ]);

        this.itemContainer = window.app.createContainer(ITEM_CONTAINER_CLASS, [
            window.app.createContainer(`${COLUMN_CLASS} ${TYPE_COLUMN_CLASS}`, [
                this.trTypeField.elem,
                this.accountField.elem,
                this.personField.elem,
            ]),
            window.app.createContainer(`${COLUMN_CLASS} ${AMOUNT_COLUMN_CLASS}`, [
                this.srcAmountField.elem,
                this.destAmountField.elem,
            ]),
            window.app.createContainer(COLUMN_CLASS, [
                this.topRow,
            ]),
        ]);

        this.controls = window.app.createContainer(CONTROLS_CLASS, [
            this.updateBtn,
            this.delBtn,
        ]);

        this.mainContainer = window.app.createContainer(MAIN_CONTENT_CLASS, [
            this.enableCheck.elem,
            this.itemContainer,
            this.controls,
        ]);

        this.initContainer(CONTAINER_CLASS, [this.mainContainer]);

        this.render();
    }

    /** Update button 'click' event handler */
    onUpdate() {
        if (isFunction(this.props.onUpdate)) {
            this.props.onUpdate(this);
        }
    }

    /** Render component */
    render(state = this.state) {
        if (!state) {
            throw new Error('Invalid state');
        }
        const transaction = state.transaction.state;

        const { userAccounts, persons, currency } = window.app.model;
        const isTransfer = ['transferfrom', 'transferto'].includes(transaction.type);
        const isDebt = ['debtfrom', 'debtto'].includes(transaction.type);

        enable(this.elem, transaction.enabled);

        this.enableCheck.check(transaction.enabled);

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
        const srcAmountLabel = (transaction.isDiff) ? TITLE_FIELD_SRC_AMOUNT : TITLE_FIELD_AMOUNT;
        this.srcAmountField.setTitle(srcAmountLabel);
        const srcAmount = currency.formatCurrency(transaction.sourceAmount, transaction.srcCurrId);
        this.srcAmountTitle.textContent = srcAmount;

        this.srcAmountField.elem.dataset.amount = transaction.sourceAmount;
        this.srcAmountField.elem.dataset.curr = transaction.srcCurrId;

        this.destAmountField.show(transaction.isDiff);
        const destAmount = (transaction.isDiff)
            ? currency.formatCurrency(transaction.destAmount, transaction.destCurrId)
            : '';
        this.destAmountTitle.textContent = destAmount;

        this.destAmountField.elem.dataset.amount = transaction.destAmount;
        this.destAmountField.elem.dataset.curr = transaction.destCurrId;

        // Date field
        this.dateTitle.textContent = transaction.date;

        // Comment field
        this.commentTitle.textContent = transaction.comment;
    }
}
