import { App } from '../Application.js';
import { SCHEDULE_ITEM_FORM } from './component/Transaction/TransactionForm.js';
import { TransactionView } from './TransactionView.js';

/** Scheduled transaction create/update view class */
export class ScheduleItemView extends TransactionView {
    static formType = SCHEDULE_ITEM_FORM;

    appState() {
        return App.state;
    }
}
