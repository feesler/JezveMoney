import { PopupMenu } from 'jezvejs/PopupMenu';

import { __ } from '../../../../../utils/utils.js';
import { updateTemplate } from '../TemplateManager/actions.js';
import { actions } from '../TemplateManager/reducer.js';

/* CSS classes */
const UPDATE_BUTTON_CLASS = 'update-btn';
const DEL_BUTTON_CLASS = 'delete-btn';

/** Import templates select context menu component */
export class TemplateSelectContextMenu extends PopupMenu {
    constructor(props = {}) {
        super({
            ...props,
            fixed: false,
        });
    }

    getHostElement() {
        return document.querySelector('.template-select .menu-btn');
    }

    setContext(context) {
        if (!context) {
            throw new Error('Invalid context');
        }

        if (!context.showContextMenu) {
            this.detach();
            return;
        }

        const menuButton = this.getHostElement();
        if (!menuButton) {
            this.detach();
            return;
        }

        const { dispatch } = this.state;
        this.setItems([{
            id: 'ctxUpdateTemplateBtn',
            icon: 'update',
            title: __('actions.update'),
            className: UPDATE_BUTTON_CLASS,
            onClick: (_, e) => {
                e?.stopPropagation();
                dispatch(updateTemplate());
            },
        }, {
            id: 'ctxDeleteTemplateBtn',
            icon: 'del',
            title: __('actions.delete'),
            className: DEL_BUTTON_CLASS,
            onClick: (_, e) => {
                e?.stopPropagation();
                dispatch(actions.showDeleteConfirmDialog());
            },
        }]);

        this.attachAndShow(menuButton);
    }
}
