import { copyObject } from 'jezvejs';
import { TestComponent } from 'jezve-test';
import { ImportRuleItemConditions } from './ImportRuleItemConditions.js';
import { ImportConditionItem } from './ImportConditionItem.js';
import { ImportRuleItemActions } from './ImportRuleItemActions.js';
import { ImportActionItem } from './ImportActionItem.js';
import { query, prop, click } from '../../../env.js';

export class ImportRuleItem extends TestComponent {
    constructor(parent, elem, mainAccount) {
        super(parent, elem);

        this.mainAccount = mainAccount;

        this.model = {};
    }

    async parseContent() {
        if (!this.elem) {
            throw new Error('Invalid import rule item');
        }

        const res = {
            ruleId: await prop(this.elem, 'dataset.id'),
            propertyElem: await query(this.elem, '.rule-item__property'),
            operatorElem: await query(this.elem, '.rule-item__operator'),
            valueElem: await query(this.elem, '.rule-item__value'),
            infoElem: await query(this.elem, '.rule-item__info'),
            updateBtn: await query(this.elem, '.update-btn'),
            deleteBtn: await query(this.elem, '.delete-btn'),
            toggleBtn: await query(this.elem, '.toggle-btn'),
        };

        if (!res.valueElem) {
            res.valueElem = await query(this.elem, '.rule-item__value-property');
        }

        const conditionsElem = await query(this.elem, '.rule-item__conditions');
        res.conditions = await ImportRuleItemConditions.create(this, conditionsElem);

        const actionsElem = await query(this.elem, '.rule-item__actions');
        res.actions = await ImportRuleItemActions.create(this, actionsElem);

        if (
            !res.propertyElem
            || !res.operatorElem
            || !res.valueElem
            || !res.infoElem
            || !res.updateBtn
            || !res.deleteBtn
            || !res.toggleBtn
            || !res.conditions.elem
            || !res.actions.elem
        ) {
            throw new Error('Invalid structure of import item');
        }

        return res;
    }

    buildModel(cont) {
        const res = {
            id: parseInt(cont.ruleId, 10),
            conditions: cont.conditions.content.items.map(
                (item) => copyObject(item.model),
            ),
            actions: cont.actions.content.items.map(
                (item) => copyObject(item.model),
            ),
        };

        return res;
    }

    static getExpectedState(model) {
        const res = {
            visibility: {
                propertyElem: true,
                operatorElem: true,
                valueElem: true,
                infoElem: true,
                updateBtn: true,
                deleteBtn: true,
            },
            values: {
                conditions: {},
                actions: {},
            },
        };

        if (model.id) {
            res.values.ruleId = model.id.toString();
        }

        res.values.conditions.items = model.conditions.map(
            (item) => ImportConditionItem.getExpectedState(item).values,
        );

        res.values.actions.items = model.actions.map(
            (item) => ImportActionItem.getExpectedState(item).values,
        );

        return res;
    }

    async toggleExpand() {
        return click(this.content.toggleBtn);
    }

    async clickUpdate() {
        return click(this.content.updateBtn);
    }

    async clickDelete() {
        return click(this.content.deleteBtn);
    }

    /**
     * Convert import rule object to expected state of component
     * @param {Object} item - import rule object
     * @param {AppState} state - application state
     */
    static render(item, state) {
        if (!item || !state) {
            throw new Error('Invalid parameters');
        }
    }
}
