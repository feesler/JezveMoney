import { __ } from './locale.js';

/** Icon class */
export class Icon {
    static noIcon(locale) {
        return {
            id: 0,
            name: __('ACCOUNT_NO_ICON', locale),
            file: null,
            type: null,
        };
    }

    constructor(props) {
        Object.keys(props).forEach((key) => {
            this[key] = props[key];
        });
    }
}
