import { PopupMenu } from 'jezvejs/PopupMenu';

import { __, getSelectedItems } from '../../../../utils/utils.js';
import { getExportURL, getTransactionsGroupByDate } from '../../helpers.js';

/** Transactions list main menu component */
export class TransactionListMainMenu extends PopupMenu {
    setContext(context) {
        if (!context) {
            throw new Error('Invalid context');
        }

        if (!context.showMenu) {
            this.hideMenu();
            return;
        }

        const itemsCount = context.items.length;
        const isListMode = context.listMode === 'list';
        const isSelectMode = context.listMode === 'select';
        const selectedItems = getSelectedItems(context.items);
        const selCount = selectedItems.length;
        const groupByDate = getTransactionsGroupByDate() === 1;

        const exportURL = (itemsCount > 0)
            ? getExportURL(context)
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
                hidden: !(isListMode && itemsCount > 1),
            }, {
                id: 'separator1',
                type: 'separator',
                hidden: !isSelectMode,
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
                id: 'exportBtn',
                type: 'link',
                icon: 'export',
                title: __('transactions.exportToCsv'),
                url: exportURL?.toString(),
                hidden: !(itemsCount > 0),
            }, {
                id: 'setCategoryBtn',
                title: __('transactions.setCategoryMenu'),
                hidden: !(isSelectMode && selCount > 0),
            }, {
                id: 'deleteBtn',
                icon: 'del',
                title: __('actions.delete'),
                hidden: !(isSelectMode && selCount > 0),
            }, {
                id: 'separator3',
                type: 'separator',
                hidden: !isListMode,
            }, {
                id: 'groupByDateBtn',
                title: __('transactions.groupByDate'),
                icon: (groupByDate) ? 'check' : null,
                hidden: !(isListMode),
            }],
        });
    }
}
