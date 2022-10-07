import { setBlock } from 'jezve-test';
import * as CommonTests from '../run/common.js';

const fixFloatTests = async () => {
    setBlock('fixFloat', 2);

    await CommonTests.fixFloatTest('Integer number', 100, 100);
    await CommonTests.fixFloatTest('Float number', 100.5, 100.5);
    await CommonTests.fixFloatTest('null value', null, null);
    await CommonTests.fixFloatTest('undefined value', undefined, null);
    await CommonTests.fixFloatTest('Empty string', '', '0');
    await CommonTests.fixFloatTest('Integer number string', '123', '123');
    await CommonTests.fixFloatTest('Float number string with point', '123.5', '123.5');
    await CommonTests.fixFloatTest('Float number string with comma', '123,5', '123.5');
    await CommonTests.fixFloatTest('Float number string starts with point', '.56', '0.56');
    await CommonTests.fixFloatTest('Float number string starts with comma', ',56', '0.56');
};

const amountFixTests = async () => {
    setBlock('amountFix', 2);

    await CommonTests.amountFixTest('Integer number', 100, 100);
    await CommonTests.amountFixTest('Float number', 100.5, 100.5);
    await CommonTests.amountFixTest('null value', null, null);
    await CommonTests.amountFixTest('undefined value', undefined, null);
    await CommonTests.amountFixTest('Empty string', '', 0);
    await CommonTests.amountFixTest('Integer number string', '123', 123);
    await CommonTests.amountFixTest('Float number string with point', '123.5', 123.5);
    await CommonTests.amountFixTest('Float number string with comma', '123,5', 123.5);
    await CommonTests.amountFixTest('Float number string starts with point', '.56', 0.56);
    await CommonTests.amountFixTest('Float number string starts with comma', ',56', 0.56);
    await CommonTests.amountFixTest('Spaces around', ' 123.56 ', 123.56);
    await CommonTests.amountFixTest('Spaces in between', ' 1 234.56 ', 1);
};

const correctTests = async () => {
    setBlock('correct', 2);

    await CommonTests.correctTest('Integer number', 100, 100);
    await CommonTests.correctTest('Float number', 100.5, 100.5);
    await CommonTests.correctTest('null value', null, NaN);
    await CommonTests.correctTest('undefined value', undefined, NaN);
    await CommonTests.correctTest('Empty string', '', NaN);
    await CommonTests.correctTest('Integer number string', '123', 123);
    await CommonTests.correctTest('Float number string with point', '123.567', 123.57);
    await CommonTests.correctTest('Float number string with comma', '123,567', 123);
    await CommonTests.correctTest('Float number string starts with point', '.56', 0.56);
    await CommonTests.correctTest('Float number string starts with comma', ',56', NaN);
    await CommonTests.correctTest('Float number with long fractional part', 1.345000001, 1.35);
    await CommonTests.correctTest('Spaces around', ' 123.5678 ', 123.57);
    await CommonTests.correctTest('Spaces in between', ' 1 234.5678 ', 1);
};

const correctPrecTests = async () => {
    setBlock('correct with precision parameter', 2);

    await CommonTests.correctPrecTest('Integer number', 100, 5, 100);
    await CommonTests.correctPrecTest('Float number', 100.5, 5, 100.5);
    await CommonTests.correctPrecTest('null value', null, 5, NaN);
    await CommonTests.correctPrecTest('undefined value', undefined, 5, NaN);
    await CommonTests.correctPrecTest('Empty string', '', 5, NaN);
    await CommonTests.correctPrecTest('Integer number string', '123', 5, 123);
    await CommonTests.correctPrecTest('Float number string with point', '123.567', 5, 123.567);
    await CommonTests.correctPrecTest('Float number string with comma', '123,567', 5, 123);
    await CommonTests.correctPrecTest('Float number string starts with point', '.5678', 5, 0.5678);
    await CommonTests.correctPrecTest('Float number string starts with comma', ',5678', 5, NaN);
    await CommonTests.correctPrecTest('Float number with long fractional part', 1.34567800001, 5, 1.34568);
    await CommonTests.correctPrecTest('Spaces around', ' 123.5678 ', 5, 123.5678);
    await CommonTests.correctPrecTest('Spaces in between', ' 1 234.5678 ', 5, 1);
};

const normalizeTests = async () => {
    setBlock('normalize', 2);

    await CommonTests.normalizeTest('Integer number', 100, 100);
    await CommonTests.normalizeTest('Float number', 100.5, 100.5);
    await CommonTests.normalizeTest('null value', null, NaN);
    await CommonTests.normalizeTest('undefined value', undefined, NaN);
    await CommonTests.normalizeTest('Empty string', '', 0);
    await CommonTests.normalizeTest('Integer number string', '123', 123);
    await CommonTests.normalizeTest('Float number string with point', '123.567', 123.57);
    await CommonTests.normalizeTest('Float number string with comma', '123,567', 123.57);
    await CommonTests.normalizeTest('Float number string starts with point', '.56', 0.56);
    await CommonTests.normalizeTest('Float number string starts with comma', ',56', 0.56);
    await CommonTests.normalizeTest('Float number with long fractional part', 1.345000001, 1.35);
    await CommonTests.normalizeTest('Spaces around', ' 123.5678 ', 123.57);
    await CommonTests.normalizeTest('Spaces in between', ' 1 234.5678 ', 1);
};

const normalizePrecTests = async () => {
    setBlock('normalize with precision parameter', 2);

    await CommonTests.normalizePrecTest('Integer number', 100, 5, 100);
    await CommonTests.normalizePrecTest('Float number', 100.5, 5, 100.5);
    await CommonTests.normalizePrecTest('null value', null, 5, NaN);
    await CommonTests.normalizePrecTest('undefined value', undefined, 5, NaN);
    await CommonTests.normalizePrecTest('Empty string', '', 5, 0);
    await CommonTests.normalizePrecTest('Integer number string', '123', 5, 123);
    await CommonTests.normalizePrecTest('Float number string with point', '123.567', 5, 123.567);
    await CommonTests.normalizePrecTest('Float number string with comma', '123,567', 5, 123.567);
    await CommonTests.normalizePrecTest('Float number string starts with point', '.5678', 5, 0.5678);
    await CommonTests.normalizePrecTest('Float number string starts with comma', ',5678', 5, 0.5678);
    await CommonTests.normalizePrecTest('Float number with long fractional part', 1.34567800001, 5, 1.34568);
    await CommonTests.normalizePrecTest('Spaces around', ' 123.5678 ', 5, 123.5678);
    await CommonTests.normalizePrecTest('Spaces in between', ' 1 234.5678 ', 5, 1);
};

const isValidValueTests = async () => {
    setBlock('isValidValue', 2);

    await CommonTests.isValidValueTest('Integer number', 100, true);
    await CommonTests.isValidValueTest('Float number', 100.5, true);
    await CommonTests.isValidValueTest('null value', null, false);
    await CommonTests.isValidValueTest('undefined value', undefined, false);
    await CommonTests.isValidValueTest('Empty string', '', true);
    await CommonTests.isValidValueTest('Integer number string', '123', true);
    await CommonTests.isValidValueTest('Float number string with point', '123.567', true);
    await CommonTests.isValidValueTest('Float number string with comma', '123,567', true);
    await CommonTests.isValidValueTest('Float number string starts with point', '.5678', true);
    await CommonTests.isValidValueTest('Float number string starts with comma', ',5678', true);
    await CommonTests.isValidValueTest('Spaces around', ' 123.5678 ', true);
    await CommonTests.isValidValueTest('Spaces in between', ' 1 234.5678 ', true);
};

export const commonTests = {
    /** Run common functions tests */
    async run() {
        setBlock('Common', 1);

        await fixFloatTests();
        await amountFixTests();
        await correctTests();
        await correctPrecTests();
        await normalizeTests();
        await normalizePrecTests();
        await isValidValueTests();
    },
};
