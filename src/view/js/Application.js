import { AccountList } from './model/AccountList.js';
import { CurrencyList } from './model/CurrencyList.js';
import { IconList } from './model/IconList.js';
import { ImportRuleList } from './model/ImportRuleList.js';
import { ImportTemplateList } from './model/ImportTemplateList.js';
import { PersonList } from './model/PersonList.js';

export class Application {
    constructor(props = {}) {
        this.props = { ...props };

        // Setup view properties
        if (!this.props.view) {
            this.props.view = {};
        }

        // Setup models
        this.model = {};

        if (this.props.profile) {
            this.model.profile = { ...this.props.profile };
        }

        if (this.props.currency) {
            this.model.currency = CurrencyList.create(this.props.currency);
        }

        if (this.props.icons) {
            this.model.icons = IconList.create(this.props.icons);
        }

        if (this.props.accounts) {
            this.model.accounts = AccountList.create(this.props.accounts);
        }

        if (this.props.persons) {
            this.model.persons = PersonList.create(this.props.persons);
        }

        if (this.props.rules) {
            this.model.rules = ImportRuleList.create(this.props.rules);
        }

        if (this.props.templates) {
            this.model.templates = ImportTemplateList.create(this.props.templates);
        }
    }

    createView(ViewClass) {
        this.view = new ViewClass(this.props.view);
    }

    get baseURL() {
        return this.props.baseURL;
    }

    get themes() {
        return this.props.themes;
    }

    get message() {
        return this.props.message;
    }

    checkUserAccountModels() {
        if (this.model.userAccounts) {
            return;
        }

        const userAccounts = AccountList.create(
            this.model.accounts.getUserAccounts(this.model.profile.owner_id),
        );
        // Sort user accounts by visibility: [...visible, ...hidden]
        userAccounts.sort((a, b) => a.flags - b.flags);
        this.model.userAccounts = userAccounts;
        this.model.visibleUserAccounts = AccountList.create(userAccounts.getVisible());
        this.model.hiddenUserAccounts = AccountList.create(userAccounts.getHidden());
    }

    checkPersonModels() {
        if (this.model.visiblePersons) {
            return;
        }

        const personsList = PersonList.create(this.model.persons.data);
        // Sort persons by visibility: [...visible, ...hidden]
        personsList.sort((a, b) => a.flags - b.flags);
        this.model.visiblePersons = PersonList.create(personsList.getVisible());
        this.model.hiddenPersons = PersonList.create(personsList.getHidden());
    }
}
