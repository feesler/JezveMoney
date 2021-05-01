import { TestComponent } from 'jezve-test';
import { TransactionView } from '../TransactionView.js';
import { Currency } from '../../model/Currency.js';
import {
    isValidValue,
    normalize,
    normalizeExch,
    correct,
} from '../../common.js';
import { INCOME } from '../../model/Transaction.js';
import { App } from '../../Application.js';

// Create or update income transaction view class
export class IncomeTransactionView extends TransactionView {
    async buildModel(cont) {
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

            const destRes = this.model.destAccount.balance + this.model.fDestAmount;
            this.model.destResBal = normalize(destRes);
            this.model.fmtDestResBal = this.model.destCurr.format(this.model.destResBal);
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
                source: false,
                destination: true,
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

    async inputSrcAmount(val) {
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

        return super.inputSrcAmount(val);
    }

    async inputDestAmount(val) {
        this.setDestAmount(val);
        if (this.model.isDiffCurr) {
            this.calcExchByAmounts();
            this.updateExch();
        } else {
            this.setSrcAmount(this.model.destAmount);
        }

        this.setExpectedState(this.model.state);

        return super.inputDestAmount(val);
    }

    async inputDestResBalance(val) {
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

        return super.inputDestResBalance(val);
    }

    async inputExchRate(val) {
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

    async clickDestResultBalance() {
        if (this.model.state === 0) {
            // Transition 2
            this.setExpectedState(1);
        } else if (this.model.state === 2 || this.model.state === 3) {
            // Transition 7 or 14
            this.setExpectedState(4);
        }

        return super.clickDestResultBalance();
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

        return super.changeDestAccount(accountId);
    }

    async clickSrcAmount() {
        // Transition 4
        if (this.model.state === 1) {
            this.setExpectedState(0);
        } else {
            throw new Error(`Unexpected state ${this.model.state} for clickSrcAmount action`);
        }

        return super.clickSrcAmount();
    }

    async clickDestAmount() {
        // Transition 13 or 19
        if (this.model.state === 3 || this.model.state === 4) {
            this.setExpectedState(2);
        } else {
            throw new Error(`Unexpected state ${this.model.state} for clickDestAmount action`);
        }

        return super.clickDestAmount();
    }

    async clickExchRate() {
        // Transition 20
        this.setExpectedState(3);

        return super.clickExchRate();
    }

    async changeSourceCurrency(val) {
        if (this.model.src_curr_id === val) {
            return super.changeSourceCurrency(val);
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

        return super.changeSourceCurrency(val);
    }
}
