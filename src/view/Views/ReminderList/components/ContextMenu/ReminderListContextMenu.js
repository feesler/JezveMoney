import { PopupMenu } from 'jezvejs/PopupMenu';
import { __ } from '../../../../utils/utils.js';

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
        return window.app.model.reminders.getItem(state.contextItem);
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
        const item = this.getContextItem(state);
        if (!item) {
            this.detach();
            return;
        }

        const menuButton = this.getHostElement(item.id);
        if (!menuButton) {
            this.detach();
            return;
        }

        const { baseURL } = window.app;
        const { items } = this;
        items.ctxDetailsBtn.setURL(`${baseURL}reminders/${item.id}`);
        items.ctxUpdateBtn.setURL(`${baseURL}transactions/create/?reminder_id=${item.id}`);

        this.attachAndShow(menuButton);
    }
}
