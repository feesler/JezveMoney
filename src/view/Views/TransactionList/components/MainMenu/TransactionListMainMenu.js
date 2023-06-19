import { show } from 'jezvejs';
import { PopupMenu } from 'jezvejs/PopupMenu';

import { __, getSelectedItems } from '../../../../utils/utils.js';
import { getExportURL, getTransactionsGroupByDate } from '../../helpers.js';

/** Transactions list main menu component */
export class TransactionListMainMenu extends PopupMenu {
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
                id: 'separator1',
                type: 'separator',
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
                id: 'setCategoryBtn',
                title: __('transactions.setCategoryMenu'),
            }, {
                id: 'deleteBtn',
                icon: 'del',
                title: __('actions.delete'),
            }, {
                id: 'separator3',
                type: 'separator',
            }, {
                id: 'groupByDateBtn',
                title: __('transactions.groupByDate'),
            }],
        });

        this.state = {
            listMode: 'list',
            showMenu: false,
            items: [],
            filter: {},
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
        const isListMode = state.listMode === 'list';
        const isSelectMode = state.listMode === 'select';
        const selectedItems = getSelectedItems(state.items);
        const selCount = selectedItems.length;
        const groupByDate = getTransactionsGroupByDate() === 1;

        const { items } = this;
        items.selectModeBtn.show(isListMode && itemsCount > 0);
        items.sortModeBtn.show(isListMode && itemsCount > 1);

        show(items.separator1, isSelectMode);

        items.selectAllBtn.show(isSelectMode && itemsCount > 0 && selCount < itemsCount);
        items.deselectAllBtn.show(isSelectMode && itemsCount > 0 && selCount > 0);
        show(items.separator2, isSelectMode);

        items.exportBtn.show(itemsCount > 0);
        if (itemsCount > 0) {
            const exportURL = getExportURL(state);
            items.exportBtn.setURL(exportURL.toString());
        }

        items.setCategoryBtn.show(isSelectMode && selCount > 0);
        items.deleteBtn.show(isSelectMode && selCount > 0);

        show(items.separator3, isListMode);
        items.groupByDateBtn.setIcon((groupByDate) ? 'check' : null);
        items.groupByDateBtn.show(isListMode);
    }
}
