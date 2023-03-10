import 'jezvejs/style';
import { ge, createElement, selectByValue } from 'jezvejs';
import { Application } from '../../../../view/js/Application.js';
import '../../../../view/css/app.scss';
import { AdminListView } from '../../js/AdminListView.js';
import '../../css/admin.scss';

/**
 * Admin icon list view
 */
class AdminIconListView extends AdminListView {
    constructor(...args) {
        super(...args);

        this.apiController = 'icon';
        this.statePath = 'icons';
        this.deleteConfirmMessage = 'Are you sure want to delete selected icon?';
    }

    /**
     * View initialization
     */
    onStart() {
        super.onStart();

        this.idInput = ge('icon_id');
        this.nameInput = ge('icon_name');
        this.fileInput = ge('icon_file');
        this.typeSelect = ge('icon_type');
    }

    /**
     * Set up fields of form for specified item
     * @param {*} item - if set to null create mode is assumed, if set to object then update mode
     */
    setItemValues(item) {
        if (item) {
            this.idInput.value = item.id;
            this.nameInput.value = item.name;
            this.fileInput.value = item.file;
            selectByValue(this.typeSelect, item.type);
        } else {
            this.idInput.value = '';
            this.nameInput.value = '';
            this.fileInput.value = '';
            selectByValue(this.typeSelect, 0);
        }
    }

    /**
     * Render list element for specified item
     * @param {object} item - item object
     */
    renderItem(item) {
        if (!item) {
            return null;
        }

        return createElement('tr', {
            children: [
                createElement('td', { props: { textContent: item.id } }),
                createElement('td', { props: { textContent: item.name } }),
                createElement('td', { props: { textContent: item.file } }),
                createElement('td', { props: { textContent: item.type } }),
            ],
        });
    }
}

window.app = new Application(window.appProps);
window.app.createView(AdminIconListView);
