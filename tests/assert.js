export const assert = {
    arrayIndex: (arr, ind, message = null) => {
        if (!Array.isArray(arr)) {
            throw new Error('Invalid array');
        }

        if (Number.isNaN(ind) || ind < 0 || ind >= arr.length) {
            const msg = (message === null) ? `Invalid index: ${ind}` : message;
            throw new Error(msg);
        }
    }
};
