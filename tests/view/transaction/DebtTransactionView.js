import { TestComponent } from 'jezve-test';
import { TransactionView } from '../TransactionView.js';
import { Currency } from '../../model/Currency.js';
import { isValidValue, normalize } from '../../common.js';
import { DEBT } from '../../model/Transaction.js';
import { App } from '../../Application.js';

/** Create or update transfer transaction view class */
export class DebtTransactionView extends TransactionView {
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
        res.personAccount = App.state.getPersonAccount(res.person.id, personAccountCurr);
        if (!res.personAccount) {
            res.personAccount = {
                balance: 0,
                curr_id: personAccountCurr,
            };
        }

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

    getExpectedTransaction() {
        const res = {};

        if (this.model.isUpdate) {
            res.id = this.model.id;
        }

        res.type = this.model.type;
        res.person_id = this.model.person.id;
        res.acc_id = this.model.noAccount ? 0 : this.model.account.id;
        res.op = this.model.debtType ? 1 : 2;
        res.src_amount = this.model.fSrcAmount;
        res.dest_amount = this.model.fDestAmount;
        res.src_curr = this.model.src_curr_id;
        res.dest_curr = this.model.dest_curr_id;
        res.date = this.model.date;
        res.comment = this.model.comment;

        return res;
    }

    /**
     * Set source amount value
     * State 0, 1 or 2: source and destination currencies are the same
     * @param {number|string} val - new source amount value
     */
    async setSrcAmount(val) {
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

                    this.model.srcResBal = normalize(accBalance - this.model.fSrcAmount);
                }
            }

            this.model.fmtSrcResBal = this.model.srcCurr.format(this.model.srcResBal);
        }
    }

    /**
     * Set destination amount value
     * State 0, 1 or 2: source and destination currencies are the same
     * @param {number|string} val - new destination amount value
     */
    setDestAmount(val) {
        this.model.destAmount = val;

        const newValue = isValidValue(val) ? normalize(val) : val;
        if (this.model.fDestAmount !== newValue || this.model.destResBal === '') {
            this.model.fDestAmount = newValue;

            if (this.model.destAccount && !this.model.noAccount) {
                const destRes = this.model.destAccount.balance + this.model.fDestAmount;
                this.model.destResBal = normalize(destRes);
            } else if (this.model.debtType) {
                let accBalance = 0;
                if (this.model.lastAccount_id) {
                    const lastAcc = App.state.accounts.getItem(this.model.lastAccount_id);
                    if (!lastAcc) {
                        throw new Error('Last account not found');
                    }

                    accBalance = lastAcc.balance;
                }

                this.model.destResBal = normalize(accBalance + this.model.fDestAmount);
            } else {
                const destRes = this.model.personAccount.balance + this.model.fDestAmount;
                this.model.destResBal = normalize(destRes);
            }

            this.model.fmtDestResBal = this.model.destCurr.format(this.model.destResBal);
        }
    }

    setExpectedState(stateId) {
        const newState = parseInt(stateId, 10);
        if (Number.isNaN(newState) || newState < 0 || newState > 9) {
            throw new Error('Wrong state specified');
        }

        const res = {
            model: { state: newState },
            visibility: {
                delBtn: this.model.isUpdate,
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
/*
            if (this.model.noAccount && !this.model.lastAccount_id && this.model.destResBal === '') {
                res.values.dest_res_balance_left = '';
            } else {
*/
                res.values.dest_res_balance_left = this.model.fmtDestResBal;
//            }

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
/*
            if (this.model.noAccount && !this.model.lastAccount_id && this.model.srcResBal === '') {
                res.values.src_res_balance_left = '';
            } else {
*/
            res.values.src_res_balance_left = this.model.fmtSrcResBal;
//            }

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

    async changePerson(val) {
        this.model.person = App.state.persons.getItem(val);

        const personAccCurrencyId = (this.model.debtType)
            ? this.model.srcCurr.id
            : this.model.destCurr.id;
        this.model.personAccount = App.state.getPersonAccount(
            this.model.person.id,
            personAccCurrencyId,
        );
        if (!this.model.personAccount) {
            this.model.personAccount = {
                balance: 0,
                curr_id: personAccCurrencyId,
            };
        }

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
            this.model.destResBal = normalize(destRes);
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

    async inputSrcAmount(val) {
        const fNewValue = (isValidValue(val)) ? normalize(val) : val;
        const valueChanged = (this.model.fSrcAmount !== fNewValue);

        this.setSrcAmount(val);
        if (valueChanged) {
            this.setDestAmount(this.model.fSrcAmount);
        }

        this.setExpectedState(this.model.state);

        return super.inputSrcAmount(val);
    }

    async inputResBalance(val) {
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

        return super.inputResBalance(val);
    }

    async inputDestResBalance(val) {
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

        return super.inputDestResBalance(val);
    }

    clickSrcResultBalance() {
        if (this.model.state === 0 || this.model.state === 2) { // Transition 1 or 4
            this.setExpectedState(1);
        } else if (this.model.state === 3 || this.model.state === 4) { // Transition 13 or 11
            this.setExpectedState(5);
        } else if (this.model.state === 6) {
            this.setExpectedState(9); // Transition 36
        } else {
            throw new Error('Unexpected state');
        }

        return super.clickSrcResultBalance();
    }

    clickDestResultBalance() {
        if (this.model.state === 0 || this.model.state === 1) { // Transition 3 or 5
            this.setExpectedState(2);
        } else if (this.model.state === 3 || this.model.state === 5) { // Transition 9
            this.setExpectedState(4);
        } else if (this.model.state === 7) {
            this.setExpectedState(8); // Transition 32 or 46
        } else {
            throw new Error('Unexpected state');
        }

        return super.clickDestResultBalance();
    }

    async toggleAccount() {
        this.model.noAccount = !this.model.noAccount;

        if (this.model.noAccount) {
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

            this.model.lastAccount_id = this.model.account.id;
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
            this.model.personAccount = App.state.getPersonAccount(
                this.model.person.id,
                this.model.account.curr_id,
            );
            if (!this.model.personAccount) {
                this.model.personAccount = {
                    balance: 0,
                    curr_id: this.model.account.curr_id,
                };
            }
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

    async changeAccountByPos(pos) {
        await this.changeAccount(this.content.account.dropDown.items[pos].id);

        return this.checkState();
    }

    async clickSrcAmount() {
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

        return super.clickSrcAmount();
    }

    changeSourceCurrency() {
        throw new Error('Unexpected action: can\'t change source currency of debt transaction');
    }

    changeDestCurrency() {
        throw new Error('Unexpected action: can\'t change destination currency of debt transaction');
    }
}
