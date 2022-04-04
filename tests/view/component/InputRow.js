import { AppComponent } from './AppComponent.js';
import { DropDown } from './DropDown.js';

export class InputRow extends AppComponent {
    async parseContent() {
        const res = {
            labelEl: await this.query(this.elem, 'label'),
        };

        if (!res.labelEl) {
            throw new Error('Label element not found');
        }
        res.label = await this.prop(res.labelEl, 'textContent');

        res.currElem = await this.query(this.elem, '.btn.input-group__btn');
        res.isCurrActive = false;
        if (res.currElem) {
            res.isCurrActive = !await this.hasClass(res.currElem, 'input-group__btn_inactive');
            if (res.isCurrActive) {
                const ddElem = await this.query(res.currElem, ':scope > *');
                res.currDropDown = await DropDown.create(this.parent, ddElem);
                if (!res.currDropDown.content.isAttached) {
                    throw new Error('Currency drop down is not attached');
                }
            }

            res.currSignElem = await this.query(res.currElem, '.input-group__btn-title');
            res.currSign = await this.prop(res.currSignElem, 'textContent');
        } else {
            const datePickerContainer = await this.query('#calendar');
            if (datePickerContainer) {
                res.datePickerBtn = await this.query(this.elem, '.btn.icon-btn');
            }
        }

        const hiddenInpElem = await this.query(this.elem, 'input[type="hidden"]');
        if (hiddenInpElem) {
            res.hiddenValue = await this.prop(hiddenInpElem, 'value');
        }

        res.valueInput = await this.query(this.elem, '.stretch-input > input');
        res.value = await this.prop(res.valueInput, 'value');

        res.validationEnabled = await this.hasClass(this.elem, 'validation-block');
        if (res.validationEnabled) {
            res.isInvalid = await this.hasClass(this.elem, 'invalid-block');
            res.feedBackElem = await this.query(this.elem, '.invalid-feedback');
            if (!res.feedBackElem) {
                throw new Error('Validation feedback element not found');
            }
            res.feedbackText = await this.prop(res.feedBackElem, 'textContent');
        }

        return res;
    }

    async input(val) {
        return this.environment.input(this.content.valueInput, val.toString());
    }

    async selectCurr(currencyId) {
        if (typeof currencyId === 'undefined' || !currencyId) {
            throw new Error('Invalid currency id');
        }

        if (this.content.isCurrActive && this.content.currDropDown) {
            await this.content.currDropDown.setSelection(currencyId);
        }
    }
}
