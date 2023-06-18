import { show } from 'jezvejs';
import { PopupMenu } from 'jezvejs/PopupMenu';

import { __, getSelectedItems } from '../../../../utils/utils.js';
import { REMINDER_CANCELLED, REMINDER_CONFIRMED } from '../../../../Models/Reminder.js';

/** Reminders list main menu component */
export class ReminderListMainMenu extends PopupMenu {
    constructor(props) {
        super({
            ...props,
            items: [{
                id: 'selectModeBtn',
                icon: 'select',
                title: __('actions.select'),
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
                id: 'confirmBtn',
                icon: 'check',
                title: __('reminders.confirm'),
            }, {
                id: 'cancelBtn',
                icon: 'del',
                title: __('reminders.cancel'),
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
        const selArr = getSelectedItems(state.items);
        const selCount = selArr.length;
        const isListMode = state.listMode === 'list';
        const isSelectMode = state.listMode === 'select';

        const isConfirmed = state.filter.state === REMINDER_CONFIRMED;
        const isCancelled = state.filter.state === REMINDER_CANCELLED;

        const { items } = this;

        items.selectModeBtn.show(isListMode && itemsCount > 0);

        items.selectAllBtn.show(isSelectMode && itemsCount > 0 && selCount < itemsCount);
        items.deselectAllBtn.show(isSelectMode && itemsCount > 0 && selCount > 0);
        show(items.separator2, isSelectMode);

        items.confirmBtn.show(selCount > 0 && !isConfirmed);
        items.cancelBtn.show(selCount > 0 && !isCancelled);
    }
}
