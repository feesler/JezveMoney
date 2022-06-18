import { TestComponent, queryAll, assert } from 'jezve-test';
import { ImportActionItem } from './ImportActionItem.js';
import { asyncMap } from '../../../common.js';

export class ImportRuleItemActions extends TestComponent {
    async parseContent() {
        assert(this.elem, 'Invalid import rule item');

        const res = {
            items: await asyncMap(
                await queryAll(this.elem, '.action-item'),
                async (elem) => ImportActionItem.create(this, elem),
            ),
        };

        return res;
    }
}
