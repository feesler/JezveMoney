import {
    isDate,
    TestComponent,
    query,
    isVisible,
    click,
} from 'jezve-test';
import { IconLink } from './IconLink.js';
import { InputRow } from './InputRow.js';
import { DatePicker } from './DatePicker.js';

export class DatePickerRow extends TestComponent {
    async parseContent() {
        const res = {};

        res.iconLink = await IconLink.create(this.parent, await query(this.elem, '.iconlink'));
        if (!res.iconLink) {
            throw new Error('Iconlink of date picker not found');
        }

        res.inputRow = await InputRow.create(
            this.parent,
            await query(this.elem, '.iconlink + *'),
        );
        if (!res.inputRow || !res.inputRow.content.datePickerBtn) {
            throw new Error('Unexpected structure of date picker input row');
        }
        res.date = res.inputRow.content.value;

        res.datePicker = await DatePicker.create(
            this.parent,
            await query(this.elem, '.dp__container'),
        );

        return res;
    }

    async selectDate(date) {
        if (!isDate(date)) {
            throw new Error('Invalid parameter');
        }

        if (await isVisible(this.content.iconLink.elem)) {
            await this.content.iconLink.click();
            await this.parse();
        }

        if (!this.content.datePicker) {
            throw new Error('Date picker component not found');
        }

        await this.content.datePicker.selectDate(date);
    }

    async input(val) {
        if (await isVisible(this.content.iconLink.elem)) {
            await this.content.iconLink.click();
            await click(this.content.inputRow.content.datePickerBtn);
        }

        return this.content.inputRow.input(val);
    }
}
