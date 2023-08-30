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
    setContext(context) {
        if (!context) {
            throw new Error('Invalid context');
        }

        if (!context.showMenu) {
            this.hideMenu();
            return;
        }

        const itemsCount = context.items.visible.length + context.items.hidden.length;
        const selArr = getVisibleSelectedItems(context);
        const hiddenSelArr = getHiddenSelectedItems(context);
        const selCount = selArr.length;
        const hiddenSelCount = hiddenSelArr.length;
        const totalSelCount = selCount + hiddenSelCount;
        const isListMode = context.listMode === 'list';
        const isSelectMode = context.listMode === 'select';
        const sortMode = getAccountsSortMode();
        const showSortItems = isListMode && itemsCount > 1;

        const exportURL = (totalSelCount > 0)
            ? getExportURL(getSelectedIds(context))
            : null;

        this.setState({
            ...this.state,
            items: [{
                id: 'selectModeBtn',
                icon: 'select',
                title: __('actions.select'),
                hidden: !(isListMode && itemsCount > 0),
            }, {
                id: 'sortModeBtn',
                icon: 'sort',
                title: __('actions.sort'),
                hidden: !showSortItems,
            }, {
                id: 'sortByNameBtn',
                title: __('actions.sortByName'),
                icon: getSortByNameIcon(sortMode),
                hidden: !showSortItems,
            }, {
                id: 'sortByDateBtn',
                title: __('actions.sortByDate'),
                icon: getSortByDateIcon(sortMode),
                hidden: !showSortItems,
            }, {
                id: 'selectAllBtn',
                title: __('actions.selectAll'),
                hidden: !(isSelectMode && itemsCount > 0 && totalSelCount < itemsCount),
            }, {
                id: 'deselectAllBtn',
                title: __('actions.deselectAll'),
                hidden: !(isSelectMode && itemsCount > 0 && totalSelCount > 0),
            }, {
                id: 'separator2',
                type: 'separator',
                hidden: !isSelectMode,
            }, {
                id: 'exportBtn',
                type: 'link',
                icon: 'export',
                title: __('transactions.exportToCsv'),
                url: exportURL?.toString(),
                hidden: !(isSelectMode && totalSelCount > 0),
            }, {
                id: 'showBtn',
                icon: 'show',
                title: __('actions.show'),
                hidden: !(isSelectMode && hiddenSelCount > 0),
            }, {
                id: 'hideBtn',
                icon: 'hide',
                title: __('actions.hide'),
                hidden: !(isSelectMode && selCount > 0),
            }, {
                id: 'deleteBtn',
                icon: 'del',
                title: __('actions.delete'),
                hidden: !(isSelectMode && totalSelCount > 0),
            }],
        });
    }
}
