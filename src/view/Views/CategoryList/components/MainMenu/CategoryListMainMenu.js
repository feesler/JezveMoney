import { PopupMenu } from 'jezvejs/PopupMenu';

import {
    __,
    getSelectedItems,
    getSortByDateIcon,
    getSortByNameIcon,
} from '../../../../utils/utils.js';
import { getCategoriesSortMode } from '../../helpers.js';

/* CSS classes */
const CHECK_ITEM_CLASS = 'check-icon-item';

/** Categories list main menu component */
export class CategoryListMainMenu extends PopupMenu {
    setContext(context) {
        if (!context) {
            throw new Error('Invalid context');
        }

        if (!context.showMenu) {
            this.hideMenu();
            return;
        }

        const itemsCount = context.items.length;
        const selArr = getSelectedItems(context.items);
        const selCount = selArr.length;
        const isListMode = context.listMode === 'list';
        const isSelectMode = context.listMode === 'select';
        const sortMode = getCategoriesSortMode();

        this.setItems([{
            id: 'selectModeBtn',
            icon: 'select',
            title: __('actions.select'),
            hidden: !(isListMode && itemsCount > 0),
        }, {
            id: 'sortModeBtn',
            icon: 'sort',
            title: __('actions.sort'),
            hidden: !(isListMode && itemsCount > 1),
        }, {
            id: 'sortByNameBtn',
            title: __('actions.sortByName'),
            icon: getSortByNameIcon(sortMode),
            className: CHECK_ITEM_CLASS,
            hidden: !(isListMode && itemsCount > 1),
        }, {
            id: 'sortByDateBtn',
            title: __('actions.sortByDate'),
            icon: getSortByDateIcon(sortMode),
            className: CHECK_ITEM_CLASS,
            hidden: !(isListMode && itemsCount > 1),
        }, {
            id: 'selectAllBtn',
            title: __('actions.selectAll'),
            hidden: !(isSelectMode && itemsCount > 0 && selCount < itemsCount),
        }, {
            id: 'deselectAllBtn',
            title: __('actions.deselectAll'),
            hidden: !(isSelectMode && itemsCount > 0 && selCount > 0),
        }, {
            id: 'separator2',
            type: 'separator',
            hidden: !isSelectMode,
        }, {
            id: 'deleteBtn',
            icon: 'del',
            title: __('actions.delete'),
            hidden: !(selCount > 0),
        }]);
    }
}
