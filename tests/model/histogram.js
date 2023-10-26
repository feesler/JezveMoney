import { isObject } from '@jezvejs/types';

/** Returns array of data sets */
export const getDataSets = (chartData) => {
    const { values } = chartData;
    if (values.length === 0) {
        return [];
    }

    const [firstItem] = values;
    if (!isObject(firstItem)) {
        const data = values;
        return [{ data }];
    }

    return values;
};

/**
 * Returns array of groups for specified data
 * @param {Array} dataSets
 * @returns {Array}
 */
export const getStackedGroups = (dataSets) => (
    dataSets.reduce((resGroups, item) => {
        const stackedGroup = item.group ?? null;
        return resGroups.includes(stackedGroup) ? resGroups : [...resGroups, stackedGroup];
    }, [])
);

/**
 * Returns count of columns in group for specified data
 * @param {Array} dataSets
 * @returns {number}
 */
export const getColumnsInGroupCount = (dataSets) => {
    const stackedGroups = getStackedGroups(dataSets);
    return Math.max(stackedGroups.length, 1);
};

/**
 * Returns count of non zero values in the specified array
 * @param {Array} values
 * @returns {number}
 */
export const getValidValuesCount = (values) => values.reduce((count, value) => (
    (value === 0) ? count : (count + 1)
), 0);

/**
 * Returns data of longest data set from array
 * @param {Array} dataSets
 * @returns {Array}
 */
export const getLongestDataSet = (dataSets) => {
    const resIndex = dataSets.reduce((longestIndex, item, index) => (
        (dataSets[longestIndex].data.length < item.data.length) ? index : longestIndex
    ), 0);

    return dataSets[resIndex]?.data ?? [];
};

/**
 * Pads array with zeros up to specified length and returns result
 * @param {Array} data
 * @param {Number} length
 * @returns {Array}
 */
export const padArray = (data, length) => (
    (length > data.length)
        ? data.concat(Array(length - data.length).fill(0))
        : data
);
