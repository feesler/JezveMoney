import 'jezvejs/style';
import {
    ge,
    isNum,
    show,
    enable,
    setEmptyClick,
    checkDate,
    insertAfter,
} from 'jezvejs';
import { formatDate } from 'jezvejs/DateUtils';
import { DropDown } from 'jezvejs/DropDown';
import { DatePicker } from 'jezvejs/DatePicker';
import { DecimalInput } from 'jezvejs/DecimalInput';
import {
    EXPENSE,
    INCOME,
    DEBT,
    TRANSFER,
    fixFloat,
    isValidValue,
    normalize,
    normalizeExch,
} from '../../js/app.js';
import { View } from '../../js/View.js';
import { CurrencyList } from '../../js/model/CurrencyList.js';
import { IconList } from '../../js/model/IconList.js';
import { AccountList } from '../../js/model/AccountList.js';
import { PersonList } from '../../js/model/PersonList.js';
import { ConfirmDialog } from '../../Components/ConfirmDialog/ConfirmDialog.js';
import { Tile } from '../../Components/Tile/Tile.js';
import { AccountTile } from '../../Components/AccountTile/AccountTile.js';
import { TileInfoItem } from '../../Components/TileInfoItem/TileInfoItem.js';
import { IconLink } from '../../Components/IconLink/IconLink.js';
import '../../css/app.css';
import '../../Components/TransactionTypeMenu/style.css';
import './style.css';
import { createStore } from '../../js/store.js';
import {
    debtAccountChange,
    destAccountChange,
    destAmountChange,
    destAmountClick,
    destCurrencyChange,
    destResultChange,
    destResultClick,
    exchangeChange,
    exchangeClick,
    invalidateSourceAmount,
    invalidateDestAmount,
    invalidateDate,
    personChange,
    sourceAccountChange,
    sourceAmountChange,
    sourceAmountClick,
    sourceCurrencyChange,
    sourceResultChange,
    sourceResultClick,
    toggleDebtAccount,
    toggleDebtType,
    calculateExchange,
    reducer,
} from './reducer.js';

const singleTransDeleteTitle = 'Delete transaction';
const singleTransDeleteMsg = 'Are you sure want to delete selected transaction?<br>Changes in the balance of affected accounts will be canceled.';

/**
 * Create/update transaction view
 */
class TransactionView extends View {
    constructor(...args) {
        super(...args);
        const availModes = ['create', 'update'];

        if (!('profile' in this.props)
            || !('currency' in this.props)
            || !('accounts' in this.props)
            || !('transaction' in this.props)
            || !('icons' in this.props)) {
            throw new Error('Invalid Transaction view properties');
        }

        if (!window.app.model) {
            window.app.model = {};
        }

        window.app.model.profile = { ...this.props.profile };

        const currencyModel = CurrencyList.create(this.props.currency);
        window.app.model.currency = currencyModel;

        window.app.model.icons = IconList.create(this.props.icons);

        const accountModel = AccountList.create(this.props.accounts);
        window.app.model.accounts = accountModel;

        if (this.props.persons) {
            window.app.model.persons = PersonList.create(this.props.persons);
        }

        this.mode = this.props.mode;
        if (!availModes.includes(this.mode)) {
            throw new Error(`Invalid Transaction view mode: ${this.mode}`);
        }
        if (this.props.mode === 'update') {
            accountModel.cancelTransaction(this.props.transaction);
        }

        const userAccounts = AccountList.create(
            accountModel.getUserAccounts(window.app.model.profile.owner_id),
        );
        window.app.model.visibleUserAccounts = AccountList.create(userAccounts.getVisible());

        const { transaction } = this.props;

        const initialState = {
            id: 0,
            transaction: { ...transaction },
            form: {
                sourceAmount: '',
                destAmount: '',
                sourceResult: '',
                fSourceResult: 0,
                destResult: '',
                fDestResult: 0,
                exchange: 1,
                fExchange: 1,
            },
            validation: {
                sourceAmount: true,
                destAmount: true,
                date: true,
            },
            srcAccount: { ...accountModel.getItem(transaction.src_id) },
            destAccount: { ...accountModel.getItem(transaction.dest_id) },
            srcCurrency: { ...currencyModel.getItem(transaction.src_curr) },
            destCurrency: { ...currencyModel.getItem(transaction.dest_curr) },
            isDiff: transaction.src_curr !== transaction.dest_curr,
            isUpdate: this.props.mode === 'update',
        };

        if (transaction.id) {
            initialState.form.sourceAmount = transaction.src_amount;
            initialState.form.destAmount = transaction.dest_amount;
        }

        if (initialState.srcAccount) {
            const srcBalance = initialState.srcAccount.balance;
            const srcResult = normalize(srcBalance - initialState.transaction.src_amount);

            initialState.form.sourceResult = srcResult;
            initialState.form.fSourceResult = srcResult;
        }

        if (initialState.destAccount) {
            const destBalance = initialState.destAccount.balance;
            const destResult = normalize(destBalance + initialState.transaction.dest_amount);

            initialState.form.destResult = destResult;
            initialState.form.fDestResult = destResult;
        }

        if (transaction.type === EXPENSE || transaction.type === INCOME) {
            initialState.id = (initialState.isDiff) ? 2 : 0;
        } else if (transaction.type === TRANSFER) {
            initialState.id = (initialState.isDiff) ? 3 : 0;
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

                initialState.id = (initialState.transaction.noAccount) ? 6 : 0;
            } else {
                initialState.destAccount = initialState.personAccount;
                initialState.account = initialState.srcAccount;

                initialState.id = (transaction.noAccount) ? 7 : 3;
            }

            if (transaction.noAccount) {
                const lastAcc = window.app.model.accounts.getItem(transaction.lastAcc_id);
                if (transaction.debtType) {
                    const destResult = normalize(lastAcc.balance);
                    initialState.form.destResult = destResult;
                    initialState.form.fDestResult = destResult;
                } else {
                    const sourceResult = normalize(lastAcc.balance);
                    initialState.form.sourceResult = sourceResult;
                    initialState.form.fSourceResult = sourceResult;
                }
            }
        }

        const exchange = calculateExchange(initialState);
        initialState.form.fExchange = exchange;
        initialState.form.exchange = exchange;

        this.store = createStore(reducer, initialState);
        this.store.subscribe((state) => this.render(state));
    }

    /**
     * View initialization
     */
    onStart() {
        const state = this.store.getState();
        const { transaction } = state;

        this.submitStarted = false;
        // Init form submit event handler
        this.form = ge('mainfrm');
        if (!this.form) {
            throw new Error('Failed to initialize Transaction view');
        }
        this.form.addEventListener('submit', (e) => this.onFormSubmit(e));

        if (state.isUpdate) {
            this.deleteBtn = IconLink.fromElement({
                elem: 'del_btn',
                onclick: () => this.confirmDelete(),
            });
            this.deleteForm = ge('delform');
        }

        this.srcContainer = ge('source');
        if (this.srcContainer) {
            this.srcTileBase = this.srcContainer.querySelector('.tile-base');
            this.srcTileContainer = this.srcContainer.querySelector('.tile_container');
            this.srcTileInfoBlock = this.srcContainer.querySelector('.tile-info-block');
        }

        this.destContainer = ge('destination');
        if (this.destContainer) {
            this.destTileBase = this.destContainer.querySelector('.tile-base');
            this.destTileContainer = this.destContainer.querySelector('.tile_container');
            this.destTileInfoBlock = this.destContainer.querySelector('.tile-info-block');
        }

        const srcTileElem = ge('source_tile');
        this.srcTile = (srcTileElem) ? AccountTile.fromElement({ elem: srcTileElem }) : null;

        const destTileElem = ge('dest_tile');
        this.destTile = (destTileElem) ? AccountTile.fromElement({ elem: destTileElem }) : null;

        this.srcAmountInfo = TileInfoItem.fromElement({
            elem: 'src_amount_left',
            onclick: () => this.store.dispatch(sourceAmountClick()),
        });
        this.destAmountInfo = TileInfoItem.fromElement({
            elem: 'dest_amount_left',
            onclick: () => this.store.dispatch(destAmountClick()),
        });
        this.exchangeInfo = TileInfoItem.fromElement({
            elem: 'exch_left',
            onclick: () => this.store.dispatch(exchangeClick()),
        });
        this.srcResBalanceInfo = TileInfoItem.fromElement({
            elem: 'src_res_balance_left',
            onclick: () => this.store.dispatch(sourceResultClick()),
        });
        this.destResBalanceInfo = TileInfoItem.fromElement({
            elem: 'dest_res_balance_left',
            onclick: () => this.store.dispatch(destResultClick()),
        });

        this.srcAmountRow = ge('src_amount_row');
        if (this.srcAmountRow) {
            this.srcAmountRowLabel = this.srcAmountRow.querySelector('label');
        }
        this.srcAmountInput = DecimalInput.create({
            elem: ge('src_amount'),
            oninput: (e) => this.onSourceAmountInput(e),
        });
        this.srcAmountSign = ge('srcamountsign');

        this.destAmountRow = ge('dest_amount_row');
        if (this.destAmountRow) {
            this.destAmountRowLabel = this.destAmountRow.querySelector('label');
        }
        this.destAmountInput = DecimalInput.create({
            elem: ge('dest_amount'),
            oninput: (e) => this.onDestAmountInput(e),
        });
        this.destAmountSign = ge('destamountsign');

        this.srcResBalanceRow = ge('result_balance');
        if (this.srcResBalanceRow) {
            this.srcResBalanceRowLabel = this.srcResBalanceRow.querySelector('label');
        }
        this.srcResBalanceInput = DecimalInput.create({
            elem: ge('resbal'),
            oninput: (e) => this.onSourceResultInput(e),
        });
        this.srcResBalanceSign = ge('res_currsign');

        this.destResBalanceRow = ge('result_balance_dest');
        if (this.destResBalanceRow) {
            this.destResBalanceRowLabel = this.destResBalanceRow.querySelector('label');
        }
        this.destResBalanceInput = DecimalInput.create({
            elem: ge('resbal_d'),
            oninput: (e) => this.onDestResultInput(e),
        });
        this.destResBalanceSign = ge('res_currsign_d');

        this.exchangeRow = ge('exchange');
        if (this.exchangeRow) {
            this.exchangeRowLabel = this.exchangeRow.querySelector('label');
        }
        this.exchangeInput = DecimalInput.create({
            elem: ge('exchrate'),
            oninput: (e) => this.onExchangeInput(e),
        });
        this.exchangeSign = ge('exchcomm');

        this.datePickerBtn = IconLink.fromElement({
            elem: 'calendar_btn',
            onclick: () => this.showCalendar(),
        });
        this.dateBlock = ge('date_block');
        this.datePickerWrapper = ge('calendar');

        this.dateInputBtn = ge('cal_rbtn');
        if (this.dateInputBtn) {
            this.dateInputBtn.addEventListener('click', () => this.showCalendar());
        }
        this.dateInput = ge('date');

        this.commentBtn = IconLink.fromElement({
            elem: 'comm_btn',
            onclick: () => this.showComment(),
        });
        this.commentBlock = ge('comment_block');
        this.commentInput = ge('comm');

        if (transaction.type === EXPENSE || transaction.type === TRANSFER) {
            this.srcIdInp = ge('src_id');
        }
        if (transaction.type === INCOME || transaction.type === TRANSFER) {
            this.destIdInp = ge('dest_id');
        }

        this.srcCurrInp = ge('src_curr');
        this.destCurrInp = ge('dest_curr');

        if (transaction.type === DEBT) {
            this.personIdInp = ge('person_id');
            if (this.personIdInp) {
                this.personAccount = window.app.model.accounts.getPersonAccount(
                    this.personIdInp.value,
                    transaction.src_curr,
                );
            }

            this.debtAccountInp = ge('acc_id');
            this.debtAccountTile = AccountTile.fromElement({ elem: 'acc_tile', parent: this });
            if (!transaction.noAccount) {
                if (this.debtAccountInp) {
                    this.debtAccount = window.app.model.accounts.getItem(this.debtAccountInp.value);
                }
            }
        }

        if (transaction.type === DEBT) {
            this.noAccountBtn = ge('noacc_btn');
            if (this.noAccountBtn) {
                this.noAccountBtn.addEventListener('click', () => this.toggleEnableAccount());
            }
            this.selectAccountBtn = ge('selaccount');
            if (this.selectAccountBtn) {
                const accountToggleBtn = this.selectAccountBtn.querySelector('button');
                if (accountToggleBtn) {
                    accountToggleBtn.addEventListener('click', () => this.toggleEnableAccount());
                }
            }

            this.debtAccountLabel = ge('acclbl');

            this.debtGiveRadio = ge('debtgive');
            if (this.debtGiveRadio) {
                this.debtGiveRadio.addEventListener('change', () => this.onChangeDebtOp());
            }
            this.debtTakeRadio = ge('debttake');
            if (this.debtTakeRadio) {
                this.debtTakeRadio.addEventListener('change', () => this.onChangeDebtOp());
            }

            this.personTile = Tile.fromElement({ elem: 'person_tile', parent: this });

            this.persDDList = DropDown.create({
                input_id: 'person_tile',
                listAttach: true,
                onitemselect: (item) => this.onPersonSelect(item),
                editable: false,
            });

            const visiblePersons = window.app.model.persons.getVisible();
            visiblePersons.forEach(
                (person) => this.persDDList.addItem({ id: person.id, title: person.name }),
            );

            const personId = parseInt(this.personIdInp.value, 10);
            this.appendHiddenPerson(this.persDDList, personId);
            this.persDDList.selectItem(personId);

            if (!transaction.noAccount) {
                this.initAccList();
            }
        } else {
            this.srcDDList = DropDown.create({
                input_id: 'source_tile',
                listAttach: true,
                onitemselect: (item) => this.onSrcAccountSelect(item),
                editable: false,
            });

            if (this.srcDDList) {
                window.app.model.visibleUserAccounts.forEach(
                    (acc) => this.srcDDList.addItem({ id: acc.id, title: acc.name }),
                );

                this.appendHiddenAccount(this.srcDDList, transaction.src_id);
                this.appendHiddenAccount(this.srcDDList, transaction.dest_id);
                this.srcDDList.selectItem(transaction.src_id);
            }

            this.destDDList = DropDown.create({
                input_id: 'dest_tile',
                listAttach: true,
                onitemselect: (item) => this.onDestAccountSelect(item),
                editable: false,
            });
            if (this.destDDList) {
                window.app.model.visibleUserAccounts.forEach(
                    (acc) => this.destDDList.addItem({ id: acc.id, title: acc.name }),
                );

                this.appendHiddenAccount(this.destDDList, transaction.src_id);
                this.appendHiddenAccount(this.destDDList, transaction.dest_id);
                this.destDDList.selectItem(transaction.dest_id);
            }
        }

        if (transaction.type === INCOME) {
            this.srcCurrDDList = DropDown.create({
                input_id: 'srcamountsign',
                listAttach: true,
                onitemselect: (item) => this.onSrcCurrencySel(item),
                editable: false,
            });
            window.app.model.currency.forEach(
                (curr) => this.srcCurrDDList.addItem({ id: curr.id, title: curr.name }),
            );
            this.srcCurrDDList.selectItem(transaction.src_curr);
        }

        if (transaction.type === EXPENSE) {
            this.destCurrDDList = DropDown.create({
                input_id: 'destamountsign',
                listAttach: true,
                onitemselect: (item) => this.onDestCurrencySel(item),
                editable: false,
            });
            window.app.model.currency.forEach(
                (curr) => this.destCurrDDList.addItem({ id: curr.id, title: curr.name }),
            );
            this.destCurrDDList.selectItem(transaction.dest_curr);
        }

        this.submitBtn = ge('submitbtn');
    }

    /**
     * Check account is hidden and then append it to the end of list
     * @param {DropDown} dropDown
     * @param {Number} accountId
     */
    appendHiddenAccount(dropDown, accountId) {
        if (!accountId) {
            return;
        }

        const account = window.app.model.accounts.find((item) => item.id === accountId);
        if (account && !account.isVisible()) {
            dropDown.addItem({ id: account.id, title: account.name });
            // TODO : add to visibleUserAccounts
        }
    }

    /**
     * Check person is hidden and then append it to the end of list
     * @param {DropDown} dropDown
     * @param {Number} personId
     */
    appendHiddenPerson(dropDown, personId) {
        if (!personId) {
            return;
        }

        const person = window.app.model.persons.find((item) => item.id === personId);
        if (person && !person.isVisible()) {
            dropDown.addItem({ id: person.id, title: person.name });
            // TODO : add to visiblePersons
        }
    }

    /**
     * Initialize DropDown for debt account tile
     */
    initAccList() {
        this.accDDList = DropDown.create({
            input_id: 'acc_tile',
            listAttach: true,
            onitemselect: (item) => this.onDebtAccountSelect(item),
            editable: false,
        });
        // In case there is no persons, components will be not available
        if (!this.accDDList) {
            return;
        }

        window.app.model.visibleUserAccounts.forEach(
            (acc) => this.accDDList.addItem({ id: acc.id, title: acc.name }),
        );

        const state = this.store.getState();
        const accountId = (state.account) ? state.account.id : 0;
        this.appendHiddenAccount(this.accDDList, accountId);
        this.accDDList.selectItem(accountId);
    }

    /**
     * Date select callback
     * @param {Date} date - selected date object
     */
    onSelectDate(date) {
        if (!this.dateInput) {
            return;
        }

        this.dateInput.value = formatDate(date);

        this.calendarObj.hide();
    }

    /**
     * Show calendar block
     */
    showCalendar() {
        if (!this.calendarObj) {
            this.calendarObj = DatePicker.create({
                wrapper: this.datePickerWrapper,
                relparent: this.datePickerWrapper.parentNode,
                locales: 'en',
                ondateselect: (d) => this.onSelectDate(d),
            });
        }
        if (!this.calendarObj) {
            return;
        }

        this.calendarObj.show(!this.calendarObj.visible());

        this.datePickerBtn.hide();
        show(this.dateBlock, true);

        setEmptyClick(() => this.calendarObj.hide(), [
            this.datePickerWrapper,
            this.datePickerBtn.elem,
            this.dateInputBtn,
        ]);
    }

    /**
     * Show comment field
     */
    showComment() {
        this.commentBtn.hide();
        show(this.commentBlock, true);
        this.commentInput.focus();
    }

    /**
     * Common function for toggle switch
     * @param {string|Element} inputRow - input row element
     * @param {string|Element} infoBlock - info block element
     * @param {string|Element} inputObj - decimal input object
     * @param {boolean} showInput - show/hide flag
     */
    commonSwitch(inputRow, infoBlock, inputObj, showInput) {
        const toShow = !!showInput;

        show(inputRow, toShow);
        if (infoBlock) {
            infoBlock.show(!toShow);
        }
    }

    /**
     * Show input control or static block for source amount value
     * @param {boolean} showInput - if set ot true show input row, else show info block
     */
    srcAmountSwitch(showInput) {
        this.commonSwitch(this.srcAmountRow, this.srcAmountInfo, this.srcAmountInput, showInput);
    }

    /**
     * Show input control or static block for destination amount value
     * @param {boolean} showInput - if set ot true show input row, else show info block
     */
    destAmountSwitch(showInput) {
        this.commonSwitch(this.destAmountRow, this.destAmountInfo, this.destAmountInput, showInput);
    }

    /**
     * Show input control or static block for source result balance value
     * @param {boolean} showInput - if set ot true show input row, else show info block
     */
    resBalanceSwitch(showInput) {
        this.commonSwitch(
            this.srcResBalanceRow,
            this.srcResBalanceInfo,
            this.srcResBalanceInput,
            showInput,
        );
    }

    /**
     * Show input control or static block for destination result balance value
     * @param {boolean} showInput - if set ot true show input row, else show info block
     */
    resBalanceDestSwitch(showInput) {
        this.commonSwitch(
            this.destResBalanceRow,
            this.destResBalanceInfo,
            this.destResBalanceInput,
            showInput,
        );
    }

    /**
     * Show input control or static block for exchange rate value
     */
    exchRateSwitch(showInput) {
        this.commonSwitch(this.exchangeRow, this.exchangeInfo, this.exchangeInput, showInput);
    }

    /**
     * Source account select callback
     * @param {object} obj - selected item
     */
    onSrcAccountSelect(obj) {
        const accountId = parseInt(obj.id, 10);
        this.store.dispatch(sourceAccountChange(accountId));
    }

    /**
     * Destination account select callback
     * @param {object} obj - selected item
     */
    onDestAccountSelect(obj) {
        const accountId = parseInt(obj.id, 10);
        this.store.dispatch(destAccountChange(accountId));
    }

    /**
     * Debt account select callback
     * @param {object} obj - selected item
     */
    onDebtAccountSelect(obj) {
        const accountId = parseInt(obj.id, 10);
        this.store.dispatch(debtAccountChange(accountId));
    }

    /**
     * Person select callback
     * @param {object} obj - selected item
     */
    onPersonSelect(obj) {
        const personId = parseInt(obj.id, 10);
        this.store.dispatch(personChange(personId));
    }

    /**
     * Source currency select callback
     * @param {object} obj - selected item
     */
    onSrcCurrencySel(obj) {
        const currencyId = parseInt(obj.id, 10);
        this.store.dispatch(sourceCurrencyChange(currencyId));
    }

    /**
     * Destination currency select callback
     * @param {object} obj - selected item
     */
    onDestCurrencySel(obj) {
        const currencyId = parseInt(obj.id, 10);
        this.store.dispatch(destCurrencyChange(currencyId));
    }

    /**
     * Account disable button click event handler
     */
    toggleEnableAccount() {
        this.store.dispatch(toggleDebtAccount());
    }

    /**
     * Set currency button active/inactive
     * @param {boolean} src - if set to true use source amount currency button, else destination
     * @param {boolean} act - if set to true activate currency, else inactivate
     */
    setCurrActive(src, act) {
        const amountRow = (src) ? this.srcAmountRow : this.destAmountRow;
        if (!amountRow) {
            return;
        }

        const currBtn = amountRow.querySelector('.input-group__btn');
        const inputContainer = amountRow.querySelector('.stretch-input');
        if (!currBtn || !inputContainer) {
            return;
        }

        if (act) {
            currBtn.classList.remove('input-group__btn_inactive');
            inputContainer.classList.remove('trans_input');
            inputContainer.classList.add('rbtn_input');
        } else {
            currBtn.classList.add('input-group__btn_inactive');
            inputContainer.classList.add('trans_input');
            inputContainer.classList.remove('rbtn_input');
        }
    }

    /**
     * Set full/short text for source or destination input label
     * @param {boolean} src - if true set source amount, else destination amount
     * @param {boolean} full - if true set full amount label, else set short
     */
    setAmountInputLabel(src, full) {
        const labelElem = (src) ? this.srcAmountRowLabel : this.destAmountRowLabel;
        if (!labelElem) {
            return;
        }

        if (full) {
            labelElem.textContent = (src) ? 'Source amount' : 'Destination amount';
        } else {
            labelElem.textContent = 'Amount';
        }
    }

    /**
     * Set full/short text for source or destination amount tile block label
     * @param {boolean} src - if true set source amount, else destination amount
     * @param {boolean} full - if true set full amount label, else set short
     */
    setAmountTileBlockLabel(src, full) {
        const amountBlock = (src) ? this.srcAmountInfo : this.destAmountInfo;
        if (!amountBlock) {
            return;
        }

        const labelElem = amountBlock.firstElementChild;
        if (!labelElem) {
            return;
        }

        if (full) {
            labelElem.textContent = (src) ? 'Source amount' : 'Destination amount';
        } else {
            labelElem.textContent = 'Amount';
        }
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
            ddown.selectItem(currencyId);
        }
    }

    /**
     * Common transaction 'submit' event handler
     */
    onFormSubmit(e) {
        if (this.submitStarted) {
            e.preventDefault();
            return;
        }

        const state = this.store.getState();
        const { sourceAmount, destAmount } = state.form;
        let valid = true;

        if (
            state.transaction.src_amount <= 0
            || !isNum(fixFloat(sourceAmount))
        ) {
            this.store.dispatch(invalidateSourceAmount());
            valid = false;
        }

        if (
            state.isDiff
            && (
                state.transaction.dest_amount <= 0
                || !isNum(fixFloat(destAmount))
            )
        ) {
            this.store.dispatch(invalidateDestAmount());
            valid = false;
        }

        if (!checkDate(this.dateInput.value)) {
            this.store.dispatch(invalidateDate());
            valid = false;
        }

        if (valid) {
            this.srcAmountInput.value = fixFloat(sourceAmount);
            this.destAmountInput.value = fixFloat(destAmount);
            this.submitStarted = true;
            enable(this.submitBtn, false);
        } else {
            e.preventDefault();
        }
    }

    /**
     * Debt operation type change event handler
     */
    onChangeDebtOp() {
        const debtType = this.debtGiveRadio.checked;
        const state = this.store.getState();

        if (state.transaction.debtType !== debtType) {
            this.store.dispatch(toggleDebtType());
        }
    }

    onSourceAmountInput(e) {
        this.store.dispatch(sourceAmountChange(e.target.value));
    }

    onDestAmountInput(e) {
        this.store.dispatch(destAmountChange(e.target.value));
    }

    onExchangeInput(e) {
        this.store.dispatch(exchangeChange(e.target.value));
    }

    onSourceResultInput(e) {
        this.store.dispatch(sourceResultChange(e.target.value));
    }

    onDestResultInput(e) {
        this.store.dispatch(destResultChange(e.target.value));
    }

    /**
     * Create and show transaction delete warning popup
     */
    confirmDelete() {
        ConfirmDialog.create({
            id: 'delete_warning',
            title: singleTransDeleteTitle,
            content: singleTransDeleteMsg,
            onconfirm: () => this.deleteForm.submit(),
        });
    }

    renderExchangeRate(state) {
        const srcCurr = state.srcCurrency;
        const destCurr = state.destCurrency;

        const exchSigns = `${destCurr.sign}/${srcCurr.sign}`;
        this.exchangeSign.textContent = exchSigns;

        let exchText = exchSigns;
        const normExch = normalizeExch(state.form.exchange);
        if (isValidValue(normExch) && normExch !== 1 && normExch !== 0) {
            const fsa = state.transaction.src_amount;
            const fda = state.transaction.dest_amount;
            const invExch = parseFloat((fsa / fda).toFixed(5));

            exchText += ` (${invExch} ${srcCurr.sign}/${destCurr.sign})`;
        }

        if (this.exchangeInfo) {
            this.exchangeInfo.setTitle(`${normExch} ${exchText}`);
        }
    }

    renderExpense(state) {
        if (state.id === 0) {
            this.srcAmountSwitch(false);
            this.destAmountSwitch(true);
            this.resBalanceSwitch(false);
            this.resBalanceDestSwitch(false);
            show(this.exchangeRow, false);
            this.exchangeInfo.hide();
        } else if (state.id === 1) {
            this.srcAmountSwitch(false);
            this.destAmountSwitch(false);
            this.resBalanceSwitch(true);
            this.resBalanceDestSwitch(false);
            show(this.exchangeRow, false);
            this.exchangeInfo.hide();
        } else if (state.id === 2) {
            this.srcAmountSwitch(true);
            this.destAmountSwitch(true);
            this.resBalanceSwitch(false);
            this.resBalanceDestSwitch(false);
            this.exchRateSwitch(false);
        } else if (state.id === 3) {
            this.srcAmountSwitch(true);
            this.destAmountSwitch(false);
            this.resBalanceSwitch(false);
            this.resBalanceDestSwitch(false);
            this.exchRateSwitch(true);
        } else if (state.id === 4) {
            this.srcAmountSwitch(true);
            this.destAmountSwitch(false);
            this.resBalanceSwitch(true);
            this.resBalanceDestSwitch(false);
            this.exchRateSwitch(false);
        }

        this.setCurrActive(true, false); // set source currency inactive
        this.setCurrActive(false, true); // set destination currency active
    }

    renderIncome(state) {
        if (state.id === 0) {
            this.srcAmountSwitch(true);
            this.destAmountInfo.hide();
            show(this.destAmountRow, false);
            this.resBalanceSwitch(false);
            this.resBalanceDestSwitch(false);
            show(this.exchangeRow, false);
            this.exchangeInfo.hide();
        } else if (state.id === 1) {
            this.srcAmountSwitch(false);
            this.destAmountInfo.hide();
            show(this.destAmountRow, false);
            this.resBalanceSwitch(false);
            this.resBalanceDestSwitch(true);
            show(this.exchangeRow, false);
            this.exchangeInfo.hide();
        } else if (state.id === 2) {
            this.srcAmountSwitch(true);
            this.destAmountSwitch(true);
            this.resBalanceSwitch(false);
            this.resBalanceDestSwitch(false);
            this.exchRateSwitch(false);
        } else if (state.id === 3) {
            this.srcAmountSwitch(true);
            this.destAmountSwitch(false);
            this.resBalanceSwitch(false);
            this.resBalanceDestSwitch(false);
            this.exchRateSwitch(true);
        } else if (state.id === 4) {
            this.srcAmountSwitch(true);
            this.destAmountSwitch(false);
            this.resBalanceSwitch(false);
            this.resBalanceDestSwitch(true);
            this.exchRateSwitch(false);
        }

        this.setCurrActive(true, true); // set source currency active
        this.setCurrActive(false, false); // set destination currency inactive
    }

    renderTransfer(state) {
        if (state.id === 0) {
            this.srcAmountSwitch(true);
            this.destAmountInfo.hide();
            show(this.destAmountRow, false);
            this.resBalanceSwitch(false);
            this.resBalanceDestSwitch(false);
            show(this.exchangeRow, false);
            this.exchangeInfo.hide();
        } else if (state.id === 1) {
            this.srcAmountSwitch(false);
            this.destAmountInfo.hide();
            show(this.destAmountRow, false);
            this.resBalanceSwitch(true);
            this.resBalanceDestSwitch(false);
            show(this.exchangeRow, false);
            this.exchangeInfo.hide();
        } else if (state.id === 2) {
            this.srcAmountSwitch(false);
            this.destAmountInfo.hide();
            show(this.destAmountRow, false);
            this.resBalanceSwitch(false);
            this.resBalanceDestSwitch(true);
            show(this.exchangeRow, false);
            this.exchangeInfo.hide();
        } else if (state.id === 3) {
            this.srcAmountSwitch(true);
            this.destAmountSwitch(true);
            this.resBalanceSwitch(false);
            this.resBalanceDestSwitch(false);
            this.exchRateSwitch(false);
        } else if (state.id === 4) {
            this.srcAmountSwitch(false);
            this.destAmountSwitch(true);
            this.resBalanceSwitch(true);
            this.resBalanceDestSwitch(false);
            this.exchRateSwitch(false);
        } else if (state.id === 5) {
            this.srcAmountSwitch(true);
            this.destAmountSwitch(false);
            this.resBalanceSwitch(false);
            this.resBalanceDestSwitch(true);
            this.exchRateSwitch(false);
        } else if (state.id === 6) {
            this.srcAmountSwitch(false);
            this.destAmountSwitch(false);
            this.resBalanceSwitch(true);
            this.resBalanceDestSwitch(true);
            this.exchRateSwitch(false);
        } else if (state.id === 7) {
            this.srcAmountSwitch(true);
            this.destAmountSwitch(false);
            this.resBalanceSwitch(false);
            this.resBalanceDestSwitch(false);
            this.exchRateSwitch(true);
        } else if (state.id === 8) {
            this.srcAmountSwitch(false);
            this.destAmountSwitch(false);
            this.resBalanceSwitch(true);
            this.resBalanceDestSwitch(false);
            this.exchRateSwitch(true);
        }

        this.setCurrActive(true, false); // set source currency inactive
        this.setCurrActive(false, false); // set destination currency inactive
    }

    renderDebt(state) {
        this.destAmountInfo.hide();
        show(this.destAmountRow, false);
        show(this.exchangeRow, false);
        this.exchangeInfo.hide();

        if (state.id === 0 || state.id === 3) {
            this.srcAmountSwitch(true);
            this.resBalanceSwitch(false);
            this.resBalanceDestSwitch(false);
        } else if (state.id === 1 || state.id === 5) {
            this.srcAmountSwitch(false);
            this.resBalanceSwitch(true);
            this.resBalanceDestSwitch(false);
        } else if (state.id === 2 || state.id === 4) {
            this.srcAmountSwitch(false);
            this.resBalanceSwitch(false);
            this.resBalanceDestSwitch(true);
        } else if (state.id === 6) {
            this.srcAmountSwitch(true);
            this.resBalanceSwitch(false);
            show(this.destResBalanceRow, false);
            this.destResBalanceInfo.hide();
        } else if (state.id === 7) {
            this.srcAmountSwitch(true);
            show(this.srcResBalanceRow, false);
            this.srcResBalanceInfo.hide();
            this.resBalanceDestSwitch(false);
        } else if (state.id === 8) {
            this.srcAmountSwitch(false);
            show(this.srcResBalanceRow, false);
            this.srcResBalanceInfo.hide();
            this.resBalanceDestSwitch(true);
        } else if (state.id === 9) {
            this.srcAmountSwitch(false);
            this.resBalanceSwitch(true);
            show(this.destResBalanceRow, false);
            this.destResBalanceInfo.hide();
        }

        const { debtType, noAccount } = state.transaction;

        insertAfter(
            this.srcResBalanceInfo.elem,
            (debtType) ? this.exchangeInfo.elem : this.destAmountInfo.elem,
        );
        insertAfter(
            this.destResBalanceInfo.elem,
            (debtType) ? this.destAmountInfo.elem : this.exchangeInfo.elem,
        );

        if (noAccount) {
            this.debtAccountLabel.textContent = 'No account';
        } else {
            this.debtAccountLabel.textContent = (debtType) ? 'Destination account' : 'Source account';
        }

        show(this.noAccountBtn, !noAccount);
        show(this.srcTileBase, !noAccount);
        show(this.selectAccountBtn, noAccount);

        this.srcResBalanceRowLabel.textContent = (debtType) ? 'Result balance (Person)' : 'Result balance (Account)';
        this.destResBalanceRowLabel.textContent = (debtType) ? 'Result balance (Account)' : 'Result balance (Person)';

        this.setCurrActive(true, false); // set source currency inactive
        this.setCurrActive(false, false); // set destination currency inactive

        this.personIdInp.value = state.person.id;

        const currencyModel = window.app.model.currency;
        const srcCurrency = currencyModel.getItem(state.transaction.src_curr);
        const personBalance = srcCurrency.formatValue(state.personAccount.balance);
        this.personTile.render({
            title: state.person.name,
            subtitle: personBalance,
        });

        this.debtAccountInp.value = (noAccount) ? 0 : state.account.id;

        if (!noAccount) {
            this.debtAccountTile.render(state.account);
            if (!this.accDDList) {
                this.initAccList();
            }
        }
    }

    render(state) {
        if (!state) {
            throw new Error('Invalid state');
        }

        const { transaction } = state;

        if (transaction.type === EXPENSE) {
            this.renderExpense(state);
        } else if (transaction.type === INCOME) {
            this.renderIncome(state);
        } else if (transaction.type === TRANSFER) {
            this.renderTransfer(state);
        } else if (transaction.type === DEBT) {
            this.renderDebt(state);
        }

        if (this.srcTile) {
            this.srcTile.render(state.srcAccount);
        }
        if (this.destTile) {
            this.destTile.render(state.destAccount);
        }

        if (this.srcIdInp) {
            this.srcIdInp.value = transaction.src_id;
        }
        if (this.destIdInp) {
            this.destIdInp.value = transaction.dest_id;
        }

        if (this.srcDDList) {
            this.srcDDList.selectItem(transaction.src_id);
        }
        if (this.destDDList) {
            this.destDDList.selectItem(transaction.dest_id);
        }

        this.srcCurrInp.value = transaction.src_curr;
        this.destCurrInp.value = transaction.dest_curr;

        this.setAmountInputLabel(true, state.isDiff);
        this.setAmountInputLabel(false, state.isDiff);
        this.setAmountTileBlockLabel(true, state.isDiff);
        this.setAmountTileBlockLabel(false, state.isDiff);

        this.setSign(this.destAmountSign, this.destCurrDDList, transaction.dest_curr);
        this.setSign(this.srcAmountSign, this.srcCurrDDList, transaction.src_curr);
        this.setSign(this.srcResBalanceSign, null, transaction.src_curr);
        this.setSign(this.destResBalanceSign, null, transaction.dest_curr);
        this.renderExchangeRate(state);

        this.srcAmountInput.value = state.form.sourceAmount;
        this.destAmountInput.value = state.form.destAmount;
        if (this.exchangeInput) {
            this.exchangeInput.value = state.form.exchange;
        }
        if (this.srcResBalanceInput) {
            this.srcResBalanceInput.value = state.form.sourceResult;
        }
        if (this.destResBalanceInput) {
            this.destResBalanceInput.value = state.form.destResult;
        }

        const currencyModel = window.app.model.currency;
        const srcCurrency = currencyModel.getItem(transaction.src_curr);
        const destCurrency = currencyModel.getItem(transaction.dest_curr);

        if (this.srcAmountInfo) {
            const title = srcCurrency.formatValue(transaction.src_amount);
            this.srcAmountInfo.setTitle(title);
        }

        if (this.destAmountInfo) {
            const title = destCurrency.formatValue(transaction.dest_amount);
            this.destAmountInfo.setTitle(title);
        }

        if (this.srcResBalanceInfo) {
            const title = srcCurrency.formatValue(state.form.fSourceResult);
            this.srcResBalanceInfo.setTitle(title);
        }

        if (this.destResBalanceInfo) {
            const title = destCurrency.formatValue(state.form.fDestResult);
            this.destResBalanceInfo.setTitle(title);
        }

        if (state.validation.sourceAmount) {
            this.clearBlockValidation('src_amount_row');
        } else {
            this.invalidateBlock('src_amount_row');
        }

        if (state.validation.destAmount) {
            this.clearBlockValidation('dest_amount_row');
        } else {
            this.invalidateBlock('dest_amount_row');
        }

        if (state.validation.date) {
            this.clearBlockValidation('date_block');
        } else {
            this.invalidateBlock('date_block');
        }
    }
}

window.view = new TransactionView(window.app);
