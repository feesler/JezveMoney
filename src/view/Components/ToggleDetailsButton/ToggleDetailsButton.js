import { getClassNames, isFunction } from 'jezvejs';
import { Button } from 'jezvejs/Button';
import { __ } from '../../utils/utils.js';
import './ToggleDetailsButton.scss';

/* CSS classes */
const BUTTON_CLASS = 'mode-selector';

const DETAILS_ICON = 'mode-details';
const LIST_ICON = 'mode-list';

const getContentState = (state) => ({
    ...state,
    icon: (state.details) ? LIST_ICON : DETAILS_ICON,
    title: (state.details) ? __('TR_LIST_SHOW_MAIN') : __('TR_LIST_SHOW_DETAILS'),
});

const defaultProps = {
    type: 'link',
    details: true,
};

/**
 * Toggle details / list mode button
 */
export class ToggleDetailsButton extends Button {
    constructor(props = {}) {
        super(getContentState({
            ...defaultProps,
            ...props,
            className: getClassNames(BUTTON_CLASS, props.className),
        }));
    }

    /** Updates state of component and render changes */
    setState(state) {
        const newState = isFunction(state) ? state(this.state) : state;

        super.setState(getContentState(newState));
    }
}
