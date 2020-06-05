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


	async init(appInstance)
	{
	}
}
