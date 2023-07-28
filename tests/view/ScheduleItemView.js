import { asArray } from 'jezve-test';
import { App } from '../Application.js';
import { INTERVAL_NONE } from '../common.js';
import { DEBT, LIMIT_CHANGE } from '../model/Transaction.js';
import { SCHEDULE_ITEM_FORM } from './component/Transaction/TransactionForm.js';
import { TransactionView } from './TransactionView.js';

/** Scheduled transaction create/update view class */
export class ScheduleItemView extends TransactionView {
    static formType = SCHEDULE_ITEM_FORM;

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
}
