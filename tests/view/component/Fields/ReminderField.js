import {
    TestComponent,
    assert,
    query,

    evaluate,
} from 'jezve-test';
import { Button } from 'jezvejs-test';
import { RemindersListItem } from '../Reminder/RemindersListItem.js';

export class ReminderField extends TestComponent {
    async parseContent() {
        const res = await evaluate((el) => {
            const titleEl = el.querySelector('.field__title');

            return {
                label: titleEl?.querySelector(':scope > span')?.textContent,
            };
        }, this.elem);

        const closeBtnEl = await query(this.elem, '.field__title .close-btn');
        res.closeBtn = await Button.create(this.parent, closeBtnEl);

        const reminderItemEl = await query(this.elem, '.field__content .reminder-item');
        res.reminderItem = await RemindersListItem.create(this.parent, reminderItemEl);

        res.value = {
            reminder_id: (res.reminderItem?.id ?? 0).toString(),
            schedule_id: (res.reminderItem?.scheduleId ?? 0).toString(),
            reminder_date: (res.reminderItem?.reminderDate ?? 0).toString(),
        };

        const selectBtnEl = await query(this.elem, '.field__content .dashed-btn');
        res.selectBtn = await Button.create(this.parent, selectBtnEl);

        return res;
    }

    get value() {
        return structuredClone(this.content.value);
    }

    get closeBtn() {
        return this.content.closeBtn;
    }

    get selectBtn() {
        return this.content.selectBtn;
    }

    async selectReminder() {
        assert(this.selectBtn?.content?.visible, 'Select reminder button not visible');

        return this.selectBtn.click();
    }

    async removeReminder() {
        assert(this.closeBtn?.content?.visible, 'Remove reminder button not visible');

        return this.closeBtn.click();
    }
}
