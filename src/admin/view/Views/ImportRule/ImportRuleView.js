import 'jezvejs/style';
import {
    ge,
    ce,
    show,
    copyObject,
    ajax,
} from 'jezvejs';
import { AdminListView } from '../../js/AdminListView.js';
import { AdminImportConditionListView } from './ImportConditionView.js';
import { AdminImportActionListView } from './ImportActionView.js';
import '../../../../view/css/app.css';
import '../../css/admin.css';
import './style.css';

/* eslint no-bitwise: "off" */

/**
 * Admin import rule list view
 */
class AdminImportRuleListView extends AdminListView {
    constructor(...args) {
        super(...args);

        this.apiController = 'importrule';
        this.deleteConfirmMessage = 'Are you sure want to delete selected rule?';

        if (!('data' in this.props)
            || !('actionTypes' in this.props)
            || !('fields' in this.props)
            || !('operators' in this.props)) {
            throw new Error('Invalid data');
        }

        this.conditionsView = new AdminImportConditionListView({
            elements: {
                itemsListElem: 'conditions-list',
                createBtn: 'createcondbtn',
                updateBtn: 'updcondbtn',
                deleteBtn: 'delcondbtn',
                itemForm: 'condition-frm',
                dialogPopup: 'condition_popup',
            },
            data: [],
            actionTypes: this.props.actionTypes,
            fields: this.props.fields,
            operators: this.props.operators,
        });

        this.actionsView = new AdminImportActionListView({
            elements: {
                itemsListElem: 'actions-list',
                createBtn: 'createactbtn',
                updateBtn: 'updactbtn',
                deleteBtn: 'delactbtn',
                itemForm: 'action-frm',
                dialogPopup: 'action_popup',
            },
            data: [],
            actionTypes: this.props.actionTypes,
        });
    }

    /**
     * View initialization
     */
    onStart() {
        super.onStart();

        this.idInput = ge('item_id');
        this.flagsInput = ge('item_flags');

        this.conditionsContainer = ge('conditionsContainer');
        this.actionsContainer = ge('actionsContainer');
    }

    /**
     * Set up fields of form for specified item
     * @param {*} item - if set to null create mode is assumed, if set to object then update mode
     */
    setItemValues(item) {
        if (item) {
            this.idInput.value = item.id;
            this.flagsInput.value = item.flags;

            this.conditionsView.setParentRule(item.id);
            this.actionsView.setParentRule(item.id);
        } else {
            this.idInput.value = '';
            this.flagsInput.value = '';
        }

        show(this.conditionsContainer, !!item);
        show(this.actionsContainer, !!item);
    }

    /**
     * Process from data if needed and return request data
     * @param {object} data - form data
     */
    prepareRequestData(data) {
        const res = copyObject(data);

        res.flags = 0;

        return res;
    }

    /**
     * Request list of items from API
     */
    requestList() {
        const { baseURL } = window.app;

        ajax.get({
            url: `${baseURL}api/${this.apiController}/list?full=true`,
            callback: this.onListResult.bind(this),
        });
    }

    /**
     * Render list element for specified item
     * @param {object} item - item object
     */
    renderItem(item) {
        if (!item) {
            return null;
        }

        return ce('tr', {}, [
            ce('td', { textContent: item.id }),
            ce('td', { textContent: item.user_id }),
            ce('td', { textContent: item.flags }),
        ]);
    }
}

window.view = new AdminImportRuleListView(window.app);
