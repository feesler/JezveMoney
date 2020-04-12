import { List } from "./list.js";
import { api } from '../api.js';


export class PersonsList extends List
{
	static async fetch()
	{
		let res = await api.person.list();

		res.forEach(item =>
		{
			delete item.createdate;
			delete item.updatedate;
		});

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
