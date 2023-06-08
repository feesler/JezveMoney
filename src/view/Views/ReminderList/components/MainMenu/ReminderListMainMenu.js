import { show } from 'jezvejs';
import { PopupMenu } from 'jezvejs/PopupMenu';

import { __, getSelectedItems } from '../../../../utils/utils.js';

/** Reminders list main menu component */
export class ReminderListMainMenu extends PopupMenu {
    constructor(props) {
        super({
            ...props,
            items: [{
                id: 'selectModeBtn',
                icon: 'select',
                title: __('SELECT'),
            }, {
                id: 'selectAllBtn',
                title: __('SELECT_ALL'),
            }, {
                id: 'deselectAllBtn',
                title: __('DESELECT_ALL'),
            }, {
                id: 'separator2',
                type: 'separator',
            }, {
                id: 'confirmBtn',
                icon: 'check',
                title: __('REMINDER_CONFIRM'),
            }, {
                id: 'cancelBtn',
                icon: 'del',
                title: __('REMINDER_CANCEL'),
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
        show(items.separator2, isSelectMode);

        items.confirmBtn.show(selCount > 0);
        items.cancelBtn.show(selCount > 0);
    }
}
