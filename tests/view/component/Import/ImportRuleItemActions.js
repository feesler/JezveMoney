import {
    TestComponent,
    queryAll,
    assert,
    asyncMap,
} from 'jezve-test';
import { ImportActionItem } from './ImportActionItem.js';

export class ImportRuleItemActions extends TestComponent {
    async parseContent() {
        assert(this.elem, 'Invalid import rule item');

        return {
            items: await asyncMap(
                await queryAll(this.elem, '.action-item'),
                (elem) => ImportActionItem.create(this, elem),
            ),
        };
    }
}
