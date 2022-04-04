import { copyObject, isDate } from 'jezvejs';
import { AppComponent } from './AppComponent.js';
import { IconLink } from './IconLink.js';
import { DatePicker } from './DatePicker.js';

export class DatePickerFilter extends AppComponent {
    async parseContent() {
        const res = {
            iconLink: await IconLink.create(this.parent, await this.query(this.elem, '.iconlink')),
        };
        if (!res.iconLink) {
            throw new Error('Iconlink of date picker not found');
        }

        res.inputElem = await this.query(this.elem, '.stretch-input > input');
        if (!res.inputElem) {
            throw new Error('Input element not found');
        }

        let dateValue = await this.prop(res.inputElem, 'value');
        if (!dateValue) {
            dateValue = '';
        }

        if (dateValue === '') {
            res.value = { startDate: null, endDate: null };
        } else {
            const dates = dateValue.split(' - ');
            res.value = { startDate: dates[0], endDate: dates[1] };
        }

        res.datePickerBtn = await this.query(this.elem, '#cal_rbtn');
        if (!res.datePickerBtn) {
            throw new Error('Date picker button not found');
        }

        res.datePicker = await DatePicker.create(this.parent, await this.query(this.elem, '.dp__container'));

        res.clearBtn = await this.query(this.elem, '#nodatebtn');
        if (!res.clearBtn) {
            throw new Error('Clear button not found');
        }

        return res;
    }

    async selectDate(date) {
        if (!isDate(date)) {
            throw new Error('Invalid parameter');
        }

        if (await this.isVisible(this.content.iconLink.elem)) {
            await this.content.iconLink.click();
            await this.parse();
        }

        if (!this.content.datePicker) {
            throw new Error('Date picker component not found');
        }

        await this.content.datePicker.selectDate(date);
    }

    async selectRange(date1, date2) {
        if (!isDate(date1) || !isDate(date2)) {
            throw new Error('Invalid parameters');
        }

        if (await this.isVisible(this.content.iconLink.elem)) {
            await this.content.iconLink.click();
        } else {
            await this.click(this.content.datePickerBtn);
        }
        await this.parse();

        if (!this.content.datePicker) {
            throw new Error('Date picker component not found');
        }
        await this.content.datePicker.selectRange(date1, date2);
    }

    async clear() {
        if (await this.isVisible(this.content.iconLink.elem)) {
            await this.content.iconLink.click();
            await this.parse();
        }

        await this.click(this.content.clearBtn);
    }

    getSelectedRange() {
        return copyObject(this.content.value);
    }

    async input(val) {
        if (await this.isVisible(this.content.iconLink.elem)) {
            await this.content.iconLink.click();
            await this.parent.performAction(() => this.click(this.content.datePickerBtn));
        }

        return this.environment.input(this.content.inputElem, val);
    }
}
