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
    availTransTypes,
} from '../model/Transaction.js';
import { Currency } from '../model/Currency.js';
import { App } from '../Application.js';
import {
    url,
    query,
    prop,
    parentNode,
    navigation,
    click,
} from '../env.js';

/** Create or update transaction view class */
export class TransactionView extends AppView {
    constructor(...args) {
        super(...args);

        this.expectedState = {};
    }

    async parseContent() {
        const res = {};

        res.isUpdate = (await url()).includes('/update/');

        if (res.isUpdate) {
            const hiddenEl = await query('input[name="id"]');
            if (!hiddenEl) {
                throw new Error('Transaction id field not found');
            }

            res.id = parseInt(await prop(hiddenEl, 'value'), 10);
            if (!res.id) {
                throw new Error('Wrong transaction id');
            }
        }

        res.heading = { elem: await query('.heading > h1') };
        if (res.heading.elem) {
            res.heading.title = await prop(res.heading.elem, 'textContent');
        }

        res.delBtn = await IconLink.create(this, await query('#del_btn'));

        res.typeMenu = await TransactionTypeMenu.create(this, await query('.trtype-menu'));
        if (res.typeMenu.multi) {
            throw new Error('Invalid transaction type menu');
        }

        res.person = await TileBlock.create(this, await query('#person'));
        if (res.person) {
            const personIdInp = await query('#person_id');
            res.person.content.id = parseInt(await prop(personIdInp, 'value'), 10);
        }

        res.account = await TileBlock.create(this, await query('#debtaccount'));
        if (res.account) {
            const accountIdInp = await query('#acc_id');
            res.account.content.id = parseInt(await prop(accountIdInp, 'value'), 10);
        }

        res.operation = await this.parseOperation(await query('#operation'));

        res.selaccount = await Button.create(this, await query('#selaccount'));
        if (!res.selaccount) {
            throw new Error('Select account button not found');
        }

        res.noacc_btn = await Button.create(this, await query('#noacc_btn'));
        if (!res.noacc_btn) {
            throw new Error('Disable account button not found');
        }

        res.source = await TileBlock.create(this, await query('#source'));
        if (res.source) {
            const srcIdInp = await query('#src_id');
            res.source.content.id = parseInt(await prop(srcIdInp, 'value'), 10);
        }
        res.destination = await TileBlock.create(this, await query('#destination'));
        if (res.destination) {
            const destIdInp = await query('#dest_id');
            res.destination.content.id = parseInt(await prop(destIdInp, 'value'), 10);
        }

        res.src_amount_left = await TileInfoItem.create(this, await query('#src_amount_left'));
        res.dest_amount_left = await TileInfoItem.create(this, await query('#dest_amount_left'));
        res.src_res_balance_left = await TileInfoItem.create(this, await query('#src_res_balance_left'));
        res.dest_res_balance_left = await TileInfoItem.create(this, await query('#dest_res_balance_left'));
        res.exch_left = await TileInfoItem.create(this, await query('#exch_left'));

        res.src_amount_row = await InputRow.create(this, await query('#src_amount_row'));
        res.dest_amount_row = await InputRow.create(this, await query('#dest_amount_row'));
        res.exchange_row = await InputRow.create(this, await query('#exchange'));
        res.result_balance_row = await InputRow.create(this, await query('#result_balance'));
        res.result_balance_dest_row = await InputRow.create(this, await query('#result_balance_dest'));

        const calendarBtn = await query('#calendar_btn');
        res.datePicker = await DatePickerRow.create(this, await parentNode(calendarBtn));
        const commentBtn = await query('#comm_btn');
        res.comment_row = await CommentRow.create(this, await parentNode(commentBtn));

        res.submitBtn = await query('#submitbtn');
        res.cancelBtn = await query('#submitbtn + *');

        res.delete_warning = await WarningPopup.create(this, await query('#delete_warning'));

        return res;
    }

    async parseOperation(el) {
        const res = { elem: el };

        if (!res.elem) {
            return null;
        }

        res.debtgive = await query('#debtgive');
        res.debttake = await query('#debttake');

        res.type = await prop(res.debtgive, 'checked');

        return res;
    }

    async buildModel(cont) {
        const res = this.model;

        const selectedTypes = cont.typeMenu.getSelectedTypes();
        if (selectedTypes.length !== 1 || !availTransTypes.includes(selectedTypes[0])) {
            throw new Error('Invalid type selected');
        }

        [res.type] = selectedTypes;
        res.isUpdate = cont.isUpdate;
        if (res.isUpdate) {
            res.id = cont.id;
        }

        res.srcAccount = (cont.source)
            ? App.state.accounts.getItem(cont.source.content.id)
            : null;
        res.destAccount = (cont.destination)
            ? App.state.accounts.getItem(cont.destination.content.id)
            : null;

        res.src_curr_id = (cont.src_amount_row)
            ? parseInt(cont.src_amount_row.content.hiddenValue, 10)
            : 0;
        res.dest_curr_id = (cont.dest_amount_row)
            ? parseInt(cont.dest_amount_row.content.hiddenValue, 10)
            : 0;

        res.srcCurr = Currency.getById(res.src_curr_id);
        if (!res.srcCurr) {
            throw new Error('Source currency not found');
        }
        res.destCurr = Currency.getById(res.dest_curr_id);
        if (!res.destCurr) {
            throw new Error('Destination currency not found');
        }
        res.isDiffCurr = (res.src_curr_id !== res.dest_curr_id);

        res.srcAmount = cont.src_amount_row.content.value;
        res.fSrcAmount = isValidValue(res.srcAmount) ? normalize(res.srcAmount) : res.srcAmount;

        res.destAmount = cont.dest_amount_row.content.value;
        res.fDestAmount = isValidValue(res.destAmount) ? normalize(res.destAmount) : res.destAmount;

        res.srcResBal = cont.result_balance_row.content.value;
        res.fSrcResBal = isValidValue(res.srcResBal) ? normalize(res.srcResBal) : res.srcResBal;
        res.fmtSrcResBal = res.srcCurr.format(res.fSrcResBal);

        res.destResBal = cont.result_balance_dest_row.content.value;
        res.fDestResBal = isValidValue(res.destResBal) ? normalize(res.destResBal) : res.destResBal;
        res.fmtDestResBal = res.destCurr.format(res.fDestResBal);

        res.exchRate = cont.exchange_row.content.value;
        this.updateExch();

        if (res.type === EXPENSE) {
            if (!res.srcAccount) {
                throw new Error('Source account not found');
            }

            const isResBalRowVisible = cont.result_balance_row?.content?.visible;
            const exchRowVisible = cont.exchange_row?.content?.visible;

            if (res.isDiffCurr) {
                if (exchRowVisible) {
                    res.state = 3;
                } else {
                    res.state = (isResBalRowVisible) ? 4 : 2;
                }
            } else {
                res.state = (isResBalRowVisible) ? 1 : 0;
            }
        }

        if (res.type === INCOME) {
            if (!res.destAccount) {
                throw new Error('Destination account not found');
            }

            const destResRowVisible = cont.result_balance_dest_row?.content?.visible;
            const exchRowVisible = cont.exchange_row?.content?.visible;

            if (res.isDiffCurr) {
                if (exchRowVisible) {
                    res.state = 3;
                } else {
                    res.state = (destResRowVisible) ? 4 : 2;
                }
            } else {
                res.state = (destResRowVisible) ? 1 : 0;
            }
        }

        if (res.type === TRANSFER) {
            if (!res.srcAccount) {
                throw new Error('Source account not found');
            }
            if (!res.destAccount) {
                throw new Error('Destination account not found');
            }

            const srcAmountRowVisible = cont.src_amount_row?.content?.visible;
            const destAmountRowVisible = cont.dest_amount_row?.content?.visible;
            const srcResRowVisible = cont.result_balance_row?.content?.visible;
            const destResRowVisible = cont.result_balance_dest_row?.content?.visible;
            const exchRowVisible = cont.exchange_row?.content?.visible;

            if (res.isDiffCurr) {
                if (srcAmountRowVisible && destAmountRowVisible) {
                    res.state = 3;
                } else if (destAmountRowVisible && srcResRowVisible) {
                    res.state = 4;
                } else if (srcAmountRowVisible && destResRowVisible) {
                    res.state = 5;
                } else if (srcResRowVisible && destResRowVisible) {
                    res.state = 6;
                } else if (srcAmountRowVisible && exchRowVisible) {
                    res.state = 7;
                } else if (srcResRowVisible && exchRowVisible) {
                    res.state = 8;
                } else {
                    throw new Error('Unexpected state');
                }
            } else if (!res.isDiffCurr) {
                if (srcAmountRowVisible) {
                    res.state = 0;
                } else if (srcResRowVisible) {
                    res.state = 1;
                } else if (destResRowVisible) {
                    res.state = 2;
                } else {
                    throw new Error('Unexpected state');
                }
            }
        }

        if (res.type === DEBT) {
            res.person = App.state.persons.getItem(cont.person.content.id);
            if (!res.person) {
                throw new Error('Person not found');
            }

            res.debtType = cont.operation.type;

            if (res.isDiffCurr) {
                throw new Error('Source and destination currencies are not the same');
            }

            const personAccountCurr = (res.debtType) ? res.src_curr_id : res.dest_curr_id;
            res.personAccount = this.getPersonAccount(res.person.id, personAccountCurr);

            const isSelectAccountVisible = cont.selaccount?.content?.visible;
            res.noAccount = isSelectAccountVisible;

            res.account = App.state.accounts.getItem(cont.account.content.id);
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

            if (res.fSrcAmount !== res.fDestAmount) {
                throw new Error('Source and destination amount are different');
            }

            const srcAmountRowVisible = cont.src_amount_row?.content?.visible;
            const srcResRowVisible = cont.result_balance_row?.content?.visible;
            const destResRowVisible = cont.result_balance_dest_row?.content?.visible;

            if (res.noAccount) {
                if (srcAmountRowVisible) {
                    res.state = (res.debtType) ? 6 : 7;
                } else if (srcResRowVisible && res.debtType) {
                    res.state = 9;
                } else if (destResRowVisible && !res.debtType) {
                    res.state = 8;
                } else {
                    throw new Error('Unexpected state');
                }
            } else if (!res.noAccount) {
                if (srcAmountRowVisible) {
                    res.state = res.debtType ? 0 : 3;
                } else if (srcResRowVisible) {
                    res.state = res.debtType ? 1 : 5;
                } else if (destResRowVisible) {
                    res.state = res.debtType ? 2 : 4;
                } else {
                    throw new Error('Unexpected state');
                }
            }
        }

        if (res.srcAccount) {
            if (res.srcAccount.curr_id !== res.src_curr_id) {
                throw new Error(`Unexpected destination currency ${res.dest_curr_id}(${res.destAccount.curr_id} is expected)`);
            }

            res.srcAccount.fmtBalance = res.srcCurr.format(res.srcAccount.balance);
        }
        if (res.destAccount) {
            if (res.destAccount.curr_id !== res.dest_curr_id) {
                throw new Error(`Unexpected destination currency ${res.dest_curr_id}(${res.destAccount.curr_id} is expected)`);
            }

            res.destAccount.fmtBalance = res.destCurr.format(res.destAccount.balance);
        }

        res.date = cont.datePicker.content.date;
        res.comment = cont.comment_row.content.value;

        return res;
    }

    async isValid() {
        if (this.content.src_amount_row?.content?.visible) {
            if (!this.model.srcAmount.length || !isValidValue(this.model.srcAmount)) {
                return false;
            }
        }

        if (this.content.dest_amount_row?.content?.visible) {
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

    setExpectedState(stateId) {
        const newState = parseInt(stateId, 10);
        if (Number.isNaN(newState)) {
            throw new Error('Invalid state specified');
        }

        const res = {
            typeMenu: { selectedTypes: [this.model.type] },
            person: { visible: this.model.type === DEBT, tile: {} },
            account: { visible: this.model.type === DEBT, tile: {} },
            source: { visible: (this.model.type === EXPENSE || this.model.type === TRANSFER) },
            destination: { visible: (this.model.type === INCOME || this.model.type === TRANSFER) },
            src_amount_row: {
                value: this.model.srcAmount.toString(),
                currSign: this.model.srcCurr.sign,
                isCurrActive: this.model.type === INCOME,
            },
            dest_amount_row: {
                value: this.model.destAmount.toString(),
                currSign: this.model.destCurr.sign,
                isCurrActive: this.model.type === EXPENSE,
            },
            result_balance_row: {},
            result_balance_dest_row: {},
            exchange_row: {
                value: this.model.exchRate.toString(),
                currSign: this.model.exchSign,
            },
            src_amount_left: {},
            dest_amount_left: {},
            src_res_balance_left: {},
            dest_res_balance_left: {},
            exch_left: { value: this.model.fmtExch },
        };

        if (this.model.isUpdate) {
            res.delBtn = {
                title: 'Delete',
                visible: true,
            };
        }

        if (this.model.type === EXPENSE || this.model.type === TRANSFER) {
            res.source.tile = {
                name: this.model.srcAccount.name,
                balance: this.model.srcAccount.fmtBalance,
                visible: true,
            };
            res.src_res_balance_left.value = this.model.fmtSrcResBal;
        }

        if (this.model.type === INCOME || this.model.type === TRANSFER) {
            res.destination.tile = {
                name: this.model.destAccount.name,
                balance: this.model.destAccount.fmtBalance,
                visible: true,
            };
            res.dest_res_balance_left.value = this.model.fmtDestResBal;
        }

        if (this.model.type !== INCOME) {
            res.result_balance_row.value = this.model.srcResBal.toString();
            res.result_balance_row.isCurrActive = false;
        }

        if (this.model.type !== EXPENSE) {
            res.src_amount_left.value = this.model.srcCurr.format(this.model.fSrcAmount);
            res.result_balance_dest_row.value = this.model.destResBal.toString();
            res.result_balance_dest_row.isCurrActive = false;
        }
        if (this.model.type !== DEBT) {
            res.dest_amount_left.value = this.model.destCurr.format(this.model.fDestAmount);
        }

        if (this.model.type === EXPENSE) {
            if (newState < 0 || newState > 4) {
                throw new Error('Wrong state specified');
            }

            if (newState === 0 || newState === 1) {
                res.src_amount_row.label = 'Amount';
                res.dest_amount_row.label = 'Amount';
            } else {
                res.src_amount_row.label = 'Source amount';
                res.dest_amount_row.label = 'Destination amount';
            }

            res.result_balance_row.label = 'Result balance';

            res.src_amount_left.visible = false;
            res.dest_res_balance_left.visible = false;
            res.result_balance_dest_row.visible = false;

            if (newState === 0) {
                res.dest_amount_left.visible = false;
                res.src_res_balance_left.visible = true;
                res.exch_left.visible = false;
                res.src_amount_row.visible = false;
                res.dest_amount_row.visible = true;
                res.exchange_row.visible = false;
                res.result_balance_row.visible = false;
            } else if (newState === 1) {
                res.dest_amount_left.visible = true;
                res.src_res_balance_left.visible = false;
                res.exch_left.visible = false;
                res.src_amount_row.visible = false;
                res.dest_amount_row.visible = false;
                res.exchange_row.visible = false;
                res.result_balance_row.visible = true;
            } else if (newState === 2) {
                res.dest_amount_left.visible = false;
                res.src_res_balance_left.visible = true;
                res.exch_left.visible = true;
                res.src_amount_row.visible = true;
                res.dest_amount_row.visible = true;
                res.exchange_row.visible = false;
                res.result_balance_row.visible = false;
            } else if (newState === 3) {
                res.dest_amount_left.visible = true;
                res.src_res_balance_left.visible = true;
                res.exch_left.visible = false;
                res.src_amount_row.visible = true;
                res.dest_amount_row.visible = false;
                res.exchange_row.visible = true;
                res.result_balance_row.visible = false;
            } else if (newState === 4) {
                res.dest_amount_left.visible = true;
                res.src_res_balance_left.visible = false;
                res.exch_left.visible = true;
                res.src_amount_row.visible = true;
                res.dest_amount_row.visible = false;
                res.exchange_row.visible = false;
                res.result_balance_row.visible = true;
            }
        }

        if (this.model.type === INCOME) {
            if (newState < 0 || newState > 4) {
                throw new Error('Wrong state specified');
            }

            res.dest_res_balance_left.visible = false;
            res.result_balance_dest_row.visible = false;
            res.result_balance_dest_row.label = 'Result balance';

            if (newState === 0 || newState === 1) {
                res.src_amount_row.label = 'Amount';
                res.dest_amount_row.label = 'Amount';
            } else {
                res.src_amount_row.label = 'Source amount';
                res.dest_amount_row.label = 'Destination amount';
            }

            if (newState === 0) {
                res.src_amount_left.visible = false;
                res.dest_amount_left.visible = false;
                res.dest_res_balance_left.visible = true;
                res.exch_left.visible = false;
                res.src_amount_row.visible = true;
                res.dest_amount_row.visible = false;
                res.result_balance_dest_row.visible = false;
                res.exchange_row.visible = false;
            } else if (newState === 1) {
                res.src_amount_left.visible = true;
                res.dest_amount_left.visible = false;
                res.dest_res_balance_left.visible = false;
                res.exch_left.visible = false;
                res.src_amount_row.visible = false;
                res.dest_amount_row.visible = false;
                res.result_balance_dest_row.visible = true;
                res.exchange_row.visible = false;
            } else if (newState === 2) {
                res.src_amount_left.visible = false;
                res.dest_amount_left.visible = false;
                res.dest_res_balance_left.visible = true;
                res.exch_left.visible = true;
                res.src_amount_row.visible = true;
                res.dest_amount_row.visible = true;
                res.exchange_row.visible = false;
                res.result_balance_dest_row.visible = false;
            } else if (newState === 3) {
                res.src_amount_left.visible = false;
                res.dest_amount_left.visible = true;
                res.dest_res_balance_left.visible = true;
                res.exch_left.visible = false;
                res.src_amount_row.visible = true;
                res.dest_amount_row.visible = false;
                res.exchange_row.visible = true;
                res.result_balance_dest_row.visible = false;
            } else if (newState === 4) {
                res.src_amount_left.visible = false;
                res.dest_amount_left.visible = true;
                res.dest_res_balance_left.visible = false;
                res.exch_left.visible = true;
                res.src_amount_row.visible = true;
                res.dest_amount_row.visible = false;
                res.exchange_row.visible = false;
                res.result_balance_dest_row.visible = true;
            }
        }

        if (this.model.type === TRANSFER) {
            if (newState < 0 || newState > 8) {
                throw new Error('Wrong state specified');
            }

            res.result_balance_row.label = 'Result balance (Source)';
            res.result_balance_dest_row.label = 'Result balance (Destination)';

            if (newState === 0 || newState === 1 || newState === 2) {
                res.src_amount_row.label = 'Amount';
                res.dest_amount_row.label = 'Amount';
            } else {
                res.src_amount_row.label = 'Source amount';
                res.dest_amount_row.label = 'Destination amount';
            }

            if (newState === 0) {
                res.src_amount_left.visible = false;
                res.dest_amount_left.visible = false;
                res.src_res_balance_left.visible = true;
                res.dest_res_balance_left.visible = true;
                res.exch_left.visible = false;
                res.src_amount_row.visible = true;
                res.dest_amount_row.visible = false;
                res.result_balance_row.visible = false;
                res.result_balance_dest_row.visible = false;
                res.exchange_row.visible = false;
            } else if (newState === 1) {
                res.src_amount_left.visible = true;
                res.dest_amount_left.visible = false;
                res.src_res_balance_left.visible = false;
                res.dest_res_balance_left.visible = true;
                res.exch_left.visible = false;
                res.src_amount_row.visible = false;
                res.dest_amount_row.visible = false;
                res.result_balance_row.visible = true;
                res.result_balance_dest_row.visible = false;
                res.exchange_row.visible = false;
            } else if (newState === 2) {
                res.src_amount_left.visible = true;
                res.dest_amount_left.visible = false;
                res.src_res_balance_left.visible = true;
                res.dest_res_balance_left.visible = false;
                res.exch_left.visible = false;
                res.src_amount_row.visible = false;
                res.dest_amount_row.visible = false;
                res.result_balance_row.visible = false;
                res.result_balance_dest_row.visible = true;
                res.exchange_row.visible = false;
            } else if (newState === 3) {
                res.src_amount_left.visible = false;
                res.dest_amount_left.visible = false;
                res.src_res_balance_left.visible = true;
                res.dest_res_balance_left.visible = true;
                res.exch_left.visible = true;
                res.src_amount_row.visible = true;
                res.dest_amount_row.visible = true;
                res.result_balance_row.visible = false;
                res.result_balance_dest_row.visible = false;
                res.exchange_row.visible = false;
            } else if (newState === 4) {
                res.src_amount_left.visible = true;
                res.dest_amount_left.visible = false;
                res.src_res_balance_left.visible = false;
                res.dest_res_balance_left.visible = true;
                res.exch_left.visible = true;
                res.src_amount_row.visible = false;
                res.dest_amount_row.visible = true;
                res.result_balance_row.visible = true;
                res.result_balance_dest_row.visible = false;
                res.exchange_row.visible = false;
            } else if (newState === 5) {
                res.src_amount_left.visible = false;
                res.dest_amount_left.visible = true;
                res.src_res_balance_left.visible = true;
                res.dest_res_balance_left.visible = false;
                res.exch_left.visible = true;
                res.src_amount_row.visible = true;
                res.dest_amount_row.visible = false;
                res.result_balance_row.visible = false;
                res.result_balance_dest_row.visible = true;
                res.exchange_row.visible = false;
            } else if (newState === 6) {
                res.src_amount_left.visible = true;
                res.dest_amount_left.visible = true;
                res.src_res_balance_left.visible = false;
                res.dest_res_balance_left.visible = false;
                res.exch_left.visible = true;
                res.src_amount_row.visible = false;
                res.dest_amount_row.visible = false;
                res.result_balance_row.visible = true;
                res.result_balance_dest_row.visible = true;
                res.exchange_row.visible = false;
            } else if (newState === 7) {
                res.src_amount_left.visible = false;
                res.dest_amount_left.visible = true;
                res.src_res_balance_left.visible = true;
                res.dest_res_balance_left.visible = true;
                res.exch_left.visible = false;
                res.src_amount_row.visible = true;
                res.dest_amount_row.visible = false;
                res.result_balance_row.visible = false;
                res.result_balance_dest_row.visible = false;
                res.exchange_row.visible = true;
            } else if (newState === 8) {
                res.src_amount_left.visible = true;
                res.dest_amount_left.visible = true;
                res.src_res_balance_left.visible = false;
                res.dest_res_balance_left.visible = true;
                res.exch_left.visible = false;
                res.src_amount_row.visible = false;
                res.dest_amount_row.visible = false;
                res.result_balance_row.visible = true;
                res.result_balance_dest_row.visible = false;
                res.exchange_row.visible = true;
            }
        }

        if (this.model.type === DEBT) {
            if (newState < 0 || newState > 9) {
                throw new Error('Wrong state specified');
            }

            res.account.tile.visible = !this.model.noAccount;
            res.selaccount = { visible: this.model.noAccount };
            res.noacc_btn = { visible: !this.model.noAccount };
            res.dest_amount_row.visible = false;
            res.dest_amount_left.visible = false;
            res.exchange_row.visible = false;
            res.exch_left.visible = false;

            res.src_amount_row.label = 'Amount';

            if (this.model.debtType) {
                res.person = {
                    tile: {
                        name: this.model.person.name,
                        balance: this.model.srcAccount.fmtBalance,
                        visible: true,
                    },
                };
                res.src_res_balance_left.value = this.model.fmtSrcResBal;

                res.result_balance_row.label = 'Result balance (Person)';
                res.result_balance_dest_row.label = 'Result balance (Account)';

                // Check initial state
                res.dest_res_balance_left.value = this.model.fmtDestResBal;

                if (!this.model.noAccount) {
                    res.account = {
                        tile: {
                            name: this.model.destAccount.name,
                            balance: this.model.destAccount.fmtBalance,
                            visible: true,
                        },
                    };
                }
            } else {
                res.person = {
                    tile: {
                        name: this.model.person.name,
                        balance: this.model.destAccount.fmtBalance,
                        visible: true,
                    },
                };
                res.dest_res_balance_left.value = this.model.fmtDestResBal;

                res.result_balance_row.label = 'Result balance (Account)';
                res.result_balance_dest_row.label = 'Result balance (Person)';

                // Check initial state
                res.src_res_balance_left.value = this.model.fmtSrcResBal;

                if (!this.model.noAccount) {
                    res.account = {
                        tile: {
                            name: this.model.srcAccount.name,
                            balance: this.model.srcAccount.fmtBalance,
                            visible: true,
                        },
                    };
                }
            }

            if (newState === 0 || newState === 3) {
                res.src_amount_row.visible = true;
                res.src_amount_left.visible = false;
                res.result_balance_row.visible = false;
                res.src_res_balance_left.visible = true;
                res.result_balance_dest_row.visible = false;
                res.dest_res_balance_left.visible = true;
            } else if (newState === 1 || newState === 5) {
                res.src_amount_row.visible = false;
                res.src_amount_left.visible = true;
                res.result_balance_row.visible = true;
                res.src_res_balance_left.visible = false;
                res.result_balance_dest_row.visible = false;
                res.dest_res_balance_left.visible = true;
            } else if (newState === 2 || newState === 4) {
                res.src_amount_row.visible = false;
                res.src_amount_left.visible = true;
                res.result_balance_row.visible = false;
                res.src_res_balance_left.visible = true;
                res.result_balance_dest_row.visible = true;
                res.dest_res_balance_left.visible = false;
            } else if (newState === 6) {
                res.src_amount_row.visible = true;
                res.src_amount_left.visible = false;
                res.result_balance_row.visible = false;
                res.src_res_balance_left.visible = true;
                res.result_balance_dest_row.visible = false;
                res.dest_res_balance_left.visible = false;
            } else if (newState === 7) {
                res.src_amount_row.visible = true;
                res.src_amount_left.visible = false;
                res.result_balance_row.visible = false;
                res.src_res_balance_left.visible = false;
                res.result_balance_dest_row.visible = false;
                res.dest_res_balance_left.visible = true;
            } else if (newState === 8) {
                res.src_amount_row.visible = false;
                res.src_amount_left.visible = true;
                res.result_balance_row.visible = false;
                res.src_res_balance_left.visible = false;
                res.result_balance_dest_row.visible = true;
                res.dest_res_balance_left.visible = false;
            } else if (newState === 9) {
                res.src_amount_row.visible = false;
                res.src_amount_left.visible = true;
                res.result_balance_row.visible = true;
                res.src_res_balance_left.visible = false;
                res.result_balance_dest_row.visible = false;
                res.dest_res_balance_left.visible = false;
            }
        }

        this.expectedState = res;

        return res;
    }

    /**
     * Set source amount value
     * @param {number|string} val - new source amount value
     */
    setSrcAmount(val) {
        this.model.srcAmount = val;
        const newValue = isValidValue(val) ? normalize(val) : val;
        if (this.model.fSrcAmount === newValue) {
            return;
        }

        this.model.fSrcAmount = newValue;

        if (this.model.type === EXPENSE || this.model.type === TRANSFER) {
            const srcRes = this.model.srcAccount.balance - newValue;
            this.model.srcResBal = normalize(srcRes);
            this.model.fmtSrcResBal = this.model.srcCurr.format(srcRes);
        } else if (this.model.type === DEBT) {
            if (this.model.srcAccount && !this.model.noAccount) {
                const srcRes = this.model.srcAccount.balance - newValue;
                this.model.srcResBal = normalize(srcRes);
            } else if (this.model.noAccount) {
                if (this.model.debtType) {
                    const srcRes = this.model.personAccount.balance - newValue;
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
        this.model.destAmount = val;
        const newValue = isValidValue(val) ? normalize(val) : val;
        if (this.model.fDestAmount === newValue) {
            return;
        }

        this.model.fDestAmount = newValue;

        if (this.model.type === INCOME || this.model.type === TRANSFER) {
            const destRes = this.model.destAccount.balance + newValue;
            this.model.destResBal = normalize(destRes);
            this.model.fmtDestResBal = this.model.destCurr.format(destRes);
        } else if (this.model.type === DEBT) {
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

        if (!this.content.delete_warning?.content?.visible) {
            throw new Error('Delete transaction warning popup not appear');
        }
        if (!this.content.delete_warning.content.okBtn) {
            throw new Error('OK button not found');
        }

        await navigation(() => click(this.content.delete_warning.content.okBtn));
    }

    async submit() {
        const action = () => click(this.content.submitBtn);

        if (await this.isValid()) {
            await navigation(action);
        } else {
            await this.performAction(action);
        }
    }

    async cancel() {
        await navigation(() => click(this.content.cancelBtn));
    }

    async changeSrcAccount(val) {
        const newAcc = App.state.accounts.getItem(val);
        if (!this.model.srcAccount || !newAcc || newAcc.id === this.model.srcAccount.id) {
            return true;
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

        // Copy source currency to destination currency if needed
        // Transition 1 or 12
        if (this.model.type === EXPENSE && (this.model.state === 0 || this.model.state === 1)) {
            this.model.dest_curr_id = this.model.src_curr_id;
            this.model.destCurr = this.model.srcCurr;
        }

        if (this.model.type === TRANSFER && newAcc.id === this.model.destAccount.id) {
            this.setNextDestAccount(newAcc.id);
        }

        // Update exchange rate
        this.calcExchByAmounts();
        this.updateExch();

        this.model.isDiffCurr = (this.model.src_curr_id !== this.model.dest_curr_id);

        if (this.model.type === EXPENSE) {
            if (this.model.isDiffCurr) {
                const sameStates = [2, 3, 4]; // Transition 5, 17 or 10
                if (!sameStates.includes(this.model.state)) {
                    throw new Error(`Unexpected state ${this.model.state} with different currencies`);
                }
            } else if (!this.model.isDiffCurr) {
                const sameStates = [0, 1]; // Transition 1 or 12

                if (this.model.state === 2 || this.model.state === 3) {
                    this.setDestAmount(this.model.srcAmount);
                    this.model.state = 0; // Transition 14 or 15
                } else if (this.model.state === 4) {
                    this.setDestAmount(this.model.srcAmount);
                    this.model.state = 1; // Transition 11
                } else if (!sameStates.includes(this.model.state)) {
                    throw new Error(`changeSrcAccount(): Unexpected state ${this.model.state} with same currencies`);
                }
            }
        } else if (this.model.type === TRANSFER) {
            if (this.model.isDiffCurr) {
                const sameStates = [3, 4, 5, 6, 7, 8]; // Transition 43, 36, 26, 49, 51 or 57

                if (this.model.state === 0) {
                    this.model.state = 3; // Transition 6
                } else if (this.model.state === 1) {
                    this.model.state = 4; // Transition 12
                } else if (this.model.state === 2) {
                    this.model.state = 5; // Transition 16
                } else if (!sameStates.includes(this.model.state)) {
                    throw new Error(`changeSrcAccount(): Unexpected state ${this.model.state} with different currencies`);
                }
            } else {
                const sameStates = [0, 1, 2]; // Transition 5, 11 or 15
                const srcResStates = [4, 6, 8]; // States with visible source result

                if (this.model.fSrcAmount !== this.model.fDestAmount) {
                    this.setDestAmount(this.model.fSrcAmount);
                }

                if (this.model.state === 3 || this.model.state === 7) {
                    this.model.state = 0; // Transition 3 or 58
                } else if (srcResStates.includes(this.model.state)) {
                    this.model.state = 1; // Transition 37, 50 or 52
                } else if (this.model.state === 5) {
                    this.model.state = 2; // Transition 27
                } else if (!sameStates.includes(this.model.state)) {
                    throw new Error(`changeSrcAccount(): Unexpected state ${this.model.state} with same currencies`);
                }
            }
        } else {
            throw new Error('Unexpected action: can\'t change source account');
        }

        this.setExpectedState(this.model.state);

        await this.performAction(() => this.content.source.selectAccount(val));

        return this.checkState();
    }

    async changeSrcAccountByPos(pos) {
        return this.changeSrcAccount(this.content.source.content.dropDown.content.items[pos].id);
    }

    async changeDestAccount(val) {
        const availTypes = [INCOME, TRANSFER];
        if (!availTypes.includes(this.model.type)) {
            throw new Error('Unexpected action: can\'t change destination account');
        }

        const newAcc = App.state.accounts.getItem(val);
        if (!this.model.destAccount || !newAcc || newAcc.id === this.model.destAccount.id) {
            return true;
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

        // Copy destination currency to source currency if needed
        // Transition 1 or 23
        if (this.model.type === INCOME && !this.model.isDiffCurr) {
            this.model.src_curr_id = this.model.dest_curr_id;
            this.model.srcCurr = this.model.destCurr;
        }
        // Change source account if same
        if (this.model.type === TRANSFER && newAcc.id === this.model.srcAccount.id) {
            this.setNextSourceAccount(newAcc.id);
        }

        // Update exchange rate
        this.calcExchByAmounts();
        this.updateExch();
        this.model.isDiffCurr = (this.model.src_curr_id !== this.model.dest_curr_id);

        if (this.model.type === INCOME) {
            if (this.model.isDiffCurr) {
                const sameStates = [2, 3, 4]; // Transition 5, 11 or 17
                if (!sameStates.includes(this.model.state)) {
                    throw new Error(`Unexpected state ${this.model.state} with different currencies`);
                }
            } else if (!this.model.isDiffCurr) {
                const sameStates = [0, 1]; // Transition 1 or 23
                if (this.model.state === 2 || this.model.state === 3) {
                    this.setSrcAmount(this.model.destAmount);
                    this.model.state = 0; // Transition 6 or 12
                } else if (this.model.state === 4) {
                    this.setSrcAmount(this.model.destAmount);
                    this.model.state = 1; // Transition 18
                } else if (!sameStates.includes(this.model.state)) {
                    throw new Error(`changeDestAccount(): Unexpected state ${this.model.state} with different currencies`);
                }
            }
        } else if (this.model.type === TRANSFER) {
            if (this.model.isDiffCurr) {
                const sameStates = [3, 4, 5, 6, 7, 8]; // Transition 41, 38, 28, 47, 59 or 53

                if (this.model.state === 0) {
                    this.model.state = 3; // Transition 8
                } else if (this.model.state === 1) {
                    this.model.state = 4; // Transition 14
                } else if (this.model.state === 2) {
                    this.model.state = 5; // Transition 18
                } else if (!sameStates.includes(this.model.state)) {
                    throw new Error(`changeDestAccount(): Unexpected state ${this.model.state} with different currencies`);
                }
            } else {
                const sameStates = [0, 1, 2]; // Transition 7, 13 or 17

                if (this.model.fSrcAmount !== this.model.fDestAmount) {
                    this.setDestAmount(this.model, this.model.fSrcAmount);
                }

                if (this.model.state === 3 || this.model.state === 7) {
                    this.model.state = 0; // Transition 42 or 60
                } else if (this.model.state === 4 || this.model.state === 8) {
                    this.model.state = 1; // Transition 39 or 54
                } else if (this.model.state === 5 || this.model.state === 6) {
                    this.model.state = 2; // Transition 29 or 48
                } else if (!sameStates.includes(this.model.state)) {
                    throw new Error(`changeDestAccount(): Unexpected state ${this.model.state} with same currencies`);
                }
            }
        }

        this.setExpectedState(this.model.state);

        await this.performAction(() => this.content.destination.selectAccount(val));

        return this.checkState();
    }

    async changeDestAccountByPos(pos) {
        return this.changeDestAccount(
            this.content.destination.content.dropDown.content.items[pos].id,
        );
    }

    async inputSrcAmount(val) {
        if (this.model.type === EXPENSE && !this.model.isDiffCurr) {
            throw new Error(`Wrong state: can't input source amount on state ${this.model.state}`);
        }
        const trAvailStates = [0, 3, 4, 7];
        if (this.model.type === TRANSFER && !trAvailStates.includes(this.model.state)) {
            throw new Error(`Unexpected state ${this.model.state} to input source amount`);
        }

        this.model.srcAmount = val;
        const fNewValue = (isValidValue(val)) ? normalize(val) : val;
        if (this.model.fSrcAmount !== fNewValue) {
            this.setSrcAmount(val);

            if (this.model.isDiffCurr) {
                this.calcExchByAmounts();
                this.updateExch();
            } else {
                this.setDestAmount(this.model.fSrcAmount);
            }
        }

        this.setExpectedState(this.model.state);

        await this.performAction(() => this.content.src_amount_row.input(val));

        return this.checkState();
    }

    async clickSrcAmount() {
        if (this.model.type === EXPENSE) {
            throw new Error('Unexpected action: can\'t click by source amount');
        }

        if (this.model.type === INCOME) {
            if (this.model.state === 1) {
                this.setExpectedState(0); // Transition 4
            } else {
                throw new Error(`Unexpected state ${this.model.state} for clickSrcAmount action`);
            }
        } else if (this.model.type === TRANSFER) {
            if (this.model.state === 1 || this.model.state === 2) {
                this.setExpectedState(0); // Transition 2 or 4
            } else if (this.model.state === 4) {
                this.setExpectedState(3); // Transition 30
            } else if (this.model.state === 6) {
                this.setExpectedState(5); // Transition 20
            } else if (this.model.state === 8) {
                this.setExpectedState(7); // Transition 23
            } else {
                throw new Error(`Unexpected state ${this.model.state} for clickSrcAmount action`);
            }
        } else if (this.model.type === DEBT) {
            if (this.model.state === 1 || this.model.state === 2) {
                this.setExpectedState(0); // Transition 2 or 4
            } else if (this.model.state === 4 || this.model.state === 5) {
                this.setExpectedState(3); // Transition 30 or 12
            } else if (this.model.state === 8) {
                this.setExpectedState(7); // Transition 31
            } else if (this.model.state === 9) {
                this.setExpectedState(6); // Transition 35
            } else {
                throw new Error(`Unexpected state ${this.model.state} for clickSrcAmount action`);
            }
        }

        await this.performAction(() => this.content.src_amount_left.click());

        return this.checkState();
    }

    async inputDestAmount(val) {
        if (this.model.type === DEBT) {
            throw new Error('Unexpected action: can\'t input destination amount');
        }
        const trAvailStates = [3, 4];
        if (this.model.type === TRANSFER && !trAvailStates.includes(this.model.state)) {
            throw new Error(`Unexpected state ${this.model.state} to input destination amount`);
        }

        const fNewValue = (isValidValue(val)) ? normalize(val) : val;
        this.model.destAmount = val;
        if (this.model.fDestAmount !== fNewValue) {
            this.setDestAmount(val);

            if (this.model.isDiffCurr) {
                this.calcExchByAmounts();
                this.updateExch();
            } else {
                this.setSrcAmount(this.model.fDestAmount);
            }
        }

        this.setExpectedState(this.model.state);

        await this.performAction(() => this.content.dest_amount_row.input(val));

        return this.checkState();
    }

    async clickSrcResultBalance() {
        if (this.model.type === INCOME) {
            throw new Error('Unexpected action: can\'t click by source result balance');
        }

        if (this.model.type === EXPENSE) {
            if (this.model.state === 0) {
                this.setExpectedState(1);
            } else if (this.model.state === 2 || this.model.state === 3) {
                this.setExpectedState(4);
            } else {
                throw new Error('Unexpected state');
            }
        } else if (this.model.type === TRANSFER) {
            if (this.model.state === 0 || this.model.state === 2) {
                this.setExpectedState(1); // Transition 1 or 10
            } else if (this.model.state === 3) {
                this.setExpectedState(4); // Transition 31
            } else if (this.model.state === 5) {
                this.setExpectedState(6); // Transition 19
            } else if (this.model.state === 7) {
                this.setExpectedState(8); // Transition 22
            } else {
                throw new Error('Unexpected state');
            }
        } else if (this.model.type === DEBT) {
            if (this.model.state === 0 || this.model.state === 2) {
                this.setExpectedState(1); // Transition 1 or 4
            } else if (this.model.state === 3 || this.model.state === 4) {
                this.setExpectedState(5); // Transition 13 or 11
            } else if (this.model.state === 6) {
                this.setExpectedState(9); // Transition 36
            } else {
                throw new Error('Unexpected state');
            }
        }

        await this.performAction(() => this.content.src_res_balance_left.click());

        return this.checkState();
    }

    async clickDestResultBalance() {
        if (this.model.type === EXPENSE) {
            throw new Error('Unexpected action: can\'t click by destination result balance');
        }

        if (this.model.type === INCOME) {
            if (this.model.state === 0) {
                // Transition 2
                this.setExpectedState(1);
            } else if (this.model.state === 2 || this.model.state === 3) {
                // Transition 7 or 14
                this.setExpectedState(4);
            }
        } else if (this.model.type === TRANSFER) {
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
        } else if (this.model.type === DEBT) {
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

        await this.performAction(() => this.content.dest_res_balance_left.click());

        return this.checkState();
    }

    async clickDestAmount() {
        if (this.model.type === DEBT) {
            throw new Error('Unexpected action: can\'t click by destination amount');
        }

        if (this.model.type === EXPENSE) {
            if (this.model.state === 1) { // Transition 3
                this.setExpectedState(0);
            } else if (this.model.state === 3 || this.model.state === 4) { // Transition 16 or 7
                this.setExpectedState(2);
            }
        } else if (this.model.type === INCOME) {
            // Transition 13 or 19
            if (this.model.state === 3 || this.model.state === 4) {
                this.setExpectedState(2);
            } else {
                throw new Error(`Unexpected state ${this.model.state} for clickDestAmount action`);
            }
        } else if (this.model.type === TRANSFER) {
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

        await this.performAction(() => this.content.dest_amount_left.click());

        return this.checkState();
    }

    async inputResBalance(val) {
        if (this.model.type === INCOME) {
            throw new Error('Unexpected action: can\'t input source result balance');
        }

        const fNewValue = isValidValue(val) ? normalize(val) : val;
        this.model.srcResBal = val;
        if (this.model.fSrcResBal !== fNewValue) {
            this.model.fSrcResBal = fNewValue;
            this.model.fmtSrcResBal = this.model.srcCurr.format(this.model.srcResBal);

            const newSrcAmount = normalize(this.model.srcAccount.balance - fNewValue);
            this.model.srcAmount = newSrcAmount;
            this.model.fSrcAmount = newSrcAmount;

            if (this.model.isDiffCurr) {
                this.calcExchByAmounts();
                this.updateExch();
            } else {
                this.setDestAmount(this.model.srcAmount);
            }
        }

        this.setExpectedState(this.model.state);

        await this.performAction(() => this.content.result_balance_row.input(val));

        return this.checkState();
    }

    async inputDestResBalance(val) {
        if (this.model.type === EXPENSE) {
            throw new Error('Unexpected action: can\'t input destination result balance');
        }

        const fNewValue = isValidValue(val) ? normalize(val) : val;
        this.model.destResBal = val;
        const valueChanged = this.model.fDestResBal !== fNewValue;
        if (valueChanged) {
            this.model.fDestResBal = fNewValue;
            this.model.fmtDestResBal = this.model.destCurr.format(this.model.destResBal);

            if (this.model.type === INCOME) {
                const newSrcAmount = normalize(fNewValue - this.model.destAccount.balance);
                this.model.srcAmount = newSrcAmount;
                this.model.fSrcAmount = newSrcAmount;

                if (this.model.isDiffCurr) {
                    this.calcExchByAmounts();
                    this.updateExch();
                } else {
                    this.setDestAmount(this.model.fSrcAmount);
                }
            } else if (this.model.type === TRANSFER) {
                const newDestAmount = normalize(fNewValue - this.model.destAccount.balance);
                this.model.destAmount = newDestAmount;
                this.model.fDestAmount = newDestAmount;

                if (this.model.isDiffCurr) {
                    this.calcExchByAmounts();
                    this.updateExch();
                } else {
                    this.setSrcAmount(this.model.destAmount);
                }
            } else if (this.model.type === DEBT) {
                const newDestAmount = normalize(fNewValue - this.model.destAccount.balance);
                this.model.destAmount = newDestAmount;
                this.model.fDestAmount = newDestAmount;

                this.setSrcAmount(this.model.destAmount);
            }
        }

        this.setExpectedState(this.model.state);

        await this.performAction(() => this.content.result_balance_dest_row.input(val));

        return this.checkState();
    }

    async changeSourceCurrency(val) {
        if (this.model.type !== INCOME) {
            throw new Error('Unexpected action: can\'t change source currency');
        }

        if (this.model.src_curr_id === val) {
            return true;
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

        await this.performAction(() => this.content.src_amount_row.selectCurr(val));

        return this.checkState();
    }

    async changeDestCurrency(val) {
        if (this.model.type !== EXPENSE) {
            throw new Error('Unexpected action: can\'t change destination currency');
        }

        if (this.model.dest_curr_id === val) {
            return true;
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

        await this.performAction(() => this.content.dest_amount_row.selectCurr(val));

        return this.checkState();
    }

    async clickExchRate() {
        if (this.model.type === EXPENSE || this.model.type === INCOME) {
            this.setExpectedState(3);
        } else if (this.model.type === TRANSFER) {
            if (this.model.state === 3 || this.model.state === 5) {
                // Transition 40 or 21
                this.setExpectedState(7);
            } else if (this.model.state === 4 || this.model.state === 6) {
                // Transition 34 or 45
                this.setExpectedState(8);
            }
        } else {
            throw new Error('Unexpected action: can\'t click by exchange rate');
        }

        await this.performAction(() => this.content.exch_left.click());

        return this.checkState();
    }

    async inputExchRate(val) {
        if (this.model.type === DEBT) {
            throw new Error('Unexpected action: can\'t input exchange rate');
        }
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

        this.setExpectedState(this.model.state);

        await this.performAction(() => this.content.exchange_row.input(val));

        return this.checkState();
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
        return this.changePerson(this.content.person.content.dropDown.content.items[pos].id);
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
        await this.performAction(() => click(opTypeCheck));

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
        return this.changeAccount(this.content.account.content.dropDown.content.items[pos].id);
    }
}
