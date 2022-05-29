import { extendError } from 'jezvejs';

/**
 * Import template applying error class
 * @param {string} message - error message string
 * @param {string} column - column caused error
 */
export function ImportTemplateError(message, column) {
    const instance = new Error(message);
    Object.setPrototypeOf(instance, Object.getPrototypeOf(this));

    instance.name = 'ImportTemplateError';
    instance.column = column;

    return instance;
}

extendError(ImportTemplateError);
