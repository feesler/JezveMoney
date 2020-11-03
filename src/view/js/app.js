'use strict';

/* global Popup */
/* exported EXPENSE, INCOME, TRANSFER, DEBT */
/* exported createMessage, fixFloat, correct, correctExch, normalize, normalizeExch, isValidValue */

/** Types of transactions */
var EXPENSE = 1;
var INCOME = 2;
var TRANSFER = 3;
var DEBT = 4;

var messageBox = null;

/**
 * Create notification message
 * @param {string} message - notification text
 * @param {string} msgClass - CSS class for message box
 */
function createMessage(message, msgClass) {
    if (messageBox) {
        messageBox.destroy();
        messageBox = null;
    }

    messageBox = Popup.create({
        id: 'notificationPopup',
        content: message,
        btn: { closeBtn: true },
        additional: 'msg ' + msgClass,
        nodim: true,
        closeOnEmptyClick: true
    });

    messageBox.show();
}

/**
 * Fix string to correct float number format
 * @param {string} str - decimal value string
 */
function fixFloat(str) {
    var res;

    if (typeof str === 'number') {
        return str;
    }

    if (typeof str === 'string') {
        res = str.replace(/,/g, '.');
        if (res.indexOf('.') === 0 || !res.length) {
            res = '0' + res;
        }
        return res;
    }

    return null;
}

/**
 * Correct calculated value
 * @param {string|Number} val - value to correct
 * @param {Number} prec - precision
 */
function correct(val, prec) {
    var p = (typeof prec !== 'undefined') ? prec : 2;
    return parseFloat(parseFloat(val).toFixed(p));
}

/**
 * Correct calculated exchange rate value
 * @param {string|Number} val - exchange rate value
 */
function correctExch(val) {
    return correct(val, 5);
}

/**
 * Normalize monetary value from string
 * @param {string|Number} val - value to normalize
 * @param {Number} prec - precision of result decimal
 */
function normalize(val, prec) {
    var p = (typeof prec !== 'undefined') ? prec : 2;
    return parseFloat(parseFloat(fixFloat(val)).toFixed(p));
}

/**
 * Normalize exchange rate value from string
 * @param {string|Number} val - exchange rate value
 */
function normalizeExch(val) {
    return normalize(val, 5);
}

/**
 * Check value is valid
 * @param {string|Number} val - value to check
 */
function isValidValue(val) {
    return (typeof val !== 'undefined' && val !== null && !Number.isNaN(parseFloat(fixFloat(val))));
}
