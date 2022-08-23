import {
    ce,
    re,
    show,
    enable,
    checkDate,
    copyObject,
    addChilds,
    removeChilds,
    formatDate,
    Component,
    Checkbox,
    DropDown,
    DecimalInput,
    InputGroup,
} from 'jezvejs';
import {
    fixFloat,
    EXPENSE,
    INCOME,
    TRANSFER,
    DEBT,
    createField,
    createContainer,
    createIcon,
} from '../../../js/app.js';
import { AccountList } from '../../../js/model/AccountList.js';
import './style.scss';

/** Fields */
const TITLE_FIELD_AMOUNT = 'Amount';
const PH_FIELD_AMOUNT = 'Amount';
const TITLE_FIELD_SRC_AMOUNT = 'Source amount';
const TITLE_FIELD_DEST_AMOUNT = 'Destination amount';
const PH_FIELD_DEST_AMOUNT = 'Destination amount';
const TITLE_FIELD_DATE = 'Date';
const PH_FIELD_DATE = 'Date';
const TITLE_FIELD_COMMENT = 'Comment';
const PH_FIELD_COMMENT = 'Comment';
const TITLE_FIELD_SRC_ACCOUNT = 'Source account';
const TITLE_FIELD_DEST_ACCOUNT = 'Destination account';
const TITLE_FIELD_PERSON = 'Person';
/** Original data table */
const TITLE_ORIGINAL_DATA = 'Original imported data';
const COL_MAIN = 'Main account';
const COL_DATE = 'Date';
const COL_COMMENT = 'Comment';
const COL_TR_AMOUNT = 'Tr. amount';
const COL_TR_CURRENCY = 'Tr. currency';
const COL_ACC_AMOUNT = 'Acc. amount';
const COL_ACC_CURRENCY = 'Acc. currency';
/** Validation messages */
const MSG_INCORRECT_AMOUNT = 'Please input correct amount';
const MSG_INCORRECT_SEC_AMOUNT = 'Please input correct second amount';
const MSG_INVALID_DATE = 'Please input correct date';

/**
 * ImportTransactionItem component
 */
export class ImportTransactionItem extends Component {
    constructor(...args) {
        super(...args);

        if (
            !this.parent
            || !this.props
            || !this.props.mainAccount
        ) {
            throw new Error('Invalid props');
        }

        this.transTypeMap = {
            expense: EXPENSE,
            income: INCOME,
            transferfrom: TRANSFER,
            transferto: TRANSFER,
            debtfrom: DEBT,
            debtto: DEBT,
        };

        const { mainAccount } = this.props;

        this.state = {
            mainAccount,
            enabled: true,
            type: 'expense',
            accountId: mainAccount.id,
            accountCurrId: mainAccount.curr_id,
            secondAccountId: 0,
            secondAccountCurrId: 0,
            secondAccountVisible: false,
            currId: mainAccount.curr_id,
            isDiff: false,
            amount: '',
            secondAmount: '',
            personId: 0,
            personVisible: false,
            date: formatDate(new Date()),
            comment: '',
        };

        // Row enable checkbox
        this.enableCheck = Checkbox.create({
            className: 'enable-check',
            onChange: () => this.onRowChecked(),
        });

        this.createTypeField();
        this.createAccountField();
        this.createPersonField();
        this.createAmountField();
        this.createDestAmountField();

        // Date field
        this.dateInp = ce('input', {
            className: 'stretch-input',
            type: 'text',
            name: 'date[]',
            placeholder: PH_FIELD_DATE,
            autocomplete: 'off',
        }, null, { input: () => this.onDateInput() });
        this.dateField = createField(TITLE_FIELD_DATE, this.dateInp, 'date-field');
        // Comment field
        this.commInp = ce('input', {
            className: 'stretch-input',
            type: 'text',
            name: 'comment[]',
            placeholder: PH_FIELD_COMMENT,
            autocomplete: 'off',
        }, null, { input: () => this.onCommentInput() });
        this.commentField = createField(TITLE_FIELD_COMMENT, this.commInp, 'comment-field');
        // Delete button
        this.delBtn = ce(
            'button',
            { className: 'btn delete-btn', type: 'button' },
            createIcon('del', 'icon delete-icon'),
            { click: () => this.remove() },
        );
        // Toggle expand/collapse
        this.toggleExtBtn = ce(
            'button',
            { className: 'btn toggle-btn', type: 'button' },
            createIcon('toggle-ext', 'icon toggle-icon'),
            { click: () => this.toggleCollapse() },
        );
        show(this.toggleExtBtn, false);

        this.topRow = createContainer('form-row', [
            this.dateField,
            this.commentField,
        ]);

        this.formContainer = createContainer('form-container', [
            createContainer('form-rows type-col', [
                this.trTypeField,
                this.destAccountField,
                this.personField,
            ]),
            createContainer('form-rows amount-col', [
                this.amountField,
                this.destAmountField,
            ]),
            createContainer('form-rows', [
                this.topRow,
            ]),
        ]);

        this.mainContainer = createContainer('main-content', [
            this.enableCheck.elem,
            this.formContainer,
            createContainer('row-container controls', [
                this.delBtn,
                this.toggleExtBtn,
            ]),
        ]);
        this.feedbackElem = ce('div', { className: 'invalid-feedback' });
        show(this.feedbackElem, false);
        this.extendedContainer = createContainer('extended-content');

        this.elem = createContainer('import-item', [
            this.mainContainer,
            this.feedbackElem,
            this.extendedContainer,
        ]);

        this.data = null;
        if (this.props.originalData) {
            this.setOriginal(this.props.originalData);
            this.setExtendedContent(
                this.createOrigDataContainer(this.props.originalData, mainAccount),
            );
        }

        this.render();
    }

    /**
     * Create new ImportTransactionItem from specified element
     */
    static create(props) {
        return new ImportTransactionItem(props);
    }

    /** Create transaction type field */
    createTypeField() {
        const transferDisabled = window.app.model.accounts.length < 2;
        const debtDisabled = !window.app.model.persons.length;
        const typeItems = [
            { id: 'expense', title: 'Expense' },
            { id: 'income', title: 'Income' },
            { id: 'transferfrom', title: 'Transfer from', disabled: transferDisabled },
            { id: 'transferto', title: 'Transfer to', disabled: transferDisabled },
            { id: 'debtfrom', title: 'Debt from', disabled: debtDisabled },
            { id: 'debtto', title: 'Debt to', disabled: debtDisabled },
        ];

        const selectElem = ce('select');
        this.trTypeField = createField('Type', selectElem);

        this.typeDropDown = DropDown.create({
            elem: selectElem,
            onchange: (type) => this.onTrTypeChanged(type),
        });
        typeItems.forEach((typeItem) => {
            this.typeDropDown.addItem(typeItem);
            if (typeItem.disabled) {
                this.typeDropDown.enableItem(typeItem.id, false);
            }
        });
    }

    /** Create destination(second) account field */
    createAccountField() {
        const selectElem = ce('select');
        this.destAccountField = createField(TITLE_FIELD_DEST_ACCOUNT, selectElem);
        this.destAccountLabel = this.destAccountField.querySelector('label');

        this.destAccDropDown = DropDown.create({
            elem: selectElem,
            disabled: true,
            onchange: (account) => this.onDestChanged(account),
        });
        window.app.view.initAccountsList(this.destAccDropDown);
    }

    /** Create person field */
    createPersonField() {
        const selectElem = ce('select');
        this.personField = createField(TITLE_FIELD_PERSON, selectElem);

        this.personDropDown = DropDown.create({
            elem: selectElem,
            disabled: true,
            onchange: (person) => this.onPersonChanged(person),
        });
        window.app.view.initPersonsList(this.personDropDown);
    }

    /** Create amount field */
    createAmountField() {
        this.amountInp = ce('input', {
            className: 'input-group__input stretch-input amount-input',
            type: 'text',
            name: 'amount[]',
            placeholder: PH_FIELD_AMOUNT,
            autocomplete: 'off',
        });
        this.amountDecimalInput = DecimalInput.create({
            elem: this.amountInp,
            digits: 2,
            oninput: () => this.onAmountInput(),
        });

        this.currencySign = ce('div', { className: 'input-group__btn-title' });
        this.currencyBtn = ce('button', {
            type: 'button',
            className: 'input-group__btn',
            tabIndex: -1,
        }, this.currencySign);

        this.currencyDropDown = DropDown.create({
            elem: this.currencySign,
            listAttach: true,
            onchange: (currency) => this.onCurrChanged(currency),
        });
        window.app.view.initCurrencyList(this.currencyDropDown);

        this.amountGroup = InputGroup.create({
            children: [this.amountInp, this.currencyBtn],
        });
        this.amountField = createField(TITLE_FIELD_AMOUNT, this.amountGroup.elem, 'amount-field');
    }

    /** Create destination amount field */
    createDestAmountField() {
        this.destAmountInp = ce('input', {
            className: 'input-group__input stretch-input amount-input',
            type: 'text',
            name: 'dest_amount[]',
            disabled: true,
            placeholder: PH_FIELD_DEST_AMOUNT,
            autocomplete: 'off',
        });
        this.destAmountDecimalInput = DecimalInput.create({
            elem: this.destAmountInp,
            digits: 2,
            oninput: () => this.onDestAmountInput(),
        });

        this.destCurrencySign = ce('div', { className: 'input-group__btn-title' });
        this.destCurrencyBtn = ce('button', {
            type: 'button',
            className: 'input-group__btn',
            tabIndex: -1,
        }, this.destCurrencySign);

        this.destCurrencyDropDown = DropDown.create({
            elem: this.destCurrencySign,
            listAttach: true,
            onchange: (currency) => this.onCurrChanged(currency),
        });
        window.app.view.initCurrencyList(this.destCurrencyDropDown);

        this.destAmountGroup = InputGroup.create({
            children: [this.destAmountInp, this.destCurrencyBtn],
        });

        this.destAmountField = createField(
            TITLE_FIELD_DEST_AMOUNT,
            this.destAmountGroup.elem,
            'amount-field',
        );
        show(this.destAmountField, false);
        this.destAmountLabel = this.destAmountField.querySelector('label');
    }

    /** Create static data value element */
    createDataValue(title, value, extraClass) {
        const elemClasses = ['data-value'];

        if (typeof extraClass === 'string' && extraClass.length > 0) {
            elemClasses.push(extraClass);
        }

        return ce('div', { className: elemClasses.join(' ') }, [
            ce('label', { textContent: title }),
            ce('div', { textContent: value }),
        ]);
    }

    /**
     * Create set of static data values for original transaction data
     * @param {Object} data - import transaction object
     */
    createOrigDataContainer(data, mainAccount) {
        if (!data || !mainAccount) {
            throw new Error('Invalid data');
        }

        const dateFmt = formatDate(new Date(data.date));

        return createContainer('orig-data', [
            ce('h3', { textContent: TITLE_ORIGINAL_DATA }),
            createContainer('orig-data-table', [
                this.createDataValue(COL_MAIN, mainAccount.name),
                this.createDataValue(COL_DATE, dateFmt),
                this.createDataValue(COL_TR_AMOUNT, data.transactionAmount),
                this.createDataValue(COL_TR_CURRENCY, data.transactionCurrency),
                this.createDataValue(COL_ACC_AMOUNT, data.accountAmount),
                this.createDataValue(COL_ACC_CURRENCY, data.accountCurrency),
                this.createDataValue(COL_COMMENT, data.comment, 'comment-value'),
            ]),
        ]);
    }

    /**
     * Setup extended content of item
     * If value is null content is removed and toggle button hidden
     * @param {Element|null} content - value to set extended content
     */
    setExtendedContent(content) {
        removeChilds(this.extendedContainer);

        if (content) {
            addChilds(this.extendedContainer, content);
        } else {
            this.elem.classList.remove('import-item_expanded');
        }

        show(this.toggleExtBtn, content);
    }

    /** Apply import data to component */
    setOriginal(data) {
        if (!data) {
            throw new Error('Invalid data');
        }

        if (data !== this.data) {
            this.data = copyObject(data);
            this.data.origAccount = { ...this.state.mainAccount };
        }
        this.data.mainAccount = this.state.mainAccount.id;

        if (this.data.accountCurrencyId !== this.state.mainAccount.curr_id) {
            throw new Error('Currency must be the same as main account');
        }

        const amount = parseFloat(fixFloat(data.accountAmount));
        if (Number.isNaN(amount) || amount === 0) {
            throw new Error('Invalid account amount value');
        }
        const trAmount = parseFloat(fixFloat(data.transactionAmount));
        if (Number.isNaN(trAmount) || trAmount === 0) {
            throw new Error('Invalid transaction amount value');
        }

        if (amount > 0) {
            this.invertTransactionType();
        }

        this.setAmount(Math.abs(amount));
        if (this.data.transactionCurrencyId !== this.data.accountCurrencyId) {
            this.setCurrency(this.data.transactionCurrencyId);
            this.setSecondAmount(Math.abs(trAmount));
        }
        this.setDate(formatDate(new Date(this.data.date)));
        this.setComment(this.data.comment);
    }

    /** Restore original data */
    restoreOriginal() {
        const currentMainAccount = this.data.mainAccount;

        this.setTransactionType('expense');
        this.setMainAccount(this.data.origAccount.id);
        this.setCurrency(this.data.origAccount.curr_id);
        this.setAmount(0);

        this.setOriginal(this.data);

        this.setMainAccount(currentMainAccount);
    }

    /**
     * Remove item component
     */
    remove() {
        if (!this.parent.onRemoveItem(this)) {
            return;
        }

        re(this.elem);
    }

    /** Enable checkbox 'change' event handler */
    onRowChecked() {
        const value = this.enableCheck.checked;
        this.enable(value);
        this.render();

        this.parent.onEnableItem(this, this.enableCheck.checked);
    }

    /** Toggle collapse/expand button 'click' event handler */
    toggleCollapse() {
        this.elem.classList.toggle('import-item_expanded');
    }

    /**
     * Enable/disable component
     * @param {boolean} val - if true then enables component, else disable
     */
    enable(value) {
        const res = !!value;

        if (this.state.enabled === res) {
            return this.state;
        }
        const state = copyObject(this.state);
        state.enabled = res;

        this.state = state;
        return state;
    }

    /** Return component enabled status */
    isEnabled() {
        return this.state.enabled;
    }

    /** Main account of transaction select 'change' event handler */
    onMainAccountChanged(value) {
        this.setMainAccount(value);
        this.render();
    }

    /**
     * Return for specified state first available user account different from main account
     * @param {Object} state - state object
     */
    getFirstAvailAccount(state) {
        const userAccountsData = window.app.model.accounts
            .getUserAccounts(this.state.mainAccount.owner_id);
        const userAccounts = new AccountList(userAccountsData);
        const visibleAccounts = userAccounts.getVisible();
        let [res] = visibleAccounts;

        if (res.id === state.accountId) {
            [, res] = visibleAccounts;
        }

        return res;
    }

    /**
     * Return next available user account different from specified
     * @param {number} accountId - account id to find next account for
     */
    getNextAccount(accountId) {
        const userAccountsData = window.app.model.accounts
            .getUserAccounts(this.state.mainAccount.owner_id);
        const userAccounts = new AccountList(userAccountsData);
        const visibleAccountsData = userAccounts.getVisible();
        const userVisible = new AccountList(visibleAccountsData);

        if (!userVisible.length) {
            return null;
        }

        if (!accountId) {
            return userVisible.getItemByIndex(0);
        }

        if (userVisible.length < 2) {
            return null;
        }

        const ind = userVisible.getItemIndex(accountId);
        if (ind === -1 || ind === null) {
            return null;
        }

        const resInd = (ind === userVisible.length - 1) ? 0 : ind + 1;
        const res = userVisible.getItemByIndex(resInd);

        return res;
    }

    /** Transaction type select 'change' event handler */
    onTrTypeChanged(type) {
        this.setTransactionType(type.id);
        this.clearInvalid();
        this.render();
    }

    /** Destination account select 'change' event handler */
    onDestChanged(account) {
        this.setSecondAccount(account.id);
        this.clearInvalid();
        this.render();
    }

    /** Synchronize options of destination account select */
    syncDestAccountSelect(state) {
        const accountItems = this.destAccDropDown.getVisibleItems();
        accountItems.forEach((accountItem) => {
            const isMainAccount = accountItem.id === state.accountId;
            this.destAccDropDown.enableItem(accountItem.id, !isMainAccount);
        });
    }

    /** Person select 'change' event handler */
    onPersonChanged(person) {
        this.setPerson(person.id);
        this.clearInvalid();
        this.render();
    }

    /** Amount field 'input' event handler */
    onAmountInput() {
        const { value } = this.amountInp;
        this.setAmount(value);
        this.clearInvalid();
        this.render();
    }

    /** Destination amount field 'input' event handler */
    onDestAmountInput() {
        const { value } = this.destAmountInp;
        this.setSecondAmount(value);
        this.clearInvalid();
        this.render();
    }

    /** Currency select 'change' event handler */
    onCurrChanged(currency) {
        this.setCurrency(currency.id);
        this.clearInvalid();
        this.render();
    }

    /** Date field 'input' event handler */
    onDateInput() {
        const { value } = this.dateInp;
        this.setDate(value);
        this.clearInvalid();
        this.render();
    }

    /** Comment field 'input' event handler */
    onCommentInput() {
        const { value } = this.commInp;
        this.setComment(value);
        this.clearInvalid();
        this.render();
    }

    /** Set type of transaction */
    setTransactionType(value) {
        if (typeof value !== 'string' || !(value in this.transTypeMap)) {
            throw new Error('Invalid transaction type');
        }

        if (this.state.type === value) {
            return this.state;
        }
        const state = copyObject(this.state);

        if (value === 'expense' || value === 'income') {
            state.personId = 0;
            state.personVisible = false;
            state.secondAccountId = 0;
            state.secondAccountVisible = false;

            if (!state.isDiff
                || (value === 'expense' && state.type !== 'income')
                || (value === 'income' && state.type !== 'expense')) {
                state.currId = state.accountCurrId;
            }
        } else if (value === 'transferfrom' || value === 'transferto') {
            state.personId = 0;
            state.personVisible = false;
            state.secondAccountVisible = true;
            if (!state.secondAccountId) {
                const secondAccount = this.getFirstAvailAccount(state);
                if (!secondAccount) {
                    throw new Error('Account not found');
                }
                state.secondAccountId = secondAccount.id;
                state.secondAccountCurrId = secondAccount.curr_id;
            }
            state.currId = state.secondAccountCurrId;
        } else if (value === 'debtfrom' || value === 'debtto') {
            state.secondAccountId = 0;
            state.secondAccountVisible = false;
            state.personVisible = true;
            if (!state.personId) {
                const person = window.app.model.persons.getItemByIndex(0);
                if (!person) {
                    throw new Error('Person not found');
                }
                state.personId = person.id;
            }
            state.currId = state.accountCurrId;
        }
        state.isDiff = state.currId !== state.accountCurrId;
        if (!state.isDiff) {
            state.secondAmount = '';
        }
        state.type = value;

        this.state = state;
        return state;
    }

    /** Invert type of transaction */
    invertTransactionType() {
        const trType = this.state.type;

        let typeValue;
        if (trType === 'expense') {
            typeValue = 'income';
        } else if (trType === 'income') {
            typeValue = 'expense';
        } else if (trType === 'transferfrom') {
            typeValue = 'transferto';
        } else if (trType === 'transferto') {
            typeValue = 'transferfrom';
        } else if (trType === 'debtto') {
            typeValue = 'debtfrom';
        } else if (trType === 'debtfrom') {
            typeValue = 'debtto';
        }

        return this.setTransactionType(typeValue);
    }

    /** Set currency */
    setCurrency(value) {
        if (typeof value === 'undefined') {
            throw new Error('Invalid currency value');
        }
        const selectedCurr = parseInt(value, 10);
        if (Number.isNaN(selectedCurr)) {
            throw new Error('Invalid currency selected');
        }

        if (this.state.currId === selectedCurr) {
            return this.state;
        }
        const state = copyObject(this.state);

        state.currId = selectedCurr;
        state.isDiff = state.accountCurrId !== state.currId;
        if (!state.isDiff) {
            state.secondAmount = '';
        }

        this.state = state;
        return state;
    }

    /** Set main account */
    setMainAccount(value) {
        const account = window.app.model.accounts.getItem(value);
        if (!account) {
            throw new Error('Account not found');
        }

        if (this.state.accountId === account.id) {
            return this.state;
        }
        const state = {
            ...this.state,
            mainAccount: account,
            accountId: account.id,
            accountCurrId: account.curr_id,
        };

        if (this.data) {
            this.data.mainAccount = account.id;
        }

        if (state.type === 'expense' || state.type === 'income') {
            if (!state.isDiff) {
                state.currId = state.accountCurrId;
            }
        } else if (state.type === 'transferfrom' || state.type === 'transferto') {
            if (state.secondAccountId === state.accountId) {
                const secondAccount = this.getNextAccount(state.secondAccountId);
                state.secondAccountId = secondAccount.id;
                state.secondAccountCurrId = secondAccount.curr_id;
            }
            state.currId = state.secondAccountCurrId;
        } else if (state.type === 'debtfrom' || state.type === 'debtto') {
            state.currId = state.accountCurrId;
        }
        state.isDiff = state.accountCurrId !== state.currId;
        if (!state.isDiff) {
            state.secondAmount = '';
        }

        this.state = state;
        return state;
    }

    /** Set second account */
    setSecondAccount(value) {
        const account = window.app.model.accounts.getItem(value);
        if (!account) {
            throw new Error('Account not found');
        }

        if (this.state.secondAccountId === account.id) {
            return this.state;
        }

        // Can't set second account same as main account
        if (this.state.mainAccount.id === account.id) {
            throw new Error('Can\'t set second account same as main account');
        }

        const state = {
            ...this.state,
            secondAccountId: account.id,
            secondAccountCurrId: account.curr_id,
            currId: account.curr_id,
        };
        state.isDiff = state.accountCurrId !== state.currId;
        if (!state.isDiff) {
            state.secondAmount = '';
        }

        this.state = state;

        return state;
    }

    /** Set person */
    setPerson(value) {
        const person = window.app.model.persons.getItem(value);
        if (!person) {
            throw new Error('Person not found');
        }

        if (this.state.personId === person.id) {
            return this.state;
        }
        const state = copyObject(this.state);
        state.personId = person.id;

        this.state = state;

        return state;
    }

    /** Set source amount */
    setAmount(value) {
        if (typeof value === 'undefined') {
            throw new Error('Invalid amount value');
        }
        const res = parseFloat(fixFloat(value));
        if (Number.isNaN(res)) {
            throw new Error('Invalid amount value');
        }

        if (this.state.amount === value) {
            return this.state;
        }
        const state = copyObject(this.state);
        state.amount = value;

        this.state = state;

        return state;
    }

    /** Set second amount */
    setSecondAmount(value) {
        if (typeof value === 'undefined') {
            throw new Error('Invalid amount value');
        }
        const res = parseFloat(fixFloat(value));
        if (Number.isNaN(res)) {
            throw new Error('Invalid amount value');
        }

        if (!this.state.isDiff
            || this.state.secondAmount === value) {
            return this.state;
        }
        const state = copyObject(this.state);
        state.secondAmount = value;

        this.state = state;

        return state;
    }

    /** Set date */
    setDate(value) {
        if (typeof value === 'undefined') {
            throw new Error('Invalid date value');
        }

        if (this.state.date === value) {
            return this.state;
        }
        const state = copyObject(this.state);
        state.date = value;

        this.state = state;

        return state;
    }

    /** Set comment */
    setComment(value) {
        if (typeof value !== 'string') {
            throw new Error('Invalid comment value');
        }

        if (this.state.comment === value) {
            return this.state;
        }
        const state = copyObject(this.state);
        state.comment = value;

        this.state = state;

        return state;
    }

    /** Return original data object */
    getOriginal() {
        return this.data;
    }

    /** Validate transaction object */
    setFeedback(value) {
        if (typeof value === 'string' && value.length > 0) {
            this.feedbackElem.textContent = value;
            show(this.feedbackElem, true);
        } else {
            this.feedbackElem.textContent = '';
            show(this.feedbackElem, false);
        }
    }

    /** Remove all invalidated marks */
    clearInvalid() {
        this.parent.clearBlockValidation(this.amountField);
        this.parent.clearBlockValidation(this.destAmountField);
        this.parent.clearBlockValidation(this.dateField);
        this.setFeedback();
    }

    /** Validate transaction object */
    validate() {
        const { state } = this;

        const amountVal = parseFloat(fixFloat(state.amount));
        if (Number.isNaN(amountVal) || amountVal <= 0) {
            this.parent.invalidateBlock(this.amountField);
            this.setFeedback(MSG_INCORRECT_AMOUNT);
            return false;
        }

        if (state.isDiff) {
            const secondAmountVal = parseFloat(fixFloat(state.secondAmount));
            if (Number.isNaN(secondAmountVal) || secondAmountVal <= 0) {
                this.parent.invalidateBlock(this.destAmountField);
                this.setFeedback(MSG_INCORRECT_SEC_AMOUNT);
                return false;
            }
        }

        if (!checkDate(state.date)) {
            this.parent.invalidateBlock(this.dateField);
            this.setFeedback(MSG_INVALID_DATE);
            return false;
        }

        return true;
    }

    /** Return date string */
    getDate() {
        return this.state.date;
    }

    /** Return transaction object */
    getData() {
        const { state } = this;

        const secondAcc = window.app.model.accounts.getItem(state.secondAccountId);
        const person = window.app.model.persons.getItem(state.personId);
        const amountVal = parseFloat(fixFloat(state.amount));
        const secondAmountVal = parseFloat(fixFloat(state.secondAmount));
        const selectedCurr = parseInt(state.currId, 10);
        const res = {};

        if (!secondAcc && (state.type === 'transferfrom' || state.type === 'transferto')) {
            throw new Error('Invalid transaction: Second account not set');
        }
        if (!person && (state.type === 'debtfrom' || state.type === 'debtto')) {
            throw new Error('Invalid transaction: Person not set');
        }

        if (state.type === 'expense') {
            res.type = EXPENSE;
            res.src_id = state.accountId;
            res.dest_id = 0;
            res.src_curr = state.accountCurrId;
            res.dest_curr = selectedCurr;
            res.src_amount = amountVal;
            res.dest_amount = (state.isDiff) ? secondAmountVal : amountVal;
        } else if (state.type === 'income') {
            res.type = INCOME;
            res.src_id = 0;
            res.dest_id = state.accountId;
            res.src_curr = selectedCurr;
            res.dest_curr = state.accountCurrId;
            res.src_amount = (state.isDiff) ? secondAmountVal : amountVal;
            res.dest_amount = amountVal;
        } else if (state.type === 'transferfrom') {
            res.type = TRANSFER;
            res.src_id = state.accountId;
            res.dest_id = secondAcc.id;
            res.src_curr = state.accountCurrId;
            res.dest_curr = secondAcc.curr_id;
            res.src_amount = amountVal;
            res.dest_amount = (state.isDiff) ? secondAmountVal : amountVal;
        } else if (state.type === 'transferto') {
            res.type = TRANSFER;
            res.src_id = secondAcc.id;
            res.dest_id = state.accountId;
            res.src_curr = secondAcc.curr_id;
            res.dest_curr = state.accountCurrId;
            res.src_amount = (state.isDiff) ? secondAmountVal : amountVal;
            res.dest_amount = amountVal;
        } else if (state.type === 'debtfrom' || state.type === 'debtto') {
            res.type = DEBT;
            res.op = (state.type === 'debtto') ? 1 : 2;
            res.person_id = person.id;
            res.acc_id = state.accountId;
            res.src_curr = state.accountCurrId;
            res.dest_curr = state.accountCurrId;
            res.src_amount = amountVal;
            res.dest_amount = amountVal;
        }

        res.date = state.date;
        res.comment = state.comment;

        return res;
    }

    renderCurrency(elem, ddown, currencyId) {
        const signElem = elem;
        if (!signElem) {
            return;
        }

        const curr = window.app.model.currency.getItem(currencyId);
        if (!curr) {
            return;
        }

        signElem.textContent = curr.sign;
        ddown?.selectItem(currencyId);
    }

    /** Render component */
    render() {
        const { state } = this;

        if (!state) {
            throw new Error('Invalid state');
        }

        const isExpenseOrIncome = ['expense', 'income'].includes(state.type);
        const isTransfer = ['transferfrom', 'transferto'].includes(state.type);
        const isDebt = ['debtfrom', 'debtto'].includes(state.type);

        if (state.enabled) {
            this.elem.classList.remove('import-item_disabled');
        } else {
            this.elem.classList.add('import-item_disabled');
        }

        this.enableCheck.check(state.enabled);

        // Type field
        this.typeDropDown.enable(state.enabled);
        this.typeDropDown.selectItem(state.type);

        // Amount field
        enable(this.amountInp, state.enabled);
        this.currencyDropDown.enable(state.enabled && isExpenseOrIncome && !state.isDiff);
        enable(this.currencyBtn, state.enabled && isExpenseOrIncome && !state.isDiff);
        this.amountInp.value = state.amount;
        this.renderCurrency(this.currencySign, this.currencyDropDown, state.accountCurrId);

        // Destination amount field
        enable(this.destAmountInp, state.enabled && state.isDiff);
        this.destCurrencyDropDown.enable(state.enabled && isExpenseOrIncome && state.isDiff);
        enable(this.destCurrencyBtn, state.enabled && isExpenseOrIncome && state.isDiff);
        this.renderCurrency(this.destCurrencySign, this.destCurrencyDropDown, state.currId);

        // Second account field
        this.destAccDropDown.enable(state.enabled && isTransfer);
        this.syncDestAccountSelect(state);
        if (state.secondAccountId) {
            this.destAccDropDown.selectItem(state.secondAccountId);
        }
        show(this.destAccountField, state.secondAccountVisible);
        if (state.secondAccountVisible) {
            const accountLabel = (state.type === 'transferto')
                ? TITLE_FIELD_SRC_ACCOUNT
                : TITLE_FIELD_DEST_ACCOUNT;

            this.destAccountLabel.textContent = accountLabel;
        }

        // Second amount field
        this.destAmountInp.value = state.secondAmount;
        show(this.destAmountField, state.isDiff);
        if (state.isDiff) {
            const amountLabel = (state.type === 'transferto')
                ? TITLE_FIELD_SRC_AMOUNT
                : TITLE_FIELD_DEST_AMOUNT;

            this.destAmountInp.placeholder = amountLabel;
            this.destAmountLabel.textContent = amountLabel;
        }

        // Person field
        this.personDropDown.enable(state.enabled && isDebt);
        if (state.personId) {
            this.personDropDown.selectItem(state.personId);
        }
        show(this.personField, state.personVisible);

        // Date filed
        enable(this.dateInp, state.enabled);
        this.dateInp.value = state.date;

        // Commend field
        enable(this.commInp, state.enabled);
        this.commInp.value = state.comment;
    }
}
