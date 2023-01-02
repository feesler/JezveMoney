import {
    createElement,
    enable,
    Component,
} from 'jezvejs';
import { Checkbox } from 'jezvejs/Checkbox';
import { Collapsible } from 'jezvejs/Collapsible';
import { PopupMenuButton } from 'jezvejs/PopupMenu';
import { __ } from '../../../js/utils.js';
import { OriginalImportData } from '../OriginalData/OriginalImportData.js';
import { Field } from '../../Field/Field.js';
import './style.scss';
import { ImportTransaction, typeNames } from '../../../js/model/ImportTransaction.js';
import { SimilarTransactionInfo } from '../SimilarTransactionInfo/SimilarTransactionInfo.js';
import { ToggleButton } from '../../ToggleButton/ToggleButton.js';

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
const SRC_AMOUNT_FIELD_CLASS = 'amount-field src-amount-field';
const DEST_AMOUNT_FIELD_CLASS = 'amount-field dest-amount-field';
const DATE_FIELD_CLASS = 'date-field';
const CATEGORY_FIELD_CLASS = 'category-field';
const COMMENT_FIELD_CLASS = 'comment-field';
/* Field values */
const TYPE_CLASS = 'import-item__type';
const ACCOUNT_CLASS = 'import-item__account';
const PERSON_CLASS = 'import-item__person';
const AMOUNT_CLASS = 'import-item__amount';
const DATE_CLASS = 'import-item__date';
const CATEGORY_CLASS = 'import-item__category';
const COMMENT_CLASS = 'import-item__comment';
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
        const { createContainer } = window.app;

        this.trTypeTitle = createElement('span', { props: { className: TYPE_CLASS } });
        this.trTypeField = Field.create({
            title: __('TR_TYPE'),
            content: this.trTypeTitle,
            className: TYPE_FIELD_CLASS,
        });

        this.accountTitle = createElement('span', { props: { className: ACCOUNT_CLASS } });
        this.accountField = Field.create({
            title: __('TR_ACCOUNT'),
            content: this.accountTitle,
            className: ACCOUNT_FIELD_CLASS,
        });

        this.personTitle = createElement('span', { props: { className: PERSON_CLASS } });
        this.personField = Field.create({
            title: __('TR_PERSON'),
            content: this.personTitle,
            className: PERSON_FIELD_CLASS,
        });

        this.srcAmountTitle = createElement('span', { props: { className: AMOUNT_CLASS } });
        this.srcAmountField = Field.create({
            title: __('TR_AMOUNT'),
            content: this.srcAmountTitle,
            className: SRC_AMOUNT_FIELD_CLASS,
        });

        this.destAmountTitle = createElement('span', { props: { className: AMOUNT_CLASS } });
        this.destAmountField = Field.create({
            title: __('TR_DEST_AMOUNT'),
            content: this.destAmountTitle,
            className: DEST_AMOUNT_FIELD_CLASS,
        });

        this.dateTitle = createElement('span', { props: { className: DATE_CLASS } });
        this.dateField = Field.create({
            title: __('TR_DATE'),
            content: this.dateTitle,
            className: DATE_FIELD_CLASS,
        });

        this.categoryTitle = createElement('span', { props: { className: CATEGORY_CLASS } });
        this.categoryField = Field.create({
            title: __('TR_CATEGORY'),
            content: this.categoryTitle,
            className: CATEGORY_FIELD_CLASS,
        });

        this.commentTitle = createElement('span', { props: { className: COMMENT_CLASS } });
        this.commentField = Field.create({
            title: __('TR_COMMENT'),
            content: this.commentTitle,
            className: COMMENT_FIELD_CLASS,
        });

        this.topRow = createContainer(ROW_CLASS, [
            this.dateField.elem,
            this.categoryField.elem,
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

        this.menuContainer = PopupMenuButton.create();
        this.toggleExtBtn = ToggleButton.create();
        this.controls = createContainer(CONTROLS_CLASS, [
            this.menuContainer.elem,
            this.toggleExtBtn.elem,
        ]);

        this.createSelectControls();
        this.mainContainer = createContainer(MAIN_CONTENT_CLASS, [
            this.selectControls,
            this.itemContainer,
            this.controls,
        ]);

        this.collapse = Collapsible.create({
            toggleOnClick: false,
            className: CONTAINER_CLASS,
            header: this.mainContainer,
        });
        this.elem = this.collapse.elem;

        this.render(this.state);
    }

    createSelectControls() {
        const { createContainer } = window.app;

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
        const { userAccounts, persons, currency } = window.app.model;
        const isTransfer = ['transferfrom', 'transferto'].includes(transaction.type);
        const isDebt = ['debtfrom', 'debtto'].includes(transaction.type);

        enable(this.elem, transaction.enabled);

        this.elem.classList.toggle(SORT_CLASS, transaction.listMode === 'sort');

        // Select controls
        this.renderSelectControls(state, prevState);

        // Type field
        if (!(transaction.type in typeNames)) {
            throw new Error('Invalid transaction type');
        }
        this.trTypeTitle.textContent = typeNames[transaction.type];
        this.trTypeField.elem.dataset.type = transaction.type;

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
                ? __('TR_DEST_ACCOUNT')
                : __('TR_SRC_ACCOUNT');
            this.accountField.setTitle(accountTitle);
        }
        // Person field
        this.personField.show(isDebt);
        if (isDebt) {
            const person = persons.getItem(transaction.personId);
            this.personTitle.textContent = person.name;
        }

        // Amount fields
        const srcAmountLabel = (isDiff) ? __('TR_SRC_AMOUNT') : __('TR_AMOUNT');
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

        // Category field
        if (transaction.categoryId === 0) {
            this.categoryTitle.textContent = '';
        } else {
            const { categories } = window.app.model;
            const category = categories.getItem(transaction.categoryId);
            if (!category) {
                throw new Error('invalid category');
            }

            this.categoryTitle.textContent = category.name;
        }

        // Comment field
        this.commentTitle.textContent = transaction.comment;

        this.menuContainer.show(transaction.listMode === 'list');

        if (this.collapse) {
            if (transaction.collapsed) {
                this.collapse.collapse();
            } else {
                this.collapse.expand();
            }
        }
    }
}
