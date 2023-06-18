import { enable, Component } from 'jezvejs';
import { Checkbox } from 'jezvejs/Checkbox';
import { Collapsible } from 'jezvejs/Collapsible';
import { MenuButton } from 'jezvejs/MenuButton';

import { __ } from '../../../../utils/utils.js';
import { App } from '../../../../Application/App.js';
import { ImportTransaction, typeNames } from '../../../../Models/ImportTransaction.js';
import { Field } from '../../../../Components/Field/Field.js';
import { ToggleButton } from '../../../../Components/ToggleButton/ToggleButton.js';
import { OriginalImportData } from '../OriginalData/OriginalImportData.js';
import { SimilarTransactionInfo } from '../SimilarTransactionInfo/SimilarTransactionInfo.js';
import './ImportTransactionItem.scss';

/** CSS classes */
const CONTAINER_CLASS = 'import-item';
const ITEM_CONTAINER_CLASS = 'item-container';
const COLUMN_CLASS = 'item-column';
const AMOUNT_COLUMN_CLASS = 'amount-col';
const DATE_COLUMN_CLASS = 'date-col';
const TYPE_COLUMN_CLASS = 'type-col';
const COMMENT_COLUMN_CLASS = 'comment-col';
/* Fields */
const TYPE_FIELD_CLASS = 'type-field';
const ACCOUNT_FIELD_CLASS = 'account-field';
const PERSON_FIELD_CLASS = 'person-field';
const SRC_AMOUNT_FIELD_CLASS = 'amount-field src-amount-field';
const DEST_AMOUNT_FIELD_CLASS = 'amount-field dest-amount-field';
const DATE_FIELD_CLASS = 'date-field';
const CATEGORY_FIELD_CLASS = 'category-field';
const COMMENT_FIELD_CLASS = 'comment-field';
/* Controls */
const CONTROLS_CLASS = 'controls';
/* Select controls */
const SELECT_CONTROLS_CLASS = 'select-controls';
const SELECTED_CLASS = 'import-item_selected';
/* Sort state */
const SORT_CLASS = 'import-item_sort';

/**
 * Import transaction form component
 */
export class ImportTransactionItem extends Component {
    constructor(props) {
        super(props);

        if (!this.props?.transaction?.mainAccount) {
            throw new Error('Invalid props');
        }

        this.state = {
            ...this.props,
            transaction: new ImportTransaction(this.props.transaction),
        };

        this.init();
    }

    get id() {
        return this.state.transaction.id;
    }

    init() {
        const { createContainer } = App;

        const fields = [
            [__('transactions.type'), TYPE_FIELD_CLASS],
            [__('transactions.debtAccount'), ACCOUNT_FIELD_CLASS],
            [__('transactions.person'), PERSON_FIELD_CLASS],
            [__('transactions.amount'), SRC_AMOUNT_FIELD_CLASS],
            [__('transactions.destAmount'), DEST_AMOUNT_FIELD_CLASS],
            [__('transactions.date'), DATE_FIELD_CLASS],
            [__('transactions.category'), CATEGORY_FIELD_CLASS],
            [__('transactions.comment'), COMMENT_FIELD_CLASS],
        ];

        [
            this.trTypeField,
            this.accountField,
            this.personField,
            this.srcAmountField,
            this.destAmountField,
            this.dateField,
            this.categoryField,
            this.commentField,
        ] = fields.map(([title, className]) => Field.create({ title, className }));

        this.itemContainer = createContainer(ITEM_CONTAINER_CLASS, [
            createContainer([COLUMN_CLASS, TYPE_COLUMN_CLASS], [
                this.trTypeField.elem,
                this.accountField.elem,
                this.personField.elem,
            ]),
            createContainer([COLUMN_CLASS, AMOUNT_COLUMN_CLASS], [
                this.srcAmountField.elem,
                this.destAmountField.elem,
            ]),
            createContainer([COLUMN_CLASS, DATE_COLUMN_CLASS], [
                this.dateField.elem,
                this.categoryField.elem,
            ]),
            createContainer([COLUMN_CLASS, COMMENT_COLUMN_CLASS], [
                this.commentField.elem,
            ]),
        ]);

        this.menuButton = MenuButton.create();
        this.toggleExtBtn = ToggleButton.create();
        this.controls = createContainer(CONTROLS_CLASS, [
            this.menuButton.elem,
            this.toggleExtBtn.elem,
        ]);

        this.createSelectControls();

        this.collapse = Collapsible.create({
            toggleOnClick: false,
            className: CONTAINER_CLASS,
            header: [
                this.selectControls,
                this.itemContainer,
                this.controls,
            ],
        });
        this.elem = this.collapse.elem;

        this.render(this.state);
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
    }

    renderSelectControls(state, prevState = {}) {
        const { transaction } = state;
        const prevTransaction = prevState?.transaction;
        const { listMode, selected } = transaction;
        if (
            listMode === prevTransaction?.listMode
            && selected === prevTransaction?.selected
        ) {
            return;
        }

        const selectMode = listMode === 'select';
        const isSelected = selectMode && !!selected;
        this.elem.classList.toggle(SELECTED_CLASS, isSelected);
        this.checkbox?.check(isSelected);
        if (this.checkbox) {
            this.checkbox.input.tabIndex = (selectMode) ? 0 : -1;
        }
    }

    renderContainer(state, prevState) {
        const originalData = state.transaction.originalData ?? null;
        const prevOriginalData = prevState?.transaction?.originalData;
        if (originalData === prevOriginalData) {
            return;
        }

        this.toggleExtBtn.show(!!originalData);
        if (!originalData) {
            this.collapse.setContent(null);
            return;
        }

        const origDataContainer = OriginalImportData.create({
            ...originalData,
        });

        const content = [origDataContainer.elem];

        const { similarTransaction } = state.transaction;
        if (similarTransaction) {
            const info = SimilarTransactionInfo.create(similarTransaction);
            content.push(info.elem);
        }

        this.collapse.setContent(content);
    }

    /** Render component */
    render(state, prevState = {}) {
        if (!state) {
            throw new Error('Invalid state');
        }

        this.renderContainer(state, prevState);
        this.elem.setAttribute('data-id', state.transaction.id);

        const { transaction } = state;
        const isDiff = transaction.isDiff();
        const { userAccounts, persons, currency } = App.model;
        const isTransfer = ['transfer_out', 'transfer_in'].includes(transaction.type);
        const isDebt = ['debt_out', 'debt_in'].includes(transaction.type);

        enable(this.elem, transaction.enabled);

        this.elem.classList.toggle(SORT_CLASS, transaction.listMode === 'sort');

        // Select controls
        this.renderSelectControls(state, prevState);

        // Type field
        if (!(transaction.type in typeNames)) {
            throw new Error('Invalid transaction type');
        }
        this.trTypeField.setContent(typeNames[transaction.type]);
        this.trTypeField.elem.dataset.type = transaction.type;

        // Account field
        this.accountField.show(isTransfer);
        if (isTransfer) {
            const isTransferOut = transaction.type === 'transfer_out';
            const accountId = (isTransferOut)
                ? transaction.destAccountId
                : transaction.sourceAccountId;
            const account = userAccounts.getItem(accountId);
            this.accountField.setContent(account.name);

            const accountTitle = (isTransferOut)
                ? __('transactions.destAccount')
                : __('transactions.sourceAccount');
            this.accountField.setTitle(accountTitle);
        }
        // Person field
        this.personField.show(isDebt);
        if (isDebt) {
            const person = persons.getItem(transaction.personId);
            this.personField.setContent(person.name);
        }

        // Amount fields
        const srcAmountLabel = (isDiff) ? __('transactions.sourceAmount') : __('transactions.amount');
        this.srcAmountField.setTitle(srcAmountLabel);
        const srcAmount = currency.formatCurrency(transaction.sourceAmount, transaction.srcCurrId);
        this.srcAmountField.setContent(srcAmount);

        this.srcAmountField.elem.dataset.amount = transaction.sourceAmount;
        this.srcAmountField.elem.dataset.curr = transaction.srcCurrId;

        this.destAmountField.show(isDiff);
        const destAmount = (isDiff)
            ? currency.formatCurrency(transaction.destAmount, transaction.destCurrId)
            : '';
        this.destAmountField.setContent(destAmount);

        this.destAmountField.elem.dataset.amount = transaction.destAmount;
        this.destAmountField.elem.dataset.curr = transaction.destCurrId;

        // Date field
        this.dateField.setContent(transaction.date);

        // Category field
        if (transaction.categoryId === 0) {
            this.categoryField.setContent('');
        } else {
            const { categories } = App.model;
            const category = categories.getItem(transaction.categoryId);
            if (!category) {
                throw new Error('invalid category');
            }

            this.categoryField.setContent(category.name);
        }
        this.categoryField.show(transaction.categoryId !== 0);

        // Comment field
        const hasComment = transaction.comment.length > 0;
        this.commentField.show(hasComment);
        this.commentField.setContent(transaction.comment);

        this.menuButton.show(transaction.listMode === 'list');

        if (this.collapse) {
            if (transaction.collapsed) {
                this.collapse.collapse();
            } else {
                this.collapse.expand();
            }
        }
    }
}
