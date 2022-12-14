import {
    TestComponent,
    assert,
    query,
    hasClass,
    click,
    evaluate,
} from 'jezve-test';

export class CategoryItem extends TestComponent {
    static render(category) {
        assert(category, 'Invalid category');

        return {
            title: category.name,
            isChild: (category.parent_id !== 0),
        };
    }

    async parseContent() {
        const validClass = await hasClass(this.elem, 'category-item');
        assert(validClass, 'Invalid category item element');

        const titleElem = await query(this.elem, '.category-item__title');
        assert(titleElem, 'Title element not found');

        const res = await evaluate((elem, titleEl) => ({
            id: parseInt(elem.dataset.id, 10),
            title: titleEl.textContent,
            selected: elem.classList.contains('category-item_selected'),
            isChild: elem.classList.contains('category-item_child'),
        }), this.elem, titleElem);

        res.menuBtn = await query(this.elem, '.popup-menu-btn');

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
