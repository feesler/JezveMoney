import { TestComponent, queryAll, assert } from 'jezve-test';
import { ImportConditionItem } from './ImportConditionItem.js';
import { asyncMap } from '../../../common.js';

export class ImportRuleItemConditions extends TestComponent {
    async parseContent() {
        assert(this.elem, 'Invalid import rule item');

        const res = {
            items: await asyncMap(
                await queryAll(this.elem, '.cond-item'),
                async (elem) => ImportConditionItem.create(this, elem),
            ),
        };

        return res;
    }
}
