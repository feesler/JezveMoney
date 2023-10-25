import { App } from '../../../../../Application/App.js';

/** Validate current template on raw data */
export const validateTemplate = (template, rawData) => {
    if (!template) {
        throw new Error('Invalid template');
    }
    if (!Array.isArray(rawData)) {
        throw new Error('Invalid data');
    }

    const [data] = rawData.slice(1, 2);
    // Account amount
    let value = template.getProperty('accountAmount', data, true);
    if (!value) {
        return { valid: false, column: 'accountAmount' };
    }
    // Transaction amount
    value = template.getProperty('transactionAmount', data, true);
    if (!value) {
        return { valid: false, column: 'transactionAmount' };
    }
    // Account currency
    value = template.getProperty('accountCurrency', data, true);
    let currency = App.model.currency.findByCode(value);
    if (!currency) {
        return { valid: false, column: 'accountCurrency' };
    }
    // Transaction currency
    value = template.getProperty('transactionCurrency', data, true);
    currency = App.model.currency.findByCode(value);
    if (!currency) {
        return { valid: false, column: 'transactionCurrency' };
    }
    // Date
    value = template.getProperty('date', data, true);
    if (!value) {
        return { valid: false, column: 'date' };
    }
    // Comment
    value = template.getProperty('comment', data, true);
    if (!value) {
        return { valid: false, column: 'comment' };
    }

    return { valid: true, column: true };
};

/** Find valid template for data */
export const findValidTemplate = (rawData) => (
    App.model.templates.find((template) => {
        const { valid } = validateTemplate(template, rawData);
        return valid;
    })
);

export const prepareRequest = (data) => ({
    ...data,
    returnState: {
        importtemplates: {},
        importrules: {},
    },
});

export const getListDataFromResponse = (response) => {
    const state = response?.data?.state;
    return {
        templates: state?.importtemplates?.data,
        rules: state?.importrules?.data,
    };
};
