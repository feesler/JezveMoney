import { assert } from '@jezvejs/assert';
import {
    TestComponent,
    query,
    click,
    input,
    evaluate,
    queryAll,
} from 'jezve-test';
import { DatePicker } from 'jezvejs-test';

export class DatePickerFilter extends TestComponent {
    get value() {
        return { ...this.content.value };
    }

    get invalidated() {
        return this.content.invalidated;
    }

    async parseContent() {
        const res = {
            value: {},
        };

        const [startGroupEl, endGroupEl] = await queryAll(this.elem, '.input-group');
        res.startInputGroup = { elem: startGroupEl };
        res.endInputGroup = { elem: endGroupEl };

        res.stInputElem = await query(startGroupEl, 'input');
        assert(res.stInputElem, 'Start date input element not found');
        res.endInputElem = await query(endGroupEl, 'input');
        assert(res.endInputElem, 'End date input element not found');

        res.startDatePickerBtn = { elem: await query(startGroupEl, '.calendar-btn') };
        assert(res.startDatePickerBtn.elem, 'Date picker button not found');

        res.endDatePickerBtn = { elem: await query(endGroupEl, '.calendar-btn') };
        assert(res.endDatePickerBtn.elem, 'Date picker button not found');

        res.clearStartBtn = { elem: await query(startGroupEl, '.clear-btn') };
        res.clearEndBtn = { elem: await query(endGroupEl, '.clear-btn') };

        [
            res.invalidated,
            res.startInputGroup.visible,
            res.endInputGroup.visible,
            res.value.startDate,
            res.value.endDate,
            res.clearStartBtn.visible,
            res.clearEndBtn.visible,
        ] = await evaluate(
            (el, startEl, endEl, startInp, endInp, stClearBtn, endClearBtn) => ([
                el.classList.contains('invalid-block'),
                startEl && !startEl.hidden,
                endEl && !endEl.hidden,
                startInp.value,
                endInp.value,
                stClearBtn && !stClearBtn.hidden,
                endClearBtn && !endClearBtn.hidden,
            ]),
            this.elem,
            startGroupEl,
            endGroupEl,
            res.stInputElem,
            res.endInputElem,
            res.clearStartBtn.elem,
            res.clearEndBtn.elem,
        );

        res.datePicker = await DatePicker.create(this.parent, await query(this.elem, '.dp__container'));

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

    async inputStart(val) {
        return input(this.content.stInputElem, val);
    }

    async inputEnd(val) {
        return input(this.content.endInputElem, val);
    }
}
