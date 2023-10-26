import { getClassNames } from '@jezvejs/dom';
import { LinkMenu } from 'jezvejs/LinkMenu';
import { __ } from '../../../utils/utils.js';
import './ToggleDetailsButton.scss';

/* CSS classes */
const BUTTON_CLASS = 'mode-selector';

const defaultProps = {
    defaultItemType: 'link',
    itemParam: 'mode',
};

/**
 * Toggle details / list mode button
 */
export class ToggleDetailsButton extends LinkMenu {
    constructor(props = {}) {
        super({
            ...defaultProps,
            ...props,
            className: getClassNames(BUTTON_CLASS, props.className),
            items: [{
                id: 'details',
                icon: 'mode-details',
                title: __('transactions.showDetails'),
            }, {
                id: 'classic',
                icon: 'mode-list',
                title: __('transactions.showMain'),
            }],
        });
    }
}
