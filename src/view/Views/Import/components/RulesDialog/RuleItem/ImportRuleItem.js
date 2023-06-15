import {
    createElement,
    show,
    addChilds,
    removeChilds,
    Component,
} from 'jezvejs';
import { Collapsible } from 'jezvejs/Collapsible';
import { MenuButton } from 'jezvejs/MenuButton';

import { __ } from '../../../../../utils/utils.js';
import { App } from '../../../../../Application/App.js';
import { ImportRule } from '../../../../../Models/ImportRule.js';
import { ImportConditionList } from '../../../../../Models/ImportConditionList.js';
import { ImportActionList } from '../../../../../Models/ImportActionList.js';
import { ToggleButton } from '../../../../../Components/ToggleButton/ToggleButton.js';
import { ImportConditionItem } from '../ConditionItem/ImportConditionItem.js';
import { ImportActionItem } from '../ActionItem/ImportActionItem.js';
import './ImportRuleItem.scss';

/* CSS classes */
const ITEM_CLASS = 'rule-item';

/**
 * ImportRuleItem component
 * @param {Object} props
 */
export class ImportRuleItem extends Component {
    static get selector() {
        return `.${ITEM_CLASS}`;
    }

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

        this.topRow = App.createContainer('rule-item__main-top', [
            this.propertyLabel,
            this.operatorLabel,
            this.valueLabel,
        ]);
        this.bottomRow = App.createContainer('rule-item__main-bottom', [
            this.infoLabel,
        ]);

        this.infoContainer = App.createContainer('rule-item__main-info', [
            this.topRow,
            this.bottomRow,
        ]);

        this.menuButton = MenuButton.create();
        this.controls = App.createContainer('rule-item__main-controls', [
            this.menuButton.elem,
            this.toggleExtBtn.elem,
        ]);

        this.conditionsHeader = createElement('label', {
            props: { className: 'rule-item__header', textContent: __('IMPORT_CONDITIONS') },
        });
        this.conditionsContainer = App.createContainer('rule-item__conditions');

        this.actionsHeader = createElement('label', {
            props: { className: 'rule-item__header', textContent: __('IMPORT_ACTIONS') },
        });
        this.actionsContainer = App.createContainer('rule-item__actions');

        this.collapse = Collapsible.create({
            toggleOnClick: false,
            className: ITEM_CLASS,
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

        res.actions = structuredClone(this.state.actions);
        res.conditions = structuredClone(this.state.conditions);

        return res;
    }

    /** Toggle expand/collapse button 'click' event handler */
    onToggle() {
        this.collapse.toggle();
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
        if (
            !state
            || !(state.actions instanceof ImportActionList)
            || !(state.conditions instanceof ImportConditionList)
            || state.conditions.length === 0
            || state.actions.length === 0
        ) {
            throw new Error('Invalid state');
        }

        if (state.ruleId) {
            this.elem.setAttribute('data-id', state.ruleId);
        }

        // Render conditions
        const conditionItems = state.conditions.map(
            (data) => ImportConditionItem.create({ data }),
        );
        this.setListContainerData(this.conditionsContainer, conditionItems);

        const firstCondition = conditionItems[0];
        const { isFieldValue } = firstCondition.state;
        this.propertyLabel.textContent = firstCondition.propertyLabel.textContent;
        this.operatorLabel.textContent = firstCondition.operatorLabel.textContent;

        this.valueLabel.classList.toggle('rule-item__value-property', !!isFieldValue);
        this.valueLabel.classList.toggle('rule-item__value', !isFieldValue);
        this.valueLabel.textContent = firstCondition.valueLabel.textContent;

        const actionsTitle = __('IMPORT_RULE_INFO_ACTIONS', state.actions.length);
        if (conditionItems.length > 1) {
            const conditionsTitle = __('IMPORT_RULE_INFO_CONDITIONS', conditionItems.length - 1);
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
