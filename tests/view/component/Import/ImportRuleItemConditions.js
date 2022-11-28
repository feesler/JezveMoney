import {
    TestComponent,
    queryAll,
    assert,
    asyncMap,
} from 'jezve-test';
import { ImportConditionItem } from './ImportConditionItem.js';

export class ImportRuleItemConditions extends TestComponent {
    async parseContent() {
        assert(this.elem, 'Invalid import rule item');

        return {
            items: await asyncMap(
                await queryAll(this.elem, '.cond-item'),
                (elem) => ImportConditionItem.create(this, elem),
            ),
        };
    }
}
