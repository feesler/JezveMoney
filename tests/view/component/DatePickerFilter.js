import { TestComponent, copyObject, isDate } from 'jezve-test';
import { IconLink } from './IconLink.js';
import { DatePicker } from './DatePicker.js';

export class DatePickerFilter extends TestComponent {
    async parse() {
        this.iconLink = await IconLink.create(this.parent, await this.query(this.elem, '.iconlink'));
        if (!this.iconLink) {
            throw new Error('Iconlink of date picker not found');
        }

        this.inputElem = await this.query(this.elem, '.stretch-input > input');
        if (!this.inputElem) {
            throw new Error('Input element not found');
        }

        let dateValue = await this.prop(this.inputElem, 'value');
        if (!dateValue) {
            dateValue = '';
        }

        if (dateValue === '') {
            this.value = { startDate: null, endDate: null };
        } else {
            const dates = dateValue.split(' - ');
            this.value = { startDate: dates[0], endDate: dates[1] };
        }

        this.datePickerBtn = await this.query(this.elem, '#cal_rbtn');
        if (!this.datePickerBtn) {
            throw new Error('Date picker button not found');
        }

        this.datePicker = await DatePicker.create(this.parent, await this.query(this.elem, '.dp__container'));
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

    async selectRange(date1, date2) {
        if (!isDate(date1) || !isDate(date2)) {
            throw new Error('Invalid parameters');
        }

        if (await this.isVisible(this.iconLink.elem)) {
            await this.iconLink.click();
        } else {
            await this.click(this.datePickerBtn);
        }
        await this.parse();

        if (!this.datePicker) {
            throw new Error('Date picker component not found');
        }
        await this.datePicker.selectRange(date1, date2);
    }

    getSelectedRange() {
        return copyObject(this.value);
    }

    async input(val) {
        if (await this.isVisible(this.iconLink.elem)) {
            await this.iconLink.click();
            await this.parent.performAction(() => this.click(this.datePickerBtn));
        }

        return this.environment.input(this.inputElem, val);
    }
}
