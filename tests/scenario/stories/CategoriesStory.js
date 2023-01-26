import { setBlock, TestStory } from 'jezve-test';
import * as CategoryTests from '../../run/category.js';
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
        });
        await App.scenario.createTestData();

        await App.goToMainView();
    }

    async run() {
        setBlock('Categories', 1);

        await CategoryTests.securityTests();

        await this.create();
        await this.select();
        await this.sort();
        await this.details();
        await this.update();
        await this.del();

        await this.prepareTransactions();

        await this.deleteFromUpdate();
    }

    async create() {
        setBlock('Create categories', 1);

        setBlock('Create category with empty name', 2);
        await CategoryTests.create();
        await CategoryTests.submit();
        await CategoryTests.inputName('Food');
        await CategoryTests.inputName('');
        await CategoryTests.submit();

        setBlock('Create valid categories', 2);
        await CategoryTests.create();
        await CategoryTests.inputName('Food');
        await CategoryTests.selectType(EXPENSE);
        await CategoryTests.submit();

        await CategoryTests.create();
        await CategoryTests.inputName('Investments');
        await CategoryTests.selectType(INCOME);
        await CategoryTests.submit();

        await CategoryTests.create();
        await CategoryTests.inputName('Taxes');
        await CategoryTests.submit();

        await CategoryTests.create();
        await CategoryTests.inputName('Transpost');
        await CategoryTests.selectType(EXPENSE);
        await CategoryTests.submit();

        await CategoryTests.create();
        await CategoryTests.inputName('Shop');
        await CategoryTests.selectType(EXPENSE);
        await CategoryTests.submit();

        setBlock('Create category with existing name', 2);
        await CategoryTests.create();
        await CategoryTests.inputName('Transpost');
        await CategoryTests.submit();

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

        await CategoryTests.create();
        await CategoryTests.inputName('Cafe');
        await CategoryTests.selectParentCategory(App.scenario.FOOD_CATEGORY);
        await CategoryTests.submit();

        await CategoryTests.create();
        await CategoryTests.inputName('Bike rent');
        await CategoryTests.selectParentCategory(App.scenario.TRANSPORT_CATEGORY);
        await CategoryTests.submit();
    }

    async update() {
        setBlock('Update categories', 1);

        const {
            FOOD_CATEGORY,
            TAXES_CATEGORY,
            INVEST_CATEGORY,
            SHOP_CATEGORY,
        } = App.scenario;

        await CategoryTests.updateById(FOOD_CATEGORY);
        await CategoryTests.inputName('Meal');
        await CategoryTests.submit();

        await CategoryTests.updateById(TAXES_CATEGORY);
        await CategoryTests.selectParentCategory(INVEST_CATEGORY);
        await CategoryTests.submit();

        await CategoryTests.updateById(INVEST_CATEGORY);
        await CategoryTests.selectType(EXPENSE);
        await CategoryTests.submit();

        await CategoryTests.updateById(FOOD_CATEGORY);
        await CategoryTests.selectParentCategory(SHOP_CATEGORY);
        await CategoryTests.submit();

        setBlock('Update category with empty name', 2);
        await CategoryTests.updateById(FOOD_CATEGORY);
        await CategoryTests.inputName('');
        await CategoryTests.submit();

        setBlock('Update category with existing name', 2);
        await CategoryTests.updateById(FOOD_CATEGORY);
        await CategoryTests.inputName('Transpost');
        await CategoryTests.submit();
    }

    async del() {
        setBlock('Delete categories', 1);

        await CategoryTests.del(0);
        await CategoryTests.del(3, false);
        await CategoryTests.del([0, 2]);
    }

    async deleteFromUpdate() {
        setBlock('Delete category from update view', 1);

        const data = [
            0,
        ];

        await App.scenario.runner.runGroup(CategoryTests.delFromUpdate, data);
    }

    async select() {
        setBlock('Select categories', 1);

        const data = [
            [0],
            [1, 2],
        ];

        setBlock('Toggle select categories', 2);
        await App.scenario.runner.runGroup(CategoryTests.toggleSelect, data);

        setBlock('Select/deselect all categories', 2);
        await CategoryTests.selectAll();
        await CategoryTests.deselectAll();
    }

    async sort() {
        setBlock('Sort categories', 1);

        setBlock('Sort by name', 2);
        await CategoryTests.toggleSortByName();
        await CategoryTests.toggleSortByName();

        setBlock('Sort by date', 2);
        await CategoryTests.toggleSortByDate();
        await CategoryTests.toggleSortByDate();

        setBlock('Sort manually', 2);
        await CategoryTests.sortManually();
    }

    async details() {
        setBlock('Category details', 1);

        await CategoryTests.showDetails({ index: 0 });
        await CategoryTests.closeDetails();
        await CategoryTests.showDetails({ index: 1 });
        await CategoryTests.showDetails({ index: 2 });
        await CategoryTests.showDetails({ index: 2 });
        await CategoryTests.closeDetails();
        await CategoryTests.showDetails({ index: 0, directNavigate: true });
        await CategoryTests.showDetails({ index: 1, directNavigate: true });
        await CategoryTests.closeDetails();
    }
}
