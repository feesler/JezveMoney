import { App } from '../../Application.js';
import { api } from '../../model/api.js';
import { EXPENSE, INCOME } from '../../model/Transaction.js';

export const createCategories = async () => {
    const categoriesList = [{
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

    const createRes = await api.category.createMultiple(categoriesList);
    [
        App.scenario.FOOD_CATEGORY,
        App.scenario.INVEST_CATEGORY,
        App.scenario.TAXES_CATEGORY,
        App.scenario.TRANSPORT_CATEGORY,
    ] = createRes.ids;

    const childCategories = [{
        name: 'Cafe',
        parent_id: App.scenario.FOOD_CATEGORY,
        type: EXPENSE,
    }, {
        name: 'Bike rent',
        parent_id: App.scenario.TRANSPORT_CATEGORY,
        type: 0,
    }];

    const childRes = await api.category.createMultiple(childCategories);
    [
        App.scenario.CAFE_CATEGORY,
        App.scenario.BIKE_CATEGORY,
    ] = childRes.ids;

    await App.state.fetch();
};
