import { App } from '../../Application.js';
import { EXPENSE, INCOME } from '../../model/Transaction.js';

export const createCategories = async () => {
    const data = {
        FOOD_CATEGORY: {
            name: 'Food',
            type: EXPENSE,
        },
        INVEST_CATEGORY: {
            name: 'Investments',
            type: INCOME,
        },
        TAXES_CATEGORY: {
            name: 'Taxes',
            type: 0,
        },
        TRANSPORT_CATEGORY: {
            name: 'Transpost',
            type: EXPENSE,
        },
    };

    await App.scenario.createMultiple('category', data);

    const childData = {
        CAFE_CATEGORY: {
            name: 'Cafe',
            parent_id: App.scenario.FOOD_CATEGORY,
            type: EXPENSE,
        },
        BIKE_CATEGORY: {
            name: 'Bike rent',
            parent_id: App.scenario.TRANSPORT_CATEGORY,
            type: EXPENSE,
        },
    };

    await App.scenario.createMultiple('category', childData);
    await App.state.fetch();
};
