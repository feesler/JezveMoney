import {
    ce,
    svg,
    isDate,
    Popup,
} from 'jezvejs';

/** Types of transactions */
export const EXPENSE = 1;
export const INCOME = 2;
export const TRANSFER = 3;
export const DEBT = 4;

let messageBox = null;

/* Convert number to string and prepend zero if value is less than 10 */
export function leadZero(val) {
    const v = parseInt(val, 10);
    if (Number.isNaN(v)) {
        throw new Error('Invalid value');
    }

    if (v < 10) {
        return `0${v}`;
    }

    return v.toString();
}

/** Format date as DD.MM.YYYY */
export function formatDate(date) {
    if (!isDate(date)) {
        throw new Error('Invalid type of parameter');
    }

    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const day = date.getDate();
    return `${leadZero(day)}.${leadZero(month)}.${leadZero(year)}`;
}

/** Convert DD.MM.YYYY string to timestamp */
export function fixDate(str) {
    if (typeof str !== 'string') {
        return null;
    }

    const res = Date.parse(str.split('.').reverse().join('-'));
    if (Number.isNaN(res)) {
        return null;
    }

    return res;
}

/** Convert date string to timestamp */
export function timestampFromString(str) {
    if (typeof str === 'number') {
        return str;
    }
    if (isDate(str)) {
        return str.getTime();
    }
    if (typeof str !== 'string') {
        throw new Error('Invalid type of parameter');
    }

    let tmpDate = str;
    const pos = str.indexOf(' ');
    if (pos !== -1) {
        tmpDate = tmpDate.substr(0, pos);
    }

    return fixDate(tmpDate);
}

/**
 * Create notification message
 * @param {string} message - notification text
 * @param {string} msgClass - CSS class for message box
 */
export function createMessage(message, msgClass) {
    if (messageBox) {
        messageBox.destroy();
        messageBox = null;
    }

    messageBox = Popup.create({
        id: 'notificationPopup',
        content: message,
        btn: { closeBtn: true },
        additional: `msg ${msgClass}`,
        nodim: true,
        closeOnEmptyClick: true,
    });

    messageBox.show();
}

/** Create simple container element */
export function createContainer(elemClass, children, events) {
    return ce('div', { className: elemClass }, children, events);
}

/** Create SVG icon element */
export function createIcon(icon) {
    const useElem = svg('use');
    const res = svg('svg', {}, useElem);

    useElem.href.baseVal = (icon) ? `#${icon}` : '';

    return res;
}

/**
 * Create checkbox container from given input element
 * @param {Element} input - checkbox input element
 * @param {string} elemClass - class for checkbox container element
 * @param {string} title - optional title
 */
export function createCheck(input, elemClass, title) {
    if (!input) {
        throw new Error('Invalid input element');
    }

    const childs = [input];
    if (typeof title === 'string') {
        childs.push(ce('span', { textContent: title }));
    }

    return ce('label', { className: elemClass }, childs);
}

/** Create field element from given input element */
export function createField(title, input, extraClass) {
    const elemClasses = ['field'];

    if (typeof extraClass === 'string' && extraClass.length > 0) {
        elemClasses.push(extraClass);
    }

    return ce('div', { className: elemClasses.join(' ') }, [
        ce('label', { textContent: title }),
        ce('div', {}, input),
    ]);
}

/**
 * Fix string to correct float number format
 * @param {string} str - decimal value string
 */
export function fixFloat(str) {
    if (typeof str === 'number') {
        return str;
    }

    if (typeof str === 'string') {
        let res = str.replace(/,/g, '.');
        if (res.indexOf('.') === 0 || !res.length) {
            res = `0${res}`;
        }
        return res;
    }

    return null;
}

/** Convert string to amount value */
export function amountFix(value) {
    if (typeof value === 'number') {
        return value;
    }
    if (typeof value !== 'string') {
        return null;
    }

    const res = value.replace(/ /, '');
    return parseFloat(fixFloat(res));
}

/**
 * Correct calculated value
 * @param {string|Number} val - value to correct
 * @param {Number} prec - precision
 */
export function correct(val, prec = 2) {
    return parseFloat(parseFloat(val).toFixed(prec));
}

/**
 * Correct calculated exchange rate value
 * @param {string|Number} val - exchange rate value
 */
export function correctExch(val) {
    return correct(val, 5);
}

/**
 * Normalize monetary value from string
 * @param {string|Number} val - value to normalize
 * @param {Number} prec - precision of result decimal
 */
export function normalize(val, prec = 2) {
    return parseFloat(parseFloat(fixFloat(val)).toFixed(prec));
}

/**
 * Normalize exchange rate value from string
 * @param {string|Number} val - exchange rate value
 */
export function normalizeExch(val) {
    return normalize(val, 5);
}

/**
 * Check value is valid
 * @param {string|Number} val - value to check
 */
export function isValidValue(val) {
    return (typeof val !== 'undefined' && val !== null && !Number.isNaN(parseFloat(fixFloat(val))));
}
