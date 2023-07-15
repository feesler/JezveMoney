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
    cutDate,
    dateStringToSeconds,
    dateToSeconds,
    fixDate,
    formatInputDate,
    reformatDate,
    secondsToDateString,
    shiftDate,
    shiftMonth,
    shiftYear,
} from './common.js';

class Application extends TestApplication {
    dates = {
        get now() {
            return new Date(cutDate(new Date()));
        },

        get monthAgo() {
            return shiftMonth(this.now, -1);
        },

        get monthAfter() {
            return shiftMonth(this.now, 1);
        },

        get weekAgo() {
            return shiftDate(this.now, -7);
        },

        get weekAfter() {
            return shiftDate(this.now, 7);
        },

        get yesterday() {
            return shiftDate(this.now, -1);
        },

        get tomorrow() {
            return shiftDate(this.now, 1);
        },

        get yearAgo() {
            return shiftYear(this.now, -1);
        },

        get yearAfter() {
            return shiftYear(this.now, 1);
        },
    };

    constructor() {
        super();

        this.config = config;
        this.user_id = null;
    }

    async init() {
        this.state = new AppState();

        this.scenario = await Scenario.create(this.environment);

        this.dateFormatOptions = {
            dateStyle: 'short',
        };
        this.decimalFormatOptions = {
            style: 'decimal',
        };

        this.datesFmt = {};
        this.datesSec = {};
        const self = this;

        Object.keys(this.dates).forEach((key) => {
            Object.defineProperty(this.datesFmt, key, {
                get() {
                    return self.formatDate(self.dates[key]);
                },
            });

            Object.defineProperty(this.datesSec, key, {
                get() {
                    return dateToSeconds(self.dates[key]);
                },
            });
        });
    }

    isValidDateString(value) {
        return isValidDateString(value, {
            locales: this.state.getDateFormatLocale(),
            options: this.dateFormatOptions,
        });
    }

    formatDate(date, params = {}) {
        return formatDate(date, {
            locales: this.state.getDateFormatLocale(),
            options: this.dateFormatOptions,
            ...params,
        });
    }

    formatInputDate(date) {
        return formatInputDate(date, {
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

    dateStringToSeconds(value) {
        return dateStringToSeconds(value, {
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

    getTimezoneOffset() {
        const date = new Date();
        return date.getTimezoneOffset();
    }

    async setupUser() {
        const userProfile = await api.profile.read();
        assert(userProfile?.user_id, 'Fail to read user profile');

        this.user_id = userProfile.user_id;
        this.owner_id = userProfile.owner_id;

        this.state = new AppState();
        await this.state.fetch();

        await this.updateTimezone();

        this.currency = await CurrencyList.create();
        this.icons = await IconsList.create();
    }

    async updateTimezone() {
        const tzOffset = this.state.getTimezoneOffset();
        const currentTzOffset = this.getTimezoneOffset();
        if (tzOffset === currentTzOffset) {
            return;
        }

        await api.profile.updateSettings({
            tz_offset: currentTzOffset,
        });
        await this.state.fetch();
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
