import { PopupMenu } from 'jezvejs/PopupMenu';
import { __ } from '../../../../utils/utils.js';
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
                title: __('OPEN_ITEM'),
                onClick: (e) => e?.preventDefault(),
            }, {
                type: 'separator',
            }, {
                id: 'ctxUpdateBtn',
                type: 'link',
                icon: 'update',
                title: __('UPDATE'),
            }, {
                id: 'ctxExportBtn',
                type: 'link',
                icon: 'export',
                title: __('TR_EXPORT_CSV'),
            }, {
                id: 'ctxShowBtn',
                icon: 'show',
                title: __('SHOW'),
            }, {
                id: 'ctxHideBtn',
                icon: 'hide',
                title: __('HIDE'),
            }, {
                id: 'ctxDeleteBtn',
                icon: 'del',
                title: __('DELETE'),
            }],
        });

        this.state = {
            contextItem: null,
            showContextMenu: false,
        };
    }

    getContextItem(state) {
        return window.app.model.persons.getItem(state.contextItem);
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

        const { baseURL } = window.app;
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
