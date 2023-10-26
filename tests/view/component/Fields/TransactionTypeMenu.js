import { assert } from '@jezvejs/assert';
import { LinkMenu } from 'jezvejs-test';

export class TransactionTypeMenu extends LinkMenu {
    getItemValue(item) {
        assert(item, 'Invalid item');

        return parseInt(item.value, 10);
    }
}
