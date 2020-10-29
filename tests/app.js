import { formatDate, setupTest } from './common.js';
import { api } from './model/api.js';
import { config } from './config.js';
import { AppState } from './model/state.js';
import { Currency } from './model/currency.js';
import { Icon } from './model/icon.js';
import { Scenario } from './scenario.js';

class Application {
    constructor() {
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
        if (!userProfile || !userProfile.user_id) {
            throw new Error('Fail to read user profile');
        }

        this.user_id = userProfile.user_id;
        this.owner_id = userProfile.owner_id;

        this.state = new AppState();
        await this.state.fetch();
        await Currency.init();
        await Icon.init();
    }

    beforeRun() {
        this.startTime = Date.now();
    }

    afterRun() {
        const testsDuration = Date.now() - this.startTime;

        this.environment.setDuration(testsDuration);
    }

    async startTests() {
        this.beforeRun();

        await this.scenario.run();

        this.afterRun();
    }

    async goToMainView() {
        await this.view.goToMainView();
    }
}

export const App = new Application();
