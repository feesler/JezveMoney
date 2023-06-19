import { PopupMenu } from 'jezvejs/PopupMenu';
import { __ } from '../../../../utils/utils.js';
import { App } from '../../../../Application/App.js';
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
                title: __('actions.openItem'),
                onClick: (e) => e?.preventDefault(),
            }, {
                type: 'separator',
            }, {
                id: 'ctxUpdateBtn',
                type: 'link',
                icon: 'update',
                title: __('actions.update'),
            }, {
                id: 'ctxExportBtn',
                type: 'link',
                icon: 'export',
                title: __('transactions.exportToCsv'),
            }, {
                id: 'ctxShowBtn',
                icon: 'show',
                title: __('actions.show'),
            }, {
                id: 'ctxHideBtn',
                icon: 'hide',
                title: __('actions.hide'),
            }, {
                id: 'ctxDeleteBtn',
                icon: 'del',
                title: __('actions.delete'),
            }],
        });

        this.state = {
            contextItem: null,
            showContextMenu: false,
        };
    }

    getContextItem(state) {
        return App.model.userAccounts.getItem(state.contextItem);
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

        const { baseURL } = App;
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
