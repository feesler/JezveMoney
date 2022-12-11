import {
    assert,
    url,
    query,
    prop,
    navigation,
    click,
    asyncMap,
} from 'jezve-test';
import { DropDown, IconButton } from 'jezvejs-test';
import { AppView } from './AppView.js';
import {
    convDate,
    correct,
    correctExch,
    normalize,
    isValidValue,
    normalizeExch,
    trimToDigitsLimit,
    EXCHANGE_DIGITS,
    CENTS_DIGITS,
} from '../common.js';
import { TransactionTypeMenu } from './component/LinkMenu/TransactionTypeMenu.js';
import { InputRow } from './component/InputRow.js';
import { WarningPopup } from './component/WarningPopup.js';
import { DatePickerRow } from './component/DatePickerRow.js';
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
import { App } from '../Application.js';

const infoItemSelectors = [
    '#src_amount_left',
    '#dest_amount_left',
    '#src_res_balance_left',
    '#dest_res_balance_left',
    '#exch_left',
];
const inputRowSelectors = [
    '#src_amount_row',
    '#dest_amount_row',
    '#exchange',
    '#result_balance',
    '#result_balance_dest',
    '#comment_row',
];

/** Create or update transaction view class */
export class TransactionView extends AppView {
    async parseContent() {
        const res = {};

        res.isUpdate = (await url()).includes('/update/');

        if (res.isUpdate) {
            const hiddenEl = await query('input[name="id"]');
            assert(hiddenEl, 'Transaction id field not found');

            res.id = parseInt(await prop(hiddenEl, 'value'), 10);
            assert(res.id, 'Wrong transaction id');
        }

        res.heading = { elem: await query('.heading > h1') };
        if (res.heading.elem) {
            res.heading.title = await prop(res.heading.elem, 'textContent');
        }

        res.delBtn = await IconButton.create(this, await query('#del_btn'));

        res.typeMenu = await TransactionTypeMenu.create(this, await query('.trtype-menu'));
        assert(!res.typeMenu.multi, 'Invalid transaction type menu');

        res.notAvailMsg = { elem: await query('#notavailmsg') };
        assert(res.notAvailMsg.elem, 'No available transaction message element not found');
        res.notAvailMsg.message = await prop(res.notAvailMsg.elem, 'textContent');

        res.person = await TileBlock.create(this, await query('#person'));
        if (res.person) {
            const personIdInp = await query('#person_id');
            res.person.content.id = parseInt(await prop(personIdInp, 'value'), 10);
        }

        const debtOperationInp = await query('#debtOperation');
        res.debtOperation = parseInt(await prop(debtOperationInp, 'value'), 10);

        const accountBlock = await query('#debtaccount');
        res.account = await TileBlock.create(this, accountBlock);
        const accountIdInp = await query('#acc_id');
        res.account.content.id = parseInt(await prop(accountIdInp, 'value'), 10);

        res.selaccount = await Button.create(this, await query(accountBlock, '.account-toggler'));
        assert(res.selaccount, 'Select account button not found');

        res.swapBtn = { elem: await query('#swapBtn') };
        assert(res.swapBtn.elem, 'Swap button not found');

        res.noacc_btn = { elem: await query(accountBlock, '.close-btn') };
        assert(res.noacc_btn.elem, 'Disable account button not found');
        res.noAccountsMsg = { elem: await query(accountBlock, '.nodata-message') };
        assert(res.noAccountsMsg.elem, 'No accounts message element not found');

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

        [
            res.src_amount_left,
            res.dest_amount_left,
            res.src_res_balance_left,
            res.dest_res_balance_left,
            res.exch_left,
        ] = await asyncMap(
            infoItemSelectors,
            async (selector) => TileInfoItem.create(this, await query(selector)),
        );

        [
            res.src_amount_row,
            res.dest_amount_row,
            res.exchange_row,
            res.result_balance_row,
            res.result_balance_dest_row,
            res.comment_row,
        ] = await asyncMap(
            inputRowSelectors,
            async (selector) => InputRow.create(this, await query(selector)),
        );

        res.datePicker = await DatePickerRow.create(this, await query('#date_row'));

        res.categorySelect = await DropDown.createFromChild(this, await query('#category'));

        res.submitBtn = await query('#submitBtn');
        assert(res.submitBtn, 'Submit button not found');
        res.cancelBtn = await query('#cancelBtn');
        assert(res.cancelBtn, 'Cancel button not found');

        res.delete_warning = await WarningPopup.create(this, await query('#delete_warning'));

        return res;
    }

    buildModel(cont) {
        const res = this.model;

        res.type = cont.typeMenu.value;
        assert(availTransTypes.includes(res.type), 'Invalid type selected');

        res.isAvailable = !cont.notAvailMsg.visible;

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

        res.srcCurr = App.currency.getItem(res.src_curr_id);
        res.destCurr = App.currency.getItem(res.dest_curr_id);
        if (res.isAvailable) {
            assert(res.srcCurr, 'Source currency not found');
            assert(res.destCurr, 'Destination currency not found');
        }
        res.isDiffCurr = (res.src_curr_id !== res.dest_curr_id);

        res.srcAmount = cont.src_amount_row.value;
        res.fSrcAmount = isValidValue(res.srcAmount) ? normalize(res.srcAmount) : res.srcAmount;

        res.destAmount = cont.dest_amount_row.value;
        res.fDestAmount = isValidValue(res.destAmount) ? normalize(res.destAmount) : res.destAmount;

        res.srcResBal = cont.result_balance_row.value;
        res.fSrcResBal = isValidValue(res.srcResBal) ? normalize(res.srcResBal) : res.srcResBal;

        res.destResBal = cont.result_balance_dest_row.value;
        res.fDestResBal = isValidValue(res.destResBal) ? normalize(res.destResBal) : res.destResBal;

        if (res.isAvailable) {
            res.exchSign = `${res.destCurr.sign}/${res.srcCurr.sign}`;
            res.backExchSign = `${res.srcCurr.sign}/${res.destCurr.sign}`;

            res.useBackExchange = (res.isDiffCurr)
                ? (cont.exchange_row.currSign === res.backExchSign)
                : false;

            if (res.useBackExchange) {
                res.backExchRate = cont.exchange_row.value;
                res.exchRate = this.calcExchange(res);
            } else {
                res.exchRate = cont.exchange_row.value;
                res.backExchRate = this.calcBackExchange(res);
            }

            this.updateExch();
        }

        if (res.type === EXPENSE) {
            if (res.isAvailable) {
                assert(res.srcAccount, 'Source account not found');
            }

            const isResBalRowVisible = cont.result_balance_row?.content?.visible;
            const exchRowVisible = cont.exchange_row?.content?.visible;

            if (!res.isAvailable) {
                res.state = -1;
            } else if (res.isDiffCurr) {
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
            if (res.isAvailable) {
                assert(res.destAccount, 'Destination account not found');
            }

            const destResRowVisible = cont.result_balance_dest_row?.content?.visible;
            const exchRowVisible = cont.exchange_row?.content?.visible;

            if (!res.isAvailable) {
                res.state = -1;
            } else if (res.isDiffCurr) {
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
            if (res.isAvailable) {
                assert(res.srcAccount, 'Source account not found');
                assert(res.destAccount, 'Destination account not found');
            }

            const srcAmountRowVisible = cont.src_amount_row?.content?.visible;
            const destAmountRowVisible = cont.dest_amount_row?.content?.visible;
            const srcResRowVisible = cont.result_balance_row?.content?.visible;
            const destResRowVisible = cont.result_balance_dest_row?.content?.visible;
            const exchRowVisible = cont.exchange_row?.content?.visible;

            if (!res.isAvailable) {
                res.state = -1;
            } else if (res.isDiffCurr) {
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
            if (res.isAvailable) {
                assert(res.person, 'Person not found');
            }

            res.debtType = cont.debtOperation === 1;

            assert(!res.isDiffCurr, 'Source and destination currencies are not the same');

            const personAccountCurr = (res.debtType) ? res.src_curr_id : res.dest_curr_id;
            res.personAccount = this.getPersonAccount(res.person?.id, personAccountCurr);

            const isSelectAccountVisible = cont.selaccount?.content?.visible;
            res.noAccount = isSelectAccountVisible || cont.noAccountsMsg.visible;

            res.account = App.state.accounts.getItem(cont.account.content.id);
            if (res.isAvailable && !res.noAccount) {
                assert(res.account, 'Account not found');
            }
            assert(
                !(
                    !res.noAccount
                    && res.account
                    && res.account.curr_id !== ((res.debtType) ? res.src_curr_id : res.dest_curr_id)
                ),
                'Wrong currency of account',
            );

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

            assert(res.fSrcAmount === res.fDestAmount, 'Source and destination amount are different');

            const srcAmountRowVisible = cont.src_amount_row?.content?.visible;
            const srcResRowVisible = cont.result_balance_row?.content?.visible;
            const destResRowVisible = cont.result_balance_dest_row?.content?.visible;

            if (!res.isAvailable) {
                res.state = -1;
            } else if (res.noAccount) {
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

        if (res.isAvailable && res.srcAccount) {
            assert(
                res.srcAccount.curr_id === res.src_curr_id,
                `Unexpected destination currency ${res.dest_curr_id}(${res.srcAccount.curr_id} is expected)`,
            );
        }
        if (res.isAvailable && res.destAccount) {
            assert(
                res.destAccount.curr_id === res.dest_curr_id,
                `Unexpected destination currency ${res.dest_curr_id}(${res.destAccount.curr_id} is expected)`,
            );
        }

        res.date = cont.datePicker.value;
        res.categoryId = parseInt(cont.categorySelect.value, 10);
        res.comment = cont.comment_row.value;

        return res;
    }

    isValid() {
        if (this.content.src_amount_row?.content?.visible) {
            if (this.model.fSrcAmount <= 0) {
                return false;
            }
        }

        if (this.content.dest_amount_row?.content?.visible) {
            if (this.model.fDestAmount <= 0) {
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
        res.category_id = this.model.categoryId;
        res.comment = this.model.comment;

        return res;
    }

    getExpectedState() {
        const state = parseInt(this.model.state, 10);
        assert(!Number.isNaN(state), 'Invalid state specified');

        const res = {
            typeMenu: { value: this.model.type },
            person: {
                tile: {},
                visible: this.model.isAvailable && this.model.type === DEBT,
            },
            account: {
                tile: {
                    visible: (
                        this.model.isAvailable
                        && this.model.type === DEBT
                        && !this.model.noAccount
                    ),
                },
                visible: this.model.isAvailable && this.model.type === DEBT,
            },
            source: {
                visible: (
                    this.model.isAvailable
                    && (this.model.type === EXPENSE || this.model.type === TRANSFER)
                ),
            },
            destination: {
                visible: (
                    this.model.isAvailable
                    && (this.model.type === INCOME || this.model.type === TRANSFER)
                ),
            },
            swapBtn: {
                visible: (
                    this.model.isAvailable
                    && (this.model.type === TRANSFER || this.model.type === DEBT)
                ),
            },
            src_amount_row: {},
            dest_amount_row: {},
            result_balance_row: {},
            result_balance_dest_row: {},
            exchange_row: {},
            src_amount_left: {},
            dest_amount_left: {},
            src_res_balance_left: {},
            dest_res_balance_left: {},
            exch_left: {},
        };

        if (this.model.isUpdate) {
            res.delBtn = {
                title: 'Delete',
                visible: true,
            };
        }

        if (this.model.isAvailable) {
            res.src_amount_row.value = this.model.srcAmount.toString();
            res.src_amount_row.currSign = (this.model.srcCurr) ? this.model.srcCurr.sign : '';
            res.src_amount_row.isCurrActive = (this.model.type === INCOME);

            res.dest_amount_row.value = this.model.destAmount.toString();
            res.dest_amount_row.currSign = (this.model.destCurr) ? this.model.destCurr.sign : '';
            res.dest_amount_row.isCurrActive = (this.model.type === EXPENSE);

            if (this.model.destCurr && this.model.srcCurr) {
                const exchRateValue = (this.model.useBackExchange)
                    ? this.model.backExchRate
                    : this.model.exchRate;
                const exchSign = (this.model.useBackExchange)
                    ? this.model.backExchSign
                    : this.model.exchSign;

                res.exchange_row.value = exchRateValue.toString();
                res.exchange_row.currSign = exchSign;
                res.exch_left.value = this.model.fmtExch;
            }

            res.datePicker = {
                visible: true,
                value: this.model.date,
            };
            res.categorySelect = {
                visible: true,
                value: this.model.categoryId.toString(),
            };
            res.comment_row = {
                visible: true,
                value: this.model.comment,
            };
        }

        if (this.model.type === EXPENSE || this.model.type === TRANSFER) {
            res.source.tile = {
                visible: this.model.isAvailable,
            };

            if (this.model.isAvailable) {
                res.source.tile.title = (this.model.srcAccount) ? this.model.srcAccount.name : '';
                res.source.tile.subtitle = (this.model.srcAccount)
                    ? this.model.srcCurr.format(this.model.srcAccount.balance)
                    : '';
            }
        }

        if (this.model.type === INCOME || this.model.type === TRANSFER) {
            res.destination.tile = {
                visible: this.model.isAvailable,
            };

            if (this.model.isAvailable) {
                res.destination.tile.title = (this.model.destAccount) ? this.model.destAccount.name : '';
                res.destination.tile.subtitle = (this.model.destAccount)
                    ? this.model.destCurr.format(this.model.destAccount.balance)
                    : '';
            }
        }

        if (this.model.type !== INCOME && this.model.isAvailable) {
            res.result_balance_row.value = this.model.srcResBal.toString();
            res.result_balance_row.isCurrActive = false;

            res.src_res_balance_left.value = (this.model.srcCurr)
                ? this.model.srcCurr.format(this.model.fSrcResBal)
                : '';
        }

        if (this.model.type !== EXPENSE && this.model.isAvailable) {
            res.src_amount_left.value = (this.model.srcCurr) ? this.model.srcCurr.format(this.model.fSrcAmount) : '';
            res.result_balance_dest_row.value = this.model.destResBal.toString();
            res.result_balance_dest_row.isCurrActive = false;

            res.dest_res_balance_left.value = (this.model.destCurr)
                ? this.model.destCurr.format(this.model.fDestResBal)
                : '';
        }
        if (this.model.type !== DEBT && this.model.isAvailable) {
            res.dest_amount_left.value = (this.model.destCurr) ? this.model.destCurr.format(this.model.fDestAmount) : '';
        }

        if (this.model.type === EXPENSE) {
            assert(state >= -1 && state <= 4, 'Invalid state specified');

            if (this.model.isAvailable) {
                if (state === 0 || state === 1) {
                    res.src_amount_row.label = 'Amount';
                    res.dest_amount_row.label = 'Amount';
                } else {
                    res.src_amount_row.label = 'Source amount';
                    res.dest_amount_row.label = 'Destination amount';
                }

                res.result_balance_row.label = 'Result balance';
            }

            res.src_amount_left.visible = false;
            res.dest_res_balance_left.visible = false;
            res.result_balance_dest_row.visible = false;

            if (state === -1) {
                res.dest_amount_left.visible = false;
                res.src_res_balance_left.visible = false;
                res.exch_left.visible = false;
                res.src_amount_row.visible = false;
                res.dest_amount_row.visible = false;
                res.exchange_row.visible = false;
                res.result_balance_row.visible = false;
            } else if (state === 0) {
                res.dest_amount_left.visible = false;
                res.src_res_balance_left.visible = true;
                res.exch_left.visible = false;
                res.src_amount_row.visible = false;
                res.dest_amount_row.visible = true;
                res.exchange_row.visible = false;
                res.result_balance_row.visible = false;
            } else if (state === 1) {
                res.dest_amount_left.visible = true;
                res.src_res_balance_left.visible = false;
                res.exch_left.visible = false;
                res.src_amount_row.visible = false;
                res.dest_amount_row.visible = false;
                res.exchange_row.visible = false;
                res.result_balance_row.visible = true;
            } else if (state === 2) {
                res.dest_amount_left.visible = false;
                res.src_res_balance_left.visible = true;
                res.exch_left.visible = true;
                res.src_amount_row.visible = true;
                res.dest_amount_row.visible = true;
                res.exchange_row.visible = false;
                res.result_balance_row.visible = false;
            } else if (state === 3) {
                res.dest_amount_left.visible = true;
                res.src_res_balance_left.visible = true;
                res.exch_left.visible = false;
                res.src_amount_row.visible = true;
                res.dest_amount_row.visible = false;
                res.exchange_row.visible = true;
                res.result_balance_row.visible = false;
            } else if (state === 4) {
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
            assert(state >= -1 && state <= 4, 'Invalid state specified');

            if (this.model.isAvailable) {
                res.result_balance_dest_row.label = 'Result balance';

                if (state === 0 || state === 1) {
                    res.src_amount_row.label = 'Amount';
                    res.dest_amount_row.label = 'Amount';
                } else {
                    res.src_amount_row.label = 'Source amount';
                    res.dest_amount_row.label = 'Destination amount';
                }
            }

            res.dest_res_balance_left.visible = false;
            res.result_balance_dest_row.visible = false;

            if (state === -1) {
                res.src_amount_left.visible = false;
                res.dest_amount_left.visible = false;
                res.dest_res_balance_left.visible = false;
                res.exch_left.visible = false;
                res.src_amount_row.visible = false;
                res.dest_amount_row.visible = false;
                res.result_balance_dest_row.visible = false;
                res.exchange_row.visible = false;
            } else if (state === 0) {
                res.src_amount_left.visible = false;
                res.dest_amount_left.visible = false;
                res.dest_res_balance_left.visible = true;
                res.exch_left.visible = false;
                res.src_amount_row.visible = true;
                res.dest_amount_row.visible = false;
                res.result_balance_dest_row.visible = false;
                res.exchange_row.visible = false;
            } else if (state === 1) {
                res.src_amount_left.visible = true;
                res.dest_amount_left.visible = false;
                res.dest_res_balance_left.visible = false;
                res.exch_left.visible = false;
                res.src_amount_row.visible = false;
                res.dest_amount_row.visible = false;
                res.result_balance_dest_row.visible = true;
                res.exchange_row.visible = false;
            } else if (state === 2) {
                res.src_amount_left.visible = false;
                res.dest_amount_left.visible = false;
                res.dest_res_balance_left.visible = true;
                res.exch_left.visible = true;
                res.src_amount_row.visible = true;
                res.dest_amount_row.visible = true;
                res.exchange_row.visible = false;
                res.result_balance_dest_row.visible = false;
            } else if (state === 3) {
                res.src_amount_left.visible = false;
                res.dest_amount_left.visible = true;
                res.dest_res_balance_left.visible = true;
                res.exch_left.visible = false;
                res.src_amount_row.visible = true;
                res.dest_amount_row.visible = false;
                res.exchange_row.visible = true;
                res.result_balance_dest_row.visible = false;
            } else if (state === 4) {
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
            assert(state >= -1 && state <= 8, 'Invalid state specified');

            if (this.model.isAvailable) {
                res.result_balance_row.label = 'Result balance (Source)';
                res.result_balance_dest_row.label = 'Result balance (Destination)';

                if (state === 0 || state === 1 || state === 2) {
                    res.src_amount_row.label = 'Amount';
                    res.dest_amount_row.label = 'Amount';
                } else {
                    res.src_amount_row.label = 'Source amount';
                    res.dest_amount_row.label = 'Destination amount';
                }
            }

            if (state === -1) {
                res.src_amount_left.visible = false;
                res.dest_amount_left.visible = false;
                res.src_res_balance_left.visible = false;
                res.dest_res_balance_left.visible = false;
                res.exch_left.visible = false;
                res.src_amount_row.visible = false;
                res.dest_amount_row.visible = false;
                res.result_balance_row.visible = false;
                res.result_balance_dest_row.visible = false;
                res.exchange_row.visible = false;
            } else if (state === 0) {
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
            } else if (state === 1) {
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
            } else if (state === 2) {
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
            } else if (state === 3) {
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
            } else if (state === 4) {
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
            } else if (state === 5) {
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
            } else if (state === 6) {
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
            } else if (state === 7) {
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
            } else if (state === 8) {
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
            assert(state >= -1 && state <= 9, 'Invalid state specified');

            const { isAvailable, debtType, noAccount } = this.model;
            const userAccounts = App.state.getUserAccounts();
            const accountsAvailable = userAccounts.length > 0;

            res.selaccount = { visible: isAvailable && noAccount && accountsAvailable };
            res.noacc_btn = { visible: isAvailable && !noAccount };
            res.noAccountsMsg = { visible: isAvailable && !accountsAvailable };
            res.dest_amount_row.visible = false;
            res.dest_amount_left.visible = false;
            res.exchange_row.visible = false;
            res.exch_left.visible = false;

            if (isAvailable) {
                res.src_amount_row.label = 'Amount';
                res.result_balance_row.label = (debtType)
                    ? 'Result balance (Person)'
                    : 'Result balance (Account)';
                res.result_balance_dest_row.label = (debtType)
                    ? 'Result balance (Account)'
                    : 'Result balance (Person)';
            }

            if (debtType) {
                if (isAvailable) {
                    res.person.tile.title = (this.model.person) ? this.model.person.name : '';
                    res.person.tile.subtitle = (this.model.srcAccount)
                        ? this.model.srcCurr.format(this.model.srcAccount.balance)
                        : '';
                }

                if (!this.model.noAccount) {
                    if (isAvailable) {
                        res.account.tile.title = (this.model.destAccount) ? this.model.destAccount.name : '';
                        res.account.tile.subtitle = (this.model.destAccount)
                            ? this.model.destCurr.format(this.model.destAccount.balance)
                            : '';
                    }
                }
            } else {
                if (isAvailable) {
                    res.person.tile.title = (this.model.person) ? this.model.person.name : '';
                    res.person.tile.subtitle = (this.model.destAccount)
                        ? this.model.destCurr.format(this.model.destAccount.balance)
                        : '';
                }

                if (!this.model.noAccount) {
                    if (isAvailable) {
                        res.account.tile.title = (this.model.srcAccount) ? this.model.srcAccount.name : '';
                        res.account.tile.subtitle = (this.model.srcAccount)
                            ? this.model.srcCurr.format(this.model.srcAccount.balance)
                            : '';
                    }
                }
            }

            if (state === -1) {
                res.src_amount_row.visible = false;
                res.src_amount_left.visible = false;
                res.result_balance_row.visible = false;
                res.src_res_balance_left.visible = false;
                res.result_balance_dest_row.visible = false;
                res.dest_res_balance_left.visible = false;
            } else if (state === 0 || state === 3) {
                res.src_amount_row.visible = true;
                res.src_amount_left.visible = false;
                res.result_balance_row.visible = false;
                res.src_res_balance_left.visible = true;
                res.result_balance_dest_row.visible = false;
                res.dest_res_balance_left.visible = true;
            } else if (state === 1 || state === 5) {
                res.src_amount_row.visible = false;
                res.src_amount_left.visible = true;
                res.result_balance_row.visible = true;
                res.src_res_balance_left.visible = false;
                res.result_balance_dest_row.visible = false;
                res.dest_res_balance_left.visible = true;
            } else if (state === 2 || state === 4) {
                res.src_amount_row.visible = false;
                res.src_amount_left.visible = true;
                res.result_balance_row.visible = false;
                res.src_res_balance_left.visible = true;
                res.result_balance_dest_row.visible = true;
                res.dest_res_balance_left.visible = false;
            } else if (state === 6) {
                res.src_amount_row.visible = true;
                res.src_amount_left.visible = false;
                res.result_balance_row.visible = false;
                res.src_res_balance_left.visible = true;
                res.result_balance_dest_row.visible = false;
                res.dest_res_balance_left.visible = false;
            } else if (state === 7) {
                res.src_amount_row.visible = true;
                res.src_amount_left.visible = false;
                res.result_balance_row.visible = false;
                res.src_res_balance_left.visible = false;
                res.result_balance_dest_row.visible = false;
                res.dest_res_balance_left.visible = true;
            } else if (state === 8) {
                res.src_amount_row.visible = false;
                res.src_amount_left.visible = true;
                res.result_balance_row.visible = false;
                res.src_res_balance_left.visible = false;
                res.result_balance_dest_row.visible = true;
                res.dest_res_balance_left.visible = false;
            } else if (state === 9) {
                res.src_amount_row.visible = false;
                res.src_amount_left.visible = true;
                res.result_balance_row.visible = true;
                res.src_res_balance_left.visible = false;
                res.result_balance_dest_row.visible = false;
                res.dest_res_balance_left.visible = false;
            }
        }

        return res;
    }

    /**
     * Set source amount value and calculate source result
     * @param {number|string} val - new source amount value
     */
    setSrcAmount(val) {
        this.model.srcAmount = val;
        this.model.fSrcAmount = normalize(val);
        this.calculateSourceResult();
    }

    /**
     * Set destination amount value and destination source result
     * @param {number|string} val - new destination amount value
     */
    setDestAmount(val) {
        this.model.destAmount = val;
        this.model.fDestAmount = normalize(val);
        this.calculateDestResult();
    }

    /**
     * Set source result value
     * @param {number|string} val - new source result value
     */
    setSourceResult(val) {
        this.model.srcResBal = val;
        this.model.fSrcResBal = normalize(val);
    }

    /**
     * Set destination result value
     * @param {number|string} val - new destination result value
     */
    setDestResult(val) {
        this.model.destResBal = val;
        this.model.fDestResBal = normalize(val);
    }

    getLastAccountBalance() {
        if (!this.model.lastAccount_id) {
            return 0;
        }

        const account = App.state.accounts.getItem(this.model.lastAccount_id);
        assert(account, 'Last account not found');

        return account.balance;
    }

    calculateSourceResult() {
        if (this.model.type === INCOME || !this.model.isAvailable) {
            return;
        }

        const sourceAmount = this.model.fSrcAmount;
        let sourceResult;

        if (this.model.type === EXPENSE || this.model.type === TRANSFER) {
            sourceResult = normalize(this.model.srcAccount.balance - sourceAmount);
        } else if (this.model.type === DEBT) {
            if (this.model.srcAccount && !this.model.noAccount) {
                sourceResult = normalize(this.model.srcAccount.balance - sourceAmount);
            } else if (this.model.noAccount) {
                if (this.model.debtType) {
                    sourceResult = normalize(this.model.personAccount.balance - sourceAmount);
                } else {
                    sourceResult = normalize(this.getLastAccountBalance() - sourceAmount);
                }
            }
        }

        if (this.model.fSrcResBal !== sourceResult) {
            this.setSourceResult(sourceResult);
        }
    }

    calculateDestResult() {
        if (this.model.type === EXPENSE || !this.model.isAvailable) {
            return;
        }

        const destAmount = this.model.fDestAmount;
        let destResult;

        if (this.model.type === INCOME || this.model.type === TRANSFER) {
            destResult = normalize(this.model.destAccount.balance + destAmount);
        } else if (this.model.type === DEBT) {
            if (this.model.destAccount && !this.model.noAccount) {
                destResult = normalize(this.model.destAccount.balance + destAmount);
            } else if (this.model.noAccount) {
                if (this.model.debtType) {
                    destResult = normalize(this.getLastAccountBalance() + destAmount);
                } else {
                    destResult = normalize(this.model.personAccount.balance + destAmount);
                }
            }
        }

        if (this.model.fDestResBal !== destResult) {
            this.setDestResult(destResult);
        }
    }

    calcExchange(model = this.model) {
        if (model.fSrcAmount === 0 || model.fDestAmount === 0) {
            return 1;
        }

        return correctExch(Math.abs(this.model.fDestAmount / this.model.fSrcAmount));
    }

    calcBackExchange(model = this.model) {
        if (model.fSrcAmount === 0 || model.fDestAmount === 0) {
            return 1;
        }

        return correctExch(Math.abs(this.model.fSrcAmount / this.model.fDestAmount));
    }

    calcExchByAmounts() {
        this.model.exchRate = this.calcExchange();
        this.model.backExchRate = this.calcBackExchange();
    }

    updateExch() {
        if (!this.model.srcCurr || !this.model.destCurr) {
            return;
        }

        this.model.fExchRate = isValidValue(this.model.exchRate)
            ? normalizeExch(this.model.exchRate)
            : this.model.exchRate;
        this.model.fBackExchRate = isValidValue(this.model.backExchRate)
            ? normalizeExch(this.model.backExchRate)
            : this.model.backExchRate;

        this.model.exchSign = `${this.model.destCurr.sign}/${this.model.srcCurr.sign}`;
        this.model.backExchSign = `${this.model.srcCurr.sign}/${this.model.destCurr.sign}`;

        if (this.model.useBackExchange) {
            this.model.fmtExch = `${this.model.fBackExchRate} ${this.model.backExchSign}`;
        } else {
            this.model.fmtExch = `${this.model.fExchRate} ${this.model.exchSign}`;
        }
    }

    setNextSourceAccount(accountId) {
        const nextAccountId = App.state.getNextAccount(accountId);
        const newSrcAcc = App.state.accounts.getItem(nextAccountId);
        assert(newSrcAcc, 'Next account not found');

        this.model.srcAccount = newSrcAcc;
        this.model.src_curr_id = this.model.srcAccount.curr_id;
        this.model.srcCurr = App.currency.getItem(this.model.src_curr_id);

        this.calculateSourceResult();
    }

    setNextDestAccount(accountId) {
        const nextAccountId = App.state.getNextAccount(accountId);
        assert(nextAccountId, 'Next account not found');

        this.model.destAccount = App.state.accounts.getItem(nextAccountId);
        this.model.dest_curr_id = this.model.destAccount.curr_id;
        this.model.destCurr = App.currency.getItem(this.model.dest_curr_id);

        this.calculateDestResult();
    }

    getPersonAccount(personId, currencyId) {
        const currency = App.currency.getItem(currencyId);
        if (!currency) {
            return null;
        }

        const personAccount = App.state.getPersonAccount(personId, currencyId);
        if (personAccount) {
            return personAccount;
        }

        return {
            balance: 0,
            curr_id: currencyId,
        };
    }

    getFirstCurrency() {
        return App.currency.getItemByIndex(0);
    }

    async changeTransactionType(type) {
        const currentType = this.model.type;
        const isAvailableBefore = this.model.isAvailable;

        if (currentType === type) {
            return true;
        }

        this.model.type = type;
        this.model.isAvailable = App.state.isAvailableTransactionType(type);

        if (type === EXPENSE) {
            if (!this.model.isAvailable) {
                this.model.state = -1;
            } else if (currentType === INCOME) {
                const srcCurrId = this.model.src_curr_id;
                const { srcCurr, srcAmount, destAmount } = this.model;

                this.model.srcAccount = this.model.destAccount;
                this.model.src_curr_id = this.model.dest_curr_id;
                this.model.dest_curr_id = srcCurrId;
                this.model.srcCurr = this.model.destCurr;
                this.model.destCurr = srcCurr;

                this.setSrcAmount(destAmount);
                this.setDestAmount(srcAmount);
            } else if (currentType === TRANSFER) {
                const { srcAmount } = this.model;

                this.model.state = 0;
                this.model.dest_curr_id = this.model.src_curr_id;
                this.model.destCurr = this.model.srcCurr;

                this.setSrcAmount(srcAmount);
                this.setDestAmount(srcAmount);
            } else if (currentType === DEBT) {
                let fromAccount = this.model.account;
                if (!fromAccount) {
                    fromAccount = App.state.getFirstAccount();
                }

                this.model.state = 0;
                this.model.srcAccount = fromAccount;
                this.model.src_curr_id = fromAccount.curr_id;
                this.model.dest_curr_id = fromAccount.curr_id;
                this.model.srcCurr = App.currency.getItem(fromAccount.curr_id);
                this.model.destCurr = this.model.srcCurr;

                this.calculateSourceResult();
            }

            if (this.model.isAvailable) {
                this.updateExch();
            }

            this.model.destAccount = null;
        }

        if (type === INCOME) {
            if (!this.model.isAvailable) {
                this.model.state = -1;
            } else if (currentType === EXPENSE) {
                const { srcCurr, srcAmount, destAmount } = this.model;
                const srcCurrId = this.model.src_curr_id;

                this.model.destAccount = this.model.srcAccount;
                this.model.src_curr_id = this.model.dest_curr_id;
                this.model.dest_curr_id = srcCurrId;
                this.model.srcCurr = this.model.destCurr;
                this.model.destCurr = srcCurr;

                this.setSrcAmount(destAmount);
                this.setDestAmount(srcAmount);
            } else if (currentType === TRANSFER) {
                const { destAmount } = this.model;

                this.model.state = 0;
                this.model.src_curr_id = this.model.dest_curr_id;
                this.model.srcCurr = this.model.destCurr;

                this.setSrcAmount(destAmount);
                this.setDestAmount(destAmount);
            } else if (currentType === DEBT) {
                let fromAccount = this.model.account;
                if (!fromAccount) {
                    fromAccount = App.state.getFirstAccount();
                }

                this.model.state = 0;
                this.model.destAccount = fromAccount;
                this.model.dest_curr_id = fromAccount.curr_id;
                this.model.src_curr_id = fromAccount.curr_id;
                this.model.destCurr = App.currency.getItem(fromAccount.curr_id);
                this.model.srcCurr = this.model.destCurr;

                this.calculateDestResult();
            }

            if (this.model.isAvailable) {
                this.updateExch();
            }

            this.model.srcAccount = null;
        }

        if (type === TRANSFER) {
            if (!this.model.isAvailable) {
                this.model.state = -1;
            } else if (currentType === EXPENSE) {
                this.setNextDestAccount(this.model.srcAccount.id);
            } else if (currentType === INCOME) {
                this.setNextSourceAccount(this.model.destAccount.id);
            } else if (currentType === DEBT) {
                if (this.model.account && this.model.debtType) {
                    this.model.destAccount = this.model.account;
                    this.model.dest_curr_id = this.model.account.curr_id;
                    this.model.destCurr = App.currency.getItem(this.model.account.curr_id);

                    this.setNextSourceAccount(this.model.destAccount.id);
                } else {
                    let scrAccount = this.model.account;
                    if (!scrAccount) {
                        scrAccount = App.state.getFirstAccount();
                    }

                    this.model.srcAccount = scrAccount;
                    this.model.src_curr_id = scrAccount.curr_id;
                    this.model.srcCurr = App.currency.getItem(scrAccount.curr_id);

                    this.setNextDestAccount(scrAccount.id);
                }
            }

            this.model.isDiffCurr = (this.model.src_curr_id !== this.model.dest_curr_id);
            if (this.model.isAvailable) {
                this.model.state = (this.model.isDiffCurr) ? 3 : 0;
            }

            const { srcAmount, destAmount } = this.model;
            this.setSrcAmount(srcAmount);
            this.setDestAmount(destAmount);
            this.updateExch();
        }

        if (type === DEBT) {
            if (!isAvailableBefore && this.model.isAvailable) {
                this.model.debtType = true;
                this.model.srcCurr = this.getFirstCurrency();
                this.model.src_curr_id = this.model.srcCurr.id;

                this.model.dest_curr_id = this.model.src_curr_id;
                this.model.destCurr = this.model.srcCurr;

                this.model.account = null;
            } else if (!this.model.isAvailable) {
                this.model.state = -1;
            } else if (currentType === EXPENSE || currentType === TRANSFER) {
                this.model.debtType = false;
                this.model.account = this.model.srcAccount;
                if (this.model.srcAccount) {
                    this.model.src_curr_id = this.model.srcAccount.curr_id;
                } else {
                    this.model.srcCurr = this.getFirstCurrency();
                    this.model.src_curr_id = this.model.srcCurr.id;
                }

                this.model.dest_curr_id = this.model.src_curr_id;
                this.model.destCurr = this.model.srcCurr;
            } else if (currentType === INCOME) {
                this.model.debtType = true;
                this.model.account = this.model.destAccount;
                if (this.model.destAccount) {
                    this.model.dest_curr_id = this.model.destAccount.curr_id;
                } else {
                    this.model.destCurr = this.getFirstCurrency();
                    this.model.dest_curr_id = this.model.destCurr.id;
                }

                this.model.src_curr_id = this.model.dest_curr_id;
                this.model.srcCurr = this.model.destCurr;
            }

            if (this.model.isAvailable) {
                this.model.person = App.state.getFirstPerson();
                this.model.personAccount = this.getPersonAccount(
                    this.model.person?.id,
                    this.model.src_curr_id,
                );
            } else {
                this.model.person = null;
                this.model.personAccount = null;
            }

            if (this.model.debtType) {
                this.model.srcAccount = this.model.personAccount;
            } else {
                this.model.destAccount = this.model.personAccount;
            }

            this.model.isDiffCurr = (this.model.src_curr_id !== this.model.dest_curr_id);
            this.model.noAccount = (this.model.account == null);
            if (this.model.isAvailable) {
                if (this.model.noAccount) {
                    this.model.state = (this.model.debtType) ? 6 : 7;
                } else {
                    this.model.state = (this.model.debtType) ? 0 : 3;
                }
            }
            const { srcAmount, destAmount } = this.model;
            this.setSrcAmount(srcAmount);
            this.setDestAmount(destAmount);
            this.calcExchByAmounts();
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

        this.expectedState = this.getExpectedState();

        await this.performAction(() => this.content.typeMenu.select(type));

        return this.checkState();
    }

    async clickDeleteButton() {
        assert(this.content.isUpdate && this.content.delBtn, 'Unexpected action clickDeleteButton');

        await this.performAction(() => this.content.delBtn.click());
    }

    /** Click on delete button and confirm wanring popup */
    async deleteSelfItem() {
        await this.clickDeleteButton();

        assert(this.content.delete_warning?.content?.visible, 'Delete transaction warning popup not appear');
        assert(this.content.delete_warning.content.okBtn, 'OK button not found');

        await navigation(() => click(this.content.delete_warning.content.okBtn));
    }

    async submit() {
        const action = () => click(this.content.submitBtn);

        if (this.isValid()) {
            await navigation(action);
        } else {
            await this.performAction(action);
        }
    }

    async cancel() {
        await navigation(() => click(this.content.cancelBtn));
    }

    async changeSrcAccount(val) {
        assert(
            this.model.type === EXPENSE || this.model.type === TRANSFER,
            'Unexpected action: can\'t change source account',
        );

        const newAcc = App.state.accounts.getItem(val);
        if (!this.model.srcAccount || !newAcc || newAcc.id === this.model.srcAccount.id) {
            return true;
        }

        this.model.srcAccount = newAcc;
        this.model.src_curr_id = this.model.srcAccount.curr_id;
        this.model.srcCurr = App.currency.getItem(this.model.src_curr_id);

        // Update result balance of source
        this.calculateSourceResult();

        // Copy source currency to destination currency if needed
        // Transition 1 or 12
        if (this.model.type === EXPENSE && (this.model.state === 0 || this.model.state === 1)) {
            this.model.dest_curr_id = this.model.src_curr_id;
            this.model.destCurr = this.model.srcCurr;
        }

        if (this.model.type === TRANSFER && newAcc.id === this.model.destAccount.id) {
            this.setNextDestAccount(newAcc.id);
        }

        this.model.isDiffCurr = (this.model.src_curr_id !== this.model.dest_curr_id);

        if (this.model.type === EXPENSE) {
            if (this.model.isDiffCurr) {
                const sameStates = [2, 3, 4]; // Transition 5, 17 or 10
                assert(sameStates.includes(this.model.state), `Unexpected state ${this.model.state} with different currencies`);
            } else if (!this.model.isDiffCurr) {
                const sameStates = [0, 1]; // Transition 1 or 12

                if (this.model.state === 2 || this.model.state === 3) {
                    this.setDestAmount(this.model.srcAmount);
                    this.model.state = 0; // Transition 14 or 15
                } else if (this.model.state === 4) {
                    this.setDestAmount(this.model.srcAmount);
                    this.model.state = 1; // Transition 11
                } else {
                    assert(sameStates.includes(this.model.state), `changeSrcAccount(): Unexpected state ${this.model.state} with same currencies`);
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
                } else {
                    assert(sameStates.includes(this.model.state), `changeSrcAccount(): Unexpected state ${this.model.state} with different currencies`);
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
                } else {
                    assert(sameStates.includes(this.model.state), `changeSrcAccount(): Unexpected state ${this.model.state} with same currencies`);
                }
            }
        }

        // Update exchange rate
        this.calcExchByAmounts();
        this.updateExch();

        this.expectedState = this.getExpectedState();

        await this.performAction(() => this.content.source.selectAccount(val));

        return this.checkState();
    }

    async changeSrcAccountByPos(pos) {
        return this.changeSrcAccount(this.content.source.content.dropDown.content.items[pos].id);
    }

    async changeDestAccount(val) {
        const availTypes = [INCOME, TRANSFER];
        assert(availTypes.includes(this.model.type), 'Unexpected action: can\'t change destination account');

        const newAcc = App.state.accounts.getItem(val);
        if (!this.model.destAccount || !newAcc || newAcc.id === this.model.destAccount.id) {
            return true;
        }

        this.model.destAccount = newAcc;
        this.model.dest_curr_id = this.model.destAccount.curr_id;
        this.model.destCurr = App.currency.getItem(this.model.dest_curr_id);

        // Update result balance of destination
        this.calculateDestResult();

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

        this.model.isDiffCurr = (this.model.src_curr_id !== this.model.dest_curr_id);

        if (this.model.type === INCOME) {
            if (this.model.isDiffCurr) {
                const sameStates = [2, 3, 4]; // Transition 5, 11 or 17
                assert(sameStates.includes(this.model.state), `Unexpected state ${this.model.state} with different currencies`);
            } else if (!this.model.isDiffCurr) {
                const sameStates = [0, 1]; // Transition 1 or 23
                if (this.model.state === 2 || this.model.state === 3) {
                    this.setSrcAmount(this.model.destAmount);
                    this.model.state = 0; // Transition 6 or 12
                } else if (this.model.state === 4) {
                    this.setSrcAmount(this.model.destAmount);
                    this.model.state = 1; // Transition 18
                } else {
                    assert(sameStates.includes(this.model.state), `changeDestAccount(): Unexpected state ${this.model.state} with different currencies`);
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
                } else {
                    assert(sameStates.includes(this.model.state), `changeDestAccount(): Unexpected state ${this.model.state} with different currencies`);
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
                } else {
                    assert(sameStates.includes(this.model.state), `changeDestAccount(): Unexpected state ${this.model.state} with same currencies`);
                }
            }
        }

        // Update exchange rate
        this.calcExchByAmounts();
        this.updateExch();

        this.expectedState = this.getExpectedState();

        await this.performAction(() => this.content.destination.selectAccount(val));

        return this.checkState();
    }

    async changeDestAccountByPos(pos) {
        return this.changeDestAccount(
            this.content.destination.content.dropDown.content.items[pos].id,
        );
    }

    async inputSrcAmount(val) {
        if (this.model.type === EXPENSE) {
            assert(this.model.isDiffCurr, `Wrong state: can't input source amount on state ${this.model.state}`);
        }
        const trAvailStates = [0, 3, 4, 7];
        if (this.model.type === TRANSFER) {
            assert(
                trAvailStates.includes(this.model.state),
                `Unexpected state ${this.model.state} to input source amount`,
            );
        }

        const cutVal = trimToDigitsLimit(val, CENTS_DIGITS);
        this.model.srcAmount = cutVal;
        const fNewValue = isValidValue(cutVal) ? normalize(cutVal) : cutVal;
        if (this.model.fSrcAmount !== fNewValue) {
            this.setSrcAmount(cutVal);

            if (this.model.isDiffCurr) {
                this.calcExchByAmounts();
                this.updateExch();
            } else {
                this.setDestAmount(this.model.fSrcAmount);
            }
        }

        this.expectedState = this.getExpectedState();

        await this.performAction(() => this.content.src_amount_row.input(val));

        return this.checkState();
    }

    async clickSrcAmount() {
        assert(this.model.type !== EXPENSE, 'Unexpected action: can\'t click by source amount');

        if (this.model.type === INCOME) {
            assert(this.model.state === 1, `Unexpected state ${this.model.state} for clickSrcAmount action`);
            this.model.state = 0; // Transition 4
        } else if (this.model.type === TRANSFER) {
            const availStates = [1, 2, 4, 6, 8];
            assert(availStates.includes(this.model.state), `Unexpected state ${this.model.state} for clickSrcAmount action`);

            if (this.model.state === 1 || this.model.state === 2) {
                this.model.state = 0; // Transition 2 or 4
            } else if (this.model.state === 4) {
                this.model.state = 3; // Transition 30
            } else if (this.model.state === 6) {
                this.model.state = 5; // Transition 20
            } else if (this.model.state === 8) {
                this.model.state = 7; // Transition 23
            }
        } else if (this.model.type === DEBT) {
            const availStates = [1, 2, 4, 5, 8, 9];
            assert(availStates.includes(this.model.state), `Unexpected state ${this.model.state} for clickSrcAmount action`);

            if (this.model.state === 1 || this.model.state === 2) {
                this.model.state = 0; // Transition 2 or 4
            } else if (this.model.state === 4 || this.model.state === 5) {
                this.model.state = 3; // Transition 30 or 12
            } else if (this.model.state === 8) {
                this.model.state = 7; // Transition 31
            } else if (this.model.state === 9) {
                this.model.state = 6; // Transition 35
            }
        }

        this.expectedState = this.getExpectedState();

        await this.performAction(() => this.content.src_amount_left.click());

        return this.checkState();
    }

    async inputDestAmount(val) {
        assert(this.model.type !== DEBT, 'Unexpected action: can\'t input destination amount');
        const trAvailStates = [3, 4];
        if (this.model.type === TRANSFER) {
            assert(
                trAvailStates.includes(this.model.state),
                `Unexpected state ${this.model.state} to input destination amount`,
            );
        }

        const cutVal = trimToDigitsLimit(val, CENTS_DIGITS);
        const fNewValue = (isValidValue(cutVal)) ? normalize(cutVal) : cutVal;
        this.model.destAmount = cutVal;
        if (this.model.fDestAmount !== fNewValue) {
            this.setDestAmount(cutVal);

            if (this.model.isDiffCurr) {
                this.calcExchByAmounts();
                this.updateExch();
            } else {
                this.setSrcAmount(this.model.fDestAmount);
            }
        }

        this.expectedState = this.getExpectedState();

        await this.performAction(() => this.content.dest_amount_row.input(val));

        return this.checkState();
    }

    async clickSrcResultBalance() {
        assert(this.model.type !== INCOME, 'Unexpected action: can\'t click by source result balance');

        if (this.model.type === EXPENSE) {
            const availStates = [0, 2, 3];
            assert(availStates.includes(this.model.state), `Unexpected state ${this.model.state}`);

            if (this.model.state === 0) {
                this.model.state = 1;
            } else if (this.model.state === 2 || this.model.state === 3) {
                this.model.state = 4;
            }
        } else if (this.model.type === TRANSFER) {
            const availStates = [0, 2, 3, 5, 7];
            assert(availStates.includes(this.model.state), `Unexpected state ${this.model.state}`);

            if (this.model.state === 0 || this.model.state === 2) {
                this.model.state = 1; // Transition 1 or 10
            } else if (this.model.state === 3) {
                this.model.state = 4; // Transition 31
            } else if (this.model.state === 5) {
                this.model.state = 6; // Transition 19
            } else if (this.model.state === 7) {
                this.model.state = 8; // Transition 22
            }
        } else if (this.model.type === DEBT) {
            const availStates = [0, 2, 3, 4, 6];
            assert(availStates.includes(this.model.state), `Unexpected state ${this.model.state}`);

            if (this.model.state === 0 || this.model.state === 2) {
                this.model.state = 1; // Transition 1 or 4
            } else if (this.model.state === 3 || this.model.state === 4) {
                this.model.state = 5; // Transition 13 or 11
            } else if (this.model.state === 6) {
                this.model.state = 9; // Transition 36
            }
        }

        this.expectedState = this.getExpectedState();

        await this.performAction(() => this.content.src_res_balance_left.click());

        return this.checkState();
    }

    async clickDestResultBalance() {
        assert(this.model.type !== EXPENSE, 'Unexpected action: can\'t click by destination result balance');

        if (this.model.type === INCOME) {
            if (this.model.state === 0) {
                this.model.state = 1; // Transition 2
            } else if (this.model.state === 2 || this.model.state === 3) {
                this.model.state = 4; // Transition 7 or 14
            }
        } else if (this.model.type === TRANSFER) {
            if (this.model.state === 0 || this.model.state === 1) {
                this.model.state = 2; // Transition 3 or 9
            } else if (this.model.state === 3 || this.model.state === 7) {
                this.model.state = 5; // Transition 25 or 56
            } else if (this.model.state === 4 || this.model.state === 8) {
                this.model.state = 6; // Transition 32 or 46
            }
        } else if (this.model.type === DEBT) {
            const availStates = [0, 1, 3, 5, 7];
            assert(availStates.includes(this.model.state), `Unexpected state ${this.model.state}`);

            if (this.model.state === 0 || this.model.state === 1) {
                this.model.state = 2; // Transition 3 or 5
            } else if (this.model.state === 3 || this.model.state === 5) {
                this.model.state = 4; // Transition 9
            } else if (this.model.state === 7) {
                this.model.state = 8; // Transition 32 or 46
            }
        }

        this.expectedState = this.getExpectedState();

        await this.performAction(() => this.content.dest_res_balance_left.click());

        return this.checkState();
    }

    async clickDestAmount() {
        assert(this.model.type !== DEBT, 'Unexpected action: can\'t click by destination amount');

        if (this.model.type === EXPENSE) {
            if (this.model.state === 1) {
                this.model.state = 0; // Transition 3
            } else if (this.model.state === 3 || this.model.state === 4) {
                this.model.state = 2; // Transition 16 or 7
            }
        } else if (this.model.type === INCOME) {
            assert(
                this.model.state === 3 || this.model.state === 4,
                `Unexpected state ${this.model.state} for clickDestAmount action`,
            );

            this.model.state = 2; // Transition 13 or 19
        } else if (this.model.type === TRANSFER) {
            const availStates = [5, 7, 6, 8];
            assert(availStates.includes(this.model.state), `Unexpected state ${this.model.state} for clickDestAmount action`);

            if (this.model.state === 5 || this.model.state === 7) {
                this.model.state = 3; // Transition 24 or 55
            } else if (this.model.state === 6 || this.model.state === 8) {
                this.model.state = 4; // Transition 33 or 35
            }
        }

        this.expectedState = this.getExpectedState();

        await this.performAction(() => this.content.dest_amount_left.click());

        return this.checkState();
    }

    async inputResBalance(val) {
        assert(this.model.type !== INCOME, 'Unexpected action: can\'t input source result balance');

        const cutVal = trimToDigitsLimit(val, CENTS_DIGITS);
        const fNewValue = isValidValue(cutVal) ? normalize(cutVal) : cutVal;
        this.model.srcResBal = cutVal;
        if (this.model.fSrcResBal !== fNewValue) {
            this.model.fSrcResBal = fNewValue;

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

        this.expectedState = this.getExpectedState();

        await this.performAction(() => this.content.result_balance_row.input(val));

        return this.checkState();
    }

    async inputDestResBalance(val) {
        assert(this.model.type !== EXPENSE, 'Unexpected action: can\'t input destination result balance');

        const cutVal = trimToDigitsLimit(val, CENTS_DIGITS);
        const fNewValue = isValidValue(cutVal) ? normalize(cutVal) : cutVal;
        this.model.destResBal = cutVal;
        const valueChanged = this.model.fDestResBal !== fNewValue;
        if (valueChanged) {
            this.model.fDestResBal = fNewValue;

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

        this.expectedState = this.getExpectedState();

        await this.performAction(() => this.content.result_balance_dest_row.input(val));

        return this.checkState();
    }

    async changeSourceCurrency(val) {
        assert(this.model.type === INCOME, 'Unexpected action: can\'t change source currency');

        if (this.model.src_curr_id === val) {
            return true;
        }

        this.model.src_curr_id = parseInt(val, 10);
        this.model.srcCurr = App.currency.getItem(this.model.src_curr_id);

        this.model.isDiffCurr = (this.model.src_curr_id !== this.model.dest_curr_id);

        if (this.model.isDiffCurr && this.model.state === 0) {
            this.updateExch();
            this.model.state = 2; // Transition 3
        } else if (this.model.state === 2 || this.model.state === 3 || this.model.state === 4) {
            if (this.model.isDiffCurr) {
                this.updateExch(); // Transition 9, 21 or 15
            } else {
                this.setDestAmount(this.model.srcAmount);
                this.calcExchByAmounts();
                this.updateExch();
                if (this.model.state === 2 || this.model.state === 3) {
                    this.model.state = 0; // Transition 10 or 16
                } else {
                    this.model.state = 1; // Transition 22
                }
            }
        } else {
            throw new Error('Unexpected transition');
        }

        this.expectedState = this.getExpectedState();

        await this.performAction(() => this.content.src_amount_row.selectCurr(val));

        return this.checkState();
    }

    async changeDestCurrency(val) {
        assert(this.model.type === EXPENSE, 'Unexpected action: can\'t change destination currency');

        if (this.model.dest_curr_id === val) {
            return true;
        }

        this.model.dest_curr_id = parseInt(val, 10);
        this.model.destCurr = App.currency.getItem(this.model.dest_curr_id);

        this.model.isDiffCurr = (this.model.src_curr_id !== this.model.dest_curr_id);

        if (this.model.isDiffCurr && this.model.state === 0) {
            this.updateExch();
            this.model.state = 2; // Transition 4
        } else if (this.model.state === 2) {
            if (this.model.isDiffCurr) {
                this.updateExch();
                this.model.state = 2; // Transition 13
            } else {
                this.setSrcAmount(this.model.fDestAmount);
                this.calcExchByAmounts();
                this.updateExch();
                this.model.state = 0; // Transition 9
            }
        } else {
            throw new Error('Unexpected transition');
        }

        this.expectedState = this.getExpectedState();

        await this.performAction(() => this.content.dest_amount_row.selectCurr(val));

        return this.checkState();
    }

    async clickExchRate() {
        assert(this.model.type !== DEBT, 'Unexpected action: can\'t click by exchange rate');

        if (this.model.type === EXPENSE || this.model.type === INCOME) {
            this.model.state = 3;
        } else if (this.model.type === TRANSFER) {
            if (this.model.state === 3 || this.model.state === 5) {
                this.model.state = 7; // Transition 40 or 21
            } else if (this.model.state === 4 || this.model.state === 6) {
                this.model.state = 8; // Transition 34 or 45
            }
        }

        this.expectedState = this.getExpectedState();

        await this.performAction(() => this.content.exch_left.click());

        return this.checkState();
    }

    isExchangeInputVisible() {
        return (
            ((this.model.type === EXPENSE || this.model.type === INCOME) && this.model.state === 3)
            || (this.model.type === TRANSFER && (this.model.state === 7 || this.model.state === 8))
        );
    }

    async inputExchRate(val) {
        const { useBackExchange } = this.model;

        assert(this.isExchangeInputVisible(), `Unexpected state ${this.model.state} to input exchange rate`);

        const cutVal = trimToDigitsLimit(val, EXCHANGE_DIGITS);
        if (useBackExchange) {
            this.model.backExchRate = cutVal;
        } else {
            this.model.exchRate = cutVal;
        }

        const fNewValue = isValidValue(cutVal) ? normalizeExch(cutVal) : cutVal;
        const valueChanged = (
            (useBackExchange && this.model.fBackExchRate !== fNewValue)
            || (!useBackExchange && this.model.fExchRate !== fNewValue)
        );

        if (valueChanged) {
            if (useBackExchange) {
                this.model.fBackExchRate = fNewValue;
            } else {
                this.model.fExchRate = fNewValue;
            }

            if (isValidValue(this.model.srcAmount)) {
                let newDestAmount;
                if (useBackExchange) {
                    newDestAmount = (fNewValue === 0)
                        ? 0
                        : correct(this.model.fSrcAmount / fNewValue);
                } else {
                    newDestAmount = correct(this.model.fSrcAmount * fNewValue);
                }

                this.setDestAmount(newDestAmount);
            } else if (isValidValue(this.model.destAmount)) {
                let newSrcAmount;
                if (useBackExchange) {
                    newSrcAmount = correct(this.model.fDestAmount * fNewValue);
                } else {
                    newSrcAmount = (fNewValue === 0)
                        ? 0
                        : correct(this.model.fDestAmount / fNewValue);
                }

                this.setSrcAmount(newSrcAmount);
            }

            if (useBackExchange) {
                this.model.exchRate = this.calcExchange();
            } else {
                this.model.backExchRate = this.calcBackExchange();
            }

            this.updateExch();
        }

        this.expectedState = this.getExpectedState();

        await this.performAction(() => this.content.exchange_row.input(val));

        return this.checkState();
    }

    async toggleExchange() {
        assert(this.isExchangeInputVisible(), `Unexpected state ${this.model.state} to input exchange rate`);

        this.model.useBackExchange = !this.model.useBackExchange;
        this.updateExch();
        this.expectedState = this.getExpectedState();

        await this.performAction(() => this.content.exchange_row.clickButton());

        return this.checkState();
    }

    async changeDate(val) {
        this.model.date = val.toString();
        this.expectedState = this.getExpectedState();

        await this.performAction(() => this.content.datePicker.input(val));

        return this.checkState();
    }

    async changeCategory(val) {
        const category = App.state.categories.getItem(val);
        const categoryId = category?.id ?? 0;
        if (this.model.categoryId === categoryId) {
            return true;
        }

        this.model.categoryId = categoryId;
        this.expectedState = this.getExpectedState();

        await this.performAction(() => this.content.categorySelect.setSelection(val));

        return this.checkState();
    }

    async inputComment(val) {
        this.model.comment = val.toString();
        this.expectedState = this.getExpectedState();

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
            this.calculateSourceResult();
        } else {
            this.model.destAccount = this.model.personAccount;
            this.calculateDestResult();
        }

        this.expectedState = this.getExpectedState();

        await this.performAction(() => this.content.person.selectAccount(val));

        return this.checkState();
    }

    async changePersonByPos(pos) {
        return this.changePerson(this.content.person.content.dropDown.content.items[pos].id);
    }

    async toggleAccount() {
        this.model.noAccount = !this.model.noAccount;

        if (this.model.noAccount) {
            this.model.lastAccount_id = this.model.account.id;
            if (this.model.debtType) {
                this.calculateDestResult();
            } else {
                this.calculateSourceResult();
            }
            this.model.account = null;

            const availStates = [0, 2, 1, 3, 5, 4];
            assert(availStates.includes(this.model.state), `Unexpected state ${this.model.state}`);

            if (this.model.state === 0 || this.model.state === 2) {
                this.model.state = 6; // Transition 25 or 41
            } else if (this.model.state === 1) {
                this.model.state = 9; // Transition 38
            } else if (this.model.state === 3 || this.model.state === 5) {
                this.model.state = 7; // Transition 40 or 50
            } else if (this.model.state === 4) {
                this.model.state = 8; // Transition 39
            }
        } else {
            if (this.model.lastAccount_id) {
                this.model.account = App.state.accounts.getItem(this.model.lastAccount_id);
            } else {
                this.model.account = App.state.getFirstAccount();
            }
            assert(this.model.account, 'Account not found');

            if (this.model.debtType) {
                this.model.destAccount = this.model.account;
                this.calculateDestResult();
            } else {
                this.model.srcAccount = this.model.account;
                this.calculateSourceResult();
            }

            const availStates = [6, 7, 8, 9];
            assert(availStates.includes(this.model.state), `Unexpected state ${this.model.state}`);

            if (this.model.state === 6) {
                this.model.state = 0; // Transition 26
            } else if (this.model.state === 7) {
                this.model.state = 3; // Transition 29
            } else if (this.model.state === 8) {
                this.model.state = 4; // Transition 32
            } else if (this.model.state === 9) {
                this.model.state = 1; // Transition 37
            }
        }

        this.expectedState = this.getExpectedState();

        const action = (this.model.noAccount)
            ? () => click(this.content.noacc_btn.elem)
            : () => this.content.selaccount.click();

        await this.performAction(action);

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
        this.model.srcCurr = App.currency.getItem(this.model.src_curr_id);
        this.model.destCurr = App.currency.getItem(this.model.dest_curr_id);

        if (this.model.debtType) {
            this.model.srcAccount = this.model.personAccount;
            this.model.destAccount = this.model.account;
        } else {
            this.model.srcAccount = this.model.account;
            this.model.destAccount = this.model.personAccount;
        }

        this.calculateSourceResult();
        this.calculateDestResult();
        this.updateExch();

        this.expectedState = this.getExpectedState();

        await this.performAction(() => this.content.account.selectAccount(accountId));

        return this.checkState();
    }

    changeAccountByPos(pos) {
        return this.changeAccount(this.content.account.content.dropDown.content.items[pos].id);
    }

    async swapSourceAndDest() {
        assert(this.model.type === TRANSFER || this.model.type === DEBT, 'Invalid transaction type: can\'t swap source and destination');

        const srcCurrId = this.model.src_curr_id;
        const { srcAmount, fSrcAmount, srcAccount } = this.model;

        this.model.srcAccount = this.model.destAccount;
        this.model.destAccount = srcAccount;

        this.model.src_curr_id = this.model.dest_curr_id;
        this.model.dest_curr_id = srcCurrId;
        this.model.srcCurr = App.currency.getItem(this.model.src_curr_id);
        this.model.destCurr = App.currency.getItem(this.model.dest_curr_id);

        this.model.srcAmount = this.model.destAmount;
        this.model.fSrcAmount = this.model.fDestAmount;
        this.model.destAmount = srcAmount;
        this.model.fDestAmount = fSrcAmount;

        if (this.model.type === DEBT) {
            this.model.debtType = !this.model.debtType;

            if (this.model.debtType) {
                const availStates = [3, 4, 5, 7, 8];
                assert(availStates.includes(this.model.state), `Unexpected state ${this.model.state}`);

                if (this.model.state === 3) {
                    this.model.state = 0; // Transition 8
                } else if (this.model.state === 4) {
                    this.model.state = 1; // Transition 16
                } else if (this.model.state === 5) {
                    this.model.state = 2; // Transition 17
                } else if (this.model.state === 7) {
                    this.model.state = 6; // Transition 28
                } else if (this.model.state === 8) {
                    this.model.state = 9; // Transition 33
                }
            } else {
                const availStates = [0, 1, 2, 6, 9];
                assert(availStates.includes(this.model.state), `Unexpected state ${this.model.state}`);

                if (this.model.state === 0) {
                    this.model.state = 3; // Transition 7
                } else if (this.model.state === 1) {
                    this.model.state = 4; // Transition 16
                } else if (this.model.state === 2) {
                    this.model.state = 5; // Transition 18
                } else if (this.model.state === 6) {
                    this.model.state = 7; // Transition 27
                } else if (this.model.state === 9) {
                    this.model.state = 8; // Transition 34
                }
            }
        }

        this.calculateSourceResult();
        this.calculateDestResult();
        this.updateExch();

        this.expectedState = this.getExpectedState();

        await this.performAction(() => click(this.content.swapBtn.elem));

        return this.checkState();
    }
}
