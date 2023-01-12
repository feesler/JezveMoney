import {
    query,
    assert,
    closest,
    prop,
    asArray,
    asyncMap,
    navigation,
} from 'jezve-test';
import { IconButton } from 'jezvejs-test';
import { Widget } from './Widget.js';
import { TransactionList } from '../TransactionList/TransactionList.js';

const contextMenuItems = [
    'ctxUpdateBtn', 'ctxSetCategoryBtn', 'ctxDeleteBtn',
];

export class TransactionsWidget extends Widget {
    async parseContent() {
        const res = await super.parseContent();

        res.transList = await TransactionList.create(this, await query(this.elem, '.trans-list'));
        assert(res.transList, 'Invalid transactions widget');

        // Context menu
        res.contextMenu = { elem: await query('#contextMenu') };
        const contextParent = await closest(res.contextMenu.elem, '.trans-item');
        if (contextParent) {
            const itemId = await prop(contextParent, 'dataset.id');
            res.contextMenu.itemId = parseInt(itemId, 10);
            assert(res.contextMenu.itemId, 'Invalid item');

            await this.parseMenuItems(res, contextMenuItems);
        }

        return res;
    }

    get transList() {
        return this.content.transList;
    }

    async parseMenuItems(cont, ids) {
        const itemIds = asArray(ids);
        if (!itemIds.length) {
            return cont;
        }

        const res = cont;
        await asyncMap(itemIds, async (id) => {
            res[id] = await IconButton.create(this, await query(`#${id}`));
            assert(res[id], `Menu item '${id}' not found`);
            return res[id];
        });

        return res;
    }

    checkValidIndex(index) {
        assert.arrayIndex(this.content.transList.items, index, `Invalid transaction index: ${index}`);
    }

    async openContextMenu(index) {
        this.checkValidIndex(index);

        const item = this.content.transList.items[index];
        await this.performAction(() => item.clickMenu());
        assert(this.content.contextMenu.visible, 'Context menu not visible');

        return true;
    }

    async updateByIndex(index) {
        await this.openContextMenu(index);

        return navigation(() => this.content.ctxUpdateBtn.click());
    }

    async setCategoryByIndex(index) {
        await this.openContextMenu(index);

        return this.performAction(() => this.content.ctxSetCategoryBtn.click());
    }

    async deleteByIndex(index) {
        await this.openContextMenu(index);

        return this.performAction(() => this.content.ctxDeleteBtn.click());
    }
}
