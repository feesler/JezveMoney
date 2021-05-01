import { TestComponent, isDate } from 'jezve-test';
import { IconLink } from './IconLink.js';
import { InputRow } from './InputRow.js';
import { DatePicker } from './DatePicker.js';

export class DatePickerRow extends TestComponent {
    async parse() {
        this.iconLink = await IconLink.create(this.parent, await this.query(this.elem, '.iconlink'));
        if (!this.iconLink) {
            throw new Error('Iconlink of date picker not found');
        }

        this.inputRow = await InputRow.create(
            this.parent,
            await this.query(this.elem, '.iconlink + *'),
        );
        if (!this.inputRow || !this.inputRow.datePickerBtn) {
            throw new Error('Unexpected structure of date picker input row');
        }
        this.date = this.inputRow.value;

        this.datePicker = await DatePicker.create(
            this.parent,
            await this.query(this.elem, '.dp__container'),
        );
    }

    async selectDate(date) {
        if (!isDate(date)) {
            throw new Error('Invalid parameter');
        }

        if (await this.isVisible(this.iconLink.elem)) {
            await this.iconLink.click();
            await this.parse();
        }

        if (!this.datePicker) {
            throw new Error('Date picker component not found');
        }

        await this.datePicker.selectDate(date);
    }

    async input(val) {
        if (await this.isVisible(this.iconLink.elem)) {
            await this.iconLink.click();
            await this.click(this.inputRow.datePickerBtn);
        }

        return this.inputRow.input(val);
    }
}
