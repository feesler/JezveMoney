import {
    TestApplication,
    setupTest,
    assert,
    formatDate,
} from 'jezve-test';
import { api } from './model/api.js';
import { config } from './config.js';
import { AppState } from './model/AppState.js';
import { Scenario } from './scenario/index.js';
import { CurrencyList } from './model/CurrencyList.js';
import { IconsList } from './model/IconsList.js';

class Application extends TestApplication {
    constructor() {
        super();

        this.config = config;
        this.user_id = null;
    }

    async init() {
        this.state = new AppState();

        this.scenario = await Scenario.create(this.environment);

        this.dates = {};
        this.dateList = [];

        const now = new Date();
        this.dates.now = formatDate(now);
        this.dates.monthAgo = formatDate(
            new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()),
        );
        this.dates.weekAgo = formatDate(
            new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7),
        );
        this.dates.weekAfter = formatDate(
            new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7),
        );
        this.dates.yesterday = formatDate(
            new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1),
        );
        this.dates.yearAgo = formatDate(
            new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()),
        );

        this.dateList.push(...Object.values(this.dates));

        setupTest(this.environment);
    }

    async setupUser() {
        const userProfile = await api.profile.read();
        assert(userProfile?.user_id, 'Fail to read user profile');

        this.user_id = userProfile.user_id;
        this.owner_id = userProfile.owner_id;

        this.state = new AppState();
        await this.state.fetch();
        this.currency = await CurrencyList.create();
        this.icons = await IconsList.create();
    }

    async startTests() {
        await this.scenario.run();
    }

    async goToMainView() {
        if (this.view) {
            await this.view.goToMainView();
        } else {
            await this.environment.goTo(this.environment.baseUrl());
        }
    }
}

export const App = new Application();
