import {
    assert,
    click,
    query,
} from 'jezve-test';
import { DatePicker } from 'jezvejs-test';
import { InputRow } from './InputRow.js';

export class DatePickerRow extends InputRow {
    async parseContent() {
        const res = await super.parseContent();

        res.datePicker = await DatePicker.create(
            this.parent,
            await query(this.elem, '.dp__container'),
        );

        res.value = res.value.replaceAll('_', '');

        return res;
    }

    async toggleDatePicker() {
        return this.performAction(() => click(this.content.datePickerBtn));
    }

    async selectDate(date) {
        assert.isDate(date, 'Invalid parameter');

        if (!this.content.datePicker) {
            await this.toggleDatePicker();
        }

        assert(this.content.datePicker, 'Date picker component not found');

        await this.content.datePicker.selectDate(date);
    }
}
