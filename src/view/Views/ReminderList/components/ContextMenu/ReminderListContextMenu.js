import { PopupMenu } from 'jezvejs/PopupMenu';

import { __, getApplicationURL } from '../../../../utils/utils.js';
import { REMINDER_UPCOMING, REMINDER_CANCELLED, REMINDER_CONFIRMED } from '../../../../Models/Reminder.js';
import { cancelReminder, confirmReminder, showDetails } from '../../../../Components/Reminder/ReminderListGroup/actions.js';

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

        const { dispatch } = this.state;
        this.setItems([{
            id: 'ctxDetailsBtn',
            type: 'link',
            title: __('actions.openItem'),
            url: getApplicationURL(`reminders/${reminder.id}`),
            hidden: (reminder.state === REMINDER_UPCOMING),
            onClick: (_, e) => {
                e?.preventDefault();
                dispatch(showDetails());
            },
        }, {
            type: 'separator',
        }, {
            id: 'ctxConfirmBtn',
            icon: 'check',
            title: __('reminders.confirm'),
            hidden: (reminder.state === REMINDER_CONFIRMED),
            onClick: () => dispatch(confirmReminder()),
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
            onClick: () => dispatch(cancelReminder()),
        }]);

        this.attachAndShow(menuButton);
    }
}
