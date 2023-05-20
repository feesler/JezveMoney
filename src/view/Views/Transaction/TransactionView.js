import 'jezvejs/style';
import {
    ge,
    insertAfter,
    show,
    enable,
    addChilds,
    createElement,
    setProps,
} from 'jezvejs';
import { DateInput } from 'jezvejs/DateInput';
import { DropDown } from 'jezvejs/DropDown';
import { DatePicker } from 'jezvejs/DatePicker';
import { DecimalInput } from 'jezvejs/DecimalInput';
import { Input } from 'jezvejs/Input';
import { Button } from 'jezvejs/Button';
import { Spinner } from 'jezvejs/Spinner';
import { InputGroup } from 'jezvejs/InputGroup';
import { createStore } from 'jezvejs/Store';
import 'jezvejs/style/Input';
import 'jezvejs/style/InputGroup';
import {
    cutTime,
    EXCHANGE_PRECISION,
    normalizeExch,
    timeToDate,
    __,
} from '../../utils/utils.js';
import {
    EXPENSE,
    INCOME,
    DEBT,
    TRANSFER,
    Transaction,
    LIMIT_CHANGE,
} from '../../Models/Transaction.js';
import { Application } from '../../Application/Application.js';
import { View } from '../../utils/View.js';
import { API } from '../../API/index.js';
import { AccountList } from '../../Models/AccountList.js';
import { CurrencyList } from '../../Models/CurrencyList.js';
import { CategoryList } from '../../Models/CategoryList.js';
import { IconList } from '../../Models/IconList.js';
import { PersonList } from '../../Models/PersonList.js';
import { UserCurrencyList } from '../../Models/UserCurrencyList.js';
import { Heading } from '../../Components/Heading/Heading.js';
import { ConfirmDialog } from '../../Components/ConfirmDialog/ConfirmDialog.js';
import { Tile } from '../../Components/Tile/Tile.js';
import { TransactionTypeMenu } from '../../Components/TransactionTypeMenu/TransactionTypeMenu.js';
import { AccountContainer } from './components/AccountContainer/AccountContainer.js';
import { AccountTile } from '../../Components/AccountTile/AccountTile.js';
import { TileInfoItem } from './components/TileInfoItem/TileInfoItem.js';
import { CategorySelect } from '../../Components/CategorySelect/CategorySelect.js';
import {
    actions,
    reducer,
    calculateSourceResult,
    calculateDestResult,
    updateStateExchange,
} from './reducer.js';
import * as STATE from './stateId.js';
import '../../Components/Field/Field.scss';
import '../../Application/Application.scss';
import './TransactionView.scss';
import { ACCOUNT_TYPE_CREDIT_CARD } from '../../Models/Account.js';
import { Field } from '../../Components/Field/Field.js';

const inputProps = {
    autocomplete: 'off',
    autocapitalize: 'none',
    autocorrect: 'off',
    spellcheck: false,
};

const SHOW_INFO = 0;
const SHOW_INPUT = 1;
const HIDE_BOTH = 2;

/**
 * Create/update transaction view
 */
class TransactionView extends View {
    constructor(...args) {
        super(...args);
        const availModes = ['create', 'update'];

        if (!('transaction' in this.props)) {
            throw new Error('Invalid Transaction view properties');
        }

        window.app.loadModel(CurrencyList, 'currency', window.app.props.currency);
        window.app.loadModel(UserCurrencyList, 'userCurrencies', window.app.props.userCurrencies);
        window.app.loadModel(AccountList, 'accounts', window.app.props.accounts);
        window.app.loadModel(PersonList, 'persons', window.app.props.persons);
        window.app.loadModel(IconList, 'icons', window.app.props.icons);
        window.app.loadModel(CategoryList, 'categories', window.app.props.categories);
        window.app.initCategoriesModel();

        const currencyModel = window.app.model.currency;
        const accountModel = window.app.model.accounts;

        this.mode = this.props.mode;
        if (!availModes.includes(this.mode)) {
            throw new Error(`Invalid Transaction view mode: ${this.mode}`);
        }
        if (this.props.mode === 'update') {
            accountModel.cancelTransaction(this.props.transaction);
        }

        window.app.checkUserAccountModels();
        window.app.checkPersonModels();

        const transaction = {
            ...this.props.transaction,
            date: cutTime(this.props.transaction.date),
        };

        const initialState = {
            id: 0,
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
                date: window.app.formatInputDate(timeToDate(transaction.date)),
                comment: transaction.comment,
                useBackExchange: false,
            },
            validation: {
                sourceAmount: true,
                destAmount: true,
                date: true,
            },
            srcAccount: accountModel.getItem(transaction.src_id),
            destAccount: accountModel.getItem(transaction.dest_id),
            srcCurrency: currencyModel.getItem(transaction.src_curr),
            destCurrency: currencyModel.getItem(transaction.dest_curr),
            isDiff: transaction.src_curr !== transaction.dest_curr,
            isUpdate: this.props.mode === 'update',
            isAvailable: this.props.trAvailable,
            submitStarted: false,
        };

        if (transaction.type === EXPENSE) {
            initialState.id = (initialState.isDiff) ? STATE.E_S_AMOUNT_D_AMOUNT : STATE.E_D_AMOUNT;
        } else if (transaction.type === INCOME) {
            initialState.id = (initialState.isDiff) ? STATE.I_S_AMOUNT_D_AMOUNT : STATE.I_S_AMOUNT;
        } else if (transaction.type === TRANSFER) {
            initialState.id = (initialState.isDiff) ? STATE.T_S_AMOUNT_D_AMOUNT : STATE.T_S_AMOUNT;
        } else if (transaction.type === DEBT) {
            initialState.person = window.app.model.persons.getItem(transaction.person_id);
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
                    initialState.id = (initialState.transaction.noAccount)
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

        if (transaction.id) {
            initialState.form.sourceAmount = transaction.src_amount;
            initialState.form.destAmount = transaction.dest_amount;
        }

        calculateSourceResult(initialState);
        calculateDestResult(initialState);
        updateStateExchange(initialState);

        this.store = createStore(reducer, { initialState });
    }

    /**
     * View initialization
     */
    onStart() {
        const isUpdate = this.props.transaction.id;

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

        this.loadElementsByIds([
            'heading',
            'transactionContainer',
        ]);

        this.heading = Heading.fromElement(this.heading, {
            title: (isUpdate) ? __('TR_UPDATE') : __('TR_CREATE'),
            showInHeaderOnScroll: false,
        });

        // Not available message
        this.notAvailMsg = createElement('span', {
            props: {
                id: 'notAvailMsg',
                className: 'nodata-message',
            },
        });

        // Update mode
        if (isUpdate) {
            this.deleteBtn = Button.create({
                id: 'deleteBtn',
                className: 'warning-btn',
                title: __('DELETE'),
                icon: 'del',
                onClick: () => this.confirmDelete(),
            });
            this.heading.actionsContainer.append(this.deleteBtn.elem);
        }

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
            title: __('TR_SRC_ACCOUNT'),
        });
        this.sourceTile = AccountTile.create({ id: 'sourceTile' });
        this.sourceContainer.tileBase.prepend(this.sourceTile.elem);

        this.destContainer = AccountContainer.create({
            id: 'destContainer',
            title: __('TR_DEST_ACCOUNT'),
        });
        this.destTile = AccountTile.create({ id: 'destTile' });
        this.destContainer.tileBase.prepend(this.destTile.elem);

        this.personContainer = AccountContainer.create({
            id: 'personContainer',
            title: __('TR_PERSON'),
        });
        this.personTile = Tile.create({ id: 'personTile' });
        this.personContainer.tileBase.prepend(this.personTile.elem);

        const debtAccProps = {
            id: 'debtAccountContainer',
            title: __('TR_PERSON'),
            accountToggler: true,
            onToggleAccount: () => this.toggleEnableAccount(),
            closeButton: true,
            onClose: () => this.toggleEnableAccount(),
        };
        if (window.app.model.userAccounts.length === 0) {
            debtAccProps.noDataMessage = __('TR_DEBT_NO_ACCOUNTS');
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
            label: __('TR_RESULT'),
            onClick: () => this.store.dispatch(actions.sourceResultClick()),
        });
        this.sourceContainer.infoBlock.append(this.srcResBalanceInfo.elem);

        this.destResBalanceInfo = TileInfoItem.create({
            id: 'destResBalanceInfo',
            label: __('TR_RESULT'),
            onClick: () => this.store.dispatch(actions.destResultClick()),
        });
        this.destContainer.infoBlock.append(this.destResBalanceInfo.elem);

        this.exchangeInfo = TileInfoItem.create({
            id: 'exchangeInfo',
            label: __('TR_EXCHANGE_RATE'),
            onClick: () => this.store.dispatch(actions.exchangeClick()),
        });
        this.sourceContainer.infoBlock.append(this.exchangeInfo.elem);

        // Source amount field
        this.srcAmountInput = DecimalInput.create({
            id: 'srcAmountInput',
            className: 'input input-group__input right-align-text',
            onInput: (e) => this.onSourceAmountInput(e),
        });

        this.srcAmountSign = createElement('div', {
            props: {
                id: 'srcAmountSign',
                className: 'input-group__btn-title',
            },
        });

        this.srcCurrBtn = Button.create({
            id: 'srcCurrBtn',
            className: 'input-group__btn',
            tabIndex: -1,
            title: this.srcAmountSign,
        });

        const srcAmountFeedback = createElement('div', {
            props: {
                className: 'feedback invalid-feedback',
                textContent: __('TR_INVALID_AMOUNT'),
            },
        });

        this.srcAmountRow = Field.create({
            id: 'srcAmountRow',
            htmlFor: 'srcAmountInput',
            title: __('TR_SRC_AMOUNT'),
            className: 'form-row validation-block',
            content: [
                InputGroup.create({
                    children: [
                        this.srcAmountInput.elem,
                        this.srcCurrBtn.elem,
                    ],
                }).elem,
                srcAmountFeedback,
            ],
        });

        // Destination amount field
        this.destAmountInput = DecimalInput.create({
            id: 'destAmountInput',
            className: 'input input-group__input right-align-text',
            onInput: (e) => this.onDestAmountInput(e),
        });

        this.destAmountSign = createElement('div', {
            props: {
                id: 'destAmountSign',
                className: 'input-group__btn-title',
            },
        });

        this.destCurrBtn = Button.create({
            id: 'destCurrBtn',
            className: 'input-group__btn',
            tabIndex: -1,
            title: this.destAmountSign,
        });

        const destAmountFeedback = createElement('div', {
            props: {
                className: 'feedback invalid-feedback',
                textContent: __('TR_INVALID_AMOUNT'),
            },
        });

        this.destAmountRow = Field.create({
            id: 'destAmountRow',
            htmlFor: 'destAmountInput',
            title: __('TR_DEST_AMOUNT'),
            className: 'form-row validation-block',
            content: [
                InputGroup.create({
                    children: [
                        this.destAmountInput.elem,
                        this.destCurrBtn.elem,
                    ],
                }).elem,
                destAmountFeedback,
            ],
        });

        // Source result field
        this.srcResBalanceSign = Button.create({
            id: 'srcResBalanceSign',
            className: 'input-group__text',
            type: 'static',
        });

        this.srcResBalanceInput = DecimalInput.create({
            id: 'srcResBalanceInput',
            className: 'input input-group__input right-align-text',
            onInput: (e) => this.onSourceResultInput(e),
        });

        this.srcResBalanceRow = Field.create({
            id: 'srcResBalanceRow',
            htmlFor: 'srcResBalanceInput',
            title: __('TR_RESULT'),
            className: 'form-row',
            content: [
                InputGroup.create({
                    children: [
                        this.srcResBalanceInput.elem,
                        this.srcResBalanceSign.elem,
                    ],
                }).elem,
            ],
        });
        this.srcResBalanceRow.hide();

        // Destination result field
        this.destResBalanceInput = DecimalInput.create({
            id: 'destResBalanceInput',
            className: 'input input-group__input right-align-text',
            onInput: (e) => this.onDestResultInput(e),
        });

        this.destResBalanceSign = Button.create({
            id: 'destResBalanceSign',
            className: 'input-group__text',
            type: 'static',
        });

        this.destResBalanceRow = Field.create({
            id: 'destResBalanceRow',
            htmlFor: 'destResBalanceInput',
            title: __('TR_RESULT'),
            className: 'form-row',
            content: [
                InputGroup.create({
                    children: [
                        this.destResBalanceInput.elem,
                        this.destResBalanceSign.elem,
                    ],
                }).elem,
            ],
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
            htmlFor: 'destAmountInput',
            title: __('TR_EXCHANGE_RATE'),
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

        // Date field
        this.dateInputBtn = Button.create({
            id: 'dateInputBtn',
            className: 'input-group__btn',
            icon: 'calendar-icon',
            onClick: () => this.showCalendar(),
        });

        this.dateInput = DateInput.create({
            id: 'dateInput',
            className: 'input input-group__input',
            locales: window.app.dateFormatLocale,
            onInput: (e) => this.onDateInput(e),
        });

        this.datePickerWrapper = createElement('div', {
            props: {
                id: 'datePickerWrapper',
                className: 'calendar',
            },
        });

        const dateFeedback = createElement('div', {
            props: {
                className: 'feedback invalid-feedback',
                textContent: __('TR_INVALID_DATE'),
            },
        });

        const dateFieldContainer = createElement('div', {
            props: {
                className: 'column-container',
            },
            children: [
                InputGroup.create({
                    children: [
                        this.dateInput.elem,
                        this.dateInputBtn.elem,
                    ],
                }).elem,
                this.datePickerWrapper,
            ],
        });

        this.dateRow = Field.create({
            id: 'dateRow',
            htmlFor: 'dateInput',
            title: __('TR_DATE'),
            className: 'form-row validation-block',
            content: [
                dateFieldContainer,
                dateFeedback,
            ],
        });

        // Category field
        this.categorySelect = CategorySelect.create({
            id: 'categorySelect',
            name: 'category_id',
            className: 'dd_fullwidth',
            enableFilter: true,
            noResultsMessage: __('NOT_FOUND'),
            onChange: (category) => this.onCategoryChanged(category),
        });

        this.categoryRow = Field.create({
            id: 'categoryRow',
            htmlFor: 'categorySelect',
            title: __('TR_CATEGORY'),
            className: 'form-row',
            content: this.categorySelect.elem,
        });

        // Comment field
        this.commentInput = Input.create({
            id: 'commentInput',
            name: 'comment',
            className: 'stretch-input',
            onInput: (e) => this.onCommentInput(e),
        });
        setProps(this.commentInput.elem, inputProps);

        this.commentRow = Field.create({
            id: 'commentRow',
            htmlFor: 'commentInput',
            title: __('TR_COMMENT'),
            className: 'form-row',
            content: this.commentInput.elem,
        });

        // Controls
        this.submitBtn = Button.create({
            id: 'submitBtn',
            type: 'submit',
            className: 'submit-btn',
            title: __('SUBMIT'),
        });

        this.cancelBtn = Button.create({
            id: 'cancelBtn',
            type: 'link',
            url: window.app.props.nextAddress,
            className: 'cancel-btn',
            title: __('CANCEL'),
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
        if (isUpdate) {
            hiddenInputIds.push('idInp');
        }
        const hiddenInputs = hiddenInputIds.map((id) => this.createHiddenInput(id));

        this.form = createElement('form', {
            props: {
                id: 'form',
                method: 'post',
            },
            events: {
                submit: (e) => this.onSubmit(e),
            },
            children: [
                this.typeMenu.elem,
                this.accountsSection,
                this.srcAmountRow.elem,
                this.destAmountRow.elem,
                this.exchangeRow.elem,
                this.srcResBalanceRow.elem,
                this.destResBalanceRow.elem,
                this.dateRow.elem,
                this.categoryRow.elem,
                this.commentRow.elem,
                this.submitControls,
                this.notAvailMsg,
                ...hiddenInputs,
            ],
        });

        this.transactionContainer.append(this.form);

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
                placeholder: __('ACCOUNT_TYPE_TO_FILTER'),
                useSingleSelectionAsPlaceholder: false,
                noResultsMessage: __('NOT_FOUND'),
                onItemSelect: (item) => this.onSrcAccountSelect(item),
            });

            window.app.initAccountsList(this.srcDDList);
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
                placeholder: __('ACCOUNT_TYPE_TO_FILTER'),
                useSingleSelectionAsPlaceholder: false,
                noResultsMessage: __('NOT_FOUND'),
                onItemSelect: (item) => this.onDestAccountSelect(item),
            });
        }

        if (updateList) {
            const options = {};
            if (state.transaction.type === LIMIT_CHANGE) {
                options.filter = (account) => (account.type === ACCOUNT_TYPE_CREDIT_CARD);
            }

            this.destDDList.removeAll();
            window.app.initAccountsList(this.destDDList, options);
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
            placeholder: __('PERSON_TYPE_TO_FILTER'),
            useSingleSelectionAsPlaceholder: false,
            noResultsMessage: __('NOT_FOUND'),
            onItemSelect: (item) => this.onPersonSelect(item),
        });

        window.app.initPersonsList(this.persDDList);
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
            placeholder: __('ACCOUNT_TYPE_TO_FILTER'),
            useSingleSelectionAsPlaceholder: false,
            noResultsMessage: __('NOT_FOUND'),
            onItemSelect: (item) => this.onDebtAccountSelect(item),
        });

        window.app.initAccountsList(this.accDDList);

        const accountId = (state.account) ? state.account.id : 0;
        if (accountId) {
            this.accDDList.setSelection(accountId);
        }
    }

    /** Initialize DropDown for currency */
    createCurrencyList({ elem, onItemSelect, currId }) {
        const res = DropDown.create({
            elem,
            onItemSelect,
            listAttach: true,
            enableFilter: true,
        });

        window.app.initUserCurrencyList(res);
        if (currId) {
            res.setSelection(currId);
        }

        return res;
    }

    /** Initialize DropDown for source currency */
    initSrcCurrList(state) {
        if (this.srcCurrDDList) {
            return;
        }

        this.srcCurrDDList = this.createCurrencyList({
            elem: 'srcAmountSign',
            currId: state.transaction.src_curr,
            onItemSelect: (item) => this.onSrcCurrencySel(item),
        });
    }

    /** Initialize DropDown for destination currency */
    initDestCurrList(state) {
        if (this.destCurrDDList) {
            return;
        }

        this.destCurrDDList = this.createCurrencyList({
            elem: 'destAmountSign',
            currId: state.transaction.dest_curr,
            onItemSelect: (item) => this.onDestCurrencySel(item),
        });
    }

    /**
     * Date select callback
     * @param {Date} date - selected date object
     */
    onSelectDate(date) {
        this.store.dispatch(actions.dateChange(window.app.formatInputDate(date)));

        this.datePicker.hide();
    }

    /**
     * Show calendar block
     */
    showCalendar() {
        if (!this.datePicker) {
            this.datePicker = DatePicker.create({
                relparent: this.datePickerWrapper.parentNode,
                locales: window.app.getCurrrentLocale(),
                onDateSelect: (d) => this.onSelectDate(d),
            });
            this.datePickerWrapper.append(this.datePicker.elem);
        }
        if (!this.datePicker) {
            return;
        }

        const visible = this.datePicker.visible();
        if (!visible) {
            const { transaction } = this.store.getState();
            this.datePicker.setSelection(timeToDate(transaction.date));
        }

        this.datePicker.show(!visible);
    }

    /**
     * Common function for toggle switch
     * @param {string|Element} inputRow - input row element
     * @param {string|Element} infoBlock - info block element
     * @param {string|Element} inputObj - decimal input object
     * @param {Number} options - show/hide options
     */
    commonSwitch(inputRow, infoBlock, inputObj, options) {
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
            this.srcAmountInput.elem,
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
            this.destAmountInput.elem,
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
            this.srcResBalanceInput.elem,
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
            this.destResBalanceInput.elem,
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
            this.exchangeInput.elem,
            options,
        );
    }

    onChangeType(value) {
        const type = parseInt(value, 10);
        this.store.dispatch(actions.typeChange(type));
    }

    /**
     * Source account select callback
     * @param {object} obj - selected item
     */
    onSrcAccountSelect(obj) {
        const accountId = parseInt(obj.id, 10);
        this.store.dispatch(actions.sourceAccountChange(accountId));
    }

    /**
     * Destination account select callback
     * @param {object} obj - selected item
     */
    onDestAccountSelect(obj) {
        const accountId = parseInt(obj.id, 10);
        this.store.dispatch(actions.destAccountChange(accountId));
    }

    /**
     * Debt account select callback
     * @param {object} obj - selected item
     */
    onDebtAccountSelect(obj) {
        const accountId = parseInt(obj.id, 10);
        this.store.dispatch(actions.debtAccountChange(accountId));
    }

    /**
     * Person select callback
     * @param {object} obj - selected item
     */
    onPersonSelect(obj) {
        const personId = parseInt(obj.id, 10);
        this.store.dispatch(actions.personChange(personId));
    }

    /**
     * Source currency select callback
     * @param {object} obj - selected item
     */
    onSrcCurrencySel(obj) {
        const currencyId = parseInt(obj.id, 10);
        this.store.dispatch(actions.sourceCurrencyChange(currencyId));
    }

    /**
     * Destination currency select callback
     * @param {object} obj - selected item
     */
    onDestCurrencySel(obj) {
        const currencyId = parseInt(obj.id, 10);
        this.store.dispatch(actions.destCurrencyChange(currencyId));
    }

    /**
     * Account disable button click event handler
     */
    toggleEnableAccount() {
        this.store.dispatch(actions.toggleDebtAccount());
    }

    /**
     * Set currency sign for specified field
     * @param {string} obj - currency sign element id
     * @param {DropDown} ddown - DropDown object
     * @param {number} currencyId - currency id
     */
    setSign(elem, ddown, currencyId) {
        const signElem = (typeof elem === 'string') ? ge(elem) : elem;
        if (!signElem) {
            return;
        }

        const curr = window.app.model.currency.getItem(currencyId);
        if (!curr) {
            return;
        }

        signElem.textContent = curr.sign;

        if (ddown) {
            ddown.setSelection(currencyId);
        }
    }

    /** Enable/disable specified currency button */
    enableCurrencySelect(currBtn, signElem, ddown, value) {
        currBtn.classList.toggle('btn', value);
        currBtn.classList.toggle('input-group__btn', value);
        currBtn.classList.toggle('input-group__text', !value);
        signElem.classList.toggle('input-group__btn-title', value);
        signElem.classList.toggle('input-group__text-title', !value);

        if (ddown) {
            ddown.enable(value);
        }
    }

    /** Enable/disable source currency button */
    enableSourceCurrencySelect(value) {
        this.enableCurrencySelect(
            this.srcCurrBtn.elem,
            this.srcAmountSign,
            this.srcCurrDDList,
            value,
        );
    }

    /** Enable/disable destination currency button */
    enableDestCurrencySelect(value) {
        this.enableCurrencySelect(
            this.destCurrBtn.elem,
            this.destAmountSign,
            this.destCurrDDList,
            value,
        );
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
        const valid = window.app.isValidDateString(state.form.date);
        if (!valid) {
            this.store.dispatch(actions.invalidateDate());
        }
    }

    onSourceAmountInput(e) {
        this.store.dispatch(actions.sourceAmountChange(e.target.value));
    }

    onDestAmountInput(e) {
        this.store.dispatch(actions.destAmountChange(e.target.value));
    }

    onExchangeInput(e) {
        this.store.dispatch(actions.exchangeChange(e.target.value));
    }

    onSourceResultInput(e) {
        this.store.dispatch(actions.sourceResultChange(e.target.value));
    }

    onDestResultInput(e) {
        this.store.dispatch(actions.destResultChange(e.target.value));
    }

    onToggleExchange() {
        this.store.dispatch(actions.toggleExchange());
    }

    onDateInput(e) {
        this.store.dispatch(actions.dateChange(e.target.value));
    }

    onCategoryChanged(category) {
        const categoryId = parseInt(category.id, 10);
        this.store.dispatch(actions.categoryChange(categoryId));
    }

    onCommentInput(e) {
        this.store.dispatch(actions.commentChange(e.target.value));
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

        this.validateDate(state);

        const { validation } = this.store.getState();
        const valid = validation.destAmount && validation.sourceAmount && validation.date;
        if (valid) {
            this.submitTransaction();
        }
    }

    async submitTransaction() {
        const state = this.store.getState();
        if (state.submitStarted) {
            return;
        }

        this.startSubmit();

        const { transaction } = state;
        const request = {
            type: transaction.type,
            src_amount: transaction.src_amount,
            dest_amount: transaction.dest_amount,
            src_curr: transaction.src_curr,
            dest_curr: transaction.dest_curr,
            date: transaction.date,
            category_id: transaction.category_id,
            comment: transaction.comment,
        };

        if (state.isUpdate) {
            request.id = transaction.id;
        }

        if (request.type === DEBT) {
            request.person_id = transaction.person_id;
            request.op = transaction.debtType ? 1 : 2;
            request.acc_id = transaction.noAccount ? 0 : state.account.id;
        } else {
            request.src_id = transaction.src_id;
            request.dest_id = transaction.dest_id;
        }

        if (request.type === LIMIT_CHANGE && request.dest_amount < 0) {
            request.src_amount = Math.abs(request.src_amount);
            request.dest_amount = Math.abs(request.dest_amount);
            request.src_id = request.dest_id;
            request.dest_id = 0;
        }

        try {
            if (state.isUpdate) {
                await API.transaction.update(request);
            } else {
                await API.transaction.create(request);
            }

            window.app.navigateNext();
        } catch (e) {
            this.cancelSubmit();
            window.app.createErrorNotification(e.message);
        }
    }

    async deleteTransaction() {
        const state = this.store.getState();
        if (state.submitStarted || !state.isUpdate) {
            return;
        }

        this.startSubmit();

        try {
            await API.transaction.del({ id: state.transaction.id });

            window.app.navigateNext();
        } catch (e) {
            this.cancelSubmit();
            window.app.createErrorNotification(e.message);
        }
    }

    /**
     * Create and show transaction delete warning popup
     */
    confirmDelete() {
        ConfirmDialog.create({
            id: 'delete_warning',
            title: __('TR_DELETE'),
            content: __('MSG_TRANS_DELETE'),
            onConfirm: () => this.deleteTransaction(),
        });
    }

    replaceHistory(state) {
        const { baseURL } = window.app;
        const { transaction } = state;
        const baseAddress = (state.isUpdate)
            ? `${baseURL}transactions/update/${transaction.id}`
            : `${baseURL}transactions/create/`;

        const url = new URL(baseAddress);
        const typeStr = Transaction.getTypeString(transaction.type);
        url.searchParams.set('type', typeStr);

        if (state.isAvailable) {
            if (transaction.type === EXPENSE || transaction.type === TRANSFER) {
                url.searchParams.set('acc_id', transaction.src_id);
            } else if (transaction.type === INCOME) {
                url.searchParams.set('acc_id', transaction.dest_id);
            } else if (transaction.type === DEBT) {
                url.searchParams.set('person_id', state.person.id);
                const accountId = (transaction.noAccount) ? 0 : state.account.id;
                url.searchParams.set('acc_id', accountId);
            }
        }

        const title = (state.isUpdate)
            ? `${__('APP_NAME')} | ${__('TR_UPDATE')}`
            : `${__('APP_NAME')} | ${__('TR_CREATE')}`;

        window.history.replaceState({}, title, url);
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
        this.resBalanceDestSwitch(HIDE_BOTH);

        if (state.id === STATE.E_D_AMOUNT) {
            this.srcAmountSwitch(HIDE_BOTH);
            this.destAmountSwitch(SHOW_INPUT);
            this.resBalanceSwitch(SHOW_INFO);
            this.exchRateSwitch(HIDE_BOTH);
        } else if (state.id === STATE.E_S_RESULT) {
            this.srcAmountSwitch(HIDE_BOTH);
            this.destAmountSwitch(SHOW_INFO);
            this.resBalanceSwitch(SHOW_INPUT);
            this.exchRateSwitch(HIDE_BOTH);
        } else if (state.id === STATE.E_S_AMOUNT_D_AMOUNT) {
            this.srcAmountSwitch(SHOW_INPUT);
            this.destAmountSwitch(SHOW_INPUT);
            this.resBalanceSwitch(SHOW_INFO);
            this.exchRateSwitch(SHOW_INFO);
        } else if (state.id === STATE.E_S_AMOUNT_EXCH) {
            this.srcAmountSwitch(SHOW_INPUT);
            this.destAmountSwitch(SHOW_INFO);
            this.resBalanceSwitch(SHOW_INFO);
            this.exchRateSwitch(SHOW_INPUT);
        } else if (state.id === STATE.E_S_AMOUNT_S_RESULT) {
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

        this.srcResBalanceRow.setTitle(__('TR_RESULT'));
        this.destResBalanceRow.setTitle(__('TR_RESULT'));

        this.enableSourceCurrencySelect(false);
        this.enableDestCurrencySelect(true);
    }

    renderIncome(state) {
        if (state.id === STATE.I_S_AMOUNT) {
            this.srcAmountSwitch(SHOW_INPUT);
            this.destAmountSwitch(HIDE_BOTH);
            this.resBalanceSwitch(SHOW_INFO);
            this.resBalanceDestSwitch(SHOW_INFO);
            this.exchRateSwitch(HIDE_BOTH);
        } else if (state.id === STATE.I_D_RESULT) {
            this.srcAmountSwitch(SHOW_INFO);
            this.destAmountSwitch(HIDE_BOTH);
            this.resBalanceSwitch(SHOW_INFO);
            this.resBalanceDestSwitch(SHOW_INPUT);
            this.exchRateSwitch(HIDE_BOTH);
        } else if (state.id === STATE.I_S_AMOUNT_D_AMOUNT) {
            this.srcAmountSwitch(SHOW_INPUT);
            this.destAmountSwitch(SHOW_INPUT);
            this.resBalanceSwitch(SHOW_INFO);
            this.resBalanceDestSwitch(SHOW_INFO);
            this.exchRateSwitch(SHOW_INFO);
        } else if (state.id === STATE.I_S_AMOUNT_EXCH) {
            this.srcAmountSwitch(SHOW_INPUT);
            this.destAmountSwitch(SHOW_INFO);
            this.resBalanceSwitch(SHOW_INFO);
            this.resBalanceDestSwitch(SHOW_INFO);
            this.exchRateSwitch(SHOW_INPUT);
        } else if (state.id === STATE.I_S_AMOUNT_D_RESULT) {
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

        this.srcResBalanceRow.setTitle(__('TR_RESULT'));
        this.destResBalanceRow.setTitle(__('TR_RESULT'));

        this.enableSourceCurrencySelect(true);
        this.enableDestCurrencySelect(false);
    }

    renderTransfer(state) {
        if (state.id === STATE.T_S_AMOUNT) {
            this.srcAmountSwitch(SHOW_INPUT);
            this.destAmountSwitch(HIDE_BOTH);
            this.resBalanceSwitch(SHOW_INFO);
            this.resBalanceDestSwitch(SHOW_INFO);
            this.exchRateSwitch(HIDE_BOTH);
        } else if (state.id === STATE.T_S_RESULT) {
            this.srcAmountSwitch(SHOW_INFO);
            this.destAmountSwitch(HIDE_BOTH);
            this.resBalanceSwitch(SHOW_INPUT);
            this.resBalanceDestSwitch(SHOW_INFO);
            this.exchRateSwitch(HIDE_BOTH);
        } else if (state.id === STATE.T_D_RESULT) {
            this.srcAmountSwitch(SHOW_INFO);
            this.destAmountSwitch(HIDE_BOTH);
            this.resBalanceSwitch(SHOW_INFO);
            this.resBalanceDestSwitch(SHOW_INPUT);
            this.exchRateSwitch(HIDE_BOTH);
        } else if (state.id === STATE.T_S_AMOUNT_D_AMOUNT) {
            this.srcAmountSwitch(SHOW_INPUT);
            this.destAmountSwitch(SHOW_INPUT);
            this.resBalanceSwitch(SHOW_INFO);
            this.resBalanceDestSwitch(SHOW_INFO);
            this.exchRateSwitch(SHOW_INFO);
        } else if (state.id === STATE.T_D_AMOUNT_S_RESULT) {
            this.srcAmountSwitch(SHOW_INFO);
            this.destAmountSwitch(SHOW_INPUT);
            this.resBalanceSwitch(SHOW_INPUT);
            this.resBalanceDestSwitch(SHOW_INFO);
            this.exchRateSwitch(SHOW_INFO);
        } else if (state.id === STATE.T_S_AMOUNT_D_RESULT) {
            this.srcAmountSwitch(SHOW_INPUT);
            this.destAmountSwitch(SHOW_INFO);
            this.resBalanceSwitch(SHOW_INFO);
            this.resBalanceDestSwitch(SHOW_INPUT);
            this.exchRateSwitch(SHOW_INFO);
        } else if (state.id === STATE.T_S_RESULT_D_RESULT) {
            this.srcAmountSwitch(SHOW_INFO);
            this.destAmountSwitch(SHOW_INFO);
            this.resBalanceSwitch(SHOW_INPUT);
            this.resBalanceDestSwitch(SHOW_INPUT);
            this.exchRateSwitch(SHOW_INFO);
        } else if (state.id === STATE.T_S_AMOUNT_EXCH) {
            this.srcAmountSwitch(SHOW_INPUT);
            this.destAmountSwitch(SHOW_INFO);
            this.resBalanceSwitch(SHOW_INFO);
            this.resBalanceDestSwitch(SHOW_INFO);
            this.exchRateSwitch(SHOW_INPUT);
        } else if (state.id === STATE.T_EXCH_S_RESULT) {
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

        this.srcResBalanceRow.setTitle(`${__('TR_RESULT')} (${__('TR_SOURCE')})`);
        this.destResBalanceRow.setTitle(`${__('TR_RESULT')} (${__('TR_DESTINATION')})`);

        this.enableSourceCurrencySelect(false);
        this.enableDestCurrencySelect(false);
    }

    renderDebt(state) {
        if (state.id === STATE.DG_S_AMOUNT) {
            this.srcAmountSwitch(SHOW_INPUT);
            this.destAmountSwitch(HIDE_BOTH);
            this.resBalanceSwitch(SHOW_INFO);
            this.resBalanceDestSwitch(SHOW_INFO);
            this.exchRateSwitch(HIDE_BOTH);
        } else if (state.id === STATE.DG_S_RESULT) {
            this.srcAmountSwitch(SHOW_INFO);
            this.destAmountSwitch(HIDE_BOTH);
            this.resBalanceSwitch(SHOW_INPUT);
            this.resBalanceDestSwitch(SHOW_INFO);
            this.exchRateSwitch(HIDE_BOTH);
        } else if (state.id === STATE.DG_D_RESULT) {
            this.srcAmountSwitch(SHOW_INFO);
            this.destAmountSwitch(HIDE_BOTH);
            this.resBalanceSwitch(SHOW_INFO);
            this.resBalanceDestSwitch(SHOW_INPUT);
            this.exchRateSwitch(HIDE_BOTH);
        } else if (state.id === STATE.DT_D_AMOUNT) {
            this.srcAmountSwitch(HIDE_BOTH);
            this.destAmountSwitch(SHOW_INPUT);
            this.resBalanceSwitch(SHOW_INFO);
            this.resBalanceDestSwitch(SHOW_INFO);
            this.exchRateSwitch(HIDE_BOTH);
        } else if (state.id === STATE.DT_D_RESULT) {
            this.srcAmountSwitch(HIDE_BOTH);
            this.destAmountSwitch(SHOW_INFO);
            this.resBalanceSwitch(SHOW_INFO);
            this.resBalanceDestSwitch(SHOW_INPUT);
            this.exchRateSwitch(HIDE_BOTH);
        } else if (state.id === STATE.DT_S_RESULT) {
            this.srcAmountSwitch(HIDE_BOTH);
            this.destAmountSwitch(SHOW_INFO);
            this.resBalanceSwitch(SHOW_INPUT);
            this.resBalanceDestSwitch(SHOW_INFO);
            this.exchRateSwitch(HIDE_BOTH);
        } else if (state.id === STATE.DG_NOACC_S_AMOUNT) {
            this.srcAmountSwitch(SHOW_INPUT);
            this.destAmountSwitch(HIDE_BOTH);
            this.resBalanceSwitch(SHOW_INFO);
            this.resBalanceDestSwitch(HIDE_BOTH);
            this.exchRateSwitch(HIDE_BOTH);
        } else if (state.id === STATE.DT_NOACC_D_AMOUNT) {
            this.srcAmountSwitch(HIDE_BOTH);
            this.destAmountSwitch(SHOW_INPUT);
            this.resBalanceSwitch(HIDE_BOTH);
            this.resBalanceDestSwitch(SHOW_INFO);
            this.exchRateSwitch(HIDE_BOTH);
        } else if (state.id === STATE.DT_NOACC_D_RESULT) {
            this.srcAmountSwitch(HIDE_BOTH);
            this.destAmountSwitch(SHOW_INFO);
            this.resBalanceSwitch(HIDE_BOTH);
            this.resBalanceDestSwitch(SHOW_INPUT);
            this.exchRateSwitch(HIDE_BOTH);
        } else if (state.id === STATE.DG_NOACC_S_RESULT) {
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
            this.resBalanceSwitch(SHOW_INFO);
            this.resBalanceDestSwitch(SHOW_INFO);
            this.exchRateSwitch(SHOW_INFO);
        } else if (
            state.id === STATE.DG_D_AMOUNT_S_RESULT
            || state.id === STATE.DT_D_AMOUNT_S_RESULT
        ) {
            this.srcAmountSwitch(SHOW_INFO);
            this.destAmountSwitch(SHOW_INPUT);
            this.resBalanceSwitch(SHOW_INPUT);
            this.resBalanceDestSwitch(SHOW_INFO);
            this.exchRateSwitch(SHOW_INFO);
        } else if (state.id === STATE.DG_S_AMOUNT_EXCH) {
            this.srcAmountSwitch(SHOW_INPUT);
            this.destAmountSwitch(SHOW_INFO);
            this.resBalanceSwitch(SHOW_INFO);
            this.resBalanceDestSwitch(SHOW_INFO);
            this.exchRateSwitch(SHOW_INPUT);
        } else if (state.id === STATE.DG_S_RESULT_EXCH) {
            this.srcAmountSwitch(SHOW_INFO);
            this.destAmountSwitch(SHOW_INFO);
            this.resBalanceSwitch(SHOW_INPUT);
            this.resBalanceDestSwitch(SHOW_INFO);
            this.exchRateSwitch(SHOW_INPUT);
        } else if (
            state.id === STATE.DG_S_RESULT_D_RESULT
            || state.id === STATE.DT_S_RESULT_D_RESULT
        ) {
            this.srcAmountSwitch(SHOW_INFO);
            this.destAmountSwitch(SHOW_INFO);
            this.resBalanceSwitch(SHOW_INPUT);
            this.resBalanceDestSwitch(SHOW_INPUT);
            this.exchRateSwitch(SHOW_INFO);
        } else if (
            state.id === STATE.DG_S_AMOUNT_D_RESULT
            || state.id === STATE.DT_S_AMOUNT_D_RESULT
        ) {
            this.srcAmountSwitch(SHOW_INPUT);
            this.destAmountSwitch(SHOW_INFO);
            this.resBalanceSwitch(SHOW_INFO);
            this.resBalanceDestSwitch(SHOW_INPUT);
            this.exchRateSwitch(SHOW_INFO);
        } else if (state.id === STATE.DT_D_AMOUNT_EXCH) {
            this.srcAmountSwitch(SHOW_INFO);
            this.destAmountSwitch(SHOW_INPUT);
            this.resBalanceSwitch(SHOW_INFO);
            this.resBalanceDestSwitch(SHOW_INFO);
            this.exchRateSwitch(SHOW_INPUT);
        } else if (state.id === STATE.DT_D_RESULT_EXCH) {
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
            this.debtAccountContainer.setTitle(__('TR_NO_ACCOUNT'));
        } else {
            const title = (debtType) ? __('TR_DEST_ACCOUNT') : __('TR_SRC_ACCOUNT');
            this.debtAccountContainer.setTitle(title);
        }

        this.debtAccountContainer.closeButton.show(!noAccount);
        this.debtAccountContainer.closeButton.enable(!state.submitStarted);

        show(this.debtAccountContainer.tileBase, !noAccount);

        const { userAccounts } = window.app.model;
        show(
            this.debtAccountContainer.accountToggler,
            noAccount && userAccounts.length > 0,
        );
        this.debtAccountContainer.togglerButton.enable(!state.submitStarted);

        const srcResultTarget = __((debtType) ? 'TR_PERSON' : 'TR_ACCOUNT');
        const destResultTarget = __((debtType) ? 'TR_ACCOUNT' : 'TR_PERSON');
        this.srcResBalanceRow.setTitle(`${__('TR_RESULT')} (${srcResultTarget})`);
        this.destResBalanceRow.setTitle(`${__('TR_RESULT')} (${destResultTarget})`);

        this.enableSourceCurrencySelect(debtType);
        this.enableDestCurrencySelect(!debtType);

        this.personIdInp.value = state.person.id;

        const currencyModel = window.app.model.currency;
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
        if (state.id === STATE.L_RESULT) {
            this.srcAmountSwitch(HIDE_BOTH);
            this.destAmountSwitch(SHOW_INFO);
            this.resBalanceSwitch(HIDE_BOTH);
            this.resBalanceDestSwitch(SHOW_INPUT);
            this.exchRateSwitch(HIDE_BOTH);
        } else if (state.id === STATE.L_AMOUNT) {
            this.srcAmountSwitch(HIDE_BOTH);
            this.destAmountSwitch(SHOW_INPUT);
            this.resBalanceSwitch(HIDE_BOTH);
            this.resBalanceDestSwitch(SHOW_INFO);
            this.exchRateSwitch(HIDE_BOTH);
        }

        addChilds(this.destContainer.infoBlock, [
            this.destAmountInfo.elem,
            this.destResBalanceInfo.elem,
        ]);

        this.destResBalanceRow.setTitle(__('TR_RESULT'));

        this.enableSourceCurrencySelect(false);
        this.enableDestCurrencySelect(false);
    }

    render(state, prevState = {}) {
        if (!state) {
            throw new Error('Invalid state');
        }

        this.replaceHistory(state);

        const { transaction } = state;

        if (!state.isAvailable) {
            let message;
            if (transaction.type === EXPENSE || transaction.type === INCOME) {
                message = __('TR_NO_ACCOUNTS');
            } else if (transaction.type === TRANSFER) {
                message = __('TR_TRANSFER_NO_ACCOUNTS');
            } else if (transaction.type === DEBT) {
                message = __('TR_DEBT_NO_PERSONS');
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

        this.dateRow.show(state.isAvailable);
        this.dateInput.value = state.form.date;

        this.categoryRow.show(state.isAvailable);
        this.commentRow.show(state.isAvailable);
        show(this.submitControls, state.isAvailable);

        if (!state.isAvailable) {
            return;
        }

        const currencyModel = window.app.model.currency;
        const srcCurrency = currencyModel.getItem(transaction.src_curr);
        const destCurrency = currencyModel.getItem(transaction.dest_curr);

        let sourceAmountLbl;
        let destAmountLbl;
        if (transaction.type === LIMIT_CHANGE) {
            sourceAmountLbl = '';
            destAmountLbl = __('TR_LIMIT_DELTA');
        } else {
            sourceAmountLbl = (state.isDiff) ? __('TR_SRC_AMOUNT') : __('TR_AMOUNT');
            destAmountLbl = (state.isDiff) ? __('TR_DEST_AMOUNT') : __('TR_AMOUNT');
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
        this.srcAmountRow.setTitle(sourceAmountLbl);
        this.srcAmountInput.setState((inpState) => ({
            ...inpState,
            digits: srcCurrency.precision,
        }));
        this.srcAmountInput.value = state.form.sourceAmount;
        enable(this.srcAmountInput.elem, !state.submitStarted);
        window.app.setValidation(this.srcAmountRow.elem, state.validation.sourceAmount);

        // Source currency
        this.srcCurrInp.value = transaction.src_curr;
        this.setSign(this.srcAmountSign, this.srcCurrDDList, transaction.src_curr);
        if (
            transaction.type === INCOME
            || (transaction.type === DEBT && transaction.debtType)
        ) {
            this.initSrcCurrList(state);
        }
        this.srcCurrBtn.enable(!state.submitStarted);

        // Destination amount field
        this.destAmountRow.setTitle(destAmountLbl);
        this.destAmountInput.setState((inpState) => ({
            ...inpState,
            digits: destCurrency.precision,
        }));
        this.destAmountInput.value = state.form.destAmount;
        enable(this.destAmountInput.elem, !state.submitStarted);
        window.app.setValidation(this.destAmountRow.elem, state.validation.destAmount);

        // Destination currency
        this.destCurrInp.value = transaction.dest_curr;
        this.setSign(this.destAmountSign, this.destCurrDDList, transaction.dest_curr);
        if (
            transaction.type === EXPENSE
            || (transaction.type === DEBT && !transaction.debtType)
        ) {
            this.initDestCurrList(state);
        }
        this.destCurrBtn.enable(!state.submitStarted);

        // Exchange rate field
        this.exchangeInput.value = (state.form.useBackExchange)
            ? state.form.backExchange
            : state.form.exchange;
        this.exchangeInput.enable(!state.submitStarted);
        this.renderExchangeRate(state);

        // Source result field
        this.srcResBalanceInput.setState((inpState) => ({
            ...inpState,
            digits: srcCurrency.precision,
        }));
        this.srcResBalanceInput.value = state.form.sourceResult;
        enable(this.srcResBalanceInput.elem, !state.submitStarted);
        this.setSign(this.srcResBalanceSign.elem, null, transaction.src_curr);

        // Destination result field
        this.destResBalanceInput.setState((inpState) => ({
            ...inpState,
            digits: destCurrency.precision,
        }));
        this.destResBalanceInput.value = state.form.destResult;
        this.destResBalanceInput.enable(!state.submitStarted);
        this.setSign(this.destResBalanceSign.elem, null, transaction.dest_curr);

        // Date field
        this.dateInput.enable(!state.submitStarted);
        this.dateInputBtn.enable(!state.submitStarted);
        window.app.setValidation(this.dateRow.elem, state.validation.date);

        // Category field
        this.categorySelect.setType(transaction.type);
        this.categorySelect.setSelection(transaction.category_id);
        this.categorySelect.enable(!state.submitStarted);

        // Comment field
        this.commentInput.value = state.form.comment;
        this.commentInput.enable(!state.submitStarted);

        // Controls
        this.submitBtn.enable(!state.submitStarted);
        this.cancelBtn.show(!state.submitStarted);

        if (this.deleteBtn) {
            this.deleteBtn.enable(!state.submitStarted);
        }

        this.spinner.show(state.submitStarted);
    }
}

window.app = new Application(window.appProps);
window.app.createView(TransactionView);
