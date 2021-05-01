import { TestComponent, copyObject } from 'jezve-test';
import { ImportConditionItem } from './importconditionitem.js';
import { ImportActionItem } from './importactionitem.js';
import { asyncMap } from '../../common.js';

export class ImportRuleItem extends TestComponent {
    constructor(parent, elem, mainAccount) {
        super(parent, elem);

        this.mainAccount = mainAccount;

        this.model = {};
    }

    async parse() {
        this.ruleId = await this.prop(this.elem, 'dataset.id');

        this.propertyElem = await this.query(this.elem, '.rule-item__property');
        this.operatorElem = await this.query(this.elem, '.rule-item__operator');
        this.valueElem = await this.query(this.elem, '.rule-item__value');
        if (!this.valueElem) {
            this.valueElem = await this.query(this.elem, '.rule-item__value-property');
        }
        this.infoElem = await this.query(this.elem, '.rule-item__info');

        this.updateBtn = await this.query(this.elem, '.update-btn');
        this.deleteBtn = await this.query(this.elem, '.delete-btn');
        this.toggleBtn = await this.query(this.elem, '.toggle-btn');

        this.conditions = { elem: await this.query(this.elem, '.rule-item__conditions') };
        this.actions = { elem: await this.query(this.elem, '.rule-item__actions') };
        if (
            !this.propertyElem
            || !this.operatorElem
            || !this.valueElem
            || !this.infoElem
            || !this.updateBtn
            || !this.deleteBtn
            || !this.toggleBtn
            || !this.conditions.elem
            || !this.actions.elem
        ) {
            throw new Error('Invalid structure of import item');
        }

        this.conditions.items = await asyncMap(
            await this.queryAll(this.conditions.elem, '.cond-item'),
            async (elem) => ImportConditionItem.create(this, elem),
        );

        this.actions.items = await asyncMap(
            await this.queryAll(this.elem, '.action-item'),
            async (elem) => ImportActionItem.create(this, elem),
        );

        this.model = this.buildModel(this);
    }

    buildModel(cont) {
        const res = {
            id: parseInt(cont.ruleId, 10),
            conditions: cont.conditions.items.map(
                (item) => copyObject(item.model),
            ),
            actions: cont.actions.items.map(
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
        return this.click(this.toggleBtn);
    }

    async clickUpdate() {
        return this.click(this.updateBtn);
    }

    async clickDelete() {
        return this.click(this.deleteBtn);
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
