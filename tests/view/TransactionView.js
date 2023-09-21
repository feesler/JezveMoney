import {
    assert,
    url,
    query,
    prop,
    navigation,
    asArray,
} from 'jezve-test';
import { Button } from 'jezvejs-test';
import { AppView } from './AppView.js';
import { dateStringToSeconds } from '../common.js';
import { WarningPopup } from './component/WarningPopup.js';
import {
    DEBT,
    LIMIT_CHANGE,
} from '../model/Transaction.js';
import { App } from '../Application.js';
import { TRANSACTION_FORM, TransactionForm } from './component/Transaction/TransactionForm.js';

/** Create or update transaction view class */
export class TransactionView extends AppView {
    static formType = TRANSACTION_FORM;

    static getInitialState(options, state = App.state) {
        const res = {
            header: this.getHeaderExpectedState(state),
            form: TransactionForm.getInitialState(
                { ...options, formType: this.formType },
                state,
            ),
        };

        if (options?.action === 'update') {
            res.deleteBtn = { visible: true };
        }

        return res;
    }

    constructor(...args) {
        super(...args);

        this.loaded = false;
    }

    get form() {
        return this.content.form;
    }

    get formModel() {
        return this.content.form.model;
    }

    async parseContent() {
        const res = {};

        const viewURL = await url();
        res.isUpdate = viewURL.includes('/update/');

        if (res.isUpdate) {
            const hiddenEl = await query('#idInp');
            assert(hiddenEl, 'Transaction id field not found');

            res.id = parseInt(await prop(hiddenEl, 'value'), 10);
            assert(res.id, 'Wrong transaction id');
        }

        res.heading = { elem: await query('.heading > h1') };
        assert(res.heading.elem, 'Heading element not found');
        res.heading.title = await prop(res.heading.elem, 'textContent');

        res.deleteBtn = await Button.create(this, await query('#deleteBtn'));

        res.form = await TransactionForm.create(this, await query('#form'), this.constructor.formType);
        if (!this.loaded) {
            await res.form.waitForLoad();
            this.loaded = true;
        }

        res.delete_warning = await WarningPopup.create(this, await query('#delete_warning'));

        return res;
    }

    createCancelledState(transactionId) {
        this.cancelledState = App.state.createCancelled({ id: transactionId });
    }

    appState(model = this.model) {
        if (model.isUpdate && !this.cancelledState) {
            this.createCancelledState(model.id);
        }

        return (model.isUpdate) ? this.cancelledState : App.state;
    }

    buildModel(cont) {
        const res = this.model;

        res.locale = cont.locale;

        res.isUpdate = cont.isUpdate;
        if (res.isUpdate) {
            res.id = cont.id;
        }

        res.form = structuredClone(cont.form.model);

        return res;
    }

    isValid() {
        return this.form.isValid();
    }

    getExpectedSourceAmount(model = this.model) {
        return (model.type === LIMIT_CHANGE) ? Math.abs(model.fSrcAmount) : model.fSrcAmount;
    }

    getExpectedDestAmount(model = this.model) {
        return (model.type === LIMIT_CHANGE) ? Math.abs(model.fDestAmount) : model.fDestAmount;
    }

    getExpectedTransaction() {
        const form = this.form.model;
        const { repeatEnabled } = form;

        const res = {
            type: form.type,
            src_amount: this.getExpectedSourceAmount(form),
            dest_amount: this.getExpectedDestAmount(form),
            src_curr: form.src_curr_id,
            dest_curr: form.dest_curr_id,
            category_id: form.categoryId,
            comment: form.comment,
        };

        const reminderId = parseInt(form.reminderId, 10);
        const scheduleId = parseInt(form.scheduleId, 10);

        if (repeatEnabled && !reminderId && !scheduleId) {
            res.start_date = App.dateStringToSeconds(form.startDate);
            res.end_date = App.dateStringToSeconds(form.endDate);
            res.interval_type = parseInt(form.intervalType, 10);
            res.interval_step = parseInt(form.intervalStep, 10);
            res.interval_offset = asArray(form.intervalOffset)
                .map((item) => parseInt(item, 10));
        }

        if (form.isUpdate) {
            res.id = form.id;
        }

        if (res.type === DEBT) {
            res.person_id = form.person.id;
            res.acc_id = form.noAccount ? 0 : form.account.id;
            res.op = form.debtType ? 1 : 2;
        } else if (res.type === LIMIT_CHANGE) {
            const increaseLimit = form.fDestAmount > 0;
            res.src_id = (increaseLimit) ? 0 : form.destAccount.id;
            res.dest_id = (increaseLimit) ? form.destAccount.id : 0;
        } else {
            res.src_id = (form.srcAccount) ? form.srcAccount.id : 0;
            res.dest_id = (form.destAccount) ? form.destAccount.id : 0;
        }

        res.date = dateStringToSeconds(form.date, {
            locales: this.appState().getDateFormatLocale(),
            options: App.dateFormatOptions,
        });

        if (reminderId !== 0) {
            res.reminder_id = reminderId;
        } else if (scheduleId !== 0) {
            res.schedule_id = scheduleId;
            res.reminder_date = parseInt(form.reminderDate, 10);
        }

        return res;
    }

    getExpectedState() {
        const res = {};

        if (this.model.isUpdate) {
            res.deleteBtn = { visible: true };
        }

        return res;
    }

    async changeTransactionType(type) {
        return this.form.changeTransactionType(type);
    }

    async clickDeleteButton() {
        assert(this.content.isUpdate && this.content.deleteBtn, 'Unexpected action clickDeleteButton');

        await this.performAction(() => this.content.deleteBtn.click());
    }

    /** Click on delete button and confirm wanring popup */
    async deleteSelfItem() {
        await this.clickDeleteButton();

        assert(this.content.delete_warning?.content?.visible, 'Delete transaction warning popup not appear');

        await navigation(() => this.content.delete_warning.clickOk());
    }

    async submit() {
        return this.form.submit();
    }

    async cancel() {
        return this.form.cancel();
    }

    async openReminderDialog() {
        return this.form.openReminderDialog();
    }

    async closeReminderDialog() {
        return this.form.closeReminderDialog();
    }

    async selectReminderByIndex(index) {
        return this.form.selectReminderByIndex(index);
    }

    async removeReminder() {
        return this.form.removeReminder();
    }

    async inputStartDate(val) {
        return this.form.inputStartDate(val);
    }

    async clearAllRemindersFilters(val) {
        return this.form.clearAllRemindersFilters(val);
    }

    async filterRemindersByState(val) {
        return this.form.filterRemindersByState(val);
    }

    async selectRemindersStartDateFilter(val) {
        return this.form.selectRemindersStartDateFilter(val);
    }

    async selectRemindersEndDateFilter(val) {
        return this.form.selectRemindersEndDateFilter(val);
    }

    async clearRemindersStartDateFilter() {
        return this.form.clearRemindersStartDateFilter();
    }

    async clearRemindersEndDateFilter() {
        return this.form.clearRemindersEndDateFilter();
    }

    async goToRemindersFirstPage() {
        return this.form.goToRemindersFirstPage();
    }

    async goToRemindersLastPage() {
        return this.form.goToRemindersLastPage();
    }

    async goToRemindersPrevPage() {
        return this.form.goToRemindersPrevPage();
    }

    async goToRemindersNextPage() {
        return this.form.goToRemindersNextPage();
    }

    async showMoreReminders() {
        return this.form.showMoreReminders();
    }

    async setRemindersClassicMode() {
        return this.form.setRemindersClassicMode();
    }

    async setRemindersDetailsMode() {
        return this.form.setRemindersDetailsMode();
    }

    async selectStartDate(val) {
        return this.form.selectStartDate(val);
    }

    async inputEndDate(val) {
        return this.form.inputEndDate(val);
    }

    async selectEndDate(val) {
        return this.form.selectEndDate(val);
    }

    async clearEndDate() {
        return this.form.clearEndDate();
    }

    async toggleEnableRepeat() {
        return this.form.toggleEnableRepeat();
    }

    async changeIntervalType(val) {
        return this.form.changeIntervalType(val);
    }

    async inputIntervalStep(val) {
        return this.form.inputIntervalStep(val);
    }

    async selectWeekDayOffset(val) {
        return this.form.selectWeekDayOffset(val);
    }

    async selectWeekdaysOffset() {
        return this.form.selectWeekdaysOffset();
    }

    async selectWeekendOffset() {
        return this.form.selectWeekendOffset();
    }

    async selectMonthDayOffset(val) {
        return this.form.selectMonthDayOffset(val);
    }

    async selectMonthOffset(val) {
        return this.form.selectMonthOffset(val);
    }

    async changeSrcAccount(val) {
        return this.form.changeSrcAccount(val);
    }

    async changeDestAccount(val) {
        return this.form.changeDestAccount(val);
    }

    async inputSrcAmount(val) {
        return this.form.inputSrcAmount(val);
    }

    async clickSrcAmount() {
        return this.form.clickSrcAmount();
    }

    async inputDestAmount(val) {
        return this.form.inputDestAmount(val);
    }

    async clickSrcResultBalance() {
        return this.form.clickSrcResultBalance();
    }

    async clickDestResultBalance() {
        return this.form.clickDestResultBalance();
    }

    async clickDestAmount() {
        return this.form.clickDestAmount();
    }

    async inputResBalance(val) {
        return this.form.inputResBalance(val);
    }

    async inputDestResBalance(val) {
        return this.form.inputDestResBalance(val);
    }

    async changeSourceCurrency(val) {
        return this.form.changeSourceCurrency(val);
    }

    async changeDestCurrency(val) {
        return this.form.changeDestCurrency(val);
    }

    async clickExchRate() {
        return this.form.clickExchRate();
    }

    async inputExchRate(val) {
        return this.form.inputExchRate(val);
    }

    async toggleExchange() {
        return this.form.toggleExchange();
    }

    async inputDate(val) {
        return this.form.inputDate(val);
    }

    async selectDate(val) {
        return this.form.selectDate(val);
    }

    async changeCategory(val) {
        return this.form.changeCategory(val);
    }

    async inputComment(val) {
        return this.form.inputComment(val);
    }

    async changePerson(val) {
        return this.form.changePerson(val);
    }

    async toggleAccount() {
        return this.form.toggleAccount();
    }

    async changeAccount(value) {
        return this.form.changeAccount(value);
    }

    async swapSourceAndDest() {
        return this.form.swapSourceAndDest();
    }
}
