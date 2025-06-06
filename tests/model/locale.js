import { assert } from '@jezvejs/assert';

// Common tokens
import enTokens from '../../src/lang/en/common.json' with { type: 'json' };
import ruTokens from '../../src/lang/ru/common.json' with { type: 'json' };

// AboutView tokens
import enAboutTokens from '../../src/lang/en/AboutView/index.json' with { type: 'json' };
import ruAboutTokens from '../../src/lang/ru/AboutView/index.json' with { type: 'json' };

// SettingsView tokens
import enSettingsTokens from '../../src/lang/en/SettingsView/index.json' with { type: 'json' };
import ruSettingsTokens from '../../src/lang/ru/SettingsView/index.json' with { type: 'json' };

import { App } from '../Application.js';

export const tokensMap = {
    en: {
        ...enTokens,
        ...enAboutTokens,
        ...enSettingsTokens,
    },
    ru: {
        ...ruTokens,
        ...ruAboutTokens,
        ...ruSettingsTokens,
    },
};

export const dateFormatLocales = {
    ru: 'dd.MM.YYYY',
    lt: 'YYYY-MM-dd',
    fr: 'dd/MM/YYYY',
    ar: 'dYYYY/M/',
    es: 'd/M/YY',
    zh: 'YYYY/M/d',
    hr: 'dd. MM. YYYY.',
    uk: 'dd.MM.YY',
    nl: 'dd-MM-YYYY',
    en: 'M/d/YY',
    fi: 'd.M.YYYY',
    hu: 'YYYY. MM. dd.',
    it: 'dd/MM/YY',
    ja: 'YYYY/MM/dd',
    ko: 'YY. MM. dd.',
    ms: 'd/MM/YY',
    pl: 'd.MM.YYYY',
    sr: 'd.MM.YY.',
    sk: 'd. MM. YYYY.',
    sl: 'd. MM. YY',
    te: 'dd-MM-YY',
};

/** Formats token string with specified arguments */
const formatTokenString = (value, ...args) => (
    value.replace(/\$\{(\d+)\}/g, (_, num) => {
        const argNum = parseInt(num, 10);
        if (!argNum) {
            throw new Error(`Invalid argument: ${num}`);
        }
        if (args.length < argNum) {
            throw new Error(`Argument ${num} not defined`);
        }

        return args[argNum - 1];
    })
);

/** Returns not formatted token string for specified path */
const getTokenString = (token, locale = App.view.locale) => {
    assert.isString(locale, 'Invalid locale');

    const localeTokens = tokensMap[locale];
    assert.isObject(localeTokens, `Locale ${locale} not found`);

    assert.isString(token, 'Invalid token');
    const tokenPath = token.split('.');
    const path = [];

    return tokenPath.reduce((res, key) => {
        path.push(key);
        assert.isDefined(res[key], `Token path '${path.join('.')}' not found`);

        return res[key];
    }, localeTokens);
};

/** Returns true if specified token is exists */
export const hasToken = (token, locale = App.view.locale) => (
    typeof getTokenString(token, locale) === 'string'
);

/* eslint-disable-next-line no-underscore-dangle */
export const __ = (token, locale = App.view.locale, ...args) => {
    const tokenString = getTokenString(token, locale);
    assert.isString(tokenString, `Token '${token}' not found`);

    return formatTokenString(tokenString, ...args);
};

/** Returns string for Accept-Language HTTP header */
export const getAcceptLanguageHeader = (locale = App.view.locale) => (
    (locale === 'ru')
        ? 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7'
        : 'en-US,en'
);
