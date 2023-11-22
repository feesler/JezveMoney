import { PopupMenu } from 'jezvejs/PopupMenu';

import { __, getSelectedItems } from '../../../../utils/utils.js';

import { actions } from '../../reducer.js';
import {
    deleteAll,
    deleteSelected,
    toggleCheckReminders,
    toggleCheckSimilar,
    toggleEnableRules,
} from '../../actions.js';

/** Import transactions list main menu component */
export class ImportListMainMenu extends PopupMenu {
    constructor(props = {}) {
        super({
            ...props,
            multiple: true,
        });
    }

    setContext(context) {
        if (!context) {
            throw new Error('Invalid context');
        }

        if (!context.showMenu) {
            this.hideMenu();
            return;
        }

        const { dispatch } = this.state;
        const isListMode = context.listMode === 'list';
        const isSelectMode = context.listMode === 'select';
        const hasItems = context.items.length > 0;
        const hasNotSelectedEnabled = isSelectMode && context.items.some((item) => (
            item.enabled && !item.selected
        ));
        const hasNotSelectedDisabled = isSelectMode && context.items.some((item) => (
            !item.enabled && !item.selected
        ));

        const selectedItems = (isSelectMode) ? getSelectedItems(context.items) : [];
        const restoreAvailable = isSelectMode && selectedItems.some((item) => (
            !!item.originalData && (item.rulesApplied || item.modifiedByUser)
        ));
        const hasSelectedEnabled = isSelectMode && selectedItems.some((item) => item.enabled);
        const hasSelectedDisabled = isSelectMode && selectedItems.some((item) => !item.enabled);

        this.setItems([{
            id: 'createItemBtn',
            icon: 'plus',
            title: __('import.itemCreate'),
            hidden: !isListMode,
            onClick: () => dispatch(actions.createItem()),
        }, {
            type: 'separator',
            hidden: !isListMode,
        }, {
            id: 'selectModeBtn',
            icon: 'select',
            title: __('actions.select'),
            hidden: !(isListMode && hasItems),
            onClick: () => dispatch(actions.changeListMode('select')),
        }, {
            id: 'sortModeBtn',
            icon: 'sort',
            title: __('actions.sort'),
            hidden: !(isListMode && context.items.length > 1),
            onClick: () => dispatch(actions.changeListMode('sort')),
        }, {
            type: 'separator',
            hidden: !(isListMode && hasItems),
        }, {
            id: 'selectAllBtn',
            title: __('actions.selectAll'),
            hidden: !(isSelectMode && selectedItems.length < context.items.length),
            onClick: () => dispatch(actions.selectAllItems()),
        }, {
            id: 'deselectAllBtn',
            title: __('actions.deselectAll'),
            hidden: !(isSelectMode && selectedItems.length > 0),
            onClick: () => dispatch(actions.deselectAllItems()),
        }, {
            id: 'selectEnabledBtn',
            title: __('actions.selectEnabled'),
            hidden: !(isSelectMode && hasNotSelectedEnabled),
            onClick: () => dispatch(actions.selectEnabledItems()),
        }, {
            id: 'selectDisabledBtn',
            title: __('actions.selectDisabled'),
            hidden: !(isSelectMode && hasNotSelectedDisabled),
            onClick: () => dispatch(actions.selectDisabledItems()),
        }, {
            type: 'separator',
            hidden: !isSelectMode,
        }, {
            id: 'restoreSelectedBtn',
            title: __('import.itemRestore'),
            className: 'warning-item',
            hidden: !(isSelectMode && restoreAvailable),
            onClick: () => dispatch(actions.restoreSelectedItems()),
        }, {
            type: 'separator',
            hidden: !isSelectMode && restoreAvailable,
        }, {
            id: 'enableSelectedBtn',
            title: __('actions.enableSelected'),
            hidden: !(isSelectMode && hasSelectedDisabled),
            onClick: () => dispatch(actions.enableSelectedItems(true)),
        }, {
            id: 'disableSelectedBtn',
            title: __('actions.disableSelected'),
            hidden: !(isSelectMode && hasSelectedEnabled),
            onClick: () => dispatch(actions.enableSelectedItems(false)),
        }, {
            id: 'deleteSelectedBtn',
            icon: 'del',
            title: __('actions.deleteSelected'),
            hidden: !(isSelectMode && selectedItems.length > 0),
            onClick: () => dispatch(deleteSelected()),
        }, {
            id: 'deleteAllBtn',
            icon: 'del',
            title: __('actions.deleteAll'),
            disabled: !(context.items.length > 0),
            onClick: () => dispatch(deleteAll()),
        }, {
            type: 'separator',
            hidden: !isListMode,
        }, {
            id: 'rulesCheck',
            type: 'checkbox',
            title: __('import.rules.enable'),
            selected: context.rulesEnabled,
            hidden: !isListMode,
            onClick: () => dispatch(toggleEnableRules()),
        }, {
            id: 'rulesBtn',
            title: __('import.rules.openDialog'),
            hidden: !(isListMode),
            disabled: !context.rulesEnabled,
            onClick: () => dispatch(actions.openRulesDialog()),
        }, {
            type: 'separator',
            hidden: !isListMode,
        }, {
            id: 'similarCheck',
            type: 'checkbox',
            title: __('import.checkSimilar'),
            selected: context.checkSimilarEnabled,
            hidden: !isListMode,
            onClick: () => dispatch(toggleCheckSimilar()),
        }, {
            id: 'remindersCheck',
            type: 'checkbox',
            title: __('import.checkReminders'),
            selected: context.checkRemindersEnabled,
            hidden: !isListMode,
            onClick: () => dispatch(toggleCheckReminders()),
        }]);
    }
}
