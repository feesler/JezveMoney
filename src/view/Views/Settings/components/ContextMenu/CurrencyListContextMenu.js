import { PopupMenu } from 'jezvejs/PopupMenu';
import { __ } from '../../../../utils/utils.js';
import { App } from '../../../../Application/App.js';

/** User currencies list context menu component */
export class CurrencyListContextMenu extends PopupMenu {
    constructor(props) {
        super({
            ...props,
            fixed: false,
            items: [{
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
        return App.model.userCurrencies.getItem(state.contextItem);
    }

    getHostElement(itemId) {
        return document.querySelector(`.currency-item[data-id="${itemId}"] .menu-btn`);
    }

    render(state) {
        if (!state) {
            throw new Error('Invalid state');
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

        this.attachAndShow(menuButton);
    }
}
