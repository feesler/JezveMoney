import { PopupMenu } from 'jezvejs/PopupMenu';
import { __ } from '../../../../utils/utils.js';
import { App } from '../../../../Application/App.js';

/** Scheduled transactions list context menu component */
export class ScheduleItemContextMenu extends PopupMenu {
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
                id: 'ctxUpdateBtn',
                type: 'link',
                icon: 'update',
                title: __('actions.update'),
            }, {
                id: 'ctxDuplicateBtn',
                type: 'link',
                icon: 'duplicate',
                title: __('actions.duplicate'),
            }, {
                id: 'ctxFinishBtn',
                title: __('schedule.finish'),
            }, {
                type: 'separator',
            }, {
                id: 'ctxDeleteBtn',
                icon: 'del',
                title: __('actions.delete'),
            }],
        });

        this.state = {
            contextItem: null,
            showContextMenu: false,
        };
    }

    getContextItem(state) {
        return App.model.schedule.getItem(state.contextItem);
    }

    getHostElement(itemId) {
        return document.querySelector(`.schedule-item[data-id="${itemId}"] .menu-btn`);
    }

    render(state) {
        if (!state) {
            throw new Error('Invalid state');
        }

        if (!state.showContextMenu) {
            this.detach();
            return;
        }
        const scheduleItem = this.getContextItem(state);
        if (!scheduleItem) {
            this.detach();
            return;
        }

        const menuButton = this.getHostElement(scheduleItem.id);
        if (!menuButton) {
            this.detach();
            return;
        }

        const { baseURL } = App;
        const { items } = this;
        items.ctxDetailsBtn.setURL(`${baseURL}schedule/${scheduleItem.id}`);
        items.ctxUpdateBtn.setURL(`${baseURL}schedule/update/${scheduleItem.id}`);
        items.ctxDuplicateBtn.setURL(`${baseURL}schedule/create?from=${scheduleItem.id}`);

        this.attachAndShow(menuButton);
    }
}
