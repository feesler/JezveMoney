import {
    TestComponent,
    assert,
    query,
    prop,
    hasClass,
    input,
} from 'jezve-test';
import { DropDown } from './DropDown.js';

export class InputRow extends TestComponent {
    async parseContent() {
        const res = {
            labelEl: await query(this.elem, 'label'),
        };

        assert(res.labelEl, 'Label element not found');
        res.label = await prop(res.labelEl, 'textContent');

        res.currElem = await query(this.elem, '.btn.input-group__btn');
        res.isCurrActive = false;
        if (res.currElem) {
            res.isCurrActive = !await hasClass(res.currElem, 'input-group__btn_inactive');
            if (res.isCurrActive) {
                const ddElem = await query(res.currElem, ':scope > *');
                res.currDropDown = await DropDown.create(this.parent, ddElem);
                assert(res.currDropDown.content.isAttached, 'Currency drop down is not attached');
            }

            res.currSignElem = await query(res.currElem, '.input-group__btn-title');
            res.currSign = await prop(res.currSignElem, 'textContent');
        } else {
            const datePickerContainer = await query('#calendar');
            if (datePickerContainer) {
                res.datePickerBtn = await query(this.elem, '.btn.icon-btn');
            }
        }

        const hiddenInpElem = await query(this.elem, 'input[type="hidden"]');
        if (hiddenInpElem) {
            res.hiddenValue = await prop(hiddenInpElem, 'value');
        }

        res.valueInput = await query(this.elem, '.stretch-input > input');
        res.value = await prop(res.valueInput, 'value');

        res.validationEnabled = await hasClass(this.elem, 'validation-block');
        if (res.validationEnabled) {
            res.isInvalid = await hasClass(this.elem, 'invalid-block');
            res.feedBackElem = await query(this.elem, '.invalid-feedback');
            assert(res.feedBackElem, 'Validation feedback element not found');
            res.feedbackText = await prop(res.feedBackElem, 'textContent');
        }

        return res;
    }

    async input(val) {
        return input(this.content.valueInput, val.toString());
    }

    async selectCurr(currencyId) {
        assert(currencyId, 'Invalid currency id');

        if (this.content.isCurrActive && this.content.currDropDown) {
            await this.content.currDropDown.setSelection(currencyId);
        }
    }
}
