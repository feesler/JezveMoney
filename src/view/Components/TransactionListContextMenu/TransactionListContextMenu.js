import { mapItems } from 'jezvejs/Menu';
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
                onClick: (_, e) => e?.preventDefault(),
            }, {
                id: 'separator1',
                type: 'separator',
            }, {
                id: 'ctxUpdateBtn',
                type: 'link',
                icon: 'update',
                title: __('actions.update'),
            }, {
                id: 'ctxDuplicateBtn',
                type: 'link',
                icon: 'duplicate',
                title: __('actions.duplicate'),
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
            ...this.state,
            contextItem: null,
            showContextMenu: false,
            showDetailsItem: false,
        };
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

        const { baseURL } = App;

        this.setState({
            ...this.state,
            showContextMenu: context.showContextMenu,
            contextItem: context.contextItem,
            showDetailsItem: context.showDetailsItem,
            items: mapItems(this.state.items, (item) => {
                if (item.id === 'ctxDetailsBtn') {
                    return {
                        ...item,
                        url: `${baseURL}transactions/${itemId}`,
                        hidden: !context.showDetailsItem,
                    };
                }

                if (item.id === 'separator1') {
                    return {
                        ...item,
                        hidden: !context.showDetailsItem,
                    };
                }

                if (item.id === 'ctxUpdateBtn') {
                    return {
                        ...item,
                        url: `${baseURL}transactions/update/${itemId}`,
                    };
                }

                if (item.id === 'ctxDuplicateBtn') {
                    return {
                        ...item,
                        url: `${baseURL}transactions/create?from=${itemId}`,
                    };
                }

                return item;
            }),
        });

        this.attachAndShow(menuButton);
    }
}
