import { AppComponent } from '../AppComponent.js';
import { ImportActionItem } from './ImportActionItem.js';
import { asyncMap } from '../../../common.js';
import { queryAll } from '../../../env.js';

export class ImportRuleItemActions extends AppComponent {
    async parseContent() {
        if (!this.elem) {
            throw new Error('Invalid import rule item');
        }

        const res = {
            items: await asyncMap(
                await queryAll(this.elem, '.action-item'),
                async (elem) => ImportActionItem.create(this, elem),
            ),
        };

        return res;
    }
}
