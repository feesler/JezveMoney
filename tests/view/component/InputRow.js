import {
    TestComponent,
    assert,
    query,
    prop,
    hasAttr,
    hasClass,
    input,
    click,
    closest,
} from 'jezve-test';
import { DropDown } from 'jezvejs-test';

export class InputRow extends TestComponent {
    async parseContent() {
        const res = {
            labelEl: await query(this.elem, 'label'),
        };

        assert(res.labelEl, 'Label element not found');
        res.label = await prop(res.labelEl, 'textContent');

        const datePickerContainer = await query(this.elem, '.calendar');
        const btn = await query(this.elem, '.input-group__btn');
        if (datePickerContainer) {
            res.datePickerBtn = btn;
        } else {
            res.currElem = btn;
            if (res.currElem) {
                const disabled = await hasAttr(res.currElem, 'disabled');
                res.isCurrActive = !disabled;
                if (res.isCurrActive) {
                    const ddElem = await query(res.currElem, '.dd__container_attached');
                    res.currDropDown = await DropDown.create(this.parent, ddElem);
                    if (res.currDropDown) {
                        assert(res.currDropDown.content.isAttached, 'Currency drop down is not attached');
                    }
                }

                res.currSignElem = await query(res.currElem, '.input-group__btn-title');
            } else {
                res.isCurrActive = false;
                res.currElem = await query(this.elem, '.input-group__text');
                res.currSignElem = await query(this.elem, '.input-group__text-title');
            }
            res.currSignElem = res.currSignElem ?? res.currElem;
            res.currSign = await prop(res.currSignElem, 'textContent');
        }

        const hiddenInpElem = await query(this.elem, 'input[type="hidden"]');
        if (hiddenInpElem) {
            res.hiddenValue = await prop(hiddenInpElem, 'value');
        }

        res.valueInput = await query(this.elem, 'input[type="text"],input[type="password"]');
        res.value = await prop(res.valueInput, 'value');

        const validationElem = await closest(this.elem, '.validation-block');
        res.validationEnabled = !!validationElem;
        if (res.validationEnabled) {
            res.isInvalid = await hasClass(validationElem, 'invalid-block');
            res.feedBackElem = await query(validationElem, '.invalid-feedback');
            assert(res.feedBackElem, 'Validation feedback element not found');
            res.feedbackText = await prop(res.feedBackElem, 'textContent');
        } else {
            res.isInvalid = false;
        }

        return res;
    }

    get value() {
        return this.content.value;
    }

    get currSign() {
        return this.content.currSign;
    }

    get isInvalid() {
        return (this.content.validationEnabled) ? this.content.isInvalid : false;
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

    async clickButton() {
        assert(this.content.isCurrActive, 'Input group button not active');

        await click(this.content.currElem);
    }
}
