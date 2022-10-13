import {
    assert,
    query,
} from 'jezve-test';
import { DatePicker } from 'jezvejs-test';
import { InputRow } from './InputRow.js';

export class DatePickerRow extends InputRow {
    async parseContent() {
        const res = await super.parseContent();

        res.date = res.value;

        res.datePicker = await DatePicker.create(
            this.parent,
            await query(this.elem, '.dp__container'),
        );

        return res;
    }

    async selectDate(date) {
        assert.isDate(date, 'Invalid parameter');
        assert(this.content.datePicker, 'Date picker component not found');

        await this.content.datePicker.selectDate(date);
    }
}
