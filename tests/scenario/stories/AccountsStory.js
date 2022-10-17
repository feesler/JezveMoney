import { setBlock, TestStory } from 'jezve-test';
import * as AccountTests from '../../run/account.js';
import { App } from '../../Application.js';
import { api } from '../../model/api.js';

export class AccountsStory extends TestStory {
    async beforeRun() {
        await App.scenario.prepareTestUser();

        await api.profile.resetData({
            accounts: true,
            persons: true,
        });
        await App.state.fetch();
    }

    async prepareTransactions() {
        await api.profile.resetData({
            accounts: true,
            persons: true,
        });
        await App.state.fetch();
        await App.scenario.createTestData();

        await App.goToMainView();
    }

    async run() {
        setBlock('Accounts', 1);

        await AccountTests.securityTests();
        await AccountTests.stateLoop();

        await this.create();
        await this.del();

        await this.prepareTransactions();

        await this.hide();
        await this.toggle();
        await this.show();
        await this.exportCSV();
        await this.update();
        await this.del();
        await this.deleteFromUpdate();
    }

    async create() {
        setBlock('Create accounts', 2);

        const { RUB, EUR } = App.scenario;

        const data = [{
            name: 'acc_1',
            initbalance: 1000.01,
            curr_id: RUB,
        }, {
            name: 'acc_2',
            initbalance: '1000.01',
            curr_id: EUR,
        }, {
            // Try to submit account with empty name
            name: '',
            initbalance: '100',
        }, {
            // Try to submit account with existing name
            name: 'Acc_1',
            initbalance: '1000',
        }, {
            // Try to submit account with empty initial balance
            name: 'acc',
            initbalance: '',
        }];

        await App.scenario.runner.runGroup(AccountTests.create, data);
    }

    async update() {
        setBlock('Update accounts', 2);

        const { RUB, USD } = App.scenario;
        const data = [{
            pos: 0,
            icon_id: 1,
            curr_id: USD,
        }, {
            pos: 0,
            curr_id: RUB,
        }, {
            // Try to submit account with empty name
            pos: 0,
            name: '',
        }, {
            // Try to submit account with existing name
            pos: 1,
            name: 'Acc_1',
        }, {
            // Try to update case in account name
            pos: 0,
            name: 'Acc_1',
        }];

        await App.scenario.runner.runGroup(AccountTests.update, data);
    }

    async del() {
        setBlock('Delete accounts', 2);

        const data = [
            [0, 1],
        ];

        await App.scenario.runner.runGroup(AccountTests.del, data);
    }

    async deleteFromUpdate() {
        setBlock('Delete account from update view', 2);

        const data = [
            0,
        ];

        await App.scenario.runner.runGroup(AccountTests.delFromUpdate, data);
    }

    async hide() {
        setBlock('Hide accounts', 2);

        const data = [
            [0],
            [0, 4],
        ];

        await App.scenario.runner.runGroup(AccountTests.hide, data);
    }

    async show() {
        setBlock('Show accounts', 2);

        const data = [
            [5],
            [0, 5],
        ];

        await App.scenario.runner.runGroup(AccountTests.show, data);
    }

    async exportCSV() {
        setBlock('Export accounts', 2);

        const data = [
            [0],
            [0, 1],
        ];

        await App.scenario.runner.runGroup(AccountTests.exportTest, data);
    }

    async toggle() {
        setBlock('Toggle select accounts', 2);

        const data = [
            [0],
            [1, 2],
        ];

        await App.scenario.runner.runGroup(AccountTests.toggleSelect, data);
    }
}
