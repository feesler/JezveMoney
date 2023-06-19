import { PopupMenu } from 'jezvejs/PopupMenu';
import { __ } from '../../../../utils/utils.js';
import { App } from '../../../../Application/App.js';

/** Categories list context menu component */
export class CategoryListContextMenu extends PopupMenu {
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
        return App.model.categories.getItem(state.contextItem);
    }

    getHostElement(itemId) {
        const selector = `.category-item[data-id="${itemId}"] .menu-btn`;
        return document.querySelector(selector);
    }

    render(state) {
        if (!state) {
            throw new Error('Invalid state');
        }

        if (!state.showContextMenu) {
            this.detach();
            return;
        }
        const category = this.getContextItem(state);
        if (!category) {
            this.detach();
            return;
        }

        const menuButton = this.getHostElement(category.id);
        if (!menuButton) {
            this.detach();
            return;
        }

        const { baseURL } = App;
        const { items } = this;
        items.ctxDetailsBtn.setURL(`${baseURL}categories/${category.id}`);
        items.ctxUpdateBtn.setURL(`${baseURL}categories/update/${category.id}`);

        this.attachAndShow(menuButton);
    }
}
