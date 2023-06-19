import {
    isFunction,
    insertAfter,
    show,
    addChilds,
    createElement,
    Component,
    getLongMonthName,
    MONTHS_COUNT,
} from 'jezvejs';

import { Button } from 'jezvejs/Button';
import { DecimalInput } from 'jezvejs/DecimalInput';
import { DropDown } from 'jezvejs/DropDown';
import { InputGroup } from 'jezvejs/InputGroup';
import { Spinner } from 'jezvejs/Spinner';
import { WeekDaySelect } from 'jezvejs/WeekDaySelect';
import { createStore } from 'jezvejs/Store';

import {
    cutTime,
    __,
    MAX_DAYS_IN_MONTH,
} from '../../utils/utils.js';
import { EXCHANGE_PRECISION, normalizeExch } from '../../utils/decimal.js';
import { App } from '../../Application/App.js';

import { ACCOUNT_TYPE_CREDIT_CARD } from '../../Models/Account.js';
import {
    EXPENSE,
    INCOME,
    DEBT,
    TRANSFER,
    LIMIT_CHANGE,
} from '../../Models/Transaction.js';
import {
    INTERVAL_DAY,
    INTERVAL_MONTH,
    INTERVAL_NONE,
    INTERVAL_WEEK,
    INTERVAL_YEAR,
} from '../../Models/ScheduledTransaction.js';

import { Field } from '../Fields/Field/Field.js';
import { InputField } from '../Fields/InputField/InputField.js';
import { AmountInputField } from '../Fields/AmountInputField/AmountInputField.js';
import { DateInputField } from '../Fields/DateInputField/DateInputField.js';
import { DateRangeInput } from '../Inputs/Date/DateRangeInput/DateRangeInput.js';
import { TransactionTypeMenu } from '../Fields/TransactionTypeMenu/TransactionTypeMenu.js';
import { CategorySelect } from '../Inputs/CategorySelect/CategorySelect.js';
import { Tile } from '../Tile/Tile.js';
import { AccountTile } from '../AccountTile/AccountTile.js';

import { AccountContainer } from './components/AccountContainer/AccountContainer.js';
import { TileInfoItem } from './components/TileInfoItem/TileInfoItem.js';

import {
    actions,
    reducer,
    calculateSourceResult,
    calculateDestResult,
    updateStateExchange,
} from './reducer.js';
import * as STATE from './stateId.js';

import './TransactionForm.scss';

const SHOW_INFO = 0;
const SHOW_INPUT = 1;
const HIDE_BOTH = 2;

const validateDateOptions = {
    fixShortYear: false,
};

const hiddenInputIds = [
    'typeInp',
    'srcIdInp',
    'destIdInp',
    'srcCurrInp',
    'destCurrInp',
    'debtOperationInp',
    'personIdInp',
    'debtAccountInp',
];

const defaultProps = {
    type: 'transaction', // 'transaction' or 'scheduleItem'
    onChange: null,
    onSubmit: null,
    onCancel: null,
};

/** Transaction form component */
export class TransactionForm extends Component {
    constructor(props = {}) {
        super({
            ...defaultProps,
            ...props,
        });

        const accountModel = App.model.accounts;
        const currencyModel = App.model.currency;

        const isScheduleItem = this.props.type === 'scheduleItem';
        const transaction = { ...this.props.transaction };

        if (isScheduleItem) {
            transaction.start_date = cutTime(transaction.start_date);
            transaction.end_date = (transaction.end_date) ? cutTime(transaction.end_date) : null;
        } else {
            transaction.date = cutTime(transaction.date);
        }

        const initialState = {
            id: 0,
            type: this.props.type,
            transaction,
            form: {
                sourceAmount: '',
                destAmount: '',
                sourceResult: 0,
                fSourceResult: 0,
                destResult: 0,
                fDestResult: 0,
                exchange: 1,
                fExchange: 1,
                backExchange: 1,
                fBackExchange: 1,
                comment: transaction.comment,
                useBackExchange: false,
            },
            validation: {
                sourceAmount: true,
                destAmount: true,
                date: true,
                startDate: true,
                endDate: true,
                intervalStep: true,
            },
            srcAccount: accountModel.getItem(transaction.src_id),
            destAccount: accountModel.getItem(transaction.dest_id),
            srcCurrency: currencyModel.getItem(transaction.src_curr),
            destCurrency: currencyModel.getItem(transaction.dest_curr),
            isDiff: transaction.src_curr !== transaction.dest_curr,
            isUpdate: this.props.mode === 'update',
            isAvailable: this.props.isAvailable,
            submitStarted: false,
        };

        if (isScheduleItem) {
            initialState.form.startDate = App.formatInputDate(transaction.start_date);
            initialState.form.endDate = (transaction.end_date)
                ? App.formatInputDate(transaction.end_date)
                : '';
            initialState.form.intervalStep = transaction.interval_step;
            initialState.form.intervalType = transaction.interval_type;
            initialState.form.intervalOffset = transaction.interval_offset;
        } else {
            initialState.form.date = App.formatInputDate(transaction.date);
        }

        if (transaction.type === EXPENSE) {
            initialState.id = (initialState.isDiff) ? STATE.E_S_AMOUNT_D_AMOUNT : STATE.E_D_AMOUNT;
        } else if (transaction.type === INCOME) {
            initialState.id = (initialState.isDiff) ? STATE.I_S_AMOUNT_D_AMOUNT : STATE.I_S_AMOUNT;
        } else if (transaction.type === TRANSFER) {
            initialState.id = (initialState.isDiff) ? STATE.T_S_AMOUNT_D_AMOUNT : STATE.T_S_AMOUNT;
        } else if (transaction.type === DEBT) {
            initialState.person = App.model.persons.getItem(transaction.person_id);
            const personAccountId = (transaction.debtType)
                ? transaction.src_id
                : transaction.dest_id;
            if (personAccountId) {
                initialState.personAccount = accountModel.getItem(personAccountId);
            } else {
                const personAccountCurr = (transaction.debtType)
                    ? transaction.src_curr
                    : transaction.dest_curr;
                initialState.personAccount = {
                    id: 0,
                    balance: 0,
                    curr_id: personAccountCurr,
                };
            }

            if (transaction.debtType) {
                initialState.srcAccount = initialState.personAccount;
                initialState.account = initialState.destAccount;

                if (initialState.isDiff) {
                    initialState.id = STATE.DG_S_AMOUNT_D_AMOUNT;
                } else {
                    initialState.id = (transaction.noAccount)
                        ? STATE.DG_NOACC_S_AMOUNT
                        : STATE.DG_S_AMOUNT;
                }
            } else {
                initialState.destAccount = initialState.personAccount;
                initialState.account = initialState.srcAccount;

                if (initialState.isDiff) {
                    initialState.id = STATE.DT_S_AMOUNT_D_AMOUNT;
                } else {
                    initialState.id = (transaction.noAccount)
                        ? STATE.DT_NOACC_D_AMOUNT
                        : STATE.DT_D_AMOUNT;
                }
            }
        } else if (transaction.type === LIMIT_CHANGE) {
            initialState.id = STATE.L_RESULT;

            if (transaction.src_id !== 0) {
                initialState.destAccount = initialState.srcAccount;
                initialState.srcAccount = null;
                initialState.destCurrency = initialState.srcCurrency;

                transaction.dest_id = transaction.src_id;
                transaction.src_id = 0;
                transaction.dest_curr = transaction.src_curr;
                transaction.dest_amount = transaction.src_amount;
            }
        }

        initialState.form.sourceAmount = (transaction.src_amount) ? transaction.src_amount : '';
        initialState.form.destAmount = (transaction.dest_amount) ? transaction.dest_amount : '';

        calculateSourceResult(initialState);
        calculateDestResult(initialState);
        updateStateExchange(initialState);

        this.store = createStore(reducer, { initialState });

        this.init();
    }

    init() {
        // Not available message
        this.notAvailMsg = createElement('span', {
            props: {
                id: 'notAvailMsg',
                className: 'nodata-message',
            },
        });

        // Transaction type menu
        this.typeMenu = TransactionTypeMenu.create({
            id: 'typeMenu',
            multiple: false,
            showAll: false,
            itemParam: 'type',
            onChange: (sel) => this.onChangeType(sel),
        });

        // Accounts section
        this.accountsSection = createElement('div', {
            props: {
                id: 'accountsSection',
                className: 'accounts-section',
            },
        });

        this.swapBtn = Button.create({
            id: 'swapBtn',
            icon: 'swap',
            className: 'swap-btn circle-btn',
            onClick: () => this.store.dispatch(actions.swapSourceAndDest()),
        });

        this.sourceContainer = AccountContainer.create({
            id: 'sourceContainer',
            title: __('transactions.sourceAccount'),
        });
        this.sourceTile = AccountTile.create({ id: 'sourceTile' });
        this.sourceContainer.tileBase.prepend(this.sourceTile.elem);

        this.destContainer = AccountContainer.create({
            id: 'destContainer',
            title: __('transactions.destAccount'),
        });
        this.destTile = AccountTile.create({ id: 'destTile' });
        this.destContainer.tileBase.prepend(this.destTile.elem);

        this.personContainer = AccountContainer.create({
            id: 'personContainer',
            title: __('transactions.person'),
        });
        this.personTile = Tile.create({ id: 'personTile' });
        this.personContainer.tileBase.prepend(this.personTile.elem);

        const debtAccProps = {
            id: 'debtAccountContainer',
            title: __('transactions.person'),
            accountToggler: true,
            onToggleAccount: () => this.toggleEnableAccount(),
            closeButton: true,
            onClose: () => this.toggleEnableAccount(),
        };
        if (App.model.userAccounts.length === 0) {
            debtAccProps.noDataMessage = __('transactions.debtNoAccounts');
        }

        this.debtAccountContainer = AccountContainer.create(debtAccProps);
        this.debtAccountTile = AccountTile.create({ id: 'debtAccountTile' });
        this.debtAccountContainer.tileBase.prepend(this.debtAccountTile.elem);

        this.accountsSection.append(
            this.sourceContainer.elem,
            this.swapBtn.elem,
            this.destContainer.elem,
            this.personContainer.elem,
            this.debtAccountContainer.elem,
        );

        this.srcAmountInfo = TileInfoItem.create({
            id: 'srcAmountInfo',
            onClick: () => this.store.dispatch(actions.sourceAmountClick()),
        });
        this.sourceContainer.infoBlock.append(this.srcAmountInfo.elem);

        this.destAmountInfo = TileInfoItem.create({
            id: 'destAmountInfo',
            onClick: () => this.store.dispatch(actions.destAmountClick()),
        });
        this.destContainer.infoBlock.append(this.destAmountInfo.elem);

        this.srcResBalanceInfo = TileInfoItem.create({
            id: 'srcResBalanceInfo',
            label: __('transactions.result'),
            onClick: () => this.store.dispatch(actions.sourceResultClick()),
        });
        this.sourceContainer.infoBlock.append(this.srcResBalanceInfo.elem);

        this.destResBalanceInfo = TileInfoItem.create({
            id: 'destResBalanceInfo',
            label: __('transactions.result'),
            onClick: () => this.store.dispatch(actions.destResultClick()),
        });
        this.destContainer.infoBlock.append(this.destResBalanceInfo.elem);

        this.exchangeInfo = TileInfoItem.create({
            id: 'exchangeInfo',
            label: __('transactions.exchangeRate'),
            onClick: () => this.store.dispatch(actions.exchangeClick()),
        });
        this.sourceContainer.infoBlock.append(this.exchangeInfo.elem);

        // Source amount field
        this.srcAmountRow = AmountInputField.create({
            id: 'srcAmountRow',
            title: __('transactions.sourceAmount'),
            feedbackMessage: __('transactions.invalidAmount'),
            validate: true,
            className: 'form-row',
            onInput: (e) => this.onSourceAmountInput(e),
            onSelectCurrency: (item) => this.onSrcCurrencySel(item),
        });

        // Destination amount field
        this.destAmountRow = AmountInputField.create({
            id: 'destAmountRow',
            title: __('transactions.destAmount'),
            feedbackMessage: __('transactions.invalidAmount'),
            validate: true,
            className: 'form-row',
            onInput: (e) => this.onDestAmountInput(e),
            onSelectCurrency: (item) => this.onDestCurrencySel(item),
        });

        // Source result field
        this.srcResBalanceRow = AmountInputField.create({
            id: 'srcResBalanceRow',
            title: __('transactions.result'),
            className: 'form-row',
            onInput: (e) => this.onSourceResultInput(e),
        });
        this.srcResBalanceRow.hide();

        // Destination result field
        this.destResBalanceRow = AmountInputField.create({
            id: 'destResBalanceRow',
            title: __('transactions.result'),
            className: 'form-row',
            onInput: (e) => this.onDestResultInput(e),
        });
        this.destResBalanceRow.hide();

        // Exchange rate field
        this.exchangeInput = DecimalInput.create({
            id: 'exchangeInput',
            className: 'input input-group__input right-align-text',
            digits: EXCHANGE_PRECISION,
            allowNegative: false,
            onInput: (e) => this.onExchangeInput(e),
        });

        this.exchangeSign = Button.create({
            id: 'exchangeSign',
            className: 'input-group__btn',
            tabIndex: -1,
            onClick: () => this.onToggleExchange(),
        });

        this.exchangeRow = Field.create({
            id: 'exchangeRow',
            htmlFor: 'exchangeInput',
            title: __('transactions.exchangeRate'),
            className: 'form-row',
            content: [
                InputGroup.create({
                    children: [
                        this.exchangeInput.elem,
                        this.exchangeSign.elem,
                    ],
                }).elem,
            ],
        });
        this.exchangeRow.hide();

        const children = [
            this.typeMenu.elem,
            this.accountsSection,
            this.srcAmountRow.elem,
            this.destAmountRow.elem,
            this.exchangeRow.elem,
            this.srcResBalanceRow.elem,
            this.destResBalanceRow.elem,
        ];

        // Date field
        if (this.props.type === 'transaction') {
            this.dateRow = DateInputField.create({
                id: 'dateRow',
                title: __('transactions.date'),
                feedbackMessage: __('transactions.invalidDate'),
                className: 'form-row',
                locales: App.dateFormatLocale,
                validate: true,
                onInput: (e) => this.onDateInput(e),
                onDateSelect: (e) => this.onDateSelect(e),
            });
            children.push(this.dateRow.elem);
        }

        // Category field
        this.categorySelect = CategorySelect.create({
            id: 'categorySelect',
            name: 'category_id',
            className: 'dd_fullwidth',
            enableFilter: true,
            noResultsMessage: __('notFound'),
            onChange: (category) => this.onCategoryChanged(category),
        });

        this.categoryRow = Field.create({
            id: 'categoryRow',
            htmlFor: 'categorySelect',
            title: __('transactions.category'),
            className: 'form-row',
            content: this.categorySelect.elem,
        });

        // Comment field
        this.commentRow = InputField.create({
            id: 'commentRow',
            inputId: 'commentInput',
            name: 'comment',
            title: __('transactions.comment'),
            className: 'form-row',
            onInput: (e) => this.onCommentInput(e),
        });

        children.push(this.categoryRow.elem, this.commentRow.elem);

        // Schedule fields
        if (this.props.type === 'scheduleItem') {
            const fields = this.createScheduleFields();
            children.push(...fields);
        }

        // Controls
        this.submitBtn = Button.create({
            id: 'submitBtn',
            type: 'submit',
            className: 'submit-btn',
            title: __('actions.submit'),
        });

        this.cancelBtn = Button.create({
            id: 'cancelBtn',
            type: 'link',
            url: App.props.nextAddress,
            className: 'cancel-btn',
            title: __('actions.cancel'),
        });

        this.spinner = Spinner.create({ className: 'request-spinner' });
        this.spinner.hide();

        this.submitControls = createElement('div', {
            props: {
                id: 'submitControls',
                className: 'form-controls',
            },
            children: [
                this.submitBtn.elem,
                this.cancelBtn.elem,
                this.spinner.elem,
            ],
        });

        // Hidden inputs
        const isUpdate = this.props.transaction.id;
        if (isUpdate) {
            hiddenInputIds.push('idInp');
        }
        const hiddenInputs = hiddenInputIds.map((id) => this.createHiddenInput(id));

        children.push(
            this.submitControls,
            this.notAvailMsg,
            ...hiddenInputs,
        );

        this.elem = createElement('form', {
            props: {
                id: 'form',
                method: 'post',
            },
            events: {
                submit: (e) => this.onSubmit(e),
            },
            children,
        });

        this.subscribeToStore(this.store);
        this.onPostInit();
    }

    onPostInit() {
        const state = this.store.getState();

        // Check type change request
        if (state.isUpdate && state.transaction.type !== this.props.requestedType) {
            this.onChangeType(this.props.requestedType);
        }
    }

    /** Subscribes view to store updates */
    subscribeToStore(store) {
        if (!store) {
            throw new Error('Invalid store');
        }

        store.subscribe((state, prevState) => {
            if (state !== prevState) {
                this.render(state, prevState);
            }
        });
    }

    /** Creates schedule fields */
    createScheduleFields() {
        // Date range field
        this.dateRangeInput = DateRangeInput.create({
            id: 'dateRangeInput',
            startPlaceholder: __('dateRange.from'),
            endPlaceholder: __('dateRange.to'),
            startClearable: false,
            onChange: (range) => this.onScheduleRangeChange(range),
        });

        this.dateRangeField = Field.create({
            id: 'dateRangeField',
            htmlFor: 'dateRangeInput',
            title: __('filters.dateRange'),
            className: 'form-row',
            content: this.dateRangeInput.elem,
        });

        // Interval step field
        this.intervalStepInput = DecimalInput.create({
            id: 'intervalStepInput',
            name: 'interval_step',
            className: 'input stretch-input',
            digits: 0,
            allowNegative: false,
            onInput: (e) => this.onIntervalStepChanged(e),
        });

        this.intervalStepRow = Field.create({
            id: 'intervalStepRow',
            htmlFor: 'intervalStepInput',
            title: __('schedule.intervalStep'),
            className: 'interval-step-field',
            content: this.intervalStepInput.elem,
        });

        this.intervalFeedbackElem = createElement('div', {
            props: {
                className: 'feedback invalid-feedback',
                textContent: __('schedule.invalidIntervalStep'),
            },
        });

        // Interval type field
        this.intervalTypeSelect = DropDown.create({
            id: 'intervalTypeSelect',
            name: 'interval_type',
            className: 'dd_fullwidth interval-type-select',
            onChange: (type) => this.onIntervalTypeChanged(type),
            data: [
                { id: INTERVAL_NONE, title: __('schedule.intervals.none') },
                { id: INTERVAL_DAY, title: __('schedule.intervals.day') },
                { id: INTERVAL_WEEK, title: __('schedule.intervals.week') },
                { id: INTERVAL_MONTH, title: __('schedule.intervals.month') },
                { id: INTERVAL_YEAR, title: __('schedule.intervals.year') },
            ],
        });

        this.intervalTypeRow = Field.create({
            id: 'intervalTypeRow',
            htmlFor: 'intervalTypeSelect',
            title: __('schedule.repeat'),
            className: 'interval-type-field',
            content: this.intervalTypeSelect.elem,
        });

        const intervalFields = createElement('div', {
            props: { className: 'form-fields-row' },
            children: [
                this.intervalTypeRow.elem,
                this.intervalStepRow.elem,
            ],
        });

        this.intervalFieldsGroup = createElement('div', {
            props: { className: 'form-row validation-block interval-fields' },
            children: [
                intervalFields,
                this.intervalFeedbackElem,
            ],
        });

        // Interval offset
        // Week day field
        this.weekDaySelect = WeekDaySelect.create({
            id: 'weekDaySelect',
            type: 'buttons',
            multiple: true,
            onChange: (offset) => this.onWeekdayOffsetChanged(offset),
        });

        this.weekDayField = Field.create({
            id: 'weekDayField',
            htmlFor: 'weekDaySelect',
            title: __('schedule.offsetWeekDays'),
            className: 'form-row week-day-field',
            content: this.weekDaySelect.elem,
        });

        // Month day / year day field
        this.monthDaySelect = DropDown.create({
            id: 'monthDaySelect',
            className: 'month-day-select',
            onChange: (offset) => this.onMonthDayOffsetChanged(offset),
            data: Array(MAX_DAYS_IN_MONTH).fill().map((_, index) => ({
                id: index,
                title: index + 1,
            })),
        });

        this.monthSelect = DropDown.create({
            id: 'monthSelect',
            className: 'dd_fullwidth month-select',
            onChange: (offset) => this.onMonthOffsetChanged(offset),
            data: Array(MONTHS_COUNT).fill().map((_, index) => ({
                id: index,
                title: getLongMonthName(new Date(2000, index), this.props.locales),
            })),
        });

        this.daySelectField = Field.create({
            id: 'daySelectField',
            htmlFor: 'monthDaySelect',
            title: __('schedule.offsetMonthDay'),
            className: 'form-row horizontal-field day-select-field',
            content: [
                this.monthDaySelect.elem,
                this.monthSelect.elem,
            ],
        });

        return [
            this.dateRangeField.elem,
            this.intervalFieldsGroup,
            this.weekDayField.elem,
            this.daySelectField.elem,
        ];
    }

    /** Returns hidden input element */
    createHiddenInput(id) {
        const input = createElement('input', {
            props: { id, type: 'hidden' },
        });

        this[id] = input;
        return input;
    }

    /** Initialize DropDown for source account tile */
    initSrcAccList(state) {
        if (!this.sourceTile) {
            return;
        }

        const { transaction } = state;

        if (!this.srcDDList) {
            this.srcDDList = DropDown.create({
                elem: this.sourceTile.elem,
                listAttach: true,
                enableFilter: true,
                placeholder: __('accounts.typeToFilter'),
                useSingleSelectionAsPlaceholder: false,
                noResultsMessage: __('notFound'),
                onItemSelect: (item) => this.onSrcAccountSelect(item),
            });

            App.initAccountsList(this.srcDDList);
        }

        if (transaction.src_id) {
            this.srcDDList.setSelection(transaction.src_id);
        }
    }

    /** Initialize DropDown for destination account tile */
    initDestAccList(state, prevState) {
        if (!this.destTile) {
            return;
        }

        const { transaction } = state;
        const updateList = (!this.destDDList || transaction.type !== prevState.transaction.type);

        if (!this.destDDList) {
            this.destDDList = DropDown.create({
                elem: this.destTile.elem,
                listAttach: true,
                enableFilter: true,
                placeholder: __('accounts.typeToFilter'),
                useSingleSelectionAsPlaceholder: false,
                noResultsMessage: __('notFound'),
                onItemSelect: (item) => this.onDestAccountSelect(item),
            });
        }

        if (updateList) {
            const options = {};
            if (state.transaction.type === LIMIT_CHANGE) {
                options.filter = (account) => (account.type === ACCOUNT_TYPE_CREDIT_CARD);
            }

            this.destDDList.removeAll();
            App.initAccountsList(this.destDDList, options);
        }

        if (transaction.dest_id) {
            this.destDDList.setSelection(transaction.dest_id);
        }
    }

    /** Initialize DropDown for debt account tile */
    initPersonsDropDown() {
        if (!this.personTile || this.persDDList) {
            return;
        }

        this.persDDList = DropDown.create({
            elem: this.personTile.elem,
            listAttach: true,
            enableFilter: true,
            placeholder: __('persons.typeToFilter'),
            useSingleSelectionAsPlaceholder: false,
            noResultsMessage: __('notFound'),
            onItemSelect: (item) => this.onPersonSelect(item),
        });

        App.initPersonsList(this.persDDList);
    }

    /** Initialize DropDown for debt account tile */
    initAccList(state) {
        if (!this.debtAccountTile || this.accDDList) {
            return;
        }

        this.accDDList = DropDown.create({
            elem: this.debtAccountTile.elem,
            listAttach: true,
            enableFilter: true,
            placeholder: __('accounts.typeToFilter'),
            useSingleSelectionAsPlaceholder: false,
            noResultsMessage: __('notFound'),
            onItemSelect: (item) => this.onDebtAccountSelect(item),
        });

        App.initAccountsList(this.accDDList);

        const accountId = (state.account) ? state.account.id : 0;
        if (accountId) {
            this.accDDList.setSelection(accountId);
        }
    }

    /**
     * Common function for toggle switch
     * @param {string|Element} inputRow - input row element
     * @param {string|Element} infoBlock - info block element
     * @param {Number} options - show/hide options
     */
    commonSwitch(inputRow, infoBlock, options) {
        const showInput = (options === SHOW_INPUT);
        const showInfo = (options === SHOW_INFO);

        show(inputRow, showInput);
        if (infoBlock) {
            infoBlock.show(showInfo);
        }
    }

    /**
     * Show input control or static block for source amount value
     * @param {Number} options - show/hide options
     */
    srcAmountSwitch(options) {
        this.commonSwitch(
            this.srcAmountRow.elem,
            this.srcAmountInfo,
            options,
        );
    }

    /**
     * Show input control or static block for destination amount value
     * @param {Number} options - show/hide options
     */
    destAmountSwitch(options) {
        this.commonSwitch(
            this.destAmountRow.elem,
            this.destAmountInfo,
            options,
        );
    }

    /**
     * Show input control or static block for source result balance value
     * @param {Number} options - show/hide options
     */
    resBalanceSwitch(options) {
        this.commonSwitch(
            this.srcResBalanceRow.elem,
            this.srcResBalanceInfo,
            options,
        );
    }

    /**
     * Show input control or static block for destination result balance value
     * @param {Number} options - show/hide options
     */
    resBalanceDestSwitch(options) {
        this.commonSwitch(
            this.destResBalanceRow.elem,
            this.destResBalanceInfo,
            options,
        );
    }

    /**
     * Show input control or static block for exchange rate value
     * @param {Number} options - show/hide options
     */
    exchRateSwitch(options) {
        this.commonSwitch(
            this.exchangeRow.elem,
            this.exchangeInfo,
            options,
        );
    }

    /**
     * Transaction type change event handler
     * @param {String} value - selected type
     */
    onChangeType(value) {
        const type = parseInt(value, 10);
        this.store.dispatch(actions.typeChange(type));
        this.notifyChanged();
    }

    /**
     * Source account select callback
     * @param {object} obj - selected item
     */
    onSrcAccountSelect(obj) {
        const accountId = parseInt(obj.id, 10);
        this.store.dispatch(actions.sourceAccountChange(accountId));
        this.notifyChanged();
    }

    /**
     * Destination account select callback
     * @param {object} obj - selected item
     */
    onDestAccountSelect(obj) {
        const accountId = parseInt(obj.id, 10);
        this.store.dispatch(actions.destAccountChange(accountId));
        this.notifyChanged();
    }

    /**
     * Debt account select callback
     * @param {object} obj - selected item
     */
    onDebtAccountSelect(obj) {
        const accountId = parseInt(obj.id, 10);
        this.store.dispatch(actions.debtAccountChange(accountId));
        this.notifyChanged();
    }

    /**
     * Person select callback
     * @param {object} obj - selected item
     */
    onPersonSelect(obj) {
        const personId = parseInt(obj.id, 10);
        this.store.dispatch(actions.personChange(personId));
        this.notifyChanged();
    }

    /**
     * Account disable button click event handler
     */
    toggleEnableAccount() {
        this.store.dispatch(actions.toggleDebtAccount());
        this.notifyChanged();
    }

    /**
     * Source currency select callback
     * @param {object} obj - selected item
     */
    onSrcCurrencySel(obj) {
        const currencyId = parseInt(obj.id, 10);
        this.store.dispatch(actions.sourceCurrencyChange(currencyId));
        this.notifyChanged();
    }

    /**
     * Destination currency select callback
     * @param {object} obj - selected item
     */
    onDestCurrencySel(obj) {
        const currencyId = parseInt(obj.id, 10);
        this.store.dispatch(actions.destCurrencyChange(currencyId));
        this.notifyChanged();
    }

    onSourceAmountInput(e) {
        this.store.dispatch(actions.sourceAmountChange(e.target.value));
        this.notifyChanged();
    }

    onDestAmountInput(e) {
        this.store.dispatch(actions.destAmountChange(e.target.value));
        this.notifyChanged();
    }

    onExchangeInput(e) {
        this.store.dispatch(actions.exchangeChange(e.target.value));
        this.notifyChanged();
    }

    onSourceResultInput(e) {
        this.store.dispatch(actions.sourceResultChange(e.target.value));
        this.notifyChanged();
    }

    onDestResultInput(e) {
        this.store.dispatch(actions.destResultChange(e.target.value));
        this.notifyChanged();
    }

    onToggleExchange() {
        this.store.dispatch(actions.toggleExchange());
    }

    onDateInput(e) {
        this.store.dispatch(actions.dateChange(e.target.value));
        this.notifyChanged();
    }

    /**
     * Date select callback
     * @param {Date} date - selected date object
     */
    onDateSelect(date) {
        this.store.dispatch(actions.dateChange(App.formatInputDate(date)));
        this.dateRow.datePicker.hide();
        this.notifyChanged();
    }

    onCategoryChanged(category) {
        const categoryId = parseInt(category.id, 10);
        this.store.dispatch(actions.categoryChange(categoryId));
        this.notifyChanged();
    }

    onCommentInput(e) {
        this.store.dispatch(actions.commentChange(e.target.value));
        this.notifyChanged();
    }

    /**
     * Schedule date range change callback
     */
    onScheduleRangeChange(range) {
        this.store.dispatch(actions.scheduleRangeChange(range));
        this.notifyChanged();
    }

    onIntervalTypeChanged(type) {
        const typeId = parseInt(type.id, 10);
        this.store.dispatch(actions.intervalTypeChange(typeId));
        this.notifyChanged();
    }

    onIntervalStepChanged(e) {
        this.store.dispatch(actions.intervalStepChange(e.target.value));
        this.notifyChanged();
    }

    onWeekdayOffsetChanged(offset) {
        this.store.dispatch(actions.intervalOffsetChange(offset));
        this.notifyChanged();
    }

    onMonthDayOffsetChanged(monthDay) {
        const { transaction } = this.store.getState();

        let offset = parseInt(monthDay.id, 10);
        if (transaction.interval_type === INTERVAL_YEAR) {
            const month = Math.floor(transaction.interval_offset / 100);
            offset += (month * 100);
        } else if (transaction.interval_type !== INTERVAL_MONTH) {
            return;
        }

        this.store.dispatch(actions.intervalOffsetChange(offset));
        this.notifyChanged();
    }

    onMonthOffsetChanged(month) {
        const { transaction } = this.store.getState();
        const dayIndex = (transaction.interval_offset % 100);
        const offset = (month.id * 100) + dayIndex;

        this.store.dispatch(actions.intervalOffsetChange(offset));
        this.notifyChanged();
    }

    notifyChanged() {
        if (!isFunction(this.props.onChange)) {
            return;
        }

        const { transaction } = this.store.getState();
        this.props.onChange(transaction);
    }

    startSubmit() {
        this.store.dispatch(actions.startSubmit());
    }

    cancelSubmit() {
        this.store.dispatch(actions.cancelSubmit());
    }

    /** Form 'submit' event handler */
    onSubmit(e) {
        e.preventDefault();

        const state = this.store.getState();
        if (state.submitStarted) {
            return;
        }

        const startFromDestAmount = (
            (state.transaction.type === EXPENSE)
            || (state.transaction.type === DEBT && !state.transaction.debtType)
            || (state.transaction.type === LIMIT_CHANGE)
        );

        if (startFromDestAmount) {
            this.validateDestAmount(state);
            if (state.isDiff) {
                this.validateSourceAmount(state);
            }
        } else {
            this.validateSourceAmount(state);
            if (state.isDiff) {
                this.validateDestAmount(state);
            }
        }

        const isTransaction = (state.type === 'transaction');
        const isScheduleItem = (state.type === 'scheduleItem');

        if (isTransaction) {
            this.validateDate(state);
        } else if (isScheduleItem) {
            this.validateStartDate(state);
            this.validateEndDate(state);
            this.validateIntervalStep(state);
        }

        const { validation } = this.store.getState();
        let valid = (
            validation.destAmount
            && validation.sourceAmount
        );

        if (isTransaction) {
            valid = valid && validation.date;
        } else if (isScheduleItem) {
            valid = valid && validation.startDate && validation.endDate && validation.intervalStep;
        }

        if (valid) {
            this.submitTransaction();
        }
    }

    validateSourceAmount(state) {
        let amount = state.transaction.src_amount;
        if (state.transaction.type === LIMIT_CHANGE) {
            amount = Math.abs(amount);
        }

        const valid = (amount > 0);
        if (!valid) {
            this.store.dispatch(actions.invalidateSourceAmount());
        }
    }

    validateDestAmount(state) {
        let amount = state.transaction.dest_amount;
        if (state.transaction.type === LIMIT_CHANGE) {
            amount = Math.abs(amount);
        }

        const valid = (amount > 0);
        if (!valid) {
            this.store.dispatch(actions.invalidateDestAmount());
        }
    }

    validateDate(state) {
        const valid = App.isValidDateString(state.form.date, validateDateOptions);
        if (!valid) {
            this.store.dispatch(actions.invalidateDate());
        }
    }

    validateStartDate(state) {
        const valid = App.isValidDateString(state.form.startDate, validateDateOptions);
        if (!valid) {
            this.store.dispatch(actions.invalidateStartDate());
        }
    }

    validateEndDate(state) {
        const { endDate } = state.form;
        const valid = (
            (endDate.length === 0)
            || App.isValidDateString(endDate, validateDateOptions)
        );
        if (!valid) {
            this.store.dispatch(actions.invalidateEndDate());
        }
    }

    validateIntervalStep(state) {
        const { transaction } = state;

        const valid = (
            (transaction.interval_type === INTERVAL_NONE)
            || (transaction.interval_step > 0)
        );
        if (!valid) {
            this.store.dispatch(actions.invalidateIntervalStep());
        }
    }

    submitTransaction() {
        if (!isFunction(this.props.onSubmit)) {
            return;
        }

        const state = this.store.getState();
        const request = this.getRequestData(state);
        this.props.onSubmit(request);
    }

    /**
     * Returns form data object
     * @param {Object} state
     * @returns
     */
    getRequestData(state) {
        if (!state) {
            return null;
        }

        const { transaction, type } = state;
        const res = {
            type: transaction.type,
            src_amount: transaction.src_amount,
            dest_amount: transaction.dest_amount,
            src_curr: transaction.src_curr,
            dest_curr: transaction.dest_curr,
            category_id: transaction.category_id,
            comment: transaction.comment,
        };

        if (type === 'transaction') {
            res.date = transaction.date;
        } else if (type === 'scheduleItem') {
            res.start_date = transaction.start_date;
            res.end_date = transaction.end_date;
            res.interval_type = transaction.interval_type;
            res.interval_step = transaction.interval_step;
            res.interval_offset = transaction.interval_offset;
        }

        if (state.isUpdate) {
            res.id = transaction.id;
        }

        if (transaction.reminder_id) {
            res.reminder_id = transaction.reminder_id;
        }

        if (res.type === DEBT) {
            res.person_id = transaction.person_id;
            res.op = transaction.debtType ? 1 : 2;
            res.acc_id = transaction.noAccount ? 0 : state.account.id;
        } else {
            res.src_id = transaction.src_id;
            res.dest_id = transaction.dest_id;
        }

        if (res.type === LIMIT_CHANGE && res.dest_amount < 0) {
            res.src_amount = Math.abs(res.src_amount);
            res.dest_amount = Math.abs(res.dest_amount);
            res.src_id = res.dest_id;
            res.dest_id = 0;
        }

        return res;
    }

    renderExchangeRate(state) {
        const { useBackExchange } = state.form;
        const srcCurr = state.srcCurrency;
        const destCurr = state.destCurrency;

        const exchSigns = (useBackExchange)
            ? `${srcCurr.sign}/${destCurr.sign}`
            : `${destCurr.sign}/${srcCurr.sign}`;
        this.exchangeSign.setTitle(exchSigns);

        const exchangeValue = (useBackExchange)
            ? state.form.backExchange
            : state.form.exchange;
        const normExch = normalizeExch(exchangeValue);

        if (this.exchangeInfo) {
            this.exchangeInfo.setTitle(`${normExch} ${exchSigns}`);
            this.exchangeInfo.enable(!state.submitStarted);
        }
    }

    renderExpense(state) {
        const isTransaction = (state.type === 'transaction');

        this.resBalanceDestSwitch(HIDE_BOTH);

        if (state.id === STATE.E_D_AMOUNT) {
            this.srcAmountSwitch(HIDE_BOTH);
            this.destAmountSwitch(SHOW_INPUT);
            this.resBalanceSwitch((isTransaction) ? SHOW_INFO : HIDE_BOTH);
            this.exchRateSwitch(HIDE_BOTH);
        } else if (state.id === STATE.E_S_RESULT && isTransaction) {
            this.srcAmountSwitch(HIDE_BOTH);
            this.destAmountSwitch(SHOW_INFO);
            this.resBalanceSwitch(SHOW_INPUT);
            this.exchRateSwitch(HIDE_BOTH);
        } else if (state.id === STATE.E_S_AMOUNT_D_AMOUNT) {
            this.srcAmountSwitch(SHOW_INPUT);
            this.destAmountSwitch(SHOW_INPUT);
            this.resBalanceSwitch((isTransaction) ? SHOW_INFO : HIDE_BOTH);
            this.exchRateSwitch(SHOW_INFO);
        } else if (state.id === STATE.E_S_AMOUNT_EXCH) {
            this.srcAmountSwitch(SHOW_INPUT);
            this.destAmountSwitch(SHOW_INFO);
            this.resBalanceSwitch((isTransaction) ? SHOW_INFO : HIDE_BOTH);
            this.exchRateSwitch(SHOW_INPUT);
        } else if (state.id === STATE.E_S_AMOUNT_S_RESULT && isTransaction) {
            this.srcAmountSwitch(SHOW_INPUT);
            this.destAmountSwitch(SHOW_INFO);
            this.resBalanceSwitch(SHOW_INPUT);
            this.exchRateSwitch(SHOW_INFO);
        }

        addChilds(this.sourceContainer.infoBlock, [
            this.srcAmountInfo.elem,
            this.destAmountInfo.elem,
            this.srcResBalanceInfo.elem,
            this.exchangeInfo.elem,
        ]);

        if (isTransaction) {
            this.srcResBalanceRow.setTitle(__('transactions.result'));
            this.destResBalanceRow.setTitle(__('transactions.result'));
        }

        this.srcAmountRow.enableSelect(false);
        this.destAmountRow.enableSelect(true);
    }

    renderIncome(state) {
        const isTransaction = (state.type === 'transaction');

        if (state.id === STATE.I_S_AMOUNT) {
            this.srcAmountSwitch(SHOW_INPUT);
            this.destAmountSwitch(HIDE_BOTH);
            this.resBalanceSwitch(HIDE_BOTH);
            this.resBalanceDestSwitch((isTransaction) ? SHOW_INFO : HIDE_BOTH);
            this.exchRateSwitch(HIDE_BOTH);
        } else if (state.id === STATE.I_D_RESULT && isTransaction) {
            this.srcAmountSwitch(SHOW_INFO);
            this.destAmountSwitch(HIDE_BOTH);
            this.resBalanceSwitch(SHOW_INFO);
            this.resBalanceDestSwitch(SHOW_INPUT);
            this.exchRateSwitch(HIDE_BOTH);
        } else if (state.id === STATE.I_S_AMOUNT_D_AMOUNT) {
            this.srcAmountSwitch(SHOW_INPUT);
            this.destAmountSwitch(SHOW_INPUT);
            this.resBalanceSwitch((isTransaction) ? SHOW_INFO : HIDE_BOTH);
            this.resBalanceDestSwitch((isTransaction) ? SHOW_INFO : HIDE_BOTH);
            this.exchRateSwitch(SHOW_INFO);
        } else if (state.id === STATE.I_S_AMOUNT_EXCH) {
            this.srcAmountSwitch(SHOW_INPUT);
            this.destAmountSwitch(SHOW_INFO);
            this.resBalanceSwitch((isTransaction) ? SHOW_INFO : HIDE_BOTH);
            this.resBalanceDestSwitch((isTransaction) ? SHOW_INFO : HIDE_BOTH);
            this.exchRateSwitch(SHOW_INPUT);
        } else if (state.id === STATE.I_S_AMOUNT_D_RESULT && isTransaction) {
            this.srcAmountSwitch(SHOW_INPUT);
            this.destAmountSwitch(SHOW_INFO);
            this.resBalanceSwitch(SHOW_INFO);
            this.resBalanceDestSwitch(SHOW_INPUT);
            this.exchRateSwitch(SHOW_INFO);
        }

        addChilds(this.destContainer.infoBlock, [
            this.srcAmountInfo.elem,
            this.destAmountInfo.elem,
            this.destResBalanceInfo.elem,
            this.exchangeInfo.elem,
        ]);

        if (isTransaction) {
            this.srcResBalanceRow.setTitle(__('transactions.result'));
            this.destResBalanceRow.setTitle(__('transactions.result'));
        }

        this.srcAmountRow.enableSelect(true);
        this.destAmountRow.enableSelect(false);
    }

    renderTransfer(state) {
        const isTransaction = (state.type === 'transaction');

        if (state.id === STATE.T_S_AMOUNT) {
            this.srcAmountSwitch(SHOW_INPUT);
            this.destAmountSwitch(HIDE_BOTH);
            this.resBalanceSwitch((isTransaction) ? SHOW_INFO : HIDE_BOTH);
            this.resBalanceDestSwitch((isTransaction) ? SHOW_INFO : HIDE_BOTH);
            this.exchRateSwitch(HIDE_BOTH);
        } else if (state.id === STATE.T_S_RESULT && isTransaction) {
            this.srcAmountSwitch(SHOW_INFO);
            this.destAmountSwitch(HIDE_BOTH);
            this.resBalanceSwitch(SHOW_INPUT);
            this.resBalanceDestSwitch(SHOW_INFO);
            this.exchRateSwitch(HIDE_BOTH);
        } else if (state.id === STATE.T_D_RESULT && isTransaction) {
            this.srcAmountSwitch(SHOW_INFO);
            this.destAmountSwitch(HIDE_BOTH);
            this.resBalanceSwitch(SHOW_INFO);
            this.resBalanceDestSwitch(SHOW_INPUT);
            this.exchRateSwitch(HIDE_BOTH);
        } else if (state.id === STATE.T_S_AMOUNT_D_AMOUNT) {
            this.srcAmountSwitch(SHOW_INPUT);
            this.destAmountSwitch(SHOW_INPUT);
            this.resBalanceSwitch((isTransaction) ? SHOW_INFO : HIDE_BOTH);
            this.resBalanceDestSwitch((isTransaction) ? SHOW_INFO : HIDE_BOTH);
            this.exchRateSwitch(SHOW_INFO);
        } else if (state.id === STATE.T_D_AMOUNT_S_RESULT && isTransaction) {
            this.srcAmountSwitch(SHOW_INFO);
            this.destAmountSwitch(SHOW_INPUT);
            this.resBalanceSwitch(SHOW_INPUT);
            this.resBalanceDestSwitch(SHOW_INFO);
            this.exchRateSwitch(SHOW_INFO);
        } else if (state.id === STATE.T_S_AMOUNT_D_RESULT && isTransaction) {
            this.srcAmountSwitch(SHOW_INPUT);
            this.destAmountSwitch(SHOW_INFO);
            this.resBalanceSwitch(SHOW_INFO);
            this.resBalanceDestSwitch(SHOW_INPUT);
            this.exchRateSwitch(SHOW_INFO);
        } else if (state.id === STATE.T_S_RESULT_D_RESULT && isTransaction) {
            this.srcAmountSwitch(SHOW_INFO);
            this.destAmountSwitch(SHOW_INFO);
            this.resBalanceSwitch(SHOW_INPUT);
            this.resBalanceDestSwitch(SHOW_INPUT);
            this.exchRateSwitch(SHOW_INFO);
        } else if (state.id === STATE.T_S_AMOUNT_EXCH) {
            this.srcAmountSwitch(SHOW_INPUT);
            this.destAmountSwitch(SHOW_INFO);
            this.resBalanceSwitch((isTransaction) ? SHOW_INFO : HIDE_BOTH);
            this.resBalanceDestSwitch((isTransaction) ? SHOW_INFO : HIDE_BOTH);
            this.exchRateSwitch(SHOW_INPUT);
        } else if (state.id === STATE.T_EXCH_S_RESULT && isTransaction) {
            this.srcAmountSwitch(SHOW_INFO);
            this.destAmountSwitch(SHOW_INFO);
            this.resBalanceSwitch(SHOW_INPUT);
            this.resBalanceDestSwitch(SHOW_INFO);
            this.exchRateSwitch(SHOW_INPUT);
        }

        insertAfter(this.swapBtn.elem, this.sourceContainer.elem);

        addChilds(this.sourceContainer.infoBlock, [
            this.srcAmountInfo.elem,
            this.srcResBalanceInfo.elem,
            this.exchangeInfo.elem,
        ]);
        addChilds(this.destContainer.infoBlock, [
            this.destAmountInfo.elem,
            this.destResBalanceInfo.elem,
        ]);

        if (isTransaction) {
            this.srcResBalanceRow.setTitle(`${__('transactions.result')} (${__('transactions.source')})`);
            this.destResBalanceRow.setTitle(`${__('transactions.result')} (${__('transactions.destination')})`);
        }

        this.srcAmountRow.enableSelect(false);
        this.destAmountRow.enableSelect(false);
    }

    renderDebt(state) {
        const isTransaction = (state.type === 'transaction');

        if (state.id === STATE.DG_S_AMOUNT) {
            this.srcAmountSwitch(SHOW_INPUT);
            this.destAmountSwitch(HIDE_BOTH);
            this.resBalanceSwitch((isTransaction) ? SHOW_INFO : HIDE_BOTH);
            this.resBalanceDestSwitch((isTransaction) ? SHOW_INFO : HIDE_BOTH);
            this.exchRateSwitch(HIDE_BOTH);
        } else if (state.id === STATE.DG_S_RESULT && isTransaction) {
            this.srcAmountSwitch(SHOW_INFO);
            this.destAmountSwitch(HIDE_BOTH);
            this.resBalanceSwitch(SHOW_INPUT);
            this.resBalanceDestSwitch(SHOW_INFO);
            this.exchRateSwitch(HIDE_BOTH);
        } else if (state.id === STATE.DG_D_RESULT && isTransaction) {
            this.srcAmountSwitch(SHOW_INFO);
            this.destAmountSwitch(HIDE_BOTH);
            this.resBalanceSwitch(SHOW_INFO);
            this.resBalanceDestSwitch(SHOW_INPUT);
            this.exchRateSwitch(HIDE_BOTH);
        } else if (state.id === STATE.DT_D_AMOUNT) {
            this.srcAmountSwitch(HIDE_BOTH);
            this.destAmountSwitch(SHOW_INPUT);
            this.resBalanceSwitch((isTransaction) ? SHOW_INFO : HIDE_BOTH);
            this.resBalanceDestSwitch((isTransaction) ? SHOW_INFO : HIDE_BOTH);
            this.exchRateSwitch(HIDE_BOTH);
        } else if (state.id === STATE.DT_D_RESULT && isTransaction) {
            this.srcAmountSwitch(HIDE_BOTH);
            this.destAmountSwitch(SHOW_INFO);
            this.resBalanceSwitch(SHOW_INFO);
            this.resBalanceDestSwitch(SHOW_INPUT);
            this.exchRateSwitch(HIDE_BOTH);
        } else if (state.id === STATE.DT_S_RESULT && isTransaction) {
            this.srcAmountSwitch(HIDE_BOTH);
            this.destAmountSwitch(SHOW_INFO);
            this.resBalanceSwitch(SHOW_INPUT);
            this.resBalanceDestSwitch(SHOW_INFO);
            this.exchRateSwitch(HIDE_BOTH);
        } else if (state.id === STATE.DG_NOACC_S_AMOUNT) {
            this.srcAmountSwitch(SHOW_INPUT);
            this.destAmountSwitch(HIDE_BOTH);
            this.resBalanceSwitch((isTransaction) ? SHOW_INFO : HIDE_BOTH);
            this.resBalanceDestSwitch(HIDE_BOTH);
            this.exchRateSwitch(HIDE_BOTH);
        } else if (state.id === STATE.DT_NOACC_D_AMOUNT) {
            this.srcAmountSwitch(HIDE_BOTH);
            this.destAmountSwitch(SHOW_INPUT);
            this.resBalanceSwitch(HIDE_BOTH);
            this.resBalanceDestSwitch((isTransaction) ? SHOW_INFO : HIDE_BOTH);
            this.exchRateSwitch(HIDE_BOTH);
        } else if (state.id === STATE.DT_NOACC_D_RESULT && isTransaction) {
            this.srcAmountSwitch(HIDE_BOTH);
            this.destAmountSwitch(SHOW_INFO);
            this.resBalanceSwitch(HIDE_BOTH);
            this.resBalanceDestSwitch(SHOW_INPUT);
            this.exchRateSwitch(HIDE_BOTH);
        } else if (state.id === STATE.DG_NOACC_S_RESULT && isTransaction) {
            this.srcAmountSwitch(SHOW_INFO);
            this.destAmountSwitch(HIDE_BOTH);
            this.resBalanceSwitch(SHOW_INPUT);
            this.resBalanceDestSwitch(HIDE_BOTH);
            this.exchRateSwitch(HIDE_BOTH);
        } else if (
            state.id === STATE.DG_S_AMOUNT_D_AMOUNT
            || state.id === STATE.DT_S_AMOUNT_D_AMOUNT
        ) {
            this.srcAmountSwitch(SHOW_INPUT);
            this.destAmountSwitch(SHOW_INPUT);
            this.resBalanceSwitch((isTransaction) ? SHOW_INFO : HIDE_BOTH);
            this.resBalanceDestSwitch((isTransaction) ? SHOW_INFO : HIDE_BOTH);
            this.exchRateSwitch(SHOW_INFO);
        } else if (
            (
                (state.id === STATE.DG_D_AMOUNT_S_RESULT)
                || (state.id === STATE.DT_D_AMOUNT_S_RESULT)
            )
            && isTransaction
        ) {
            this.srcAmountSwitch(SHOW_INFO);
            this.destAmountSwitch(SHOW_INPUT);
            this.resBalanceSwitch(SHOW_INPUT);
            this.resBalanceDestSwitch(SHOW_INFO);
            this.exchRateSwitch(SHOW_INFO);
        } else if (state.id === STATE.DG_S_AMOUNT_EXCH) {
            this.srcAmountSwitch(SHOW_INPUT);
            this.destAmountSwitch(SHOW_INFO);
            this.resBalanceSwitch((isTransaction) ? SHOW_INFO : HIDE_BOTH);
            this.resBalanceDestSwitch((isTransaction) ? SHOW_INFO : HIDE_BOTH);
            this.exchRateSwitch(SHOW_INPUT);
        } else if (state.id === STATE.DG_S_RESULT_EXCH && isTransaction) {
            this.srcAmountSwitch(SHOW_INFO);
            this.destAmountSwitch(SHOW_INFO);
            this.resBalanceSwitch(SHOW_INPUT);
            this.resBalanceDestSwitch(SHOW_INFO);
            this.exchRateSwitch(SHOW_INPUT);
        } else if (
            (
                (state.id === STATE.DG_S_RESULT_D_RESULT)
                || (state.id === STATE.DT_S_RESULT_D_RESULT)
            ) && isTransaction
        ) {
            this.srcAmountSwitch(SHOW_INFO);
            this.destAmountSwitch(SHOW_INFO);
            this.resBalanceSwitch(SHOW_INPUT);
            this.resBalanceDestSwitch(SHOW_INPUT);
            this.exchRateSwitch(SHOW_INFO);
        } else if (
            (
                (state.id === STATE.DG_S_AMOUNT_D_RESULT)
                || (state.id === STATE.DT_S_AMOUNT_D_RESULT)
            ) && isTransaction
        ) {
            this.srcAmountSwitch(SHOW_INPUT);
            this.destAmountSwitch(SHOW_INFO);
            this.resBalanceSwitch(SHOW_INFO);
            this.resBalanceDestSwitch(SHOW_INPUT);
            this.exchRateSwitch(SHOW_INFO);
        } else if (state.id === STATE.DT_D_AMOUNT_EXCH) {
            this.srcAmountSwitch(SHOW_INFO);
            this.destAmountSwitch(SHOW_INPUT);
            this.resBalanceSwitch((isTransaction) ? SHOW_INFO : HIDE_BOTH);
            this.resBalanceDestSwitch((isTransaction) ? SHOW_INFO : HIDE_BOTH);
            this.exchRateSwitch(SHOW_INPUT);
        } else if (state.id === STATE.DT_D_RESULT_EXCH && isTransaction) {
            this.srcAmountSwitch(SHOW_INFO);
            this.destAmountSwitch(SHOW_INFO);
            this.resBalanceSwitch(SHOW_INFO);
            this.resBalanceDestSwitch(SHOW_INPUT);
            this.exchRateSwitch(SHOW_INPUT);
        }

        const { debtType, noAccount } = state.transaction;

        this.debtOperationInp.value = (debtType) ? 1 : 2;
        if (debtType) {
            insertAfter(this.swapBtn.elem, this.personContainer.elem);
            insertAfter(this.debtAccountContainer.elem, this.swapBtn.elem);
        } else {
            insertAfter(this.swapBtn.elem, this.debtAccountContainer.elem);
            insertAfter(this.personContainer.elem, this.swapBtn.elem);
        }

        addChilds(this.personContainer.infoBlock, [
            this.srcAmountInfo.elem,
            (debtType) ? this.srcResBalanceInfo.elem : this.destResBalanceInfo.elem,
            (debtType) ? this.exchangeInfo.elem : this.destAmountInfo.elem,
        ]);

        addChilds(this.debtAccountContainer.infoBlock, [
            (debtType) ? this.destResBalanceInfo.elem : this.srcResBalanceInfo.elem,
            (debtType) ? this.destAmountInfo.elem : this.exchangeInfo.elem,
        ]);

        if (noAccount) {
            this.debtAccountContainer.setTitle(__('transactions.noAccount'));
        } else {
            const title = (debtType) ? __('transactions.destAccount') : __('transactions.sourceAccount');
            this.debtAccountContainer.setTitle(title);
        }

        this.debtAccountContainer.closeButton.show(!noAccount);
        this.debtAccountContainer.closeButton.enable(!state.submitStarted);

        show(this.debtAccountContainer.tileBase, !noAccount);

        const { userAccounts } = App.model;
        show(
            this.debtAccountContainer.accountToggler,
            noAccount && userAccounts.length > 0,
        );
        this.debtAccountContainer.togglerButton.enable(!state.submitStarted);

        if (isTransaction) {
            const srcResultTarget = __((debtType) ? 'transactions.person' : 'transactions.debtAccount');
            const destResultTarget = __((debtType) ? 'transactions.debtAccount' : 'transactions.person');
            this.srcResBalanceRow.setTitle(`${__('transactions.result')} (${srcResultTarget})`);
            this.destResBalanceRow.setTitle(`${__('transactions.result')} (${destResultTarget})`);
        }

        this.srcAmountRow.enableSelect(debtType);
        this.destAmountRow.enableSelect(!debtType);

        this.personIdInp.value = state.person.id;

        const currencyModel = App.model.currency;
        const personAccountCurr = currencyModel.getItem(state.personAccount.curr_id);
        const personBalance = personAccountCurr.formatValue(state.personAccount.balance);
        this.personTile.setState({
            title: state.person.name,
            subtitle: personBalance,
        });

        this.debtAccountInp.value = (noAccount) ? 0 : state.account.id;

        this.initPersonsDropDown();
        const personId = state.transaction.person_id;
        if (personId) {
            this.persDDList.setSelection(personId);
            this.persDDList.enable(!state.submitStarted);
        }

        if (!noAccount) {
            this.debtAccountTile.setState({ account: state.account });
            if (!this.accDDList) {
                this.initAccList(state);
            }
            this.accDDList.enable(!state.submitStarted);
        }
    }

    renderLimitChange(state) {
        const isTransaction = (state.type === 'transaction');

        if (state.id === STATE.L_RESULT && isTransaction) {
            this.srcAmountSwitch(HIDE_BOTH);
            this.destAmountSwitch(SHOW_INFO);
            this.resBalanceSwitch(HIDE_BOTH);
            this.resBalanceDestSwitch(SHOW_INPUT);
            this.exchRateSwitch(HIDE_BOTH);
        } else if (state.id === STATE.L_AMOUNT) {
            this.srcAmountSwitch(HIDE_BOTH);
            this.destAmountSwitch(SHOW_INPUT);
            this.resBalanceSwitch(HIDE_BOTH);
            this.resBalanceDestSwitch((isTransaction) ? SHOW_INFO : HIDE_BOTH);
            this.exchRateSwitch(HIDE_BOTH);
        }

        addChilds(this.destContainer.infoBlock, [
            this.destAmountInfo.elem,
            this.destResBalanceInfo.elem,
        ]);

        if (isTransaction) {
            this.destResBalanceRow.setTitle(__('transactions.result'));
        }

        this.srcAmountRow.enableSelect(false);
        this.destAmountRow.enableSelect(false);
    }

    renderScheduleFields(state, prevState) {
        if (state?.type !== 'scheduleItem') {
            return;
        }

        const { transaction, form, validation } = state;
        const { intervalType } = form;
        const isRepeat = (intervalType !== INTERVAL_NONE);

        // Date range field
        if (
            (form.startDate !== prevState?.form?.startDate)
            || (form.endDate !== prevState?.form?.endDate)
            || (validation.startDate !== prevState?.validation?.startDate)
            || (validation.endDate !== prevState?.validation?.endDate)
            || (intervalType !== prevState?.form?.intervalType)
            || (state.submitStarted !== prevState?.submitStarted)
        ) {
            this.dateRangeInput.setState((rangeState) => ({
                ...rangeState,
                form: {
                    ...rangeState.form,
                    startDate: form.startDate,
                    endDate: form.endDate,
                },
                filter: {
                    ...rangeState.filter,
                    startDate: transaction.start_date,
                    endDate: transaction.end_date,
                },
                validation: {
                    ...state.validation,
                    startDate: validation.startDate,
                    endDate: validation.endDate,
                    valid: (validation.startDate && validation.endDate),
                },
                disabled: state.submitStarted,
                endVisible: isRepeat,
            }));
        }

        // Interval step field
        this.intervalStepInput.value = form.intervalStep;
        this.intervalStepInput.enable(!state.submitStarted);
        this.intervalStepRow.show(isRepeat);
        App.setValidation(this.intervalFieldsGroup, validation.intervalStep);

        // Interval type field
        this.intervalTypeSelect.setSelection(intervalType);
        this.intervalTypeSelect.enable(!state.submitStarted);

        // Interval offset field
        // Week day field
        const isWeekInterval = (intervalType === INTERVAL_WEEK);

        this.weekDaySelect.enable(!state.submitStarted);
        this.weekDayField.show(isWeekInterval);
        if (isWeekInterval) {
            this.weekDaySelect.setSelection(transaction.interval_offset);
        }

        // Month / year day select field
        const isMonthInterval = (intervalType === INTERVAL_MONTH);
        const isYearInterval = (intervalType === INTERVAL_YEAR);

        this.monthDaySelect.enable(!state.submitStarted);
        this.monthSelect.enable(!state.submitStarted);

        if (isMonthInterval) {
            this.monthDaySelect.setSelection(transaction.interval_offset);
            this.daySelectField.setTitle(__('schedule.offsetMonthDay'));
        } else if (isYearInterval) {
            const monthIndex = Math.floor(transaction.interval_offset / 100);
            const dayIndex = (transaction.interval_offset % 100);

            this.monthDaySelect.setSelection(dayIndex);
            this.monthSelect.setSelection(monthIndex);

            this.daySelectField.setTitle(__('schedule.offsetYearDay'));
        }

        this.daySelectField.show(isMonthInterval || isYearInterval);
        this.monthSelect.show(isYearInterval);
    }

    render(state, prevState = {}) {
        if (!state) {
            throw new Error('Invalid state');
        }

        const { transaction } = state;
        const isScheduleItem = (state.type === 'scheduleItem');

        if (!state.isAvailable) {
            let message;
            if (transaction.type === EXPENSE || transaction.type === INCOME) {
                message = __('transactions.noAccounts');
            } else if (transaction.type === TRANSFER) {
                message = __('transactions.transferNoAccounts');
            } else if (transaction.type === DEBT) {
                message = __('transactions.debtNoPersons');
            }

            this.notAvailMsg.textContent = message;
        }
        show(this.notAvailMsg, !state.isAvailable);

        if (state.isUpdate) {
            this.idInp.value = transaction.id;
        }

        const scrTypes = [EXPENSE, TRANSFER];
        const destTypes = [INCOME, TRANSFER, LIMIT_CHANGE];

        this.sourceContainer.show(
            state.isAvailable && scrTypes.includes(transaction.type),
        );
        this.destContainer.show(
            state.isAvailable && destTypes.includes(transaction.type),
        );
        this.personContainer.show(state.isAvailable && transaction.type === DEBT);
        this.debtAccountContainer.show(state.isAvailable && transaction.type === DEBT);
        this.swapBtn.show(
            state.isAvailable && (transaction.type === TRANSFER || transaction.type === DEBT),
        );
        this.swapBtn.enable(!state.submitStarted);

        // Type menu
        this.typeMenu.setActive(transaction.type);
        this.typeMenu.setState((menuState) => ({
            ...menuState,
            showChangeLimit: (
                (state.srcAccount?.type === ACCOUNT_TYPE_CREDIT_CARD)
                || (state.destAccount?.type === ACCOUNT_TYPE_CREDIT_CARD)
            ),
        }));
        this.typeMenu.enable(!state.submitStarted);
        this.typeInp.value = transaction.type;

        if (state.isAvailable) {
            if (transaction.type === EXPENSE) {
                this.renderExpense(state);
            } else if (transaction.type === INCOME) {
                this.renderIncome(state);
            } else if (transaction.type === TRANSFER) {
                this.renderTransfer(state);
            } else if (transaction.type === DEBT) {
                this.renderDebt(state);
            } else if (transaction.type === LIMIT_CHANGE) {
                this.renderLimitChange(state);
            }
        } else {
            this.srcAmountRow.hide();
            this.destAmountRow.hide();
            this.srcResBalanceRow.hide();
            this.destResBalanceRow.hide();
            this.exchangeRow.hide();
        }

        if (isScheduleItem) {
            this.dateRangeField.show(state.isAvailable);
            this.intervalStepRow.show(state.isAvailable);
            this.intervalTypeRow.show(state.isAvailable);
            this.weekDayField.show(state.isAvailable);
            this.daySelectField.show(state.isAvailable);
        } else {
            this.dateRow.show(state.isAvailable);
        }
        this.categoryRow.show(state.isAvailable);
        this.commentRow.show(state.isAvailable);
        show(this.submitControls, state.isAvailable);

        // Date field
        if (!isScheduleItem) {
            this.dateRow.setState((dateState) => ({
                ...dateState,
                value: state.form.date,
                date: transaction.date,
                disabled: state.submitStarted,
                valid: state.validation.date,
            }));
        }

        if (!state.isAvailable) {
            return;
        }

        const currencyModel = App.model.currency;
        const srcCurrency = currencyModel.getItem(transaction.src_curr);
        const destCurrency = currencyModel.getItem(transaction.dest_curr);

        let sourceAmountLbl;
        let destAmountLbl;
        if (transaction.type === LIMIT_CHANGE) {
            sourceAmountLbl = '';
            destAmountLbl = __('transactions.limitDelta');
        } else {
            sourceAmountLbl = (state.isDiff) ? __('transactions.sourceAmount') : __('transactions.amount');
            destAmountLbl = (state.isDiff) ? __('transactions.destAmount') : __('transactions.amount');
        }

        // Tile info items
        if (this.srcAmountInfo) {
            const title = srcCurrency.formatValue(transaction.src_amount);
            this.srcAmountInfo.setTitle(title);
            this.srcAmountInfo.setLabel(sourceAmountLbl);
            this.srcAmountInfo.enable(!state.submitStarted);
        }

        if (this.destAmountInfo) {
            const title = destCurrency.formatValue(transaction.dest_amount);
            this.destAmountInfo.setTitle(title);
            this.destAmountInfo.setLabel(destAmountLbl);
            this.destAmountInfo.enable(!state.submitStarted);
        }

        if (this.srcResBalanceInfo) {
            const title = srcCurrency.formatValue(state.form.fSourceResult);
            this.srcResBalanceInfo.setTitle(title);
            this.srcResBalanceInfo.enable(!state.submitStarted);
        }

        if (this.destResBalanceInfo) {
            const title = destCurrency.formatValue(state.form.fDestResult);
            this.destResBalanceInfo.setTitle(title);
            this.destResBalanceInfo.enable(!state.submitStarted);
        }

        // Source account
        this.srcIdInp.value = transaction.src_id;
        if (scrTypes.includes(transaction.type)) {
            if (this.sourceTile && state.srcAccount) {
                this.sourceTile.setState({ account: state.srcAccount });
            }

            this.initSrcAccList(state);
            this.srcDDList?.enable(!state.submitStarted);
        }

        // Destination account
        this.destIdInp.value = transaction.dest_id;
        if (destTypes.includes(transaction.type)) {
            if (this.destTile && state.destAccount) {
                this.destTile.setState({ account: state.destAccount });
            }

            this.initDestAccList(state, prevState);
            this.destDDList?.enable(!state.submitStarted);
        }

        // Source amount field
        const enableSrcCurr = (
            (transaction.type === INCOME)
            || (transaction.type === DEBT && transaction.debtType)
        );

        this.srcAmountRow.setState((srcAmountState) => ({
            ...srcAmountState,
            title: sourceAmountLbl,
            value: state.form.sourceAmount,
            disabled: state.submitStarted,
            currencyId: transaction.src_curr,
            valid: state.validation.sourceAmount,
            enableSelect: enableSrcCurr,
        }));

        // Source currency
        this.srcCurrInp.value = transaction.src_curr;

        // Destination amount field
        const enableDestCurr = (
            (transaction.type === EXPENSE)
            || (transaction.type === DEBT && !transaction.debtType)
        );

        this.destAmountRow.setState((destAmountState) => ({
            ...destAmountState,
            title: destAmountLbl,
            value: state.form.destAmount,
            disabled: state.submitStarted,
            currencyId: transaction.dest_curr,
            valid: state.validation.destAmount,
            enableSelect: enableDestCurr,
        }));

        // Destination currency
        this.destCurrInp.value = transaction.dest_curr;

        // Exchange rate field
        this.exchangeInput.value = (state.form.useBackExchange)
            ? state.form.backExchange
            : state.form.exchange;
        this.exchangeInput.enable(!state.submitStarted);
        this.renderExchangeRate(state);

        // Source result field
        this.srcResBalanceRow.setState((srcResultState) => ({
            ...srcResultState,
            value: state.form.sourceResult,
            disabled: state.submitStarted,
            currencyId: transaction.src_curr,
        }));

        // Destination result field
        this.destResBalanceRow.setState((destResultState) => ({
            ...destResultState,
            value: state.form.destResult,
            disabled: state.submitStarted,
            currencyId: transaction.dest_curr,
        }));

        // Category field
        this.categorySelect.setType(transaction.type);
        this.categorySelect.setSelection(transaction.category_id);
        this.categorySelect.enable(!state.submitStarted);

        // Comment field
        this.commentRow.setState((commentState) => ({
            ...commentState,
            value: state.form.comment,
            disabled: state.submitStarted,
        }));

        // Schedule fields
        if (isScheduleItem) {
            this.renderScheduleFields(state, prevState);
        }

        // Controls
        this.submitBtn.enable(!state.submitStarted);
        this.cancelBtn.show(!state.submitStarted);

        if (this.deleteBtn) {
            this.deleteBtn.enable(!state.submitStarted);
        }

        this.spinner.show(state.submitStarted);
    }
}
