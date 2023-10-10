import {
    TestComponent,
    assert,
    query,
    input,
    click,
    evaluate,
} from 'jezve-test';
import { DropDown } from 'jezvejs-test';

export class InputField extends TestComponent {
    async parseContent() {
        const valueInput = await query(this.elem, 'input[type="text"],input[type="password"],input[type="color"]');
        assert(valueInput, 'Input element not found');

        const btn = await query(this.elem, '.input-group__btn');

        const res = await evaluate((el, inputEl, btnEl) => {
            const datePickerContainer = el.querySelector('.calendar');
            const isDatePicker = !!datePickerContainer;
            const isCurrActive = !!(!isDatePicker && btnEl && !btnEl?.disabled);

            const btnTitleElem = (btnEl)
                ? btnEl.querySelector('.input-group__btn-title')
                : el.querySelector('.input-group__text-title');
            const currSignElem = (btnTitleElem ?? btnEl);
            const currSign = currSignElem?.textContent;

            const validationElem = el.closest('.validation-block');
            const validationEnabled = !!validationElem;
            const isInvalid = validationElem?.classList?.contains('invalid-block');
            const feedBackElem = validationElem?.querySelector('.invalid-feedback');
            const feedbackText = feedBackElem?.textContent;

            return {
                label: el.querySelector('label')?.textContent,
                value: inputEl.value,
                disabled: inputEl.disabled,
                validationEnabled,
                isInvalid,
                feedbackText,
                isDatePicker,
                isCurrActive,
                currSign,
            };
        }, this.elem, valueInput, btn);

        res.valueInput = valueInput;

        if (res.isDatePicker) {
            res.datePickerBtn = btn;
        } else {
            res.currElem = btn;
            if (res.isCurrActive) {
                const ddElem = await query(res.currElem, '.dd__container_attached');
                res.currDropDown = await DropDown.create(this.parent, ddElem);
                if (res.currDropDown) {
                    assert(res.currDropDown.content.isAttached, 'Currency drop down is not attached');
                }
            }
        }

        return res;
    }

    get visible() {
        return this.content.visible;
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
        assert(this.content.valueInput, 'Input element not found');
        return input(this.content.valueInput, val.toString());
    }

    async selectCurr(currencyId) {
        assert(currencyId, 'Invalid currency id');
        assert(
            this.content.isCurrActive && this.content.currDropDown,
            'Currency DropDown not available',
        );

        return this.content.currDropDown.setSelection(currencyId);
    }

    async clickButton() {
        assert(this.content.isCurrActive, 'Input group button not active');

        return click(this.content.currElem);
    }
}
