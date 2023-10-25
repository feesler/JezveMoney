import { PopupMenu } from 'jezvejs/PopupMenu';

import { __, getSelectedItems } from '../../../../utils/utils.js';
import { REMINDER_CANCELLED, REMINDER_CONFIRMED } from '../../../../Models/Reminder.js';
import {
    cancelReminder,
    confirmReminder,
    deselectAllItems,
    selectAllItems,
    setListMode,
} from '../../../../Components/Reminder/ReminderListGroup/actions.js';

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

        const isConfirmed = context.filter.reminderState === REMINDER_CONFIRMED;
        const isCancelled = context.filter.reminderState === REMINDER_CANCELLED;

        const { dispatch } = this.state;
        this.setItems([{
            id: 'selectModeBtn',
            icon: 'select',
            title: __('actions.select'),
            hidden: !(isListMode && itemsCount > 0),
            onClick: () => dispatch(setListMode('select')),
        }, {
            id: 'selectAllBtn',
            title: __('actions.selectAll'),
            hidden: !(isSelectMode && itemsCount > 0 && selCount < itemsCount),
            onClick: () => dispatch(selectAllItems()),
        }, {
            id: 'deselectAllBtn',
            title: __('actions.deselectAll'),
            hidden: !(isSelectMode && itemsCount > 0 && selCount > 0),
            onClick: () => dispatch(deselectAllItems()),
        }, {
            id: 'separator2',
            type: 'separator',
            hidden: !isSelectMode,
        }, {
            id: 'confirmBtn',
            icon: 'check',
            title: __('reminders.confirm'),
            hidden: !(selCount > 0 && !isConfirmed),
            onClick: () => dispatch(confirmReminder()),
        }, {
            id: 'cancelBtn',
            icon: 'del',
            title: __('reminders.cancel'),
            hidden: !(selCount > 0 && !isCancelled),
            onClick: () => dispatch(cancelReminder()),
        }]);
    }
}
