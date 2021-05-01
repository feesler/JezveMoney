import { TestComponent } from 'jezve-test';
import { TransactionView } from '../transaction.js';
import { Currency } from '../../model/currency.js';
import {
    isValidValue,
    normalize,
    normalizeExch,
    correct,
} from '../../common.js';
import { EXPENSE } from '../../model/transaction.js';
import { App } from '../../app.js';

/** Create or update expense transaction view class */
export class ExpenseTransactionView extends TransactionView {
    async buildModel(cont) {
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

    /**
     * Set source amount value
     * State 0 or 1: source and destination currencies are the same
     * @param {number|string} val - new source amount value
     */
    setSrcAmount(val) {
        this.model.srcAmount = val;

        const newValue = isValidValue(val) ? normalize(val) : val;
        if (this.model.fSrcAmount !== newValue) {
            this.model.fSrcAmount = newValue;

            this.model.srcResBal = normalize(this.model.srcAccount.balance - this.model.fSrcAmount);
            this.model.fmtSrcResBal = this.model.srcCurr.format(this.model.srcResBal);
        }
    }

    /**
     * Set destination amount value
     * State 0 or 1: source and destination currencies are the same
     * @param {number|string} val - new destination amount value
     */
    setDestAmount(val) {
        this.model.destAmount = val;

        const newValue = isValidValue(val) ? normalize(val) : val;
        if (this.model.fDestAmount !== newValue) {
            this.model.fDestAmount = newValue;
        }
    }

    setExpectedState(stateId) {
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

    inputSrcAmount(val) {
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

        return super.inputSrcAmount(val);
    }

    async inputDestAmount(val) {
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

        return super.inputDestAmount(val);
    }

    async inputResBalance(val) {
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

    async inputExchRate(val) {
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

        return super.inputExchRate(val);
    }

    async clickSrcResultBalance() {
        if (this.model.state === 0) {
            this.setExpectedState(1);
        } else if (this.model.state === 2 || this.model.state === 3) {
            this.setExpectedState(4);
        }

        return super.clickSrcResultBalance();
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

        return super.changeSrcAccount(accountId);
    }

    async clickDestAmount() {
        if (this.model.state === 1) { // Transition 3
            this.setExpectedState(0);
        } else if (this.model.state === 3 || this.model.state === 4) { // Transition 16 or 7
            this.setExpectedState(2);
        }

        return super.clickDestAmount();
    }

    async clickExchRate() {
        this.setExpectedState(3);

        return super.clickExchRate();
    }

    async changeDestCurrency(val) {
        if (this.model.dest_curr_id === val) {
            return super.changeDestCurrency(val);
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

        return super.changeDestCurrency(val);
    }
}
