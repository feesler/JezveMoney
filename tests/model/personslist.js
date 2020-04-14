import { List } from "./list.js";
import { api } from '../api.js';


export class PersonsList extends List
{
	async fetch()
	{
		return api.person.list();
	}


	filterData()
	{
		this.data.forEach(item =>
		{
			delete item.createdate;
			delete item.updatedate;
		});
	}


	clone()
	{
		let res = new PersonsList(this.data);
		res.autoincrement = this.autoincrement;

		return res;
	}


	findByName(name, caseSens = false)
	{
		let lookupName;

		if (caseSens)
		{
			lookupName = name;
			return this.data.find(item => item.name == lookupName);
		}
		else
		{
			lookupName = name.toLowerCase();
			return this.data.find(item => item.name.toLowerCase() == lookupName);
		}
	}
}
