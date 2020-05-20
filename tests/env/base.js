import { isFunction, checkPHPerrors } from '../common.js';
import { route } from '../router.js';


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
			'prop',
			'wait',
			'global',
			'click',
			'input',
			'httpReq',
			'addResult',
			'setBlock',
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


	async init(appInstance)
	{
	}
}
