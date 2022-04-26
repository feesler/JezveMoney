import { TestComponent } from 'jezve-test';
import {
    queryAll,
    prop,
    hasClass,
    click,
} from '../../env.js';

export class Paginator extends TestComponent {
    async parseContent() {
        const res = {};

        res.items = [];
        res.activeItem = null;

        if (!await hasClass(this.elem, 'paginator')) {
            throw new Error('Unexpected stucture of paginator control');
        }

        let ellipsisBefore = false;
        let prevPageItem = null;
        const elems = await queryAll(this.elem, '.paginator-item');
        if (elems.length === 1) {
            throw new Error('Single item paginator control');
        }

        for (const itemElem of elems) {
            const isArrow = await hasClass(this.elem, 'paginator-arrow');
            if (isArrow) {
                continue;
            }

            /*
            Check ellipsis is between two page number items:
            - ellipsis can't be first item
            - ellipsis can't follow after ellipsis
            */
            const text = await prop(itemElem, 'textContent');
            if (text === '...') {
                if (!res.items.length || ellipsisBefore || !prevPageItem) {
                    throw new Error('Unexpected placement of paginator ellipsis');
                }

                ellipsisBefore = true;
                continue;
            }

            const item = { elem: itemElem };
            item.isActive = await hasClass(itemElem, 'paginator-item__active');

            const tagName = await prop(itemElem, 'tagName');
            if (tagName === 'A') {
                item.linkElem = itemElem;
                item.link = await prop(itemElem, 'href');
            }

            item.title = await prop(itemElem, 'textContent');
            item.num = parseInt(item.title, 10);
            if (!item.title || Number.isNaN(item.num) || item.num < 1) {
                throw new Error('Unexpected title of paginator item');
            }

            /*
            Check correctnes of order:
            - First item must always be 1
            - Following items must be greater than previous
            - Sequential items must increase only by 1
             */
            if (
                (!res.items.length && item.num !== 1)
                || (res.items.length && (!prevPageItem || item.num <= prevPageItem.num))
                || (res.items.length && !ellipsisBefore && item.num !== prevPageItem.num + 1)
            ) {
                throw new Error('Unexpected order of paginator item');
            }

            if (item.isActive) {
                if (res.activeItem) {
                    throw new Error('More than one active paginator item');
                }

                res.activeItem = item;
                res.active = item.num;
            }

            item.ind = res.items.length;
            res.items.push(item);
            prevPageItem = item;
            ellipsisBefore = false;
        }

        // Check ellipsis is not the last item
        if (ellipsisBefore) {
            throw new Error('Unexpected placement of paginator ellipsis');
        }

        // Check active item present is paginator is visible(2 or more pages)
        if (res.items.length && !res.activeItem) {
            throw new Error('Active paginator item not found');
        }

        if (res.items.length) {
            res.pages = res.items[res.items.length - 1].num;
        } else {
            res.pages = 1;
            res.active = 1;
        }

        return res;
    }

    getPages() {
        return this.content.pages;
    }

    isFirstPage() {
        return (!this.content.activeItem || this.content.activeItem.ind === 0);
    }

    isLastPage() {
        return (
            !this.content.activeItem
            || this.content.activeItem.ind === this.content.items.length - 1
        );
    }

    async goToFirstPage() {
        if (!this.content.items.length) {
            return;
        }

        const item = this.content.items[0];
        if (item.isActive) {
            return;
        }

        await click(item.linkElem);
    }

    async goToPrevPage() {
        if (this.isFirstPage()) {
            return;
        }

        const item = this.content.items[this.content.activeItem.ind - 1];
        if (item.isActive) {
            return;
        }

        await click(item.linkElem);
    }

    async goToNextPage() {
        if (this.isLastPage()) {
            return;
        }

        const item = this.content.items[this.content.activeItem.ind + 1];
        if (item.isActive) {
            return;
        }

        await click(item.linkElem);
    }

    async goToLastPage() {
        if (!this.content.items.length) {
            return;
        }

        const item = this.content.items[this.content.items.length - 1];
        if (item.isActive) {
            return;
        }

        await click(item.linkElem);
    }
}
