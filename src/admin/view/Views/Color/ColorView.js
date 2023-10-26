import 'jezvejs/style';
import { ge, createElement } from '@jezvejs/dom';

import { App } from '../../../../view/Application/App.js';
import { __ } from '../../../../view/utils/utils.js';
import '../../../../view/Application/Application.scss';

import { AdminListView } from '../../utils/AdminListView/AdminListView.js';
import '../../utils/AdminView/AdminView.scss';

/**
 * Admin colors list view
 */
class AdminColorListView extends AdminListView {
    constructor(...args) {
        super(...args);

        this.apiController = 'color';
        this.statePath = 'colors';
        this.deleteConfirmMessage = __('colors.deleteMessage');
    }

    /**
     * View initialization
     */
    onStart() {
        super.onStart();

        this.idInput = ge('color_id');
        this.valueInput = ge('color_value');
        this.typeInput = ge('color_type');
    }

    /**
     * Set up fields of form for specified item
     * @param {*} item - if set to null create mode is assumed, if set to object then update mode
     */
    setItemValues(item) {
        if (item) {
            this.idInput.value = item.id;
            this.valueInput.value = item.value;
            this.typeInput.value = item.type;
        } else {
            this.idInput.value = '';
            this.valueInput.value = '';
            this.typeInput.value = '';
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
                createElement('td', { props: { textContent: item.value } }),
                createElement('td', { props: { textContent: item.type } }),
            ],
        });
    }
}

App.createView(AdminColorListView);
