import { show } from 'jezvejs';
import { PopupMenu } from 'jezvejs/PopupMenu';

import { __, getSelectedItems } from '../../../../utils/utils.js';

/** User currencies list main menu component */
export class CurrencyListMainMenu extends PopupMenu {
    constructor(props) {
        super({
            ...props,
            items: [{
                id: 'selectModeBtn',
                icon: 'select',
                title: __('SELECT'),
            }, {
                id: 'sortModeBtn',
                icon: 'sort',
                title: __('SORT'),
            }, {
                id: 'selectAllBtn',
                title: __('SELECT_ALL'),
            }, {
                id: 'deselectAllBtn',
                title: __('DESELECT_ALL'),
            }, {
                id: 'separator2',
                type: 'separator',
            }, {
                id: 'deleteBtn',
                icon: 'del',
                title: __('DELETE'),
            }],
        });

        this.state = {
            listMode: 'list',
            showMenu: false,
            items: [],
        };
    }

    render(state) {
        if (!state) {
            throw new Error('Invalid state');
        }

        if (!state.showMenu) {
            this.hideMenu();
            return;
        }

        const itemsCount = state.items.length;
        const selArr = getSelectedItems(state.items);
        const selCount = selArr.length;
        const isListMode = state.listMode === 'list';
        const isSelectMode = state.listMode === 'select';

        const { items } = this;

        items.selectModeBtn.show(isListMode && itemsCount > 0);
        items.sortModeBtn.show(isListMode && itemsCount > 1);

        items.selectAllBtn.show(isSelectMode && itemsCount > 0 && selCount < itemsCount);
        items.deselectAllBtn.show(isSelectMode && itemsCount > 0 && selCount > 0);
        show(items.separator2, isSelectMode);

        items.deleteBtn.show(selCount > 0);
    }
}
