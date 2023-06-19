import { getClassNames } from 'jezvejs';
import { Button } from 'jezvejs/Button';
import './DateRangeSelector.scss';

/* CSS classes */
const SELECTOR_BUTTON_CLASS = 'range-selector-btn';

export class DateRangeSelector extends Button {
    constructor(props = {}) {
        super({
            ...props,
            type: 'link',
            className: getClassNames(SELECTOR_BUTTON_CLASS, props.className),
        });

        if (props.rangeType) {
            this.elem.dataset.range = props.rangeType;
        }
    }
}
