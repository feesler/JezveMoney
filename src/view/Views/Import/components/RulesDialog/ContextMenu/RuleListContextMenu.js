import { PopupMenu } from 'jezvejs/PopupMenu';

import { __ } from '../../../../../utils/utils.js';
import { App } from '../../../../../Application/App.js';

/* CSS classes */
const UPDATE_BUTTON_CLASS = 'update-btn';
const DUPLICATE_BUTTON_CLASS = 'duplicate-btn';
const DEL_BUTTON_CLASS = 'delete-btn';

/** Import rules list context menu component */
export class RuleListContextMenu extends PopupMenu {
    constructor(props) {
        super({
            ...props,
            fixed: false,
        });
    }

    getContextItem(state) {
        return App.model.rules.getItem(state.contextItem);
    }

    getHostElement(itemId) {
        return document.querySelector(`.rule-item[data-id="${itemId}"] .menu-btn`);
    }

    setContext(context) {
        if (!context) {
            throw new Error('Invalid context value');
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

        this.setItems([{
            id: 'ctxUpdateRuleBtn',
            icon: 'update',
            title: __('actions.update'),
            className: UPDATE_BUTTON_CLASS,
        }, {
            id: 'ctxDuplicateRuleBtn',
            icon: 'duplicate',
            title: __('actions.duplicate'),
            className: DUPLICATE_BUTTON_CLASS,
        }, {
            id: 'ctxDeleteRuleBtn',
            icon: 'del',
            title: __('actions.delete'),
            className: DEL_BUTTON_CLASS,
        }]);

        this.attachAndShow(menuButton);
    }
}
