import {
    EXPENSE,
    INCOME,
    TRANSFER,
    DEBT,
    normalize,
    normalizeExch,
    isValidValue,
} from '../../js/app.js';

// Action types
const SOURCE_AMOUNT_CLICK = 'sourceAmountClick';
const DEST_AMOUNT_CLICK = 'destAmountClick';
const SOURCE_RESULT_CLICK = 'sourceResultClick';
const DEST_RESULT_CLICK = 'destResultClick';
const EXCHANGE_CLICK = 'exchangeClick';
const SOURCE_ACCOUNT_CHANGE = 'sourceAccountChange';
const DEST_ACCOUNT_CHANGE = 'destAccountChange';
const DEBT_ACCOUNT_CHANGE = 'debtAccountChange';
const PERSON_CHANGE = 'personChange';
const SOURCE_CURRENCY_CHANGE = 'sourceCurrencyChange';
const DEST_CURRENCY_CHANGE = 'destCurrencyChange';
const TOGGLE_DEBT_ACCOUNT = 'toggleDebtAccount';
const TOGGLE_DEBT_TYPE = 'toggleDebtType';
const SOURCE_AMOUNT_CHANGE = 'sourceAmountChange';
const DEST_AMOUNT_CHANGE = 'destAmountChange';
const SOURCE_RESULT_CHANGE = 'sourceResultChange';
const DEST_RESULT_CHANGE = 'destResultChange';
const EXCHANGE_CHANGE = 'exchangeChange';
const INVALIDATE_SOURCE_AMOUNT = 'invalidateSourceAmount';
const INVALIDATE_DEST_AMOUNT = 'invalidateDestAmount';
const INVALIDATE_DATE = 'invalidateDate';

// Action creators
export const sourceAmountClick = () => ({ type: SOURCE_AMOUNT_CLICK });
export const destAmountClick = () => ({ type: DEST_AMOUNT_CLICK });
export const sourceResultClick = () => ({ type: SOURCE_RESULT_CLICK });
export const destResultClick = () => ({ type: DEST_RESULT_CLICK });
export const exchangeClick = () => ({ type: EXCHANGE_CLICK });
export const sourceAccountChange = (accountId) => ({
    type: SOURCE_ACCOUNT_CHANGE,
    payload: accountId,
});
export const destAccountChange = (accountId) => ({
    type: DEST_ACCOUNT_CHANGE,
    payload: accountId,
});
export const debtAccountChange = (accountId) => ({
    type: DEBT_ACCOUNT_CHANGE,
    payload: accountId,
});
export const personChange = (personId) => ({ type: PERSON_CHANGE, payload: personId });
export const sourceCurrencyChange = (currencyId) => ({
    type: SOURCE_CURRENCY_CHANGE,
    payload: currencyId,
});
export const destCurrencyChange = (currencyId) => ({
    type: DEST_CURRENCY_CHANGE,
    payload: currencyId,
});
export const toggleDebtAccount = () => ({ type: TOGGLE_DEBT_ACCOUNT });
export const toggleDebtType = () => ({ type: TOGGLE_DEBT_TYPE });
export const sourceAmountChange = (value) => ({ type: SOURCE_AMOUNT_CHANGE, payload: value });
export const destAmountChange = (value) => ({ type: DEST_AMOUNT_CHANGE, payload: value });
export const sourceResultChange = (value) => ({ type: SOURCE_RESULT_CHANGE, payload: value });
export const destResultChange = (value) => ({ type: DEST_RESULT_CHANGE, payload: value });
export const exchangeChange = (value) => ({ type: EXCHANGE_CHANGE, payload: value });
export const invalidateSourceAmount = () => ({ type: INVALIDATE_SOURCE_AMOUNT });
export const invalidateDestAmount = () => ({ type: INVALIDATE_DEST_AMOUNT });
export const invalidateDate = () => ({ type: INVALIDATE_DATE });

// Tools

/** Set new source amount and calculate source result balance */
const setStateSourceAmount = (state, amount) => {
    const result = state;
    const { transaction } = result;

    const sourceAmount = normalize(amount);
    result.transaction.src_amount = sourceAmount;
    result.form.sourceAmount = amount;

    if (transaction.type !== DEBT) {
        if (result.srcAccount) {
            const srcResult = normalize(result.srcAccount.balance - sourceAmount);
            result.form.sourceResult = srcResult;
            result.form.fSourceResult = srcResult;
        }
    } else if (result.srcAccount && !transaction.noAccount) {
        const sourceResult = normalize(result.srcAccount.balance - sourceAmount);
        result.form.sourceResult = sourceResult;
        result.form.fSourceResult = sourceResult;
    } else if (result.transaction.noAccount) {
        if (result.transaction.debtType) {
            const sourceResult = normalize(result.personAccount.balance - sourceAmount);
            result.form.sourceResult = sourceResult;
            result.form.fSourceResult = sourceResult;
        } else {
            const lastAcc = window.app.model.accounts.getItem(transaction.lastAcc_id);
            const accBalance = (lastAcc) ? lastAcc.balance : 0;
            const sourceResult = normalize(accBalance);
            result.form.sourceResult = sourceResult;
            result.form.fSourceResult = sourceResult;
        }
    }

    return result;
};

/** Set new destination amount and calculate destination result balance */
const setStateDestAmount = (state, amount) => {
    const result = state;
    const { transaction } = result;

    const destAmount = normalize(amount);
    result.transaction.dest_amount = destAmount;
    result.form.destAmount = amount;

    if (transaction.type !== DEBT) {
        if (result.destAccount) {
            const destResult = normalize(result.destAccount.balance + destAmount);
            result.form.destResult = destResult;
            result.form.fDestResult = destResult;
        }
    } else if (result.destAccount && !transaction.noAccount) {
        const destResult = normalize(result.destAccount.balance + destAmount);
        result.form.destResult = destResult;
        result.form.fDestResult = destResult;
    } else if (transaction.noAccount) {
        if (transaction.debtType) {
            const lastAcc = window.app.model.accounts.getItem(transaction.lastAcc_id);
            const accBalance = (lastAcc) ? lastAcc.balance : 0;
            const destResult = normalize(accBalance);
            result.form.destResult = destResult;
            result.form.fDestResult = destResult;
        } else {
            const destResult = normalize(result.personAccount.balance + destAmount);
            result.form.destResult = destResult;
            result.form.fDestResult = destResult;
        }
    }

    return result;
};

export const calculateExchange = (state) => {
    const source = state.transaction.src_amount;
    const destination = state.transaction.dest_amount;

    if (source === 0 || destination === 0) {
        return 1;
    }

    return normalizeExch(destination / source);
};

const updateStateExchange = (state) => {
    const result = state;

    const exchange = calculateExchange(state);
    result.form.fExchange = exchange;
    result.form.exchange = exchange;

    return result;
};

// Reducers
const reduceSourceAmountClick = (state) => {
    let newId = state.id;
    if (state.transaction.type === INCOME) {
        if (state.id === 1) {
            newId = 0;
        }
    }

    if (state.transaction.type === TRANSFER) {
        if (state.id === 1 || state.id === 2) {
            newId = 0;
        } else if (state.id === 4) {
            newId = 3;
        } else if (state.id === 6) {
            newId = 5;
        } else if (state.id === 8) {
            newId = 7;
        }
    }

    if (state.transaction.type === DEBT) {
        if (state.id === 1 || state.id === 2) {
            newId = 0;
        } else if (state.id === 4 || state.id === 5) {
            newId = 3;
        } else if (state.id === 8) {
            newId = 7;
        } else if (state.id === 9) {
            newId = 6;
        }
    }

    return (newId === state.id) ? state : { ...state, id: newId };
};

const reduceDestAmountClick = (state) => {
    let newId = state.id;
    if (state.transaction.type === EXPENSE) {
        if (state.id === 1) {
            newId = 0;
        } else if (state.id === 3 || state.id === 4) {
            newId = 2;
        }
    }

    if (state.transaction.type === INCOME) {
        if (state.id === 3 || state.id === 4) {
            newId = 2;
        }
    }

    if (state.transaction.type === TRANSFER) {
        if (state.id === 5 || state.id === 7) {
            newId = 3;
        } else if (state.id === 6 || state.id === 8) {
            newId = 4;
        }
    }

    return (newId === state.id) ? state : { ...state, id: newId };
};

const reduceSourceResultClick = (state) => {
    let newId = state.id;
    if (state.transaction.type === EXPENSE) {
        if (state.id === 0) {
            newId = 1;
        } else if (state.id === 2 || state.id === 3) {
            newId = 4;
        }
    }

    if (state.transaction.type === TRANSFER) {
        if (state.id === 0 || state.id === 2) {
            newId = 1;
        } else if (state.id === 3) {
            newId = 4;
        } else if (state.id === 5) {
            newId = 6;
        } else if (state.id === 7) {
            newId = 8;
        }
    }

    if (state.transaction.type === DEBT) {
        if (state.id === 0 || state.id === 2) {
            newId = 1;
        } else if (state.id === 3 || state.id === 4) {
            newId = 5;
        } else if (state.id === 6) {
            newId = 9;
        }
    }

    return (newId === state.id) ? state : { ...state, id: newId };
};

const reduceDestResultClick = (state) => {
    let newId = state.id;
    if (state.transaction.type === INCOME) {
        if (state.id === 0) {
            newId = 1;
        } else if (state.id === 2 || state.id === 3) {
            newId = 4;
        }
    }

    if (state.transaction.type === TRANSFER) {
        if (state.id === 0 || state.id === 1) {
            newId = 2;
        } else if (state.id === 3 || state.id === 7) {
            newId = 5;
        } else if (state.id === 4 || state.id === 8) {
            newId = 6;
        }
    }

    if (state.transaction.type === DEBT) {
        if (state.id === 0 || state.id === 1) {
            newId = 2;
        } else if (state.id === 3 || state.id === 5) {
            newId = 4;
        } else if (state.id === 7) {
            newId = 8;
        }
    }

    return (newId === state.id) ? state : { ...state, id: newId };
};

const reduceExchangeClick = (state) => {
    let newId = state.id;
    if (state.transaction.type === EXPENSE || state.transaction.type === INCOME) {
        newId = 3;
    }

    if (state.transaction.type === TRANSFER) {
        if (state.id === 3 || state.id === 5) {
            newId = 7;
        } else if (state.id === 4 || state.id === 6) {
            newId = 8;
        }
    }

    return (newId === state.id) ? state : { ...state, id: newId };
};

const reduceSourceAccountChange = (state, accountId) => {
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

    if (transaction.type === EXPENSE) {
        // If currencies are same before account was changed
        // then copy source currency to destination
        if (state.id === 0 || state.id === 1) {
            transaction.dest_curr = srcAccount.curr_id;
            newState.destCurrency = srcCurrency;
        }

        // Update result balance of source
        const srcResult = normalize(srcAccount.balance - transaction.src_amount);
        if (newState.form.fSourceResult !== srcResult) {
            newState.form.fSourceResult = srcResult;
            newState.form.sourceResult = srcResult;
        }

        updateStateExchange(newState);

        newState.isDiff = transaction.src_curr !== transaction.dest_curr;
        if (!newState.isDiff) {
            if (newState.id === 2 || newState.id === 3 || newState.id === 4) {
                const srcAmount = transaction.src_amount;
                transaction.dest_amount = srcAmount;
                newState.form.destAmount = srcAmount;
                newState.id = (newState.id === 4) ? 1 : 0;
            }
        }
    }

    if (transaction.type === TRANSFER) {
        // Update result balance of source
        const srcResult = normalize(srcAccount.balance - transaction.src_amount);
        if (newState.form.fSourceResult !== srcResult) {
            newState.form.fSourceResult = srcResult;
            newState.form.sourceResult = srcResult;
        }

        if (accountId === transaction.dest_id) {
            const { visibleUserAccounts } = window.app.model;
            const nextAccountId = visibleUserAccounts.getNextAccount(accountId);
            const destAccount = window.app.model.accounts.getItem(nextAccountId);
            if (!destAccount) {
                throw new Error('Next account not found');
            }
            newState.destAccount = destAccount;
            transaction.dest_id = destAccount.id;
            transaction.dest_curr = destAccount.curr_id;
            newState.destCurrency = window.app.model.currency.getItem(destAccount.curr_id);

            // TODO : investigate unconditional copying of amount for different currencies case
            // Copy source amount to destination amount
            if (transaction.dest_amount !== transaction.src_amount) {
                newState.form.destAmount = newState.form.sourceAmount;
            }
            transaction.dest_amount = transaction.src_amount;

            // Update result balance of destination
            const destResult = normalize(destAccount.balance + transaction.dest_amount);
            if (newState.form.fDestResult !== destResult) {
                newState.form.fDestResult = destResult;
                newState.form.destResult = destResult;
            }
        }

        updateStateExchange(newState);

        newState.isDiff = transaction.src_curr !== transaction.dest_curr;
        if (newState.isDiff) {
            if (newState.id === 0) {
                newState.id = 3;
            } else if (newState.id === 1) {
                newState.id = 4;
            } else if (newState.id === 2) {
                newState.id = 5;
            }
        } else {
            if (transaction.dest_amount !== transaction.src_amount) {
                setStateDestAmount(newState, transaction.src_amount);
            }

            if (newState.id === 3 || newState.id === 7) {
                newState.id = 0;
            } else if (newState.id === 4 || newState.id === 6 || newState.id === 8) {
                newState.id = 1;
            } else if (newState.id === 5) {
                newState.id = 2;
            }
        }
    }

    return newState;
};

const reduceDestAccountChange = (state, accountId) => {
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

    if (transaction.type === INCOME) {
        // If currencies are same before account was changed
        // then copy destination currency to source
        if (newState.id === 0 || newState.id === 1) {
            newState.transaction.src_curr = destAccount.curr_id;
            newState.srcCurrency = destCurrency;
        }

        // Update result balance of destination
        const destResult = normalize(destAccount.balance + transaction.dest_amount);
        if (newState.form.fDestResult !== destResult) {
            newState.form.fDestResult = destResult;
            newState.form.destResult = destResult;
        }

        updateStateExchange(newState);

        newState.isDiff = transaction.src_curr !== transaction.dest_curr;
        if (!newState.isDiff) {
            if (newState.id === 2 || newState.id === 3 || newState.id === 4) {
                setStateSourceAmount(newState, transaction.dest_amount);
                newState.id = (newState.id === 4) ? 1 : 0;
            }
        }
    }

    if (transaction.type === TRANSFER) {
        // Update result balance of destination
        const destResult = normalize(destAccount.balance + transaction.dest_amount);
        if (newState.form.fDestResult !== destResult) {
            newState.form.fDestResult = destResult;
            newState.form.destResult = destResult;
        }

        if (accountId === newState.transaction.src_id) {
            const { visibleUserAccounts } = window.app.model;
            const nextAccountId = visibleUserAccounts.getNextAccount(accountId);
            const srcAccount = window.app.model.accounts.getItem(nextAccountId);
            if (!srcAccount) {
                throw new Error('Next account not found');
            }
            newState.srcAccount = srcAccount;
            transaction.src_id = srcAccount.id;
            transaction.src_curr = srcAccount.curr_id;
            newState.srcCurrency = window.app.model.currency.getItem(srcAccount.curr_id);

            // TODO : investigate unconditional copying of amount for different currencies case
            // Copy source amount to destination amount
            if (transaction.dest_amount !== transaction.src_amount) {
                newState.form.sourceAmount = newState.form.destAmount;
            }
            transaction.src_amount = transaction.dest_amount;

            // Update result balance of source
            const sourceResult = normalize(srcAccount.balance - transaction.src_amount);
            if (newState.form.fSourceResult !== sourceResult) {
                newState.form.fSourceResult = sourceResult;
                newState.form.sourceResult = sourceResult;
            }
        }

        // Copy source amount to destination amount
        if (!newState.isDiff) {
            setStateSourceAmount(newState, transaction.dest_amount);
        }
        updateStateExchange(newState);

        newState.isDiff = transaction.src_curr !== transaction.dest_curr;
        if (newState.isDiff) {
            if (newState.id === 0) {
                newState.id = 3;
            } else if (newState.id === 1) {
                newState.id = 4;
            } else if (newState.id === 2) {
                newState.id = 5;
            }
        } else {
            if (transaction.dest_amount !== transaction.src_amount) {
                setStateDestAmount(newState, transaction.src_amount);
            }

            if (newState.id === 3 || newState.id === 7) {
                newState.id = 0;
            } else if (newState.id === 4 || newState.id === 8) {
                newState.id = 1;
            } else if (newState.id === 5 || newState.id === 6) {
                newState.id = 2;
            }
        }
    }

    return newState;
};

const reduceDebtAccountChange = (state, accountId) => {
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
        account,
    };
    const { transaction } = newState;

    // Request person account wtih the same currency as account
    if (newState.personAccount.curr_id !== account.curr_id) {
        newState.personAccount = window.app.model.accounts.getPersonAccount(
            newState.person.id,
            account.curr_id,
        );
        if (!newState.personAccount) {
            newState.personAccount = {
                id: 0,
                balance: 0,
                curr_id: account.curr_id,
            };
        }
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

    const sourceResult = normalize(newState.srcAccount.balance - transaction.src_amount);
    newState.form.fSourceResult = sourceResult;
    newState.form.sourceResult = sourceResult;

    const destResult = normalize(newState.destAccount.balance + transaction.dest_amount);
    newState.form.fDestResult = destResult;
    newState.form.destResult = destResult;

    return newState;
};

const reducePersonChange = (state, personId) => {
    if (state.transaction.type !== DEBT || state.person.id === personId) {
        return state;
    }

    const person = window.app.model.persons.getItem(personId);
    if (!person) {
        throw new Error('Invalid person');
    }

    const newState = {
        ...state,
        person,
    };
    const { transaction } = newState;

    const currencyId = (transaction.debtType)
        ? transaction.src_curr
        : transaction.dest_curr;
    newState.personAccount = window.app.model.accounts.getPersonAccount(
        person.id,
        currencyId,
    );
    if (!newState.personAccount) {
        newState.personAccount = {
            id: 0,
            balance: 0,
            curr_id: currencyId,
        };
    }

    if (transaction.debtType) {
        newState.srcAccount = newState.personAccount;

        const sourceResult = normalize(newState.srcAccount.balance - transaction.src_amount);
        newState.form.sourceResult = sourceResult;
        newState.form.fSourceResult = sourceResult;
    } else {
        newState.destAccount = newState.personAccount;

        const destResult = normalize(newState.destAccount.balance + transaction.dest_amount);
        newState.form.destResult = destResult;
        newState.form.fDestResult = destResult;
    }

    return newState;
};

const reduceSourceCurrencyChange = (state, currencyId) => {
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

    if (newState.isDiff && newState.id === 0) {
        newState.id = 2;
    } else if (newState.id === 2 || newState.id === 3 || newState.id === 4) {
        if (!newState.isDiff) {
            setStateDestAmount(newState, newState.transaction.src_amount);
            updateStateExchange(newState);
            newState.id = (newState.id === 4) ? 1 : 0;
        }
    }

    return newState;
};

const reduceDestCurrencyChange = (state, currencyId) => {
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

    if (newState.isDiff && newState.id === 0) {
        newState.id = 2;
    } else if (newState.id === 2) {
        if (!newState.isDiff) {
            newState.id = 0;
            setStateSourceAmount(newState, newState.transaction.dest_amount);
            updateStateExchange(newState);
        }
    }

    return newState;
};

const reduceToggleDebtAccount = (state) => {
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
        if (newState.id === 0 || newState.id === 2) {
            newState.id = 6;
        } else if (newState.id === 1) {
            newState.id = 9;
        } else if (newState.id === 3 || newState.id === 5) {
            newState.id = 7;
        } else if (newState.id === 4) {
            newState.id = 8;
        }

        transaction.lastAcc_id = newState.account.id;

        if (transaction.debtType) {
            const destResult = normalize(newState.account.balance);
            newState.form.destResult = destResult;
            newState.form.fDestResult = destResult;
        } else {
            const sourceResult = normalize(newState.account.balance);
            newState.form.sourceResult = sourceResult;
            newState.form.fSourceResult = sourceResult;
        }
    } else {
        newState.account = window.app.model.accounts.getItem(transaction.lastAcc_id);
        if (!newState.account) {
            throw new Error('Account not found');
        }

        if (transaction.debtType) {
            newState.destAccount = newState.account;

            const destResult = normalize(newState.account.balance + transaction.dest_amount);
            newState.form.destResult = destResult;
            newState.form.fDestResult = destResult;
        } else {
            newState.srcAccount = newState.account;

            const sourceResult = normalize(newState.account.balance - transaction.src_amount);
            newState.form.sourceResult = sourceResult;
            newState.form.fSourceResult = sourceResult;
        }

        if (newState.id === 6) {
            newState.id = 0;
        } else if (newState.id === 7) {
            newState.id = 3;
        } else if (newState.id === 8) {
            newState.id = 4;
        } else if (newState.id === 9) {
            newState.id = 1;
        }
    }

    return newState;
};

const reduceToggleDebtType = (state) => {
    const debtType = !state.transaction.debtType;
    const newState = {
        ...state,
        transaction: {
            ...state.transaction,
            debtType,
        },
    };
    const { transaction } = newState;

    if (debtType) {
        newState.srcAccount = state.personAccount;
        newState.destAccount = state.account;
    } else {
        newState.srcAccount = state.account;
        newState.destAccount = state.personAccount;
    }
    transaction.src_id = (newState.srcAccount) ? newState.srcAccount.id : 0;
    transaction.dest_id = (newState.destAccount) ? newState.destAccount.id : 0;

    if (newState.srcAccount) {
        const sourceResult = normalize(newState.srcAccount.balance - transaction.src_amount);
        newState.form.sourceResult = sourceResult;
        newState.form.fSourceResult = sourceResult;
    } else if (transaction.noAccount && !debtType) {
        const lastAcc = window.app.model.accounts.getItem(transaction.lastAcc_id);

        const sourceResult = normalize(lastAcc.balance - transaction.src_amount);
        newState.form.sourceResult = sourceResult;
        newState.form.fSourceResult = sourceResult;
    }

    if (newState.destAccount) {
        const destResult = normalize(newState.destAccount.balance + transaction.dest_amount);
        newState.form.destResult = destResult;
        newState.form.fDestResult = destResult;
    } else if (transaction.noAccount && debtType) {
        const lastAcc = window.app.model.accounts.getItem(transaction.lastAcc_id);

        const destResult = normalize(lastAcc.balance + transaction.dest_amount);
        newState.form.destResult = destResult;
        newState.form.fDestResult = destResult;
    }

    if (debtType) {
        if (newState.id === 3) {
            newState.id = 0;
        } else if (newState.id === 4) {
            newState.id = 1;
        } else if (newState.id === 5) {
            newState.id = 2;
        } else if (newState.id === 7) {
            newState.id = 6;
        } else if (newState.id === 8) {
            newState.id = 9;
        }
    } else if (newState.id === 0) {
        newState.id = 3;
    } else if (newState.id === 1) {
        newState.id = 4;
    } else if (newState.id === 2) {
        newState.id = 5;
    } else if (newState.id === 6) {
        newState.id = 7;
    } else if (newState.id === 9) {
        newState.id = 8;
    }

    return newState;
};

const reduceSourceAmountChange = (state, value) => {
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
        setStateSourceAmount(newState, newValue);
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
        setStateSourceAmount(newState, value);
        if (newState.isDiff) {
            updateStateExchange(newState);
        } else {
            setStateDestAmount(newState, newValue);
        }
    }

    if (newState.transaction.type === DEBT) {
        setStateSourceAmount(newState, value);
        setStateDestAmount(newState, newValue);
    }

    return newState;
};

const reduceDestAmountChange = (state, value) => {
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
        setStateDestAmount(newState, newValue);
        if (newState.isDiff) {
            updateStateExchange(newState);
        } else {
            setStateSourceAmount(newState, newValue);
        }
    }

    if (newState.transaction.type === TRANSFER) {
        setStateDestAmount(newState, value);
        if (newState.isDiff) {
            updateStateExchange(newState);
        } else {
            setStateSourceAmount(newState, newValue);
        }
    }

    return newState;
};

const reduceSourceResultChange = (state, value) => {
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
};

const reduceDestResultChange = (state, value) => {
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
};

const reduceExchangeChange = (state, value) => {
    const { transaction } = state;

    if (transaction.type === DEBT) {
        return state;
    }

    const newState = {
        ...state,
        form: {
            ...state.form,
            exchange: value,
        },
    };

    const newValue = normalizeExch(value);
    if (newState.form.fExchange === newValue) {
        return newState;
    }

    newState.form.fExchange = newValue;
    if (isValidValue(newState.form.sourceAmount)) {
        const destAmount = normalize(transaction.src_amount * newValue);
        setStateDestAmount(newState, destAmount);
    } else if (isValidValue(newState.form.destAmount)) {
        const srcAmount = normalize(transaction.dest_amount / newValue);
        setStateSourceAmount(newState, srcAmount);
    }

    return newState;
};

const reduceInvalidateSourceAmount = (state) => ({
    ...state,
    validation: {
        ...state.validation,
        sourceAmount: false,
    },
});

const reduceInvalidateDestAmount = (state) => ({
    ...state,
    validation: {
        ...state.validation,
        destAmount: false,
    },
});

const reduceInvalidateDate = (state) => ({
    ...state,
    validation: {
        ...state.validation,
        date: false,
    },
});

const reducerMap = {
    [SOURCE_AMOUNT_CLICK]: reduceSourceAmountClick,
    [DEST_AMOUNT_CLICK]: reduceDestAmountClick,
    [SOURCE_RESULT_CLICK]: reduceSourceResultClick,
    [DEST_RESULT_CLICK]: reduceDestResultClick,
    [EXCHANGE_CLICK]: reduceExchangeClick,
    [SOURCE_ACCOUNT_CHANGE]: reduceSourceAccountChange,
    [DEST_ACCOUNT_CHANGE]: reduceDestAccountChange,
    [DEBT_ACCOUNT_CHANGE]: reduceDebtAccountChange,
    [PERSON_CHANGE]: reducePersonChange,
    [SOURCE_CURRENCY_CHANGE]: reduceSourceCurrencyChange,
    [DEST_CURRENCY_CHANGE]: reduceDestCurrencyChange,
    [TOGGLE_DEBT_ACCOUNT]: reduceToggleDebtAccount,
    [TOGGLE_DEBT_TYPE]: reduceToggleDebtType,
    [SOURCE_AMOUNT_CHANGE]: reduceSourceAmountChange,
    [DEST_AMOUNT_CHANGE]: reduceDestAmountChange,
    [SOURCE_RESULT_CHANGE]: reduceSourceResultChange,
    [DEST_RESULT_CHANGE]: reduceDestResultChange,
    [EXCHANGE_CHANGE]: reduceExchangeChange,
    [INVALIDATE_SOURCE_AMOUNT]: reduceInvalidateSourceAmount,
    [INVALIDATE_DEST_AMOUNT]: reduceInvalidateDestAmount,
    [INVALIDATE_DATE]: reduceInvalidateDate,
};

export const reducer = (state, action) => {
    if (!(action.type in reducerMap)) {
        throw new Error('Invalid action type');
    }

    const reduceFunc = reducerMap[action.type];
    return reduceFunc(state, action.payload);
};
