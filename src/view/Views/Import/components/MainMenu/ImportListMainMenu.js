import { PopupMenu } from 'jezvejs/PopupMenu';

import { __, getSelectedItems } from '../../../../utils/utils.js';

/** Import transactions list main menu component */
export class ImportListMainMenu extends PopupMenu {
    setContext(context) {
        if (!context) {
            throw new Error('Invalid context');
        }

        if (!context.showMenu) {
            this.hideMenu();
            return;
        }

        const isListMode = context.listMode === 'list';
        const isSelectMode = context.listMode === 'select';
        const hasItems = context.items.length > 0;
        const selectedItems = getSelectedItems(context.items);
        const hasEnabled = selectedItems.some((item) => item.enabled);
        const hasDisabled = selectedItems.some((item) => !item.enabled);

        this.setState({
            ...this.state,
            multiple: true,
            items: [{
                id: 'createItemBtn',
                icon: 'plus',
                title: __('import.itemCreate'),
                hidden: !isListMode,
            }, {
                id: 'separator1',
                type: 'separator',
                hidden: !isListMode,
            }, {
                id: 'selectModeBtn',
                icon: 'select',
                title: __('actions.select'),
                hidden: !(isListMode && hasItems),
            }, {
                id: 'sortModeBtn',
                icon: 'sort',
                title: __('actions.sort'),
                hidden: !(isListMode && context.items.length > 1),
            }, {
                id: 'separator2',
                type: 'separator',
                hidden: !(isListMode && hasItems),
            }, {
                id: 'selectAllBtn',
                title: __('actions.selectAll'),
                hidden: !(isSelectMode && selectedItems.length < context.items.length),
            }, {
                id: 'deselectAllBtn',
                title: __('actions.deselectAll'),
                hidden: !(isSelectMode && selectedItems.length > 0),
            }, {
                id: 'enableSelectedBtn',
                title: __('actions.enableSelected'),
                hidden: !(isSelectMode && hasDisabled),
            }, {
                id: 'disableSelectedBtn',
                title: __('actions.disableSelected'),
                hidden: !(isSelectMode && hasEnabled),
            }, {
                id: 'deleteSelectedBtn',
                icon: 'del',
                title: __('actions.deleteSelected'),
                hidden: !(isSelectMode && selectedItems.length > 0),
            }, {
                id: 'deleteAllBtn',
                icon: 'del',
                title: __('actions.deleteAll'),
                disabled: !(context.items.length > 0),
            }, {
                id: 'separator3',
                type: 'separator',
                hidden: !isListMode,
            }, {
                id: 'rulesCheck',
                type: 'checkbox',
                title: __('import.rules.enable'),
                selected: context.rulesEnabled,
                hidden: !isListMode,
            }, {
                id: 'rulesBtn',
                title: __('import.rules.openDialog'),
                hidden: !(isListMode),
                disabled: !context.rulesEnabled,
            }, {
                id: 'separator4',
                type: 'separator',
                hidden: !isListMode,
            }, {
                id: 'similarCheck',
                type: 'checkbox',
                title: __('import.checkSimilar'),
                selected: context.checkSimilarEnabled,
                hidden: !isListMode,
            }],
        });
    }
}
