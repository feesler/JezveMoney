import { TestComponent } from 'jezve-test';
import { ImportConditionItem } from './ImportConditionItem.js';
import { asyncMap } from '../../../common.js';
import { queryAll } from '../../../env.js';

export class ImportRuleItemConditions extends TestComponent {
    async parseContent() {
        if (!this.elem) {
            throw new Error('Invalid import rule item');
        }

        const res = {
            items: await asyncMap(
                await queryAll(this.elem, '.cond-item'),
                async (elem) => ImportConditionItem.create(this, elem),
            ),
        };

        return res;
    }
}
