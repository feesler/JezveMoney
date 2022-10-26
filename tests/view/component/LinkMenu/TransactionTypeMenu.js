import { assert } from 'jezve-test';
import { LinkMenu } from './LinkMenu.js';

export class TransactionTypeMenu extends LinkMenu {
    getItemValue(item) {
        assert(item, 'Invalid item');

        return parseInt(item.value, 10);
    }
}
