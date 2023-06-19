import { show } from 'jezvejs';
import { PopupMenu } from 'jezvejs/PopupMenu';

import { __ } from '../../utils/utils.js';
import { App } from '../../Application/App.js';

/** Transactions list context menu component */
export class TransactionListContextMenu extends PopupMenu {
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
                id: 'separator1',
                type: 'separator',
            }, {
                id: 'ctxUpdateBtn',
                type: 'link',
                icon: 'update',
                title: __('actions.update'),
            }, {
                id: 'ctxSetCategoryBtn',
                title: __('transactions.setCategoryMenu'),
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
            showDetailsItem: false,
        };
    }

    getHostElement(itemId) {
        return document.querySelector(`.trans-item[data-id="${itemId}"] .menu-btn`);
    }

    render(state) {
        if (!state) {
            throw new Error('Invalid state');
        }

        if (!state.showContextMenu) {
            this.detach();
            return;
        }

        const itemId = state.contextItem;
        const menuButton = this.getHostElement(itemId);
        if (!menuButton) {
            this.detach();
            return;
        }

        const { baseURL } = App;
        const { items } = this;

        items.ctxDetailsBtn.show(state.showDetailsItem);
        show(items.separator1, state.showDetailsItem);
        items.ctxDetailsBtn.setURL(`${baseURL}transactions/${itemId}`);
        items.ctxUpdateBtn.setURL(`${baseURL}transactions/update/${itemId}`);

        this.attachAndShow(menuButton);
    }
}
