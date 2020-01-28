import { isFunction } from '../common.js';


class Environment
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
}


export { Environment };
