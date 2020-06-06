export class Component
{
	constructor(parent, elem)
	{
		if (!parent)
			throw new Error('Invalid parent specified');
		if (!elem)
			throw new Error('Invalid element specified');

		this.elem = elem;
		this.parent = parent;

		this.environment = parent.environment;
		if (this.environment)
			this.environment.inject(this);
	}


	async parse()
	{
		throw new Error('Not implemented');
	}


	static async create(...args)
	{
		let instance = new this(...args);
		await instance.parse();
		return instance;
	}


	parseId(id)
	{
		if (typeof id !== 'string')
			return id;

		let pos = id.indexOf('_');
		return (pos != -1) ? parseInt(id.substr(pos + 1)) : id;
	}
}


export class NullableComponent extends Component
{
	static async create(...args)
	{
		if (args.length < 2 || !args[1])
			return null;

		return super.create(...args);
	}
}
