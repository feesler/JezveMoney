import { TransactionView } from '../transaction.js';
import { Currency } from '../../model/currency.js';
import {
    isValidValue,
    normalize,
    normalizeExch,
    correct,
    setParam,
} from '../../common.js';
import { TRANSFER } from '../../model/transaction.js';
import { App } from '../../app.js';
import { Component } from '../component/component.js';

// Transfer transaction view class
export class TransferTransactionView extends TransactionView {
    async buildModel(cont) {
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

        const isSrcAmountRowVisible = await Component.isVisible(cont.src_amount_row);
        const isDestAmountRowVisible = await Component.isVisible(cont.dest_amount_row);
        const isSrcResBalRowVisible = await Component.isVisible(cont.result_balance_row);
        const isDestResBalRowVisible = await Component.isVisible(cont.result_balance_dest_row);
        const isExchRowVisible = await Component.isVisible(cont.exchange_row);

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

    /**
     * Set source amount value
     * State 0, 1 or 2: source and destination currencies are the same
     * @param {number|string} val - new source amount value
     */
    setSrcAmount(val) {
        this.model.srcAmount = val;

        const newValue = isValidValue(val) ? normalize(val) : val;
        if (this.model.fSrcAmount !== newValue) {
            this.model.fSrcAmount = newValue;

            const srcRes = this.model.srcAccount.balance - this.model.fSrcAmount;
            this.model.srcResBal = normalize(srcRes);
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
        if (this.model.fDestAmount !== newValue) {
            this.model.fDestAmount = newValue;

            const destRes = this.model.destAccount.balance + this.model.fDestAmount;
            this.model.destResBal = normalize(destRes);
            this.model.fmtDestResBal = this.model.destCurr.format(this.model.destResBal);
        }
    }

    setExpectedState(stateId) {
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
            setParam(res.values, {
                src_amount_row: { label: 'Amount' },
                dest_amount_row: { label: 'Amount' },
            });
        } else {
            setParam(res.values, {
                src_amount_row: { label: 'Source amount' },
                dest_amount_row: { label: 'Destination amount' },
            });
        }

        if (newState === 0) {
            setParam(res.visibility, {
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
            setParam(res.visibility, {
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
            setParam(res.visibility, {
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
            setParam(res.visibility, {
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
            setParam(res.visibility, {
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
            setParam(res.visibility, {
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
            setParam(res.visibility, {
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
            setParam(res.visibility, {
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
            setParam(res.visibility, {
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

    inputSrcAmount(val) {
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

        return super.inputSrcAmount(val);
    }

    inputDestAmount(val) {
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

        return super.inputDestAmount(val);
    }

    inputResBalance(val) {
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

        return super.inputResBalance(val);
    }

    inputDestResBalance(val) {
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

        return super.inputDestResBalance(val);
    }

    inputExchRate(val) {
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

        return super.inputExchRate(val);
    }

    clickSrcResultBalance() {
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

        return super.clickSrcResultBalance();
    }

    clickDestResultBalance() {
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

        return super.clickDestResultBalance();
    }

    async changeSrcAccount(accountId) {
        const newAcc = App.state.accounts.getItem(accountId);

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

        if (newAcc.id === this.model.destAccount.id) {
            const nextAccountId = App.state.accounts.getNext(newAcc.id);
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

        return super.changeSrcAccount(accountId);
    }

    async changeDestAccount(accountId) {
        const newAcc = App.state.accounts.getItem(accountId);

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

        if (newAcc.id === this.model.srcAccount.id) {
            const nextAccountId = App.state.accounts.getNext(newAcc.id);
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

        return super.changeDestAccount(accountId);
    }

    clickSrcAmount() {
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

        return super.clickSrcAmount();
    }

    clickDestAmount() {
        if (this.model.state === 5 || this.model.state === 7) {
            // Transition 24 or 55
            this.setExpectedState(3);
        } else if (this.model.state === 6 || this.model.state === 8) {
            // Transition 33 or 35
            this.setExpectedState(4);
        } else {
            throw new Error(`Unexpected state ${this.model.state} for clickDestAmount action`);
        }

        return super.clickDestAmount();
    }

    clickExchRate() {
        if (this.model.state === 3 || this.model.state === 5) {
            // Transition 40 or 21
            this.setExpectedState(7);
        } else if (this.model.state === 4 || this.model.state === 6) {
            // Transition 34 or 45
            this.setExpectedState(8);
        }

        return super.clickExchRate();
    }

    /* eslint-disable-next-line no-unused-vars */
    changeSourceCurrency(val) {
        throw new Error('Unexpected action: can\'t change source currency of transfter transaction');
    }

    /* eslint-disable-next-line no-unused-vars */
    changeDestCurrency(val) {
        throw new Error('Unexpected action: can\'t change destination currency of transfter transaction');
    }
}
