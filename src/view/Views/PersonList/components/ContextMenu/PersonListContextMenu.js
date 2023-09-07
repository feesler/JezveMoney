import { PopupMenu } from 'jezvejs/PopupMenu';

import { __, getApplicationURL } from '../../../../utils/utils.js';
import { App } from '../../../../Application/App.js';
import { getExportURL } from '../../helpers.js';

/** Persons list context menu component */
export class PersonListContextMenu extends PopupMenu {
    constructor(props) {
        super({
            ...props,
            fixed: false,
        });
    }

    getContextItem(state) {
        return App.model.persons.getItem(state.contextItem);
    }

    getHostElement(itemId) {
        return document.querySelector(`.tile[data-id="${itemId}"]`);
    }

    setContext(context) {
        if (!context) {
            throw new Error('Invalid state');
        }

        if (!context.showContextMenu) {
            this.detach();
            return;
        }
        const person = this.getContextItem(context);
        if (!person) {
            this.detach();
            return;
        }

        const tile = this.getHostElement(person.id);
        if (!tile) {
            this.detach();
            return;
        }

        this.setItems([{
            id: 'ctxDetailsBtn',
            type: 'link',
            title: __('actions.openItem'),
            url: getApplicationURL(`persons/${person.id}`),
            onClick: (_, e) => e?.preventDefault(),
        }, {
            type: 'separator',
        }, {
            id: 'ctxUpdateBtn',
            type: 'link',
            icon: 'update',
            title: __('actions.update'),
            url: getApplicationURL(`persons/update/${person.id}`),
        }, {
            id: 'ctxExportBtn',
            type: 'link',
            icon: 'export',
            title: __('transactions.exportToCsv'),
            url: getExportURL(person.id),
        }, {
            id: 'ctxShowBtn',
            icon: 'show',
            title: __('actions.show'),
            hidden: person.isVisible(),
        }, {
            id: 'ctxHideBtn',
            icon: 'hide',
            title: __('actions.hide'),
            hidden: !person.isVisible(),
        }, {
            id: 'ctxDeleteBtn',
            icon: 'del',
            title: __('actions.delete'),
        }]);

        this.attachAndShow(tile);
    }
}
