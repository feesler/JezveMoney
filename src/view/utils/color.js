import { asArray } from 'jezvejs';

/* eslint-disable no-bitwise */

/**
 * Converts color string to integer and returns result
 * @param {string|number} value
 * @returns {number}
 */
export const colorToInt = (value) => (
    (
        (typeof value === 'number')
            ? value
            : parseInt(
                (
                    (typeof value === 'string' && value.startsWith('#'))
                        ? value.substring(1)
                        : value
                ),
                16,
            )
    ) & 0xffffff
);

/**
 * Converts integer value to color string and returns result
 * @param {number} value
 * @returns {string}
 */
export const intToColor = (value) => (
    `#${(value & 0xffffff).toString(16)}`
);

/**
 * Returns RGB object for specified color
 * @param {number} value
 * @returns {object}
 */
export const getRGB = (value) => {
    const color = colorToInt(value);
    return {
        red: ((color >> 16) & 0xff),
        green: ((color >> 8) & 0xff),
        blue: (color & 0xff),
    };
};

/**
 * Calculates color part for relative luminance and returns result
 * @param {number} value - red, green or blue part of color
 * @returns {number}
 */
const luminancePart = (value) => {
    const n = (value & 0xff) / 255;
    return (n <= 0.04045) ? (n / 12.92) : (((n + 0.055) / 1.055) ** 2.24);
};

/**
 * Returns relative luminance for specified color
 * @param {string|number} color
 * @returns {number}
 */
export const getLuminance = (color) => {
    const rgb = getRGB(color);
    return (
        luminancePart(rgb.red) * 0.2126
        + luminancePart(rgb.green) * 0.7152
        + luminancePart(rgb.blue) * 0.0722
    );
};

/**
 * Calculates contrast ratio between specified colors and returns result
 * @param {string|number} color
 * @param {string|number} background
 * @returns {number}
 */
export const getContrastRatio = (color, background) => {
    const lc = getLuminance(color);
    const lb = getLuminance(background);
    const l1 = Math.max(lc, lb);
    const l2 = Math.min(lc, lb);
    return (l1 + 0.05) / (l2 + 0.05);
};

/**
 * Returns most contrast color from specified list relative to the base color
 * @param {string|number} baseColor
 * @param {string|number|Array} secondaryColors
 * @returns {number}
 */
export const getContrastColor = (baseColor, secondaryColors) => {
    const base = colorToInt(baseColor);
    const secondary = asArray(secondaryColors).reduce((res, item) => {
        const color = colorToInt(item);
        const contrastRatio = getContrastRatio(base, color);
        return (contrastRatio > res.contrastRatio)
            ? { color, contrastRatio }
            : res;
    }, { contrastRatio: 0 });

    const res = secondary?.color ?? null;
    return (res === null) ? null : intToColor(res);
};
