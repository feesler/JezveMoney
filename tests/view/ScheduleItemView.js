import {
    query,
    prop,
    assert,
    url,
    navigation,
    asArray,
} from 'jezve-test';
import { Button } from 'jezvejs-test';
import { App } from '../Application.js';
import { DEBT, LIMIT_CHANGE } from '../model/Transaction.js';
import { AppView } from './AppView.js';
import { SCHEDULE_ITEM_FORM, TransactionForm } from './component/Transaction/TransactionForm.js';
import { WarningPopup } from './component/WarningPopup.js';
import { INTERVAL_NONE } from '../common.js';

/** Scheduled transaction create/update view class */
export class ScheduleItemView extends AppView {
    static getInitialState(options, state = App.state) {
        const res = {
            form: TransactionForm.getInitialState(
                { ...options, formType: SCHEDULE_ITEM_FORM },
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

        res.heading = { elem: await query('.heading > h1') };
        assert(res.heading.elem, 'Heading element not found');
        res.heading.text = await prop(res.heading.elem, 'textContent');

        res.isUpdate = (await url()).includes('/update/');

        if (res.isUpdate) {
            const hiddenEl = await query('#idInp');
            assert(hiddenEl, 'Transaction id field not found');

            res.id = parseInt(await prop(hiddenEl, 'value'), 10);
            assert(res.id, 'Wrong transaction id');
        }

        res.deleteBtn = await Button.create(this, await query('#deleteBtn'));

        res.form = await TransactionForm.create(this, await query('#form'), SCHEDULE_ITEM_FORM);
        if (!this.loaded) {
            await res.form.waitForLoad();
            this.loaded = true;
        }

        res.delete_warning = await WarningPopup.create(this, await query('#delete_warning'));

        return res;
    }

    appState() {
        return App.state;
    }

    buildModel(cont) {
        const res = this.model;

        res.locale = cont.locale;

        res.isUpdate = cont.isUpdate;
        if (res.isUpdate) {
            res.id = cont.id;
        }

        res.form = cont.form.model;

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

    getExpectedScheduledTransaction() {
        const { form } = this.model;
        const { repeatEnabled } = form;

        const intervalType = (repeatEnabled)
            ? parseInt(form.intervalType, 10)
            : INTERVAL_NONE;

        const intervalStep = (repeatEnabled)
            ? parseInt(form.intervalStep, 10)
            : 0;

        const intervalOffsets = (repeatEnabled)
            ? asArray(form.intervalOffset).map((item) => parseInt(item, 10))
            : [];

        const res = {
            start_date: App.dateStringToSeconds(form.startDate),
            end_date: App.dateStringToSeconds(form.endDate),
            interval_type: intervalType,
            interval_step: intervalStep,
            interval_offset: intervalOffsets,
            type: form.type,
            src_amount: this.getExpectedSourceAmount(form),
            dest_amount: this.getExpectedDestAmount(form),
            src_curr: form.src_curr_id,
            dest_curr: form.dest_curr_id,
            category_id: form.categoryId,
            comment: form.comment,
        };

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

    async inputStartDate(val) {
        return this.form.inputStartDate(val);
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

    async clearEndDate(val) {
        return this.form.clearEndDate(val);
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
