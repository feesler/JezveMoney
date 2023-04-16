import {
    TestApplication,
    assert,
    formatDate,
} from 'jezve-test';
import { api } from './model/api.js';
import { config } from './config.js';
import { AppState } from './model/AppState.js';
import { Scenario } from './scenario/index.js';
import { CurrencyList } from './model/CurrencyList.js';
import { IconsList } from './model/IconsList.js';
import { dateToSeconds } from './common.js';

class Application extends TestApplication {
    constructor() {
        super();

        this.config = config;
        this.user_id = null;
    }

    async init() {
        this.state = new AppState();

        this.scenario = await Scenario.create(this.environment);

        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const day = now.getDate();
        this.dates = {
            now,
            monthAgo: new Date(year, month - 1, day),
            weekAgo: new Date(year, month, day - 7),
            weekAfter: new Date(year, month, day + 7),
            yesterday: new Date(year, month, day - 1),
            yearAgo: new Date(year - 1, month, day),
        };

        const self = this;
        this.dateFormatOptions = {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        };

        this.datesFmt = {
            get now() {
                return formatDate(self.dates.now, self.view.locale, self.dateFormatOptions);
            },

            get monthAgo() {
                return formatDate(self.dates.monthAgo, self.view.locale, self.dateFormatOptions);
            },

            get weekAgo() {
                return formatDate(self.dates.weekAgo, self.view.locale, self.dateFormatOptions);
            },

            get weekAfter() {
                return formatDate(self.dates.weekAfter, self.view.locale, self.dateFormatOptions);
            },

            get yesterday() {
                return formatDate(self.dates.yesterday, self.view.locale, self.dateFormatOptions);
            },

            get yearAgo() {
                return formatDate(self.dates.yearAgo, self.view.locale, self.dateFormatOptions);
            },
        };

        this.datesSec = {};
        Object.keys(this.dates).forEach((key) => {
            this.datesSec[key] = dateToSeconds(this.dates[key]);
        });

        this.dateSecList = Object.values(this.datesSec);
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
