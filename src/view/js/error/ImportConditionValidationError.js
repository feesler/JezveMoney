import { extendError } from 'jezvejs';

/**
 * Import condition validation error class
 * @param {string} message - error message string
 * @param {number} conditionIndex - index of condition in the list
 */
export function ImportConditionValidationError(message, conditionIndex) {
    const instance = new Error(message);
    Object.setPrototypeOf(instance, Object.getPrototypeOf(this));

    instance.name = 'ImportConditionValidationError';
    instance.conditionIndex = conditionIndex;

    return instance;
}

extendError(ImportConditionValidationError);
