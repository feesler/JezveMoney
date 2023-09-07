import { PopupMenu } from 'jezvejs/PopupMenu';

import { __, getApplicationURL } from '../../../../utils/utils.js';
import { REMINDER_CANCELLED, REMINDER_CONFIRMED } from '../../../../../../tests/model/Reminder.js';
import { REMINDER_UPCOMING } from '../../../../Models/Reminder.js';

/** Reminders list context menu component */
export class ReminderListContextMenu extends PopupMenu {
    constructor(props) {
        super({
            ...props,
            fixed: false,
        });
    }

    getContextItem(state) {
        const strId = state.contextItem?.toString() ?? null;
        if (strId === null) {
            return null;
        }

        return state.items?.find((item) => item.id.toString() === strId);
    }

    getHostElement(itemId) {
        return document.querySelector(`.reminder-item[data-id="${itemId}"] .menu-btn`);
    }

    setContext(context) {
        if (!context) {
            throw new Error('Invalid context');
        }

        if (!context.showContextMenu) {
            this.detach();
            return;
        }
        const reminder = this.getContextItem(context);
        if (!reminder) {
            this.detach();
            return;
        }

        const menuButton = this.getHostElement(reminder.id);
        if (!menuButton) {
            this.detach();
            return;
        }

        const updateParams = {};
        if (reminder.state === REMINDER_UPCOMING) {
            updateParams.schedule_id = reminder.schedule_id;
            updateParams.reminder_date = reminder.date;
        } else {
            updateParams.reminder_id = reminder.id;
        }

        const updateURL = getApplicationURL('transactions/create/', updateParams);

        this.setItems([{
            id: 'ctxDetailsBtn',
            type: 'link',
            title: __('actions.openItem'),
            url: getApplicationURL(`reminders/${reminder.id}`),
            hidden: (reminder.state === REMINDER_UPCOMING),
            onClick: (_, e) => e?.preventDefault(),
        }, {
            type: 'separator',
        }, {
            id: 'ctxConfirmBtn',
            icon: 'check',
            title: __('reminders.confirm'),
            hidden: (reminder.state === REMINDER_CONFIRMED),
        }, {
            id: 'ctxUpdateBtn',
            type: 'link',
            icon: 'update',
            title: __('reminders.update'),
            url: updateURL.toString(),
            hidden: (reminder.state === REMINDER_CONFIRMED),
        }, {
            id: 'ctxCancelBtn',
            icon: 'del',
            title: __('reminders.cancel'),
            hidden: (reminder.state === REMINDER_CANCELLED),
        }]);

        this.attachAndShow(menuButton);
    }
}
