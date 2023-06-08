import { PopupMenu } from 'jezvejs/PopupMenu';

import { __ } from '../../../../../utils/utils.js';

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
                title: __('UPDATE'),
                className: UPDATE_BUTTON_CLASS,
            }, {
                id: 'ctxDeleteRuleBtn',
                icon: 'del',
                title: __('DELETE'),
                className: DEL_BUTTON_CLASS,
            }],
        });

        this.state = {
            contextItem: -1,
            showContextMenu: false,
        };
    }

    getContextItem(state) {
        return window.app.model.rules.getItem(state.contextItem);
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
