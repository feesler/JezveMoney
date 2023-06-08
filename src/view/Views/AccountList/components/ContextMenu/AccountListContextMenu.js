import { PopupMenu } from 'jezvejs/PopupMenu';
import { __ } from '../../../../utils/utils.js';
import { getExportURL } from '../../helpers.js';

/** Accounts list context menu component */
export class AccountListContextMenu extends PopupMenu {
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
                type: 'separator',
            }, {
                id: 'ctxUpdateBtn',
                type: 'link',
                icon: 'update',
                title: __('UPDATE'),
            }, {
                id: 'ctxExportBtn',
                type: 'link',
                icon: 'export',
                title: __('TR_EXPORT_CSV'),
            }, {
                id: 'ctxShowBtn',
                icon: 'show',
                title: __('SHOW'),
            }, {
                id: 'ctxHideBtn',
                icon: 'hide',
                title: __('HIDE'),
            }, {
                id: 'ctxDeleteBtn',
                icon: 'del',
                title: __('DELETE'),
            }],
        });

        this.state = {
            contextItem: null,
            showContextMenu: false,
        };
    }

    getContextItem(state) {
        return window.app.model.userAccounts.getItem(state.contextItem);
    }

    getHostElement(itemId) {
        return document.querySelector(`.tile[data-id="${itemId}"]`);
    }

    render(state) {
        if (!state) {
            throw new Error('Invalid state');
        }

        if (!state.showContextMenu) {
            this.detach();
            return;
        }
        const account = this.getContextItem(state);
        if (!account) {
            this.detach();
            return;
        }

        const tile = this.getHostElement(account.id);
        if (!tile) {
            this.detach();
            return;
        }

        const { baseURL } = window.app;
        const { items } = this;
        items.ctxDetailsBtn.setURL(`${baseURL}accounts/${account.id}`);
        items.ctxUpdateBtn.setURL(`${baseURL}accounts/update/${account.id}`);

        const exportURL = getExportURL(account.id);
        items.ctxExportBtn.setURL(exportURL.toString());
        items.ctxShowBtn.show(!account.isVisible());
        items.ctxHideBtn.show(account.isVisible());

        this.attachAndShow(tile);
    }
}
