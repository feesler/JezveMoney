import { show } from 'jezvejs';
import { PopupMenu } from 'jezvejs/PopupMenu';

import { __, getSortByDateIcon, getSortByNameIcon } from '../../../../utils/utils.js';
import {
    getAccountsSortMode,
    getExportURL,
    getHiddenSelectedItems,
    getSelectedIds,
    getVisibleSelectedItems,
} from '../../helpers.js';

/** Accounts list main menu component */
export class AccountListMainMenu extends PopupMenu {
    constructor(props) {
        super({
            ...props,
            items: [{
                id: 'selectModeBtn',
                icon: 'select',
                title: __('actions.select'),
            }, {
                id: 'sortModeBtn',
                icon: 'sort',
                title: __('actions.sort'),
            }, {
                id: 'sortByNameBtn',
                title: __('actions.sortByName'),
            }, {
                id: 'sortByDateBtn',
                title: __('actions.sortByDate'),
            }, {
                id: 'selectAllBtn',
                title: __('actions.selectAll'),
            }, {
                id: 'deselectAllBtn',
                title: __('actions.deselectAll'),
            }, {
                id: 'separator2',
                type: 'separator',
            }, {
                id: 'exportBtn',
                type: 'link',
                icon: 'export',
                title: __('transactions.exportToCsv'),
            }, {
                id: 'showBtn',
                icon: 'show',
                title: __('actions.show'),
            }, {
                id: 'hideBtn',
                icon: 'hide',
                title: __('actions.hide'),
            }, {
                id: 'deleteBtn',
                icon: 'del',
                title: __('actions.delete'),
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

        const itemsCount = state.items.visible.length + state.items.hidden.length;
        const selArr = getVisibleSelectedItems(state);
        const hiddenSelArr = getHiddenSelectedItems(state);
        const selCount = selArr.length;
        const hiddenSelCount = hiddenSelArr.length;
        const totalSelCount = selCount + hiddenSelCount;
        const isListMode = state.listMode === 'list';
        const isSelectMode = state.listMode === 'select';
        const sortMode = getAccountsSortMode();

        const { items } = this;
        items.selectModeBtn.show(isListMode && itemsCount > 0);

        const showSortItems = isListMode && itemsCount > 1;
        items.sortModeBtn.show(showSortItems);

        items.sortByNameBtn.setIcon(getSortByNameIcon(sortMode));
        items.sortByNameBtn.show(showSortItems);

        items.sortByDateBtn.setIcon(getSortByDateIcon(sortMode));
        items.sortByDateBtn.show(showSortItems);

        items.selectAllBtn.show(isSelectMode && itemsCount > 0 && totalSelCount < itemsCount);
        items.deselectAllBtn.show(isSelectMode && itemsCount > 0 && totalSelCount > 0);
        show(items.separator2, isSelectMode);

        items.exportBtn.show(isSelectMode && totalSelCount > 0);
        items.showBtn.show(isSelectMode && hiddenSelCount > 0);
        items.hideBtn.show(isSelectMode && selCount > 0);
        items.deleteBtn.show(isSelectMode && totalSelCount > 0);

        if (totalSelCount > 0) {
            const selectedIds = getSelectedIds(state);
            const exportURL = getExportURL(selectedIds);
            items.exportBtn.setURL(exportURL.toString());
        }
    }
}
