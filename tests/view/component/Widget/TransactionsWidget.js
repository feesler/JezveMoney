import {
    query,
    assert,
    evaluate,
    navigation,
    wait,
} from 'jezve-test';
import { PopupMenu } from 'jezvejs-test';
import { Widget } from './Widget.js';
import { TransactionList } from '../TransactionList/TransactionList.js';

export class TransactionsWidget extends Widget {
    get contextMenu() {
        return this.content.contextMenu;
    }

    async parseContent() {
        const res = await super.parseContent();

        res.transList = await TransactionList.create(this, await query(this.elem, '.trans-list'));
        assert(res.transList, 'Invalid transactions widget');

        // Context menu
        res.contextMenu = await PopupMenu.create(this, await query('#contextMenu'));
        if (res.contextMenu?.elem) {
            res.contextMenu.content.itemId = await evaluate((menuEl) => {
                const contextParent = menuEl?.closest('.trans-item');
                return (contextParent)
                    ? parseInt(contextParent.dataset.id, 10)
                    : null;
            }, res.contextMenu.elem);
        }

        return res;
    }

    get transList() {
        return this.content.transList;
    }

    checkValidIndex(index) {
        assert.arrayIndex(this.content.transList.items, index, `Invalid transaction index: ${index}`);
    }

    async openContextMenu(index) {
        this.checkValidIndex(index);

        const item = this.content.transList.items[index];
        await this.performAction(async () => {
            await item.clickMenu();
            return wait('[data-id="ctxDeleteBtn"]', { visible: true });
        });

        return true;
    }

    async updateByIndex(index) {
        await this.openContextMenu(index);

        return navigation(() => this.contextMenu.select('ctxUpdateBtn'));
    }

    async duplicateByIndex(index) {
        await this.openContextMenu(index);

        return navigation(() => this.contextMenu.select('ctxDuplicateBtn'));
    }

    async setCategoryByIndex(index) {
        await this.openContextMenu(index);

        return this.performAction(() => this.contextMenu.select('ctxSetCategoryBtn'));
    }

    async deleteByIndex(index) {
        await this.openContextMenu(index);

        return this.performAction(() => this.contextMenu.select('ctxDeleteBtn'));
    }
}
