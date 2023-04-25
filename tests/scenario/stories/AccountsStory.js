import { setBlock, TestStory } from 'jezve-test';
import * as AccountTests from '../../actions/account.js';
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
            currencies: true,
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
        await this.sort();
        await this.details();
        await this.show();
        await this.exportCSV();
        await this.update();
        await this.deleteFromContextMenu();
        await this.del();
        await this.deleteFromUpdate();
    }

    async stateLoop() {
        setBlock('View state loop', 2);

        const {
            RUB,
            USD,
            EUR,
            BTC,
        } = App.scenario;

        await AccountTests.create();
        await AccountTests.changeCurrency(EUR);
        await AccountTests.inputBalance('100.01');
        await AccountTests.changeIcon(1);
        await AccountTests.inputName('acc_1');

        await AccountTests.changeCurrency(USD);
        await AccountTests.inputBalance('100000.01');
        await AccountTests.inputBalance('100000.012');

        await AccountTests.changeCurrency(BTC);
        await AccountTests.inputBalance('0.12345678');
        // Check values on change currency to RUB and back to BTC
        await AccountTests.changeCurrency(RUB);
        await AccountTests.changeCurrency(BTC);

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
        setBlock('Create accounts', 1);

        const { RUB, EUR, BTC } = App.scenario;

        setBlock('Create account with point at initial balance', 2);
        await AccountTests.create();
        await AccountTests.changeType(1);
        await AccountTests.inputName('acc_1');
        await AccountTests.changeCurrency(RUB);
        await AccountTests.inputBalance(1000.01);
        await AccountTests.submit();

        setBlock('Create account with comma at initial balance', 2);
        await AccountTests.create();
        await AccountTests.changeType(2);
        await AccountTests.inputName('acc_2');
        await AccountTests.changeCurrency(EUR);
        await AccountTests.inputBalance('1000,01');
        await AccountTests.submit();

        setBlock('Create account with precise currency', 2);
        await AccountTests.create();
        await AccountTests.changeType(2);
        await AccountTests.inputName('acc_3');
        await AccountTests.changeCurrency(BTC);
        await AccountTests.inputBalance('0.00123');
        await AccountTests.submit();

        setBlock('Create account with empty name', 2);
        await AccountTests.create();
        await AccountTests.inputName('');
        await AccountTests.inputBalance('100');
        await AccountTests.submit();

        setBlock('Create account with existing name', 2);
        await AccountTests.create();
        await AccountTests.inputName('Acc_1');
        await AccountTests.inputBalance('1000');
        await AccountTests.submit();

        setBlock('Create account with empty initial balance', 2);
        await AccountTests.create();
        await AccountTests.inputName('acc');
        await AccountTests.inputBalance('');
        await AccountTests.submit();
    }

    async update() {
        setBlock('Update accounts', 1);

        const { RUB, USD, BTC } = App.scenario;

        setBlock('Change type, icon and currency of account', 2);
        await AccountTests.update(0);
        await AccountTests.changeType(3);
        await AccountTests.changeIcon(1);
        await AccountTests.changeCurrency(USD);
        await AccountTests.submit();

        setBlock('Update account with comma at initial balance', 2);
        await AccountTests.update(0);
        await AccountTests.changeCurrency(RUB);
        await AccountTests.inputBalance('555,55');
        await AccountTests.submit();

        setBlock('Update account with precise currency', 2);
        await AccountTests.update(6);
        await AccountTests.changeCurrency(BTC);
        await AccountTests.inputBalance('0.00345678');
        await AccountTests.submit();

        setBlock('Submit account with empty name', 2);
        await AccountTests.update(0);
        await AccountTests.inputName('');
        await AccountTests.submit();

        setBlock('Submit account with existing name', 2);
        await AccountTests.update(1);
        await AccountTests.inputName('Acc_1');
        await AccountTests.submit();

        setBlock('Update case in account name', 2);
        await AccountTests.update(0);
        await AccountTests.inputName('Acc_1');
        await AccountTests.submit();
    }

    async deleteFromContextMenu() {
        setBlock('Delete account from context menu', 1);

        await AccountTests.deleteFromContextMenu(1);
    }

    async del() {
        setBlock('Delete accounts', 1);

        const data = [
            [0, 1],
        ];

        await App.scenario.runner.runGroup(AccountTests.del, data);
    }

    async deleteFromUpdate() {
        setBlock('Delete account from update view', 1);

        const data = [
            0,
        ];

        await App.scenario.runner.runGroup(AccountTests.delFromUpdate, data);
    }

    async hide() {
        setBlock('Hide accounts', 1);

        const data = [
            [0],
            [0, 4],
        ];

        await App.scenario.runner.runGroup(AccountTests.hide, data);
    }

    async show() {
        setBlock('Show accounts', 1);

        const data = [
            [5],
            [0, 5],
        ];

        await App.scenario.runner.runGroup(AccountTests.show, data);
    }

    async exportCSV() {
        setBlock('Export accounts', 1);

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

    async sort() {
        setBlock('Sort accounts', 1);

        setBlock('Sort by name', 2);
        await AccountTests.toggleSortByName();
        await AccountTests.toggleSortByName();

        setBlock('Sort by date', 2);
        await AccountTests.toggleSortByDate();
        await AccountTests.toggleSortByDate();

        setBlock('Sort manually', 2);
        await AccountTests.sortManually();
    }

    async details() {
        setBlock('Account details', 1);

        await AccountTests.showDetails({ index: 0 });
        await AccountTests.closeDetails();
        await AccountTests.showDetails({ index: 1 });
        await AccountTests.showDetails({ index: 2 });
        await AccountTests.showDetails({ index: 2 });
        await AccountTests.closeDetails();
        await AccountTests.showDetails({ index: 0, directNavigate: true });
        await AccountTests.showDetails({ index: 1, directNavigate: true });
        await AccountTests.closeDetails();
    }
}
