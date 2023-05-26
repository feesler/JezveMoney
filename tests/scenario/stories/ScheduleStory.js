import { setBlock, TestStory } from 'jezve-test';
import * as Actions from '../../actions/schedule.js';
import { App } from '../../Application.js';
import {
    DEBT,
    INCOME,
    TRANSFER,
} from '../../model/Transaction.js';
import {
    INTERVAL_DAY,
    INTERVAL_WEEK,
    INTERVAL_YEAR,
} from '../../model/ScheduledTransaction.js';

export class ScheduleStory extends TestStory {
    async beforeRun() {
        await App.scenario.prepareTestUser();
        await App.scenario.resetData({
            accounts: true,
            persons: true,
            categories: true,
            currencies: true,
            schedule: true,
        });

        await App.scenario.createUserCurrencies();
        await App.scenario.createAccounts();
        await App.scenario.createPersons();
        await App.scenario.createCategories();
        await App.scenario.createTransactions();

        await App.goToMainView();
    }

    async run() {
        setBlock('Schedule', 1);

        await Actions.securityTests();

        await this.create();
        await this.list();
        await this.update();
        await this.deleteFromContextMenu();
        await this.del();
        await this.deleteFromUpdate();
    }

    async list() {
        await this.detailsMode();
        await this.select();
        await this.details();
    }

    async create() {
        setBlock('Create scheduled transaction', 1);

        await Actions.createAndSubmit([
            { action: 'inputDestAmount', data: '1000' },
            { action: 'inputComment', data: 'some fee' },
        ]);

        await Actions.createAndSubmit([
            { action: 'inputDestAmount', data: '100' },
            { action: 'inputComment', data: 'Daily expense' },
            { action: 'changeIntervalType', data: INTERVAL_DAY },
        ]);

        await Actions.createAndSubmit([
            { action: 'changeTransactionType', data: INCOME },
            { action: 'inputSrcAmount', data: '500' },
            { action: 'inputComment', data: 'Percents' },
            { action: 'selectMonthDayOffset', data: 31 },
        ]);

        await Actions.createAndSubmit([
            { action: 'changeTransactionType', data: INCOME },
            { action: 'inputSrcAmount', data: '75000' },
            { action: 'inputComment', data: 'Annual percents' },
            { action: 'changeIntervalType', data: INTERVAL_YEAR },
            { action: 'selectMonthDayOffset', data: 31 },
            { action: 'selectMonthOffset', data: 11 },
        ]);

        await Actions.createAndSubmit([
            { action: 'changeTransactionType', data: TRANSFER },
            { action: 'inputSrcAmount', data: '5000' },
            { action: 'changeIntervalType', data: INTERVAL_WEEK },
            { action: 'selectWeekDayOffset', data: 4 },
        ]);

        await Actions.createAndSubmit([
            { action: 'changeTransactionType', data: DEBT },
            { action: 'inputDestAmount', data: '1000' },
            { action: 'inputIntervalStep', data: '6' },
            { action: 'selectMonthDayOffset', data: 1 },
        ]);
    }

    async update() {
        setBlock('Update scheduled transaction', 1);

        await Actions.updateAndSubmit(0, [
            { action: 'changeIntervalType', data: INTERVAL_WEEK },
            { action: 'selectWeekDayOffset', data: 2 },
        ]);
    }

    async deleteFromContextMenu() {
        setBlock('Delete scheduled transaction from context menu', 1);

        const data = [
            0,
        ];

        await App.scenario.runner.runGroup(Actions.deleteFromContextMenu, data);
    }

    async del() {
        setBlock('Delete scheduled transactions', 1);

        const data = [
            0,
            [0, 1],
        ];

        await App.scenario.runner.runGroup(Actions.del, data);
    }

    async deleteFromUpdate() {
        setBlock('Delete scheduled transaction from update view', 1);

        const data = [
            0,
        ];

        await App.scenario.runner.runGroup(Actions.delFromUpdate, data);
    }

    async detailsMode() {
        setBlock('Scheduled transactions list details mode', 1);

        await Actions.toggleMode();
        await Actions.toggleMode();
    }

    async select() {
        setBlock('Select scheduled transactions', 1);

        const data = [
            [0],
            [1, 2],
        ];

        setBlock('Toggle select scheduled transactions', 2);
        await App.scenario.runner.runGroup(Actions.toggleSelect, data);

        setBlock('Select/deselect all scheduled transaction', 2);
        await Actions.selectAll();
        await Actions.deselectAll();
    }

    async details() {
        setBlock('Scheduled transaction details', 1);

        await Actions.showDetails({ index: 0 });
        await Actions.closeDetails();
        await Actions.showDetails({ index: 1 });
        await Actions.closeDetails();
        await Actions.showDetails({ index: 0, directNavigate: true });
        await Actions.showDetails({ index: 1, directNavigate: true });
        await Actions.closeDetails();
    }
}
