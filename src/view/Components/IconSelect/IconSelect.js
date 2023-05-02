import { DropDown } from 'jezvejs/DropDown';
import { __ } from '../../utils/utils.js';
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
        const { icons } = window.app.model;

        this.addItem({ id: 0, title: __('ACCOUNT_NO_ICON') });
        const items = icons.map((icon) => ({
            id: icon.id,
            file: icon.file,
            title: __(icon.name),
        }));
        this.append(items);
    }
}
