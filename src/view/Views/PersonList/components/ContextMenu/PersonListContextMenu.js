import { PopupMenu } from 'jezvejs/PopupMenu';
import { __ } from '../../../../utils/utils.js';
import { App } from '../../../../Application/App.js';
import { getExportURL } from '../../helpers.js';

/** Persons list context menu component */
export class PersonListContextMenu extends PopupMenu {
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
                id: 'ctxExportBtn',
                type: 'link',
                icon: 'export',
                title: __('transactions.exportToCsv'),
            }, {
                id: 'ctxShowBtn',
                icon: 'show',
                title: __('actions.show'),
            }, {
                id: 'ctxHideBtn',
                icon: 'hide',
                title: __('actions.hide'),
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
        return App.model.persons.getItem(state.contextItem);
    }

    getHostElement(itemId) {
        return document.querySelector(`.tile[data-id="${itemId}"]`);
    }

    render(state) {
        if (!state) {
            throw new Error('Invalid state');
        }

        if (!state.showContextMenu) {
            this.detach();
            return;
        }
        const person = this.getContextItem(state);
        if (!person) {
            this.detach();
            return;
        }

        const tile = this.getHostElement(person.id);
        if (!tile) {
            this.detach();
            return;
        }

        const { baseURL } = App;
        const { items } = this;
        items.ctxDetailsBtn.setURL(`${baseURL}persons/${person.id}`);
        items.ctxUpdateBtn.setURL(`${baseURL}persons/update/${person.id}`);

        const exportURL = getExportURL(person.id);
        items.ctxExportBtn.setURL(exportURL.toString());
        items.ctxShowBtn.show(!person.isVisible());
        items.ctxHideBtn.show(person.isVisible());

        this.attachAndShow(tile);
    }
}
