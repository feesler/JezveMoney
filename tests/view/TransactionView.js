import { TestComponent } from 'jezve-test';
import { AppView } from './AppView.js';
import {
    convDate,
    correct,
    correctExch,
    normalize,
    isValidValue,
    normalizeExch,
} from '../common.js';
import { TransactionTypeMenu } from './component/TransactionTypeMenu.js';
import { InputRow } from './component/InputRow.js';
import { IconLink } from './component/IconLink.js';
import { WarningPopup } from './component/WarningPopup.js';
import { DatePickerRow } from './component/DatePickerRow.js';
import { CommentRow } from './component/CommentRow.js';
import { TileInfoItem } from './component/TileInfoItem.js';
import { TileBlock } from './component/TileBlock.js';
import { Button } from './component/Button.js';
import {
    EXPENSE,
    INCOME,
    TRANSFER,
    DEBT,
} from '../model/Transaction.js';
import { Currency } from '../model/Currency.js';
import { App } from '../Application.js';

/** Create or update transaction view class */
export class TransactionView extends AppView {
    constructor(...args) {
        super(...args);

        this.expectedState = {};
    }

    async parseContent() {
        const res = {};

        res.isUpdate = (await this.url()).includes('/edit/');

        if (res.isUpdate) {
            const hiddenEl = await this.query('input[name="id"]');
            if (!hiddenEl) {
                throw new Error('Transaction id field not found');
            }

            res.id = parseInt(await this.prop(hiddenEl, 'value'), 10);
            if (!res.id) {
                throw new Error('Wrong transaction id');
            }
        }

        res.heading = { elem: await this.query('.heading > h1') };
        if (res.heading.elem) {
            res.heading.title = await this.prop(res.heading.elem, 'textContent');
        }

        res.delBtn = await IconLink.create(this, await this.query('#del_btn'));

        res.typeMenu = await TransactionTypeMenu.create(this, await this.query('.trtype-menu'));
        if (res.typeMenu.multi) {
            throw new Error('Invalid transaction type menu');
        }

        res.person = await TileBlock.create(this, await this.query('#person'));
        if (res.person) {
            const personIdInp = await this.query('#person_id');
            res.person.id = parseInt(await this.prop(personIdInp, 'value'), 10);
        }

        res.account = await TileBlock.create(this, await this.query('#debtaccount'));
        if (res.account) {
            const accountIdInp = await this.query('#acc_id');
            res.account.id = parseInt(await this.prop(accountIdInp, 'value'), 10);
            res.accTileContainer = { elem: await this.query('#debtaccount .tile_container') };
        }

        res.operation = await this.parseOperation(await this.query('#operation'));

        res.selaccount = await Button.create(this, await this.query('#selaccount'));
        if (!res.selaccount) {
            throw new Error('Select account button not found');
        }

        res.noacc_btn = await Button.create(this, await this.query('#noacc_btn'));
        if (!res.noacc_btn) {
            throw new Error('Disable account button not found');
        }

        res.source = await TileBlock.create(this, await this.query('#source'));
        if (res.source) {
            const srcIdInp = await this.query('#src_id');
            res.source.id = parseInt(await this.prop(srcIdInp, 'value'), 10);
        }
        res.destination = await TileBlock.create(this, await this.query('#destination'));
        if (res.destination) {
            const destIdInp = await this.query('#dest_id');
            res.destination.id = parseInt(await this.prop(destIdInp, 'value'), 10);
        }

        res.src_amount_left = await TileInfoItem.create(this, await this.query('#src_amount_left'));
        res.dest_amount_left = await TileInfoItem.create(this, await this.query('#dest_amount_left'));
        res.src_res_balance_left = await TileInfoItem.create(this, await this.query('#src_res_balance_left'));
        res.dest_res_balance_left = await TileInfoItem.create(this, await this.query('#dest_res_balance_left'));
        res.exch_left = await TileInfoItem.create(this, await this.query('#exch_left'));

        res.src_amount_row = await InputRow.create(this, await this.query('#src_amount_row'));
        res.dest_amount_row = await InputRow.create(this, await this.query('#dest_amount_row'));
        res.exchange_row = await InputRow.create(this, await this.query('#exchange'));
        res.result_balance_row = await InputRow.create(this, await this.query('#result_balance'));
        res.result_balance_dest_row = await InputRow.create(this, await this.query('#result_balance_dest'));

        const calendarBtn = await this.query('#calendar_btn');
        res.datePicker = await DatePickerRow.create(this, await this.parentNode(calendarBtn));
        const commentBtn = await this.query('#comm_btn');
        res.comment_row = await CommentRow.create(this, await this.parentNode(commentBtn));

        res.submitBtn = await this.query('#submitbtn');
        res.cancelBtn = await this.query('#submitbtn + *');

        res.delete_warning = await WarningPopup.create(this, await this.query('#delete_warning'));

        return res;
    }

    async parseOperation(el) {
        const res = { elem: el };

        if (!res.elem) {
            return null;
        }

        res.debtgive = await this.query('#debtgive');
        res.debttake = await this.query('#debttake');

        res.type = await this.prop(res.debtgive, 'checked');

        return res;
    }

    async buildModel(cont) {
        if (cont.typeMenu.isSingleSelected(EXPENSE)) {
            return this.buildExpenseModel(cont);
        }
        if (cont.typeMenu.isSingleSelected(INCOME)) {
            return this.buildIncomeModel(cont);
        }
        if (cont.typeMenu.isSingleSelected(TRANSFER)) {
            return this.buildTransferModel(cont);
        }
        if (cont.typeMenu.isSingleSelected(DEBT)) {
            return this.buildDebtModel(cont);
        }

        throw new Error('Invalid type selected');
    }

    async buildExpenseModel(cont) {
        const res = this.model;

        res.type = EXPENSE;
        res.isUpdate = cont.isUpdate;
        if (res.isUpdate) {
            res.id = cont.id;
        }

        res.srcAccount = App.state.accounts.getItem(cont.source.id);
        if (!res.srcAccount) {
            throw new Error('Source account not found');
        }

        res.src_curr_id = (cont.src_amount_row)
            ? parseInt(cont.src_amount_row.hiddenValue, 10)
            : 0;
        res.dest_curr_id = (cont.dest_amount_row)
            ? parseInt(cont.dest_amount_row.hiddenValue, 10)
            : 0;

        if (res.srcAccount.curr_id !== res.src_curr_id) {
            throw new Error(`Unexpected source currency ${res.src_curr_id} (${res.srcAccount.curr_id} is expected)`);
        }

        res.srcCurr = Currency.getById(res.src_curr_id);
        if (!res.srcCurr) {
            throw new Error('Source currency not found');
        }
        res.destCurr = Currency.getById(res.dest_curr_id);
        if (!res.destCurr) {
            throw new Error('Destination currency not found');
        }

        res.srcAccount.fmtBalance = res.srcCurr.format(res.srcAccount.balance);

        res.srcAmount = cont.src_amount_row.value;
        res.fSrcAmount = isValidValue(res.srcAmount) ? normalize(res.srcAmount) : res.srcAmount;

        res.destAmount = cont.dest_amount_row.value;
        res.fDestAmount = isValidValue(res.destAmount) ? normalize(res.destAmount) : res.destAmount;

        res.srcResBal = cont.result_balance_row.value;
        res.fSrcResBal = isValidValue(res.srcResBal) ? normalize(res.srcResBal) : res.srcResBal;
        res.fmtSrcResBal = res.srcCurr.format(res.fSrcResBal);

        res.exchRate = cont.exchange_row.value;
        this.updateExch();

        const isResBalRowVisible = await TestComponent.isVisible(cont.result_balance_row);
        const isExchRowVisible = await TestComponent.isVisible(cont.exchange_row);

        res.isDiffCurr = (res.src_curr_id !== res.dest_curr_id);
        if (res.isDiffCurr) {
            if (isExchRowVisible) {
                res.state = 3;
            } else {
                res.state = (isResBalRowVisible) ? 4 : 2;
            }
        } else {
            res.state = (isResBalRowVisible) ? 1 : 0;
        }

        res.date = cont.datePicker.date;
        res.comment = cont.comment_row.value;

        return res;
    }

    async buildIncomeModel(cont) {
        const res = this.model;

        res.type = INCOME;
        res.isUpdate = cont.isUpdate;
        if (res.isUpdate) {
            res.id = cont.id;
        }

        res.destAccount = App.state.accounts.getItem(cont.destination.id);
        if (!res.destAccount) {
            throw new Error('Destination account not found');
        }

        res.src_curr_id = (cont.src_amount_row)
            ? parseInt(cont.src_amount_row.hiddenValue, 10)
            : 0;
        res.dest_curr_id = (cont.dest_amount_row)
            ? parseInt(cont.dest_amount_row.hiddenValue, 10)
            : 0;

        if (res.destAccount.curr_id !== res.dest_curr_id) {
            throw new Error(`Unexpected destination currency ${res.dest_curr_id}(${res.destAccount.curr_id} is expected)`);
        }

        res.srcCurr = Currency.getById(res.src_curr_id);
        if (!res.srcCurr) {
            throw new Error('Source currency not found');
        }
        res.destCurr = Currency.getById(res.dest_curr_id);
        if (!res.destCurr) {
            throw new Error('Destination currency not found');
        }

        res.destAccount.fmtBalance = res.destCurr.format(res.destAccount.balance);

        res.srcAmount = cont.src_amount_row.value;
        res.fSrcAmount = isValidValue(res.srcAmount)
            ? normalize(res.srcAmount)
            : res.srcAmount;

        res.destAmount = cont.dest_amount_row.value;
        res.fDestAmount = isValidValue(res.destAmount)
            ? normalize(res.destAmount)
            : res.destAmount;

        res.destResBal = cont.result_balance_dest_row.value;
        res.fDestResBal = isValidValue(res.destResBal)
            ? normalize(res.destResBal)
            : res.destResBal;
        res.fmtDestResBal = res.destCurr.format(res.fDestResBal);

        res.exchRate = cont.exchange_row.value;
        this.updateExch();

        const isDestResBalRowVisible = await TestComponent.isVisible(cont.result_balance_dest_row);
        const isExchRowVisible = await TestComponent.isVisible(cont.exchange_row);

        res.isDiffCurr = (res.src_curr_id !== res.dest_curr_id);

        if (res.isDiffCurr) {
            if (isExchRowVisible) {
                res.state = 3;
            } else {
                res.state = (isDestResBalRowVisible) ? 4 : 2;
            }
        } else {
            res.state = (isDestResBalRowVisible) ? 1 : 0;
        }

        res.date = cont.datePicker.date;
        res.comment = cont.comment_row.value;

        return res;
    }

    async buildTransferModel(cont) {
        const res = this.model;

        res.type = TRANSFER;
        res.isUpdate = cont.isUpdate;
        if (res.isUpdate) {
            res.id = cont.id;
        }

        res.srcAccount = App.state.accounts.getItem(cont.source.id);
        if (!res.srcAccount) {
            throw new Error('Source account not found');
        }

        res.destAccount = App.state.accounts.getItem(cont.destination.id);
        if (!res.destAccount) {
            throw new Error('Destination account not found');
        }

        res.src_curr_id = (cont.src_amount_row)
            ? parseInt(cont.src_amount_row.hiddenValue, 10)
            : 0;
        res.dest_curr_id = (cont.dest_amount_row)
            ? parseInt(cont.dest_amount_row.hiddenValue, 10)
            : 0;

        if (res.srcAccount.curr_id !== res.src_curr_id) {
            throw new Error(`Unexpected destination currency ${res.dest_curr_id}(${res.destAccount.curr_id} is expected)`);
        }
        if (res.destAccount.curr_id !== res.dest_curr_id) {
            throw new Error(`Unexpected destination currency ${res.dest_curr_id}(${res.destAccount.curr_id} is expected)`);
        }

        res.srcCurr = Currency.getById(res.src_curr_id);
        if (!res.srcCurr) {
            throw new Error('Source currency not found');
        }
        res.destCurr = Currency.getById(res.dest_curr_id);
        if (!res.destCurr) {
            throw new Error('Destination currency not found');
        }

        res.srcAccount.fmtBalance = res.srcCurr.format(res.srcAccount.balance);
        res.destAccount.fmtBalance = res.destCurr.format(res.destAccount.balance);

        res.srcAmount = cont.src_amount_row.value;
        res.fSrcAmount = isValidValue(res.srcAmount) ? normalize(res.srcAmount) : res.srcAmount;

        res.destAmount = cont.dest_amount_row.value;
        res.fDestAmount = isValidValue(res.destAmount) ? normalize(res.destAmount) : res.destAmount;

        res.srcResBal = cont.result_balance_row.value;
        res.fSrcResBal = isValidValue(res.srcResBal) ? normalize(res.srcResBal) : res.srcResBal;
        res.fmtSrcResBal = res.srcCurr.format(res.fSrcResBal);

        res.destResBal = cont.result_balance_dest_row.value;
        res.fDestResBal = isValidValue(res.destResBal) ? normalize(res.destResBal) : res.destResBal;
        res.fmtDestResBal = res.destCurr.format(res.fDestResBal);

        res.exchRate = cont.exchange_row.value;
        this.updateExch();

        const isSrcAmountRowVisible = await TestComponent.isVisible(cont.src_amount_row);
        const isDestAmountRowVisible = await TestComponent.isVisible(cont.dest_amount_row);
        const isSrcResBalRowVisible = await TestComponent.isVisible(cont.result_balance_row);
        const isDestResBalRowVisible = await TestComponent.isVisible(cont.result_balance_dest_row);
        const isExchRowVisible = await TestComponent.isVisible(cont.exchange_row);

        res.isDiffCurr = (res.src_curr_id !== res.dest_curr_id);

        if (res.isDiffCurr) {
            if (isSrcAmountRowVisible && isDestAmountRowVisible) {
                res.state = 3;
            } else if (isDestAmountRowVisible && isSrcResBalRowVisible) {
                res.state = 4;
            } else if (isSrcAmountRowVisible && isDestResBalRowVisible) {
                res.state = 5;
            } else if (isSrcResBalRowVisible && isDestResBalRowVisible) {
                res.state = 6;
            } else if (isSrcAmountRowVisible && isExchRowVisible) {
                res.state = 7;
            } else if (isSrcResBalRowVisible && isExchRowVisible) {
                res.state = 8;
            } else {
                throw new Error('Unexpected state');
            }
        } else if (!res.isDiffCurr) {
            if (isSrcAmountRowVisible) {
                res.state = 0;
            } else if (isSrcResBalRowVisible) {
                res.state = 1;
            } else if (isDestResBalRowVisible) {
                res.state = 2;
            } else {
                throw new Error('Unexpected state');
            }
        }

        res.date = cont.datePicker.date;
        res.comment = cont.comment_row.value;

        return res;
    }

    async buildDebtModel(cont) {
        const res = this.model;

        res.type = DEBT;
        res.isUpdate = cont.isUpdate;
        if (res.isUpdate) {
            res.id = cont.id;
        }

        if (!cont.typeMenu.isSingleSelected(DEBT)) {
            throw new Error('Unexpected page');
        }

        res.person = App.state.persons.getItem(cont.person.id);
        res.debtType = cont.operation.type;

        res.src_curr_id = parseInt(cont.src_amount_row.hiddenValue, 10);
        res.dest_curr_id = parseInt(cont.dest_amount_row.hiddenValue, 10);
        if (res.src_curr_id !== res.dest_curr_id) {
            throw new Error('Source and destination currencies are not the same');
        }

        res.srcCurr = Currency.getById(res.src_curr_id);
        if (!res.srcCurr) {
            throw new Error('Source currency not found');
        }
        res.destCurr = Currency.getById(res.dest_curr_id);
        if (!res.destCurr) {
            throw new Error('Destination currency not found');
        }

        const personAccountCurr = (res.debtType) ? res.src_curr_id : res.dest_curr_id;
        res.personAccount = this.getPersonAccount(res.person.id, personAccountCurr);

        const isSelectAccountVisible = await TestComponent.isVisible(cont.selaccount);
        res.noAccount = isSelectAccountVisible;

        res.account = App.state.accounts.getItem(cont.account.id);
        if (!res.account && !res.noAccount) {
            throw new Error('Account not found');
        }
        if (
            !res.noAccount
            && res.account
            && res.account.curr_id !== ((res.debtType) ? res.src_curr_id : res.dest_curr_id)
        ) {
            throw new Error('Wrong currency of account');
        }

        if (this.model && this.model.lastAccount_id) {
            res.lastAccount_id = this.model.lastAccount_id;
        }

        if (res.debtType) {
            res.srcAccount = res.personAccount;
            res.destAccount = (res.noAccount) ? null : res.account;
        } else {
            res.srcAccount = (res.noAccount) ? null : res.account;
            res.destAccount = res.personAccount;
        }

        if (res.srcAccount) {
            res.srcAccount.fmtBalance = res.srcCurr.format(res.srcAccount.balance);
        }
        if (res.destAccount) {
            res.destAccount.fmtBalance = res.destCurr.format(res.destAccount.balance);
        }

        res.srcAmount = cont.src_amount_row.value;
        res.fSrcAmount = isValidValue(res.srcAmount) ? normalize(res.srcAmount) : res.srcAmount;

        res.destAmount = cont.dest_amount_row.value;
        res.fDestAmount = isValidValue(res.destAmount) ? normalize(res.destAmount) : res.destAmount;

        if (res.fSrcAmount !== res.fDestAmount) {
            throw new Error('Source and destination amount are different');
        }

        res.srcResBal = cont.result_balance_row.value;
        res.fSrcResBal = isValidValue(res.srcResBal) ? normalize(res.srcResBal) : res.srcResBal;
        res.fmtSrcResBal = res.srcCurr.format(res.fSrcResBal);

        res.destResBal = cont.result_balance_dest_row.value;
        res.fDestResBal = isValidValue(res.destResBal) ? normalize(res.destResBal) : res.destResBal;
        res.fmtDestResBal = res.destCurr.format(res.fDestResBal);

        res.exchRate = cont.exchange_row.value;
        this.updateExch();

        const isSrcAmountRowVisible = await TestComponent.isVisible(cont.src_amount_row);
        const isSrcResBalRowVisible = await TestComponent.isVisible(cont.result_balance_row);
        const isDestResBalRowVisible = await TestComponent.isVisible(cont.result_balance_dest_row);

        res.isDiffCurr = false;

        if (res.noAccount) {
            if (isSrcAmountRowVisible) {
                res.state = (res.debtType) ? 6 : 7;
            } else if (isSrcResBalRowVisible && res.debtType) {
                res.state = 9;
            } else if (isDestResBalRowVisible && !res.debtType) {
                res.state = 8;
            } else {
                throw new Error('Unexpected state');
            }
        } else if (!res.noAccount) {
            if (isSrcAmountRowVisible) {
                res.state = res.debtType ? 0 : 3;
            } else if (isSrcResBalRowVisible) {
                res.state = res.debtType ? 1 : 5;
            } else if (isDestResBalRowVisible) {
                res.state = res.debtType ? 2 : 4;
            } else {
                throw new Error('Unexpected state');
            }
        }

        res.date = cont.datePicker.date;
        res.comment = cont.comment_row.value;

        return res;
    }

    async isValid() {
        if (await TestComponent.isVisible(this.content.src_amount_row)) {
            if (!this.model.srcAmount.length || !isValidValue(this.model.srcAmount)) {
                return false;
            }
        }

        if (await TestComponent.isVisible(this.content.dest_amount_row)) {
            if (!this.model.destAmount.length || !isValidValue(this.model.destAmount)) {
                return false;
            }
        }

        const timestamp = convDate(this.model.date);
        if (!timestamp || timestamp < 0) {
            return false;
        }

        return true;
    }

    getExpectedTransaction() {
        const res = {};

        if (this.model.isUpdate) {
            res.id = this.model.id;
        }

        res.type = this.model.type;
        if (res.type === DEBT) {
            res.person_id = this.model.person.id;
            res.acc_id = this.model.noAccount ? 0 : this.model.account.id;
            res.op = this.model.debtType ? 1 : 2;
        } else {
            res.src_id = (this.model.srcAccount) ? this.model.srcAccount.id : 0;
            res.dest_id = (this.model.destAccount) ? this.model.destAccount.id : 0;
        }

        res.src_amount = this.model.fSrcAmount;
        res.dest_amount = this.model.fDestAmount;
        res.src_curr = this.model.src_curr_id;
        res.dest_curr = this.model.dest_curr_id;
        res.date = this.model.date;
        res.comment = this.model.comment;

        return res;
    }

    setExpectedState(val) {
        if (this.model.type === EXPENSE) {
            this.setExpenseExpectedState(val);
        } else if (this.model.type === INCOME) {
            this.setIncomeExpectedState(val);
        } else if (this.model.type === TRANSFER) {
            this.setTransferExpectedState(val);
        } else if (this.model.type === DEBT) {
            this.setDebtExpectedState(val);
        }
    }

    setExpenseExpectedState(stateId) {
        const newState = parseInt(stateId, 10);
        if (Number.isNaN(newState) || newState < 0 || newState > 4) {
            throw new Error('Wrong state specified');
        }

        const res = {
            model: { state: newState },
            visibility: {
                delBtn: this.model.isUpdate,
                source: true,
                destination: false,
                person: false,
                account: false,
                src_amount_left: false,
                dest_res_balance_left: false,
                result_balance_dest_row: false,
            },
            values: {
                typeMenu: { selectedTypes: [EXPENSE] },
                source: {
                    tile: {
                        name: this.model.srcAccount.name,
                        balance: this.model.srcAccount.fmtBalance,
                    },
                },
                src_amount_row: {
                    value: this.model.srcAmount.toString(),
                    currSign: this.model.srcCurr.sign,
                    isCurrActive: false,
                },
                dest_amount_row: {
                    value: this.model.destAmount.toString(),
                    currSign: this.model.destCurr.sign,
                    isCurrActive: true,
                },
                dest_amount_left: this.model.destCurr.format(this.model.fDestAmount),
                result_balance_row: {
                    value: this.model.srcResBal.toString(),
                    label: 'Result balance',
                    isCurrActive: false,
                },
                src_res_balance_left: this.model.fmtSrcResBal,
                exchange_row: {
                    value: this.model.exchRate.toString(),
                    currSign: this.model.exchSign,
                },
                exch_left: this.model.fmtExch,
            },
        };

        if (this.model.isUpdate) {
            res.values.delBtn = { title: 'Delete' };
        }

        if (newState === 0 || newState === 1) {
            Object.assign(res.values, {
                src_amount_row: { label: 'Amount' },
                dest_amount_row: { label: 'Amount' },
            });
        } else {
            Object.assign(res.values, {
                src_amount_row: { label: 'Source amount' },
                dest_amount_row: { label: 'Destination amount' },
            });
        }

        if (newState === 0) {
            Object.assign(res.visibility, {
                dest_amount_left: false,
                src_res_balance_left: true,
                exch_left: false,
                src_amount_row: false,
                dest_amount_row: true,
                exchange_row: false,
                result_balance_row: false,
            });
        } else if (newState === 1) {
            Object.assign(res.visibility, {
                dest_amount_left: true,
                src_res_balance_left: false,
                exch_left: false,
                src_amount_row: false,
                dest_amount_row: false,
                exchange_row: false,
                result_balance_row: true,
            });
        } else if (newState === 2) {
            Object.assign(res.visibility, {
                dest_amount_left: false,
                src_res_balance_left: true,
                exch_left: true,
                src_amount_row: true,
                dest_amount_row: true,
                exchange_row: false,
                result_balance_row: false,
            });
        } else if (newState === 3) {
            Object.assign(res.visibility, {
                dest_amount_left: true,
                src_res_balance_left: true,
                exch_left: false,
                src_amount_row: true,
                dest_amount_row: false,
                exchange_row: true,
                result_balance_row: false,
            });
        } else if (newState === 4) {
            Object.assign(res.visibility, {
                dest_amount_left: true,
                src_res_balance_left: false,
                exch_left: true,
                src_amount_row: true,
                dest_amount_row: false,
                exchange_row: false,
                result_balance_row: true,
            });
        }

        this.expectedState = res;

        return res;
    }

    setIncomeExpectedState(stateId) {
        const newState = parseInt(stateId, 10);
        if (Number.isNaN(newState) || newState < 0 || newState > 4) {
            throw new Error('Wrong state specified');
        }

        const res = {
            model: { state: newState },
            visibility: {
                delBtn: this.model.isUpdate,
                source: false,
                destination: true,
                person: false,
                account: false,
                result_balance_row: false,
                src_res_balance_left: false,
            },
            values: {
                typeMenu: { selectedTypes: [INCOME] },
                destination: {
                    tile: {
                        name: this.model.destAccount.name,
                        balance: this.model.destAccount.fmtBalance,
                    },
                },
                src_amount_row: {
                    value: this.model.srcAmount.toString(),
                    currSign: this.model.srcCurr.sign,
                    isCurrActive: true,
                },
                src_amount_left: this.model.srcCurr.format(this.model.fSrcAmount),
                dest_amount_row: {
                    value: this.model.destAmount.toString(),
                    currSign: this.model.destCurr.sign,
                    isCurrActive: false,
                },
                dest_amount_left: this.model.destCurr.format(this.model.fDestAmount),
                result_balance_dest_row: {
                    value: this.model.destResBal.toString(),
                    label: 'Result balance',
                    isCurrActive: false,
                },
                dest_res_balance_left: this.model.fmtDestResBal,
                exchange_row: {
                    value: this.model.exchRate.toString(),
                    currSign: this.model.exchSign,
                },
                exch_left: this.model.fmtExch,
            },
        };

        if (this.model.isUpdate) {
            res.values.delBtn = { title: 'Delete' };
        }

        if (newState === 0 || newState === 1) {
            Object.assign(res.values, {
                src_amount_row: { label: 'Amount' },
                dest_amount_row: { label: 'Amount' },
            });
        } else {
            Object.assign(res.values, {
                src_amount_row: { label: 'Source amount' },
                dest_amount_row: { label: 'Destination amount' },
            });
        }

        if (newState === 0) {
            Object.assign(res.visibility, {
                src_amount_left: false,
                dest_amount_left: false,
                dest_res_balance_left: true,
                exch_left: false,
                src_amount_row: true,
                dest_amount_row: false,
                result_balance_dest_row: false,
                exchange_row: false,
            });
        } else if (newState === 1) {
            Object.assign(res.visibility, {
                src_amount_left: true,
                dest_amount_left: false,
                dest_res_balance_left: false,
                exch_left: false,
                src_amount_row: false,
                dest_amount_row: false,
                result_balance_dest_row: true,
                exchange_row: false,
            });
        } else if (newState === 2) {
            Object.assign(res.visibility, {
                src_amount_left: false,
                dest_amount_left: false,
                dest_res_balance_left: true,
                exch_left: true,
                src_amount_row: true,
                dest_amount_row: true,
                exchange_row: false,
                result_balance_dest_row: false,
            });
        } else if (newState === 3) {
            Object.assign(res.visibility, {
                src_amount_left: false,
                dest_amount_left: true,
                dest_res_balance_left: true,
                exch_left: false,
                src_amount_row: true,
                dest_amount_row: false,
                exchange_row: true,
                result_balance_dest_row: false,
            });
        } else if (newState === 4) {
            Object.assign(res.visibility, {
                src_amount_left: false,
                dest_amount_left: true,
                dest_res_balance_left: false,
                exch_left: true,
                src_amount_row: true,
                dest_amount_row: false,
                exchange_row: false,
                result_balance_dest_row: true,
            });
        }

        this.expectedState = res;

        return res;
    }

    setTransferExpectedState(stateId) {
        const newState = parseInt(stateId, 10);
        if (Number.isNaN(newState) || newState < 0 || newState > 8) {
            throw new Error('Wrong state specified');
        }

        const res = {
            model: { state: newState },
            visibility: {
                delBtn: this.model.isUpdate,
                source: true,
                destination: true,
                person: false,
                account: false,
            },
            values: {
                typeMenu: { selectedTypes: [TRANSFER] },
                source: {
                    tile: {
                        name: this.model.srcAccount.name,
                        balance: this.model.srcAccount.fmtBalance,
                    },
                },
                destination: {
                    tile: {
                        name: this.model.destAccount.name,
                        balance: this.model.destAccount.fmtBalance,
                    },
                },
                src_amount_row: {
                    value: this.model.srcAmount.toString(),
                    currSign: this.model.srcCurr.sign,
                    isCurrActive: false,
                },
                src_amount_left: this.model.srcCurr.format(this.model.fSrcAmount),
                dest_amount_row: {
                    value: this.model.destAmount.toString(),
                    currSign: this.model.destCurr.sign,
                    isCurrActive: false,
                },
                dest_amount_left: this.model.destCurr.format(this.model.fDestAmount),
                result_balance_row: {
                    value: this.model.srcResBal.toString(),
                    label: 'Result balance (Source)',
                    isCurrActive: false,
                },
                src_res_balance_left: this.model.fmtSrcResBal,
                result_balance_dest_row: {
                    value: this.model.destResBal.toString(),
                    label: 'Result balance (Destination)',
                    isCurrActive: false,
                },
                dest_res_balance_left: this.model.fmtDestResBal,
                exchange_row: {
                    value: this.model.exchRate.toString(),
                    currSign: this.model.exchSign,
                },
                exch_left: this.model.fmtExch,
            },
        };

        if (this.model.isUpdate) {
            res.values.delBtn = { title: 'Delete' };
        }

        if (newState === 0 || newState === 1 || newState === 2) {
            Object.assign(res.values, {
                src_amount_row: { label: 'Amount' },
                dest_amount_row: { label: 'Amount' },
            });
        } else {
            Object.assign(res.values, {
                src_amount_row: { label: 'Source amount' },
                dest_amount_row: { label: 'Destination amount' },
            });
        }

        if (newState === 0) {
            Object.assign(res.visibility, {
                src_amount_left: false,
                dest_amount_left: false,
                src_res_balance_left: true,
                dest_res_balance_left: true,
                exch_left: false,
                src_amount_row: true,
                dest_amount_row: false,
                result_balance_row: false,
                result_balance_dest_row: false,
                exchange_row: false,
            });
        } else if (newState === 1) {
            Object.assign(res.visibility, {
                src_amount_left: true,
                dest_amount_left: false,
                src_res_balance_left: false,
                dest_res_balance_left: true,
                exch_left: false,
                src_amount_row: false,
                dest_amount_row: false,
                result_balance_row: true,
                result_balance_dest_row: false,
                exchange_row: false,
            });
        } else if (newState === 2) {
            Object.assign(res.visibility, {
                src_amount_left: true,
                dest_amount_left: false,
                src_res_balance_left: true,
                dest_res_balance_left: false,
                exch_left: false,
                src_amount_row: false,
                dest_amount_row: false,
                result_balance_row: false,
                result_balance_dest_row: true,
                exchange_row: false,
            });
        } else if (newState === 3) {
            Object.assign(res.visibility, {
                src_amount_left: false,
                dest_amount_left: false,
                src_res_balance_left: true,
                dest_res_balance_left: true,
                exch_left: true,
                src_amount_row: true,
                dest_amount_row: true,
                result_balance_row: false,
                result_balance_dest_row: false,
                exchange_row: false,
            });
        } else if (newState === 4) {
            Object.assign(res.visibility, {
                src_amount_left: true,
                dest_amount_left: false,
                src_res_balance_left: false,
                dest_res_balance_left: true,
                exch_left: true,
                src_amount_row: false,
                dest_amount_row: true,
                result_balance_row: true,
                result_balance_dest_row: false,
                exchange_row: false,
            });
        } else if (newState === 5) {
            Object.assign(res.visibility, {
                src_amount_left: false,
                dest_amount_left: true,
                src_res_balance_left: true,
                dest_res_balance_left: false,
                exch_left: true,
                src_amount_row: true,
                dest_amount_row: false,
                result_balance_row: false,
                result_balance_dest_row: true,
                exchange_row: false,
            });
        } else if (newState === 6) {
            Object.assign(res.visibility, {
                src_amount_left: true,
                dest_amount_left: true,
                src_res_balance_left: false,
                dest_res_balance_left: false,
                exch_left: true,
                src_amount_row: false,
                dest_amount_row: false,
                result_balance_row: true,
                result_balance_dest_row: true,
                exchange_row: false,
            });
        } else if (newState === 7) {
            Object.assign(res.visibility, {
                src_amount_left: false,
                dest_amount_left: true,
                src_res_balance_left: true,
                dest_res_balance_left: true,
                exch_left: false,
                src_amount_row: true,
                dest_amount_row: false,
                result_balance_row: false,
                result_balance_dest_row: false,
                exchange_row: true,
            });
        } else if (newState === 8) {
            Object.assign(res.visibility, {
                src_amount_left: true,
                dest_amount_left: true,
                src_res_balance_left: false,
                dest_res_balance_left: true,
                exch_left: false,
                src_amount_row: false,
                dest_amount_row: false,
                result_balance_row: true,
                result_balance_dest_row: false,
                exchange_row: true,
            });
        }

        this.expectedState = res;

        return res;
    }

    setDebtExpectedState(stateId) {
        const newState = parseInt(stateId, 10);
        if (Number.isNaN(newState) || newState < 0 || newState > 9) {
            throw new Error('Wrong state specified');
        }

        const res = {
            model: { state: newState },
            visibility: {
                delBtn: this.model.isUpdate,
                source: false,
                destination: false,
                person: true,
                account: { tile: !this.model.noAccount },
                selaccount: this.model.noAccount,
                noacc_btn: !this.model.noAccount,
                dest_amount_row: false,
                dest_amount_left: false,
                exchange_row: false,
                exch_left: false,
            },
            values: {
                typeMenu: { selectedTypes: [DEBT] },
                src_amount_row: {
                    value: this.model.srcAmount.toString(),
                    label: 'Amount',
                    currSign: this.model.srcCurr.sign,
                    isCurrActive: false,
                },
                src_amount_left: this.model.srcCurr.format(this.model.fSrcAmount),
                dest_amount_row: {
                    value: this.model.destAmount.toString(),
                    currSign: this.model.destCurr.sign,
                    isCurrActive: false,
                },
                result_balance_row: {
                    value: this.model.srcResBal.toString(),
                    isCurrActive: false,
                },
                result_balance_dest_row: {
                    value: this.model.destResBal.toString(),
                    isCurrActive: false,
                },
                exchange_row: {
                    value: this.model.exchRate.toString(),
                    currSign: this.model.exchSign,
                },
                exch_left: this.model.fmtExch,
            },
        };

        if (this.model.isUpdate) {
            res.values.delBtn = { title: 'Delete' };
        }

        if (this.model.debtType) {
            Object.assign(res.values, {
                person: {
                    tile: {
                        name: this.model.person.name,
                        balance: this.model.srcAccount.fmtBalance,
                    },
                },
                src_res_balance_left: this.model.fmtSrcResBal,
                result_balance_row: { label: 'Result balance (Person)' },
                result_balance_dest_row: { label: 'Result balance (Account)' },
            });

            // Check initial state
            res.values.dest_res_balance_left = this.model.fmtDestResBal;

            if (!this.model.noAccount) {
                res.values.account = Object.assign(
                    (res.values.account) ? res.values.account : {},
                    {
                        tile: {
                            name: this.model.destAccount.name,
                            balance: this.model.destAccount.fmtBalance,
                        },
                    },
                );
            }
        } else {
            Object.assign(res.values, {
                person: {
                    tile: {
                        name: this.model.person.name,
                        balance: this.model.destAccount.fmtBalance,
                    },
                },
                dest_res_balance_left: this.model.fmtDestResBal,
                result_balance_row: { label: 'Result balance (Account)' },
                result_balance_dest_row: { label: 'Result balance (Person)' },
            });

            // Check initial state
            res.values.src_res_balance_left = this.model.fmtSrcResBal;

            if (!this.model.noAccount) {
                res.values.account = Object.assign(
                    (res.values.account) ? res.values.account : {},
                    {
                        tile: {
                            name: this.model.srcAccount.name,
                            balance: this.model.srcAccount.fmtBalance,
                        },
                    },
                );
            }
        }

        if (newState === 0 || newState === 3) {
            Object.assign(res.visibility, {
                src_amount_row: true,
                src_amount_left: false,
                result_balance_row: false,
                src_res_balance_left: true,
                result_balance_dest_row: false,
                dest_res_balance_left: true,
            });
        } else if (newState === 1 || newState === 5) {
            Object.assign(res.visibility, {
                src_amount_row: false,
                src_amount_left: true,
                result_balance_row: true,
                src_res_balance_left: false,
                result_balance_dest_row: false,
                dest_res_balance_left: true,
            });
        } else if (newState === 2 || newState === 4) {
            Object.assign(res.visibility, {
                src_amount_row: false,
                src_amount_left: true,
                result_balance_row: false,
                src_res_balance_left: true,
                result_balance_dest_row: true,
                dest_res_balance_left: false,
            });
        } else if (newState === 6) {
            Object.assign(res.visibility, {
                src_amount_row: true,
                src_amount_left: false,
                result_balance_row: false,
                src_res_balance_left: true,
                result_balance_dest_row: false,
                dest_res_balance_left: false,
            });
        } else if (newState === 7) {
            Object.assign(res.visibility, {
                src_amount_row: true,
                src_amount_left: false,
                result_balance_row: false,
                src_res_balance_left: false,
                result_balance_dest_row: false,
                dest_res_balance_left: true,
            });
        } else if (newState === 8) {
            Object.assign(res.visibility, {
                src_amount_row: false,
                src_amount_left: true,
                result_balance_row: false,
                src_res_balance_left: false,
                result_balance_dest_row: true,
                dest_res_balance_left: false,
            });
        } else if (newState === 9) {
            Object.assign(res.visibility, {
                src_amount_row: false,
                src_amount_left: true,
                result_balance_row: true,
                src_res_balance_left: false,
                result_balance_dest_row: false,
                dest_res_balance_left: false,
            });
        }

        this.expectedState = res;

        return res;
    }

    /**
     * Set source amount value
     * @param {number|string} val - new source amount value
     */
    setSrcAmount(val) {
        if (this.model.type === EXPENSE) {
            this.setExpenseSrcAmount(val);
        } else if (this.model.type === INCOME) {
            this.setIncomeSrcAmount(val);
        } else if (this.model.type === TRANSFER) {
            this.setTransferSrcAmount(val);
        } else if (this.model.type === DEBT) {
            this.setDebtSrcAmount(val);
        }
    }

    setExpenseSrcAmount(val) {
        this.model.srcAmount = val;

        const newValue = isValidValue(val) ? normalize(val) : val;
        if (this.model.fSrcAmount !== newValue) {
            this.model.fSrcAmount = newValue;

            this.model.srcResBal = normalize(this.model.srcAccount.balance - this.model.fSrcAmount);
            this.model.fmtSrcResBal = this.model.srcCurr.format(this.model.srcResBal);
        }
    }

    setIncomeSrcAmount(val) {
        this.model.srcAmount = val;

        const newValue = isValidValue(val) ? normalize(val) : val;
        if (this.model.fSrcAmount !== newValue) {
            this.model.fSrcAmount = newValue;
        }
    }

    setTransferSrcAmount(val) {
        this.model.srcAmount = val;

        const newValue = isValidValue(val) ? normalize(val) : val;
        if (this.model.fSrcAmount !== newValue) {
            this.model.fSrcAmount = newValue;

            const srcRes = this.model.srcAccount.balance - this.model.fSrcAmount;
            this.model.srcResBal = normalize(srcRes);
            this.model.fmtSrcResBal = this.model.srcCurr.format(this.model.srcResBal);
        }
    }

    setDebtSrcAmount(val) {
        this.model.srcAmount = val;

        const newValue = isValidValue(val) ? normalize(val) : val;
        if (this.model.fSrcAmount !== newValue || this.model.srcResBal === '') {
            this.model.fSrcAmount = newValue;

            if (this.model.srcAccount && !this.model.noAccount) {
                const srcRes = this.model.srcAccount.balance - this.model.fSrcAmount;
                this.model.srcResBal = normalize(srcRes);
            } else if (this.model.noAccount) {
                if (this.model.debtType) {
                    const srcRes = this.model.personAccount.balance - this.model.fSrcAmount;
                    this.model.srcResBal = normalize(srcRes);
                } else {
                    let accBalance = 0;
                    if (this.model.lastAccount_id) {
                        const lastAcc = App.state.accounts.getItem(this.model.lastAccount_id);
                        if (!lastAcc) {
                            throw new Error('Last account not found');
                        }

                        accBalance = lastAcc.balance;
                    }

                    this.model.srcResBal = normalize(accBalance);
                }
            }

            this.model.fmtSrcResBal = this.model.srcCurr.format(this.model.srcResBal);
        }
    }

    /**
     * Set destination amount value
     * @param {number|string} val - new destination amount value
     */
    setDestAmount(val) {
        if (this.model.type === EXPENSE) {
            this.setExpenseDestAmount(val);
        } else if (this.model.type === INCOME) {
            this.setIncomeDestAmount(val);
        } else if (this.model.type === TRANSFER) {
            this.setTransferDestAmount(val);
        } else if (this.model.type === DEBT) {
            this.setDebtDestAmount(val);
        }
    }

    setExpenseDestAmount(val) {
        this.model.destAmount = val;

        const newValue = isValidValue(val) ? normalize(val) : val;
        if (this.model.fDestAmount !== newValue) {
            this.model.fDestAmount = newValue;
        }
    }

    setIncomeDestAmount(val) {
        this.model.destAmount = val;

        const newValue = isValidValue(val) ? normalize(val) : val;
        if (this.model.fDestAmount !== newValue) {
            this.model.fDestAmount = newValue;

            const destRes = this.model.destAccount.balance + this.model.fDestAmount;
            this.model.destResBal = normalize(destRes);
            this.model.fmtDestResBal = this.model.destCurr.format(this.model.destResBal);
        }
    }

    setTransferDestAmount(val) {
        this.model.destAmount = val;

        const newValue = isValidValue(val) ? normalize(val) : val;
        if (this.model.fDestAmount !== newValue) {
            this.model.fDestAmount = newValue;

            const destRes = this.model.destAccount.balance + this.model.fDestAmount;
            this.model.destResBal = normalize(destRes);
            this.model.fmtDestResBal = this.model.destCurr.format(this.model.destResBal);
        }
    }

    setDebtDestAmount(val) {
        this.model.destAmount = val;

        const newValue = isValidValue(val) ? normalize(val) : val;
        if (this.model.fDestAmount !== newValue || this.model.destResBal === '') {
            this.model.fDestAmount = newValue;

            if (this.model.destAccount && !this.model.noAccount) {
                const destRes = this.model.destAccount.balance + this.model.fDestAmount;
                this.model.destResBal = normalize(destRes);
            } else if (this.model.noAccount) {
                if (this.model.debtType) {
                    let accBalance = 0;
                    if (this.model.lastAccount_id) {
                        const lastAcc = App.state.accounts.getItem(this.model.lastAccount_id);
                        if (!lastAcc) {
                            throw new Error('Last account not found');
                        }

                        accBalance = lastAcc.balance;
                    }

                    this.model.destResBal = normalize(accBalance);
                } else {
                    const destRes = this.model.personAccount.balance + this.model.fDestAmount;
                    this.model.destResBal = normalize(destRes);
                }
            }

            this.model.fmtDestResBal = this.model.destCurr.format(this.model.destResBal);
        }
    }

    calcExchByAmounts() {
        if (this.model.fSrcAmount === 0 || this.model.fDestAmount === 0) {
            this.model.exchRate = 1;
        } else {
            this.model.exchRate = correctExch(this.model.fDestAmount / this.model.fSrcAmount);
        }
    }

    updateExch() {
        if (!this.model.srcCurr || !this.model.destCurr) {
            return;
        }

        this.model.fExchRate = isValidValue(this.model.exchRate)
            ? normalizeExch(this.model.exchRate)
            : this.model.exchRate;

        this.model.exchSign = `${this.model.destCurr.sign}/${this.model.srcCurr.sign}`;
        this.model.backExchSign = `${this.model.srcCurr.sign}/${this.model.destCurr.sign}`;

        let exchText = this.model.exchSign;
        if (
            isValidValue(this.model.exchRate)
            && this.model.fExchRate !== 0
            && this.model.fExchRate !== 1
        ) {
            let backExchRate = 1;
            if (this.model.fSrcAmount !== 0 && this.model.fDestAmount !== 0) {
                backExchRate = this.model.fSrcAmount / this.model.fDestAmount;
            }

            this.model.invExchRate = parseFloat(backExchRate.toFixed(5));

            exchText += ` (${this.model.invExchRate} ${this.model.backExchSign})`;
        }

        this.model.fmtExch = `${this.model.fExchRate} ${exchText}`;
    }

    setNextSourceAccount(accountId) {
        const nextAccountId = App.state.accounts.getNext(accountId);
        const newSrcAcc = App.state.accounts.getItem(nextAccountId);
        if (!newSrcAcc) {
            throw new Error('Next account not found');
        }
        this.model.srcAccount = newSrcAcc;
        this.model.src_curr_id = this.model.srcAccount.curr_id;
        this.model.srcCurr = Currency.getById(this.model.src_curr_id);
        this.model.srcAccount.fmtBalance = this.model.srcCurr.format(
            this.model.srcAccount.balance,
        );

        // Copy destination amount to source amount
        if (this.model.fDestAmount !== this.model.fSrcAmount) {
            this.model.srcAmount = this.model.destAmount;
        }
        this.model.fSrcAmount = this.model.fDestAmount;

        // Update result balance of source
        const newSrcResBal = normalize(this.model.srcAccount.balance - this.model.fSrcAmount);
        if (this.model.fSrcResBal !== newSrcResBal) {
            this.model.srcResBal = newSrcResBal;
            this.model.fSrcResBal = this.model.srcResBal;
        }
        this.model.fmtSrcResBal = this.model.srcCurr.format(this.model.fSrcResBal);
    }

    setNextDestAccount(accountId) {
        const nextAccountId = App.state.accounts.getNext(accountId);
        if (!nextAccountId) {
            throw new Error('Next account not found');
        }

        this.model.destAccount = App.state.accounts.getItem(nextAccountId);
        this.model.dest_curr_id = this.model.destAccount.curr_id;
        this.model.destCurr = Currency.getById(this.model.dest_curr_id);
        this.model.destAccount.fmtBalance = this.model.destCurr.format(
            this.model.destAccount.balance,
        );

        // Copy source amount to destination amount
        if (this.model.fDestAmount !== this.model.fSrcAmount) {
            this.model.destAmount = this.model.srcAmount;
        }
        this.model.fDestAmount = this.model.fSrcAmount;

        // Update result balance of destination
        const destRes = this.model.destAccount.balance + this.model.fDestAmount;
        const newDestResBal = normalize(destRes);
        if (this.model.fDestResBal !== newDestResBal) {
            this.model.destResBal = newDestResBal;
            this.model.fDestResBal = this.model.destResBal;
        }
        this.model.fmtDestResBal = this.model.destCurr.format(this.model.fDestResBal);
    }

    getPersonAccount(personId, currencyId) {
        const personAccount = App.state.getPersonAccount(personId, currencyId);
        if (personAccount) {
            return personAccount;
        }

        return {
            balance: 0,
            curr_id: currencyId,
        };
    }

    async changeTransactionType(type) {
        const currentType = this.model.type;

        if (currentType === type) {
            return true;
        }

        this.model.type = type;
        if (type === EXPENSE) {
            if (currentType === INCOME) {
                const srcCurrId = this.model.src_curr_id;
                const { srcCurr, srcAmount, destAmount } = this.model;

                this.model.srcAccount = this.model.destAccount;
                this.model.src_curr_id = this.model.dest_curr_id;
                this.model.dest_curr_id = srcCurrId;
                this.model.srcCurr = this.model.destCurr;
                this.model.destCurr = srcCurr;

                this.setSrcAmount(destAmount);
                this.setDestAmount(srcAmount);
                this.updateExch();
            } else if (currentType === TRANSFER) {
                const { srcAmount } = this.model;

                this.model.state = 0;
                this.model.dest_curr_id = this.model.src_curr_id;
                this.model.destCurr = this.model.srcCurr;

                this.setSrcAmount(srcAmount);
                this.setDestAmount(srcAmount);
                this.updateExch();
            } else if (currentType === DEBT) {
                const fromAccount = (this.model.account)
                    ? this.model.account
                    : App.state.accounts.getItemByIndex(0); // TODO: use visible accounts

                this.model.state = 0;
                this.model.srcAccount = fromAccount;
                this.model.src_curr_id = fromAccount.curr_id;
                this.model.srcCurr = Currency.getById(fromAccount.curr_id);
                this.model.destCurr = this.model.srcCurr;
            }

            this.model.destAccount = null;
        }

        if (type === INCOME) {
            if (currentType === INCOME) {
                const { srcCurr, srcAmount, destAmount } = this.model;
                const srcCurrId = this.model.src_curr_id;

                this.model.destAccount = this.model.srcAccount;
                this.model.src_curr_id = this.model.dest_curr_id;
                this.model.dest_curr_id = srcCurrId;
                this.model.srcCurr = this.model.destCurr;
                this.model.destCurr = srcCurr;

                this.setSrcAmount(destAmount);
                this.setDestAmount(srcAmount);
                this.updateExch();
            } else if (currentType === TRANSFER) {
                const { destAmount } = this.model;

                this.model.state = 0;
                this.model.src_curr_id = this.model.dest_curr_id;
                this.model.srcCurr = this.model.destCurr;

                this.setSrcAmount(destAmount);
                this.setDestAmount(destAmount);
                this.updateExch();
            } else if (currentType === DEBT) {
                const fromAccount = (this.model.account)
                    ? this.model.account
                    : App.state.accounts.getItemByIndex(0); // TODO: use visible accounts

                this.model.state = 0;
                this.model.destAccount = fromAccount;
                this.model.dest_curr_id = fromAccount.curr_id;
                this.model.destCurr = Currency.getById(fromAccount.curr_id);
                this.model.srcCurr = this.model.destCurr;
            }

            this.model.srcAccount = null;
        }

        if (type === TRANSFER) {
            if (currentType === EXPENSE) {
                this.setNextDestAccount(this.model.srcAccount.id);
            } else if (currentType === INCOME) {
                this.setNextSourceAccount(this.model.destAccount.id);
            } else if (currentType === DEBT) {
                if (this.model.account && this.model.debtType) {
                    this.model.destAccount = this.model.account;
                    this.model.dest_curr_id = this.model.account.curr_id;
                    this.model.destCurr = Currency.getById(this.model.account.curr_id);

                    this.setNextSourceAccount(this.model.destAccount.id);
                } else {
                    const scrAccount = (this.model.account)
                        ? this.model.account
                        : App.state.accounts.getItemByIndex(0); // TODO: use visible accounts

                    this.model.srcAccount = scrAccount;
                    this.model.src_curr_id = scrAccount.curr_id;
                    this.model.srcCurr = Currency.getById(scrAccount.curr_id);
                    this.setNextDestAccount(scrAccount.id);
                }
            }

            this.model.isDiffCurr = (this.model.src_curr_id !== this.model.dest_curr_id);
            this.model.state = (this.model.isDiffCurr) ? 3 : 0;

            const { srcAmount, destAmount } = this.model;
            this.setSrcAmount(srcAmount);
            this.setDestAmount(destAmount);
            this.updateExch();
        }

        if (type === DEBT) {
            const person = App.state.persons.getItemByIndex(0); // TODO: use visible persons
            this.model.person = person;

            if (currentType === EXPENSE || currentType === TRANSFER) {
                this.model.debtType = false;
                this.model.account = this.model.srcAccount;
                this.model.src_curr_id = this.model.srcAccount.curr_id;
                this.model.dest_curr_id = this.model.src_curr_id;
            } else if (currentType === INCOME) {
                this.model.debtType = true;
                this.model.account = this.model.destAccount;
                this.model.dest_curr_id = this.model.destAccount.curr_id;
                this.model.src_curr_id = this.model.dest_curr_id;
            }

            this.model.personAccount = this.getPersonAccount(
                this.model.person.id,
                this.model.src_curr_id,
            );

            this.model.noAccount = false;
            this.model.state = (this.model.debtType) ? 0 : 3;
            const { srcAmount, destAmount } = this.model;
            this.setSrcAmount(srcAmount);
            this.setDestAmount(destAmount);
            this.updateExch();
        }

        // Delete Debt specific fields
        if (currentType === DEBT) {
            delete this.model.account;
            delete this.model.person;
            delete this.model.personAccount;
            delete this.model.debtType;
            delete this.model.noAccount;
            delete this.model.lastAcc_id;
        }

        await this.performAction(() => this.content.typeMenu.select(type));

        return this.checkState();
    }

    async clickDeleteButton() {
        if (!this.content.isUpdate || !this.content.delBtn) {
            throw new Error('Unexpected action clickDeleteButton');
        }

        await this.performAction(() => this.content.delBtn.click());
    }

    /** Click on delete button and confirm wanring popup */
    async deleteSelfItem() {
        await this.clickDeleteButton();

        if (!await TestComponent.isVisible(this.content.delete_warning)) {
            throw new Error('Delete transaction warning popup not appear');
        }
        if (!this.content.delete_warning.okBtn) {
            throw new Error('OK button not found');
        }

        await this.navigation(() => this.click(this.content.delete_warning.okBtn));
    }

    async submit() {
        const action = () => this.click(this.content.submitBtn);

        if (await this.isValid()) {
            await this.navigation(action);
        } else {
            await this.performAction(action);
        }
    }

    async cancel() {
        await this.navigation(() => this.click(this.content.cancelBtn));
    }

    async changeSrcAccount(val) {
        if (this.model.type === EXPENSE) {
            this.changeExpenseSrcAccount(val);
        } else if (this.model.type === TRANSFER) {
            this.changeTransferSrcAccount(val);
        } else {
            throw new Error('Unexpected action: can\'t change source account');
        }

        await this.performAction(() => this.content.source.selectAccount(val));

        return this.checkState();
    }

    changeExpenseSrcAccount(accountId) {
        const newAcc = App.state.accounts.getItem(accountId);

        if (!this.model.srcAccount || !newAcc || newAcc.id === this.model.srcAccount.id) {
            return;
        }

        this.model.srcAccount = newAcc;
        this.model.src_curr_id = this.model.srcAccount.curr_id;
        this.model.srcCurr = Currency.getById(this.model.src_curr_id);
        this.model.srcAccount.fmtBalance = this.model.srcCurr.format(this.model.srcAccount.balance);

        // Copy source currency to destination currency if needed
        // Transition 1 or 12
        if (this.model.state === 0 || this.model.state === 1) {
            this.model.dest_curr_id = this.model.src_curr_id;
            this.model.destCurr = this.model.srcCurr;
        }

        // Update result balance of source
        const newSrcResBal = normalize(this.model.srcAccount.balance - this.model.fSrcAmount);
        if (this.model.fSrcResBal !== newSrcResBal) {
            this.model.srcResBal = newSrcResBal;
            this.model.fSrcResBal = this.model.srcResBal;
        }
        this.model.fmtSrcResBal = this.model.srcCurr.format(this.model.fSrcResBal);

        // Update exchange rate
        this.calcExchByAmounts();
        this.updateExch();

        this.model.isDiffCurr = (this.model.src_curr_id !== this.model.dest_curr_id);
        if (this.model.isDiffCurr) {
            // Transition 5, 17 or 10
            if (this.model.state === 2 || this.model.state === 3 || this.model.state === 4) {
                this.setExpectedState(this.model.state);
            } else {
                throw new Error(`Unexpected state ${this.model.state} with different currencies`);
            }
        } else if (!this.model.isDiffCurr) {
            if (this.model.state === 2 || this.model.state === 3) {
                // Transition 14 or 15
                this.setDestAmount(this.model.srcAmount);
                this.setExpectedState(0);
            } else if (this.model.state === 4) {
                // Transition 11
                this.setDestAmount(this.model.srcAmount);
                this.setExpectedState(1);
            } else {
                // Transition 1 or 12
                this.setExpectedState(this.model.state);
            }
        }
    }

    changeTransferSrcAccount(accountId) {
        const newAcc = App.state.accounts.getItem(accountId);

        if (!this.model.srcAccount || !newAcc || newAcc.id === this.model.srcAccount.id) {
            return;
        }

        this.model.srcAccount = newAcc;
        this.model.src_curr_id = this.model.srcAccount.curr_id;
        this.model.srcCurr = Currency.getById(this.model.src_curr_id);
        this.model.srcAccount.fmtBalance = this.model.srcCurr.format(this.model.srcAccount.balance);

        // Update result balance of source
        const newSrcResBal = normalize(this.model.srcAccount.balance - this.model.fSrcAmount);
        if (this.model.fSrcResBal !== newSrcResBal) {
            this.model.srcResBal = newSrcResBal;
            this.model.fSrcResBal = this.model.srcResBal;
        }
        this.model.fmtSrcResBal = this.model.srcCurr.format(this.model.fSrcResBal);

        if (newAcc.id === this.model.destAccount.id) {
            this.setNextDestAccount(newAcc.id);
        }

        // Update exchange rate
        this.calcExchByAmounts();
        this.updateExch();

        this.model.isDiffCurr = (this.model.src_curr_id !== this.model.dest_curr_id);
        if (this.model.isDiffCurr) {
            if (this.model.state === 0) {
                // Transition 6
                this.setExpectedState(3);
            } else if (this.model.state === 1) {
                // Transition 12
                this.setExpectedState(4);
            } else if (this.model.state === 2) {
                // Transition 16
                this.setExpectedState(5);
            } else if ([3, 4, 5, 6, 7, 8].includes(this.model.state)) {
                // Transition 43, 36, 26, 49, 51 or 57
                this.setExpectedState(this.model.state);
            } else {
                throw new Error(`changeSrcAccount(): Unexpected state ${this.model.state} with different currencies`);
            }
        } else {
            if (this.model.fSrcAmount !== this.model.fDestAmount) {
                this.setDestAmount(this.model.fSrcAmount);
            }

            if (this.model.state === 0 || this.model.state === 1 || this.model.state === 2) {
                // Transition 5, 11 or 15
                this.setExpectedState(this.model.state);
            } else if (this.model.state === 3 || this.model.state === 7) {
                // Transition 3 or 58
                this.setExpectedState(0);
            } else if (this.model.state === 4 || this.model.state === 6 || this.model.state === 8) {
                // Transition 37, 50 or 52
                this.setExpectedState(1);
            } else if (this.model.state === 5) {
                // Transition 27
                this.setExpectedState(2);
            } else {
                throw new Error(`changeSrcAccount(): Unexpected state ${this.model.state} with same currencies`);
            }
        }
    }

    async changeSrcAccountByPos(pos) {
        return this.changeSrcAccount(this.content.source.dropDown.items[pos].id);
    }

    async changeDestAccount(val) {
        if (this.model.type === INCOME) {
            this.changeIncomeDestAccount(val);
        } else if (this.model.type === TRANSFER) {
            this.changeTransferDestAccount(val);
        } else {
            throw new Error('Unexpected action: can\'t change destination account');
        }

        await this.performAction(() => this.content.destination.selectAccount(val));

        return this.checkState();
    }

    changeIncomeDestAccount(accountId) {
        const newAcc = App.state.accounts.getItem(accountId);

        if (!this.model.destAccount || !newAcc || newAcc.id === this.model.destAccount.id) {
            return;
        }

        this.model.destAccount = newAcc;
        this.model.dest_curr_id = this.model.destAccount.curr_id;
        this.model.destCurr = Currency.getById(this.model.dest_curr_id);
        this.model.destAccount.fmtBalance = this.model.destCurr.format(
            this.model.destAccount.balance,
        );

        // Copy destination currency to source currency if needed
        // Transition 1 or 23
        if (this.model.state === 0 || this.model.state === 1) {
            this.model.src_curr_id = this.model.dest_curr_id;
            this.model.srcCurr = this.model.destCurr;
        }

        // Update result balance of destination
        const newDestResBal = normalize(this.model.destAccount.balance + this.model.fDestAmount);
        if (this.model.fDestResBal !== newDestResBal) {
            this.model.destResBal = newDestResBal;
            this.model.fDestResBal = this.model.destResBal;
        }
        this.model.fmtDestResBal = this.model.destCurr.format(this.model.fDestResBal);

        // Update exchange rate
        this.calcExchByAmounts();
        this.updateExch();

        this.model.isDiffCurr = (this.model.src_curr_id !== this.model.dest_curr_id);
        if (this.model.isDiffCurr) {
            if (this.model.state === 2 || this.model.state === 3 || this.model.state === 4) {
                // Transition 5, 11 or 17
                this.setExpectedState(this.model.state);
            } else {
                throw new Error(`Unexpected state ${this.model.state} with different currencies`);
            }
        } else if (!this.model.isDiffCurr) {
            if (this.model.state === 2 || this.model.state === 3) {
                // Transition 6 or 12
                this.setSrcAmount(this.model.destAmount);
                this.setExpectedState(0);
            } else if (this.model.state === 4) {
                // Transition 18
                this.setSrcAmount(this.model.destAmount);
                this.setExpectedState(1);
            } else {
                // Transition 1 or 23
                this.setExpectedState(this.model.state);
            }
        }
    }

    changeTransferDestAccount(accountId) {
        const newAcc = App.state.accounts.getItem(accountId);

        if (!this.model.destAccount || !newAcc || newAcc.id === this.model.destAccount.id) {
            return;
        }

        this.model.destAccount = newAcc;
        this.model.dest_curr_id = this.model.destAccount.curr_id;
        this.model.destCurr = Currency.getById(this.model.dest_curr_id);
        this.model.destAccount.fmtBalance = this.model.destCurr.format(
            this.model.destAccount.balance,
        );

        // Update result balance of destination
        const newDestResBal = normalize(this.model.destAccount.balance + this.model.fDestAmount);
        if (this.model.fDestResBal !== newDestResBal) {
            this.model.destResBal = newDestResBal;
            this.model.fDestResBal = this.model.destResBal;
        }
        this.model.fmtDestResBal = this.model.destCurr.format(this.model.fDestResBal);

        if (newAcc.id === this.model.srcAccount.id) {
            this.setNextSourceAccount(newAcc.id);
        }

        // Update exchange rate
        this.calcExchByAmounts();
        this.updateExch();

        this.model.isDiffCurr = (this.model.src_curr_id !== this.model.dest_curr_id);
        if (this.model.isDiffCurr) {
            if (this.model.state === 0) {
                // Transition 8
                this.setExpectedState(3);
            } else if (this.model.state === 1) {
                // Transition 14
                this.setExpectedState(4);
            } else if (this.model.state === 2) {
                // Transition 18
                this.setExpectedState(5);
            } else if ([3, 4, 5, 6, 7, 8].includes(this.model.state)) {
                // Transition 41, 38, 28, 47, 59 or 53
                this.setExpectedState(this.model.state);
            } else {
                throw new Error(`changeDestAccount(): Unexpected state ${this.model.state} with different currencies`);
            }
        } else {
            if (this.model.fSrcAmount !== this.model.fDestAmount) {
                this.setDestAmount(this.model, this.model.fSrcAmount);
            }

            if (this.model.state === 0 || this.model.state === 1 || this.model.state === 2) {
                // Transition 7, 13 or 17
                this.setExpectedState(this.model.state);
            } else if (this.model.state === 3 || this.model.state === 7) {
                // Transition 42 or 60
                this.setExpectedState(0);
            } else if (this.model.state === 4 || this.model.state === 8) {
                // Transition 39 or 54
                this.setExpectedState(1);
            } else if (this.model.state === 5 || this.model.state === 6) {
                // Transition 29 or 48
                this.setExpectedState(2);
            } else {
                throw new Error(`changeDestAccount(): Unexpected state ${this.model.state} with same currencies`);
            }
        }
    }

    async changeDestAccountByPos(pos) {
        return this.changeDestAccount(this.content.destination.dropDown.items[pos].id);
    }

    async inputSrcAmount(val) {
        if (this.model.type === EXPENSE) {
            this.inputExpenseSrcAmount(val);
        } else if (this.model.type === INCOME) {
            this.inputIncomeSrcAmount(val);
        } else if (this.model.type === TRANSFER) {
            this.inputTransferSrcAmount(val);
        } else if (this.model.type === DEBT) {
            this.inputDebtSrcAmount(val);
        }

        await this.performAction(() => this.content.src_amount_row.input(val));

        return this.checkState();
    }

    inputExpenseSrcAmount(val) {
        if (!this.model.isDiffCurr) {
            throw new Error(`Wrong state: can't input source amount on state ${this.model.state}`);
        }

        const fNewValue = (isValidValue(val)) ? normalize(val) : val;

        this.model.srcAmount = val;
        if (this.model.fSrcAmount !== fNewValue) {
            this.model.fSrcAmount = fNewValue;

            const resBal = this.model.srcAccount.balance - this.model.fSrcAmount;
            this.model.srcResBal = normalize(resBal);
            this.model.fmtSrcResBal = this.model.srcCurr.format(this.model.srcResBal);

            this.calcExchByAmounts();
            this.updateExch();
        }

        this.setExpectedState(this.model.state);
    }

    inputIncomeSrcAmount(val) {
        const fNewValue = isValidValue(val) ? normalize(val) : val;

        this.model.srcAmount = val;
        if (this.model.fSrcAmount !== fNewValue) {
            this.model.fSrcAmount = fNewValue;

            if (this.model.isDiffCurr) {
                if (isValidValue(this.model.destAmount)) {
                    this.calcExchByAmounts();
                    this.updateExch();
                }
            } else {
                this.setDestAmount(this.model.fSrcAmount);
            }
        }

        this.setExpectedState(this.model.state);
    }

    inputTransferSrcAmount(val) {
        const availStates = [0, 3, 4, 7];
        if (!availStates.includes(this.model.state)) {
            throw new Error(`Unexpected state ${this.model.state} to input source amount`);
        }

        const fNewValue = (isValidValue(val)) ? normalize(val) : val;
        const valueChanged = (this.model.fSrcAmount !== fNewValue);

        this.setSrcAmount(val);

        if (valueChanged) {
            if (this.model.isDiffCurr) {
                this.calcExchByAmounts();
                this.updateExch();
            } else {
                this.setDestAmount(this.model.fSrcAmount);
            }
        }

        this.setExpectedState(this.model.state);
    }

    inputDebtSrcAmount(val) {
        const fNewValue = (isValidValue(val)) ? normalize(val) : val;
        const valueChanged = (this.model.fSrcAmount !== fNewValue);

        this.setSrcAmount(val);
        if (valueChanged) {
            this.setDestAmount(this.model.fSrcAmount);
        }

        this.setExpectedState(this.model.state);
    }

    async clickSrcAmount() {
        if (this.model.type === INCOME) {
            this.clickIncomeSrcAmount();
        } else if (this.model.type === TRANSFER) {
            this.clickTransferSrcAmount();
        } else if (this.model.type === DEBT) {
            this.clickDebtSrcAmount();
        } else {
            throw new Error('Unexpected action: can\'t click by source amount');
        }

        await this.performAction(() => this.content.src_amount_left.click());

        return this.checkState();
    }

    clickIncomeSrcAmount() {
        // Transition 4
        if (this.model.state === 1) {
            this.setExpectedState(0);
        } else {
            throw new Error(`Unexpected state ${this.model.state} for clickSrcAmount action`);
        }
    }

    clickTransferSrcAmount() {
        if (this.model.state === 1 || this.model.state === 2) {
            // Transition 2 or 4
            this.setExpectedState(0);
        } else if (this.model.state === 4) {
            // Transition 30
            this.setExpectedState(3);
        } else if (this.model.state === 6) {
            // Transition 20
            this.setExpectedState(5);
        } else if (this.model.state === 8) {
            // Transition 23
            this.setExpectedState(7);
        } else {
            throw new Error(`Unexpected state ${this.model.state} for clickSrcAmount action`);
        }
    }

    clickDebtSrcAmount() {
        if (this.model.state === 1 || this.model.state === 2) { // Transition 2 or 4
            this.setExpectedState(0);
        } else if (this.model.state === 4 || this.model.state === 5) { // Transition 30 or 12
            this.setExpectedState(3);
        } else if (this.model.state === 8) { // Transition 31
            this.setExpectedState(7);
        } else if (this.model.state === 9) { // Transition 35
            this.setExpectedState(6);
        } else {
            throw new Error(`Unexpected state ${this.model.state} for clickSrcAmount action`);
        }
    }

    async inputDestAmount(val) {
        if (this.model.type === EXPENSE) {
            this.inputExpenseDestAmount(val);
        } else if (this.model.type === INCOME) {
            this.inputIncomeDestAmount(val);
        } else if (this.model.type === TRANSFER) {
            this.inputTransferDestAmount(val);
        } else {
            throw new Error('Unexpected action: can\'t input destination amount');
        }

        await this.performAction(() => this.content.dest_amount_row.input(val));

        return this.checkState();
    }

    inputExpenseDestAmount(val) {
        const fNewValue = (isValidValue(val)) ? normalize(val) : val;

        this.model.destAmount = val;
        if (this.model.fDestAmount !== fNewValue) {
            this.model.fDestAmount = fNewValue;
            if (this.model.isDiffCurr) {
                if (isValidValue(this.model.srcAmount)) {
                    this.calcExchByAmounts();
                    this.updateExch();
                }
            } else {
                this.setSrcAmount(this.model.fDestAmount);
            }
        }

        this.setExpectedState(this.model.state);
    }

    inputIncomeDestAmount(val) {
        this.setDestAmount(val);
        if (this.model.isDiffCurr) {
            this.calcExchByAmounts();
            this.updateExch();
        } else {
            this.setSrcAmount(this.model.destAmount);
        }

        this.setExpectedState(this.model.state);
    }

    inputTransferDestAmount(val) {
        if (this.model.state !== 3 && this.model.state !== 4) {
            throw new Error(`Unexpected state ${this.model.state} to input destination amount`);
        }

        const fNewValue = (isValidValue(val)) ? normalize(val) : val;
        const valueChanged = (this.model.fDestAmount !== fNewValue);

        this.setDestAmount(val);
        if (valueChanged) {
            if (this.model.isDiffCurr) {
                this.calcExchByAmounts();
                this.updateExch();
            } else {
                this.setSrcAmount(this.model.destAmount);
            }
        }

        this.setExpectedState(this.model.state);
    }

    async clickSrcResultBalance() {
        if (this.model.type === EXPENSE) {
            this.clickExpenseSrcResultBalance();
        } else if (this.model.type === TRANSFER) {
            this.clickTransferSrcResultBalance();
        } else if (this.model.type === DEBT) {
            this.clickDebtSrcResultBalance();
        } else {
            throw new Error('Unexpected action: can\'t click by source result balance');
        }

        await this.performAction(() => this.content.src_res_balance_left.click());

        return this.checkState();
    }

    clickExpenseSrcResultBalance() {
        if (this.model.state === 0) {
            this.setExpectedState(1);
        } else if (this.model.state === 2 || this.model.state === 3) {
            this.setExpectedState(4);
        }
    }

    clickTransferSrcResultBalance() {
        if (this.model.state === 0 || this.model.state === 2) {
            // Transition 1 or 10
            this.setExpectedState(1);
        } else if (this.model.state === 3) {
            // Transition 31
            this.setExpectedState(4);
        } else if (this.model.state === 5) {
            // Transition 19
            this.setExpectedState(6);
        } else if (this.model.state === 7) {
            // Transition 22
            this.setExpectedState(8);
        }
    }

    clickDebtSrcResultBalance() {
        if (this.model.state === 0 || this.model.state === 2) { // Transition 1 or 4
            this.setExpectedState(1);
        } else if (this.model.state === 3 || this.model.state === 4) { // Transition 13 or 11
            this.setExpectedState(5);
        } else if (this.model.state === 6) {
            this.setExpectedState(9); // Transition 36
        } else {
            throw new Error('Unexpected state');
        }
    }

    async clickDestResultBalance() {
        if (this.model.type === INCOME) {
            this.clickIncomeDestResultBalance();
        } else if (this.model.type === TRANSFER) {
            this.clickTransferDestResultBalance();
        } else if (this.model.type === DEBT) {
            this.clickDebtDestResultBalance();
        }

        await this.performAction(() => this.content.dest_res_balance_left.click());

        return this.checkState();
    }

    clickIncomeDestResultBalance() {
        if (this.model.state === 0) {
            // Transition 2
            this.setExpectedState(1);
        } else if (this.model.state === 2 || this.model.state === 3) {
            // Transition 7 or 14
            this.setExpectedState(4);
        }
    }

    clickTransferDestResultBalance() {
        if (this.model.state === 0 || this.model.state === 1) {
            // Transition 3 or 9
            this.setExpectedState(2);
        } else if (this.model.state === 3 || this.model.state === 7) {
            // Transition 25 or 56
            this.setExpectedState(5);
        } else if (this.model.state === 4 || this.model.state === 8) {
            // Transition 32 or 46
            this.setExpectedState(6);
        }
    }

    clickDebtDestResultBalance() {
        if (this.model.state === 0 || this.model.state === 1) { // Transition 3 or 5
            this.setExpectedState(2);
        } else if (this.model.state === 3 || this.model.state === 5) { // Transition 9
            this.setExpectedState(4);
        } else if (this.model.state === 7) {
            this.setExpectedState(8); // Transition 32 or 46
        } else {
            throw new Error('Unexpected state');
        }
    }

    async clickDestAmount() {
        if (this.model.type === EXPENSE) {
            this.clickExpenseDestAmount();
        } else if (this.model.type === INCOME) {
            this.clickIncomeDestAmount();
        } else if (this.model.type === TRANSFER) {
            this.clickTransferDestAmount();
        } else {
            throw new Error('Unexpected action: can\'t click by destination amount');
        }

        await this.performAction(() => this.content.dest_amount_left.click());

        return this.checkState();
    }

    clickExpenseDestAmount() {
        if (this.model.state === 1) { // Transition 3
            this.setExpectedState(0);
        } else if (this.model.state === 3 || this.model.state === 4) { // Transition 16 or 7
            this.setExpectedState(2);
        }
    }

    clickIncomeDestAmount() {
        // Transition 13 or 19
        if (this.model.state === 3 || this.model.state === 4) {
            this.setExpectedState(2);
        } else {
            throw new Error(`Unexpected state ${this.model.state} for clickDestAmount action`);
        }
    }

    clickTransferDestAmount() {
        if (this.model.state === 5 || this.model.state === 7) {
            // Transition 24 or 55
            this.setExpectedState(3);
        } else if (this.model.state === 6 || this.model.state === 8) {
            // Transition 33 or 35
            this.setExpectedState(4);
        } else {
            throw new Error(`Unexpected state ${this.model.state} for clickDestAmount action`);
        }
    }

    async inputResBalance(val) {
        if (this.model.type === EXPENSE) {
            this.inputExpenseResBalance(val);
        } else if (this.model.type === TRANSFER) {
            this.inputTransferResBalance(val);
        } else if (this.model.type === DEBT) {
            this.inputDebtResBalance(val);
        } else {
            throw new Error('Unexpected action: can\'t input source result balance');
        }

        await this.performAction(() => this.content.result_balance_row.input(val));

        return this.checkState();
    }

    inputExpenseResBalance(val) {
        const fNewValue = isValidValue(val) ? normalize(val) : val;

        this.model.srcResBal = val;
        if (this.model.fSrcResBal !== fNewValue) {
            this.model.fSrcResBal = fNewValue;
            this.model.fmtSrcResBal = this.model.srcCurr.format(this.model.srcResBal);

            const newSrcAmount = normalize(this.model.srcAccount.balance - fNewValue);

            this.model.srcAmount = newSrcAmount;
            this.model.fSrcAmount = isValidValue(newSrcAmount)
                ? normalize(newSrcAmount)
                : newSrcAmount;

            if (this.model.isDiffCurr) {
                this.calcExchByAmounts();
                this.updateExch();
            } else {
                this.setDestAmount(this.model.srcAmount);
            }
        }

        this.setExpectedState(this.model.state);
    }

    inputTransferResBalance(val) {
        const fNewValue = isValidValue(val) ? normalize(val) : val;

        this.model.srcResBal = val;
        if (this.model.fSrcResBal !== fNewValue) {
            this.model.fSrcResBal = fNewValue;
            this.model.fmtSrcResBal = this.model.srcCurr.format(this.model.srcResBal);

            const newSrcAmount = normalize(this.model.srcAccount.balance - fNewValue);

            this.model.srcAmount = newSrcAmount;
            this.model.fSrcAmount = isValidValue(newSrcAmount)
                ? normalize(newSrcAmount)
                : newSrcAmount;

            if (this.model.isDiffCurr) {
                this.calcExchByAmounts();
                this.updateExch();
            } else {
                this.setDestAmount(this.model.srcAmount);
            }
        }

        this.setExpectedState(this.model.state);
    }

    inputDebtResBalance(val) {
        this.model.srcResBal = val;

        const fNewValue = isValidValue(val) ? normalize(val) : val;
        if (this.model.fSrcResBal !== fNewValue) {
            this.model.fSrcResBal = fNewValue;
            this.model.fmtSrcResBal = this.model.srcCurr.format(this.model.srcResBal);

            const newSrcAmount = normalize(this.model.srcAccount.balance - fNewValue);
            this.model.srcAmount = newSrcAmount;
            this.model.fSrcAmount = isValidValue(newSrcAmount)
                ? normalize(newSrcAmount)
                : newSrcAmount;

            this.setDestAmount(this.model.srcAmount);
        }

        this.setExpectedState(this.model.state);
    }

    async inputDestResBalance(val) {
        if (this.model.type === INCOME) {
            this.inputIncomeDestResBalance(val);
        } else if (this.model.type === TRANSFER) {
            this.inputTransferDestResBalance(val);
        } else if (this.model.type === DEBT) {
            this.inputDebtDestResBalance(val);
        } else {
            throw new Error('Unexpected action: can\'t input destination result balance');
        }

        await this.performAction(() => this.content.result_balance_dest_row.input(val));

        return this.checkState();
    }

    inputIncomeDestResBalance(val) {
        const fNewValue = isValidValue(val) ? normalize(val) : val;

        this.model.destResBal = val;
        if (this.model.fDestResBal !== fNewValue) {
            this.model.fDestResBal = fNewValue;
            this.model.fmtDestResBal = this.model.destCurr.format(this.model.destResBal);

            const newSrcAmount = normalize(fNewValue - this.model.destAccount.balance);

            this.model.srcAmount = newSrcAmount;
            this.model.fSrcAmount = isValidValue(newSrcAmount)
                ? normalize(newSrcAmount)
                : newSrcAmount;

            if (this.model.isDiffCurr) {
                this.calcExchByAmounts();
                this.updateExch();
            } else {
                this.setDestAmount(this.model.fSrcAmount);
            }
        }

        this.setExpectedState(this.model.state);
    }

    inputTransferDestResBalance(val) {
        const fNewValue = isValidValue(val) ? normalize(val) : val;

        this.model.destResBal = val;

        if (this.model.fDestResBal !== fNewValue) {
            this.model.fDestResBal = fNewValue;
            this.model.fmtDestResBal = this.model.destCurr.format(this.model.destResBal);

            const newDestAmount = normalize(fNewValue - this.model.destAccount.balance);

            this.model.destAmount = newDestAmount;
            this.model.fDestAmount = isValidValue(newDestAmount)
                ? normalize(newDestAmount)
                : newDestAmount;

            if (this.model.isDiffCurr) {
                this.calcExchByAmounts();
                this.updateExch();
            } else {
                this.setSrcAmount(this.model.destAmount);
            }
        }

        this.setExpectedState(this.model.state);
    }

    inputDebtDestResBalance(val) {
        this.model.destResBal = val;

        const fNewValue = isValidValue(val) ? normalize(val) : val;
        if (this.model.fDestResBal !== fNewValue) {
            this.model.fDestResBal = fNewValue;
            this.model.fmtDestResBal = this.model.destCurr.format(this.model.destResBal);

            const newDestAmount = normalize(fNewValue - this.model.destAccount.balance);
            this.model.destAmount = newDestAmount;
            this.model.fDestAmount = isValidValue(newDestAmount)
                ? normalize(newDestAmount)
                : newDestAmount;

            this.setSrcAmount(this.model.destAmount);
        }

        this.setExpectedState(this.model.state);
    }

    async changeSourceCurrency(val) {
        if (this.model.type === INCOME) {
            this.changeIncomeSourceCurrency(val);
        } else {
            throw new Error('Unexpected action: can\'t change source currency');
        }

        await this.performAction(() => this.content.src_amount_row.selectCurr(val));

        return this.checkState();
    }

    changeIncomeSourceCurrency(val) {
        if (this.model.src_curr_id === val) {
            return;
        }

        this.model.src_curr_id = parseInt(val, 10);
        this.model.srcCurr = Currency.getById(this.model.src_curr_id);

        this.model.isDiffCurr = (this.model.src_curr_id !== this.model.dest_curr_id);

        if (this.model.isDiffCurr && this.model.state === 0) {
            // Transition 3
            this.updateExch();
            this.setExpectedState(2);
        } else if (this.model.state === 2 || this.model.state === 3 || this.model.state === 4) {
            if (this.model.isDiffCurr) {
                // Transition 9, 21 or 15
                this.updateExch();
                this.setExpectedState(this.model.state);
            } else {
                this.setDestAmount(this.model.srcAmount);
                this.calcExchByAmounts();
                this.updateExch();
                if (this.model.state === 2 || this.model.state === 3) {
                    // Transition 10 or 16
                    this.setExpectedState(0);
                } else {
                    // Transition 22
                    this.setExpectedState(1);
                }
            }
        } else {
            throw new Error('Unexpected transition');
        }
    }

    async changeDestCurrency(val) {
        if (this.model.type === EXPENSE) {
            this.changeExpenseDestCurrency(val);
        } else {
            throw new Error('Unexpected action: can\'t change destination currency');
        }

        await this.performAction(() => this.content.dest_amount_row.selectCurr(val));

        return this.checkState();
    }

    changeExpenseDestCurrency(val) {
        if (this.model.dest_curr_id === val) {
            return;
        }

        this.model.dest_curr_id = parseInt(val, 10);
        this.model.destCurr = Currency.getById(this.model.dest_curr_id);

        this.model.isDiffCurr = (this.model.src_curr_id !== this.model.dest_curr_id);

        if (this.model.isDiffCurr && this.model.state === 0) { // Transition 4
            this.updateExch();
            this.setExpectedState(2);
        } else if (this.model.state === 2) {
            if (this.model.isDiffCurr) { // Transition 13
                this.updateExch();
                this.setExpectedState(2);
            } else { // Transition 9
                this.setSrcAmount(this.model.fDestAmount);
                this.calcExchByAmounts();
                this.updateExch();
                this.setExpectedState(0);
            }
        } else {
            throw new Error('Unexpected transition');
        }
    }

    async clickExchRate() {
        if (this.model.type === EXPENSE) {
            this.clickExpenseExchRate();
        } else if (this.model.type === INCOME) {
            this.clickIncomeExchRate();
        } else if (this.model.type === TRANSFER) {
            this.clickTransferExchRate();
        } else {
            throw new Error('Unexpected action: can\'t click by exchange rate');
        }

        await this.performAction(() => this.content.exch_left.click());

        return this.checkState();
    }

    clickExpenseExchRate() {
        this.setExpectedState(3);
    }

    clickIncomeExchRate() {
        // Transition 20
        this.setExpectedState(3);
    }

    clickTransferExchRate() {
        if (this.model.state === 3 || this.model.state === 5) {
            // Transition 40 or 21
            this.setExpectedState(7);
        } else if (this.model.state === 4 || this.model.state === 6) {
            // Transition 34 or 45
            this.setExpectedState(8);
        }
    }

    async inputExchRate(val) {
        if (this.model.type === EXPENSE) {
            this.inputExpenseExchRate(val);
        } else if (this.model.type === INCOME) {
            this.inputIncomeExchRate(val);
        } else if (this.model.type === TRANSFER) {
            this.inputTransferExchRate(val);
        } else {
            throw new Error('Unexpected action: can\'t input exchange rate');
        }

        await this.performAction(() => this.content.exchange_row.input(val));

        return this.checkState();
    }

    inputExpenseExchRate(val) {
        if (this.model.state !== 3) {
            throw new Error(`Unexpected state ${this.model.state} to input exchange rate`);
        }

        this.model.exchRate = val;

        const fNewValue = isValidValue(val) ? normalizeExch(val) : val;
        if (this.model.fExchRate !== fNewValue) {
            if (isValidValue(this.model.srcAmount)) {
                const newDestAmount = correct(this.model.fSrcAmount * fNewValue);
                this.setDestAmount(newDestAmount);
            } else if (isValidValue(this.model.destAmount)) {
                const newSrcAmount = correct(this.model.fDestAmount / fNewValue);
                this.setSrcAmount(newSrcAmount);
            }

            this.updateExch();
        }

        this.setExpectedState(3);
    }

    inputIncomeExchRate(val) {
        if (this.model.state !== 3) {
            throw new Error(`Unexpected state ${this.model.state} to input exchange rate`);
        }

        this.model.exchRate = val;

        const fNewValue = (isValidValue(val)) ? normalizeExch(val) : val;
        if (this.model.fExchRate !== fNewValue) {
            if (isValidValue(this.model.srcAmount)) {
                const newDestAmount = correct(this.model.fSrcAmount * fNewValue);
                this.setDestAmount(newDestAmount);
            } else if (isValidValue(this.model.destAmount)) {
                const newSrcAmount = correct(this.model.fDestAmount / fNewValue);
                this.setSrcAmount(newSrcAmount);
            }

            this.updateExch();
        }

        this.setExpectedState(3);
    }

    inputTransferExchRate(val) {
        if (this.model.state !== 3) {
            throw new Error(`Unexpected state ${this.model.state} to input exchange rate`);
        }

        this.model.exchRate = val;

        const fNewValue = (isValidValue(val)) ? normalizeExch(val) : val;
        if (this.model.fExchRate !== fNewValue) {
            if (isValidValue(this.model.srcAmount)) {
                const newDestAmount = correct(this.model.fSrcAmount * fNewValue);
                this.setDestAmount(newDestAmount);
            } else if (isValidValue(this.model.destAmount)) {
                const newSrcAmount = correct(this.model.fDestAmount / fNewValue);
                this.setSrcAmount(newSrcAmount);
            }

            this.updateExch();
        }

        this.setExpectedState(3);
    }

    async changeDate(val) {
        await this.performAction(() => this.content.datePicker.input(val));

        return this.checkState();
    }

    async inputComment(val) {
        await this.performAction(() => this.content.comment_row.input(val));

        return this.checkState();
    }

    async changePerson(val) {
        this.model.person = App.state.persons.getItem(val);

        const personAccCurrencyId = (this.model.debtType)
            ? this.model.srcCurr.id
            : this.model.destCurr.id;
        this.model.personAccount = this.getPersonAccount(
            this.model.person.id,
            personAccCurrencyId,
        );

        if (this.model.debtType) {
            this.model.srcAccount = this.model.personAccount;
            this.model.srcAccount.fmtBalance = this.model.srcCurr.format(
                this.model.srcAccount.balance,
            );

            this.model.srcResBal = normalize(this.model.srcAccount.balance - this.model.fSrcAmount);
            this.model.fmtSrcResBal = this.model.srcCurr.format(this.model.srcResBal);
        } else {
            this.model.destAccount = this.model.personAccount;
            this.model.destAccount.fmtBalance = this.model.destCurr.format(
                this.model.destAccount.balance,
            );

            const destRes = this.model.destAccount.balance + this.model.fDestAmount;
            this.model.fDestResBal = normalize(destRes);
            this.model.destResBal = this.model.fDestResBal;
            this.model.fmtDestResBal = this.model.destCurr.format(this.model.destResBal);
        }

        this.setExpectedState(this.model.state);

        await this.performAction(() => this.content.person.selectAccount(val));

        return this.checkState();
    }

    async changePersonByPos(pos) {
        return this.changePerson(this.content.person.dropDown.items[pos].id);
    }

    async toggleDebtType() {
        const newValue = !this.model.debtType;

        if (newValue) {
            this.model.srcAccount = this.model.personAccount;
            this.model.destAccount = this.model.account;
        } else {
            this.model.srcAccount = this.model.account;
            this.model.destAccount = this.model.personAccount;
        }

        if (this.model.srcAccount) {
            this.model.srcResBal = normalize(this.model.srcAccount.balance - this.model.fSrcAmount);
        } else if (this.model.noAccount && !newValue) {
            const lastAcc = App.state.accounts.getItem(this.model.lastAccount_id);
            if (!lastAcc) {
                throw new Error('Last account not found');
            }

            this.model.srcResBal = normalize(lastAcc.balance - this.model.fSrcAmount);
        }
        this.model.fmtSrcResBal = this.model.srcCurr.format(this.model.srcResBal);

        if (this.model.destAccount) {
            const destRes = this.model.destAccount.balance + this.model.fDestAmount;
            this.model.destResBal = normalize(destRes);
        } else if (this.model.noAccount && newValue) {
            const lastAcc = App.state.accounts.getItem(this.model.lastAccount_id);
            if (!lastAcc) {
                throw new Error('Last account not found');
            }

            this.model.destResBal = normalize(lastAcc.balance + this.model.fDestAmount);
        }

        this.model.fmtDestResBal = this.model.destCurr.format(this.model.destResBal);

        if (this.model.debtType) {
            this.model.debtType = newValue;

            if (this.model.state === 0) { // Transition 7
                this.setExpectedState(3);
            } else if (this.model.state === 1) { // Transition 16
                this.setExpectedState(4);
            } else if (this.model.state === 2) { // Transition 18
                this.setExpectedState(5);
            } else if (this.model.state === 6) { // Transition 27
                this.setExpectedState(7);
            } else if (this.model.state === 9) { // Transition 34
                this.setExpectedState(8);
            } else {
                throw new Error('Unexpected state');
            }
        } else {
            this.model.debtType = newValue;

            if (this.model.state === 3) { // Transition 8
                this.setExpectedState(0);
            } else if (this.model.state === 4) { // Transition 16
                this.setExpectedState(1);
            } else if (this.model.state === 5) { // Transition 17
                this.setExpectedState(2);
            } else if (this.model.state === 7) { // Transition 28
                this.setExpectedState(6);
            } else if (this.model.state === 8) { // Transition 33
                this.setExpectedState(9);
            } else {
                throw new Error('Unexpected state');
            }
        }

        const opTypeCheck = (this.model.debtType)
            ? this.content.operation.debtgive
            : this.content.operation.debttake;
        await this.performAction(() => this.click(opTypeCheck));

        return this.checkState();
    }

    async toggleAccount() {
        this.model.noAccount = !this.model.noAccount;

        if (this.model.noAccount) {
            this.model.lastAccount_id = this.model.account.id;
            if (this.model.debtType) {
                this.model.fDestResBal = normalize(this.model.account.balance);
                this.model.destResBal = this.model.fDestResBal;
                this.model.fmtDestResBal = this.model.destCurr.format(this.model.destResBal);
            } else {
                this.model.srcResBal = normalize(this.model.account.balance);
                this.model.fmtSrcResBal = this.model.srcCurr.format(this.model.srcResBal);
            }

            if (this.model.state === 0 || this.model.state === 2) {
                this.setExpectedState(6); // Transition 25 or 41
            } else if (this.model.state === 1) {
                this.setExpectedState(9); // Transition 38
            } else if (this.model.state === 3 || this.model.state === 5) {
                this.setExpectedState(7); // Transition 40 or 50
            } else if (this.model.state === 4) {
                this.setExpectedState(8); // Transition 39
            } else {
                throw new Error('Unexpected state');
            }
        } else {
            if (this.model.lastAccount_id) {
                this.model.account = App.state.accounts.getItem(this.model.lastAccount_id);
            }
            if (!this.model.account) {
                throw new Error('Account not found');
            }

            if (this.model.debtType) {
                this.model.destAccount = this.model.account;

                const destRes = this.model.destAccount.balance + this.model.fDestAmount;
                this.model.destResBal = normalize(destRes);
                this.model.fmtDestResBal = this.model.destCurr.format(this.model.destResBal);
            } else {
                this.model.srcAccount = this.model.account;

                const srcRes = this.model.srcAccount.balance - this.model.fSrcAmount;
                this.model.srcResBal = normalize(srcRes);
                this.model.fmtSrcResBal = this.model.srcCurr.format(this.model.srcResBal);
            }

            if (this.model.srcAccount) {
                this.model.srcAccount.fmtBalance = this.model.srcCurr.format(
                    this.model.srcAccount.balance,
                );
            }
            if (this.model.destAccount) {
                this.model.destAccount.fmtBalance = this.model.destCurr.format(
                    this.model.destAccount.balance,
                );
            }

            if (this.model.state === 6) {
                this.setExpectedState(0); // Transition 26
            } else if (this.model.state === 7) {
                this.setExpectedState(3); // Transition 29
            } else if (this.model.state === 8) {
                this.setExpectedState(4); // Transition 32
            } else if (this.model.state === 9) {
                this.setExpectedState(1); // Transition 37
            } else {
                throw new Error('Unexpected state');
            }
        }

        const clickTarget = (this.model.noAccount)
            ? this.content.noacc_btn
            : this.content.selaccount;

        await this.performAction(() => clickTarget.click());

        return this.checkState();
    }

    async changeAccount(accountId) {
        const newAcc = App.state.accounts.getItem(accountId);

        if (!this.model.account || !newAcc || newAcc.id === this.model.account.id) {
            return true;
        }

        this.model.account = newAcc;

        if (this.model.personAccount.curr_id !== this.model.account.curr_id) {
            this.model.personAccount = this.getPersonAccount(
                this.model.person.id,
                this.model.account.curr_id,
            );
        }

        this.model.src_curr_id = this.model.account.curr_id;
        this.model.dest_curr_id = this.model.src_curr_id;
        this.model.srcCurr = Currency.getById(this.model.src_curr_id);
        this.model.destCurr = Currency.getById(this.model.dest_curr_id);

        if (this.model.debtType) {
            this.model.srcAccount = this.model.personAccount;
            this.model.destAccount = this.model.account;
        } else {
            this.model.srcAccount = this.model.account;
            this.model.destAccount = this.model.personAccount;
        }

        this.model.srcAccount.fmtBalance = this.model.srcCurr.format(
            this.model.srcAccount.balance,
        );
        const newSrcResBal = normalize(this.model.srcAccount.balance - this.model.fSrcAmount);
        if (this.model.fSrcResBal !== newSrcResBal) {
            this.model.srcResBal = newSrcResBal;
            this.model.fSrcResBal = this.model.srcResBal;
        }
        this.model.fmtSrcResBal = this.model.srcCurr.format(this.model.srcResBal);

        this.model.destAccount.fmtBalance = this.model.destCurr.format(
            this.model.destAccount.balance,
        );
        const newDestResBal = normalize(this.model.destAccount.balance + this.model.fDestAmount);
        if (this.model.fDestResBal !== newDestResBal) {
            this.model.destResBal = newDestResBal;
            this.model.fDestResBal = this.model.destResBal;
        }
        this.model.fmtDestResBal = this.model.destCurr.format(this.model.destResBal);

        this.updateExch();

        this.setExpectedState(this.model.state);

        await this.performAction(() => this.content.account.selectAccount(accountId));

        return this.checkState();
    }

    changeAccountByPos(pos) {
        return this.changeAccount(this.content.account.dropDown.items[pos].id);
    }
}
