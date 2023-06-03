import { asArray, isObject } from 'jezvejs';
import { createSlice } from 'jezvejs/Store';
import {
    normalize,
    normalizeExch,
    isValidValue,
    dateStringToTime,
} from '../../utils/utils.js';
import {
    EXPENSE,
    INCOME,
    DEBT,
    TRANSFER,
    LIMIT_CHANGE,
} from '../../Models/Transaction.js';
import * as STATE from './stateId.js';
import { ACCOUNT_TYPE_CREDIT_CARD } from '../../Models/Account.js';
import { INTERVAL_NONE } from '../../Models/ScheduledTransaction.js';

// Tools

/** Calculate source result balance */
export const calculateSourceResult = (state) => {
    const result = state;
    const { transaction } = result;
    const precision = result.srcCurrency?.precision;

    const sourceAmount = transaction.src_amount;
    let sourceResult = result.form.fSourceResult;

    if (transaction.type !== DEBT) {
        if (!result.srcAccount) {
            return result;
        }

        sourceResult = normalize(result.srcAccount.balance - sourceAmount, precision);
    } else if (result.srcAccount && !transaction.noAccount) {
        sourceResult = normalize(result.srcAccount.balance - sourceAmount, precision);
    } else if (result.transaction.noAccount) {
        if (result.transaction.debtType) {
            sourceResult = normalize(result.personAccount.balance - sourceAmount, precision);
        } else {
            const lastAcc = window.app.model.accounts.getItem(transaction.lastAcc_id);
            const accBalance = (lastAcc) ? lastAcc.balance : 0;
            sourceResult = normalize(accBalance - sourceAmount, precision);
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
    const precision = result.destCurrency?.precision;

    const destAmount = transaction.dest_amount;
    let destResult = result.form.fDestResult;

    if (transaction.type !== DEBT) {
        if (!result.destAccount) {
            return result;
        }

        destResult = normalize(result.destAccount.balance + destAmount, precision);
    } else if (result.destAccount && !transaction.noAccount) {
        destResult = normalize(result.destAccount.balance + destAmount, precision);
    } else if (transaction.noAccount) {
        if (transaction.debtType) {
            const lastAcc = window.app.model.accounts.getItem(transaction.lastAcc_id);
            const accBalance = (lastAcc) ? lastAcc.balance : 0;
            destResult = normalize(accBalance + destAmount, precision);
        } else {
            destResult = normalize(result.personAccount.balance + destAmount, precision);
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
    const precision = result.srcCurrency?.precision;

    const sourceAmount = normalize(amount, precision);
    result.transaction.src_amount = sourceAmount;
    result.form.sourceAmount = amount;

    return calculateSourceResult(result);
};

/** Set new destination amount and calculate destination result balance */
const setStateDestAmount = (state, amount) => {
    const result = state;
    const precision = result.destCurrency?.precision;

    const destAmount = normalize(amount, precision);
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
    const precision = state.srcCurrency?.precision;

    if (useBackExchange) {
        return normalize(destination * fBackExchange, precision);
    }

    return (fExchange === 0) ? 0 : normalize(destination / fExchange, precision);
};

const calculateDestAmountByExchange = (state) => {
    const { useBackExchange, fExchange, fBackExchange } = state.form;
    const source = state.transaction.src_amount;
    const precision = state.destCurrency?.precision;

    if (useBackExchange) {
        return (fBackExchange === 0) ? 0 : normalize(source / fBackExchange, precision);
    }

    return normalize(source * fExchange, precision);
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

const stateTransition = (state, stateMap, throwOnNotFound = true) => {
    if (!state || !stateMap) {
        throw new Error('Invalid parameters');
    }

    if (!isObject(stateMap)) {
        return stateMap;
    }
    const res = stateMap[state.id];
    if (typeof res === 'undefined') {
        if (throwOnNotFound) {
            throw new Error('Invalid state');
        } else {
            return state.id;
        }
    }

    return res;
};

const stateTransitionByType = (state, stateMap, throwOnNotFound = true) => {
    if (!state || !stateMap) {
        throw new Error('Invalid parameters');
    }

    const typeMap = stateMap[state.transaction.type];
    if (typeof typeMap === 'undefined') {
        if (throwOnNotFound) {
            throw new Error('Invalid transaction type');
        } else {
            return state.id;
        }
    }

    return stateTransition(state, typeMap, throwOnNotFound);
};

// Reducers
const slice = createSlice({
    sourceAmountClick: (state) => {
        const stateMap = {
            [STATE.I_D_RESULT]: STATE.I_S_AMOUNT,
            [STATE.T_S_RESULT]: STATE.T_S_AMOUNT,
            [STATE.T_D_RESULT]: STATE.T_S_AMOUNT,
            [STATE.T_D_AMOUNT_S_RESULT]: STATE.T_S_AMOUNT_D_AMOUNT,
            [STATE.T_S_RESULT_D_RESULT]: STATE.T_S_AMOUNT_D_RESULT,
            [STATE.T_EXCH_S_RESULT]: STATE.T_S_AMOUNT_EXCH,
            [STATE.DG_S_RESULT]: STATE.DG_S_AMOUNT,
            [STATE.DG_D_RESULT]: STATE.DG_S_AMOUNT,
            [STATE.DG_NOACC_S_RESULT]: STATE.DG_NOACC_S_AMOUNT,
            [STATE.DG_D_AMOUNT_S_RESULT]: STATE.DG_S_AMOUNT_D_AMOUNT,
            [STATE.DG_S_RESULT_EXCH]: STATE.DG_S_AMOUNT_EXCH,
            [STATE.DG_S_RESULT_D_RESULT]: STATE.DG_S_AMOUNT_D_RESULT,
            [STATE.DT_D_AMOUNT_S_RESULT]: STATE.DT_S_AMOUNT_D_AMOUNT,
            [STATE.DT_D_AMOUNT_EXCH]: STATE.DT_S_AMOUNT_D_AMOUNT,
            [STATE.DT_S_RESULT_D_RESULT]: STATE.DT_S_AMOUNT_D_RESULT,
            [STATE.DT_D_RESULT_EXCH]: STATE.DT_S_AMOUNT_D_RESULT,
        };

        const newId = stateTransition(state, stateMap);
        return (newId === state.id) ? state : { ...state, id: newId };
    },

    destAmountClick: (state) => {
        const stateMap = {
            [STATE.E_S_RESULT]: STATE.E_D_AMOUNT,
            [STATE.E_S_AMOUNT_EXCH]: STATE.E_S_AMOUNT_D_AMOUNT,
            [STATE.E_S_AMOUNT_S_RESULT]: STATE.E_S_AMOUNT_D_AMOUNT,
            [STATE.I_S_AMOUNT_EXCH]: STATE.I_S_AMOUNT_D_AMOUNT,
            [STATE.I_S_AMOUNT_D_RESULT]: STATE.I_S_AMOUNT_D_AMOUNT,
            [STATE.T_S_AMOUNT_D_RESULT]: STATE.T_S_AMOUNT_D_AMOUNT,
            [STATE.T_S_AMOUNT_EXCH]: STATE.T_S_AMOUNT_D_AMOUNT,
            [STATE.T_S_RESULT_D_RESULT]: STATE.T_D_AMOUNT_S_RESULT,
            [STATE.T_EXCH_S_RESULT]: STATE.T_D_AMOUNT_S_RESULT,
            [STATE.DT_D_RESULT]: STATE.DT_D_AMOUNT,
            [STATE.DT_S_RESULT]: STATE.DT_D_AMOUNT,
            [STATE.DG_S_AMOUNT_EXCH]: STATE.DG_S_AMOUNT_D_AMOUNT,
            [STATE.DG_S_RESULT_EXCH]: STATE.DG_D_AMOUNT_S_RESULT,
            [STATE.DG_S_AMOUNT_D_RESULT]: STATE.DG_S_AMOUNT_D_AMOUNT,
            [STATE.DT_NOACC_D_RESULT]: STATE.DT_NOACC_D_AMOUNT,
            [STATE.DT_S_RESULT_D_RESULT]: STATE.DT_D_AMOUNT_S_RESULT,
            [STATE.DT_D_RESULT_EXCH]: STATE.DT_D_AMOUNT_EXCH,
            [STATE.DG_S_RESULT_D_RESULT]: STATE.DG_D_AMOUNT_S_RESULT,
            [STATE.DT_S_AMOUNT_D_RESULT]: STATE.DT_S_AMOUNT_D_AMOUNT,
            [STATE.L_RESULT]: STATE.L_AMOUNT,
        };

        const newId = stateTransition(state, stateMap);
        return (newId === state.id) ? state : { ...state, id: newId };
    },

    sourceResultClick: (state) => {
        const stateMap = {
            [STATE.E_D_AMOUNT]: STATE.E_S_RESULT,
            [STATE.E_S_AMOUNT_D_AMOUNT]: STATE.E_S_AMOUNT_S_RESULT,
            [STATE.E_S_AMOUNT_EXCH]: STATE.E_S_AMOUNT_S_RESULT,
            [STATE.T_S_AMOUNT]: STATE.T_S_RESULT,
            [STATE.T_D_RESULT]: STATE.T_S_RESULT,
            [STATE.T_S_AMOUNT_D_AMOUNT]: STATE.T_D_AMOUNT_S_RESULT,
            [STATE.T_S_AMOUNT_D_RESULT]: STATE.T_S_RESULT_D_RESULT,
            [STATE.T_S_AMOUNT_EXCH]: STATE.T_EXCH_S_RESULT,
            [STATE.DG_S_AMOUNT]: STATE.DG_S_RESULT,
            [STATE.DG_D_RESULT]: STATE.DG_S_RESULT,
            [STATE.DT_D_AMOUNT]: STATE.DT_S_RESULT,
            [STATE.DT_D_RESULT]: STATE.DT_S_RESULT,
            [STATE.DG_NOACC_S_AMOUNT]: STATE.DG_NOACC_S_RESULT,
            [STATE.DT_S_AMOUNT_D_AMOUNT]: STATE.DT_D_AMOUNT_S_RESULT,
            [STATE.DT_S_AMOUNT_D_RESULT]: STATE.DT_S_RESULT_D_RESULT,
            [STATE.DT_D_RESULT_EXCH]: STATE.DT_S_RESULT_D_RESULT,
            [STATE.DT_D_AMOUNT_EXCH]: STATE.DT_D_AMOUNT_S_RESULT,
            [STATE.DG_S_AMOUNT_EXCH]: STATE.DG_S_RESULT_EXCH,
            [STATE.DG_S_AMOUNT_D_RESULT]: STATE.DG_S_RESULT_D_RESULT,
            [STATE.DG_S_AMOUNT_D_AMOUNT]: STATE.DG_D_AMOUNT_S_RESULT,
        };

        const newId = stateTransition(state, stateMap);
        return (newId === state.id) ? state : { ...state, id: newId };
    },

    destResultClick: (state) => {
        const stateMap = {
            [STATE.I_S_AMOUNT]: STATE.I_D_RESULT,
            [STATE.I_S_AMOUNT_D_AMOUNT]: STATE.I_S_AMOUNT_D_RESULT,
            [STATE.I_S_AMOUNT_EXCH]: STATE.I_S_AMOUNT_D_RESULT,
            [STATE.T_S_AMOUNT]: STATE.T_D_RESULT,
            [STATE.T_S_RESULT]: STATE.T_D_RESULT,
            [STATE.T_S_AMOUNT_D_AMOUNT]: STATE.T_S_AMOUNT_D_RESULT,
            [STATE.T_S_AMOUNT_EXCH]: STATE.T_S_AMOUNT_D_RESULT,
            [STATE.T_D_AMOUNT_S_RESULT]: STATE.T_S_RESULT_D_RESULT,
            [STATE.T_EXCH_S_RESULT]: STATE.T_S_RESULT_D_RESULT,
            [STATE.DG_S_AMOUNT]: STATE.DG_D_RESULT,
            [STATE.DG_S_RESULT]: STATE.DG_D_RESULT,
            [STATE.DT_D_AMOUNT]: STATE.DT_D_RESULT,
            [STATE.DT_S_RESULT]: STATE.DT_D_RESULT,
            [STATE.DT_NOACC_D_AMOUNT]: STATE.DT_NOACC_D_RESULT,
            [STATE.DG_S_AMOUNT_D_AMOUNT]: STATE.DG_S_AMOUNT_D_RESULT,
            [STATE.DG_S_AMOUNT_EXCH]: STATE.DG_S_AMOUNT_D_RESULT,
            [STATE.DG_D_AMOUNT_S_RESULT]: STATE.DG_S_RESULT_D_RESULT,
            [STATE.DT_S_AMOUNT_D_AMOUNT]: STATE.DT_S_AMOUNT_D_RESULT,
            [STATE.DT_D_AMOUNT_EXCH]: STATE.DT_D_RESULT_EXCH,
            [STATE.DT_D_AMOUNT_S_RESULT]: STATE.DT_S_RESULT_D_RESULT,
            [STATE.DG_S_RESULT_EXCH]: STATE.DG_S_RESULT_D_RESULT,
            [STATE.L_AMOUNT]: STATE.L_RESULT,
        };

        const newId = stateTransition(state, stateMap);
        return (newId === state.id) ? state : { ...state, id: newId };
    },

    exchangeClick: (state) => {
        const stateMap = {
            [EXPENSE]: STATE.E_S_AMOUNT_EXCH,
            [INCOME]: STATE.I_S_AMOUNT_EXCH,
            [TRANSFER]: {
                [STATE.T_S_AMOUNT_D_AMOUNT]: STATE.T_S_AMOUNT_EXCH,
                [STATE.T_S_AMOUNT_D_RESULT]: STATE.T_S_AMOUNT_EXCH,
                [STATE.T_D_AMOUNT_S_RESULT]: STATE.T_EXCH_S_RESULT,
                [STATE.T_S_RESULT_D_RESULT]: STATE.T_EXCH_S_RESULT,
            },
            [DEBT]: {
                [STATE.DG_S_AMOUNT_D_AMOUNT]: STATE.DG_S_AMOUNT_EXCH,
                [STATE.DG_D_AMOUNT_S_RESULT]: STATE.DG_S_RESULT_EXCH,
                [STATE.DG_S_AMOUNT_D_RESULT]: STATE.DG_S_AMOUNT_EXCH,
                [STATE.DG_S_RESULT_D_RESULT]: STATE.DG_S_RESULT_EXCH,
                [STATE.DT_S_AMOUNT_D_AMOUNT]: STATE.DT_D_AMOUNT_EXCH,
                [STATE.DT_S_AMOUNT_D_RESULT]: STATE.DT_D_RESULT_EXCH,
                [STATE.DT_D_AMOUNT_S_RESULT]: STATE.DT_D_AMOUNT_EXCH,
                [STATE.DT_S_RESULT_D_RESULT]: STATE.DT_D_RESULT_EXCH,
            },
        };

        const newId = stateTransitionByType(state, stateMap);
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
            if (!state.isDiff) {
                transaction.dest_curr = srcAccount.curr_id;
                newState.destCurrency = srcCurrency;
            }

            newState.isDiff = transaction.src_curr !== transaction.dest_curr;
            if (state.isDiff && !newState.isDiff) {
                newState.id = stateTransition(state, {
                    [STATE.E_S_AMOUNT_D_AMOUNT]: STATE.E_D_AMOUNT,
                    [STATE.E_S_AMOUNT_EXCH]: STATE.E_D_AMOUNT,
                    [STATE.E_S_AMOUNT_S_RESULT]: STATE.E_S_RESULT,
                });

                const srcAmount = transaction.src_amount;
                transaction.dest_amount = srcAmount;
                newState.form.destAmount = srcAmount;
            }
        }

        if (transaction.type === TRANSFER) {
            if (accountId === transaction.dest_id) {
                setStateNextDestAccount(newState, accountId);
                calculateDestResult(newState);
            }

            newState.isDiff = transaction.src_curr !== transaction.dest_curr;
            if (!newState.isDiff && transaction.dest_amount !== transaction.src_amount) {
                setStateDestAmount(newState, transaction.src_amount);
            }

            const diffCurrStateMap = {
                [STATE.T_S_AMOUNT]: STATE.T_S_AMOUNT_D_AMOUNT,
                [STATE.T_S_RESULT]: STATE.T_D_AMOUNT_S_RESULT,
                [STATE.T_D_RESULT]: STATE.T_S_AMOUNT_D_RESULT,
            };
            const sameCurrStateMap = {
                [STATE.T_S_AMOUNT_D_AMOUNT]: STATE.T_S_AMOUNT,
                [STATE.T_S_AMOUNT_EXCH]: STATE.T_S_AMOUNT,
                [STATE.T_D_AMOUNT_S_RESULT]: STATE.T_S_RESULT,
                [STATE.T_S_RESULT_D_RESULT]: STATE.T_S_RESULT,
                [STATE.T_EXCH_S_RESULT]: STATE.T_S_RESULT,
                [STATE.T_S_AMOUNT_D_RESULT]: STATE.T_D_RESULT,
            };

            if (state.isDiff !== newState.isDiff) {
                const stateMap = (newState.isDiff) ? diffCurrStateMap : sameCurrStateMap;
                newState.id = stateTransition(state, stateMap);
            }
        }

        updateStateExchange(newState);

        return newState;
    },

    destAccountChange: (state, accountId) => {
        const availTypes = [INCOME, TRANSFER, LIMIT_CHANGE];
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

        // If currencies are same before account was changed
        // then copy destination currency to source
        if (
            (transaction.type === INCOME && !state.isDiff)
            || (transaction.type === LIMIT_CHANGE)
        ) {
            transaction.src_curr = destAccount.curr_id;
            newState.srcCurrency = destCurrency;
        }

        if (transaction.type === INCOME) {
            newState.isDiff = transaction.src_curr !== transaction.dest_curr;
            if (state.isDiff && !newState.isDiff) {
                setStateSourceAmount(newState, transaction.dest_amount);

                newState.id = stateTransition(state, {
                    [STATE.I_S_AMOUNT_D_AMOUNT]: STATE.I_S_AMOUNT,
                    [STATE.I_S_AMOUNT_EXCH]: STATE.I_S_AMOUNT,
                    [STATE.I_S_AMOUNT_D_RESULT]: STATE.I_D_RESULT,
                });
            }
        }

        if (transaction.type === TRANSFER) {
            if (accountId === newState.transaction.src_id) {
                setStateNextSourceAccount(newState, accountId);
                calculateSourceResult(newState);
            }

            newState.isDiff = transaction.src_curr !== transaction.dest_curr;
            if (!newState.isDiff && transaction.dest_amount !== transaction.src_amount) {
                setStateDestAmount(newState, transaction.src_amount);
            }

            const diffCurrStateMap = {
                [STATE.T_S_AMOUNT]: STATE.T_S_AMOUNT_D_AMOUNT,
                [STATE.T_S_RESULT]: STATE.T_D_AMOUNT_S_RESULT,
                [STATE.T_D_RESULT]: STATE.T_S_AMOUNT_D_RESULT,
            };
            const sameCurrStateMap = {
                [STATE.T_S_AMOUNT_D_AMOUNT]: STATE.T_S_AMOUNT,
                [STATE.T_S_AMOUNT_EXCH]: STATE.T_S_AMOUNT,
                [STATE.T_D_AMOUNT_S_RESULT]: STATE.T_S_RESULT,
                [STATE.T_EXCH_S_RESULT]: STATE.T_S_RESULT,
                [STATE.T_S_AMOUNT_D_RESULT]: STATE.T_D_RESULT,
                [STATE.T_S_RESULT_D_RESULT]: STATE.T_D_RESULT,
            };

            if (state.isDiff !== newState.isDiff) {
                const stateMap = (newState.isDiff) ? diffCurrStateMap : sameCurrStateMap;
                newState.id = stateTransition(state, stateMap);
            }
        }

        if (transaction.type === LIMIT_CHANGE) {
            const { precision } = destCurrency;
            transaction.dest_amount = normalize(transaction.dest_amount, precision);

            setStateDestAmount(newState, transaction.dest_amount);
            setStateSourceAmount(newState, transaction.dest_amount);
        }

        updateStateExchange(newState);

        return newState;
    },

    debtAccountChange: (state, accountId) => {
        if (
            state.transaction.type !== DEBT
            || (state.account && state.account.id === accountId)
        ) {
            return state;
        }

        const { accounts, currency } = window.app.model;
        const account = accounts.getItem(accountId);
        if (!account) {
            throw new Error('Invalid account');
        }
        const transaction = { ...state.transaction };
        const newState = {
            ...state,
            transaction,
            form: { ...state.form },
            account,
        };

        // Request person account with the same currency as account
        if (!state.isDiff && newState.personAccount.curr_id !== account.curr_id) {
            newState.personAccount = getPersonAccount(newState.person.id, account.curr_id);
        }

        if (transaction.debtType) {
            newState.srcAccount = newState.personAccount;
            newState.destAccount = newState.account;
        } else {
            newState.srcAccount = newState.account;
            newState.destAccount = newState.personAccount;
        }
        transaction.acc_id = account.id;
        transaction.src_curr = newState.srcAccount.curr_id;
        transaction.dest_curr = newState.destAccount.curr_id;

        newState.srcCurrency = currency.getItem(transaction.src_curr);
        newState.destCurrency = currency.getItem(transaction.dest_curr);
        newState.isDiff = transaction.src_curr !== transaction.dest_curr;

        calculateSourceResult(newState);
        calculateDestResult(newState);

        if (state.isDiff === newState.isDiff || newState.isDiff) {
            return newState;
        }

        const stateMap = {
            [STATE.DG_S_AMOUNT_D_AMOUNT]: STATE.DG_S_AMOUNT,
            [STATE.DG_D_AMOUNT_S_RESULT]: STATE.DG_S_RESULT,
            [STATE.DG_S_AMOUNT_EXCH]: STATE.DG_S_AMOUNT,
            [STATE.DG_S_RESULT_EXCH]: STATE.DG_S_RESULT,
            [STATE.DG_S_RESULT_D_RESULT]: STATE.DG_S_RESULT,
            [STATE.DG_S_AMOUNT_D_RESULT]: STATE.DG_S_AMOUNT,
            [STATE.DT_S_AMOUNT_D_AMOUNT]: STATE.DT_D_AMOUNT,
            [STATE.DT_S_AMOUNT_D_RESULT]: STATE.DT_D_RESULT,
            [STATE.DT_D_AMOUNT_EXCH]: STATE.DT_D_AMOUNT,
            [STATE.DT_D_RESULT_EXCH]: STATE.DT_D_RESULT,
            [STATE.DT_S_RESULT_D_RESULT]: STATE.DT_D_RESULT,
            [STATE.DT_D_AMOUNT_S_RESULT]: STATE.DT_D_AMOUNT,
        };
        newState.id = stateTransition(state, stateMap);

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

        const transaction = {
            ...state.transaction,
            person_id: person.id,
        };
        const newState = {
            ...state,
            transaction,
            person,
        };

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
        const availTypes = [INCOME, DEBT];
        if (
            !availTypes.includes(state.transaction.type)
            || (state.transaction.type === DEBT && !state.transaction.debtType)
            || state.transaction.src_curr === currencyId
        ) {
            return state;
        }

        const srcCurrency = window.app.model.currency.getItem(currencyId);
        if (!srcCurrency) {
            throw new Error('Invalid currency');
        }

        const transaction = {
            ...state.transaction,
            src_curr: srcCurrency.id,
        };
        const newState = {
            ...state,
            transaction,
            srcCurrency,
        };

        if (state.transaction.type === DEBT) {
            const { person } = newState;
            newState.personAccount = getPersonAccount(person.id, srcCurrency.id);
            newState.srcAccount = newState.personAccount;
            transaction.src_id = newState.personAccount.id;
            calculateSourceResult(newState);

            if (transaction.noAccount) {
                transaction.dest_curr = transaction.src_curr;
                newState.destCurrency = srcCurrency;
            }
        }

        newState.isDiff = (transaction.src_curr !== transaction.dest_curr);
        if (state.isDiff && !newState.isDiff) {
            setStateDestAmount(newState, newState.transaction.src_amount);
            updateStateExchange(newState);
        }

        const sameCurrStateMap = {
            [STATE.I_S_AMOUNT_D_AMOUNT]: STATE.I_S_AMOUNT,
            [STATE.I_S_AMOUNT_EXCH]: STATE.I_S_AMOUNT,
            [STATE.I_S_AMOUNT_D_RESULT]: STATE.I_D_RESULT,
            [STATE.DG_S_AMOUNT_D_AMOUNT]: STATE.DG_S_AMOUNT,
            [STATE.DG_S_AMOUNT_EXCH]: STATE.DG_S_AMOUNT,
            [STATE.DG_S_AMOUNT_D_RESULT]: STATE.DG_S_AMOUNT,
        };
        const diffCurrStateMap = {
            [STATE.I_S_AMOUNT]: STATE.I_S_AMOUNT_D_AMOUNT,
            [STATE.DG_S_AMOUNT]: STATE.DG_S_AMOUNT_D_AMOUNT,
        };
        if (state.isDiff !== newState.isDiff) {
            const stateMap = (newState.isDiff) ? diffCurrStateMap : sameCurrStateMap;
            newState.id = stateTransition(state, stateMap);
        }

        return newState;
    },

    destCurrencyChange: (state, currencyId) => {
        const availTypes = [EXPENSE, DEBT];
        if (
            !availTypes.includes(state.transaction.type)
            || (state.transaction.type === DEBT && state.transaction.debtType)
            || state.transaction.dest_curr === currencyId
        ) {
            return state;
        }

        const destCurrency = window.app.model.currency.getItem(currencyId);

        const transaction = {
            ...state.transaction,
            dest_curr: destCurrency.id,
        };
        const newState = {
            ...state,
            transaction,
            destCurrency,
            isDiff: destCurrency.id !== state.transaction.src_curr,
        };

        if (state.transaction.type === DEBT) {
            const { person } = newState;
            newState.personAccount = getPersonAccount(person.id, destCurrency.id);
            newState.destAccount = newState.personAccount;
            transaction.dest_id = newState.personAccount.id;
            calculateDestResult(newState);

            if (transaction.noAccount) {
                transaction.src_curr = transaction.dest_curr;
                newState.srcCurrency = destCurrency;
            }
        }

        newState.isDiff = (transaction.src_curr !== transaction.dest_curr);
        if (state.isDiff && !newState.isDiff) {
            setStateSourceAmount(newState, newState.transaction.dest_amount);
            updateStateExchange(newState);
        }

        const diffCurrStateMap = {
            [STATE.E_D_AMOUNT]: STATE.E_S_AMOUNT_D_AMOUNT,
            [STATE.DT_D_AMOUNT]: STATE.DT_S_AMOUNT_D_AMOUNT,
        };
        const sameCurrStateMap = {
            [STATE.E_S_AMOUNT_D_AMOUNT]: STATE.E_D_AMOUNT,
            [STATE.DT_S_AMOUNT_D_AMOUNT]: STATE.DT_D_AMOUNT,
            [STATE.DT_D_AMOUNT_EXCH]: STATE.DT_D_AMOUNT,
            [STATE.DT_D_AMOUNT_S_RESULT]: STATE.DT_D_AMOUNT,
        };
        if (state.isDiff !== newState.isDiff) {
            const stateMap = (newState.isDiff) ? diffCurrStateMap : sameCurrStateMap;
            newState.id = stateTransition(state, stateMap);
        }

        return newState;
    },

    toggleDebtAccount: (state) => {
        if (state.transaction.type !== DEBT) {
            return state;
        }

        const transaction = {
            ...state.transaction,
            noAccount: !state.transaction.noAccount,
        };
        const newState = {
            ...state,
            transaction,
        };

        if (transaction.noAccount) {
            newState.id = stateTransition(state, {
                [STATE.DG_S_AMOUNT]: STATE.DG_NOACC_S_AMOUNT,
                [STATE.DG_D_RESULT]: STATE.DG_NOACC_S_AMOUNT,
                [STATE.DG_S_RESULT]: STATE.DG_NOACC_S_RESULT,
                [STATE.DT_D_AMOUNT]: STATE.DT_NOACC_D_AMOUNT,
                [STATE.DT_D_RESULT]: STATE.DT_NOACC_D_RESULT,
                [STATE.DT_S_RESULT]: STATE.DT_NOACC_D_AMOUNT,
                [STATE.DG_S_AMOUNT_D_AMOUNT]: STATE.DG_NOACC_S_AMOUNT,
                [STATE.DG_D_AMOUNT_S_RESULT]: STATE.DG_NOACC_S_RESULT,
                [STATE.DG_S_AMOUNT_EXCH]: STATE.DG_NOACC_S_AMOUNT,
                [STATE.DG_S_RESULT_EXCH]: STATE.DG_NOACC_S_RESULT,
                [STATE.DG_S_RESULT_D_RESULT]: STATE.DG_NOACC_S_RESULT,
                [STATE.DG_S_AMOUNT_D_RESULT]: STATE.DG_NOACC_S_AMOUNT,
                [STATE.DT_S_AMOUNT_D_AMOUNT]: STATE.DT_NOACC_D_AMOUNT,
                [STATE.DT_S_AMOUNT_D_RESULT]: STATE.DT_NOACC_D_RESULT,
                [STATE.DT_D_AMOUNT_EXCH]: STATE.DT_NOACC_D_AMOUNT,
                [STATE.DT_D_RESULT_EXCH]: STATE.DT_NOACC_D_RESULT,
                [STATE.DT_S_RESULT_D_RESULT]: STATE.DT_NOACC_D_RESULT,
                [STATE.DT_D_AMOUNT_S_RESULT]: STATE.DT_NOACC_D_AMOUNT,
            });

            transaction.lastAcc_id = newState.account.id;
            transaction.acc_id = 0;
            newState.account = null;

            if (transaction.debtType) {
                newState.destAccount = null;
                transaction.dest_id = 0;
                transaction.dest_curr = transaction.src_curr;
                setStateDestAmount(newState, transaction.src_amount);
            } else {
                newState.srcAccount = null;
                transaction.src_id = 0;
                transaction.src_curr = transaction.dest_curr;
                setStateSourceAmount(newState, transaction.dest_amount);
            }
            newState.isDiff = false;
        } else {
            const { userAccounts } = window.app.model;
            const account = (transaction.lastAcc_id)
                ? userAccounts.getItem(transaction.lastAcc_id)
                : userAccounts.getItemByIndex(0);
            if (!account) {
                throw new Error('Account not found');
            }
            newState.account = account;
            newState.personAccount = getPersonAccount(newState.person.id, account.curr_id);

            if (transaction.debtType) {
                newState.srcAccount = newState.personAccount;
                newState.destAccount = newState.account;
            } else {
                newState.srcAccount = newState.account;
                newState.destAccount = newState.personAccount;
            }
            transaction.acc_id = account.id;
            transaction.src_id = newState.srcAccount.id;
            transaction.dest_id = newState.destAccount.id;
            transaction.src_curr = newState.srcAccount.curr_id;
            transaction.dest_curr = newState.destAccount.curr_id;

            newState.isDiff = transaction.src_curr !== transaction.dest_curr;

            newState.id = stateTransition(state, {
                [STATE.DG_NOACC_S_AMOUNT]: STATE.DG_S_AMOUNT,
                [STATE.DT_NOACC_D_AMOUNT]: STATE.DT_D_AMOUNT,
                [STATE.DT_NOACC_D_RESULT]: STATE.DT_D_RESULT,
                [STATE.DG_NOACC_S_RESULT]: STATE.DG_S_RESULT,
            });
        }

        const { currency } = window.app.model;
        newState.srcCurrency = currency.getItem(transaction.src_curr);
        newState.destCurrency = currency.getItem(transaction.dest_curr);

        if (transaction.debtType) {
            calculateDestResult(newState);
        } else {
            calculateSourceResult(newState);
        }

        updateStateExchange(newState);

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
        const precision = state.srcCurrency?.precision;

        const newValue = normalize(value, precision);
        if (newState.transaction.src_amount === newValue) {
            return newState;
        }

        newState.transaction.src_amount = newValue;

        const isIncome = newState.transaction.type === INCOME;
        if (!isIncome) {
            calculateSourceResult(newState);
        }
        if (newState.isDiff) {
            if (!isIncome || isValidValue(newState.form.destAmount)) {
                updateStateExchange(newState);
            }
        } else {
            setStateDestAmount(newState, newValue);
        }

        return newState;
    },

    destAmountChange: (state, value) => {
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
        const precision = state.destCurrency?.precision;

        const newValue = normalize(value, precision);
        if (newState.transaction.dest_amount === newValue) {
            return newState;
        }

        newState.transaction.dest_amount = newValue;

        const isExpense = newState.transaction.type === EXPENSE;
        if (!isExpense) {
            calculateDestResult(newState);
        }
        if (newState.isDiff) {
            if (!isExpense || isValidValue(newState.form.sourceAmount)) {
                updateStateExchange(newState);
            }
        } else {
            setStateSourceAmount(newState, newValue);
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
        const precision = state.srcCurrency?.precision;

        const newValue = normalize(value, precision);
        if (newState.form.fSourceResult === newValue) {
            return newState;
        }

        newState.form.fSourceResult = newValue;
        const srcAmount = normalize(newState.srcAccount.balance - newValue, precision);
        setStateSourceAmount(newState, srcAmount);

        if (newState.isDiff) {
            updateStateExchange(newState);
        } else {
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
        const precision = state.destCurrency?.precision;

        const newValue = normalize(value, precision);
        if (newState.form.fDestResult === newValue) {
            return newState;
        }

        newState.form.fDestResult = newValue;

        const destAmount = normalize(newValue - newState.destAccount.balance, precision);
        setStateDestAmount(newState, destAmount);

        if (newState.isDiff) {
            updateStateExchange(newState);
        } else {
            setStateSourceAmount(newState, destAmount);
        }

        return newState;
    },

    exchangeChange: (state, value) => {
        const { useBackExchange } = state.form;
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

    toggleExchange: (state) => ({
        ...state,
        form: {
            ...state.form,
            useBackExchange: !state.form.useBackExchange,
        },
    }),

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

    scheduleRangeChange: (state, range) => ({
        ...state,
        transaction: {
            ...state.transaction,
            start_date: dateStringToTime(range.stdate),
            end_date: (range.enddate) ? dateStringToTime(range.enddate) : null,
        },
        form: {
            ...state.form,
            startDate: range.stdate,
            endDate: range.enddate ?? '',
        },
        validation: {
            ...state.validation,
            startDate: true,
            endDate: true,
        },
    }),

    intervalTypeChange: (state, value) => {
        const type = parseInt(value, 10);
        const newState = {
            ...state,
            form: {
                ...state.form,
                intervalType: type,
                intervalOffset: 0,
            },
            transaction: {
                ...state.transaction,
                interval_type: type,
                interval_offset: 0,
            },
        };

        if (type === INTERVAL_NONE) {
            newState.form.endDate = '';
            newState.transaction.end_date = null;
        }

        return newState;
    },

    intervalStepChange: (state, value) => {
        const step = parseInt(value, 10);
        const newState = {
            ...state,
            form: {
                ...state.form,
                intervalStep: value,
            },
            transaction: {
                ...state.transaction,
                interval_step: step,
            },
        };

        return newState;
    },

    intervalOffsetChange: (state, value) => {
        const offset = asArray(value).map((item) => parseInt(item, 10));
        const newState = {
            ...state,
            form: {
                ...state.form,
                intervalOffset: offset,
            },
            transaction: {
                ...state.transaction,
                interval_offset: offset,
            },
        };

        return newState;
    },

    invalidateSourceAmount: (state) => ({
        ...state,
        id: stateTransition(state, {
            [STATE.I_D_RESULT]: STATE.I_S_AMOUNT,
            [STATE.T_S_RESULT]: STATE.T_S_AMOUNT,
            [STATE.T_D_RESULT]: STATE.T_S_AMOUNT,
            [STATE.T_D_AMOUNT_S_RESULT]: STATE.T_S_AMOUNT_D_AMOUNT,
            [STATE.T_S_RESULT_D_RESULT]: STATE.T_S_AMOUNT_D_RESULT,
            [STATE.T_EXCH_S_RESULT]: STATE.T_S_AMOUNT_EXCH,
            [STATE.DG_S_RESULT]: STATE.DG_S_AMOUNT,
            [STATE.DG_D_RESULT]: STATE.DG_S_AMOUNT,
            [STATE.DT_D_RESULT]: STATE.DT_D_AMOUNT,
            [STATE.DG_NOACC_S_RESULT]: STATE.DG_NOACC_S_AMOUNT,
            [STATE.DG_D_AMOUNT_S_RESULT]: STATE.DG_S_AMOUNT_D_AMOUNT,
            [STATE.DG_S_RESULT_EXCH]: STATE.DG_S_AMOUNT_EXCH,
            [STATE.DG_S_RESULT_D_RESULT]: STATE.DG_S_AMOUNT_D_RESULT,
            [STATE.DG_S_RESULT_D_RESULT]: STATE.DG_S_AMOUNT_D_RESULT,
            [STATE.DT_D_AMOUNT_EXCH]: STATE.DT_S_AMOUNT_D_AMOUNT,
            [STATE.DT_D_RESULT_EXCH]: STATE.DT_S_AMOUNT_D_RESULT,
            [STATE.DT_S_RESULT_D_RESULT]: STATE.DT_S_AMOUNT_D_RESULT,
        }, false),
        validation: {
            ...state.validation,
            sourceAmount: false,
        },
    }),

    invalidateDestAmount: (state) => ({
        ...state,
        id: stateTransition(state, {
            [STATE.E_S_RESULT]: STATE.E_D_AMOUNT,
            [STATE.E_S_AMOUNT_EXCH]: STATE.E_S_AMOUNT_D_AMOUNT,
            [STATE.E_S_AMOUNT_S_RESULT]: STATE.E_S_AMOUNT_D_AMOUNT,
            [STATE.I_S_AMOUNT_EXCH]: STATE.I_S_AMOUNT_D_AMOUNT,
            [STATE.I_S_AMOUNT_D_RESULT]: STATE.I_S_AMOUNT_D_AMOUNT,
            [STATE.T_S_AMOUNT_D_RESULT]: STATE.T_S_AMOUNT_D_AMOUNT,
            [STATE.T_S_RESULT_D_RESULT]: STATE.T_D_AMOUNT_S_RESULT,
            [STATE.T_S_AMOUNT_EXCH]: STATE.T_S_AMOUNT_D_AMOUNT,
            [STATE.T_EXCH_S_RESULT]: STATE.T_D_AMOUNT_S_RESULT,
            [STATE.DT_D_RESULT]: STATE.DT_D_AMOUNT,
            [STATE.DT_S_RESULT]: STATE.DT_D_AMOUNT,
            [STATE.DT_NOACC_D_RESULT]: STATE.DT_NOACC_D_AMOUNT,
            [STATE.DG_S_AMOUNT_EXCH]: STATE.DG_S_AMOUNT_D_AMOUNT,
            [STATE.DG_S_RESULT_EXCH]: STATE.DG_D_AMOUNT_S_RESULT,
            [STATE.DG_S_RESULT_D_RESULT]: STATE.DG_D_AMOUNT_S_RESULT,
            [STATE.DG_S_AMOUNT_D_RESULT]: STATE.DG_S_AMOUNT_D_AMOUNT,
            [STATE.DT_S_AMOUNT_D_RESULT]: STATE.DT_S_AMOUNT_D_AMOUNT,
            [STATE.DT_D_RESULT_EXCH]: STATE.DT_D_AMOUNT_EXCH,
            [STATE.DT_S_RESULT_D_RESULT]: STATE.DT_D_AMOUNT_S_RESULT,
        }, false),
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

    invalidateStartDate: (state) => ({
        ...state,
        validation: {
            ...state.validation,
            startDate: false,
        },
    }),

    invalidateEndDate: (state) => ({
        ...state,
        validation: {
            ...state.validation,
            endDate: false,
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
        const currentType = state.transaction.type;

        // Check availability of selected type of transaction
        if (type === EXPENSE || type === INCOME) {
            newState.isAvailable = userAccounts.length > 0;
        } else if (type === TRANSFER) {
            newState.isAvailable = userAccounts.length > 1;
        } else if (type === DEBT) {
            newState.isAvailable = persons.length > 0;
        } else if (type === LIMIT_CHANGE) {
            if (currentType === EXPENSE) {
                newState.isAvailable = state.srcAccount?.type === ACCOUNT_TYPE_CREDIT_CARD;
            } else if (currentType === INCOME) {
                newState.isAvailable = state.destAccount?.type === ACCOUNT_TYPE_CREDIT_CARD;
            }
        }

        if (!newState.isAvailable) {
            return newState;
        }

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
            } else if (currentType === INCOME || currentType === LIMIT_CHANGE) {
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

                newState.id = stateTransition(state, {
                    [STATE.I_S_AMOUNT]: STATE.E_D_AMOUNT,
                    [STATE.I_D_RESULT]: STATE.E_S_RESULT,
                    [STATE.I_S_AMOUNT_D_AMOUNT]: STATE.E_S_AMOUNT_D_AMOUNT,
                    [STATE.I_S_AMOUNT_EXCH]: STATE.E_S_AMOUNT_EXCH,
                    [STATE.I_S_AMOUNT_D_RESULT]: STATE.E_S_AMOUNT_S_RESULT,
                    [STATE.L_RESULT]: STATE.E_S_RESULT,
                    [STATE.L_AMOUNT]: STATE.E_D_AMOUNT,
                }, false);
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

                newState.id = stateTransition(state, {
                    [STATE.E_D_AMOUNT]: STATE.I_S_AMOUNT,
                    [STATE.E_S_RESULT]: STATE.I_D_RESULT,
                    [STATE.E_S_AMOUNT_D_AMOUNT]: STATE.I_S_AMOUNT_D_AMOUNT,
                    [STATE.E_S_AMOUNT_EXCH]: STATE.I_S_AMOUNT_EXCH,
                    [STATE.E_S_AMOUNT_S_RESULT]: STATE.I_S_AMOUNT_D_RESULT,
                });
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
            } else if (currentType === LIMIT_CHANGE) {
                newState.id = stateTransition(state, {
                    [STATE.L_RESULT]: STATE.I_D_RESULT,
                    [STATE.L_AMOUNT]: STATE.I_S_AMOUNT,
                });
            }

            if (state.isAvailable) {
                updateStateExchange(newState);
            }

            newState.isDiff = transaction.src_curr !== transaction.dest_curr;
        }

        if (type === TRANSFER) {
            if (currentType === EXPENSE) {
                setStateNextDestAccount(newState, transaction.src_id);
            } else if (currentType === INCOME || currentType === LIMIT_CHANGE) {
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
            } else if (currentType === INCOME || currentType === LIMIT_CHANGE) {
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
                    : STATE.DT_NOACC_D_AMOUNT;
            } else {
                newState.id = (transaction.debtType)
                    ? STATE.DG_S_AMOUNT
                    : STATE.DT_D_AMOUNT;
            }

            setStateSourceAmount(newState, state.form.sourceAmount);
            setStateDestAmount(newState, state.form.destAmount);
            updateStateExchange(newState);
        }

        if (type === LIMIT_CHANGE) {
            transaction.src_id = 0;
            if (currentType === EXPENSE) {
                transaction.dest_id = state.transaction.src_id;
                transaction.dest_curr = state.transaction.src_curr;
            } else if (currentType === INCOME) {
                transaction.dest_id = state.transaction.dest_id;
                setStateDestAmount(newState, state.form.sourceAmount);
            } else if (currentType === DEBT) {
                const account = (state.account)
                    ? state.account
                    : userAccounts.getItemByIndex(0);
                transaction.dest_id = account.id;
            }
            transaction.src_curr = state.transaction.dest_curr;

            newState.srcAccount = null;
            newState.destAccount = accountModel.getItem(transaction.dest_id);
            newState.srcCurrency = currencyModel.getItem(transaction.src_curr);
            newState.destCurrency = currencyModel.getItem(transaction.dest_curr);

            setStateSourceAmount(newState, state.form.destAmount);

            newState.id = stateTransition(state, {
                [STATE.E_D_AMOUNT]: STATE.L_AMOUNT,
                [STATE.E_S_RESULT]: STATE.L_RESULT,
                [STATE.E_S_AMOUNT_D_AMOUNT]: STATE.L_AMOUNT,
                [STATE.E_S_AMOUNT_EXCH]: STATE.L_AMOUNT,
                [STATE.E_S_AMOUNT_S_RESULT]: STATE.L_RESULT,

                [STATE.I_D_RESULT]: STATE.L_RESULT,
                [STATE.I_S_AMOUNT]: STATE.L_AMOUNT,
                [STATE.I_S_AMOUNT_EXCH]: STATE.L_AMOUNT,
                [STATE.I_S_AMOUNT_D_RESULT]: STATE.L_RESULT,
                [STATE.I_S_AMOUNT_D_AMOUNT]: STATE.L_AMOUNT,

                [STATE.T_S_AMOUNT]: STATE.L_AMOUNT,
                [STATE.T_S_RESULT]: STATE.L_RESULT,
                [STATE.T_D_RESULT]: STATE.L_RESULT,
                [STATE.T_S_AMOUNT_D_AMOUNT]: STATE.L_AMOUNT,
                [STATE.T_D_AMOUNT_S_RESULT]: STATE.L_RESULT,
                [STATE.T_S_AMOUNT_D_RESULT]: STATE.L_RESULT,
                [STATE.T_S_RESULT_D_RESULT]: STATE.L_RESULT,
                [STATE.T_S_AMOUNT_EXCH]: STATE.L_AMOUNT,
                [STATE.T_EXCH_S_RESULT]: STATE.L_RESULT,

                [STATE.DG_S_AMOUNT]: STATE.L_AMOUNT,
                [STATE.DG_S_RESULT]: STATE.L_RESULT,
                [STATE.DG_D_RESULT]: STATE.L_RESULT,
                [STATE.DT_D_AMOUNT]: STATE.L_AMOUNT,
                [STATE.DT_D_RESULT]: STATE.L_RESULT,
                [STATE.DT_S_RESULT]: STATE.L_RESULT,
                [STATE.DG_NOACC_S_AMOUNT]: STATE.L_AMOUNT,
                [STATE.DT_NOACC_D_AMOUNT]: STATE.L_AMOUNT,
                [STATE.DT_NOACC_D_RESULT]: STATE.L_RESULT,
                [STATE.DG_NOACC_S_RESULT]: STATE.L_RESULT,
                [STATE.DG_S_AMOUNT_D_AMOUNT]: STATE.L_AMOUNT,
                [STATE.DG_S_AMOUNT_D_AMOUNT]: STATE.L_AMOUNT,
                [STATE.DG_D_AMOUNT_S_RESULT]: STATE.L_RESULT,
                [STATE.DG_S_AMOUNT_EXCH]: STATE.L_AMOUNT,
                [STATE.DG_S_RESULT_EXCH]: STATE.L_RESULT,
                [STATE.DG_S_RESULT_D_RESULT]: STATE.L_RESULT,
                [STATE.DG_S_AMOUNT_D_RESULT]: STATE.L_RESULT,
                [STATE.DT_S_AMOUNT_D_AMOUNT]: STATE.L_AMOUNT,
                [STATE.DT_S_AMOUNT_D_RESULT]: STATE.L_RESULT,
                [STATE.DT_D_AMOUNT_EXCH]: STATE.L_AMOUNT,
                [STATE.DT_D_RESULT_EXCH]: STATE.L_RESULT,
                [STATE.DT_S_RESULT_D_RESULT]: STATE.L_RESULT,
                [STATE.DT_D_AMOUNT_S_RESULT]: STATE.L_AMOUNT,
            });
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

        const { categories } = window.app.model;
        if (transaction.category_id !== 0) {
            const category = categories.getItem(transaction.category_id);
            if (category.type !== 0 && category.type !== transaction.type) {
                transaction.category_id = 0;
            }
        }

        return newState;
    },

    swapSourceAndDest: (state) => {
        const swapTypes = [TRANSFER, DEBT];
        if (!swapTypes.includes(state.transaction.type)) {
            return state;
        }

        const newState = {
            ...state,
            transaction: {
                ...state.transaction,
                src_id: state.transaction.dest_id,
                dest_id: state.transaction.src_id,
                src_curr: state.transaction.dest_curr,
                dest_curr: state.transaction.src_curr,
                src_amount: state.transaction.dest_amount,
                dest_amount: state.transaction.src_amount,
            },
            form: {
                ...state.form,
                sourceAmount: state.form.destAmount,
                destAmount: state.form.sourceAmount,
            },
            srcAccount: state.destAccount,
            destAccount: state.srcAccount,
            srcCurrency: state.destCurrency,
            destCurrency: state.srcCurrency,
        };

        if (newState.transaction.type === DEBT) {
            const debtType = !state.transaction.debtType;
            newState.transaction.debtType = debtType;

            newState.id = stateTransition(state, {
                [STATE.DT_D_AMOUNT]: STATE.DG_S_AMOUNT,
                [STATE.DG_S_AMOUNT]: STATE.DT_D_AMOUNT,
                [STATE.DT_D_RESULT]: STATE.DG_S_RESULT,
                [STATE.DG_S_RESULT]: STATE.DT_D_RESULT,
                [STATE.DT_S_RESULT]: STATE.DG_D_RESULT,
                [STATE.DG_D_RESULT]: STATE.DT_S_RESULT,
                [STATE.DT_NOACC_D_AMOUNT]: STATE.DG_NOACC_S_AMOUNT,
                [STATE.DG_NOACC_S_AMOUNT]: STATE.DT_NOACC_D_AMOUNT,
                [STATE.DT_NOACC_D_RESULT]: STATE.DG_NOACC_S_RESULT,
                [STATE.DG_NOACC_S_RESULT]: STATE.DT_NOACC_D_RESULT,
                [STATE.DG_S_AMOUNT_D_AMOUNT]: STATE.DT_S_AMOUNT_D_AMOUNT,
                [STATE.DT_S_AMOUNT_D_AMOUNT]: STATE.DG_S_AMOUNT_D_AMOUNT,
                [STATE.DG_D_AMOUNT_S_RESULT]: STATE.DT_S_AMOUNT_D_RESULT,
                [STATE.DT_S_AMOUNT_D_RESULT]: STATE.DG_D_AMOUNT_S_RESULT,
                [STATE.DG_S_AMOUNT_EXCH]: STATE.DT_D_AMOUNT_EXCH,
                [STATE.DT_D_AMOUNT_EXCH]: STATE.DG_S_AMOUNT_EXCH,
                [STATE.DG_S_RESULT_EXCH]: STATE.DT_D_RESULT_EXCH,
                [STATE.DT_D_RESULT_EXCH]: STATE.DG_S_RESULT_EXCH,
                [STATE.DG_S_RESULT_D_RESULT]: STATE.DT_S_RESULT_D_RESULT,
                [STATE.DT_S_RESULT_D_RESULT]: STATE.DG_S_RESULT_D_RESULT,
                [STATE.DG_S_AMOUNT_D_RESULT]: STATE.DT_D_AMOUNT_S_RESULT,
                [STATE.DT_D_AMOUNT_S_RESULT]: STATE.DG_S_AMOUNT_D_RESULT,
            });
        }

        calculateSourceResult(newState);
        calculateDestResult(newState);
        updateStateExchange(newState);

        return newState;
    },

    startSubmit: (state) => (
        (state.submitStarted)
            ? state
            : { ...state, submitStarted: true }
    ),

    cancelSubmit: (state) => (
        (!state.submitStarted)
            ? state
            : { ...state, submitStarted: false }
    ),
});

export const { actions, reducer } = slice;
