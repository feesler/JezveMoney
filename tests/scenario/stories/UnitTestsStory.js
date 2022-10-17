import { setBlock } from 'jezve-test';
import { TestStory } from '../TestStory.js';
import {
    fixFloatTest,
    amountFixTest,
    correctTest,
    correctPrecTest,
    normalizeTest,
    normalizePrecTest,
    isValidValueTest,
} from '../../run/unit.js';

export class UnitTestsStory extends TestStory {
    async run() {
        setBlock('Unit tests', 1);

        await this.fixFloatTests();
        await this.amountFixTests();
        await this.correctTests();
        await this.correctPrecTests();
        await this.normalizeTests();
        await this.normalizePrecTests();
        await this.isValidValueTests();
    }

    async fixFloatTests() {
        setBlock('fixFloat', 2);

        await fixFloatTest('Integer number', 100, 100);
        await fixFloatTest('Float number', 100.5, 100.5);
        await fixFloatTest('null value', null, null);
        await fixFloatTest('undefined value', undefined, null);
        await fixFloatTest('Empty string', '', '0');
        await fixFloatTest('Integer number string', '123', '123');
        await fixFloatTest('Float number string with point', '123.5', '123.5');
        await fixFloatTest('Float number string with comma', '123,5', '123.5');
        await fixFloatTest('Float number string starts with point', '.56', '0.56');
        await fixFloatTest('Float number string starts with comma', ',56', '0.56');
    }

    async amountFixTests() {
        setBlock('amountFix', 2);

        await amountFixTest('Integer number', 100, 100);
        await amountFixTest('Float number', 100.5, 100.5);
        await amountFixTest('null value', null, null);
        await amountFixTest('undefined value', undefined, null);
        await amountFixTest('Empty string', '', 0);
        await amountFixTest('Integer number string', '123', 123);
        await amountFixTest('Float number string with point', '123.5', 123.5);
        await amountFixTest('Float number string with comma', '123,5', 123.5);
        await amountFixTest('Float number string starts with point', '.56', 0.56);
        await amountFixTest('Float number string starts with comma', ',56', 0.56);
        await amountFixTest('Spaces around', ' 123.56 ', 123.56);
        await amountFixTest('Spaces in between', ' 1 234.56 ', 1234.56);
    }

    async correctTests() {
        setBlock('correct', 2);

        await correctTest('Integer number', 100, 100);
        await correctTest('Float number', 100.5, 100.5);
        await correctTest('null value', null, NaN);
        await correctTest('undefined value', undefined, NaN);
        await correctTest('Empty string', '', NaN);
        await correctTest('Integer number string', '123', 123);
        await correctTest('Float number string with point', '123.567', 123.57);
        await correctTest('Float number string with comma', '123,567', 123);
        await correctTest('Float number string starts with point', '.56', 0.56);
        await correctTest('Float number string starts with comma', ',56', NaN);
        await correctTest('Float number with long fractional part', 1.345000001, 1.35);
        await correctTest('Spaces around', ' 123.5678 ', 123.57);
        await correctTest('Spaces in between', ' 1 234.5678 ', 1);
    }

    async correctPrecTests() {
        setBlock('correct with precision parameter', 2);

        await correctPrecTest('Integer number', 100, 5, 100);
        await correctPrecTest('Float number', 100.5, 5, 100.5);
        await correctPrecTest('null value', null, 5, NaN);
        await correctPrecTest('undefined value', undefined, 5, NaN);
        await correctPrecTest('Empty string', '', 5, NaN);
        await correctPrecTest('Integer number string', '123', 5, 123);
        await correctPrecTest('Float number string with point', '123.567', 5, 123.567);
        await correctPrecTest('Float number string with comma', '123,567', 5, 123);
        await correctPrecTest('Float number string starts with point', '.5678', 5, 0.5678);
        await correctPrecTest('Float number string starts with comma', ',5678', 5, NaN);
        await correctPrecTest('Float number with long fractional part', 1.34567800001, 5, 1.34568);
        await correctPrecTest('Spaces around', ' 123.5678 ', 5, 123.5678);
        await correctPrecTest('Spaces in between', ' 1 234.5678 ', 5, 1);
    }

    async normalizeTests() {
        setBlock('normalize', 2);

        await normalizeTest('Integer number', 100, 100);
        await normalizeTest('Float number', 100.5, 100.5);
        await normalizeTest('null value', null, NaN);
        await normalizeTest('undefined value', undefined, NaN);
        await normalizeTest('Empty string', '', 0);
        await normalizeTest('Integer number string', '123', 123);
        await normalizeTest('Float number string with point', '123.567', 123.57);
        await normalizeTest('Float number string with comma', '123,567', 123.57);
        await normalizeTest('Float number string starts with point', '.56', 0.56);
        await normalizeTest('Float number string starts with comma', ',56', 0.56);
        await normalizeTest('Float number with long fractional part', 1.345000001, 1.35);
        await normalizeTest('Spaces around', ' 123.5678 ', 123.57);
        await normalizeTest('Spaces in between', ' 1 234.5678 ', 1);
    }

    async normalizePrecTests() {
        setBlock('normalize with precision parameter', 2);

        await normalizePrecTest('Integer number', 100, 5, 100);
        await normalizePrecTest('Float number', 100.5, 5, 100.5);
        await normalizePrecTest('null value', null, 5, NaN);
        await normalizePrecTest('undefined value', undefined, 5, NaN);
        await normalizePrecTest('Empty string', '', 5, 0);
        await normalizePrecTest('Integer number string', '123', 5, 123);
        await normalizePrecTest('Float number string with point', '123.567', 5, 123.567);
        await normalizePrecTest('Float number string with comma', '123,567', 5, 123.567);
        await normalizePrecTest('Float number string starts with point', '.5678', 5, 0.5678);
        await normalizePrecTest('Float number string starts with comma', ',5678', 5, 0.5678);
        await normalizePrecTest('Float number with long fractional part', 1.34567800001, 5, 1.34568);
        await normalizePrecTest('Spaces around', ' 123.5678 ', 5, 123.5678);
        await normalizePrecTest('Spaces in between', ' 1 234.5678 ', 5, 1);
    }

    async isValidValueTests() {
        setBlock('isValidValue', 2);

        await isValidValueTest('Integer number', 100, true);
        await isValidValueTest('Float number', 100.5, true);
        await isValidValueTest('null value', null, false);
        await isValidValueTest('undefined value', undefined, false);
        await isValidValueTest('Empty string', '', true);
        await isValidValueTest('Integer number string', '123', true);
        await isValidValueTest('Float number string with point', '123.567', true);
        await isValidValueTest('Float number string with comma', '123,567', true);
        await isValidValueTest('Float number string starts with point', '.5678', true);
        await isValidValueTest('Float number string starts with comma', ',5678', true);
        await isValidValueTest('Spaces around', ' 123.5678 ', true);
        await isValidValueTest('Spaces in between', ' 1 234.5678 ', true);
    }
}
