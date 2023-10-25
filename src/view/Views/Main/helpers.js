import { asArray } from 'jezvejs';

export const getTransactionListContextIds = (state) => (
    asArray(state?.transactionContextItem)
);
