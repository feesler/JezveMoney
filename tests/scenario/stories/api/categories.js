import { setBlock } from 'jezve-test';
import { App } from '../../../Application.js';
import { EXPENSE, INCOME } from '../../../model/Transaction.js';
import * as Actions from '../../actions/api/category.js';
import {
    COLOR_1,
    COLOR_10,
    COLOR_11,
    COLOR_2,
    COLOR_3,
    COLOR_4,
    COLOR_5,
    COLOR_6,
    COLOR_7,
    COLOR_8,
    COLOR_9,
} from '../../data/colors.js';

const create = async () => {
    setBlock('Create categories', 2);

    const data = {
        FOOD_CATEGORY: {
            name: 'Food',
            color: COLOR_1,
            parent_id: 0,
            type: EXPENSE,
        },
        INVEST_CATEGORY: {
            name: 'Investments',
            color: COLOR_2,
            parent_id: 0,
            type: INCOME,
        },
        TAXES_CATEGORY: {
            name: 'Taxes',
            color: COLOR_3,
            parent_id: 0,
            type: 0,
        },
        TRANSPORT_CATEGORY: {
            name: 'Transpost',
            color: COLOR_4,
            parent_id: 0,
            type: EXPENSE,
        },
        SHOP_CATEGORY: {
            name: 'Shop',
            color: COLOR_5,
            parent_id: 0,
            type: EXPENSE,
        },
    };

    await App.scenario.createOneByOne(Actions.create, data);
};

const createWithChainedRequest = async () => {
    setBlock('Create categories with chained request', 2);

    const data = {
        SCV_CHAINED_CATEGORY: {
            name: 'Services chained',
            color: COLOR_6,
            parent_id: 0,
            type: EXPENSE,
            returnState: {
                categories: {},
            },
        },
        BEAUTY_CHAINED_CATEGORY: {
            name: 'Beauty chained',
            color: COLOR_7,
            parent_id: 0,
            type: EXPENSE,
            returnState: {
                accounts: { visibility: 'visible' },
                categories: {},
            },
        },
    };

    await App.scenario.createOneByOne(Actions.create, data);
};

const createInvalid = async () => {
    setBlock('Create categories with invalid data', 2);

    const data = [{
        // Try to create category with existing name
        name: 'Food',
        color: COLOR_8,
        parent_id: 0,
        type: 0,
    }, {
        // Try to create category with existing color
        name: 'Colors',
        color: COLOR_2,
        parent_id: 0,
        type: EXPENSE,
    }, {
        // Try to create sub category with invalid type
        name: 'Subcategory',
        color: COLOR_8,
        parent_id: App.scenario.FOOD_CATEGORY,
        type: 0,
    }, {
        // Invalid data tests
        name: 'Investments',
        parent_id: 0,
    }, {
        name: 'Colors',
        color: null,
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

    const data = {
        CAFE_CATEGORY: {
            name: 'Cafe',
            color: COLOR_1,
            parent_id: App.scenario.FOOD_CATEGORY,
            type: EXPENSE,
        },
        BIKE_CATEGORY: {
            name: 'Bike rent',
            color: COLOR_4,
            parent_id: App.scenario.TRANSPORT_CATEGORY,
            type: EXPENSE,
        },
        LEARN_CATEGORY: {
            name: 'Learning',
            color: COLOR_8,
            parent_id: 0,
            type: EXPENSE,
        },
        OTHER_CATEGORY: {
            name: 'Other',
            color: COLOR_9,
            parent_id: 0,
            type: 0,
        },
    };

    await App.scenario.createMultiple(Actions, data);
};

const createMultipleWithChainedRequest = async () => {
    setBlock('Create multiple categories with chained request', 2);

    const data = {
        data: {
            MULTI_CHAINED_CATEGORY_1: {
                name: 'Multi chained 1',
                color: COLOR_10,
                parent_id: 0,
                type: EXPENSE,
            },
            MULTI_CHAINED_CATEGORY_2: {
                name: 'Multi chained 2',
                color: COLOR_11,
                parent_id: 0,
                type: EXPENSE,
            },
        },
        returnState: {
            categories: {},
        },
    };

    await App.scenario.createMultiple(Actions, data);
};

const createMultipleInvalid = async () => {
    setBlock('Create multiple categories with invalid data', 2);

    const data = [
        null,
        {},
        { data: null },
        { data: [null] },
        { data: [null, null] },
        {
            data: [{
                name: '',
                parent_id: 0,
                type: 0,
            }, {
                name: 'Invalid category 1',
                parent_id: 0,
            }],
        },
        {
            data: [{
                name: 'Invalid category 2',
                parent_id: 0,
            }, null],
        },
    ];

    await App.scenario.runner.runGroup(Actions.create, data);
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
        { id: INVEST_CATEGORY, color: COLOR_1 },
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
        // Try to update color of category with one already in use
        { id: FOOD_CATEGORY, color: COLOR_10 },
        // Try to submit category with invalid parent
        { id: FOOD_CATEGORY, parent_id: -1 },
        // Try to submit category with itself as parent
        { id: FOOD_CATEGORY, parent_id: FOOD_CATEGORY },
        // Try to submit category with invalid transaction type
        { id: FOOD_CATEGORY, type: 100 },
        // Try to submit category with transaction type different than parent
        { id: CAFE_CATEGORY, type: INCOME },
        // Try to submit category with color different than parent
        { id: CAFE_CATEGORY, color: COLOR_1 },
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
        await createMultipleWithChainedRequest();
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
