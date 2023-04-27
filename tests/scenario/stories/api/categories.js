import { setBlock } from 'jezve-test';
import { App } from '../../../Application.js';
import { EXPENSE, INCOME } from '../../../model/Transaction.js';
import * as Actions from '../../../actions/api/category.js';

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
    }, {
        name: 'Shop',
        parent_id: 0,
        type: EXPENSE,
    }];

    [
        App.scenario.FOOD_CATEGORY,
        App.scenario.INVEST_CATEGORY,
        App.scenario.TAXES_CATEGORY,
        App.scenario.TRANSPORT_CATEGORY,
        App.scenario.SHOP_CATEGORY,
    ] = await App.scenario.runner.runGroup(Actions.create, data);
};

const createWithChainedRequest = async () => {
    setBlock('Create categories with chained request', 2);

    const data = [{
        name: 'Services chained',
        parent_id: 0,
        type: EXPENSE,
        returnState: {
            categories: {},
        },
    }, {
        name: 'Beauty chained',
        parent_id: 0,
        type: EXPENSE,
        returnState: {
            accounts: { visibility: 'visible' },
            categories: {},
        },
    }];

    [
        App.scenario.SCV_CHAINED_CATEGORY,
        App.scenario.BEAUTY_CHAINED_CATEGORY,
    ] = await App.scenario.runner.runGroup(Actions.create, data);
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

    await App.scenario.runner.runGroup(Actions.create, data);
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
        type: EXPENSE,
    }, {
        name: 'Other',
        parent_id: 0,
        type: 0,
    }];

    [
        App.scenario.CAFE_CATEGORY,
        App.scenario.BIKE_CATEGORY,
        App.scenario.LEARN_CATEGORY,
        App.scenario.OTHER_CATEGORY,
    ] = await Actions.createMultiple(data);
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

    await App.scenario.runner.runGroup(Actions.createMultiple, data);
};

const read = async () => {
    setBlock('Read categories by ids', 2);

    const data = [
        App.scenario.CAFE_CATEGORY,
        [App.scenario.BIKE_CATEGORY, App.scenario.LEARN_CATEGORY],
    ];

    await App.scenario.runner.runGroup(Actions.read, data);
};

const list = async () => {
    setBlock('Categories list', 2);

    const data = [
        {},
        { parent_id: 0 },
        { parent_id: App.scenario.TRANSPORT_CATEGORY },
    ];

    await App.scenario.runner.runGroup(Actions.list, data);
};

const update = async () => {
    setBlock('Update categories', 2);

    const {
        FOOD_CATEGORY,
        TAXES_CATEGORY,
        INVEST_CATEGORY,
        SHOP_CATEGORY,
    } = App.scenario;

    const data = [
        { id: FOOD_CATEGORY, name: 'Meal' },
        { id: TAXES_CATEGORY, parent_id: INVEST_CATEGORY },
        { id: INVEST_CATEGORY, type: EXPENSE },
        { id: FOOD_CATEGORY, parent_id: SHOP_CATEGORY },
    ];

    return App.scenario.runner.runGroup(Actions.update, data);
};

const updateWithChainedRequest = async () => {
    setBlock('Update categories with chained request', 2);

    const {
        SCV_CHAINED_CATEGORY,
        BEAUTY_CHAINED_CATEGORY,
    } = App.scenario;

    const data = [{
        id: SCV_CHAINED_CATEGORY,
        name: 'Services',
        returnState: {
            categories: { parent_id: App.scenario.FOOD_CATEGORY },
        },
    }, {
        id: BEAUTY_CHAINED_CATEGORY,
        name: 'Beauty',
        returnState: {
            categories: { parent_id: 0 },
        },
    }];

    return App.scenario.runner.runGroup(Actions.update, data);
};

const updateInvalid = async () => {
    setBlock('Update categories with invalid data', 2);

    const { FOOD_CATEGORY, CAFE_CATEGORY } = App.scenario;

    const data = [
        // Try to update name of category to an existing one
        { id: FOOD_CATEGORY, name: 'Transpost' },
        // Try to submit category with empty name
        { id: FOOD_CATEGORY, name: '' },
        // Try to submit category with invalid parent
        { id: FOOD_CATEGORY, parent_id: -1 },
        // Try to submit category with itself as parent
        { id: FOOD_CATEGORY, parent_id: FOOD_CATEGORY },
        // Try to submit category with invalid transaction type
        { id: FOOD_CATEGORY, type: 100 },
        // Try to submit category with transaction type different than parent
        { id: CAFE_CATEGORY, type: INCOME },
    ];

    return App.scenario.runner.runGroup(Actions.update, data);
};

const setPos = async () => {
    setBlock('Set position', 2);

    const { SHOP_CATEGORY, LEARN_CATEGORY, INVEST_CATEGORY } = App.scenario;

    const data = [
        { id: LEARN_CATEGORY, pos: 2, parent_id: 0 },
        { id: LEARN_CATEGORY, pos: 10, parent_id: SHOP_CATEGORY },
        { id: SHOP_CATEGORY, pos: 2, parent_id: INVEST_CATEGORY },
        { id: SHOP_CATEGORY, pos: 4, parent_id: 0 },
    ];

    await App.scenario.runner.runGroup(Actions.setPos, data);
};

const setPosWithChainedRequest = async () => {
    setBlock('Set position with chained request', 2);

    const { SCV_CHAINED_CATEGORY } = App.scenario;

    const data = [{
        id: SCV_CHAINED_CATEGORY,
        pos: 5,
        parent_id: 0,
        returnState: {
            categories: { parent_id: 0 },
        },
    }];

    await App.scenario.runner.runGroup(Actions.setPos, data);
};

const setPosInvalid = async () => {
    setBlock('Set position with invalid data', 2);

    const { SHOP_CATEGORY } = App.scenario;

    const data = [
        // Invalid 'id'
        { id: 0, pos: 5, parent_id: 0 },
        // Invalid 'pos'
        { id: SHOP_CATEGORY, pos: 0, parent_id: 0 },
        // Invalid 'parent_id'
        { id: SHOP_CATEGORY, pos: 0, parent_id: -1 },
        // No 'id'
        { pos: 1, parent_id: 0 },
        // No 'pos'
        { id: SHOP_CATEGORY, parent_id: 0 },
        // No 'parent_id'
        { id: 0, pos: 5 },
        {},
        null,
    ];

    await App.scenario.runner.runGroup(Actions.setPos, data);
};

const del = async () => {
    setBlock('Delete categories', 2);

    const {
        INVEST_CATEGORY,
        SHOP_CATEGORY,
        BIKE_CATEGORY,
        LEARN_CATEGORY,
    } = App.scenario;

    await Actions.del(INVEST_CATEGORY);
    await Actions.del(SHOP_CATEGORY, false);
    await Actions.del([BIKE_CATEGORY, LEARN_CATEGORY]);
};

const delWithChainedRequest = async () => {
    setBlock('Delete categories with chained request', 2);

    const {
        SCV_CHAINED_CATEGORY,
        BEAUTY_CHAINED_CATEGORY,
    } = App.scenario;

    await Actions.del({
        id: [SCV_CHAINED_CATEGORY, BEAUTY_CHAINED_CATEGORY],
        returnState: {
            categories: {},
        },
    });
};

const delInvalid = async () => {
    setBlock('Delete categories with invalid data', 2);

    const data = [
        null,
        [],
        [null, null],
    ];

    return App.scenario.runner.runGroup(Actions.del, data);
};

export const apiCategoriesTests = {
    async createTests() {
        await create();
        await createWithChainedRequest();
        await createInvalid();
        await createMultiple();
        await createMultipleInvalid();
    },

    async listTests() {
        await read();
        await list();
    },

    async updateAndDeleteTests() {
        await update();
        await updateWithChainedRequest();
        await updateInvalid();
        await setPos();
        await setPosWithChainedRequest();
        await setPosInvalid();
        await del();
        await delWithChainedRequest();
        await delInvalid();
    },
};
