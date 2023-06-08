import { show } from 'jezvejs';
import { PopupMenu } from 'jezvejs/PopupMenu';

import { __ } from '../../utils/utils.js';

/** Transactions list context menu component */
export class TransactionListContextMenu extends PopupMenu {
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
                id: 'separator1',
                type: 'separator',
            }, {
                id: 'ctxUpdateBtn',
                type: 'link',
                icon: 'update',
                title: __('UPDATE'),
            }, {
                id: 'ctxSetCategoryBtn',
                title: __('SET_CATEGORY'),
            }, {
                type: 'separator',
            }, {
                id: 'ctxDeleteBtn',
                icon: 'del',
                title: __('DELETE'),
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

        const { baseURL } = window.app;
        const { items } = this;

        items.ctxDetailsBtn.show(state.showDetailsItem);
        show(items.separator1, state.showDetailsItem);
        items.ctxDetailsBtn.setURL(`${baseURL}transactions/${itemId}`);
        items.ctxUpdateBtn.setURL(`${baseURL}transactions/update/${itemId}`);

        this.attachAndShow(menuButton);
    }
}
