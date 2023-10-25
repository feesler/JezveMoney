import { PopupMenu } from 'jezvejs/PopupMenu';

import { __, getSelectedItems } from '../../../../utils/utils.js';
import { finishSelected, setListMode } from '../../actions.js';
import { actions } from '../../reducer.js';

/** Scheduled transactions list main menu component */
export class ScheduleMainMenu extends PopupMenu {
    setContext(context) {
        if (!context) {
            throw new Error('Invalid context');
        }

        if (!context.showMenu) {
            this.hideMenu();
            return;
        }

        const { dispatch } = this.state;
        const itemsCount = context.items.length;
        const selArr = getSelectedItems(context.items);
        const selCount = selArr.length;
        const isListMode = context.listMode === 'list';
        const isSelectMode = context.listMode === 'select';

        this.setItems([{
            id: 'selectModeBtn',
            icon: 'select',
            title: __('actions.select'),
            hidden: !(isListMode && itemsCount > 0),
            onClick: () => dispatch(setListMode('select')),
        }, {
            id: 'selectAllBtn',
            title: __('actions.selectAll'),
            hidden: !(isSelectMode && itemsCount > 0 && selCount < itemsCount),
            onClick: () => dispatch(actions.selectAllItems()),
        }, {
            id: 'deselectAllBtn',
            title: __('actions.deselectAll'),
            hidden: !(isSelectMode && itemsCount > 0 && selCount > 0),
            onClick: () => dispatch(actions.deselectAllItems()),
        }, {
            id: 'separator2',
            type: 'separator',
            hidden: !(isSelectMode && selCount > 0),
        }, {
            id: 'finishBtn',
            title: __('schedule.finish'),
            hidden: !(selCount > 0),
            onClick: () => dispatch(finishSelected()),
        }, {
            id: 'separator3',
            type: 'separator',
            hidden: !(isSelectMode && selCount > 0),
        }, {
            id: 'deleteBtn',
            icon: 'del',
            title: __('actions.delete'),
            hidden: !(selCount > 0),
            onClick: () => dispatch(actions.showDeleteConfirmDialog()),
        }]);
    }
}
