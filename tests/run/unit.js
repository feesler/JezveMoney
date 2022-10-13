import { assert, test } from 'jezve-test';
import {
    fixFloat,
    amountFix,
    correct,
    normalize,
    isValidValue,
} from '../../src/view/js/utils.js';

export const fixFloatTest = async (descr, value, result) => {
    await test(descr, () => {
        assert.equal(fixFloat(value), result);
        return true;
    });
};

export const amountFixTest = async (descr, value, result) => {
    await test(descr, () => {
        assert.equal(amountFix(value), result);
        return true;
    });
};

export const correctTest = async (descr, value, result) => {
    await test(descr, () => {
        assert.equal(correct(value), result);
        return true;
    });
};

export const correctPrecTest = async (descr, value, prec, result) => {
    await test(descr, () => {
        assert.equal(correct(value, prec), result);
        return true;
    });
};

export const normalizeTest = async (descr, value, result) => {
    await test(descr, () => {
        assert.equal(normalize(value), result);
        return true;
    });
};

export const normalizePrecTest = async (descr, value, prec, result) => {
    await test(descr, () => {
        assert.equal(normalize(value, prec), result);
        return true;
    });
};

export const isValidValueTest = async (descr, value, result) => {
    await test(descr, () => {
        assert.equal(isValidValue(value), result);
        return true;
    });
};
