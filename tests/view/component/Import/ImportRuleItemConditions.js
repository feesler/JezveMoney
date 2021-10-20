import { AppComponent } from '../AppComponent.js';
import { ImportConditionItem } from './ImportConditionItem.js';
import { asyncMap } from '../../../common.js';

export class ImportRuleItemConditions extends AppComponent {
    async parseContent() {
        if (!this.elem) {
            throw new Error('Invalid import rule item');
        }

        const res = {
            items: await asyncMap(
                await this.queryAll(this.elem, '.cond-item'),
                async (elem) => ImportConditionItem.create(this, elem),
            ),
        };

        return res;
    }
}
