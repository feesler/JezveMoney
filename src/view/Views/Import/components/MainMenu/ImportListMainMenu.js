import { show } from 'jezvejs';
import { PopupMenu } from 'jezvejs/PopupMenu';

import { __, getSelectedItems } from '../../../../utils/utils.js';

/** Import transactions list main menu component */
export class ImportListMainMenu extends PopupMenu {
    constructor(props) {
        super({
            ...props,
            items: [{
                id: 'createItemBtn',
                icon: 'plus',
                title: __('import.itemCreate'),
            }, {
                id: 'separator1',
                type: 'separator',
            }, {
                id: 'selectModeBtn',
                icon: 'select',
                title: __('actions.select'),
            }, {
                id: 'sortModeBtn',
                icon: 'sort',
                title: __('actions.sort'),
            }, {
                id: 'separator2',
                type: 'separator',
            }, {
                id: 'selectAllBtn',
                title: __('actions.selectAll'),
            }, {
                id: 'deselectAllBtn',
                title: __('actions.deselectAll'),
            }, {
                id: 'enableSelectedBtn',
                title: __('actions.enableSelected'),
            }, {
                id: 'disableSelectedBtn',
                title: __('actions.disableSelected'),
            }, {
                id: 'deleteSelectedBtn',
                icon: 'del',
                title: __('actions.deleteSelected'),
            }, {
                id: 'deleteAllBtn',
                icon: 'del',
                title: __('actions.deleteAll'),
            }, {
                id: 'separator3',
                type: 'separator',
            }, {
                id: 'rulesCheck',
                type: 'checkbox',
                label: __('import.rules.enable'),
                checked: true,
            }, {
                id: 'rulesBtn',
                title: __('import.rules.openDialog'),
            }, {
                id: 'separator4',
                type: 'separator',
            }, {
                id: 'similarCheck',
                type: 'checkbox',
                label: __('import.checkSimilar'),
                checked: true,
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

        const isListMode = state.listMode === 'list';
        const isSelectMode = state.listMode === 'select';
        const hasItems = state.items.length > 0;
        const selectedItems = getSelectedItems(state.items);
        const hasEnabled = selectedItems.some((item) => item.enabled);
        const hasDisabled = selectedItems.some((item) => !item.enabled);

        const { items } = this;

        items.createItemBtn.show(isListMode);
        show(items.separator1, isListMode);

        items.selectModeBtn.show(isListMode && hasItems);
        items.sortModeBtn.show(isListMode && state.items.length > 1);
        show(items.separator2, isListMode && hasItems);
        show(items.separator3, isListMode);
        show(items.separator4, isListMode);

        items.selectAllBtn.show(isSelectMode && selectedItems.length < state.items.length);
        items.deselectAllBtn.show(isSelectMode && selectedItems.length > 0);
        items.enableSelectedBtn.show(isSelectMode && hasDisabled);
        items.disableSelectedBtn.show(isSelectMode && hasEnabled);
        items.deleteSelectedBtn.show(isSelectMode && selectedItems.length > 0);
        items.deleteAllBtn.enable(state.items.length > 0);

        items.rulesCheck.show(isListMode);
        items.rulesBtn.show(isListMode);
        items.rulesBtn.enable(state.rulesEnabled);
        items.similarCheck.show(isListMode);
    }
}
