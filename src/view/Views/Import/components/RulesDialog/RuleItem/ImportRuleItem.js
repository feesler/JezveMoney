import {
    createElement,
    show,
    addChilds,
    removeChilds,
    getClassName,
} from 'jezvejs';

import { __ } from '../../../../../utils/utils.js';
import { App } from '../../../../../Application/App.js';

import { ImportRule } from '../../../../../Models/ImportRule.js';
import { ImportConditionList } from '../../../../../Models/ImportConditionList.js';
import { ImportActionList } from '../../../../../Models/ImportActionList.js';

import { ImportConditionItem } from '../ConditionItem/ImportConditionItem.js';
import { ImportActionItem } from '../ActionItem/ImportActionItem.js';
import { CollapsibleListItem } from '../../../../../Components/List/CollapsibleListItem/CollapsibleListItem.js';

import './ImportRuleItem.scss';

/* CSS classes */
const ITEM_CLASS = 'rule-item';

const defaultProps = {
    collapsed: true,
    showControls: true,
    toggleButton: true,
};

/**
 * ImportRuleItem component
 * @param {Object} props
 */
export class ImportRuleItem extends CollapsibleListItem {
    static get selector() {
        return `.${ITEM_CLASS}`;
    }

    constructor(props = {}) {
        if (!(props?.item instanceof ImportRule)) {
            throw new Error('Invalid rule item');
        }

        super({
            ...defaultProps,
            ...props,
            className: getClassName(ITEM_CLASS, props.className),
        });
    }

    /** Main structure initialization */
    init() {
        super.init();

        this.propertyLabel = createElement('span', { props: { className: 'rule-item__property' } });
        this.operatorLabel = createElement('span', { props: { className: 'rule-item__operator' } });
        this.valueLabel = createElement('span', { props: { className: 'rule-item__value' } });
        this.infoLabel = createElement('span', { props: { className: 'rule-item__info' } });

        // Toggle expand/collapse

        this.topRow = App.createContainer('rule-item__main-top', [
            this.propertyLabel,
            this.operatorLabel,
            this.valueLabel,
        ]);
        this.bottomRow = App.createContainer('rule-item__main-bottom', [
            this.infoLabel,
        ]);

        this.contentElem.append(
            this.topRow,
            this.bottomRow,
        );

        this.conditionsHeader = createElement('label', {
            props: { className: 'rule-item__header', textContent: __('import.conditions.title') },
        });
        this.conditionsContainer = App.createContainer('rule-item__conditions');

        this.actionsHeader = createElement('label', {
            props: { className: 'rule-item__header', textContent: __('import.actions.title') },
        });
        this.actionsContainer = App.createContainer('rule-item__actions');

        this.setCollapsibleContent([
            this.conditionsHeader,
            this.conditionsContainer,
            this.actionsHeader,
            this.actionsContainer,
        ]);
    }

    /** Toggle expand/collapse button 'click' event handler */
    onToggle() {
        this.toggle();
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
    render(state, prevState = {}) {
        super.render(state, prevState);

        const { item } = state;

        if (
            !(item.actions instanceof ImportActionList)
            || !(item.conditions instanceof ImportConditionList)
            || item.conditions.length === 0
            || item.actions.length === 0
        ) {
            throw new Error('Invalid state');
        }

        // Render conditions
        const conditionItems = item.conditions.map(
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

        const actionsTitle = __('import.rules.actionsInfo', item.actions.length);
        if (conditionItems.length > 1) {
            const conditionsTitle = __('import.rules.conditionsInfo', conditionItems.length - 1);
            this.infoLabel.textContent = `${conditionsTitle} ${actionsTitle}`;
        } else {
            this.infoLabel.textContent = actionsTitle;
        }

        // Render actions
        const actionItems = item.actions.map(
            (data) => ImportActionItem.create({ data }),
        );
        show(this.actionsHeader, (actionItems.length > 0));
        this.setListContainerData(this.actionsContainer, actionItems);
    }
}
