import { AccountList } from './model/AccountList.js';
import { CurrencyList } from './model/CurrencyList.js';
import { IconList } from './model/IconList.js';
import { ImportRuleList } from './model/ImportRuleList.js';
import { ImportTemplateList } from './model/ImportTemplateList.js';
import { PersonList } from './model/PersonList.js';

const HIDDEN_GROUP_TITLE = 'Hidden';

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

        const { persons } = this.model;
        // Sort persons by visibility: [...visible, ...hidden]
        persons.sort((a, b) => a.flags - b.flags);
        this.model.visiblePersons = PersonList.create(persons.getVisible());
        this.model.hiddenPersons = PersonList.create(persons.getHidden());
    }

    /** Initialize currency DropDown */
    initCurrencyList(ddlist) {
        if (!ddlist) {
            return;
        }

        window.app.model.currency.forEach(
            (curr) => ddlist.addItem({ id: curr.id, title: curr.name }),
        );
    }

    /** Initialize acconts DropDown */
    initAccountsList(ddlist) {
        if (!ddlist) {
            return;
        }

        window.app.checkUserAccountModels();

        const { visibleUserAccounts, hiddenUserAccounts } = window.app.model;

        visibleUserAccounts.forEach(
            (item) => ddlist.addItem({ id: item.id, title: item.name }),
        );
        if (hiddenUserAccounts.length === 0) {
            return;
        }

        const group = ddlist.addGroup(HIDDEN_GROUP_TITLE);
        hiddenUserAccounts.forEach(
            (item) => ddlist.addItem({
                id: item.id,
                title: item.name,
                group,
            }),
        );
    }

    /** Initialize DropDown for debt account tile */
    initPersonsList(ddlist) {
        if (!ddlist) {
            return;
        }

        window.app.checkPersonModels();

        const { visiblePersons, hiddenPersons } = window.app.model;

        visiblePersons.forEach(
            (person) => ddlist.addItem({ id: person.id, title: person.name }),
        );
        if (hiddenPersons.length === 0) {
            return;
        }

        const group = ddlist.addGroup(HIDDEN_GROUP_TITLE);
        hiddenPersons.forEach(
            (person) => ddlist.addItem({
                id: person.id,
                title: person.name,
                group,
            }),
        );
    }
}
