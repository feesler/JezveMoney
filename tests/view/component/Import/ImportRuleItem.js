import {
    TestComponent,
    query,
    click,
    assert,
    evaluate,
} from 'jezve-test';
import { ImportRuleItemConditions } from './ImportRuleItemConditions.js';
import { ImportConditionItem } from './ImportConditionItem.js';
import { ImportRuleItemActions } from './ImportRuleItemActions.js';
import { ImportActionItem } from './ImportActionItem.js';
import { ImportCondition } from '../../../model/ImportCondition.js';
import { ImportAction } from '../../../model/ImportAction.js';

export class ImportRuleItem extends TestComponent {
    constructor(parent, elem, mainAccount) {
        super(parent, elem);

        this.mainAccount = mainAccount;

        this.model = {};
    }

    async parseContent() {
        assert(this.elem, 'Invalid import rule item');

        const res = await evaluate((el) => {
            const propertyEl = el.querySelector('.rule-item__property');
            const operatorEl = el.querySelector('.rule-item__operator');
            let valueEl = el.querySelector('.rule-item__value');
            if (!valueEl) {
                valueEl = el.querySelector('.rule-item__value-property');
            }
            const infoEl = el.querySelector('.rule-item__info');

            const textElemState = (elem) => ({
                value: elem?.textContent,
                visible: !!elem && !elem.hidden,
            });

            return {
                ruleId: el.dataset.id,
                propertyElem: textElemState(propertyEl),
                operatorElem: textElemState(operatorEl),
                valueElem: textElemState(valueEl),
                infoElem: textElemState(infoEl),
            };
        }, this.elem);

        res.menuBtn = { elem: await query(this.elem, '.menu-btn') };
        res.toggleBtn = { elem: await query(this.elem, '.toggle-btn') };

        const conditionsElem = await query(this.elem, '.rule-item__conditions');
        res.conditions = await ImportRuleItemConditions.create(this, conditionsElem);

        const actionsElem = await query(this.elem, '.rule-item__actions');
        res.actions = await ImportRuleItemActions.create(this, actionsElem);

        assert(
            res.propertyElem.visible
            && res.operatorElem.visible
            && res.valueElem.visible
            && res.infoElem.visible
            && res.menuBtn.elem
            && res.toggleBtn.elem
            && res.conditions.elem
            && res.actions.elem,
            'Invalid structure of import item',
        );

        return res;
    }

    buildModel(cont) {
        const res = {
            id: parseInt(cont.ruleId, 10),
            conditions: cont.conditions.content.items.map(
                (item) => structuredClone(item.model),
            ),
            actions: cont.actions.content.items.map(
                (item) => structuredClone(item.model),
            ),
        };

        return res;
    }

    static getExpectedState(model) {
        const res = {
            propertyElem: { visible: true },
            operatorElem: { visible: true },
            valueElem: { visible: true },
            infoElem: { visible: true },
            menuBtn: { visible: true },
            conditions: {},
            actions: {},
        };

        if (model.id) {
            res.ruleId = model.id.toString();
        }

        res.conditions.items = model.conditions.map(
            (item) => ImportConditionItem.getExpectedState(item),
        );

        res.actions.items = model.actions.map(
            (item) => ImportActionItem.getExpectedState(item),
        );

        return res;
    }

    async toggleExpand() {
        return click(this.content.toggleBtn.elem);
    }

    async openMenu() {
        await click(this.content.menuBtn.elem);
    }

    /**
     * Convert import rule object to expected state of component
     * @param {Object} item - import rule object
     */
    static render(item) {
        assert(item, 'Invalid parameters');

        const res = {
            ruleId: item.id.toString(),
            propertyElem: { visible: true },
            operatorElem: { visible: true },
            valueElem: { visible: true },
            infoElem: { visible: true },
            menuBtn: { visible: true },
            conditions: {},
            actions: {},
        };

        res.conditions.items = item.conditions.data.map((condData) => {
            const condition = new ImportCondition(condData);
            return ImportConditionItem.render(condition);
        });

        res.actions.items = item.actions.data.map((actData) => {
            const action = new ImportAction(actData);
            return ImportActionItem.render(action);
        });

        return res;
    }
}
