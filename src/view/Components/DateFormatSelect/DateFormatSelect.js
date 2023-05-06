import { DropDown } from 'jezvejs/DropDown';

const dateFormatItems = [
    { id: 'ru', title: 'dd.MM.YYYY' },
    { id: 'lt', title: 'YYYY-MM-dd' },
    { id: 'fr', title: 'dd/MM/YYYY' },
    { id: 'ar', title: 'dYYYY/M/' },
    { id: 'es', title: 'd/M/YY' },
    { id: 'zh', title: 'YYYY/M/d' },
    { id: 'hr', title: 'dd. MM. YYYY.' },
    { id: 'uk', title: 'dd.MM.YY' },
    { id: 'nl', title: 'dd-MM-YYYY' },
    { id: 'en', title: 'M/d/YY' },
    { id: 'fi', title: 'd.M.YYYY' },
    { id: 'hu', title: 'YYYY. MM. dd.' },
    { id: 'it', title: 'dd/MM/YY' },
    { id: 'ja', title: 'YYYY/MM/dd' },
    { id: 'ko', title: 'YY. MM. dd.' },
    { id: 'ms', title: 'd/MM/YY' },
    { id: 'pl', title: 'd.MM.YYYY' },
    { id: 'sr', title: 'd.MM.YY.' },
    { id: 'sk', title: 'd. MM. YYYY.' },
    { id: 'sl', title: 'd. MM. YY' },
    { id: 'te', title: 'dd-MM-YY' },
];

/**
 * Date format DropDown component
 */
export class DateFormatSelect extends DropDown {
    constructor(props = {}) {
        super({
            ...props,
            data: dateFormatItems,
        });
    }
}
