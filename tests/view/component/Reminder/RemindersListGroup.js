import {
    TestComponent,
    evaluate,
} from 'jezve-test';

export class RemindersListGroup extends TestComponent {
    async parseContent() {
        const res = await evaluate((el) => {
            const titleEl = el.querySelector('.reminders-group__title');
            const group = {
                id: parseInt(el.dataset.id, 10),
                title: titleEl?.textContent,
            };

            return group;
        }, this.elem);

        return res;
    }

    get id() {
        return this.content.id;
    }
}
