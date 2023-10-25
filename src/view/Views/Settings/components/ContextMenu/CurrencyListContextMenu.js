import { PopupMenu } from 'jezvejs/PopupMenu';
import { __ } from '../../../../utils/utils.js';
import { App } from '../../../../Application/App.js';
import { deleteItems } from '../../actions.js';

/** User currencies list context menu component */
export class CurrencyListContextMenu extends PopupMenu {
    constructor(props) {
        super({
            ...props,
            fixed: false,
        });
    }

    getContextItem(state) {
        return App.model.userCurrencies.getItem(state.contextItem);
    }

    getHostElement(itemId) {
        return document.querySelector(`.currency-item[data-id="${itemId}"] .menu-btn`);
    }

    setContext(context) {
        if (!context) {
            throw new Error('Invalid context');
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
        this.setItems([{
            id: 'ctxDeleteBtn',
            icon: 'del',
            title: __('actions.delete'),
            onClick: () => dispatch(deleteItems()),
        }]);

        this.attachAndShow(menuButton);
    }
}
