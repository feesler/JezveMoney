import { getClassNames } from 'jezvejs';
import { Button } from 'jezvejs/Button';
import './FieldHeaderButton.scss';

/* CSS classes */
const BUTTON_CLASS = 'field-header-btn';

const defaultProps = {
    dataValue: undefined,
    type: 'link',
};

/**
 * Field header button component
 */
export class FieldHeaderButton extends Button {
    constructor(props = {}) {
        super({
            ...defaultProps,
            ...props,
            className: getClassNames(BUTTON_CLASS, props.className),
        });
    }

    render(state, prevState = {}) {
        super.render(state, prevState);

        this.elem.dataset.value = state.dataValue;
    }
}
