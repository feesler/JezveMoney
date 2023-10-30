import { PopupMenu } from 'jezvejs/PopupMenu';

import { __ } from '../../../../utils/utils.js';
import { App } from '../../../../Application/App.js';

import { actions } from '../../reducer.js';
import { showDetails } from '../../actions.js';

/** Categories list context menu component */
export class CategoryListContextMenu extends PopupMenu {
    constructor(props) {
        super({
            ...props,
            fixed: false,
        });
    }

    getContextItem(state) {
        return App.model.categories.getItem(state.contextItem);
    }

    getHostElement(itemId) {
        const selector = `.category-item[data-id="${itemId}"] .menu-btn`;
        return document.querySelector(selector);
    }

    setContext(context) {
        if (!context) {
            throw new Error('Invalid context value');
        }

        if (!context.showContextMenu) {
            this.detach();
            return;
        }
        const category = this.getContextItem(context);
        if (!category) {
            this.detach();
            return;
        }

        const menuButton = this.getHostElement(category.id);
        if (!menuButton) {
            this.detach();
            return;
        }

        const { dispatch } = this.state;
        this.setItems([{
            id: 'ctxDetailsBtn',
            type: 'link',
            title: __('actions.openItem'),
            url: App.getURL(`categories/${category.id}`),
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
            url: App.getURL(`categories/update/${category.id}`),
        }, {
            id: 'ctxAddSubcategoryBtn',
            type: 'link',
            title: __('categories.addSubcategory'),
            hidden: category.parent_id !== 0,
            url: App.getURL(`categories/create/?parent_id=${category.id}`),
        }, {
            id: 'ctxDeleteBtn',
            icon: 'del',
            title: __('actions.delete'),
            onClick: () => dispatch(actions.showDeleteConfirmDialog()),
        }]);

        this.attachAndShow(menuButton);
    }
}
