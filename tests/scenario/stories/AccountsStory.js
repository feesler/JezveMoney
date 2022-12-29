import { setBlock, TestStory } from 'jezve-test';
import * as AccountTests from '../../run/account.js';
import { App } from '../../Application.js';

export class AccountsStory extends TestStory {
    async beforeRun() {
        await App.scenario.prepareTestUser();
        await App.scenario.resetData({
            accounts: true,
            persons: true,
        });
    }

    async prepareTransactions() {
        await App.scenario.resetData({
            accounts: true,
            persons: true,
            categories: true,
        });
        await App.scenario.createTestData();

        await App.goToMainView();
    }

    async run() {
        setBlock('Accounts', 1);

        await AccountTests.securityTests();
        await this.stateLoop();

        await this.create();
        await this.del();

        await this.prepareTransactions();

        await this.hide();
        await this.select();
        await this.show();
        await this.exportCSV();
        await this.update();
        await this.del();
        await this.deleteFromUpdate();
    }

    async stateLoop() {
        setBlock('View state loop', 2);

        const { RUB, USD, EUR } = App.scenario;

        await AccountTests.create();
        await AccountTests.changeCurrency(EUR);
        await AccountTests.inputBalance('100.01');
        await AccountTests.changeIcon(1);
        await AccountTests.inputName('acc_1');
        await AccountTests.changeCurrency(USD);
        await AccountTests.inputBalance('100000.01');
        await AccountTests.inputBalance('100000.012');
        // Change currency back to RUB
        await AccountTests.changeCurrency(RUB);

        // Input empty value for initial balance
        await AccountTests.inputBalance('');
        await AccountTests.inputBalance('.');
        await AccountTests.inputBalance('.01');
        await AccountTests.inputBalance('10000000.01');

        // Change icon to safe
        await AccountTests.changeIcon(2);
        await AccountTests.inputBalance('1000.01');

        await App.view.cancel();
    }

    async create() {
        setBlock('Create accounts', 2);

        const { RUB, EUR } = App.scenario;

        await AccountTests.create();
        await AccountTests.inputName('acc_1');
        await AccountTests.changeCurrency(RUB);
        await AccountTests.inputBalance(1000.01);
        await AccountTests.submit();

        await AccountTests.create();
        await AccountTests.inputName('acc_2');
        await AccountTests.changeCurrency(EUR);
        await AccountTests.inputBalance('1000.01');
        await AccountTests.submit();

        // Try to submit account with empty name
        await AccountTests.create();
        await AccountTests.inputName('');
        await AccountTests.inputBalance('100');
        await AccountTests.submit();

        // Try to submit account with existing name
        await AccountTests.create();
        await AccountTests.inputName('Acc_1');
        await AccountTests.inputBalance('1000');
        await AccountTests.submit();

        // Try to submit account with empty initial balance
        await AccountTests.create();
        await AccountTests.inputName('acc');
        await AccountTests.inputBalance('');
        await AccountTests.submit();
    }

    async update() {
        setBlock('Update accounts', 2);

        const { RUB, USD } = App.scenario;

        await AccountTests.update(0);
        await AccountTests.changeIcon(1);
        await AccountTests.changeCurrency(USD);
        await AccountTests.submit();

        await AccountTests.update(0);
        await AccountTests.changeCurrency(RUB);
        await AccountTests.submit();

        // Try to submit account with empty name
        await AccountTests.update(0);
        await AccountTests.inputName('');
        await AccountTests.submit();

        // Try to submit account with existing name
        await AccountTests.update(1);
        await AccountTests.inputName('Acc_1');
        await AccountTests.submit();

        // Try to update case in account name
        await AccountTests.update(0);
        await AccountTests.inputName('Acc_1');
        await AccountTests.submit();
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

    async select() {
        setBlock('Select accounts', 1);

        const data = [
            [0],
            [1, 2],
        ];

        setBlock('Toggle select accounts', 2);
        await App.scenario.runner.runGroup(AccountTests.toggleSelect, data);

        setBlock('Select/deselect all accounts', 2);
        await AccountTests.selectAll();
        await AccountTests.deselectAll();
    }
}
