import {
    TestComponent,
    assert,
    query,
    prop,
    isVisible,
    click,
    input,
} from 'jezve-test';
import { copyObject } from 'jezvejs';
import { DatePicker } from 'jezvejs/tests';
import { IconLink } from './IconLink.js';

export class DatePickerFilter extends TestComponent {
    async parseContent() {
        const res = {
            iconLink: await IconLink.create(this.parent, await query(this.elem, '.iconlink')),
        };
        assert(res.iconLink, 'Iconlink of date picker not found');

        res.inputElem = await query(this.elem, '.stretch-input');
        assert(res.inputElem, 'Input element not found');

        let dateValue = await prop(res.inputElem, 'value');
        if (!dateValue) {
            dateValue = '';
        }

        if (dateValue === '') {
            res.value = { startDate: null, endDate: null };
        } else {
            const dates = dateValue.split(' - ');
            res.value = { startDate: dates[0], endDate: dates[1] };
        }

        res.datePickerBtn = await query(this.elem, '#cal_rbtn');
        assert(res.datePickerBtn, 'Date picker button not found');

        res.datePicker = await DatePicker.create(this.parent, await query(this.elem, '.dp__container'));

        res.clearBtn = await query(this.elem, '#nodatebtn');
        assert(res.clearBtn, 'Clear button not found');

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

    async selectRange(date1, date2) {
        assert.isDate(date1, 'Invalid parameters');
        assert.isDate(date2, 'Invalid parameters');

        if (await isVisible(this.content.iconLink.elem)) {
            await this.content.iconLink.click();
        } else {
            await click(this.content.datePickerBtn);
        }
        await this.parse();

        assert(this.content.datePicker, 'Date picker component not found');
        await this.content.datePicker.selectRange(date1, date2);
    }

    async clear() {
        if (await isVisible(this.content.iconLink.elem)) {
            await this.content.iconLink.click();
            await this.parse();
        }

        await click(this.content.clearBtn);
    }

    getSelectedRange() {
        return copyObject(this.content.value);
    }

    async input(val) {
        if (await isVisible(this.content.iconLink.elem)) {
            await this.content.iconLink.click();
            await this.parent.performAction(() => click(this.content.datePickerBtn));
        }

        return input(this.content.inputElem, val);
    }
}
