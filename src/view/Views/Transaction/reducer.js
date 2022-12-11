import {
    normalize,
    normalizeExch,
    isValidValue,
    dateStringToTime,
} from '../../js/utils.js';
import {
    EXPENSE,
    INCOME,
    DEBT,
    TRANSFER,
} from '../../js/model/Transaction.js';
import * as STATE from './stateId.js';
import { createSlice } from '../../js/store.js';

// Tools

/** Calculate source result balance */
export const calculateSourceResult = (state) => {
    const result = state;
    const { transaction } = result;

    const sourceAmount = transaction.src_amount;
    let sourceResult = result.form.fSourceResult;

    if (transaction.type !== DEBT) {
        if (!result.srcAccount) {
            return result;
        }

        sourceResult = normalize(result.srcAccount.balance - sourceAmount);
    } else if (result.srcAccount && !transaction.noAccount) {
        sourceResult = normalize(result.srcAccount.balance - sourceAmount);
    } else if (result.transaction.noAccount) {
        if (result.transaction.debtType) {
            sourceResult = normalize(result.personAccount.balance - sourceAmount);
        } else {
            const lastAcc = window.app.model.accounts.getItem(transaction.lastAcc_id);
            const accBalance = (lastAcc) ? lastAcc.balance : 0;
            sourceResult = normalize(accBalance - sourceAmount);
        }
    }

    if (result.form.fSourceResult !== sourceResult) {
        result.form.sourceResult = sourceResult;
        result.form.fSourceResult = sourceResult;
    }

    return result;
};

/** Calculate destination result balance */
export const calculateDestResult = (state) => {
    const result = state;
    const { transaction } = result;

    const destAmount = transaction.dest_amount;
    let destResult = result.form.fDestResult;

    if (transaction.type !== DEBT) {
        if (!result.destAccount) {
            return result;
        }

        destResult = normalize(result.destAccount.balance + destAmount);
    } else if (result.destAccount && !transaction.noAccount) {
        destResult = normalize(result.destAccount.balance + destAmount);
    } else if (transaction.noAccount) {
        if (transaction.debtType) {
            const lastAcc = window.app.model.accounts.getItem(transaction.lastAcc_id);
            const accBalance = (lastAcc) ? lastAcc.balance : 0;
            destResult = normalize(accBalance + destAmount);
        } else {
            destResult = normalize(result.personAccount.balance + destAmount);
        }
    }

    if (result.form.fDestResult !== destResult) {
        result.form.fDestResult = destResult;
        result.form.destResult = destResult;
    }

    return result;
};

/** Set new source amount and calculate source result balance */
const setStateSourceAmount = (state, amount) => {
    const result = state;

    const sourceAmount = normalize(amount);
    result.transaction.src_amount = sourceAmount;
    result.form.sourceAmount = amount;

    return calculateSourceResult(result);
};

/** Set new destination amount and calculate destination result balance */
const setStateDestAmount = (state, amount) => {
    const result = state;

    const destAmount = normalize(amount);
    result.transaction.dest_amount = destAmount;
    result.form.destAmount = amount;

    return calculateDestResult(result);
};

const setStateNextSourceAccount = (state, accountId) => {
    const { userAccounts } = window.app.model;
    const currencyModel = window.app.model.currency;
    const result = state;

    const srcAccount = userAccounts.getNextAccount(accountId);
    if (!srcAccount) {
        throw new Error('Next account not found');
    }
    result.srcAccount = srcAccount;
    result.transaction.src_id = srcAccount.id;
    result.transaction.src_curr = srcAccount.curr_id;
    result.srcCurrency = currencyModel.getItem(srcAccount.curr_id);
};

const setStateNextDestAccount = (state, accountId) => {
    const { userAccounts } = window.app.model;
    const currencyModel = window.app.model.currency;
    const result = state;

    const destAccount = userAccounts.getNextAccount(accountId);
    if (!destAccount) {
        throw new Error('Next account not found');
    }
    result.destAccount = destAccount;
    result.transaction.dest_id = destAccount.id;
    result.transaction.dest_curr = destAccount.curr_id;
    result.destCurrency = currencyModel.getItem(destAccount.curr_id);
};

const calculateSourceAmountByExchange = (state) => {
    const { useBackExchange, fExchange, fBackExchange } = state.form;
    const destination = state.transaction.dest_amount;

    if (useBackExchange) {
        return normalize(destination * fBackExchange);
    }

    return (fExchange === 0) ? 0 : normalize(destination / fExchange);
};

const calculateDestAmountByExchange = (state) => {
    const { useBackExchange, fExchange, fBackExchange } = state.form;
    const source = state.transaction.src_amount;

    if (useBackExchange) {
        return (fBackExchange === 0) ? 0 : normalize(source / fBackExchange);
    }

    return normalize(source * fExchange);
};

export const calculateExchange = (state) => {
    const source = state.transaction.src_amount;
    const destination = state.transaction.dest_amount;

    if (source === 0 || destination === 0) {
        return 1;
    }

    return normalizeExch(Math.abs(destination / source));
};

export const calculateBackExchange = (state) => {
    const source = state.transaction.src_amount;
    const destination = state.transaction.dest_amount;

    if (source === 0 || destination === 0) {
        return 1;
    }

    return normalizeExch(Math.abs(source / destination));
};

export const updateStateExchange = (state) => {
    const result = state;

    const exchange = calculateExchange(state);
    result.form.fExchange = exchange;
    result.form.exchange = exchange;

    const backExchange = calculateBackExchange(state);
    result.form.fBackExchange = backExchange;
    result.form.backExchange = backExchange;

    return result;
};

/** Search for person account in specified currency. Returns empty account object if not found */
const getPersonAccount = (personId, currencyId) => {
    const account = window.app.model.accounts.getPersonAccount(
        personId,
        currencyId,
    );

    if (account) {
        return account;
    }

    return {
        id: 0,
        balance: 0,
        curr_id: currencyId,
    };
};

// Reducers
const slice = createSlice({
    sourceAmountClick: (state) => {
        let newId = state.id;
        if (state.transaction.type === INCOME) {
            if (state.id === STATE.I_D_RESULT) {
                newId = STATE.I_S_AMOUNT;
            }
        }

        if (state.transaction.type === TRANSFER) {
            if (state.id === STATE.T_S_RESULT || state.id === STATE.T_D_RESULT) {
                newId = STATE.T_S_AMOUNT;
            } else if (state.id === STATE.T_D_AMOUNT_S_RESULT) {
                newId = STATE.T_S_AMOUNT_D_AMOUNT;
            } else if (state.id === STATE.T_S_RESULT_D_RESULT) {
                newId = STATE.T_S_AMOUNT_D_RESULT;
            } else if (state.id === STATE.T_EXCH_S_RESULT) {
                newId = STATE.T_S_AMOUNT_EXCH;
            }
        }

        if (state.transaction.type === DEBT) {
            if (state.id === STATE.DG_S_RESULT || state.id === STATE.DG_D_RESULT) {
                newId = STATE.DG_S_AMOUNT;
            } else if (state.id === STATE.DT_D_RESULT || state.id === STATE.DT_S_RESULT) {
                newId = STATE.DT_S_AMOUNT;
            } else if (state.id === STATE.DT_NOACC_D_RESULT) {
                newId = STATE.DT_NOACC_S_AMOUNT;
            } else if (state.id === STATE.DG_NOACC_S_RESULT) {
                newId = STATE.DG_NOACC_S_AMOUNT;
            }
        }

        return (newId === state.id) ? state : { ...state, id: newId };
    },

    destAmountClick: (state) => {
        let newId = state.id;
        if (state.transaction.type === EXPENSE) {
            if (state.id === STATE.E_S_RESULT) {
                newId = STATE.E_D_AMOUNT;
            } else if (
                state.id === STATE.E_S_AMOUNT_EXCH
                || state.id === STATE.E_S_AMOUNT_S_RESULT
            ) {
                newId = STATE.E_S_AMOUNT_D_AMOUNT;
            }
        }

        if (state.transaction.type === INCOME) {
            if (state.id === STATE.I_S_AMOUNT_EXCH || state.id === STATE.I_S_AMOUNT_D_RESULT) {
                newId = STATE.I_S_AMOUNT_D_AMOUNT;
            }
        }

        if (state.transaction.type === TRANSFER) {
            if (state.id === STATE.T_S_AMOUNT_D_RESULT || state.id === STATE.T_S_AMOUNT_EXCH) {
                newId = STATE.T_S_AMOUNT_D_AMOUNT;
            } else if (
                state.id === STATE.T_S_RESULT_D_RESULT
                || state.id === STATE.T_EXCH_S_RESULT
            ) {
                newId = STATE.T_D_AMOUNT_S_RESULT;
            }
        }

        return (newId === state.id) ? state : { ...state, id: newId };
    },

    sourceResultClick: (state) => {
        let newId = state.id;
        if (state.transaction.type === EXPENSE) {
            if (state.id === STATE.E_D_AMOUNT) {
                newId = STATE.E_S_RESULT;
            } else if (
                state.id === STATE.E_S_AMOUNT_D_AMOUNT
                || state.id === STATE.E_S_AMOUNT_EXCH
            ) {
                newId = STATE.E_S_AMOUNT_S_RESULT;
            }
        }

        if (state.transaction.type === TRANSFER) {
            if (state.id === STATE.T_S_AMOUNT || state.id === STATE.T_D_RESULT) {
                newId = STATE.T_S_RESULT;
            } else if (state.id === STATE.T_S_AMOUNT_D_AMOUNT) {
                newId = STATE.T_D_AMOUNT_S_RESULT;
            } else if (state.id === STATE.T_S_AMOUNT_D_RESULT) {
                newId = STATE.T_S_RESULT_D_RESULT;
            } else if (state.id === STATE.T_S_AMOUNT_EXCH) {
                newId = STATE.T_EXCH_S_RESULT;
            }
        }

        if (state.transaction.type === DEBT) {
            if (state.id === STATE.DG_S_AMOUNT || state.id === STATE.DG_D_RESULT) {
                newId = STATE.DG_S_RESULT;
            } else if (state.id === STATE.DT_S_AMOUNT || state.id === STATE.DT_D_RESULT) {
                newId = STATE.DT_S_RESULT;
            } else if (state.id === STATE.DG_NOACC_S_AMOUNT) {
                newId = STATE.DG_NOACC_S_RESULT;
            }
        }

        return (newId === state.id) ? state : { ...state, id: newId };
    },

    destResultClick: (state) => {
        let newId = state.id;
        if (state.transaction.type === INCOME) {
            if (state.id === STATE.I_S_AMOUNT) {
                newId = STATE.I_D_RESULT;
            } else if (
                state.id === STATE.I_S_AMOUNT_D_AMOUNT
                || state.id === STATE.I_S_AMOUNT_EXCH
            ) {
                newId = STATE.I_S_AMOUNT_D_RESULT;
            }
        }

        if (state.transaction.type === TRANSFER) {
            if (state.id === STATE.T_S_AMOUNT || state.id === STATE.T_S_RESULT) {
                newId = STATE.T_D_RESULT;
            } else if (
                state.id === STATE.T_S_AMOUNT_D_AMOUNT
                || state.id === STATE.T_S_AMOUNT_EXCH
            ) {
                newId = STATE.T_S_AMOUNT_D_RESULT;
            } else if (
                state.id === STATE.T_D_AMOUNT_S_RESULT
                || state.id === STATE.T_EXCH_S_RESULT
            ) {
                newId = STATE.T_S_RESULT_D_RESULT;
            }
        }

        if (state.transaction.type === DEBT) {
            if (state.id === STATE.DG_S_AMOUNT || state.id === STATE.DG_S_RESULT) {
                newId = STATE.DG_D_RESULT;
            } else if (state.id === STATE.DT_S_AMOUNT || state.id === STATE.DT_S_RESULT) {
                newId = STATE.DT_D_RESULT;
            } else if (state.id === STATE.DT_NOACC_S_AMOUNT) {
                newId = STATE.DT_NOACC_D_RESULT;
            }
        }

        return (newId === state.id) ? state : { ...state, id: newId };
    },

    exchangeClick: (state) => {
        let newId = state.id;
        if (state.transaction.type === EXPENSE) {
            newId = STATE.E_S_AMOUNT_EXCH;
        }
        if (state.transaction.type === INCOME) {
            newId = STATE.I_S_AMOUNT_EXCH;
        }
        if (state.transaction.type === TRANSFER) {
            if (state.id === STATE.T_S_AMOUNT_D_AMOUNT || state.id === STATE.T_S_AMOUNT_D_RESULT) {
                newId = STATE.T_S_AMOUNT_EXCH;
            } else if (
                state.id === STATE.T_D_AMOUNT_S_RESULT
                || state.id === STATE.T_S_RESULT_D_RESULT
            ) {
                newId = STATE.T_EXCH_S_RESULT;
            }
        }

        return (newId === state.id) ? state : { ...state, id: newId };
    },

    sourceAccountChange: (state, accountId) => {
        const availTypes = [EXPENSE, TRANSFER];
        if (
            !availTypes.includes(state.transaction.type)
            || (state.transaction.src_id === accountId)
        ) {
            return state;
        }

        const srcAccount = window.app.model.accounts.getItem(accountId);
        const srcCurrency = window.app.model.currency.getItem(srcAccount.curr_id);

        const newState = {
            ...state,
            transaction: {
                ...state.transaction,
                src_id: accountId,
                src_curr: srcAccount.curr_id,
            },
            srcAccount,
            srcCurrency,
        };
        const { transaction } = newState;

        // Update result balance of source
        calculateSourceResult(newState);

        if (transaction.type === EXPENSE) {
            // If currencies are same before account was changed
            // then copy source currency to destination
            if (state.id === STATE.E_D_AMOUNT || state.id === STATE.E_S_RESULT) {
                transaction.dest_curr = srcAccount.curr_id;
                newState.destCurrency = srcCurrency;
            }

            updateStateExchange(newState);

            newState.isDiff = transaction.src_curr !== transaction.dest_curr;
            if (!newState.isDiff) {
                const availStates = [
                    STATE.E_S_AMOUNT_D_AMOUNT,
                    STATE.E_S_AMOUNT_EXCH,
                    STATE.E_S_AMOUNT_S_RESULT,
                ];
                if (availStates.includes(newState.id)) {
                    const srcAmount = transaction.src_amount;
                    transaction.dest_amount = srcAmount;
                    newState.form.destAmount = srcAmount;
                    newState.id = (newState.id === STATE.E_S_AMOUNT_S_RESULT)
                        ? STATE.E_S_RESULT
                        : STATE.E_D_AMOUNT;
                }
            }
        }

        if (transaction.type === TRANSFER) {
            if (accountId === transaction.dest_id) {
                setStateNextDestAccount(newState, accountId);
                calculateDestResult(newState);
            }

            newState.isDiff = transaction.src_curr !== transaction.dest_curr;
            if (newState.isDiff) {
                if (newState.id === STATE.T_S_AMOUNT) {
                    newState.id = STATE.T_S_AMOUNT_D_AMOUNT;
                } else if (newState.id === STATE.T_S_RESULT) {
                    newState.id = STATE.T_D_AMOUNT_S_RESULT;
                } else if (newState.id === STATE.T_D_RESULT) {
                    newState.id = STATE.T_S_AMOUNT_D_RESULT;
                }
            } else {
                if (transaction.dest_amount !== transaction.src_amount) {
                    setStateDestAmount(newState, transaction.src_amount);
                }

                if (
                    newState.id === STATE.T_S_AMOUNT_D_AMOUNT
                    || newState.id === STATE.T_S_AMOUNT_EXCH
                ) {
                    newState.id = STATE.T_S_AMOUNT;
                } else if (
                    newState.id === STATE.T_D_AMOUNT_S_RESULT
                    || newState.id === STATE.T_S_RESULT_D_RESULT
                    || newState.id === STATE.T_EXCH_S_RESULT
                ) {
                    newState.id = STATE.T_S_RESULT;
                } else if (newState.id === STATE.T_S_AMOUNT_D_RESULT) {
                    newState.id = STATE.T_D_RESULT;
                }
            }

            updateStateExchange(newState);
        }

        return newState;
    },

    destAccountChange: (state, accountId) => {
        const availTypes = [INCOME, TRANSFER];
        if (
            !availTypes.includes(state.transaction.type)
            || state.transaction.dest_id === accountId
        ) {
            return state;
        }

        const destAccount = window.app.model.accounts.getItem(accountId);
        const destCurrency = window.app.model.currency.getItem(destAccount.curr_id);

        const newState = {
            ...state,
            transaction: {
                ...state.transaction,
                dest_id: accountId,
                dest_curr: destAccount.curr_id,
            },
            destAccount,
            destCurrency,
        };
        const { transaction } = newState;

        // Update result balance of destination
        calculateDestResult(newState);

        if (transaction.type === INCOME) {
            // If currencies are same before account was changed
            // then copy destination currency to source
            if (newState.id === 0 || newState.id === 1) {
                newState.transaction.src_curr = destAccount.curr_id;
                newState.srcCurrency = destCurrency;
            }

            updateStateExchange(newState);

            newState.isDiff = transaction.src_curr !== transaction.dest_curr;
            if (!newState.isDiff) {
                const availStates = [
                    STATE.I_S_AMOUNT_D_AMOUNT,
                    STATE.I_S_AMOUNT_EXCH,
                    STATE.I_S_AMOUNT_D_RESULT,
                ];
                if (availStates.includes(newState.id)) {
                    setStateSourceAmount(newState, transaction.dest_amount);
                    newState.id = (newState.id === STATE.I_S_AMOUNT_D_RESULT)
                        ? STATE.E_S_RESULT
                        : STATE.E_D_AMOUNT;
                }
            }
        }

        if (transaction.type === TRANSFER) {
            if (accountId === newState.transaction.src_id) {
                setStateNextSourceAccount(newState, accountId);
                calculateSourceResult(newState);
            }

            newState.isDiff = transaction.src_curr !== transaction.dest_curr;
            if (newState.isDiff) {
                if (newState.id === STATE.T_S_AMOUNT) {
                    newState.id = STATE.T_S_AMOUNT_D_AMOUNT;
                } else if (newState.id === STATE.T_S_RESULT) {
                    newState.id = STATE.T_D_AMOUNT_S_RESULT;
                } else if (newState.id === STATE.T_D_RESULT) {
                    newState.id = STATE.T_S_AMOUNT_D_RESULT;
                }
            } else {
                if (transaction.dest_amount !== transaction.src_amount) {
                    setStateDestAmount(newState, transaction.src_amount);
                }

                if (
                    newState.id === STATE.T_S_AMOUNT_D_AMOUNT
                    || newState.id === STATE.T_S_AMOUNT_EXCH
                ) {
                    newState.id = STATE.T_S_AMOUNT;
                } else if (
                    newState.id === STATE.T_D_AMOUNT_S_RESULT
                    || newState.id === STATE.T_EXCH_S_RESULT
                ) {
                    newState.id = STATE.T_S_RESULT;
                } else if (
                    newState.id === STATE.T_S_AMOUNT_D_RESULT
                    || newState.id === STATE.T_S_RESULT_D_RESULT
                ) {
                    newState.id = STATE.T_D_RESULT;
                }
            }

            updateStateExchange(newState);
        }

        return newState;
    },

    debtAccountChange: (state, accountId) => {
        if (
            state.transaction.type !== DEBT
            || (state.account && state.account.id === accountId)
        ) {
            return state;
        }

        const account = window.app.model.accounts.getItem(accountId);
        if (!account) {
            throw new Error('Invalid account');
        }
        const newState = {
            ...state,
            transaction: { ...state.transaction },
            form: { ...state.form },
            account,
        };
        const { transaction } = newState;

        // Request person account wtih the same currency as account
        if (newState.personAccount.curr_id !== account.curr_id) {
            newState.personAccount = getPersonAccount(newState.person.id, account.curr_id);
        }

        transaction.src_curr = account.curr_id;
        transaction.dest_curr = account.curr_id;
        const currency = window.app.model.currency.getItem(account.curr_id);
        newState.srcCurrency = currency;
        newState.destCurrency = currency;

        if (transaction.debtType) {
            newState.srcAccount = newState.personAccount;
            newState.destAccount = newState.account;
        } else {
            newState.srcAccount = newState.account;
            newState.destAccount = newState.personAccount;
        }

        calculateSourceResult(newState);
        calculateDestResult(newState);

        return newState;
    },

    personChange: (state, personId) => {
        if (state.transaction.type !== DEBT || state.person.id === personId) {
            return state;
        }

        const person = window.app.model.persons.getItem(personId);
        if (!person) {
            throw new Error('Invalid person');
        }

        const newState = {
            ...state,
            transaction: {
                ...state.transaction,
                person_id: person.id,
            },
            person,
        };
        const { transaction } = newState;

        const currencyId = (transaction.debtType)
            ? transaction.src_curr
            : transaction.dest_curr;
        newState.personAccount = getPersonAccount(person.id, currencyId);

        if (transaction.debtType) {
            newState.srcAccount = newState.personAccount;
            calculateSourceResult(newState);
        } else {
            newState.destAccount = newState.personAccount;
            calculateDestResult(newState);
        }

        return newState;
    },

    sourceCurrencyChange: (state, currencyId) => {
        if (state.transaction.type !== INCOME || state.transaction.src_curr === currencyId) {
            return state;
        }

        const srcCurrency = window.app.model.currency.getItem(currencyId);
        if (!srcCurrency) {
            throw new Error('Invalid currency');
        }

        const newState = {
            ...state,
            transaction: {
                ...state.transaction,
                src_curr: srcCurrency.id,
            },
            srcCurrency,
            isDiff: srcCurrency.id !== state.transaction.dest_curr,
        };

        if (newState.isDiff && newState.id === STATE.I_S_AMOUNT) {
            newState.id = STATE.I_S_AMOUNT_D_AMOUNT;
        } else if (
            newState.id === STATE.I_S_AMOUNT_D_AMOUNT
            || newState.id === STATE.I_S_AMOUNT_EXCH
            || newState.id === STATE.I_S_AMOUNT_D_RESULT
        ) {
            if (!newState.isDiff) {
                setStateDestAmount(newState, newState.transaction.src_amount);
                updateStateExchange(newState);
                newState.id = (newState.id === STATE.I_S_AMOUNT_D_RESULT)
                    ? STATE.I_D_RESULT
                    : STATE.I_S_AMOUNT;
            }
        }

        return newState;
    },

    destCurrencyChange: (state, currencyId) => {
        if (state.transaction.type !== EXPENSE || state.transaction.dest_curr === currencyId) {
            return state;
        }

        const destCurrency = window.app.model.currency.getItem(currencyId);

        const newState = {
            ...state,
            transaction: {
                ...state.transaction,
                dest_curr: destCurrency.id,
            },
            destCurrency,
            isDiff: destCurrency.id !== state.transaction.src_curr,
        };

        if (newState.isDiff && newState.id === STATE.E_D_AMOUNT) {
            newState.id = STATE.E_S_AMOUNT_D_AMOUNT;
        } else if (newState.id === STATE.E_S_AMOUNT_D_AMOUNT) {
            if (!newState.isDiff) {
                newState.id = STATE.E_D_AMOUNT;
                setStateSourceAmount(newState, newState.transaction.dest_amount);
                updateStateExchange(newState);
            }
        }

        return newState;
    },

    toggleDebtAccount: (state) => {
        if (state.transaction.type !== DEBT) {
            return state;
        }

        const newState = {
            ...state,
            transaction: {
                ...state.transaction,
                noAccount: !state.transaction.noAccount,
            },
        };
        const { transaction } = newState;

        if (transaction.noAccount) {
            if (newState.id === STATE.DG_S_AMOUNT || newState.id === STATE.DG_D_RESULT) {
                newState.id = STATE.DG_NOACC_S_AMOUNT;
            } else if (newState.id === STATE.DG_S_RESULT) {
                newState.id = STATE.DG_NOACC_S_RESULT;
            } else if (newState.id === STATE.DT_S_AMOUNT || newState.id === STATE.DT_S_RESULT) {
                newState.id = STATE.DT_NOACC_S_AMOUNT;
            } else if (newState.id === STATE.DT_D_RESULT) {
                newState.id = STATE.DT_NOACC_D_RESULT;
            }

            transaction.lastAcc_id = newState.account.id;
            newState.account = null;
        } else {
            newState.account = window.app.model.accounts.getItem(transaction.lastAcc_id);
            if (!newState.account) {
                throw new Error('Account not found');
            }

            if (transaction.debtType) {
                newState.destAccount = newState.account;
            } else {
                newState.srcAccount = newState.account;
            }

            if (newState.id === STATE.DG_NOACC_S_AMOUNT) {
                newState.id = STATE.DG_S_AMOUNT;
            } else if (newState.id === STATE.DT_NOACC_S_AMOUNT) {
                newState.id = STATE.DT_S_AMOUNT;
            } else if (newState.id === STATE.DT_NOACC_D_RESULT) {
                newState.id = STATE.DT_D_RESULT;
            } else if (newState.id === STATE.DG_NOACC_S_RESULT) {
                newState.id = STATE.DG_S_RESULT;
            }
        }

        if (transaction.debtType) {
            calculateDestResult(newState);
        } else {
            calculateSourceResult(newState);
        }

        return newState;
    },

    sourceAmountChange: (state, value) => {
        const newState = {
            ...state,
            validation: {
                ...state.validation,
                sourceAmount: true,
            },
            form: {
                ...state.form,
                sourceAmount: value,
            },
        };

        const newValue = normalize(value);
        if (newState.transaction.src_amount === newValue) {
            return newState;
        }

        newState.transaction.src_amount = newValue;

        if (newState.transaction.type === EXPENSE) {
            calculateSourceResult(newState);
            updateStateExchange(newState);
        }

        if (newState.transaction.type === INCOME) {
            if (newState.isDiff) {
                if (isValidValue(newState.form.destAmount)) {
                    updateStateExchange(newState);
                }
            } else {
                setStateDestAmount(newState, newValue);
            }
        }

        if (newState.transaction.type === TRANSFER) {
            calculateSourceResult(newState);
            if (newState.isDiff) {
                updateStateExchange(newState);
            } else {
                setStateDestAmount(newState, newValue);
            }
        }

        if (newState.transaction.type === DEBT) {
            calculateSourceResult(newState);
            setStateDestAmount(newState, newValue);
        }

        return newState;
    },

    destAmountChange: (state, value) => {
        if (state.transaction.type === DEBT) {
            return state;
        }

        const newState = {
            ...state,
            validation: {
                ...state.validation,
                destAmount: true,
            },
            form: {
                ...state.form,
                destAmount: value,
            },
        };

        const newValue = normalize(value);
        if (newState.transaction.dest_amount === newValue) {
            return newState;
        }

        newState.transaction.dest_amount = newValue;

        if (newState.transaction.type === EXPENSE) {
            if (newState.isDiff) {
                if (isValidValue(newState.form.sourceAmount)) {
                    updateStateExchange(newState);
                }
            } else {
                setStateSourceAmount(newState, newValue);
            }
        }

        if (newState.transaction.type === INCOME) {
            calculateDestResult(newState);
            if (newState.isDiff) {
                updateStateExchange(newState);
            } else {
                setStateSourceAmount(newState, newValue);
            }
        }

        if (newState.transaction.type === TRANSFER) {
            calculateDestResult(newState);
            if (newState.isDiff) {
                updateStateExchange(newState);
            } else {
                setStateSourceAmount(newState, newValue);
            }
        }

        return newState;
    },

    sourceResultChange: (state, value) => {
        if (state.transaction.type === INCOME) {
            return state;
        }

        const newState = {
            ...state,
            form: {
                ...state.form,
                sourceResult: value,
            },
        };

        const newValue = normalize(value);
        if (newState.form.fSourceResult === newValue) {
            return newState;
        }

        newState.form.fSourceResult = newValue;
        const srcAmount = normalize(newState.srcAccount.balance - newValue);
        newState.transaction.src_amount = srcAmount;
        newState.form.sourceAmount = srcAmount;

        if (newState.transaction.type === EXPENSE) {
            if (newState.isDiff) {
                updateStateExchange(newState);
            } else {
                newState.transaction.dest_amount = srcAmount;
                newState.form.destAmount = srcAmount;
            }
        }

        if (newState.transaction.type === TRANSFER) {
            if (newState.isDiff) {
                updateStateExchange(newState);
            } else {
                setStateDestAmount(newState, srcAmount);
            }
        }

        if (newState.transaction.type === DEBT) {
            setStateDestAmount(newState, srcAmount);
        }

        return newState;
    },

    destResultChange: (state, value) => {
        if (state.transaction.type === EXPENSE) {
            return state;
        }

        const newState = {
            ...state,
            form: {
                ...state.form,
                destResult: value,
            },
        };

        const newValue = normalize(value);
        if (newState.form.fDestResult === newValue) {
            return newState;
        }

        newState.form.fDestResult = newValue;
        if (newState.transaction.type === INCOME) {
            const srcAmount = normalize(newValue - newState.destAccount.balance);
            newState.transaction.src_amount = srcAmount;
            newState.form.sourceAmount = srcAmount;

            if (newState.isDiff) {
                updateStateExchange(newState);
            } else {
                setStateDestAmount(newState, srcAmount);
            }
        }

        if (newState.transaction.type === TRANSFER) {
            const destAmount = normalize(newValue - newState.destAccount.balance);
            newState.transaction.dest_amount = destAmount;
            newState.form.destAmount = destAmount;

            if (newState.isDiff) {
                updateStateExchange(newState);
            } else {
                setStateSourceAmount(newState, destAmount);
            }
        }

        if (newState.transaction.type === DEBT) {
            const destAmount = normalize(newValue - newState.destAccount.balance);
            newState.transaction.dest_amount = destAmount;
            newState.form.destAmount = destAmount;

            setStateSourceAmount(newState, destAmount);
        }

        return newState;
    },

    exchangeChange: (state, value) => {
        const { transaction } = state;
        const { useBackExchange } = state.form;

        if (transaction.type === DEBT) {
            return state;
        }

        const newState = {
            ...state,
            form: { ...state.form },
        };

        if (useBackExchange) {
            newState.form.backExchange = value;
        } else {
            newState.form.exchange = value;
        }

        const newValue = normalizeExch(value);
        if (
            (useBackExchange && newState.form.fBackExchange === newValue)
            || (!useBackExchange && newState.form.fExchange === newValue)
        ) {
            return newState;
        }

        if (useBackExchange) {
            newState.form.fBackExchange = newValue;
        } else {
            newState.form.fExchange = newValue;
        }

        if (isValidValue(newState.form.sourceAmount)) {
            const destAmount = calculateDestAmountByExchange(newState);
            setStateDestAmount(newState, destAmount);
        } else if (isValidValue(newState.form.destAmount)) {
            const srcAmount = calculateSourceAmountByExchange(newState);
            setStateSourceAmount(newState, srcAmount);
        }

        if (useBackExchange) {
            const exchange = calculateExchange(state);
            newState.form.fExchange = exchange;
            newState.form.exchange = exchange;
        } else {
            const backExchange = calculateBackExchange(state);
            newState.form.fBackExchange = backExchange;
            newState.form.backExchange = backExchange;
        }

        return newState;
    },

    toggleExchange: (state) => {
        if (state.transaction.type === DEBT) {
            return state;
        }

        const newState = {
            ...state,
            form: {
                ...state.form,
                useBackExchange: !state.form.useBackExchange,
            },
        };

        return newState;
    },

    dateChange: (state, value) => ({
        ...state,
        transaction: {
            ...state.transaction,
            date: dateStringToTime(value),
        },
        form: {
            ...state.form,
            date: value,
        },
        validation: {
            ...state.validation,
            date: true,
        },
    }),

    categoryChange: (state, value) => ({
        ...state,
        transaction: {
            ...state.transaction,
            category_id: value,
        },
    }),

    commentChange: (state, value) => ({
        ...state,
        transaction: {
            ...state.transaction,
            comment: value,
        },
        form: {
            ...state.form,
            comment: value,
        },
    }),

    invalidateSourceAmount: (state) => ({
        ...state,
        validation: {
            ...state.validation,
            sourceAmount: false,
        },
    }),

    invalidateDestAmount: (state) => ({
        ...state,
        validation: {
            ...state.validation,
            destAmount: false,
        },
    }),

    invalidateDate: (state) => ({
        ...state,
        validation: {
            ...state.validation,
            date: false,
        },
    }),

    typeChange: (state, type) => {
        const accountModel = window.app.model.accounts;
        const currencyModel = window.app.model.currency;
        const { userAccounts, persons } = window.app.model;

        if (state.transaction.type === type) {
            return state;
        }

        const newState = {
            ...state,
            transaction: {
                ...state.transaction,
                type,
            },
            form: {
                ...state.form,
            },
        };
        const { transaction } = newState;

        // Check availability of selected type of transaction
        if (type === EXPENSE || type === INCOME) {
            newState.isAvailable = userAccounts.length > 0;
        } else if (type === TRANSFER) {
            newState.isAvailable = userAccounts.length > 1;
        } else if (type === DEBT) {
            newState.isAvailable = persons.length > 0;
        }

        if (!newState.isAvailable) {
            return newState;
        }

        const currentType = state.transaction.type;

        if (type === EXPENSE) {
            transaction.dest_id = 0;
            newState.destAccount = null;

            if (!state.isAvailable) {
                newState.id = STATE.E_D_AMOUNT;

                const srcAccount = userAccounts.getItemByIndex(0);
                const srcCurrency = currencyModel.getItem(srcAccount.curr_id);
                const destCurrency = currencyModel.getItem(srcAccount.curr_id);

                transaction.src_id = srcAccount.id;
                transaction.src_curr = srcCurrency.id;
                transaction.dest_curr = srcCurrency.id;

                newState.srcAccount = srcAccount;
                newState.srcCurrency = srcCurrency;
                newState.destCurrency = destCurrency;

                setStateSourceAmount(newState, state.form.sourceAmount);
                setStateDestAmount(newState, state.form.destAmountz);
                updateStateExchange(newState);
            } else if (currentType === INCOME) {
                transaction.src_id = state.transaction.dest_id;
                transaction.src_curr = state.transaction.dest_curr;
                transaction.dest_curr = state.transaction.src_curr;

                const srcAccount = accountModel.getItem(transaction.src_id);
                const srcCurrency = currencyModel.getItem(transaction.src_curr);
                const destCurrency = currencyModel.getItem(srcAccount.curr_id);

                newState.srcAccount = srcAccount;
                newState.srcCurrency = srcCurrency;
                newState.destCurrency = destCurrency;

                setStateSourceAmount(newState, state.form.destAmount);
                setStateDestAmount(newState, state.form.sourceAmount);
            } else if (currentType === TRANSFER) {
                newState.id = STATE.E_D_AMOUNT;
                transaction.dest_curr = transaction.src_curr;
                newState.destCurrency = newState.srcCurrency;

                setStateSourceAmount(newState, state.form.sourceAmount);
                setStateDestAmount(newState, state.form.sourceAmount);
            } else if (currentType === DEBT) {
                const fromAccount = (state.account)
                    ? state.account
                    : userAccounts.getItemByIndex(0);

                newState.id = STATE.E_D_AMOUNT;
                newState.srcAccount = fromAccount;
                transaction.src_id = fromAccount.id;
                transaction.src_curr = fromAccount.curr_id;
                transaction.dest_curr = fromAccount.curr_id;
                newState.srcCurrency = currencyModel.getItem(fromAccount.curr_id);
                newState.destCurrency = newState.srcCurrency;

                calculateSourceResult(newState);
            }

            if (state.isAvailable) {
                updateStateExchange(newState);
            }

            newState.isDiff = transaction.src_curr !== transaction.dest_curr;
        }

        if (type === INCOME) {
            transaction.src_id = 0;
            newState.srcAccount = null;

            if (!state.isAvailable) {
                newState.id = STATE.I_S_AMOUNT;

                const destAccount = userAccounts.getItemByIndex(0);
                const srcCurrency = currencyModel.getItem(destAccount.curr_id);
                const destCurrency = currencyModel.getItem(destAccount.curr_id);

                transaction.dest_id = destAccount.id;
                transaction.src_curr = srcCurrency.id;
                transaction.dest_curr = destCurrency.id;

                newState.destAccount = destAccount;
                newState.srcCurrency = srcCurrency;
                newState.destCurrency = destCurrency;

                setStateSourceAmount(newState, state.form.sourceAmount);
                setStateDestAmount(newState, state.form.sourceAmount);
                updateStateExchange(newState);
            } else if (currentType === EXPENSE) {
                transaction.dest_id = state.transaction.src_id;
                transaction.src_curr = state.transaction.dest_curr;
                transaction.dest_curr = state.transaction.src_curr;

                const destAccount = accountModel.getItem(transaction.dest_id);
                const srcCurrency = currencyModel.getItem(transaction.src_curr);
                const destCurrency = currencyModel.getItem(transaction.dest_curr);

                newState.srcCurrency = srcCurrency;
                newState.destAccount = destAccount;
                newState.destCurrency = destCurrency;

                setStateSourceAmount(newState, state.form.sourceAmount);
                setStateDestAmount(newState, state.form.destAmount);
            } else if (currentType === TRANSFER) {
                newState.id = STATE.I_S_AMOUNT;
                transaction.src_curr = transaction.dest_curr;
                newState.srcCurrency = newState.destCurrency;

                setStateSourceAmount(newState, state.form.destAmount);
                setStateDestAmount(newState, state.form.destAmount);
            } else if (currentType === DEBT) {
                const fromAccount = (state.account)
                    ? state.account
                    : userAccounts.getItemByIndex(0);

                newState.id = STATE.I_S_AMOUNT;
                newState.destAccount = fromAccount;
                transaction.dest_id = fromAccount.id;
                transaction.dest_curr = fromAccount.curr_id;
                transaction.src_curr = fromAccount.curr_id;
                newState.destCurrency = currencyModel.getItem(fromAccount.curr_id);
                newState.srcCurrency = newState.destCurrency;

                calculateDestResult(newState);
            }

            if (state.isAvailable) {
                updateStateExchange(newState);
            }

            newState.isDiff = transaction.src_curr !== transaction.dest_curr;
        }

        if (type === TRANSFER) {
            if (currentType === EXPENSE) {
                setStateNextDestAccount(newState, transaction.src_id);
            } else if (currentType === INCOME) {
                setStateNextSourceAccount(newState, transaction.dest_id);
            } else if (currentType === DEBT) {
                if (!state.isAvailable) {
                    const srcAccount = userAccounts.getItemByIndex(0);
                    const srcCurrency = currencyModel.getItem(srcAccount.curr_id);

                    transaction.src_id = srcAccount.id;
                    transaction.src_curr = srcCurrency.id;

                    newState.srcAccount = srcAccount;
                    newState.srcCurrency = srcCurrency;

                    setStateNextDestAccount(newState, transaction.src_id);
                } else if (state.account && transaction.debtType) {
                    newState.destAccount = state.account;
                    transaction.dest_id = state.account.id;
                    transaction.dest_curr = state.account.curr_id;
                    newState.destCurrency = currencyModel.getItem(state.account.curr_id);

                    setStateNextSourceAccount(newState, transaction.dest_id);
                } else {
                    const srcAccount = (state.account)
                        ? state.account
                        : userAccounts.getItemByIndex(0);

                    newState.srcAccount = srcAccount;
                    transaction.src_id = srcAccount.id;
                    transaction.src_curr = srcAccount.curr_id;
                    newState.srcCurrency = currencyModel.getItem(srcAccount.curr_id);

                    setStateNextDestAccount(newState, transaction.src_id);
                }
            }

            newState.isDiff = transaction.src_curr !== transaction.dest_curr;
            newState.id = (newState.isDiff) ? STATE.T_S_AMOUNT_D_AMOUNT : STATE.T_S_AMOUNT;

            setStateSourceAmount(newState, state.form.sourceAmount);
            setStateDestAmount(newState, state.form.destAmount);
            updateStateExchange(newState);
        }

        if (type === DEBT) {
            const person = persons.getItemByIndex(0);
            newState.person = person;
            transaction.person_id = person.id;

            if (!state.isAvailable) {
                transaction.debtType = true;
                const srcCurrency = currencyModel.getItemByIndex(0);
                newState.srcCurrency = srcCurrency;
                newState.destCurrency = srcCurrency;

                transaction.src_curr = srcCurrency.id;
                transaction.dest_curr = srcCurrency.id;

                newState.account = null;
                transaction.noAccount = true;
            } else if (currentType === EXPENSE || currentType === TRANSFER) {
                transaction.debtType = false;
                newState.account = state.srcAccount;
                transaction.src_id = state.srcAccount.id;
                transaction.src_curr = state.srcAccount.curr_id;
                transaction.dest_curr = state.srcAccount.curr_id;

                transaction.noAccount = false;
            } else if (currentType === INCOME) {
                transaction.debtType = true;
                newState.account = state.destAccount;
                transaction.dest_id = state.destAccount.id;
                transaction.src_curr = state.destAccount.curr_id;
                transaction.dest_curr = state.destAccount.curr_id;

                transaction.noAccount = false;
            }

            newState.srcCurrency = currencyModel.getItem(transaction.src_curr);
            newState.destCurrency = currencyModel.getItem(transaction.dest_curr);

            newState.personAccount = getPersonAccount(person.id, transaction.src_curr);
            if (transaction.debtType) {
                newState.srcAccount = newState.personAccount;
                transaction.src_id = newState.personAccount.id;
            } else {
                newState.destAccount = newState.personAccount;
                transaction.dest_id = newState.personAccount.id;
            }

            newState.isDiff = transaction.src_curr !== transaction.dest_curr;
            if (transaction.noAccount) {
                newState.id = (transaction.debtType)
                    ? STATE.DG_NOACC_S_AMOUNT
                    : STATE.DT_NOACC_S_AMOUNT;
            } else {
                newState.id = (transaction.debtType)
                    ? STATE.DG_S_AMOUNT
                    : STATE.DT_S_AMOUNT;
            }

            setStateSourceAmount(newState, state.form.sourceAmount);
            setStateDestAmount(newState, state.form.destAmount);
            updateStateExchange(newState);
        }

        // Delete Debt specific fields
        if (currentType === DEBT) {
            delete newState.account;
            delete newState.person;
            delete newState.personAccount;
            delete transaction.debtType;
            delete transaction.noAccount;
            delete transaction.lastAcc_id;
        }

        return newState;
    },

    swapSourceAndDest: (state) => {
        if (state.transaction.type === EXPENSE || state.transaction.type === INCOME) {
            return state;
        }

        const newState = {
            ...state,
            transaction: {
                ...state.transaction,
            },
            form: {
                ...state.form,
            },
        };

        newState.transaction.src_id = state.transaction.dest_id;
        newState.transaction.src_curr = state.transaction.dest_curr;
        newState.transaction.src_amount = state.transaction.dest_amount;
        newState.form.sourceAmount = state.form.destAmount;
        newState.srcAccount = state.destAccount;
        newState.srcCurrency = state.destCurrency;

        newState.transaction.dest_id = state.transaction.src_id;
        newState.transaction.dest_curr = state.transaction.src_curr;
        newState.transaction.dest_amount = state.transaction.src_amount;
        newState.form.destAmount = state.form.sourceAmount;
        newState.destAccount = state.srcAccount;
        newState.destCurrency = state.srcCurrency;

        if (newState.transaction.type === DEBT) {
            const debtType = !state.transaction.debtType;
            newState.transaction.debtType = debtType;

            if (debtType) {
                if (newState.id === STATE.DT_S_AMOUNT) {
                    newState.id = STATE.DG_S_AMOUNT;
                } else if (newState.id === STATE.DT_D_RESULT) {
                    newState.id = STATE.DG_S_RESULT;
                } else if (newState.id === STATE.DT_S_RESULT) {
                    newState.id = STATE.DG_D_RESULT;
                } else if (newState.id === STATE.DT_NOACC_S_AMOUNT) {
                    newState.id = STATE.DG_NOACC_S_AMOUNT;
                } else if (newState.id === STATE.DT_NOACC_D_RESULT) {
                    newState.id = STATE.DG_NOACC_S_RESULT;
                }
            } else if (newState.id === STATE.DG_S_AMOUNT) {
                newState.id = STATE.DT_S_AMOUNT;
            } else if (newState.id === STATE.DG_S_RESULT) {
                newState.id = STATE.DT_D_RESULT;
            } else if (newState.id === STATE.DG_D_RESULT) {
                newState.id = STATE.DT_S_RESULT;
            } else if (newState.id === STATE.DG_NOACC_S_AMOUNT) {
                newState.id = STATE.DT_NOACC_S_AMOUNT;
            } else if (newState.id === STATE.DG_NOACC_S_RESULT) {
                newState.id = STATE.DT_NOACC_D_RESULT;
            }
        }

        calculateSourceResult(newState);
        calculateDestResult(newState);
        updateStateExchange(newState);

        return newState;
    },

    startSubmit: (state) => ({ ...state, submitStarted: true }),

    cancelSubmit: (state) => ({ ...state, submitStarted: false }),
});

export const { actions, reducer } = slice;
