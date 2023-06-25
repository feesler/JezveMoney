import {
    TestComponent,
    assert,
    query,
    click,
    evaluate,
} from 'jezve-test';

/**
 * Categories list item test component
 */
export class CategoryItem extends TestComponent {
    static getExpectedState(category) {
        assert(category, 'Invalid category');

        const res = {
            id: category.id,
            title: category.name,
            isChild: (category.parent_id !== 0),
        };

        if (category.selected) {
            res.selected = true;
        }

        return res;
    }

    async parseContent() {
        assert(this.elem, 'Invalid category item element');

        const res = await evaluate((el) => {
            if (!el?.classList?.contains('category-item')) {
                return null;
            }

            const titleEl = el.querySelector('.category-item__title');

            return {
                id: parseInt(el.dataset.id, 10),
                title: titleEl?.textContent,
                selected: el.classList.contains('category-item_selected'),
                isChild: !!el.closest('.category-item__children'),
            };
        }, this.elem);
        assert(res, 'Invalid category item element');

        res.menuBtn = await query(this.elem, '.menu-btn');

        return res;
    }

    buildModel(cont) {
        return {
            id: cont.id,
            title: cont.title,
            selected: cont.selected,
            isChild: cont.isChild,
        };
    }

    async click() {
        return click(this.elem);
    }

    async clickMenu() {
        return click(this.content.menuBtn);
    }
}
