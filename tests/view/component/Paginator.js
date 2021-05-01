import { TestComponent } from 'jezve-test';

export class Paginator extends TestComponent {
    async parse() {
        this.items = [];
        this.activeItem = null;

        if (!await this.hasClass(this.elem, 'paginator')) {
            throw new Error('Unexpected stucture of paginator control');
        }

        let ellipsisBefore = false;
        let prevPageItem = null;
        const elems = await this.queryAll(this.elem, ':scope > span');
        if (elems.length === 1) {
            throw new Error('Single item paginator control');
        }

        for (const itemElem of elems) {
            const childElem = await this.query(itemElem, ':scope > *');

            // Check element with no child contain ellipsis and skip
            if (!childElem) {
                if (await this.prop(itemElem, 'textContent') !== '...') {
                    throw new Error('Unexpected paginator item');
                }

                /**
                Check ellipsis is between two page number items:
                - ellipsis can't be first item
                - ellipsis can't follow after ellipsis
                 */
                if (!this.items.length || ellipsisBefore || !prevPageItem) {
                    throw new Error('Unexpected placement of paginator ellipsis');
                }

                ellipsisBefore = true;
                continue;
            }

            const item = { elem: itemElem };

            const tagName = await this.prop(childElem, 'tagName');
            if (tagName === 'A') {
                item.linkElem = childElem;
                item.link = await this.prop(childElem, 'href');
                item.isActive = false;
            } else if (tagName === 'B') {
                item.isActive = true;
            } else {
                throw new Error('Unexpected stucture of paginator control');
            }

            item.title = await this.prop(childElem, 'textContent');
            item.num = parseInt(item.title, 10);
            if (!item.title || Number.isNaN(item.num) || item.num < 1) {
                throw new Error('Unexpected title of paginator item');
            }

            /**
            Check correctnes of order:
            - First item must always be 1
            - Following items must be greater than previous
            - Sequential items must increase only by 1
             */
            if (
                (!this.items.length && item.num !== 1)
                || (this.items.length && (!prevPageItem || item.num <= prevPageItem.num))
                || (this.items.length && !ellipsisBefore && item.num !== prevPageItem.num + 1)
            ) {
                throw new Error('Unexpected order of paginator item');
            }

            if (item.isActive) {
                if (this.activeItem) {
                    throw new Error('More than one active paginator item');
                }

                this.activeItem = item;
                this.active = item.num;
            }

            item.ind = this.items.length;
            this.items.push(item);
            prevPageItem = item;
            ellipsisBefore = false;
        }

        // Check ellipsis is not the last item
        if (ellipsisBefore) {
            throw new Error('Unexpected placement of paginator ellipsis');
        }

        // Check active item present is paginator is visible(2 or more pages)
        if (this.items.length && !this.activeItem) {
            throw new Error('Active paginator item not found');
        }

        if (this.items.length) {
            this.pages = this.items[this.items.length - 1].num;
        } else {
            this.pages = 1;
            this.active = 1;
        }
    }

    getPages() {
        return this.pages;
    }

    isFirstPage() {
        return (!this.activeItem || this.activeItem.ind === 0);
    }

    isLastPage() {
        return (!this.activeItem || this.activeItem.ind === this.items.length - 1);
    }

    async goToFirstPage() {
        if (!this.items.length) {
            return;
        }

        const item = this.items[0];
        if (item.isActive) {
            return;
        }

        await this.click(item.linkElem);
    }

    async goToPrevPage() {
        if (this.isFirstPage()) {
            return;
        }

        const item = this.items[this.activeItem.ind - 1];
        if (item.isActive) {
            return;
        }

        await this.click(item.linkElem);
    }

    async goToNextPage() {
        if (this.isLastPage()) {
            return;
        }

        const item = this.items[this.activeItem.ind + 1];
        if (item.isActive) {
            return;
        }

        await this.click(item.linkElem);
    }

    async goToLastPage() {
        if (!this.items.length) {
            return;
        }

        const item = this.items[this.items.length - 1];
        if (item.isActive) {
            return;
        }

        await this.click(item.linkElem);
    }
}
