import { createElement } from '@jezvejs/dom';
import { App } from '../../Application/App.js';

/* CSS classes */
const SECTION_DESCR_CLASS = 'section__description';
const EXAMPLES_CONTAINER_CLASS = 'format-examples';
const FORMATTED_CLASS = 'formatted';
const FORMATTED_TITLE_CLASS = 'formatted-title';
const FORMATTED_VALUE_CLASS = 'formatted-value';

export const getListRequest = () => ({});

export const prepareRequest = (data) => ({
    ...data,
    returnState: {
        userCurrencies: getListRequest(),
    },
});

export const getListDataFromResponse = (response) => (
    response?.data?.state?.userCurrencies?.data
);

export const createFormatExamplesTitle = (textContent) => (
    createElement('div', {
        props: {
            className: SECTION_DESCR_CLASS,
            textContent,
        },
    })
);

export const createFormatExamplesContainer = () => (
    createElement('div', {
        props: {
            className: EXAMPLES_CONTAINER_CLASS,
        },
    })
);

export const renderDateFormatExample = (title, date, state) => (
    createElement('span', {
        props: { className: FORMATTED_CLASS },
        children: [
            createElement('span', {
                props: {
                    className: FORMATTED_TITLE_CLASS,
                    textContent: title,
                },
            }),
            createElement('span', {
                props: {
                    className: FORMATTED_VALUE_CLASS,
                    textContent: App.formatDate(date, {
                        locales: state.dateLocale,
                    }),
                },
            }),
        ],
    })
);

export const getNumberFormatOptions = ({ precision }) => ({
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
});

export const renderNumberFormatExample = ({ value, options = {} }, state) => (
    createElement('span', {
        props: { className: FORMATTED_CLASS },
        children: [
            createElement('span', {
                props: {
                    className: FORMATTED_VALUE_CLASS,
                    textContent: App.formatNumber(value, {
                        locales: state.decimalLocale,
                        options,
                    }),
                },
            }),
        ],
    })
);
