import { assert, isObject } from 'jezve-test';
import enTokens from '../../src/lang/en.json' assert { type: 'json' };
import ruTokens from '../../src/lang/ru.json' assert { type: 'json' };

export const tokensMap = {
    en: enTokens,
    ru: ruTokens,
};

/** Returns true if specified token is exists */
export const hasToken = (token, locale = 'en') => (
    (typeof token === 'string')
    && (typeof locale === 'string')
    && isObject(tokensMap[locale])
    && (typeof tokensMap[locale][token] === 'string')
);

/* eslint-disable-next-line no-underscore-dangle */
export const __ = (token, locale = 'en') => {
    assert.isString(locale, 'Invalid locale');
    assert.isString(token, 'Invalid token');

    const localeTokens = tokensMap[locale];
    assert.isObject(localeTokens, `Locale ${locale} not found`);
    assert.isString(localeTokens[token], `Token ${token} not found`);

    return localeTokens[token];
};
