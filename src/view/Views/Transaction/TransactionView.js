import 'jezvejs/style';
import {
    ge,
    isNum,
    isVisible,
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
import { TransactionModel } from '../../js/model/TransactionModel.js';
import { ConfirmDialog } from '../../Components/ConfirmDialog/ConfirmDialog.js';
import { Tile } from '../../Components/Tile/Tile.js';
import { AccountTile } from '../../Components/AccountTile/AccountTile.js';
import { TileInfoItem } from '../../Components/TileInfoItem/TileInfoItem.js';
import { IconLink } from '../../Components/IconLink/IconLink.js';
import '../../css/app.css';
import '../../Components/TransactionTypeMenu/style.css';
import './style.css';

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
        window.app.model.transaction = new TransactionModel({
            transaction: this.props.transaction,
        });

        this.mode = this.props.mode;
        if (!availModes.includes(this.mode)) {
            throw new Error(`Invalid Transaction view mode: ${this.mode}`);
        }
        if (this.mode === 'update') {
            accountModel.cancelTransaction(this.props.transaction);
        }

        const userAccounts = AccountList.create(
            accountModel.getUserAccounts(window.app.model.profile.owner_id),
        );
        window.app.model.visibleUserAccounts = AccountList.create(userAccounts.getVisible());

        this.state = {
            id: 0,
            transaction: { ...this.props.transaction },
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
            srcAccount: accountModel.getItem(this.props.transaction.src_id),
            destAccount: accountModel.getItem(this.props.transaction.dest_id),
            srcCurrency: currencyModel.getItem(this.props.transaction.src_curr),
            destCurrency: currencyModel.getItem(this.props.transaction.dest_curr),
            isDiff: this.props.transaction.src_curr !== this.props.transaction.dest_curr,
            isUpdate: this.props.mode === 'update',
        };

        if (this.state.transaction.id) {
            this.state.form.sourceAmount = this.state.transaction.src_amount;
            this.state.form.destAmount = this.state.transaction.dest_amount;
        }

        if (this.state.srcAccount) {
            const srcResult = normalize(this.state.srcAccount.balance - this.state.transaction.src_amount);

            this.state.form.sourceResult = srcResult;
            this.state.form.fSourceResult = srcResult;
        }

        if (this.state.destAccount) {
            const destResult = normalize(this.state.destAccount.balance + this.state.transaction.dest_amount);

            this.state.form.destResult = destResult;
            this.state.form.fDestResult = destResult;
        }

        if (this.state.transaction.type === EXPENSE
            || this.state.transaction.type === INCOME) {
            this.state.id = (this.state.isDiff) ? 2 : 0;
        } else if (this.state.transaction.type === TRANSFER) {
            this.state.id = (this.state.isDiff) ? 3 : 0;
        } else if (this.state.transaction.type === DEBT) {
            this.state.person = window.app.model.persons.getItem(this.state.transaction.person_id);
            const personAccountId = (this.state.transaction.debtType)
                ? this.state.transaction.src_id
                : this.state.transaction.dest_id;
            if (personAccountId) {
                this.state.personAccount = accountModel.getItem(personAccountId);
            } else {
                const personAccountCurr = (this.state.transaction.debtType)
                    ? this.state.transaction.src_curr
                    : this.state.transaction.dest_curr;
                this.state.personAccount = {
                    id: 0,
                    balance: 0,
                    curr_id: personAccountCurr,
                };
            }

            if (this.state.transaction.debtType) {
                this.state.srcAccount = this.state.personAccount;
                this.state.account = this.state.destAccount;

                this.state.id = (this.state.transaction.noAccount) ? 6 : 0;
            } else {
                this.state.destAccount = this.state.personAccount;
                this.state.account = this.state.srcAccount;

                this.state.id = (this.state.transaction.noAccount) ? 7 : 3;
            }

            if (this.state.transaction.noAccount) {
                const lastAcc = window.app.model.accounts.getItem(this.state.transaction.lastAcc_id);
                if (this.state.transaction.debtType) {
                    const destResult = normalize(lastAcc.balance);
                    this.state.form.destResult = destResult;
                    this.state.form.fDestResult = destResult;
                } else {
                    const sourceResult = normalize(lastAcc.balance);
                    this.state.form.sourceResult = sourceResult;
                    this.state.form.fSourceResult = sourceResult;
                }
            }
        }

        this.updateStateExchange();
    }

    /**
     * View initialization
     */
    onStart() {
        this.submitStarted = false;
        // Init form submit event handler
        this.form = ge('mainfrm');
        if (!this.form) {
            throw new Error('Failed to initialize Transaction view');
        }
        this.form.addEventListener('submit', this.onFormSubmit.bind(this));

        if (this.mode === 'update') {
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
            onclick: () => this.onSrcAmountSelect(),
        });
        this.destAmountInfo = TileInfoItem.fromElement({
            elem: 'dest_amount_left',
            onclick: () => this.onDestAmountSelect(),
        });
        this.exchangeInfo = TileInfoItem.fromElement({
            elem: 'exch_left',
            onclick: () => this.onExchRateSelect(),
        });
        this.srcResBalanceInfo = TileInfoItem.fromElement({
            elem: 'src_res_balance_left',
            onclick: () => this.onResBalanceSelect(),
        });
        this.destResBalanceInfo = TileInfoItem.fromElement({
            elem: 'dest_res_balance_left',
            onclick: () => this.onResBalanceDestSelect(),
        });

        this.srcAmountRow = ge('src_amount_row');
        if (this.srcAmountRow) {
            this.srcAmountRowLabel = this.srcAmountRow.querySelector('label');
        }
        this.srcAmountInput = DecimalInput.create({ elem: ge('src_amount'), oninput: (e) => this.onFInput(e) });
        this.srcAmountSign = ge('srcamountsign');

        this.destAmountRow = ge('dest_amount_row');
        if (this.destAmountRow) {
            this.destAmountRowLabel = this.destAmountRow.querySelector('label');
        }
        this.destAmountInput = DecimalInput.create({ elem: ge('dest_amount'), oninput: (e) => this.onFInput(e) });
        this.destAmountSign = ge('destamountsign');

        this.srcResBalanceRow = ge('result_balance');
        if (this.srcResBalanceRow) {
            this.srcResBalanceRowLabel = this.srcResBalanceRow.querySelector('label');
        }
        this.srcResBalanceInput = DecimalInput.create({ elem: ge('resbal'), oninput: (e) => this.onFInput(e) });
        this.srcResBalanceSign = ge('res_currsign');

        this.destResBalanceRow = ge('result_balance_dest');
        if (this.destResBalanceRow) {
            this.destResBalanceRowLabel = this.destResBalanceRow.querySelector('label');
        }
        this.destResBalanceInput = DecimalInput.create({ elem: ge('resbal_d'), oninput: (e) => this.onFInput(e) });
        this.destResBalanceSign = ge('res_currsign_d');

        this.exchangeRow = ge('exchange');
        if (this.exchangeRow) {
            this.exchangeRowLabel = this.exchangeRow.querySelector('label');
        }
        this.exchangeInput = DecimalInput.create({ elem: ge('exchrate'), oninput: (e) => this.onFInput(e) });
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

        this.srcAccount = null;
        this.destAccount = null;

        const trModel = window.app.model.transaction;

        if (trModel.isExpense() || trModel.isTransfer()) {
            this.srcIdInp = ge('src_id');
            if (this.srcIdInp) {
                trModel.setValue('src_id', this.srcIdInp.value);
                this.srcAccount = window.app.model.accounts.getItem(this.srcIdInp.value);
            }
        }
        if (trModel.isIncome() || trModel.isTransfer()) {
            this.destIdInp = ge('dest_id');
            if (this.destIdInp) {
                trModel.setValue('dest_id', this.destIdInp.value);
                this.destAccount = window.app.model.accounts.getItem(this.destIdInp.value);
            }
        }

        this.srcCurrInp = ge('src_curr');
        this.destCurrInp = ge('dest_curr');

        if (this.exchangeInput) {
            trModel.setValue('exchrate', this.exchangeInput.value);
        }
        if (trModel.isExpense()) {
            if (this.srcAccount) {
                trModel.setValue('src_initbal', this.srcAccount.balance);
            }
        } else if (trModel.isIncome()) {
            if (this.destAccount) {
                trModel.setValue('dest_initbal', this.destAccount.balance);
            }
        } else if (trModel.isTransfer()) {
            if (this.srcAccount) {
                trModel.setValue('src_initbal', this.srcAccount.balance);
            }
            if (this.destAccount) {
                trModel.setValue('dest_initbal', this.destAccount.balance);
            }
        } else if (trModel.isDebt()) {
            this.personIdInp = ge('person_id');
            if (this.personIdInp) {
                this.personAccount = window.app.model.accounts.getPersonAccount(
                    this.personIdInp.value,
                    trModel.srcCurr(),
                );
            }

            const personAccBalance = (this.personAccount) ? this.personAccount.balance : 0;
            if (trModel.debtType) {
                trModel.setValue('src_initbal', personAccBalance);
            } else {
                trModel.setValue('dest_initbal', personAccBalance);
            }

            this.debtAccountInp = ge('acc_id');
            this.debtAccountTile = AccountTile.fromElement({ elem: 'acc_tile', parent: this });
            if (!trModel.noAccount) {
                if (this.debtAccountInp) {
                    this.debtAccount = window.app.model.accounts.getItem(this.debtAccountInp.value);
                }

                if (this.debtAccount) {
                    if (trModel.debtType) {
                        trModel.setValue('dest_initbal', this.debtAccount.balance);
                    } else {
                        trModel.setValue('src_initbal', this.debtAccount.balance);
                    }
                }
            }
        }

        trModel.subscribe('src_amount', this.onValueChanged.bind(this, 'src_amount'));
        trModel.subscribe('dest_amount', this.onValueChanged.bind(this, 'dest_amount'));
        trModel.subscribe('exchrate', this.onValueChanged.bind(this, 'exchrate'));
        trModel.subscribe('src_resbal', this.onValueChanged.bind(this, 'src_resbal'));
        trModel.subscribe('dest_resbal', this.onValueChanged.bind(this, 'dest_resbal'));
        trModel.subscribe('src_curr', this.onValueChanged.bind(this, 'src_curr'));
        trModel.subscribe('dest_curr', this.onValueChanged.bind(this, 'dest_curr'));

        if (trModel.isDebt()) {
            this.noAccountBtn = ge('noacc_btn');
            if (this.noAccountBtn) {
                this.noAccountBtn.addEventListener('click', this.toggleEnableAccount.bind(this));
            }
            this.selectAccountBtn = ge('selaccount');
            if (this.selectAccountBtn) {
                const accountToggleBtn = this.selectAccountBtn.querySelector('button');
                if (accountToggleBtn) {
                    accountToggleBtn.addEventListener('click', this.toggleEnableAccount.bind(this));
                }
            }

            this.debtAccountLabel = ge('acclbl');

            this.debtGiveRadio = ge('debtgive');
            if (this.debtGiveRadio) {
                this.debtGiveRadio.addEventListener('change', this.onChangeDebtOp.bind(this));
            }
            this.debtTakeRadio = ge('debttake');
            if (this.debtTakeRadio) {
                this.debtTakeRadio.addEventListener('change', this.onChangeDebtOp.bind(this));
            }

            this.personTile = Tile.fromElement({ elem: 'person_tile', parent: this });

            this.persDDList = DropDown.create({
                input_id: 'person_tile',
                listAttach: true,
                onitemselect: this.onPersAccSel.bind(this),
                editable: false,
            });

            const visiblePersons = window.app.model.persons.getVisible();
            visiblePersons.forEach(
                (person) => this.persDDList.addItem({ id: person.id, title: person.name }),
            );

            const personId = parseInt(this.personIdInp.value, 10);
            this.appendHiddenPerson(this.persDDList, personId);
            this.persDDList.selectItem(personId);

            if (!trModel.noAccount) {
                this.initAccList();
            }
        } else {
            const srcId = trModel.srcAcc();
            const destId = trModel.destAcc();

            this.srcDDList = DropDown.create({
                input_id: 'source_tile',
                listAttach: true,
                onitemselect: this.onSrcAccSel.bind(this),
                editable: false,
            });

            if (this.srcDDList) {
                window.app.model.visibleUserAccounts.forEach(
                    (acc) => this.srcDDList.addItem({ id: acc.id, title: acc.name }),
                );

                this.appendHiddenAccount(this.srcDDList, srcId);
                this.appendHiddenAccount(this.srcDDList, destId);
                this.srcDDList.selectItem(srcId);
            }

            this.destDDList = DropDown.create({
                input_id: 'dest_tile',
                listAttach: true,
                onitemselect: this.onDestAccSel.bind(this),
                editable: false,
            });
            if (this.destDDList) {
                window.app.model.visibleUserAccounts.forEach(
                    (acc) => this.destDDList.addItem({ id: acc.id, title: acc.name }),
                );

                this.appendHiddenAccount(this.destDDList, srcId);
                this.appendHiddenAccount(this.destDDList, destId);
                this.destDDList.selectItem(destId);
            }
        }

        if (trModel.isIncome()) {
            this.srcCurrDDList = DropDown.create({
                input_id: 'srcamountsign',
                listAttach: true,
                onitemselect: this.onSrcCurrencySel.bind(this),
                editable: false,
            });
            window.app.model.currency.forEach(
                (curr) => this.srcCurrDDList.addItem({ id: curr.id, title: curr.name }),
            );
            this.srcCurrDDList.selectItem(trModel.srcCurr());
        }

        if (trModel.isExpense()) {
            this.destCurrDDList = DropDown.create({
                input_id: 'destamountsign',
                listAttach: true,
                onitemselect: this.onDestCurrencySel.bind(this),
                editable: false,
            });
            window.app.model.currency.forEach(
                (curr) => this.destCurrDDList.addItem({ id: curr.id, title: curr.name }),
            );
            this.destCurrDDList.selectItem(trModel.destCurr());
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
            onitemselect: this.onDebtAccSel.bind(this),
            editable: false,
        });
        // In case there is no persons, components will be not available
        if (!this.accDDList) {
            return;
        }

        window.app.model.visibleUserAccounts.forEach(
            (acc) => this.accDDList.addItem({ id: acc.id, title: acc.name }),
        );
        const accountId = this.debtAccount.id;
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

        setEmptyClick(this.calendarObj.hide.bind(this.calendarObj), [
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

        if (this.state.transaction.type !== DEBT) {
            return;
        }

        if (toShow && inputObj && inputObj.elem) {
            inputObj.elem.focus();
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
     * Source amount static click event handler
     */
    onSrcAmountSelect() {
        if (this.state.transaction.type === INCOME) {
            if (this.state.id === 1) {
                this.state.id = 0;
            }

            return this.render(this.state);
        }

        if (this.state.transaction.type === TRANSFER) {
            if (this.state.id === 1 || this.state.id === 2) {
                this.state.id = 0;
            } else if (this.state.id === 4) {
                this.state.id = 3;
            } else if (this.state.id === 6) {
                this.state.id = 5;
            } else if (this.state.id === 8) {
                this.state.id = 7;
            }

            return this.render(this.state);
        }

        if (this.state.transaction.type === DEBT) {
            if (this.state.id === 1 || this.state.id === 2) {
                this.state.id = 0;
            } else if (this.state.id === 4 || this.state.id === 5) {
                this.state.id = 3;
            } else if (this.state.id === 8) {
                this.state.id = 7;
            } else if (this.state.id === 9) {
                this.state.id = 6;
            }

            return this.render(this.state);
        }

        this.srcAmountSwitch(true);
        this.resBalanceSwitch(false);
        if (!window.app.model.transaction.isDiff()) {
            this.resBalanceDestSwitch(false);
        }
    }

    /**
     * Destination amount static click event handler
     */
    onDestAmountSelect() {
        if (this.state.transaction.type === EXPENSE) {
            if (this.state.id === 1) {
                this.state.id = 0;
            } else if (this.state.id === 3 || this.state.id === 4) {
                this.state.id = 2;
            }

            return this.render(this.state);
        }
        if (this.state.transaction.type === INCOME) {
            if (this.state.id === 3 || this.state.id === 4) {
                this.state.id = 2;
            }

            return this.render(this.state);
        }
        if (this.state.transaction.type === TRANSFER) {
            if (this.state.id === 5 || this.state.id === 7) {
                this.state.id = 3;
            } else if (this.state.id === 6 || this.state.id === 8) {
                this.state.id = 4;
            }

            return this.render(this.state);
        }

        this.destAmountSwitch(true);
        if (!window.app.model.transaction.isDiff() || window.app.model.transaction.isExpense()) {
            this.resBalanceSwitch(false);
        }
        this.resBalanceDestSwitch(false);
        if (window.app.model.transaction.isDiff()) {
            this.exchRateSwitch(false);
        }
    }

    /**
     * Source result balance static click event handler
     */
    onResBalanceSelect() {
        if (this.state.transaction.type === EXPENSE) {
            if (this.state.id === 0) {
                this.state.id = 1;
            } else if (this.state.id === 2 || this.state.id === 3) {
                this.state.id = 4;
            }

            return this.render(this.state);
        }

        if (this.state.transaction.type === TRANSFER) {
            if (this.state.id === 0 || this.state.id === 2) {
                this.state.id = 1;
            } else if (this.state.id === 3) {
                this.state.id = 4;
            } else if (this.state.id === 5) {
                this.state.id = 6;
            } else if (this.state.id === 7) {
                this.state.id = 8;
            }

            return this.render(this.state);
        }

        if (this.state.transaction.type === DEBT) {
            if (this.state.id === 0 || this.state.id === 2) {
                this.state.id = 1;
            } else if (this.state.id === 3 || this.state.id === 4) {
                this.state.id = 5;
            } else if (this.state.id === 6) {
                this.state.id = 9;
            }

            return this.render(this.state);
        }

        this.resBalanceSwitch(true);
        if (!window.app.model.transaction.isDiff()) {
            this.resBalanceDestSwitch(false);
        }
        if (window.app.model.transaction.isTransfer() || window.app.model.transaction.isDebt()) {
            this.srcAmountSwitch(false);
        } else {
            this.destAmountSwitch(false);
        }
        if (window.app.model.transaction.isExpense() && window.app.model.transaction.isDiff()) {
            this.exchRateSwitch(false);
        }
    }

    /**
     * Destination result balance static click event handler
     */
    onResBalanceDestSelect() {
        if (this.state.transaction.type === INCOME) {
            if (this.state.id === 0) {
                this.state.id = 1;
            } else if (this.state.id === 2 || this.state.id === 3) {
                this.state.id = 4;
            }

            return this.render(this.state);
        }

        if (this.state.transaction.type === TRANSFER) {
            if (this.state.id === 0 || this.state.id === 1) {
                this.state.id = 2;
            } else if (this.state.id === 3 || this.state.id === 7) {
                this.state.id = 5;
            } else if (this.state.id === 4 || this.state.id === 8) {
                this.state.id = 6;
            }

            return this.render(this.state);
        }

        if (this.state.transaction.type === DEBT) {
            if (this.state.id === 0 || this.state.id === 1) {
                this.state.id = 2;
            } else if (this.state.id === 3 || this.state.id === 5) {
                this.state.id = 4;
            } else if (this.state.id === 7) {
                this.state.id = 8;
            }

            return this.render(this.state);
        }

        this.resBalanceDestSwitch(true);
        if (window.app.model.transaction.isDiff()) {
            this.destAmountSwitch(false);
            this.exchRateSwitch(false);
        } else {
            this.resBalanceSwitch(false);
            this.srcAmountSwitch(false);
        }
    }

    /**
     * Exchange rate static click event handler
     */
    onExchRateSelect() {
        if (this.state.transaction.type === EXPENSE
            || this.state.transaction.type === INCOME) {
            this.state.id = 3;

            return this.render(this.state);
        }
        if (this.state.transaction.type === TRANSFER) {
            if (this.state.id === 3 || this.state.id === 5) {
                this.state.id = 7;
            } else if (this.state.id === 4 || this.state.id === 6) {
                this.state.id = 8;
            }

            return this.render(this.state);
        }

        const trModel = window.app.model.transaction;

        this.exchRateSwitch(true);
        this.destAmountSwitch(false);
        if (trModel.isDiff()) {
            if (trModel.isExpense()) {
                this.resBalanceSwitch(false);
            } else if (trModel.isIncome() || trModel.isTransfer()) {
                this.resBalanceDestSwitch(false);
            }
        }
    }

    /**
     * Hide both source amount and exchange rate controls
     */
    hideSrcAmountAndExchange() {
        show(this.srcAmountRow, false);
        if (this.srcAmountInfo) {
            this.srcAmountInfo.hide();
        }

        show(this.exchangeRow, false);
        if (this.exchangeInfo) {
            this.exchangeInfo.hide();
        }
    }

    /**
     * Hide both destination amount and exchange rate controls
     */
    hideDestAmountAndExchange() {
        show(this.destAmountRow, false);
        if (this.destAmountInfo) {
            this.destAmountInfo.hide();
        }

        show(this.exchangeRow, false);
        if (this.exchangeInfo) {
            this.exchangeInfo.hide();
        }
    }

    /**
     * Source account select callback
     * @param {object} obj - selected item
     */
    onSrcAccSel(obj) {
        if (this.state.transaction.type === EXPENSE) {
            const accountId = parseInt(obj.id, 10);
            if (this.state.transaction.src_id === accountId) {
                return;
            }

            this.state.transaction.src_id = accountId;
            const srcAccount = window.app.model.accounts.getItem(accountId);
            this.state.srcAccount = srcAccount;
            this.state.transaction.src_curr = srcAccount.curr_id;
            this.state.srcCurrency = window.app.model.currency.getItem(srcAccount.curr_id);
            // If currencies are same before account was changed
            // then copy source currency to destination
            if (this.state.id === 0 || this.state.id === 1) {
                this.state.transaction.dest_curr = srcAccount.curr_id;
                this.state.destCurrency = this.state.srcCurrency;
            }

            // Update result balance of source
            const srcResult = normalize(srcAccount.balance - this.state.transaction.src_amount);
            if (this.state.form.fSourceResult !== srcResult) {
                this.state.form.fSourceResult = srcResult;
                this.state.form.sourceResult = srcResult;
            }

            this.updateStateExchange();

            this.state.isDiff = this.state.transaction.src_curr !== this.state.transaction.dest_curr;
            if (!this.state.isDiff) {
                if (this.state.id === 2 || this.state.id === 3 || this.state.id === 4) {
                    const srcAmount = this.state.transaction.src_amount;
                    this.state.transaction.dest_amount = srcAmount;
                    this.state.form.destAmount = srcAmount;
                    this.state.id = (this.state.id === 4) ? 1 : 0;
                }
            }

            return this.render(this.state);
        }
        if (this.state.transaction.type === TRANSFER) {
            const accountId = parseInt(obj.id, 10);
            if (this.state.transaction.src_id === accountId) {
                return;
            }

            this.state.transaction.src_id = accountId;
            const srcAccount = window.app.model.accounts.getItem(accountId);
            this.state.srcAccount = srcAccount;
            this.state.transaction.src_curr = srcAccount.curr_id;
            this.state.srcCurrency = window.app.model.currency.getItem(srcAccount.curr_id);

            // Update result balance of source
            const srcResult = normalize(srcAccount.balance - this.state.transaction.src_amount);
            if (this.state.form.fSourceResult !== srcResult) {
                this.state.form.fSourceResult = srcResult;
                this.state.form.sourceResult = srcResult;
            }

            if (accountId === this.state.transaction.dest_id) {
                const { visibleUserAccounts } = window.app.model;
                const nextAccountId = visibleUserAccounts.getNextAccount(accountId);
                const destAccount = window.app.model.accounts.getItem(nextAccountId);
                if (!destAccount) {
                    throw new Error('Next account not found');
                }
                this.state.destAccount = destAccount;
                this.state.transaction.dest_id = destAccount.id;
                this.state.transaction.dest_curr = destAccount.curr_id;
                this.state.destCurrency = window.app.model.currency.getItem(destAccount.curr_id);

                // TODO : investigate unconditional copying of amount for different currencies case
                // Copy source amount to destination amount
                if (this.state.transaction.dest_amount !== this.state.transaction.src_amount) {
                    this.state.form.destAmount = this.state.form.sourceAmount;
                }
                this.state.transaction.dest_amount = this.state.transaction.src_amount;

                // Update result balance of destination
                const destResult = normalize(destAccount.balance + this.state.transaction.dest_amount);
                if (this.state.form.fDestResult !== destResult) {
                    this.state.form.fDestResult = destResult;
                    this.state.form.destResult = destResult;
                }
            }

            this.updateStateExchange();

            this.state.isDiff = this.state.transaction.src_curr !== this.state.transaction.dest_curr;
            if (this.state.isDiff) {
                if (this.state.id === 0) {
                    this.state.id = 3;
                } else if (this.state.id === 1) {
                    this.state.id = 4;
                } else if (this.state.id === 2) {
                    this.state.id = 5;
                }
            } else {
                if (this.state.transaction.dest_amount !== this.state.transaction.src_amount) {
                    this.setStateDestAmount(this.state.transaction.src_amount);
                }

                if (this.state.id === 3 || this.state.id === 7) {
                    this.state.id = 0;
                } else if (this.state.id === 4 || this.state.id === 6 || this.state.id === 8) {
                    this.state.id = 1;
                } else if (this.state.id === 5) {
                    this.state.id = 2;
                }
            }

            return this.render(this.state);
        }

        if (!obj || !this.srcIdInp) {
            return;
        }

        this.srcIdInp.value = obj.id;
        if (window.app.model.transaction.isTransfer()) {
            this.onChangeSource();
        } else {
            this.onChangeAcc();
        }
    }

    /**
     * Destination account select callback
     * @param {object} obj - selected item
     */
    onDestAccSel(obj) {
        if (this.state.transaction.type === INCOME) {
            const accountId = parseInt(obj.id, 10);
            if (this.state.transaction.dest_id === accountId) {
                return;
            }

            this.state.transaction.dest_id = accountId;
            const destAccount = window.app.model.accounts.getItem(accountId);
            this.state.destAccount = destAccount;
            this.state.transaction.dest_curr = destAccount.curr_id;
            this.state.destCurrency = window.app.model.currency.getItem(destAccount.curr_id);
            // If currencies are same before account was changed
            // then copy destination currency to source
            if (this.state.id === 0 || this.state.id === 1) {
                this.state.transaction.src_curr = destAccount.curr_id;
                this.state.srcCurrency = this.state.destCurrency;
            }

            // Update result balance of destination
            const destResult = normalize(destAccount.balance + this.state.transaction.dest_amount);
            if (this.state.form.fDestResult !== destResult) {
                this.state.form.fDestResult = destResult;
                this.state.form.destResult = destResult;
            }

            this.updateStateExchange();

            this.state.isDiff = this.state.transaction.src_curr !== this.state.transaction.dest_curr;
            if (!this.state.isDiff) {
                if (this.state.id === 2 || this.state.id === 3 || this.state.id === 4) {
                    this.setStateSourceAmount(this.state.transaction.dest_amount);
                    this.state.id = (this.state.id === 4) ? 1 : 0;
                }
            }

            return this.render(this.state);
        }
        if (this.state.transaction.type === TRANSFER) {
            const accountId = parseInt(obj.id, 10);
            if (this.state.transaction.dest_id === accountId) {
                return;
            }

            this.state.transaction.dest_id = accountId;
            const destAccount = window.app.model.accounts.getItem(accountId);
            this.state.destAccount = destAccount;
            this.state.transaction.dest_curr = destAccount.curr_id;
            this.state.destCurrency = window.app.model.currency.getItem(destAccount.curr_id);

            // Update result balance of destination
            const destResult = normalize(destAccount.balance + this.state.transaction.dest_amount);
            if (this.state.form.fDestResult !== destResult) {
                this.state.form.fDestResult = destResult;
                this.state.form.destResult = destResult;
            }

            if (accountId === this.state.transaction.src_id) {
                const { visibleUserAccounts } = window.app.model;
                const nextAccountId = visibleUserAccounts.getNextAccount(accountId);
                const srcAccount = window.app.model.accounts.getItem(nextAccountId);
                if (!srcAccount) {
                    throw new Error('Next account not found');
                }
                this.state.srcAccount = srcAccount;
                this.state.transaction.src_id = srcAccount.id;
                this.state.transaction.src_curr = srcAccount.curr_id;
                this.state.srcCurrency = window.app.model.currency.getItem(srcAccount.curr_id);

                // TODO : investigate unconditional copying of amount for different currencies case
                // Copy source amount to destination amount
                if (this.state.transaction.dest_amount !== this.state.transaction.src_amount) {
                    this.state.form.sourceAmount = this.state.form.destAmount;
                }
                this.state.transaction.src_amount = this.state.transaction.dest_amount;

                // Update result balance of source
                const sourceResult = normalize(srcAccount.balance - this.state.transaction.src_amount);
                if (this.state.form.fSourceResult !== sourceResult) {
                    this.state.form.fSourceResult = sourceResult;
                    this.state.form.sourceResult = sourceResult;
                }
            }

            // Copy source amount to destination amount
            if (!this.state.isDiff) {
                this.setStateSourceAmount(this.state.transaction.dest_amount);
            }
            this.updateStateExchange();

            this.state.isDiff = this.state.transaction.src_curr !== this.state.transaction.dest_curr;
            if (this.state.isDiff) {
                if (this.state.id === 0) {
                    this.state.id = 3;
                } else if (this.state.id === 1) {
                    this.state.id = 4;
                } else if (this.state.id === 2) {
                    this.state.id = 5;
                }
            } else {
                if (this.state.transaction.dest_amount !== this.state.transaction.src_amount) {
                    this.setStateDestAmount(this.state.transaction.src_amount);
                }

                if (this.state.id === 3 || this.state.id === 7) {
                    this.state.id = 0;
                } else if (this.state.id === 4 || this.state.id === 8) {
                    this.state.id = 1;
                } else if (this.state.id === 5 || this.state.id === 6) {
                    this.state.id = 2;
                }
            }

            return this.render(this.state);
        }


        if (!obj || !this.destIdInp) {
            return;
        }

        this.destIdInp.value = obj.id;
        if (window.app.model.transaction.isTransfer()) {
            this.onChangeDest();
        } else {
            this.onChangeAcc();
        }
    }

    /**
     * Debt account select callback
     * @param {object} obj - selected item
     */
    onDebtAccSel(obj) {
        if (this.state.transaction.type !== DEBT) {
            return;
        }

        const account = window.app.model.accounts.getItem(obj.id);
        if (!account || (this.state.account && this.state.account.id === account.id)) {
            return;
        }

        this.state.account = account;
        // Request person account wtih the same currency as account
        if (this.state.personAccount.curr_id !== account.curr_id) {
            this.state.personAccount = window.app.model.accounts.getPersonAccount(this.state.person.id, account.curr_id);
            if (!this.state.personAccount) {
                this.state.personAccount = {
                    id: 0,
                    balance: 0,
                    curr_id: account.curr_id,
                };
            }
        }

        this.state.transaction.src_curr = account.curr_id;
        this.state.transaction.dest_curr = account.curr_id;
        const currency = window.app.model.currency.getItem(account.curr_id);
        this.state.srcCurrency = currency;
        this.state.destCurrency = currency;

        if (this.state.transaction.debtType) {
            this.state.srcAccount = this.state.personAccount;
            this.state.destAccount = this.state.account;
        } else {
            this.state.srcAccount = this.state.account;
            this.state.destAccount = this.state.personAccount;
        }

        const sourceResult = normalize(this.state.srcAccount.balance - this.state.transaction.src_amount);
        this.state.form.fSourceResult = sourceResult;
        this.state.form.sourceResult = sourceResult;

        const destResult = normalize(this.state.destAccount.balance + this.state.transaction.dest_amount);
        this.state.form.fDestResult = destResult;
        this.state.form.destResult = destResult;

        return this.render(this.state);

        if (!obj || !this.debtAccountInp) {
            return;
        }

        this.debtAccountInp.value = obj.id;
        this.onChangeAcc();
    }

    /**
     * Person select callback
     * @param {object} obj - selected item
     */
    onPersAccSel(obj) {
        if (this.state.transaction.type !== DEBT) {
            return;
        }

        const { debtType } = this.state.transaction;

        this.state.person = window.app.model.persons.getItem(obj.id);

        const currencyId = (debtType)
            ? this.state.transaction.src_curr
            : this.state.transaction.dest_curr;
        this.state.personAccount = window.app.model.accounts.getPersonAccount(this.state.person.id, currencyId);
        if (!this.state.personAccount) {
            this.state.personAccount = {
                id: 0,
                balance: 0,
                curr_id: currencyId,
            };
        }

        if (debtType) {
            this.state.srcAccount = this.state.personAccount;

            const sourceResult = normalize(this.state.srcAccount.balance - this.state.transaction.src_amount);
            this.state.form.sourceResult = sourceResult;
            this.state.form.fSourceResult = sourceResult;
        } else {
            this.state.destAccount = this.state.personAccount;

            const destResult = normalize(this.state.destAccount.balance + this.state.transaction.dest_amount);
            this.state.form.destResult = destResult;
            this.state.form.fDestResult = destResult;
        }

        return this.render(this.state);
    }

    /**
     * Source currency select callback
     * @param {object} obj - selected item
     */
    onSrcCurrencySel(obj) {
        if (this.state.transaction.type === INCOME) {
            const curr = window.app.model.currency.getItem(obj.id);
            if (this.state.transaction.src_curr === curr.id) {
                return;
            }

            this.state.srcCurrency = curr;
            this.state.transaction.src_curr = curr.id;
            this.state.isDiff = this.state.transaction.src_curr !== this.state.transaction.dest_curr;

            if (this.state.isDiff && this.state.id === 0) {
                this.state.id = 2;
            } else if (this.state.id === 2 || this.state.id === 3 || this.state.id === 4) {
                if (!this.state.isDiff) {
                    this.setStateDestAmount(this.state.transaction.src_amount);
                    this.updateStateExchange();
                    this.state.id = (this.state.id === 4) ? 1 : 0;
                }
            }

            return this.render(this.state);
        }

        if (!obj || !this.srcCurrInp) {
            return;
        }

        this.srcCurrInp.value = obj.id;
        this.onChangeSrcCurr();
    }

    /**
     * Destination currency select callback
     * @param {object} obj - selected item
     */
    onDestCurrencySel(obj) {
        if (this.state.transaction.type === EXPENSE) {
            const curr = window.app.model.currency.getItem(obj.id);
            if (this.state.transaction.dest_curr === curr.id) {
                return;
            }

            this.state.destCurrency = curr;
            this.state.transaction.dest_curr = curr.id;
            this.state.isDiff = this.state.transaction.src_curr !== this.state.transaction.dest_curr;

            if (this.state.isDiff && this.state.id === 0) {
                this.state.id = 2;
            } else if (this.state.id === 2) {
                if (!this.state.isDiff) {
                    this.state.id = 0;
                    this.setStateSourceAmount(this.state.transaction.dest_amount);
                    this.updateStateExchange();
                }
            }

            return this.render(this.state);
        }

        if (!obj || !this.destCurrInp) {
            return;
        }

        this.destCurrInp.value = obj.id;
        this.onChangeDestCurr();
    }

    /**
     * Account disable button click event handler
     */
    toggleEnableAccount() {
        if (this.state.transaction.type !== DEBT) {
            return;
        }

        this.state.transaction.noAccount = !this.state.transaction.noAccount;
        if (this.state.transaction.noAccount) {
            if (this.state.id === 0 || this.state.id === 2) {
                this.state.id = 6;
            } else if (this.state.id === 1) {
                this.state.id = 9;
            } else if (this.state.id === 3 || this.state.id === 5) {
                this.state.id = 7;
            } else if (this.state.id === 4) {
                this.state.id = 8;
            }

            this.state.transaction.lastAcc_id = this.state.account.id;
        } else {
            this.state.account = window.app.model.accounts.getItem(this.state.transaction.lastAcc_id);
            if (!this.state.account) {
                throw new Error('Account not found');
            }

            if (this.state.transaction.debtType) {
                this.state.destAccount = this.state.account;

                const destResult = normalize(this.state.destAccount.balance + this.state.transaction.dest_amount);
                this.state.form.destResult = destResult;
                this.state.form.fDestResult = destResult;
            } else {
                this.state.srcAccount = this.state.account;

                const sourceResult = normalize(this.state.srcAccount.balance - this.state.transaction.src_amount);
                this.state.form.sourceResult = sourceResult;
                this.state.form.fSourceResult = sourceResult;
            }

            if (this.state.id === 6) {
                this.state.id = 0;
            } else if (this.state.id === 7) {
                this.state.id = 3;
            } else if (this.state.id === 8) {
                this.state.id = 4;
            } else if (this.state.id === 9) {
                this.state.id = 1;
            }
        }

        return this.render(this.state);

        let currencyId;
        let debtAccountLabel = 'No account';
        const trModel = window.app.model.transaction;

        if (trModel.noAccount) {
            debtAccountLabel = (trModel.debtType) ? 'Destination account' : 'Source account';
        }

        this.debtAccountLabel.textContent = debtAccountLabel;

        show(this.noAccountBtn, trModel.noAccount);
        show(this.srcTileBase, trModel.noAccount);
        show(this.selectAccountBtn, !trModel.noAccount);

        trModel.updateValue('no_account', !trModel.noAccount);

        if (trModel.noAccount) {
            trModel.updateValue('last_acc', parseInt(this.debtAccountInp.value, 10));
            this.debtAccountInp.value = 0;

            currencyId = parseInt(this.srcCurrInp.value, 10);
        } else {
            this.debtAccount = window.app.model.accounts.getItem(trModel.lastAcc_id);
            this.debtAccountInp.value = this.debtAccount.id;
            currencyId = this.debtAccount.curr_id;
        }
        trModel.updateValue('src_curr', currencyId);
        trModel.updateValue('dest_curr', currencyId);

        this.onChangeAcc();

        if (!trModel.noAccount && !this.accDDList) {
            this.initAccList();
        }
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
     * Set source amount value at View
     * @param {*} val - source amount value
     */
    setSrcAmount(val) {
        if (this.srcAmountInfo) {
            const title = window.app.model.currency.formatCurrency(
                (isValidValue(val) ? val : 0),
                window.app.model.transaction.srcCurr(),
            );
            this.srcAmountInfo.setTitle(title);
        }

        if (typeof val === 'undefined') {
            return;
        }

        if (this.srcAmountInput) {
            const sa = this.srcAmountInput.value;
            const savalid = isValidValue(sa);
            const fsa = (savalid) ? normalize(sa) : sa;

            if (fsa !== val) {
                this.srcAmountInput.value = val;
            }
        }
    }

    /**
     * Set destination amount value at View
     * @param {*} val - destination amount value
     */
    setDestAmount(val) {
        if (this.destAmountInfo) {
            const title = window.app.model.currency.formatCurrency(
                (isValidValue(val) ? val : 0),
                window.app.model.transaction.destCurr(),
            );
            this.destAmountInfo.setTitle(title);
        }

        if (typeof val === 'undefined') {
            return;
        }

        if (this.destAmountInput) {
            const da = this.destAmountInput.value;
            const davalid = isValidValue(da);
            const fda = (davalid) ? normalize(da) : da;

            if (fda !== val) {
                this.destAmountInput.value = val;
            }
        }
    }

    /**
     * Set exchange rate value at View
     * @param {*} val - exchange rate value
     */
    setExchRate(val) {
        if (typeof val === 'undefined') {
            return;
        }

        const srcCurr = window.app.model.currency.getItem(window.app.model.transaction.srcCurr());
        const destCurr = window.app.model.currency.getItem(window.app.model.transaction.destCurr());

        if (this.exchangeInput) {
            const e = this.exchangeInput.value;
            const fe = (isValidValue(e)) ? normalizeExch(e) : e;

            if (fe !== val) {
                this.exchangeInput.value = val;
            }
        }

        const normExch = normalizeExch(val);

        const exchSigns = `${destCurr.sign}/${srcCurr.sign}`;
        this.exchangeSign.textContent = exchSigns;

        let exchText = exchSigns;
        if (isValidValue(normExch) && normExch !== 1 && normExch !== 0) {
            const fsa = window.app.model.transaction.srcAmount();
            const fda = window.app.model.transaction.destAmount();
            const invExch = parseFloat((fsa / fda).toFixed(5));

            exchText += ` (${invExch} ${srcCurr.sign}/${destCurr.sign})`;
        }

        if (this.exchangeInfo) {
            this.exchangeInfo.setTitle(`${normExch} ${exchText}`);
        }
    }

    /**
     * Set result balance of source value at View
     * @param {*} val - source result balance value
     * @param {boolean} valid - valid value flag
     */
    setSrcResultBalance(val, valid) {
        if (typeof val === 'undefined' && typeof valid === 'undefined') {
            return;
        }

        if (this.srcResBalanceInput) {
            const s2Src = this.srcResBalanceInput.value;
            const s2valid = isValidValue(s2Src);
            const fs2Src = (s2valid) ? normalize(s2Src) : s2Src;

            if (fs2Src !== val) {
                this.srcResBalanceInput.value = val;
            }
        }

        if (this.srcResBalanceInfo) {
            const fmtBal = window.app.model.currency.formatCurrency(
                isValidValue(val) ? val : valid,
                window.app.model.transaction.srcCurr(),
            );
            this.srcResBalanceInfo.setTitle(fmtBal);
        }
    }

    /**
     * Set result balance of destination value at View
     * @param {*} val - destination result balance value
     * @param {boolean} valid - valid value flag
     */
    setDestResultBalance(val, valid) {
        if ((typeof val === 'undefined' && typeof valid === 'undefined')
            || window.app.model.transaction.isExpense()) {
            return;
        }

        if (this.destResBalanceInput) {
            const s2Dest = this.destResBalanceInput.value;
            const s2valid = isValidValue(s2Dest);
            const fs2Dest = (s2valid) ? normalize(s2Dest) : s2Dest;

            if (fs2Dest !== val) {
                this.destResBalanceInput.value = val;
            }
        }

        if (this.destResBalanceInfo) {
            const fmtBal = window.app.model.currency.formatCurrency(
                isValidValue(val) ? val : valid,
                window.app.model.transaction.destCurr(),
            );
            this.destResBalanceInfo.setTitle(fmtBal);
        }
    }

    /**
     * Update information on person tile on currency change
     */
    updatePersonTile() {
        if (!window.app.model.transaction.isDebt() || !this.personTile) {
            return;
        }

        const person = window.app.model.persons.getItem(this.personIdInp.value);
        if (!person) {
            return;
        }

        const currencyId = window.app.model.transaction.debtType
            ? window.app.model.transaction.srcCurr()
            : window.app.model.transaction.destCurr();
        const personAccount = window.app.model.accounts.getPersonAccount(person.id, currencyId);
        const personBalance = (personAccount) ? personAccount.balance : 0;

        this.personTile.render({
            title: person.name,
            subtitle: window.app.model.currency.formatCurrency(personBalance, currencyId),
        });
    }

    /**
     * Update currency signs near to input fields
     */
    updateCurrSigns() {
        const trModel = window.app.model.transaction;

        this.setSign(this.destAmountSign, this.destCurrDDList, trModel.destCurr());
        this.setSign(this.srcAmountSign, this.srcCurrDDList, trModel.srcCurr());
        this.setSign(this.srcResBalanceSign, null, trModel.srcCurr());
        this.setSign(this.destResBalanceSign, null, trModel.destCurr());
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
     * Change account event handler
     */
    onChangeAcc() {
        let tile = null;
        let accountInp = null;
        const trModel = window.app.model.transaction;
        const isDiff = trModel.isDiff();

        if (trModel.isExpense()) {
            accountInp = this.srcIdInp;
            tile = this.srcTile;
        } else if (trModel.isIncome()) {
            accountInp = this.destIdInp;
            tile = this.destTile;
        } else if (trModel.isDebt()) {
            accountInp = this.debtAccountInp;
            tile = this.debtAccountTile;
        }

        const accountId = parseInt(accountInp.value, 10);
        if (trModel.isExpense()
            || (trModel.isDebt() && !trModel.debtType)) {
            trModel.updateValue('src_id', accountId);
            this.onSrcCurrChanged();
            if (!isDiff) {
                const copyCurrency = trModel.srcCurr();
                trModel.updateValue('dest_curr', copyCurrency);
                this.onDestCurrChanged(copyCurrency);
            }
        } else if (trModel.isIncome()
            || (trModel.isDebt() && trModel.debtType)) {
            trModel.updateValue('dest_id', accountId);
            this.onDestCurrChanged();
            if (!isDiff) {
                const copyCurrency = trModel.destCurr();
                trModel.updateValue('src_curr', copyCurrency);
                this.onSrcCurrChanged(copyCurrency);
            }
        }

        if (trModel.isDebt()) {
            this.updatePersonTile();
            const srcAmount = trModel.srcAmount();
            this.setSrcAmount(isValidValue(srcAmount) ? srcAmount : '');
        }

        if (accountId) {
            tile.render(window.app.model.accounts.getItem(accountId));
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

        if (this.state.transaction.type === DEBT) {
            this.onDebtSubmit(e);
        } else if (this.state.transaction.type === TRANSFER && this.state.isUpdate) {
            this.onTransferSubmit(e);
        } else {
            this.onSubmit(e);
        }
    }

    /**
     * Expense/Income transaction 'submit' event handler
     */
    onSubmit(e) {
        const { sourceAmount, destAmount } = this.state.form;
        let valid = true;

        if (isVisible(this.destAmountRow)) {
            if (
                this.state.transaction.dest_amount <= 0
                || !isNum(fixFloat(destAmount))
            ) {
                this.state.validation.destAmount = false;
                valid = false;
            }
        }

        if (isVisible(this.srcAmountRow)) {
            if (
                this.state.transaction.src_amount <= 0
                || !isNum(fixFloat(sourceAmount))
            ) {
                this.state.validation.sourceAmount = false;
                valid = false;
            }
        }

        if (!checkDate(this.dateInput.value)) {
            this.state.validation.date = false;
            valid = false;
        }

        if (valid) {
            this.srcAmountInput.value = fixFloat(sourceAmount);
            this.destAmountInput.value = fixFloat(destAmount);

            this.submitStarted = true;
            enable(this.submitBtn, false);
        } else {
            e.preventDefault();
            this.render(this.state);
        }
    }

    /**
     * Transfer transaction submit event handler
     */
    onTransferSubmit(e) {
        const { sourceAmount, destAmount } = this.state.form;
        let valid = true;

        if (
            this.state.transaction.src_amount <= 0
            || !isNum(fixFloat(sourceAmount))
        ) {
            this.state.validation.sourceAmount = false;
            valid = false;
        }

        if (this.state.isDiff
            && (
                this.state.transaction.dest_amount <= 0
                || !isNum(fixFloat(destAmount))
            )) {
            this.state.validation.destAmount = false;
            valid = false;
        }

        if (!checkDate(this.dateInput.value)) {
            this.state.validation.date = false;
            valid = false;
        }

        if (valid) {
            this.srcAmountInput.value = fixFloat(sourceAmount);
            this.destAmountInput.value = fixFloat(destAmount);
            this.submitStarted = true;
            enable(this.submitBtn, false);
        } else {
            e.preventDefault();
            this.render(this.state);
        }
    }

    /**
     * Debt transaction submit event handler
     */
    onDebtSubmit(e) {
        const { sourceAmount, destAmount } = this.state.form;
        let valid = true;

        if (this.state.transaction.noAccount) {
            this.debtAccountInp.value = 0;
        }

        if (
            this.state.transaction.src_amount <= 0
            || !isNum(fixFloat(sourceAmount))
        ) {
            this.state.validation.sourceAmount = false;
            valid = false;
        }

        if (!checkDate(this.dateInput.value)) {
            this.state.validation.date = false;
            valid = false;
        }

        if (valid) {
            this.srcAmountInput.value = fixFloat(sourceAmount);
            this.destAmountInput.value = fixFloat(destAmount);
            this.submitStarted = true;
            enable(this.submitBtn, false);
        } else {
            e.preventDefault();
            this.render(this.state);
        }
    }

    /**
     * Debt operation type change event handler
     */
    onChangeDebtOp() {
        const debtType = this.debtGiveRadio.checked;
        if (this.state.transaction.debtType === debtType) {
            return;
        }

        this.state.transaction.debtType = debtType;

        if (debtType) {
            this.state.srcAccount = this.state.personAccount;
            this.state.destAccount = this.state.account;
        } else {
            this.state.srcAccount = this.state.account;
            this.state.destAccount = this.state.personAccount;
        }
        this.state.transaction.src_id = this.state.srcAccount.id;
        this.state.transaction.dest_id = this.state.destAccount.id;

        if (this.state.srcAccount) {
            const sourceResult = normalize(this.state.srcAccount.balance - this.state.transaction.src_amount);
            this.state.form.sourceResult = sourceResult;
            this.state.form.fSourceResult = sourceResult;
        } else if (this.state.transaction.noAccount && !debtType) {
            const lastAcc = window.app.model.accounts.getItem(this.state.transaction.lastAcc_id);

            const sourceResult = normalize(lastAcc.balance - this.state.transaction.src_amount);
            this.state.form.sourceResult = sourceResult;
            this.state.form.fSourceResult = sourceResult;
        }

        if (this.state.destAccount) {
            const destResult = normalize(this.state.destAccount.balance + this.state.transaction.dest_amount);
            this.state.form.destResult = destResult;
            this.state.form.fDestResult = destResult;
        } else if (this.state.transaction.noAccount && debtType) {
            const lastAcc = window.app.model.accounts.getItem(this.state.transaction.lastAcc_id);

            const destResult = normalize(lastAcc.balance + this.state.transaction.dest_amount);
            this.state.form.destResult = destResult;
            this.state.form.fDestResult = destResult;
        }

        if (debtType) {
            if (this.state.id === 3) {
                this.state.id = 0;
            } else if (this.state.id === 4) {
                this.state.id = 1;
            } else if (this.state.id === 5) {
                this.state.id = 2;
            } else if (this.state.id === 7) {
                this.state.id = 6;
            } else if (this.state.id === 8) {
                this.state.id = 9;
            }
        } else {
            if (this.state.id === 0) {
                this.state.id = 3;
            } else if (this.state.id === 1) {
                this.state.id = 4;
            } else if (this.state.id === 2) {
                this.state.id = 5;
            } else if (this.state.id === 6) {
                this.state.id = 7;
            } else if (this.state.id === 9) {
                this.state.id = 8;
            }
        }

        return this.render(this.state);
    }

    /**
     * Source account change event handler
     */
    onChangeSource() {
        const trModel = window.app.model.transaction;

        trModel.updateValue('src_id', this.srcIdInp.value);
        this.onSrcCurrChanged();

        if (this.srcIdInp.value === this.destIdInp.value) {
            const { visibleUserAccounts } = window.app.model;
            const nextAccount = visibleUserAccounts.getNextAccount(this.destIdInp.value);
            if (nextAccount !== 0) {
                this.destIdInp.value = nextAccount;
                trModel.updateValue('dest_id', nextAccount);
                this.destDDList.selectItem(nextAccount);
                this.onDestCurrChanged();
            }
        }

        if (trModel.isDebt()) {
            this.updatePersonTile();
        } else {
            if (this.srcTile) {
                this.srcTile.render(
                    window.app.model.accounts.getItem(trModel.srcAcc()),
                );
            }
            if (this.destTile) {
                this.destTile.render(
                    window.app.model.accounts.getItem(trModel.destAcc()),
                );
            }
        }
    }

    /**
     * Destination account change event handler
     */
    onChangeDest() {
        const trModel = window.app.model.transaction;

        trModel.updateValue('dest_id', this.destIdInp.value);
        this.onDestCurrChanged();

        if (this.srcIdInp.value === this.destIdInp.value) {
            const { visibleUserAccounts } = window.app.model;
            const nextAccount = visibleUserAccounts.getNextAccount(this.srcIdInp.value);
            if (nextAccount !== 0) {
                this.srcIdInp.value = nextAccount;
                trModel.updateValue('src_id', nextAccount);
                this.srcDDList.selectItem(nextAccount);
                this.onSrcCurrChanged();
            }
        }

        if (trModel.isDebt()) {
            this.updatePersonTile();
        } else {
            if (this.srcTile) {
                this.srcTile.render(window.app.model.accounts.getItem(trModel.srcAcc()));
            }
            if (this.destTile) {
                this.destTile.render(window.app.model.accounts.getItem(trModel.destAcc()));
            }
        }
    }

    /** Set new source amount and calculate source result balance */
    setStateSourceAmount(amount) {
        const sourceAmount = normalize(amount);
        this.state.transaction.src_amount = sourceAmount;
        this.state.form.sourceAmount = amount;

        if (this.state.transaction.type !== DEBT) {
            if (this.state.srcAccount) {
                const srcResult = normalize(this.state.srcAccount.balance - sourceAmount);
                this.state.form.sourceResult = srcResult;
                this.state.form.fSourceResult = srcResult;
            }
        } else {
            if (this.state.srcAccount && !this.state.transaction.noAccount) {
                const sourceResult = normalize(this.state.srcAccount.balance - sourceAmount);
                this.state.form.sourceResult = sourceResult;
                this.state.form.fSourceResult = sourceResult;
            } else if (this.state.transaction.noAccount) {
                if (this.state.transaction.debtType) {
                    const sourceResult = normalize(this.state.personAccount.balance - sourceAmount);
                    this.state.form.sourceResult = sourceResult;
                    this.state.form.fSourceResult = sourceResult;
                } else {
                    const lastAcc = window.app.model.accounts.getItem(this.state.transaction.lastAcc_id);
                    const accBalance = (lastAcc) ? lastAcc.balance : 0;
                    const sourceResult = normalize(accBalance - sourceAmount);
                    this.state.form.sourceResult = sourceResult;
                    this.state.form.fSourceResult = sourceResult;
                }
            }
        }
    }

    /** Set new destination amount and calculate destination result balance */
    setStateDestAmount(amount) {
        const destAmount = normalize(amount);
        this.state.transaction.dest_amount = destAmount;
        this.state.form.destAmount = amount;

        if (this.state.transaction.type !== DEBT) {
            if (this.state.destAccount) {
                const destResult = normalize(this.state.destAccount.balance + destAmount);
                this.state.form.destResult = destResult;
                this.state.form.fDestResult = destResult;
            }
        } else {
            if (this.state.destAccount && !this.state.transaction.noAccount) {
                const destResult = normalize(this.state.destAccount.balance + destAmount);
                this.state.form.destResult = destResult;
                this.state.form.fDestResult = destResult;
            } else if (this.state.transaction.debtType) {
                const lastAcc = window.app.model.accounts.getItem(this.state.transaction.lastAcc_id);
                const accBalance = (lastAcc) ? lastAcc.balance : 0;
                const destResult = normalize(accBalance + destAmount);
                this.state.form.destResult = destResult;
                this.state.form.fDestResult = destResult;
            } else {
                const destResult = normalize(this.state.personAccount.balance + destAmount);
                this.state.form.destResult = destResult;
                this.state.form.fDestResult = destResult;
            }
        }
    }

    calculateExchange(state) {
        const source = state.transaction.src_amount;
        const destination = state.transaction.dest_amount;

        if (source === 0 || destination === 0) {
            return 1;
        }

        return normalizeExch(destination / source);
    }

    updateStateExchange() {
        const exchange = this.calculateExchange(this.state);
        this.state.form.fExchange = exchange;
        this.state.form.exchange = exchange;
    }

    /**
     * Field input event handler
     * @param {InputEvent} e - event object
     */
    onFInput(e) {
        const newValue = (e.target.id === 'exchrate')
            ? normalizeExch(e.target.value)
            : normalize(e.target.value);

        if (this.state.transaction.type !== DEBT) {
            if (e.target.id === 'src_amount') {
                this.state.validation.sourceAmount = true;
            }
            if (e.target.id === 'dest_amount') {
                this.state.validation.destAmount = true;
            }
        }

        if (this.state.transaction.type === EXPENSE) {
            if (e.target.id === 'src_amount') {
                this.state.form.sourceAmount = e.target.value;
                if (this.state.transaction.src_amount !== newValue) {
                    this.setStateSourceAmount(newValue);
                    this.updateStateExchange();
                }
            } else if (e.target.id === 'dest_amount') {
                this.state.form.destAmount = e.target.value;
                if (this.state.transaction.dest_amount !== newValue) {
                    this.state.transaction.dest_amount = newValue;
                    if (this.state.isDiff) {
                        if (isValidValue(this.state.form.sourceAmount)) {
                            this.updateStateExchange();
                        }
                    } else {
                        this.setStateSourceAmount(newValue);
                    }
                }
            } else if (e.target.id === 'exchrate') {
                this.state.form.exchange = e.target.value;
                if (this.state.form.fExchange !== newValue) {
                    this.state.form.fExchange = newValue;
                    if (isValidValue(this.state.form.sourceAmount)) {
                        const destAmount = normalize(this.state.transaction.src_amount * newValue);
                        this.setStateDestAmount(destAmount);
                    } else if (isValidValue(this.state.form.destAmount)) {
                        const srcAmount = normalize(this.state.transaction.dest_amount / newValue);
                        this.setStateSourceAmount(srcAmount);
                    }
                }
            } else if (e.target.id === 'resbal') {
                this.state.form.sourceResult = e.target.value;
                if (this.state.form.fSourceResult !== newValue) {
                    this.state.form.fSourceResult = newValue;

                    const srcAmount = normalize(this.state.srcAccount.balance - newValue);
                    this.state.transaction.src_amount = srcAmount;
                    this.state.form.sourceAmount = srcAmount;

                    if (this.state.isDiff) {
                        this.updateStateExchange();
                    } else {
                        this.state.transaction.dest_amount = srcAmount;
                        this.state.form.destAmount = srcAmount;
                    }
                }
            } else {
                return;
            }

            return this.render(this.state);
        }

        if (this.state.transaction.type === INCOME) {
            if (e.target.id === 'src_amount') {
                this.state.form.sourceAmount = e.target.value;
                if (this.state.transaction.src_amount !== newValue) {
                    this.state.transaction.src_amount = newValue;

                    if (this.state.isDiff) {
                        if (isValidValue(this.state.form.destAmount)) {
                            this.updateStateExchange();
                        }
                    } else {
                        this.setStateDestAmount(newValue);
                    }
                }
            } else if (e.target.id === 'dest_amount') {
                this.state.form.destAmount = e.target.value;
                if (this.state.transaction.dest_amount !== newValue) {
                    this.setStateDestAmount(newValue);

                    if (this.state.isDiff) {
                        this.updateStateExchange();
                    } else {
                        this.setStateSourceAmount(newValue);
                    }
                }
            } else if (e.target.id === 'exchrate') {
                this.state.form.exchange = e.target.value;
                if (this.state.form.fExchange !== newValue) {
                    this.state.form.fExchange = newValue;
                    if (isValidValue(this.state.form.sourceAmount)) {
                        const destAmount = normalize(this.state.transaction.src_amount * newValue);
                        this.setStateDestAmount(destAmount);
                    } else if (isValidValue(this.state.form.destAmount)) {
                        const srcAmount = normalize(this.state.transaction.dest_amount / newValue);
                        this.setStateSourceAmount(srcAmount);
                    }
                }
            } else if (e.target.id === 'resbal_d') {
                this.state.form.destResult = e.target.value;
                if (this.state.form.fDestResult !== newValue) {
                    this.state.form.fDestResult = newValue;

                    const srcAmount = normalize(newValue - this.state.destAccount.balance);
                    this.state.transaction.src_amount = srcAmount;
                    this.state.form.sourceAmount = srcAmount;

                    if (this.state.isDiff) {
                        this.updateStateExchange();
                    } else {
                        this.setStateDestAmount(srcAmount);
                    }
                }
            } else {
                return;
            }

            return this.render(this.state);
        }

        if (this.state.transaction.type === TRANSFER) {
            if (e.target.id === 'src_amount') {
                this.state.form.sourceAmount = e.target.value;
                if (this.state.transaction.src_amount !== newValue) {
                    this.setStateSourceAmount(e.target.value);
                    if (this.state.isDiff) {
                        this.updateStateExchange();
                    } else {
                        this.setStateDestAmount(newValue);
                    }
                }
            } else if (e.target.id === 'dest_amount') {
                this.state.form.destAmount = e.target.value;
                if (this.state.transaction.dest_amount !== newValue) {
                    this.setStateDestAmount(e.target.value);
                    if (this.state.isDiff) {
                        this.updateStateExchange();
                    } else {
                        this.setStateSourceAmount(newValue);
                    }
                }
            } else if (e.target.id === 'exchrate') {
                this.state.form.exchange = e.target.value;
                if (this.state.form.fExchange !== newValue) {
                    this.state.form.fExchange = newValue;
                    if (isValidValue(this.state.form.sourceAmount)) {
                        const destAmount = normalize(this.state.transaction.src_amount * newValue);
                        this.setStateDestAmount(destAmount);
                    } else if (isValidValue(this.state.form.destAmount)) {
                        const srcAmount = normalize(this.state.transaction.dest_amount / newValue);
                        this.setStateSourceAmount(srcAmount);
                    }
                }
            } else if (e.target.id === 'resbal') {
                this.state.form.sourceResult = e.target.value;
                if (this.state.form.fSourceResult !== newValue) {
                    this.state.form.fSourceResult = newValue;

                    const srcAmount = normalize(this.state.srcAccount.balance - newValue);
                    this.state.transaction.src_amount = srcAmount;
                    this.state.form.sourceAmount = srcAmount;

                    if (this.state.isDiff) {
                        this.updateStateExchange();
                    } else {
                        this.setStateDestAmount(srcAmount);
                    }
                }
            } else if (e.target.id === 'resbal_d') {
                this.state.form.destResult = e.target.value;
                if (this.state.form.fDestResult !== newValue) {
                    this.state.form.fDestResult = newValue;

                    const destAmount = normalize(newValue - this.state.destAccount.balance);
                    this.state.transaction.dest_amount = destAmount;
                    this.state.form.destAmount = destAmount;

                    if (this.state.isDiff) {
                        this.updateStateExchange();
                    } else {
                        this.setStateSourceAmount(destAmount);
                    }
                }
            } else {
                return;
            }

            return this.render(this.state);
        }

        if (this.state.transaction.type === DEBT) {
            if (e.target.id === 'src_amount') {
                this.state.form.sourceAmount = e.target.value;
                if (this.state.transaction.src_amount !== newValue
                    || this.state.form.sourceResult === '') {
                    this.setStateSourceAmount(e.target.value);
                    this.setStateDestAmount(newValue);
                }
            } else if (e.target.id === 'resbal') {
                this.state.form.sourceResult = e.target.value;
                if (this.state.form.fSourceResult !== newValue) {
                    this.state.form.fSourceResult = newValue;

                    const srcAmount = normalize(this.state.srcAccount.balance - newValue);
                    this.state.transaction.src_amount = srcAmount;
                    this.state.form.sourceAmount = srcAmount;

                    this.setStateDestAmount(srcAmount);
                }
            } else if (e.target.id === 'resbal_d') {
                this.state.form.destResult = e.target.value;
                if (this.state.form.fDestResult !== newValue) {
                    this.state.form.fDestResult = newValue;

                    const destAmount = normalize(newValue - this.state.destAccount.balance);
                    this.state.transaction.dest_amount = destAmount;
                    this.state.form.destAmount = destAmount;

                    this.setStateSourceAmount(destAmount);
                }
            } else {
                return;
            }

            return this.render(this.state);
        }

        const trModel = window.app.model.transaction;
        const obj = e.target;

        if (obj.id === 'src_amount') {
            this.clearBlockValidation('src_amount_row');
            trModel.updateValue('src_amount', obj.value);
        } else if (obj.id === 'dest_amount') {
            this.clearBlockValidation('dest_amount_row');
            trModel.updateValue('dest_amount', obj.value);
        } else if (obj.id === 'exchrate') {
            trModel.updateValue('exchrate', obj.value);
        } else if (obj.id === 'resbal') {
            trModel.updateValue('src_resbal', obj.value);
        } else if (obj.id === 'resbal_d') {
            trModel.updateValue('dest_resbal', obj.value);
        }

        return true;
    }

    /**
     * Transaction model value changed notification callback
     * @param {string} item - transaction model item name
     * @param {*} value - new value of specified item
     */
    onValueChanged(item, value) {
        if (item === 'src_amount') {
            this.setSrcAmount(value);
        } else if (item === 'dest_amount') {
            this.setDestAmount(value);
        } else if (item === 'exchrate') {
            this.setExchRate(value);
        } else if (item === 'src_resbal') {
            this.setSrcResultBalance(value, 0);
        } else if (item === 'dest_resbal') {
            this.setDestResultBalance(value, 0);
        } else if (item === 'src_curr') {
            this.onSrcCurrChanged(value);
        } else if (item === 'dest_curr') {
            this.onDestCurrChanged(value);
        }
    }

    /**
     * Source currency change event handler
     */
    onChangeSrcCurr() {
        const srcCurr = parseInt(this.srcCurrInp.value, 10);
        window.app.model.transaction.updateValue('src_curr', srcCurr);
    }

    /**
     * Update layout on source curency changed
     * @param {number|undefined} value - new source currency value
     */
    onSrcCurrChanged(value) {
        const trModel = window.app.model.transaction;
        let toShowDestAmount = false;

        if (typeof value !== 'undefined' && this.srcCurrInp) {
            this.srcCurrInp.value = value;
        }

        const sAmVis = isVisible(this.srcAmountRow);
        const sResVis = isVisible(this.srcResBalanceRow);
        const dResVis = isVisible(this.destResBalanceRow);
        const exchVis = isVisible(this.exchangeRow);

        if (trModel.isDiff()) {
            this.setAmountInputLabel(true, true);
            this.setAmountTileBlockLabel(true, true);
            this.setAmountInputLabel(false, true);
            this.setAmountTileBlockLabel(false, true);
            if (trModel.isIncome()) {
                this.setCurrActive(true, true); // set source active
                this.setCurrActive(false, false); // set destination inactive
            }

            if (trModel.isTransfer()) {
                toShowDestAmount = !dResVis && !(sResVis && exchVis) && !(sAmVis && exchVis);
            } else {
                toShowDestAmount = !sResVis && !dResVis && !exchVis;
            }
            this.destAmountSwitch(toShowDestAmount);

            if (trModel.isTransfer()) {
                this.srcAmountSwitch(!sResVis);
            }

            if (!isVisible(this.exchangeRow)) {
                this.exchRateSwitch(false);
            }
            this.setExchRate(trModel.exchRate());
        } else {
            this.setAmountInputLabel(true, false);
            this.setAmountInputLabel(false, false);
            this.setAmountTileBlockLabel(true, false);
            this.setAmountTileBlockLabel(false, false);
            if (trModel.isExpense()) {
                this.hideSrcAmountAndExchange();
            } else if (trModel.isIncome()
                || trModel.isTransfer()
                || trModel.isDebt()) {
                this.hideDestAmountAndExchange();
            }

            if (trModel.isIncome()
                || trModel.isTransfer()
                || trModel.isDebt()) {
                this.srcAmountSwitch(!dResVis && !sResVis);
            }
            if (trModel.isExpense()) {
                this.destAmountSwitch(!sResVis);
            }

            if (trModel.isTransfer()) {
                if (sResVis && dResVis) {
                    this.resBalanceDestSwitch(false);
                }
            } else if (trModel.isDebt()) {
                if (trModel.noAccount) {
                    if (trModel.debtType) {
                        this.resBalanceDestSwitch(false);
                    } else {
                        this.resBalanceSwitch(false);
                    }
                }
            }
        }

        this.updateCurrSigns();
        this.updatePersonTile();
    }

    /**
     * Destination currency change event handler
     */
    onChangeDestCurr() {
        const destCurr = parseInt(this.destCurrInp.value, 10);
        window.app.model.transaction.updateValue('dest_curr', destCurr);
    }

    /**
     * Update layout on destination curency changed
     * @param {number|undefined} value - new destination currency value
     */
    onDestCurrChanged(value) {
        const trModel = window.app.model.transaction;
        let toShowSrcAmount = false;

        if (typeof value !== 'undefined' && this.destCurrInp) {
            this.destCurrInp.value = value;
        }

        const sAmVis = isVisible(this.srcAmountRow);
        const dAmVis = isVisible(this.destAmountRow);
        const sResVis = isVisible(this.srcResBalanceRow);
        const dResVis = isVisible(this.destResBalanceRow);
        const exchVis = isVisible(this.exchangeRow);

        if (trModel.isDiff()) {
            this.setAmountInputLabel(true, true);
            this.setAmountTileBlockLabel(true, true);
            this.setAmountInputLabel(false, true);
            this.setAmountTileBlockLabel(false, true);
            /** Set source active for Income and inactivate for other types */
            if (trModel.isIncome()) {
                this.setCurrActive(true, true); // set source active
            } else {
                this.setCurrActive(true, false); // set source inactive
            }

            /** set destination active for Expense and inactivate for other types */
            if (trModel.isExpense()) {
                this.setCurrActive(false, true);
            } else {
                this.setCurrActive(false, false);
            }

            if (trModel.isIncome()) {
                toShowSrcAmount = (sAmVis && dAmVis) || (sAmVis && dResVis) || (sAmVis && exchVis);
            } else if (trModel.isExpense()) {
                toShowSrcAmount = true;
            } else if (trModel.isTransfer()) {
                toShowSrcAmount = !sResVis;
            }
            this.srcAmountSwitch(toShowSrcAmount);

            if (trModel.isTransfer()) {
                this.destAmountSwitch(!dResVis && !(sResVis && exchVis) && !(sAmVis && exchVis));
            }

            if (!isVisible(this.exchangeRow)) {
                this.exchRateSwitch(false);
            }
            this.setExchRate(trModel.exchRate());
        } else {
            this.setAmountInputLabel(true, false);
            this.setAmountInputLabel(false, false);
            this.setAmountTileBlockLabel(true, false);
            this.setAmountTileBlockLabel(false, false);

            if (trModel.isExpense()) {
                this.destAmountSwitch(!sResVis);
                this.hideSrcAmountAndExchange();
            } else {
                this.srcAmountSwitch(!dResVis && !sResVis);
                this.hideDestAmountAndExchange();
            }

            if (trModel.isTransfer()) {
                if (sResVis && dResVis) {
                    this.resBalanceSwitch(false);
                }
            } else if (trModel.isDebt()) {
                if (trModel.noAccount) {
                    if (trModel.debtType) {
                        this.resBalanceDestSwitch(false);
                    } else {
                        this.resBalanceSwitch(false);
                    }
                }
            }
        }

        this.updateCurrSigns();
        this.updatePersonTile();
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

        const personBalance = state.srcCurrency.formatValue(state.personAccount.balance);
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

        if (state.transaction.type === EXPENSE) {
            this.renderExpense(state);
        } else if (state.transaction.type === INCOME) {
            this.renderIncome(state);
        } else if (state.transaction.type === TRANSFER) {
            this.renderTransfer(state);
        } else if (state.transaction.type === DEBT) {
            this.renderDebt(state);
        }

        if (this.srcTile) {
            this.srcTile.render(state.srcAccount);
        }
        if (this.destTile) {
            this.destTile.render(state.destAccount);
        }

        if (this.srcIdInp) {
            this.srcIdInp.value = state.transaction.src_id;
        }
        if (this.destIdInp) {
            this.destIdInp.value = state.transaction.dest_id;
        }

        if (this.srcDDList) {
            this.srcDDList.selectItem(state.transaction.src_id);
        }
        if (this.destDDList) {
            this.destDDList.selectItem(state.transaction.dest_id);
        }

        this.srcCurrInp.value = state.transaction.src_curr;
        this.destCurrInp.value = state.transaction.dest_curr;

        this.setAmountInputLabel(true, state.isDiff);
        this.setAmountInputLabel(false, state.isDiff);
        this.setAmountTileBlockLabel(true, state.isDiff);
        this.setAmountTileBlockLabel(false, state.isDiff);

        this.setSign(this.destAmountSign, this.destCurrDDList, state.transaction.dest_curr);
        this.setSign(this.srcAmountSign, this.srcCurrDDList, state.transaction.src_curr);
        this.setSign(this.srcResBalanceSign, null, state.transaction.src_curr);
        this.setSign(this.destResBalanceSign, null, state.transaction.dest_curr);
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

        if (this.srcAmountInfo) {
            const title = state.srcCurrency.formatValue(state.transaction.src_amount);
            this.srcAmountInfo.setTitle(title);
        }

        if (this.destAmountInfo) {
            const title = state.destCurrency.formatValue(state.transaction.dest_amount);
            this.destAmountInfo.setTitle(title);
        }

        if (this.srcResBalanceInfo) {
            const title = state.srcCurrency.formatValue(state.form.fSourceResult);
            this.srcResBalanceInfo.setTitle(title);
        }

        if (this.destResBalanceInfo) {
            const title = state.destCurrency.formatValue(state.form.fDestResult);
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
