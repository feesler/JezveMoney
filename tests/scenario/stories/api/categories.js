import { setBlock } from 'jezve-test';
import { App } from '../../../Application.js';
import { EXPENSE, INCOME } from '../../../model/Transaction.js';
import * as CategoryApiTests from '../../../run/api/category.js';

const create = async () => {
    setBlock('Create categories', 2);

    const data = [{
        name: 'Food',
        parent_id: 0,
        type: EXPENSE,
    }, {
        name: 'Investments',
        parent_id: 0,
        type: INCOME,
    }, {
        name: 'Taxes',
        parent_id: 0,
        type: 0,
    }, {
        name: 'Transpost',
        parent_id: 0,
        type: EXPENSE,
    }];

    [
        App.scenario.FOOD_CATEGORY,
        App.scenario.INVEST_CATEGORY,
        App.scenario.TAXES_CATEGORY,
        App.scenario.TRANSPORT_CATEGORY,
    ] = await App.scenario.runner.runGroup(CategoryApiTests.create, data);
};

const createInvalid = async () => {
    setBlock('Create categories with invalid data', 2);

    const data = [{
        // Try to create category with existing name
        name: 'Food',
        parent_id: 0,
        type: 0,
    }, {
        // Try to create sub category with invalid type
        name: 'Subcategory',
        parent_id: App.scenario.FOOD_CATEGORY,
        type: 0,
    }, {
        // Invalid data tests
        name: 'Investments',
        parent_id: 0,
    }, {
        name: 'Taxes',
        type: 0,
    }, {
        parent_id: 0,
        type: EXPENSE,
    }];

    await App.scenario.runner.runGroup(CategoryApiTests.create, data);
};

const createMultiple = async () => {
    setBlock('Create multiple categories', 2);

    const data = [{
        name: 'Cafe',
        parent_id: App.scenario.FOOD_CATEGORY,
        type: EXPENSE,
    }, {
        name: 'Bike rent',
        parent_id: App.scenario.TRANSPORT_CATEGORY,
        type: EXPENSE,
    }, {
        name: 'Learning',
        parent_id: 0,
        type: 0,
    }];

    [
        App.scenario.CAFE_CATEGORY,
        App.scenario.BIKE_CATEGORY,
        App.scenario.LEARN_CATEGORY,
    ] = await CategoryApiTests.createMultiple(data);
};

const createMultipleInvalid = async () => {
    setBlock('Create multiple categories with invalid data', 2);

    const data = [
        null,
        [null],
        [null, null],
        [{
            name: '',
            parent_id: 0,
            type: 0,
        }, {
            name: 'Invalid category 1',
            parent_id: 0,
        }],
        [{
            name: 'Invalid category 2',
            parent_id: 0,
        }, null],
    ];

    await App.scenario.runner.runGroup(CategoryApiTests.createMultiple, data);
};

const update = async () => {
    setBlock('Update categories', 2);

    const data = [
        { id: App.scenario.FOOD_CATEGORY, name: 'Meal' },
        { id: App.scenario.TAXES_CATEGORY, parent_id: App.scenario.INVEST_CATEGORY },
    ];

    return App.scenario.runner.runGroup(CategoryApiTests.update, data);
};

const updateInvalid = async () => {
    setBlock('Update categories with invalid data', 2);

    const data = [
        // Try to update name of category to an existing one
        { id: App.scenario.FOOD_CATEGORY, name: 'Transpost' },
        // Try to submit category with empty name
        { id: App.scenario.FOOD_CATEGORY, name: '' },
        // Try to submit category with invalid parent
        { id: App.scenario.FOOD_CATEGORY, parent_id: -1 },
        // Try to submit category with itself as parent
        { id: App.scenario.FOOD_CATEGORY, parent_id: App.scenario.FOOD_CATEGORY },
        // Try to submit category with invalid transaction type
        { id: App.scenario.FOOD_CATEGORY, type: 100 },
        // Try to submit category with transaction type different than parent
        { id: App.scenario.CAFE_CATEGORY, type: INCOME },
    ];

    return App.scenario.runner.runGroup(CategoryApiTests.update, data);
};

const del = async () => {
    setBlock('Delete categories', 2);

    const data = [
        [App.scenario.INVEST_CATEGORY],
        [App.scenario.BIKE_CATEGORY, App.scenario.LEARN_CATEGORY],
    ];

    return App.scenario.runner.runGroup(CategoryApiTests.del, data);
};

const delInvalid = async () => {
    setBlock('Delete categories with invalid data', 2);

    const data = [
        null,
        [],
        [null, null],
    ];

    return App.scenario.runner.runGroup(CategoryApiTests.del, data);
};

export const apiCategoriesTests = {
    async createTests() {
        await create();
        await createInvalid();
        await createMultiple();
        await createMultipleInvalid();
    },

    async updateAndDeleteTests() {
        await update();
        await updateInvalid();
        await del();
        await delInvalid();
    },
};
