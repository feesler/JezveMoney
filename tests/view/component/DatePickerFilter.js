import {
    TestComponent,
    assert,
    query,
    prop,
    click,
    input,
    copyObject,
} from 'jezve-test';
import { DatePicker } from 'jezvejs-test';

export class DatePickerFilter extends TestComponent {
    async parseContent() {
        const res = {};

        res.stInputElem = await query(this.elem, 'input[name="stdate"]');
        assert(res.stInputElem, 'Start date input element not found');
        res.endInputElem = await query(this.elem, 'input[name="enddate"]');
        assert(res.endInputElem, 'End date input element not found');

        const startDate = await prop(res.stInputElem, 'value');
        const endDate = await prop(res.endInputElem, 'value');
        if (!startDate || startDate === '') {
            res.value = { startDate: null, endDate: null };
        } else {
            res.value = { startDate, endDate };
        }

        res.datePickerBtn = await query(this.elem, '.input-group__btn');
        assert(res.datePickerBtn, 'Date picker button not found');

        res.datePicker = await DatePicker.create(this.parent, await query(this.elem, '.dp__container'));

        res.clearBtn = await query(this.elem, '.clear-btn');
        assert(res.clearBtn, 'Clear button not found');

        return res;
    }

    async selectDate(date) {
        assert.isDate(date, 'Invalid parameter');
        assert(this.content.datePicker, 'Date picker component not found');

        await this.content.datePicker.selectDate(date);
    }

    async selectRange(date1, date2) {
        assert.isDate(date1, 'Invalid parameters');
        assert.isDate(date2, 'Invalid parameters');

        await click(this.content.datePickerBtn);
        await this.parse();

        assert(this.content.datePicker, 'Date picker component not found');
        await this.content.datePicker.selectRange(date1, date2);
    }

    async clear() {
        await click(this.content.clearBtn);
    }

    getSelectedRange() {
        return copyObject(this.content.value);
    }

    async input(val) {
        return input(this.content.inputElem, val);
    }
}
