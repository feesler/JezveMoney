import {
    TestComponent,
    assert,
    query,
    isVisible,
    click,
} from 'jezve-test';
import { DatePicker } from 'jezvejs-test';
import { IconLink } from './IconLink.js';
import { InputRow } from './InputRow.js';

export class DatePickerRow extends TestComponent {
    async parseContent() {
        const res = {};

        res.iconLink = await IconLink.create(this.parent, await query(this.elem, '.iconlink'));
        assert(res.iconLink, 'Iconlink of date picker not found');

        res.inputRow = await InputRow.create(
            this.parent,
            await query(this.elem, '.iconlink + *'),
        );
        assert(
            res.inputRow
            && res.inputRow.content.datePickerBtn,
            'Unexpected structure of date picker input row',
        );
        res.date = res.inputRow.content.value;

        res.datePicker = await DatePicker.create(
            this.parent,
            await query(this.elem, '.dp__container'),
        );

        return res;
    }

    async selectDate(date) {
        assert.isDate(date, 'Invalid parameter');

        if (await isVisible(this.content.iconLink.elem)) {
            await this.content.iconLink.click();
            await this.parse();
        }

        assert(this.content.datePicker, 'Date picker component not found');

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
