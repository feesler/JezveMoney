import {
    TestComponent,
    assert,
    query,
    click,
    input,
    evaluate,
    queryAll,
} from 'jezve-test';

export class AmountRangeFilter extends TestComponent {
    get value() {
        return structuredClone(this.content.value);
    }

    get invalidated() {
        return this.content.invalidated;
    }

    async parseContent() {
        const res = {
            value: {},
        };

        const [minGroupEl, maxGroupEl] = await queryAll(this.elem, '.input-group');
        res.minInputGroup = { elem: minGroupEl };
        res.minInputElem = await query(minGroupEl, 'input');
        assert(res.minInputElem, 'Min. amount input element not found');
        res.clearMinBtn = { elem: await query(minGroupEl, '.clear-btn') };

        res.maxInputGroup = { elem: maxGroupEl };
        res.maxInputElem = await query(maxGroupEl, 'input');
        assert(res.maxInputElem, 'Max. amount input element not found');

        res.clearMaxBtn = { elem: await query(maxGroupEl, '.clear-btn') };

        [
            res.invalidated,
            res.minInputGroup.visible,
            res.maxInputGroup.visible,
            res.value.minAmount,
            res.value.maxAmount,
            res.clearMinBtn.visible,
            res.clearMaxBtn.visible,
        ] = await evaluate(
            (el, minEl, maxEl, minInp, maxInp, minClearBtn, maxClearBtn) => ([
                el.classList.contains('invalid-block'),
                minEl && !minEl.hidden,
                maxEl && !maxEl.hidden,
                minInp.value,
                maxInp.value,
                minClearBtn && !minClearBtn.hidden,
                maxClearBtn && !maxClearBtn.hidden,
            ]),
            this.elem,
            minGroupEl,
            maxGroupEl,
            res.minInputElem,
            res.maxInputElem,
            res.clearMinBtn.elem,
            res.clearMaxBtn.elem,
        );

        return res;
    }

    async clearMin() {
        assert(this.content.clearMinBtn?.visible, 'Clear min. amount button not visible');
        return click(this.content.clearMinBtn.elem);
    }

    async clearMax() {
        assert(this.content.clearMaxBtn?.visible, 'Clear max. amount button not visible');
        return click(this.content.clearMaxBtn.elem);
    }

    getSelectedRange() {
        return structuredClone(this.content.value);
    }

    async inputMin(val) {
        return input(this.content.minInputElem, val);
    }

    async inputMax(val) {
        return input(this.content.maxInputElem, val);
    }
}
