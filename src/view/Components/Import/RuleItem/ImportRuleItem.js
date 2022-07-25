import {
    ce,
    isFunction,
    show,
    copyObject,
    addChilds,
    removeChilds,
    Component,
    Collapsible,
} from 'jezvejs';
import { ImportRule } from '../../../js/model/ImportRule.js';
import { ImportConditionList } from '../../../js/model/ImportConditionList.js';
import { ImportActionList } from '../../../js/model/ImportActionList.js';
import { ImportConditionItem } from '../ConditionItem/ImportConditionItem.js';
import { ImportActionItem } from '../ActionItem/ImportActionItem.js';
import { createContainer, createIcon } from '../../../js/app.js';
import './style.css';

/** Strings */
const TITLE_CONDITIONS = 'Conditions';
const TITLE_ACTIONS = 'Actions';
const TITLE_NO_ACTIONS = 'No actions.';
const TITLE_NO_CONDITIONS = 'No conditions';

/**
 * ImportRuleItem component constructor
 * @param {Object} props
 */
export class ImportRuleItem extends Component {
    constructor(...args) {
        super(...args);

        if (
            !this.parent
            || !this.props
            || !this.props.data
        ) {
            throw new Error('Invalid props');
        }

        this.submitHandler = this.props.submit;
        this.cancelHandler = this.props.cancel;
        this.updateHandler = this.props.update;
        this.deleteHandler = this.props.remove;

        if (!(this.props.data instanceof ImportRule)) {
            throw new Error('Invalid rule item');
        }

        this.init();
        this.setData(this.props.data);
    }

    /** Shortcut for ImportRuleItem constructor */
    static create(props) {
        return new ImportRuleItem(props);
    }

    /** Main structure initialization */
    init() {
        this.propertyLabel = ce('span', { className: 'rule-item__property' });
        this.operatorLabel = ce('span', { className: 'rule-item__operator' });
        this.valueLabel = ce('span', { className: 'rule-item__value' });
        this.infoLabel = ce('span', { className: 'rule-item__info' });

        // Delete button
        this.updateBtn = ce(
            'button',
            { className: 'btn icon-btn update-btn', type: 'button' },
            createIcon('update'),
            { click: (e) => this.onUpdate(e) },
        );
        // Delete button
        this.delBtn = ce(
            'button',
            { className: 'btn icon-btn delete-btn', type: 'button' },
            createIcon('del'),
            { click: (e) => this.onDelete(e) },
        );
        // Toggle expand/collapse
        this.toggleExtBtn = ce(
            'button',
            { className: 'btn icon-btn toggle-btn', type: 'button' },
            createIcon('toggle-ext'),
        );

        this.topRow = createContainer('rule-item__main-top', [
            this.propertyLabel,
            this.operatorLabel,
            this.valueLabel,
        ]);
        this.bottomRow = createContainer('rule-item__main-bottom', [
            this.infoLabel,
        ]);

        this.infoContainer = createContainer('rule-item__main-info', [
            this.topRow,
            this.bottomRow,
        ]);

        this.controls = createContainer('rule-item__main-controls', [
            this.updateBtn,
            this.delBtn,
            this.toggleExtBtn,
        ]);

        this.conditionsHeader = ce('label', { className: 'rule-item__header', textContent: TITLE_CONDITIONS });
        this.conditionsContainer = createContainer('rule-item__conditions', []);

        this.actionsHeader = ce('label', { className: 'rule-item__header', textContent: TITLE_ACTIONS });
        this.actionsContainer = createContainer('rule-item__actions', []);

        this.collapse = new Collapsible({
            className: 'rule-item',
            header: [this.infoContainer, this.controls],
            content: [
                this.conditionsHeader,
                this.conditionsContainer,
                this.actionsHeader,
                this.actionsContainer,
            ],
        });
        this.elem = this.collapse.elem;
    }

    /** Set main state of component */
    setData(data) {
        if (!data) {
            throw new Error('Invalid data');
        }

        this.state = {
            ruleId: data.id,
            conditions: data.conditions,
            actions: data.actions,
        };

        this.render(this.state);
    }

    /** Return import rule object */
    getData() {
        const res = {
            flags: 0,
        };

        if (this.state.ruleId) {
            res.id = this.state.ruleId;
        }

        res.actions = copyObject(this.state.actions);
        res.conditions = copyObject(this.state.conditions);

        return res;
    }

    /** Update button 'click' event handler */
    onUpdate(e) {
        e.stopPropagation();

        if (!this.state.ruleId
            || !isFunction(this.updateHandler)) {
            return;
        }

        this.updateHandler(this.state.ruleId);
    }

    /** Delete button 'click' event handler */
    onDelete(e) {
        e.stopPropagation();

        if (!this.state.ruleId
            || !isFunction(this.deleteHandler)) {
            return;
        }

        this.deleteHandler(this.state.ruleId);
    }

    /** Set data for list container */
    setListContainerData(container, data) {
        if (!container) {
            throw new Error('Invalid list container');
        }

        removeChilds(container);
        const isValid = (Array.isArray(data) && data.length > 0);
        if (isValid) {
            addChilds(container, data.map((item) => item.elem));
        }

        show(container, isValid);
    }

    /** Render component state */
    render(state) {
        if (!state
            || !(state.actions instanceof ImportActionList)
            || !(state.conditions instanceof ImportConditionList)) {
            throw new Error('Invalid state');
        }

        if (state.ruleId) {
            this.elem.setAttribute('data-id', state.ruleId);
        }

        // Render conditions
        const conditionItems = state.conditions.map(
            (item) => (new ImportConditionItem({
                parent: this,
                data: item,
            })),
        );
        show(this.conditionsHeader, (conditionItems.length > 0));
        this.setListContainerData(this.conditionsContainer, conditionItems);

        show(this.operatorLabel, (conditionItems.length > 0));
        show(this.valueLabel, (conditionItems.length > 0));

        const actionsTitle = (state.actions.length > 0)
            ? `${state.actions.length} action(s).`
            : TITLE_NO_ACTIONS;

        if (conditionItems.length > 0) {
            const firstCondition = conditionItems[0];

            this.propertyLabel.textContent = firstCondition.propertyLabel.textContent;
            this.operatorLabel.textContent = firstCondition.operatorLabel.textContent;

            if (firstCondition.state.isFieldValue) {
                this.valueLabel.classList.add('rule-item__value-property');
                this.valueLabel.classList.remove('rule-item__value');
            } else {
                this.valueLabel.classList.remove('rule-item__value-property');
                this.valueLabel.classList.add('rule-item__value');
            }

            this.valueLabel.textContent = firstCondition.valueLabel.textContent;
        } else {
            this.propertyLabel.textContent = TITLE_NO_CONDITIONS;
        }

        if (conditionItems.length > 1) {
            const conditionsTitle = `${conditionItems.length - 1} more condition(s).`;

            this.infoLabel.textContent = `${conditionsTitle} ${actionsTitle}`;
        } else {
            this.infoLabel.textContent = actionsTitle;
        }

        // Render actions
        const actionItems = state.actions.map(
            (item) => (new ImportActionItem({
                parent: this,
                data: item,
            })),
        );
        show(this.actionsHeader, (actionItems.length > 0));
        this.setListContainerData(this.actionsContainer, actionItems);
    }
}
