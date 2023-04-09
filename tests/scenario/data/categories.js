import { App } from '../../Application.js';
import { api } from '../../model/api.js';
import { EXPENSE, INCOME } from '../../model/Transaction.js';

export const createCategories = async () => {
    const categoriesList = [{
        name: 'Food',
        type: EXPENSE,
    }, {
        name: 'Investments',
        type: INCOME,
    }, {
        name: 'Taxes',
        type: 0,
    }, {
        name: 'Transpost',
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
        type: EXPENSE,
    }];

    const childRes = await api.category.createMultiple(childCategories);
    [
        App.scenario.CAFE_CATEGORY,
        App.scenario.BIKE_CATEGORY,
    ] = childRes.ids;

    await App.state.fetch();
};
