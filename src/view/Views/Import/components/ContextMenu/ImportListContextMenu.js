import { PopupMenu } from 'jezvejs/PopupMenu';

import { __ } from '../../../../utils/utils.js';
import { actions } from '../../reducer.js';

/** Import transactions list context menu component */
export class ImportListContextMenu extends PopupMenu {
    constructor(props) {
        super({
            ...props,
            fixed: false,
        });
    }

    getContextItem(state) {
        return (state.contextItemIndex !== -1) ? state.items[state.contextItemIndex] : null;
    }

    getHostElement(itemId) {
        return document.querySelector(`.import-item[data-id="${itemId}"] .menu-btn`);
    }

    setContext(context) {
        if (!context) {
            throw new Error('Invalid context value');
        }

        if (!context.showContextMenu) {
            this.detach();
            return;
        }

        const item = this.getContextItem(context);
        if (!item) {
            this.detach();
            return;
        }

        const menuButton = this.getHostElement(item.id);
        if (!menuButton) {
            this.detach();
            return;
        }

        const { dispatch } = this.state;
        const itemRestoreAvail = (
            !!item.originalData && (item.rulesApplied || item.modifiedByUser)
        );

        this.setItems([{
            id: 'ctxRestoreBtn',
            title: __('import.itemRestore'),
            className: 'warning-item',
            hidden: !itemRestoreAvail,
            onClick: () => dispatch(actions.restoreItem()),
        }, {
            id: 'separator1',
            type: 'separator',
            hidden: !itemRestoreAvail,
        }, {
            id: 'ctxEnableBtn',
            title: (item.enabled) ? __('actions.disable') : __('actions.enable'),
            onClick: () => dispatch(actions.toggleEnableItem()),
        }, {
            id: 'ctxUpdateBtn',
            icon: 'update',
            title: __('actions.update'),
            onClick: () => dispatch(actions.editItem()),
        }, {
            id: 'ctxDuplicateBtn',
            icon: 'duplicate',
            title: __('actions.duplicate'),
            onClick: () => dispatch(actions.duplicateItem()),
        }, {
            id: 'ctxDeleteBtn',
            icon: 'del',
            title: __('actions.delete'),
            onClick: () => dispatch(actions.deleteItem()),
        }]);

        this.attachAndShow(menuButton);
    }
}
