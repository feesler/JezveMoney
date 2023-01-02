import { assert } from 'jezve-test';
import enTokens from '../../src/lang/en.json' assert { type: 'json' };
import ruTokens from '../../src/lang/ru.json' assert { type: 'json' };

export const tokensMap = {
    en: enTokens,
    ru: ruTokens,
};

/* eslint-disable-next-line no-underscore-dangle */
export const __ = (token, locale = 'en') => {
    assert.isString(locale, 'Invalid locale');
    assert.isString(token, 'Invalid token');

    const localeTokens = tokensMap[locale];
    assert.isObject(localeTokens, `Locale ${locale} not found`);
    assert.isString(localeTokens[token], `Token ${token} not found`);

    return localeTokens[token];
};
