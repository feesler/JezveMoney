import { formatDate, setupTest } from './common.js';
import { api } from './api.js';
import { config } from './config.js';
import { AppState } from './state.js';
import { Currency } from './model/currency.js';
import { Scenario } from './scenario.js';


class Application
{
	constructor()
	{
		this.config = config;
		this.user_id = null;
	}


	async init()
	{
		// Login and obtain profile information
		let loginResult = await api.user.login(this.config.testUser);
		if (!loginResult)
			throw new Error('Fail to login');

		let userProfile = await api.profile.read();
		if (!userProfile || !userProfile.user_id)
			throw new Error('Fail to read user profile');

		this.user_id = userProfile.user_id;
		this.owner_id = userProfile.owner_id;

		this.state = new AppState;
		await this.state.fetch();
		await Currency.init();

		this.scenario = await Scenario.create(this.environment);

		this.dates = {};
		this.dateList = [];

		let now = new Date();
		this.dates.now = formatDate(now);
		this.dates.monthAgo = formatDate(new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()));
		this.dates.weekAgo = formatDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7));
		this.dates.weekAfter = formatDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7));
		this.dates.yesterday = formatDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
		this.dates.yearAgo = formatDate(new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()));

		this.dateList.push(...Object.values(this.dates));

		let firstDay = Date.UTC(now.getFullYear(), now.getMonth(), 1);
		this.dates.startDate = (now.getDate() > 7) ? this.dates.weekAgo : firstDay;

		setupTest(this.environment);
	}


	beforeRun()
	{
		this.startTime = Date.now();
	}


	afterRun()
	{
		const SECOND = 1000;
		const MINUTE = 60000;
		const HOUR = 3600000;

		let testsDuration = Date.now() - this.startTime;
		let hours = Math.floor(testsDuration / HOUR);
		let minutes = Math.floor((testsDuration % HOUR) / MINUTE);
		let seconds = Math.floor((testsDuration % MINUTE) / SECOND);

		let timeTitle = [];
		if (hours > 0)
			timeTitle.push(hours + 'h');
		if (minutes > 0)
			timeTitle.push(minutes + 'm');
		timeTitle.push(seconds + 's');

		console.log('Duration of tests: ' + timeTitle.join(' '));
	}


	async startTests()
	{
		this.beforeRun();

		await this.scenario.run();

		this.afterRun();
	}


	async goToMainView()
	{
		await this.view.goToMainView();
	}
}


export const App = new Application;
