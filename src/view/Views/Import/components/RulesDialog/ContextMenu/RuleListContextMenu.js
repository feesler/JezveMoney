import { PopupMenu } from 'jezvejs/PopupMenu';

import { __ } from '../../../../../utils/utils.js';
import { App } from '../../../../../Application/App.js';

/* CSS classes */
const UPDATE_BUTTON_CLASS = 'update-btn';
const DEL_BUTTON_CLASS = 'delete-btn';

/** Import rules list context menu component */
export class RuleListContextMenu extends PopupMenu {
    constructor(props) {
        super({
            ...props,
            fixed: false,
            items: [{
                id: 'ctxUpdateRuleBtn',
                icon: 'update',
                title: __('actions.update'),
                className: UPDATE_BUTTON_CLASS,
            }, {
                id: 'ctxDeleteRuleBtn',
                icon: 'del',
                title: __('actions.delete'),
                className: DEL_BUTTON_CLASS,
            }],
        });

        this.state = {
            contextItem: -1,
            showContextMenu: false,
        };
    }

    getContextItem(state) {
        return App.model.rules.getItem(state.contextItem);
    }

    getHostElement(itemId) {
        return document.querySelector(`.rule-item[data-id="${itemId}"] .menu-btn`);
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
