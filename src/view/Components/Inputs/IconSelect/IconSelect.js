import { getClassName } from 'jezvejs';
import { DropDown } from 'jezvejs/DropDown';

import { __ } from '../../../utils/utils.js';
import { App } from '../../../Application/App.js';

import './IconSelect.scss';

/* CSS classes */
const ICON_SELECT_CLASS = 'icon-select';

/**
 * Icon select component
 */
export class IconSelect extends DropDown {
    constructor(props = {}) {
        super({
            ...props,
            className: getClassName(ICON_SELECT_CLASS, props.className),
        });

        this.initIcons();
    }

    initIcons() {
        const { icons } = App.model;

        this.addItem({ id: 0, title: __('icons.byName.noIcon') });
        const items = icons.map((icon) => ({
            id: icon.id,
            icon: icon.file,
            title: __(`icons.byName.${icon.name}`),
        }));
        this.append(items);
    }
}
