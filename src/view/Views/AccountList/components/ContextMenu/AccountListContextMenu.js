import { PopupMenu } from 'jezvejs/PopupMenu';

import { __ } from '../../../../utils/utils.js';
import { App } from '../../../../Application/App.js';

import { actions } from '../../reducer.js';
import { showDetails, showItems } from '../../actions.js';

/** Accounts list context menu component */
export class AccountListContextMenu extends PopupMenu {
    constructor(props) {
        super({
            ...props,
            fixed: false,
        });
    }

    getContextItem(state) {
        return App.model.userAccounts.getItem(state.contextItem);
    }

    getHostElement(itemId) {
        return document.querySelector(`.tile[data-id="${itemId}"]`);
    }

    setContext(context) {
        if (!context) {
            throw new Error('Invalid context value');
        }

        if (!context.showContextMenu) {
            this.detach();
            return;
        }
        const account = this.getContextItem(context);
        if (!account) {
            this.detach();
            return;
        }

        const tile = this.getHostElement(account.id);
        if (!tile) {
            this.detach();
            return;
        }

        const { dispatch } = this.state;
        this.setItems([{
            id: 'ctxDetailsBtn',
            type: 'link',
            title: __('actions.openItem'),
            url: App.getURL(`accounts/${account.id}`),
            onClick: (_, e) => {
                e?.preventDefault();
                dispatch(showDetails());
            },
        }, {
            type: 'separator',
        }, {
            id: 'ctxUpdateBtn',
            type: 'link',
            icon: 'update',
            title: __('actions.update'),
            url: App.getURL(`accounts/update/${account.id}`),
        }, {
            id: 'ctxExportBtn',
            icon: 'export',
            title: __('export.menuTitle'),
            onClick: () => dispatch(actions.showExportDialog()),
        }, {
            id: 'ctxShowBtn',
            icon: 'show',
            title: __('actions.show'),
            hidden: account.isVisible(),
            onClick: () => dispatch(showItems()),
        }, {
            id: 'ctxHideBtn',
            icon: 'hide',
            title: __('actions.hide'),
            hidden: !account.isVisible(),
            onClick: () => dispatch(showItems(false)),
        }, {
            id: 'ctxDeleteBtn',
            icon: 'del',
            title: __('actions.delete'),
            onClick: () => dispatch(actions.showDeleteConfirmDialog()),
        }]);

        this.attachAndShow(tile);
    }
}
