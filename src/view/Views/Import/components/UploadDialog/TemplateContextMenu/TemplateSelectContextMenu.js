import { PopupMenu } from 'jezvejs/PopupMenu';

import { __ } from '../../../../../utils/utils.js';

/* CSS classes */
const UPDATE_BUTTON_CLASS = 'update-btn';
const DEL_BUTTON_CLASS = 'delete-btn';

/** Import templates select context menu component */
export class TemplateSelectContextMenu extends PopupMenu {
    constructor(props) {
        super({
            ...props,
            fixed: false,
            items: [{
                id: 'ctxUpdateTemplateBtn',
                icon: 'update',
                title: __('actions.update'),
                className: UPDATE_BUTTON_CLASS,
                onClick: (e) => e?.stopPropagation(),
            }, {
                id: 'ctxDeleteTemplateBtn',
                icon: 'del',
                title: __('actions.delete'),
                className: DEL_BUTTON_CLASS,
                onClick: (e) => e?.stopPropagation(),
            }],
        });

        this.state = {
            showContextMenu: false,
        };
    }

    getHostElement() {
        return document.querySelector('.template-select .menu-btn');
    }

    render(state) {
        if (!state) {
            throw new Error('Invalid state');
        }

        if (!state.showContextMenu) {
            this.detach();
            return;
        }

        const menuButton = this.getHostElement();
        if (!menuButton) {
            this.detach();
            return;
        }

        this.attachAndShow(menuButton);
    }
}
