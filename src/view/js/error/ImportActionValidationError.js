'use strict';

/* global extendError */

/**
 * @constructor Import action validation error class
 * @param {string} message - error message string
 * @param {number} actionIndex - index of action in the list
 */
function ImportActionValidationError(message, actionIndex) {
    var instance = new Error(message);
    Object.setPrototypeOf(instance, Object.getPrototypeOf(this));

    instance.name = 'ImportActionValidationError';
    instance.actionIndex = actionIndex;

    return instance;
}

extendError(ImportActionValidationError);
