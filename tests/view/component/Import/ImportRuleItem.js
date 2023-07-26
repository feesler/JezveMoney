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
                collapsed: !el.classList.contains('collapsible__expanded'),
                propertyElem: textElemState(propertyEl),
                operatorElem: textElemState(operatorEl),
                valueElem: textElemState(valueEl),
                infoElem: textElemState(infoEl),
            };
        }, this.elem);

        res.menuBtn = { elem: await query(this.elem, '.menu-btn') };
        res.toggleBtn = { elem: await query(this.elem, '.toggle-btn') };

        assert(res.propertyElem.visible, 'Preperty element not visible');
        assert(res.operatorElem.visible, 'Operator element not visible');
        assert(res.valueElem.visible, 'Value element not visible');
        assert(res.menuBtn.elem, 'Menu button not found');
        assert(res.toggleBtn.elem, 'Toggle button not found');

        const conditionsElem = await query(this.elem, '.rule-item__conditions');
        res.conditions = await ImportRuleItemConditions.create(this, conditionsElem);

        const actionsElem = await query(this.elem, '.rule-item__actions');
        res.actions = await ImportRuleItemActions.create(this, actionsElem);

        return res;
    }

    buildModel(cont) {
        const res = {
            id: parseInt(cont.ruleId, 10),
            collapsed: cont.collapsed,
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
            collapsed: model.collapsed,
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
        assert(this.content.toggleBtn.elem, 'Toggle button not found');
        return click(this.content.toggleBtn.elem);
    }

    async openMenu() {
        assert(this.content.menuBtn.elem, 'Menu button not found');
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
            collapsed: item?.collapsed ?? true,
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
