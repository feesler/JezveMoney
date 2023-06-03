import {
    TestComponent,
    assert,
    query,
    click,
    input,
    evaluate,
} from 'jezve-test';
import { DatePicker } from 'jezvejs-test';

export class DatePickerFilter extends TestComponent {
    async parseContent() {
        const res = {};

        res.stInputElem = await query(this.elem, 'input[name="stdate"]');
        assert(res.stInputElem, 'Start date input element not found');
        res.endInputElem = await query(this.elem, 'input[name="enddate"]');
        assert(res.endInputElem, 'End date input element not found');

        const [startDate, endDate] = await evaluate((startInp, endInp) => ([
            startInp.value,
            endInp.value,
        ]), res.stInputElem, res.endInputElem);

        res.value = { startDate, endDate };

        res.startDatePickerBtn = { elem: await query(this.elem, 'input[name="stdate"] ~ .calendar-btn') };
        assert(res.startDatePickerBtn, 'Date picker button not found');

        res.endDatePickerBtn = { elem: await query(this.elem, 'input[name="enddate"] ~ .calendar-btn') };
        assert(res.endDatePickerBtn, 'Date picker button not found');

        res.datePicker = await DatePicker.create(this.parent, await query(this.elem, '.dp__container'));

        res.clearStartBtn = { elem: await query(this.elem, 'input[name="stdate"] ~ .clear-btn') };
        assert(res.clearStartBtn, 'Clear button not found');

        res.clearEndBtn = { elem: await query(this.elem, 'input[name="enddate"] ~ .clear-btn') };
        assert(res.clearEndBtn, 'Clear button not found');

        return res;
    }

    async selectDate(date) {
        assert.isDate(date, 'Invalid parameter');
        assert(this.content.datePicker?.content?.visible, 'Date picker component not visible');

        await this.performAction(() => this.content.datePicker.selectDate(date));
    }

    async selectStart(date) {
        assert.isDate(date, 'Invalid parameters');
        assert(this.content.startDatePickerBtn?.visible, 'Start date picker button not visible');

        await this.performAction(() => click(this.content.startDatePickerBtn.elem));
        await this.selectDate(date);
    }

    async selectEnd(date) {
        assert.isDate(date, 'Invalid parameters');
        assert(this.content.endDatePickerBtn?.visible, 'End date picker button not visible');

        await this.performAction(() => click(this.content.endDatePickerBtn.elem));
        await this.selectDate(date);
    }

    async clearStart() {
        assert(this.content.clearStartBtn?.visible, 'Clear start date button not visible');
        return click(this.content.clearStartBtn.elem);
    }

    async clearEnd() {
        assert(this.content.clearEndBtn?.visible, 'Clear end date button not visible');
        return click(this.content.clearEndBtn.elem);
    }

    getSelectedRange() {
        return structuredClone(this.content.value);
    }

    async input(val) {
        return input(this.content.inputElem, val);
    }
}
