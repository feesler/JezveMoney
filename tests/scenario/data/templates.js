import { api } from '../../model/api.js';
import { App } from '../../Application.js';

export const createImportTemplates = async () => {
    const data = [{
        name: 'Template_dup',
        first_row: 2,
        account_amount_col: 11,
        account_curr_col: 10,
        trans_amount_col: 9,
        trans_curr_col: 8,
        date_col: 1,
        comment_col: 4,
    }, {
        name: 'Template_Account',
        first_row: 3,
        account_id: App.scenario.ACC_RUB,
        account_amount_col: 6,
        account_curr_col: 5,
        trans_amount_col: 4,
        trans_curr_col: 3,
        date_col: 1,
        comment_col: 2,
    }];

    await api.importtemplate.createMultiple(data);

    await App.state.fetch();
};
