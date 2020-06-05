import { isFunction, checkPHPerrors } from '../common.js';
import { route } from '../router.js';


export function visibilityResolver(elem, recursive)
{
	let robj = elem;
	while(robj && robj.nodeType && robj.nodeType != 9)
	{
		if (!robj.style || robj.style.display == 'none' || robj.style.visibility == 'hidden')
			return false;

		if (recursive !== true)
			break;

		robj = robj.parentNode;
	}

	return !!robj;
}


export class Environment
{
	constructor()
	{
		this.app = null;
		this.results = null;

		this.interface = [
			'baseUrl',
			'url',
			'navigation',
			'goTo',
			'parent',
			'query',
			'queryAll',
			'hasClass',
			'isVisible',
			'selectByValue',
			'onChange',
			'onBlur',
			'prop',
			'waitForSelector',
			'waitForFunction',
			'wait',
			'timeout',
			'global',
			'click',
			'input',
			'httpReq',
			'addResult',
			'setBlock',
			'setDuration',
			'getContent',
		];
	}


	inject(target)
	{
		if (!this.app)
			throw new Error('Environment is not initialized');

		for(let method of this.interface)
		{
			if (!isFunction(this[method]))
				throw new Error(`Method ${method} not implemented`);

			target[method] = this[method].bind(this);
		}
	}


	async onNavigate()
	{
		let content = await this.getContent();

		checkPHPerrors(content);

		let viewClass = await route(this, await this.url());

		this.app.view = new viewClass({ environment : this });
		await this.app.view.parse();
	}


	async wait(condition, options)
	{
		if (typeof condition === 'string')
			return this.waitForSelector(condition, options);
		else if (isFunction(condition))
			return this.waitForFunction(condition, options);
		else
			throw new Error('Invalid type of condition');
	}


	// Wait for specified function until it return truly result or throw by timeout
	async waitForFunction(condition, options = {})
	{
		if (!options)
			throw new Error('Invalid options specified');
		if (!isFunction(condition))
			throw new Error('Invalid options specified');

		return this.waitFor(async () =>
		{
			let res = await condition();

			if (res)
				return { value : res };
			else
				return false;
		}, options);
	}


	async waitFor(conditionFunc, options = {})
	{
		const {
			timeout = 30000,
			polling = 200,
		} = options;

		return new Promise((resolve, reject) =>
		{
			let qTimer = 0;
			let limit = setTimeout(() =>
			{
				if (qTimer)
					clearTimeout(qTimer);
				reject('Wait timeout');
			}, timeout);

			async function queryCondition(condition)
			{
				let res = await condition();

				if (res)
				{
					clearTimeout(limit);
					resolve(res.value);
				}
				else
				{
					qTimer = setTimeout(() => queryCondition(condition), polling);
				}
			}

			queryCondition.call(this, conditionFunc);
		});
	}


	async timeout(ms)
	{
		let delay = parseInt(ms);
		if (isNaN(delay))
			throw new Error('Invalid timeout specified');

		return new Promise(resolve =>
		{
			setTimeout(resolve, delay);
		});
	}


	async init(appInstance)
	{
	}
}
