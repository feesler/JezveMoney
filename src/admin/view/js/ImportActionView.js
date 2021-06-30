import {
    ge,
    ce,
    show,
    ajax,
    selectByValue,
    urlJoin,
} from 'jezvejs';
import { AdminListView } from './AdminListView.js';
import { List } from '../../../view/js/model/List.js';

/* global baseURL */
/* eslint no-bitwise: "off" */

/**
 * Admin import rule list view
 */
export class AdminImportActionListView extends AdminListView {
    constructor(...args) {
        super(...args);

        this.apiController = 'importaction';
        this.deleteConfirmMessage = 'Are you sure want to delete selected action?';

        if (!('data' in this.props)
            || !('actionTypes' in this.props)) {
            throw new Error('Invalid data');
        }
        this.actionTypes = new List(this.props.actionTypes);
        this.parentRule = 0;
    }

    /**
     * View initialization
     */
    onStart() {
        super.onStart();

        this.idInput = ge('action_id');
        this.ruleInput = ge('action_rule');
        this.actionSel = ge('action_type_id');
        this.valueInput = ge('action_value');
    }

    /**
     * Set up fields of form for specified item
     * @param {*} item - if set to null create mode is assumed, if set to object then update mode
     */
    setItemValues(item) {
        if (item) {
            this.idInput.value = item.id;
            this.ruleInput.value = item.rule_id;
            selectByValue(this.actionSel, item.action_id);
            this.valueInput.value = item.value;
        } else {
            this.idInput.value = '';
            this.ruleInput.value = this.parentRule;
            selectByValue(this.actionSel, 0);
            this.valueInput.value = '';
        }
    }

    /**
     * Set up fields of form for specified item
     * @param {*} item - if set to null create mode is assumed, if set to object then update mode
     */
    setParentRule(ruleId) {
        const rule = parseInt(ruleId, 10);
        if (!rule) {
            throw new Error(`Invalid rule: ${ruleId}`);
        }

        this.parentRule = ruleId;
        this.requestList();
    }

    /**
     * Request list of items from API
     */
    requestList() {
        const options = {
            full: true,
            rule: this.parentRule,
        };

        show(this.itemsListElem, false);
        ajax.get({
            url: `${baseURL}api/${this.apiController}/list?${urlJoin(options)}`,
            callback: this.onListResult.bind(this),
        });
    }

    /**
     * Return name of specified action
     * @param {number} actionId - identifier of item
     */
    getActionName(actionId) {
        const action = this.actionTypes.getItem(actionId);
        if (!action) {
            return null;
        }

        return action.name;
    }

    /**
     * Render list element for specified item
     * @param {object} item - item object
     */
    renderItem(item) {
        if (!item) {
            return null;
        }

        let actionName = this.getActionName(item.action_id);
        if (!actionName) {
            actionName = item.action_id;
        }

        return ce('tr', {}, [
            ce('td', { textContent: item.id }),
            ce('td', { textContent: item.user_id }),
            ce('td', { textContent: item.rule_id }),
            ce('td', { textContent: actionName }),
            ce('td', { textContent: item.value }),
        ]);
    }
}
