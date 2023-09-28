import { DropDown } from 'jezvejs/DropDown';

const numberFormatItems = [
    { id: 'ru', title: '1 234 567,89' },
    { id: 'es', title: '1.234.567,89' },
    { id: 'en', title: '1,234,567.89' },
    { id: 'de-ch', title: '1’234’567.89' },
    { id: 'hi', title: '12,34,567.345' },
];

/**
 * Number format DropDown component
 */
export class NumberFormatSelect extends DropDown {
    constructor(props = {}) {
        super({
            ...props,
            data: numberFormatItems,
        });
    }
}
