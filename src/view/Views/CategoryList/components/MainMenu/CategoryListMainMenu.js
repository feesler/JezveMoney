import { show } from 'jezvejs';
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
                id: 'sortByNameBtn',
                title: __('SORT_BY_NAME'),
                className: CHECK_ITEM_CLASS,
            }, {
                id: 'sortByDateBtn',
                title: __('SORT_BY_DATE'),
                className: CHECK_ITEM_CLASS,
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
        const sortMode = getCategoriesSortMode();

        const { items } = this;

        items.selectModeBtn.show(isListMode && itemsCount > 0);
        items.sortModeBtn.show(isListMode && itemsCount > 1);

        items.sortByNameBtn.setIcon(getSortByNameIcon(sortMode));
        items.sortByNameBtn.show(isListMode && itemsCount > 1);

        items.sortByDateBtn.setIcon(getSortByDateIcon(sortMode));
        items.sortByDateBtn.show(isListMode && itemsCount > 1);

        items.selectAllBtn.show(isSelectMode && itemsCount > 0 && selCount < itemsCount);
        items.deselectAllBtn.show(isSelectMode && itemsCount > 0 && selCount > 0);
        show(items.separator2, isSelectMode);

        items.deleteBtn.show(selCount > 0);
    }
}
