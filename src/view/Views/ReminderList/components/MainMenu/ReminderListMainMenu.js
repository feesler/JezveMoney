import { PopupMenu } from 'jezvejs/PopupMenu';

import { __, getSelectedItems } from '../../../../utils/utils.js';
import { REMINDER_CANCELLED, REMINDER_CONFIRMED } from '../../../../Models/Reminder.js';

/** Reminders list main menu component */
export class ReminderListMainMenu extends PopupMenu {
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

        const isConfirmed = context.filter.state === REMINDER_CONFIRMED;
        const isCancelled = context.filter.state === REMINDER_CANCELLED;

        this.setItems([{
            id: 'selectModeBtn',
            icon: 'select',
            title: __('actions.select'),
            hidden: !(isListMode && itemsCount > 0),
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
            id: 'confirmBtn',
            icon: 'check',
            title: __('reminders.confirm'),
            hidden: !(selCount > 0 && !isConfirmed),
        }, {
            id: 'cancelBtn',
            icon: 'del',
            title: __('reminders.cancel'),
            hidden: !(selCount > 0 && !isCancelled),
        }]);
    }
}
