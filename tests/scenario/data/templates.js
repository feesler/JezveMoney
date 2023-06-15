import { App } from '../../Application.js';
import { IMPORT_DATE_LOCALE } from '../../model/ImportTemplate.js';

export const createImportTemplates = async () => {
    const data = {
        TEMPLATE_1: {
            name: 'Template_dup',
            first_row: 2,
            date_locale: IMPORT_DATE_LOCALE,
            account_amount_col: 11,
            account_curr_col: 10,
            trans_amount_col: 9,
            trans_curr_col: 8,
            date_col: 1,
            comment_col: 4,
        },
        TEMPLATE_2: {
            name: 'Template_Account',
            first_row: 3,
            date_locale: IMPORT_DATE_LOCALE,
            account_id: App.scenario.ACC_RUB,
            account_amount_col: 6,
            account_curr_col: 5,
            trans_amount_col: 4,
            trans_curr_col: 3,
            date_col: 1,
            comment_col: 2,
        },
    };

    await App.scenario.createMultiple('importtemplate', data);
    await App.state.fetch();
};
