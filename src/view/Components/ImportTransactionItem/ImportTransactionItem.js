import {
    ce,
    re,
    show,
    enable,
    checkDate,
    copyObject,
    addChilds,
    removeChilds,
} from 'jezvejs';
import { formatDate } from 'jezvejs/DateUtils';
import { Component } from 'jezvejs/Component';
import { DropDown } from 'jezvejs/DropDown';
import {
    fixFloat,
    EXPENSE,
    INCOME,
    TRANSFER,
    DEBT,
    createField,
    createContainer,
    createIcon,
    createCheck,
} from '../../js/app.js';
import { AccountList } from '../../js/model/AccountList.js';
import './style.css';

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
            || !this.props.currencyModel
            || !this.props.accountModel
            || !this.props.personModel
        ) {
            throw new Error('Invalid props');
        }

        this.model = {
            currency: this.props.currencyModel,
            accounts: this.props.accountModel,
            persons: this.props.personModel,
            mainAccount: this.props.mainAccount,
        };

        this.transTypeMap = {
            expense: EXPENSE,
            income: INCOME,
            transferfrom: TRANSFER,
            transferto: TRANSFER,
            debtfrom: DEBT,
            debtto: DEBT,
        };

        this.state = {
            enabled: true,
            type: 'expense',
            accountId: this.model.mainAccount.id,
            accountCurrId: this.model.mainAccount.curr_id,
            secondAccountId: 0,
            secondAccountCurrId: 0,
            secondAccountVisible: false,
            currId: this.model.mainAccount.curr_id,
            isDiff: false,
            amount: '',
            secondAmount: '',
            personId: 0,
            personVisible: false,
            date: '',
            comment: '',
        };

        // Row enable checkbox
        this.enableCheck = ce('input', { type: 'checkbox' });
        this.enableCheck.addEventListener('change', () => this.onRowChecked());

        this.createCurrencyField();
        this.createTypeField();
        this.createAccountField();
        this.createPersonField();

        // Amount controls
        this.amountInp = ce('input', {
            type: 'text',
            name: 'amount[]',
            placeholder: 'Amount',
            autocomplete: 'off',
        }, null, { input: () => this.onAmountInput() });
        this.amountField = createField('Amount', this.amountInp, 'amount-field');

        this.destAmountInp = ce('input', {
            type: 'text',
            name: 'dest_amount[]',
            disabled: true,
            placeholder: 'Destination amount',
            autocomplete: 'off',
        }, null, { input: () => this.onDestAmountInput() });
        this.destAmountField = createField('Destination amount', this.destAmountInp, 'amount-field');
        // Date field
        this.dateInp = ce('input', {
            type: 'text',
            name: 'date[]',
            placeholder: 'Date',
            autocomplete: 'off',
        }, null, { input: () => this.onDateInput() });
        this.dateField = createField('Date', this.dateInp, 'date-field');
        // Comment field
        this.commInp = ce('input', {
            type: 'text',
            name: 'comment[]',
            placeholder: 'Comment',
            autocomplete: 'off',
        }, null, { input: () => this.onCommentInput() });
        this.commentField = createField('Comment', this.commInp, 'comment-field');
        // Delete button
        this.delBtn = ce(
            'button',
            { className: 'btn delete-btn', type: 'button' },
            createIcon('del'),
            { click: () => this.remove() },
        );
        // Toggle expand/collapse
        this.toggleExtBtn = ce(
            'button',
            { className: 'btn toggle-btn hidden', type: 'button' },
            createIcon('toggle-ext'),
            { click: () => this.toggleCollapse() },
        );

        this.topRow = createContainer('form-row', [
            this.amountField,
            this.currField,
            this.dateField,
            this.commentField,
        ]);

        this.bottomRow = createContainer('form-row hidden', [
            this.destAccountField,
            this.personField,
            this.destAmountField,
        ]);

        this.formContainer = createContainer('form-container', [
            this.trTypeField,
            createContainer('form-rows', [
                this.topRow,
                this.bottomRow,
            ]),
        ]);

        this.mainContainer = createContainer('main-content', [
            createCheck(this.enableCheck, 'enable-check'),
            this.formContainer,
            createContainer('row-container controls', [
                this.delBtn,
                this.toggleExtBtn,
            ]),
        ]);
        this.feedbackElem = ce('div', { className: 'invalid-feedback hidden' });
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
                this.createOrigDataContainer(this.props.originalData, this.model.mainAccount),
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
        const transferDisabled = this.model.accounts.length < 2;
        const debtDisabled = !this.model.persons.length;
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
            input_id: selectElem,
            onchange: (type) => this.onTrTypeChanged(type),
            editable: false,
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
        const accountItems = this.model.accounts
            .map((account) => ({ id: account.id, title: account.name }));

        const selectElem = ce('select');
        this.destAccountField = createField('Destination account', selectElem);

        this.destAccDropDown = DropDown.create({
            input_id: selectElem,
            disabled: true,
            onchange: (account) => this.onDestChanged(account),
            editable: false,
        });

        this.destAccDropDown.append(accountItems);
        this.destAccDropDown.enableItem(this.state.accountId, false);
    }

    /** Create person field */
    createPersonField() {
        const personItems = this.model.persons
            .map((person) => ({ id: person.id, title: person.name }));

        const selectElem = ce('select');
        this.personField = createField('Person', selectElem);

        this.personDropDown = DropDown.create({
            input_id: selectElem,
            disabled: true,
            onchange: (person) => this.onPersonChanged(person),
            editable: false,
        });

        this.personDropDown.append(personItems);
    }

    /** Create currency field */
    createCurrencyField() {
        const currencyItems = this.model.currency
            .map((currency) => ({ id: currency.id, title: currency.name }));

        const selectElem = ce('select');
        this.currField = createField('Currency', selectElem);

        this.currencyDropDown = DropDown.create({
            input_id: selectElem,
            onchange: (currency) => this.onCurrChanged(currency),
            editable: false,
        });

        this.currencyDropDown.append(currencyItems);
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
            ce('h3', { textContent: 'Original imported data' }),
            createContainer('orig-data-table', [
                this.createDataValue('Main account', mainAccount.name),
                this.createDataValue('Date', dateFmt),
                this.createDataValue('Tr. amount', data.transactionAmount),
                this.createDataValue('Tr. currency', data.transactionCurrency),
                this.createDataValue('Acc. amount', data.accountAmount),
                this.createDataValue('Acc. currency', data.accountCurrency),
                this.createDataValue('Comment', data.comment, 'comment-value'),
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
            this.data.origAccount = copyObject(this.model.mainAccount);
        }
        this.data.mainAccount = this.model.mainAccount.id;

        if (this.data.accountCurrencyId !== this.model.mainAccount.curr_id) {
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
        const userAccountsData = this.model.accounts
            .getUserAccounts(this.model.mainAccount.owner_id);
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
        const userAccountsData = this.model.accounts
            .getUserAccounts(this.model.mainAccount.owner_id);
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
                state.secondAccountId = secondAccount.id;
                state.secondAccountCurrId = secondAccount.curr_id;
            }
            state.currId = state.secondAccountCurrId;
        } else if (value === 'debtfrom' || value === 'debtto') {
            state.secondAccountId = 0;
            state.secondAccountVisible = false;
            state.personVisible = true;
            if (!state.personId) {
                state.personId = this.model.persons.data[0].id;
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
        const account = this.model.accounts.getItem(value);
        if (!account) {
            throw new Error('Account not found');
        }

        if (this.state.accountId === account.id) {
            return this.state;
        }
        const state = copyObject(this.state);

        this.model.mainAccount = account;
        if (this.data) {
            this.data.mainAccount = account.id;
        }
        state.accountId = account.id;
        state.accountCurrId = account.curr_id;

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
        const account = this.model.accounts.getItem(value);
        if (!account) {
            throw new Error('Account not found');
        }

        if (this.state.secondAccountId === account.id) {
            return this.state;
        }

        // Can't set second account same as main account
        if (this.model.mainAccount.id === account.id) {
            throw new Error('Can\'t set second account same as main account');
        }

        const state = copyObject(this.state);

        state.secondAccountId = account.id;
        state.secondAccountCurrId = account.curr_id;
        state.currId = state.secondAccountCurrId;
        state.isDiff = state.accountCurrId !== state.currId;
        if (!state.isDiff) {
            state.secondAmount = '';
        }

        this.state = state;

        return state;
    }

    /** Set person */
    setPerson(value) {
        const person = this.model.persons.getItem(value);
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
            this.setFeedback('Please input correct amount');
            return false;
        }

        if (state.isDiff) {
            const secondAmountVal = parseFloat(fixFloat(state.secondAmount));
            if (Number.isNaN(secondAmountVal) || secondAmountVal <= 0) {
                this.parent.invalidateBlock(this.destAmountField);
                this.setFeedback('Please input correct second amount');
                return false;
            }
        }

        if (!checkDate(state.date)) {
            this.parent.invalidateBlock(this.dateField);
            this.setFeedback('Please input correct date');
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

        const secondAcc = this.model.accounts.getItem(state.secondAccountId);
        const person = this.model.persons.getItem(state.personId);
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

    /** Render component */
    render() {
        const { state } = this;

        if (!state) {
            throw new Error('Invalid state');
        }

        const isExpenseOrIncome = ['expense', 'income'].includes(state.type);
        const isTransfer = ['transferfrom', 'transferto'].includes(state.type);
        const isDebt = ['debtfrom', 'debtto'].includes(state.type);
        const showBottom = (!isExpenseOrIncome || state.isDiff);

        if (state.enabled) {
            this.elem.classList.remove('import-item_disabled');
        } else {
            this.elem.classList.add('import-item_disabled');
        }

        this.enableCheck.checked = state.enabled;
        this.typeDropDown.enable(state.enabled);
        enable(this.amountInp, state.enabled);
        this.currencyDropDown.enable(state.enabled && isExpenseOrIncome);
        this.destAccDropDown.enable(state.enabled && isTransfer);
        this.personDropDown.enable(state.enabled && isDebt);
        enable(this.destAmountInp, state.enabled && state.isDiff);
        enable(this.dateInp, state.enabled);
        enable(this.commInp, state.enabled);

        this.typeDropDown.selectItem(state.type);

        // Amount field
        this.amountInp.value = state.amount;
        // Currency field
        this.currencyDropDown.selectItem(state.currId);

        // Bottom row
        show(this.bottomRow, showBottom);

        // Second account field
        this.syncDestAccountSelect(state);
        this.destAccDropDown.selectItem(state.secondAccountId);
        show(this.destAccountField, state.secondAccountVisible);

        // Second amount field
        this.destAmountInp.value = state.secondAmount;
        show(this.destAmountField, state.isDiff);

        // Person field
        this.personDropDown.selectItem(state.personId);
        show(this.personField, state.personVisible);

        this.dateInp.value = state.date;
        this.commInp.value = state.comment;
    }
}
