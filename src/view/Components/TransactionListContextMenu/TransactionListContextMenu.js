import { PopupMenu } from 'jezvejs/PopupMenu';

import { __, getApplicationURL } from '../../utils/utils.js';

/** Transactions list context menu component */
export class TransactionListContextMenu extends PopupMenu {
    constructor(props) {
        super({
            ...props,
            fixed: false,
        });
    }

    getHostElement(itemId) {
        return document.querySelector(`.trans-item[data-id="${itemId}"] .menu-btn`);
    }

    setContext(context) {
        if (!context) {
            throw new Error('Invalid context value');
        }

        if (!context.showContextMenu) {
            this.detach();
            return;
        }

        const itemId = context.contextItem;
        const menuButton = this.getHostElement(itemId);
        if (!menuButton) {
            this.detach();
            return;
        }

        this.setItems([{
            id: 'ctxDetailsBtn',
            type: 'link',
            title: __('actions.openItem'),
            url: getApplicationURL(`transactions/${itemId}`),
            hidden: !context.showDetailsItem,
            onClick: (_, e) => e?.preventDefault(),
        }, {
            id: 'separator1',
            type: 'separator',
            hidden: !context.showDetailsItem,
        }, {
            id: 'ctxUpdateBtn',
            type: 'link',
            icon: 'update',
            title: __('actions.update'),
            url: getApplicationURL(`transactions/update/${itemId}`),
        }, {
            id: 'ctxDuplicateBtn',
            type: 'link',
            icon: 'duplicate',
            title: __('actions.duplicate'),
            url: getApplicationURL(`transactions/create?from=${itemId}`),
        }, {
            id: 'ctxSetCategoryBtn',
            title: __('transactions.setCategoryMenu'),
        }, {
            type: 'separator',
        }, {
            id: 'ctxDeleteBtn',
            icon: 'del',
            title: __('actions.delete'),
        }]);

        this.attachAndShow(menuButton);
    }
}
