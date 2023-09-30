/**
 * Converts argument to number and in case of valid value returns result or 0 otherwise
 * @param {*} value
 * @returns
 */
export const getFixedValue = (value) => {
    const numberValue = parseFloat(value);
    return Number.isNaN(numberValue) ? 0 : numberValue;
};
