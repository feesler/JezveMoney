import { PopupMenu } from 'jezvejs/PopupMenu';

import {
    __,
    getSortByDateIcon,
    getSortByNameIcon,
} from '../../../../utils/utils.js';
import {
    getAccountsSortMode,
    getHiddenSelectedItems,
    getVisibleSelectedItems,
} from '../../helpers.js';
import { actions } from '../../reducer.js';
import {
    setListMode,
    showItems,
    toggleSortByDate,
    toggleSortByName,
} from '../../actions.js';

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

        const { dispatch } = this.state;
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

        this.setItems([{
            id: 'selectModeBtn',
            icon: 'select',
            title: __('actions.select'),
            hidden: !(isListMode && itemsCount > 0),
            onClick: () => dispatch(setListMode('select')),
        }, {
            id: 'sortModeBtn',
            icon: 'sort',
            title: __('actions.sort'),
            hidden: !showSortItems,
            onClick: () => dispatch(setListMode('sort')),
        }, {
            id: 'sortByNameBtn',
            title: __('actions.sortByName'),
            icon: getSortByNameIcon(sortMode),
            hidden: !showSortItems,
            onClick: () => dispatch(toggleSortByName()),
        }, {
            id: 'sortByDateBtn',
            title: __('actions.sortByDate'),
            icon: getSortByDateIcon(sortMode),
            hidden: !showSortItems,
            onClick: () => dispatch(toggleSortByDate()),
        }, {
            id: 'selectAllBtn',
            title: __('actions.selectAll'),
            hidden: !(isSelectMode && itemsCount > 0 && totalSelCount < itemsCount),
            onClick: () => dispatch(actions.selectAllItems()),
        }, {
            id: 'deselectAllBtn',
            title: __('actions.deselectAll'),
            hidden: !(isSelectMode && itemsCount > 0 && totalSelCount > 0),
            onClick: () => dispatch(actions.deselectAllItems()),
        }, {
            id: 'separator2',
            type: 'separator',
            hidden: !isSelectMode,
        }, {
            id: 'exportBtn',
            icon: 'export',
            title: __('export.menuTitle'),
            hidden: !(isSelectMode && totalSelCount > 0),
            onClick: () => dispatch(actions.showExportDialog()),
        }, {
            id: 'showBtn',
            icon: 'show',
            title: __('actions.show'),
            hidden: !(isSelectMode && hiddenSelCount > 0),
            onClick: () => dispatch(showItems()),
        }, {
            id: 'hideBtn',
            icon: 'hide',
            title: __('actions.hide'),
            hidden: !(isSelectMode && selCount > 0),
            onClick: () => dispatch(showItems(false)),
        }, {
            id: 'deleteBtn',
            icon: 'del',
            title: __('actions.delete'),
            hidden: !(isSelectMode && totalSelCount > 0),
            onClick: () => dispatch(actions.showDeleteConfirmDialog()),
        }]);
    }
}
