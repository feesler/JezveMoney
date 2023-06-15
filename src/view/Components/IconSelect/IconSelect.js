import { DropDown } from 'jezvejs/DropDown';

import { __ } from '../../utils/utils.js';
import { App } from '../../Application/App.js';

import { IconListItem } from './IconListItem.js';
import './IconSelect.scss';

/**
 * Icon select component
 */
export class IconSelect extends DropDown {
    constructor(props = {}) {
        super({
            ...props,
            components: {
                ListItem: IconListItem,
            },
        });

        this.elem.classList.add('icon-select');

        this.initIcons();
    }

    initIcons() {
        const { icons } = App.model;

        this.addItem({ id: 0, title: __('icons.noIcon') });
        const items = icons.map((icon) => ({
            id: icon.id,
            file: icon.file,
            title: __(`icons.${icon.name}`),
        }));
        this.append(items);
    }
}
