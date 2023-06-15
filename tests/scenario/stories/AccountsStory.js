import { setBlock, TestStory } from 'jezve-test';
import * as Actions from '../actions/account.js';
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

        await Actions.securityTests();
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

        await Actions.create();
        await Actions.changeCurrency(EUR);
        await Actions.inputBalance('100.01');
        await Actions.changeIcon(1);
        await Actions.inputName('acc_1');

        await Actions.changeCurrency(USD);
        await Actions.inputBalance('100000.01');
        await Actions.inputBalance('100000.012');

        await Actions.changeCurrency(BTC);
        await Actions.inputBalance('0.12345678');
        // Check values on change currency to RUB and back to BTC
        await Actions.changeCurrency(RUB);
        await Actions.changeCurrency(BTC);

        // Change currency back to RUB
        await Actions.changeCurrency(RUB);

        // Input empty value for initial balance
        await Actions.inputBalance('');
        await Actions.inputBalance('.');
        await Actions.inputBalance('.01');
        await Actions.inputBalance('10000000.01');

        // Change icon to safe
        await Actions.changeIcon(2);
        await Actions.inputBalance('1000.01');

        await App.view.cancel();
    }

    async create() {
        setBlock('Create accounts', 1);

        const { RUB, EUR, BTC } = App.scenario;

        setBlock('Create account with point at initial balance', 2);
        await Actions.create();
        await Actions.changeType(1);
        await Actions.inputName('acc_1');
        await Actions.changeCurrency(RUB);
        await Actions.inputBalance(1000.01);
        await Actions.submit();

        setBlock('Create account with comma at initial balance', 2);
        await Actions.create();
        await Actions.changeType(2);
        await Actions.inputName('acc_2');
        await Actions.changeCurrency(EUR);
        await Actions.inputBalance('1000,01');
        await Actions.submit();

        setBlock('Create account with precise currency', 2);
        await Actions.create();
        await Actions.changeType(2);
        await Actions.inputName('acc_3');
        await Actions.changeCurrency(BTC);
        await Actions.inputBalance('0.00123');
        await Actions.submit();

        setBlock('Create account with empty name', 2);
        await Actions.create();
        await Actions.inputName('');
        await Actions.inputBalance('100');
        await Actions.submit();

        setBlock('Create account with existing name', 2);
        await Actions.create();
        await Actions.inputName('Acc_1');
        await Actions.inputBalance('1000');
        await Actions.submit();

        setBlock('Create account with empty initial balance', 2);
        await Actions.create();
        await Actions.inputName('acc');
        await Actions.inputBalance('');
        await Actions.submit();
    }

    async update() {
        setBlock('Update accounts', 1);

        const { RUB, USD, BTC } = App.scenario;

        setBlock('Change type, icon and currency of account', 2);
        await Actions.update(0);
        await Actions.changeType(3);
        await Actions.changeIcon(1);
        await Actions.changeCurrency(USD);
        await Actions.submit();

        setBlock('Update account with comma at initial balance', 2);
        await Actions.update(0);
        await Actions.changeCurrency(RUB);
        await Actions.inputBalance('555,55');
        await Actions.submit();

        setBlock('Update account with precise currency', 2);
        await Actions.update(6);
        await Actions.changeCurrency(BTC);
        await Actions.inputBalance('0.00345678');
        await Actions.submit();

        setBlock('Submit account with empty name', 2);
        await Actions.update(0);
        await Actions.inputName('');
        await Actions.submit();

        setBlock('Submit account with existing name', 2);
        await Actions.update(1);
        await Actions.inputName('Acc_1');
        await Actions.submit();

        setBlock('Update case in account name', 2);
        await Actions.update(0);
        await Actions.inputName('Acc_1');
        await Actions.submit();
    }

    async deleteFromContextMenu() {
        setBlock('Delete account from context menu', 1);

        await Actions.deleteFromContextMenu(1);
    }

    async del() {
        setBlock('Delete accounts', 1);

        const data = [
            [0, 1],
        ];

        await App.scenario.runner.runGroup(Actions.del, data);
    }

    async deleteFromUpdate() {
        setBlock('Delete account from update view', 1);

        const data = [
            0,
        ];

        await App.scenario.runner.runGroup(Actions.delFromUpdate, data);
    }

    async hide() {
        setBlock('Hide accounts', 1);

        const data = [
            [0],
            [0, 4],
        ];

        await App.scenario.runner.runGroup(Actions.hide, data);
    }

    async show() {
        setBlock('Show accounts', 1);

        const data = [
            [5],
            [0, 7],
        ];

        await App.scenario.runner.runGroup(Actions.show, data);
    }

    async exportCSV() {
        setBlock('Export accounts', 1);

        const data = [
            [0],
            [0, 1],
        ];

        await App.scenario.runner.runGroup(Actions.exportTest, data);
    }

    async select() {
        setBlock('Select accounts', 1);

        const data = [
            [0],
            [1, 2],
        ];

        setBlock('Toggle select accounts', 2);
        await App.scenario.runner.runGroup(Actions.toggleSelect, data);

        setBlock('Select/deselect all accounts', 2);
        await Actions.selectAll();
        await Actions.deselectAll();
    }

    async sort() {
        setBlock('Sort accounts', 1);

        setBlock('Sort by name', 2);
        await Actions.toggleSortByName();
        await Actions.toggleSortByName();

        setBlock('Sort by date', 2);
        await Actions.toggleSortByDate();
        await Actions.toggleSortByDate();

        setBlock('Sort manually', 2);
        await Actions.sortManually();
    }

    async details() {
        setBlock('Account details', 1);

        await Actions.showDetails({ index: 0 });
        await Actions.closeDetails();
        await Actions.showDetails({ index: 1 });
        await Actions.showDetails({ index: 2 });
        await Actions.showDetails({ index: 2 });
        await Actions.closeDetails();
        await Actions.showDetails({ index: 0, directNavigate: true });
        await Actions.showDetails({ index: 1, directNavigate: true });
        await Actions.closeDetails();
    }
}
