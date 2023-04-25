import {
    TestApplication,
    assert,
    formatDate,
    isValidDateString,
} from 'jezve-test';
import { api } from './model/api.js';
import { config } from './config.js';
import { AppState } from './model/AppState.js';
import { Scenario } from './scenario/index.js';
import { CurrencyList } from './model/CurrencyList.js';
import { IconsList } from './model/IconsList.js';
import {
    dateToSeconds,
    fixDate,
    reformatDate,
    secondsToDateString,
} from './common.js';

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
            dateStyle: 'short',
        };
        this.decimalFormatOptions = {
            style: 'decimal',
        };

        this.datesFmt = {
            get now() {
                return self.formatDate(self.dates.now);
            },

            get monthAgo() {
                return self.formatDate(self.dates.monthAgo);
            },

            get weekAgo() {
                return self.formatDate(self.dates.weekAgo);
            },

            get weekAfter() {
                return self.formatDate(self.dates.weekAfter);
            },

            get yesterday() {
                return self.formatDate(self.dates.yesterday);
            },

            get yearAgo() {
                return self.formatDate(self.dates.yearAgo);
            },
        };

        this.datesSec = {};
        Object.keys(this.dates).forEach((key) => {
            this.datesSec[key] = dateToSeconds(this.dates[key]);
        });

        this.dateSecList = Object.values(this.datesSec);
    }

    isValidDateString(value) {
        return isValidDateString(value, {
            locales: this.state.getDateFormatLocale(),
            options: this.dateFormatOptions,
        });
    }

    formatDate(date) {
        return formatDate(date, {
            locales: this.state.getDateFormatLocale(),
            options: this.dateFormatOptions,
        });
    }

    reformatDate(date) {
        return reformatDate(date, {
            locales: this.state.getDateFormatLocale(),
            options: this.dateFormatOptions,
        });
    }

    secondsToDateString(value) {
        return secondsToDateString(value, {
            locales: this.state.getDateFormatLocale(),
            options: this.dateFormatOptions,
        });
    }

    parseDate(date) {
        return fixDate(date, {
            locales: this.state.getDateFormatLocale(),
            options: this.dateFormatOptions,
        });
    }

    formatNumber(value, params = {}) {
        const locales = params?.locales ?? this.state.getDecimalFormatLocale();
        const options = params?.options ?? this.decimalFormatOptions;

        const formatter = new Intl.NumberFormat(locales, options);
        return formatter.format(value);
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
