import { PopupMenu } from 'jezvejs/PopupMenu';
import { __, getApplicationURL } from '../../../../utils/utils.js';
import { App } from '../../../../Application/App.js';
import { REMINDER_CANCELLED, REMINDER_CONFIRMED } from '../../../../../../tests/model/Reminder.js';
import { REMINDER_UPCOMING } from '../../../../Models/Reminder.js';

/** Reminders list context menu component */
export class ReminderListContextMenu extends PopupMenu {
    constructor(props) {
        super({
            ...props,
            fixed: false,
            items: [{
                id: 'ctxDetailsBtn',
                type: 'link',
                title: __('actions.openItem'),
                onClick: (e) => e?.preventDefault(),
            }, {
                type: 'separator',
            }, {
                id: 'ctxConfirmBtn',
                icon: 'check',
                title: __('reminders.confirm'),
            }, {
                id: 'ctxUpdateBtn',
                type: 'link',
                icon: 'update',
                title: __('reminders.update'),
            }, {
                id: 'ctxCancelBtn',
                icon: 'del',
                title: __('reminders.cancel'),
            }],
        });

        this.state = {
            contextItem: null,
            showContextMenu: false,
        };
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

    render(state) {
        if (!state) {
            throw new Error('Invalid state');
        }

        if (!state.showContextMenu) {
            this.detach();
            return;
        }
        const reminder = this.getContextItem(state);
        if (!reminder) {
            this.detach();
            return;
        }

        const menuButton = this.getHostElement(reminder.id);
        if (!menuButton) {
            this.detach();
            return;
        }

        const { baseURL } = App;
        const { items } = this;
        items.ctxConfirmBtn.show(reminder.state !== REMINDER_CONFIRMED);
        items.ctxUpdateBtn.show(reminder.state !== REMINDER_CONFIRMED);
        items.ctxCancelBtn.show(reminder.state !== REMINDER_CANCELLED);

        items.ctxDetailsBtn.show(reminder.state !== REMINDER_UPCOMING);
        items.ctxDetailsBtn.setURL(`${baseURL}reminders/${reminder.id}`);

        const updateParams = {};
        if (reminder.state === REMINDER_UPCOMING) {
            updateParams.schedule_id = reminder.schedule_id;
            updateParams.reminder_date = reminder.date;
        } else {
            updateParams.reminder_id = reminder.id;
        }

        const updateURL = getApplicationURL('transactions/create/', updateParams);
        items.ctxUpdateBtn.setURL(updateURL.toString());

        this.attachAndShow(menuButton);
    }
}
