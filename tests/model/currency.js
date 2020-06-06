import { normalize, formatValue } from '../common.js';
import { api } from './api.js';


// Currency object
export class Currency
{
	constructor(props)
	{
		for(let key in props)
		{
			let thisKey = (key == 'format') ? 'flags' : key;

			this[thisKey] = props[key];
		}
	}


	// Format specified value using rules of currency
	format(val)
	{
		let nval = normalize(val);

		if (Math.floor(nval) != nval)
			nval = nval.toFixed(2);

		let fmtVal = formatValue(nval);

		if (this.flags)
			return this.sign + ' ' + fmtVal;
		else
			return fmtVal + ' ' + this.sign;
	}


	static currencies = null;


	static async getList()
	{
		if (!Array.isArray(this.currencies))
		{
			let apiResult = await api.currency.list();
			this.currencies = apiResult.map(item => new Currency(item));
		}

		return this.currencies;
	}


	static async init()
	{
		await this.getList();
	}


	// Return currency object for specified id
	static getById(curr_id)
	{
		if (!this.currencies)
			throw new Error('List of currencies not initialized');

		let currObj = this.currencies.find(item => item.id == curr_id);
		if (!currObj)
			return null;

		return currObj;
	}


	static findByName(name)
	{
		if (!this.currencies)
			throw new Error('List of currencies not initialized');

		let qName = name.toUpperCase();
		let currObj = this.currencies.find(item => item.name.toUpperCase() == qName);
		if (!currObj)
			return null;

		return currObj;
	}


	// Format curency value without access to the instance of class
	static format(curr_id, val)
	{
		if (!this.currencies)
			throw new Error('List of currencies not initialized');

		let currObj = this.currencies.find(item => item.id == curr_id);
		if (!currObj)
			throw new Error(`Currency ${curr_id} not found`);

		return currObj.format(val);
	}
}

