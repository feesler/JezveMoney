import { PopupMenu } from 'jezvejs/PopupMenu';
import { __, getApplicationURL } from '../../../../utils/utils.js';
import { App } from '../../../../Application/App.js';

/** Scheduled transactions list context menu component */
export class ScheduleItemContextMenu extends PopupMenu {
    constructor(props) {
        super({
            ...props,
            fixed: false,
        });
    }

    getContextItem(state) {
        return App.model.schedule.getItem(state.contextItem);
    }

    getHostElement(itemId) {
        return document.querySelector(`.schedule-item[data-id="${itemId}"] .menu-btn`);
    }

    setContext(context) {
        if (!context) {
            throw new Error('Invalid context');
        }

        if (!context.showContextMenu) {
            this.detach();
            return;
        }
        const scheduleItem = this.getContextItem(context);
        if (!scheduleItem) {
            this.detach();
            return;
        }

        const menuButton = this.getHostElement(scheduleItem.id);
        if (!menuButton) {
            this.detach();
            return;
        }

        this.setState({
            ...this.state,
            items: [{
                id: 'ctxDetailsBtn',
                type: 'link',
                title: __('actions.openItem'),
                url: getApplicationURL(`schedule/${scheduleItem.id}`),
                onClick: (_, e) => e?.preventDefault(),
            }, {
                type: 'separator',
            }, {
                id: 'ctxUpdateBtn',
                type: 'link',
                icon: 'update',
                title: __('actions.update'),
                url: getApplicationURL(`schedule/update/${scheduleItem.id}`),
            }, {
                id: 'ctxDuplicateBtn',
                type: 'link',
                icon: 'duplicate',
                title: __('actions.duplicate'),
                url: getApplicationURL(`schedule/create?from=${scheduleItem.id}`),
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

        this.attachAndShow(menuButton);
    }
}
