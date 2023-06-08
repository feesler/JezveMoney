import { show } from 'jezvejs';
import { PopupMenu } from 'jezvejs/PopupMenu';

import { __ } from '../../../../utils/utils.js';

/** Import transactions list context menu component */
export class ImportListContextMenu extends PopupMenu {
    constructor(props) {
        super({
            ...props,
            fixed: false,
            items: [{
                id: 'ctxRestoreBtn',
                title: __('IMPORT_ITEM_RESTORE'),
                className: 'warning-item',
            }, {
                id: 'separator1',
                type: 'separator',
            }, {
                id: 'ctxEnableBtn',
                title: __('DISABLE'),
            }, {
                id: 'ctxUpdateBtn',
                icon: 'update',
                title: __('UPDATE'),
            }, {
                id: 'ctxDeleteBtn',
                icon: 'del',
                title: __('DELETE'),
            }],
        });

        this.state = {
            contextItemIndex: -1,
            showContextMenu: false,
            items: [],
        };
    }

    getContextItem(state) {
        return (state.contextItemIndex !== -1) ? state.items[state.contextItemIndex] : null;
    }

    getHostElement(itemId) {
        return document.querySelector(`.import-item[data-id="${itemId}"] .menu-btn`);
    }

    render(state, prevState = {}) {
        if (!state) {
            throw new Error('Invalid state');
        }

        if (
            (state.showContextMenu === prevState?.showContextMenu)
            && (state.contextItemIndex === prevState?.contextItemIndex)
            && (state.items === prevState?.items)
        ) {
            return;
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

        const { items } = this;

        const itemRestoreAvail = (
            !!item.originalData && (item.rulesApplied || item.modifiedByUser)
        );
        items.ctxRestoreBtn.show(itemRestoreAvail);
        show(items.separator1, itemRestoreAvail);

        const title = (item.enabled) ? __('DISABLE') : __('ENABLE');
        items.ctxEnableBtn.setTitle(title);

        this.attachAndShow(menuButton);
    }
}
