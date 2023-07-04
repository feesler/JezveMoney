import { show } from 'jezvejs';
import { PopupMenu } from 'jezvejs/PopupMenu';

import { __, getSelectedItems } from '../../../../utils/utils.js';

/** Scheduled transactions list main menu component */
export class ScheduleMainMenu extends PopupMenu {
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
                id: 'finishBtn',
                title: __('schedule.finish'),
            }, {
                id: 'separator3',
                type: 'separator',
            }, {
                id: 'deleteBtn',
                icon: 'del',
                title: __('actions.delete'),
            }],
        });

        this.state = {
            listMode: 'list',
            showMenu: false,
            items: [],
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

        const { items } = this;

        items.selectModeBtn.show(isListMode && itemsCount > 0);

        items.selectAllBtn.show(isSelectMode && itemsCount > 0 && selCount < itemsCount);
        items.deselectAllBtn.show(isSelectMode && itemsCount > 0 && selCount > 0);
        show(items.separator2, isSelectMode && selCount > 0);
        show(items.separator3, isSelectMode && selCount > 0);

        items.finishBtn.show(selCount > 0);
        items.deleteBtn.show(selCount > 0);
    }
}
