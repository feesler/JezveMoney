import {
    createElement,
    isFunction,
    show,
    copyObject,
    addChilds,
    removeChilds,
    Component,
} from 'jezvejs';
import { Collapsible } from 'jezvejs/Collapsible';
import { PopupMenuButton } from 'jezvejs/PopupMenu';
import { ImportRule } from '../../../../js/model/ImportRule.js';
import { ImportConditionList } from '../../../../js/model/ImportConditionList.js';
import { ImportActionList } from '../../../../js/model/ImportActionList.js';
import { ImportConditionItem } from '../ConditionItem/ImportConditionItem.js';
import { ImportActionItem } from '../ActionItem/ImportActionItem.js';
import { ToggleButton } from '../../../ToggleButton/ToggleButton.js';
import './style.scss';

/** Strings */
const TITLE_CONDITIONS = 'Conditions';
const TITLE_ACTIONS = 'Actions';
const TITLE_NO_ACTIONS = 'No actions.';
const TITLE_NO_CONDITIONS = 'No conditions';

/**
 * ImportRuleItem component
 * @param {Object} props
 */
export class ImportRuleItem extends Component {
    constructor(...args) {
        super(...args);

        if (!this.props?.data) {
            throw new Error('Invalid props');
        }
        if (!(this.props.data instanceof ImportRule)) {
            throw new Error('Invalid rule item');
        }

        this.init();
        this.setData(this.props.data);
    }

    get id() {
        return this.state.ruleId;
    }

    /** Main structure initialization */
    init() {
        this.propertyLabel = createElement('span', { props: { className: 'rule-item__property' } });
        this.operatorLabel = createElement('span', { props: { className: 'rule-item__operator' } });
        this.valueLabel = createElement('span', { props: { className: 'rule-item__value' } });
        this.infoLabel = createElement('span', { props: { className: 'rule-item__info' } });

        // Toggle expand/collapse
        this.toggleExtBtn = ToggleButton.create({
            onClick: (e) => this.onToggle(e),
        });

        this.topRow = window.app.createContainer('rule-item__main-top', [
            this.propertyLabel,
            this.operatorLabel,
            this.valueLabel,
        ]);
        this.bottomRow = window.app.createContainer('rule-item__main-bottom', [
            this.infoLabel,
        ]);

        this.infoContainer = window.app.createContainer('rule-item__main-info', [
            this.topRow,
            this.bottomRow,
        ]);

        this.menuContainer = PopupMenuButton.create();
        this.controls = window.app.createContainer('rule-item__main-controls', [
            this.menuContainer.elem,
            this.toggleExtBtn.elem,
        ]);

        this.conditionsHeader = createElement('label', {
            props: { className: 'rule-item__header', textContent: TITLE_CONDITIONS },
        });
        this.conditionsContainer = window.app.createContainer('rule-item__conditions', []);

        this.actionsHeader = createElement('label', {
            props: { className: 'rule-item__header', textContent: TITLE_ACTIONS },
        });
        this.actionsContainer = window.app.createContainer('rule-item__actions', []);

        this.collapse = Collapsible.create({
            toggleOnClick: false,
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

    /** Toggle expand/collapse button 'click' event handler */
    onToggle() {
        this.collapse.toggle();
    }

    /** Update button 'click' event handler */
    onUpdate(e) {
        e.stopPropagation();

        if (!this.state.ruleId || !isFunction(this.props.onUpdate)) {
            return;
        }

        this.props.onUpdate(this.state.ruleId);
    }

    /** Delete button 'click' event handler */
    onDelete(e) {
        e.stopPropagation();

        if (!this.state.ruleId || !isFunction(this.props.onRemove)) {
            return;
        }

        this.props.onRemove(this.state.ruleId);
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
            (data) => ImportConditionItem.create({ data }),
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

            const { isFieldValue } = firstCondition.state;
            this.valueLabel.classList.toggle('rule-item__value-property', !!isFieldValue);
            this.valueLabel.classList.toggle('rule-item__value', !isFieldValue);

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
                data: item,
            })),
        );
        show(this.actionsHeader, (actionItems.length > 0));
        this.setListContainerData(this.actionsContainer, actionItems);
    }
}
