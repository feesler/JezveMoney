import { SortableList } from './SortableList.js';
import { Category } from './Category.js';
import {
    SORT_BY_CREATEDATE_ASC,
    SORT_BY_CREATEDATE_DESC,
    SORT_BY_NAME_ASC,
    SORT_BY_NAME_DESC,
    SORT_MANUALLY,
} from '../common.js';

export class CategoryList extends SortableList {
    /**
     * Create list item from specified object
     * @param {Object} obj
     */
    createItem(obj) {
        return new Category(obj);
    }

    setPos(id, pos, parentId) {
        const category = this.getItem(id);
        if (!category || !pos) {
            return false;
        }

        const parent = this.getItem(parentId);
        if (
            (parentId !== 0 && !parent)
            || (parent && parent.type !== category.type)
        ) {
            return false;
        }

        if (!this.updatePos(id, pos)) {
            return false;
        }

        return true;
    }

    /** Returns array of ids of child categories */
    findByParent(id = 0) {
        const categoryId = parseInt(id, 10);
        return this.filter((item) => item.parent_id === categoryId);
    }

    /** Returns array of items with specified color */
    findByColor(color, parentId = 0) {
        const categoryId = parseInt(parentId, 10);
        return this.filter((item) => (item.color === color && item.parent_id === categoryId));
    }

    /** Search category with specified name */
    findByName(name, caseSens = false) {
        let lookupName;

        if (caseSens) {
            lookupName = name;
            return this.find((item) => item.name === lookupName);
        }

        lookupName = name.toLowerCase();
        return this.find((item) => item.name.toLowerCase() === lookupName);
    }

    /** Sort categories by parent */
    sortByParent() {
        const mainCategories = this.findByParent(0).sort((a, b) => a.id - b.id);
        this.data = mainCategories.flatMap((item) => {
            const children = this.findByParent(item.id).sort((a, b) => a.id - b.id);
            return [item, ...children];
        });
    }

    sortBy(sortMode) {
        if (sortMode === SORT_BY_CREATEDATE_ASC) {
            this.sortByCreateDateAsc();
        } else if (sortMode === SORT_BY_CREATEDATE_DESC) {
            this.sortByCreateDateDesc();
        } else if (sortMode === SORT_BY_NAME_ASC) {
            this.sortByNameAsc();
        } else if (sortMode === SORT_BY_NAME_DESC) {
            this.sortByNameDesc();
        } else if (sortMode === SORT_MANUALLY) {
            this.sortByPos();
        }
    }

    sortByPos() {
        this.data.sort((a, b) => a.pos - b.pos);
    }

    sortByNameAsc() {
        this.data.sort((a, b) => ((a.name > b.name) ? 1 : -1));
    }

    sortByNameDesc() {
        this.data.sort((a, b) => ((a.name < b.name) ? 1 : -1));
    }

    sortByCreateDateAsc() {
        this.data.sort((a, b) => a.id - b.id);
    }

    sortByCreateDateDesc() {
        this.data.sort((a, b) => b.id - a.id);
    }

    getUsedColors() {
        const res = [];
        this.forEach((item) => {
            if (!res.includes(item.color)) {
                res.push(item.color);
            }
        });

        return res;
    }

    getNextColor(availColors) {
        const usedColors = this.getUsedColors();
        const res = availColors.find((color) => !usedColors.includes(color));
        return res ?? null;
    }
}
