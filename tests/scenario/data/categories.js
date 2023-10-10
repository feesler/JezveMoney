import { App } from '../../Application.js';
import { EXPENSE, INCOME } from '../../model/Transaction.js';
import {
    COLOR_1,
    COLOR_2,
    COLOR_3,
    COLOR_4,
} from './colors.js';

export const createCategories = async () => {
    const data = {
        FOOD_CATEGORY: {
            name: 'Food',
            color: COLOR_1,
            type: EXPENSE,
        },
        INVEST_CATEGORY: {
            name: 'Investments',
            color: COLOR_2,
            type: INCOME,
        },
        TAXES_CATEGORY: {
            name: 'Taxes',
            color: COLOR_3,
            type: 0,
        },
        TRANSPORT_CATEGORY: {
            name: 'Transpost',
            color: COLOR_4,
            type: EXPENSE,
        },
    };

    await App.scenario.createMultiple('category', data);

    const childData = {
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
    };

    await App.scenario.createMultiple('category', childData);
    await App.state.fetch();
};
