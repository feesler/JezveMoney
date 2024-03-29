import { ListModel } from './ListModel.js';

/**
 * Sortable list model class
 */
export class SortableListModel extends ListModel {
    create(data) {
        const item = data;
        item.pos = 0;

        const ind = super.create(item);
        const newItem = this[ind];
        const expPos = this.getExpectedPos(newItem);
        if (!this.updatePos(newItem.id, expPos)) {
            return -1;
        }

        this.defaultSort();

        return this.getIndexById(newItem.id);
    }

    setPos(id, pos) {
        if (!this.updatePos(id, pos)) {
            return false;
        }

        this.defaultSort();

        return true;
    }

    defaultSort() {
    }

    getExpectedPos() {
        const pos = this.getLastestPos();
        return pos + 1;
    }

    getLastestPos() {
        return this.reduce((r, item) => Math.max(r, (item.pos) ? item.pos : 0), 0);
    }

    isMoveUpAllowed() {
        return true;
    }

    isMoveDownAllowed() {
        return true;
    }

    updatePos(itemId, pos) {
        const index = this.getIndexById(itemId);
        if (index === -1) {
            return false;
        }
        const movingItem = this[index];
        if (!movingItem || !pos) {
            return false;
        }

        const oldPos = movingItem.pos;
        if (oldPos === pos) {
            return true;
        }

        if (this.find((item) => item.pos === pos)) {
            for (const item of this) {
                if (oldPos === 0) { // insert with specified position
                    if (item.pos >= pos) {
                        if (!this.isMoveUpAllowed(movingItem, item)) {
                            return false;
                        }

                        item.pos += 1;
                    }
                } else if (pos < oldPos) { // moving up
                    if (item.pos >= pos && item.pos < oldPos) {
                        if (!this.isMoveUpAllowed(movingItem, item)) {
                            return false;
                        }

                        item.pos += 1;
                    }
                } else if (pos > oldPos) { // moving down
                    if (item.pos > oldPos && item.pos <= pos) {
                        if (!this.isMoveDownAllowed(movingItem, item)) {
                            return false;
                        }

                        item.pos -= 1;
                    }
                }
            }
        }

        movingItem.pos = pos;

        return true;
    }
}
