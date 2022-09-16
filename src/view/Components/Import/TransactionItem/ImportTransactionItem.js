import {
    ce,
    enable,
    isFunction,
    Checkbox,
} from 'jezvejs';
import { ImportTransactionBase, sourceTypes } from '../TransactionBase/ImportTransactionBase.js';
import { Field } from '../../Field/Field.js';
import './style.scss';

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
    enabled: true,
    type: 'expense',
    sourceAccountId: 0,
    destAccountId: 0,
    srcCurrId: 0,
    destCurrId: 0,
    isDiff: false,
    sourceAmount: 0,
    destAmount: 0,
    personId: 0,
    date: null,
    comment: '',
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

        if (!this.props?.mainAccount) {
            throw new Error('Invalid props');
        }

        this.props = {
            ...defaultProps,
            ...this.props,
        };
        if (this.props.date == null) {
            this.props.date = window.app.formatDate(new Date());
        }

        const { mainAccount } = this.props;
        const state = {
            mainAccount,
            ...this.props,
        };

        if (sourceTypes.includes(state.type)) {
            state.sourceAccountId = mainAccount.id;
            state.srcCurrId = mainAccount.curr_id;
        } else {
            state.destAccountId = mainAccount.id;
            state.destCurrId = mainAccount.curr_id;
        }

        this.state = this.checkStateCurrencies(state);

        this.data = null;
        if (this.props.originalData) {
            this.saveOriginal(this.props.originalData);
        }

        this.init();
    }

    get enabled() {
        return this.state.enabled;
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

        const { userAccounts, persons, currency } = window.app.model;
        const isTransfer = ['transferfrom', 'transferto'].includes(state.type);
        const isDebt = ['debtfrom', 'debtto'].includes(state.type);

        enable(this.elem, state.enabled);

        this.enableCheck.check(state.enabled);

        // Types field
        if (!(state.type in typeStrings)) {
            throw new Error('Invalid transaction type');
        }
        this.trTypeTitle.textContent = typeStrings[state.type];

        // Account field
        this.accountField.show(isTransfer);
        if (isTransfer) {
            const isTransferFrom = state.type === 'transferfrom';
            const accountId = (isTransferFrom) ? state.destAccountId : state.sourceAccountId;
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
            const person = persons.getItem(state.personId);
            this.personTitle.textContent = person.name;
        }

        // Amount fields
        const srcAmountLabel = (state.isDiff) ? TITLE_FIELD_SRC_AMOUNT : TITLE_FIELD_AMOUNT;
        this.srcAmountField.setTitle(srcAmountLabel);
        const srcAmount = currency.formatCurrency(state.sourceAmount, state.srcCurrId);
        this.srcAmountTitle.textContent = srcAmount;

        this.srcAmountField.elem.dataset.amount = state.sourceAmount;
        this.srcAmountField.elem.dataset.curr = state.srcCurrId;

        this.destAmountField.show(state.isDiff);
        const destAmount = (state.isDiff)
            ? currency.formatCurrency(state.destAmount, state.destCurrId)
            : '';
        this.destAmountTitle.textContent = destAmount;

        this.destAmountField.elem.dataset.amount = state.destAmount;
        this.destAmountField.elem.dataset.curr = state.destCurrId;

        // Date field
        this.dateTitle.textContent = state.date;

        // Comment field
        this.commentTitle.textContent = state.comment;
    }
}
