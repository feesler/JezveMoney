import { PopupMenu } from 'jezvejs/PopupMenu';
import { __ } from '../../../../utils/utils.js';
import { App } from '../../../../Application/App.js';
import { REMINDER_CANCELLED, REMINDER_CONFIRMED } from '../../../../../../tests/model/Reminder.js';

/** Reminders list context menu component */
export class ReminderListContextMenu extends PopupMenu {
    constructor(props) {
        super({
            ...props,
            fixed: false,
            items: [{
                id: 'ctxDetailsBtn',
                type: 'link',
                title: __('OPEN_ITEM'),
                onClick: (e) => e?.preventDefault(),
            }, {
                type: 'separator',
            }, {
                id: 'ctxConfirmBtn',
                icon: 'check',
                title: __('REMINDER_CONFIRM'),
            }, {
                id: 'ctxUpdateBtn',
                type: 'link',
                icon: 'update',
                title: __('REMINDER_UPDATE'),
            }, {
                id: 'ctxCancelBtn',
                icon: 'del',
                title: __('REMINDER_CANCEL'),
            }],
        });

        this.state = {
            contextItem: null,
            showContextMenu: false,
        };
    }

    getContextItem(state) {
        return App.model.reminders.getItem(state.contextItem);
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
        items.ctxDetailsBtn.setURL(`${baseURL}reminders/${reminder.id}`);
        items.ctxUpdateBtn.setURL(`${baseURL}transactions/create/?reminder_id=${reminder.id}`);

        this.attachAndShow(menuButton);
    }
}
