import { setBlock, TestStory } from 'jezve-test';
import * as Actions from '../../actions/category.js';
import { App } from '../../Application.js';
import { EXPENSE, INCOME } from '../../model/Transaction.js';

export class CategoriesStory extends TestStory {
    async beforeRun() {
        await App.scenario.prepareTestUser();
        await App.scenario.resetData({
            accounts: true,
            persons: true,
            categories: true,
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
        setBlock('Categories', 1);

        await Actions.securityTests();

        await this.create();
        await this.select();
        await this.sort();
        await this.details();
        await this.update();
        await this.deleteFromContextMenu();
        await this.del();

        await this.prepareTransactions();

        await this.deleteFromUpdate();
    }

    async create() {
        setBlock('Create categories', 1);

        setBlock('Create category with empty name', 2);
        await Actions.create();
        await Actions.submit();
        await Actions.inputName('Food');
        await Actions.inputName('');
        await Actions.submit();

        setBlock('Create valid categories', 2);
        await Actions.create();
        await Actions.inputName('Food');
        await Actions.selectType(EXPENSE);
        await Actions.submit();

        await Actions.create();
        await Actions.inputName('Investments');
        await Actions.selectType(INCOME);
        await Actions.submit();

        await Actions.create();
        await Actions.inputName('Taxes');
        await Actions.submit();

        await Actions.create();
        await Actions.inputName('Transpost');
        await Actions.selectType(EXPENSE);
        await Actions.submit();

        await Actions.create();
        await Actions.inputName('Shop');
        await Actions.selectType(EXPENSE);
        await Actions.submit();

        setBlock('Create category with existing name', 2);
        await Actions.create();
        await Actions.inputName('Transpost');
        await Actions.submit();

        [
            App.scenario.FOOD_CATEGORY,
            App.scenario.INVEST_CATEGORY,
            App.scenario.TAXES_CATEGORY,
            App.scenario.TRANSPORT_CATEGORY,
            App.scenario.SHOP_CATEGORY,
        ] = App.state.getCategoriesByNames(
            ['Food', 'Investments', 'Taxes', 'Transpost', 'Shop'],
            true,
        );

        await Actions.create();
        await Actions.inputName('Cafe');
        await Actions.selectParentCategory(App.scenario.FOOD_CATEGORY);
        await Actions.submit();

        await Actions.create();
        await Actions.inputName('Bike rent');
        await Actions.selectParentCategory(App.scenario.TRANSPORT_CATEGORY);
        await Actions.submit();
    }

    async update() {
        setBlock('Update categories', 1);

        const {
            FOOD_CATEGORY,
            TAXES_CATEGORY,
            INVEST_CATEGORY,
            SHOP_CATEGORY,
        } = App.scenario;

        await Actions.updateById(FOOD_CATEGORY);
        await Actions.inputName('Meal');
        await Actions.submit();

        await Actions.updateById(TAXES_CATEGORY);
        await Actions.selectParentCategory(INVEST_CATEGORY);
        await Actions.submit();

        await Actions.updateById(INVEST_CATEGORY);
        await Actions.selectType(EXPENSE);
        await Actions.submit();

        await Actions.updateById(FOOD_CATEGORY);
        await Actions.selectParentCategory(SHOP_CATEGORY);
        await Actions.submit();

        setBlock('Update category with empty name', 2);
        await Actions.updateById(FOOD_CATEGORY);
        await Actions.inputName('');
        await Actions.submit();

        setBlock('Update category with existing name', 2);
        await Actions.updateById(FOOD_CATEGORY);
        await Actions.inputName('Transpost');
        await Actions.submit();
    }

    async deleteFromContextMenu() {
        setBlock('Delete category from context menu', 1);

        await Actions.deleteFromContextMenu(0);
    }

    async del() {
        setBlock('Delete categories', 1);

        await Actions.del(0);
        await Actions.del(2, false);
        await Actions.del([0, 1]);
    }

    async deleteFromUpdate() {
        setBlock('Delete category from update view', 1);

        const data = [
            0,
        ];

        await App.scenario.runner.runGroup(Actions.delFromUpdate, data);
    }

    async select() {
        setBlock('Select categories', 1);

        const data = [
            [0],
            [1, 2],
        ];

        setBlock('Toggle select categories', 2);
        await App.scenario.runner.runGroup(Actions.toggleSelect, data);

        setBlock('Select/deselect all categories', 2);
        await Actions.selectAll();
        await Actions.deselectAll();
    }

    async sort() {
        setBlock('Sort categories', 1);

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
        setBlock('Category details', 1);

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
