var runTransactions = (function()
{
	let App = null;
	let test = null;

	function onAppUpdate(props)
	{
		props = props || {};

		if ('App' in props)
		{
			App = props.App;
			test = App.test;
		}
	}


	async function deleteTransactions(view, type, transactions)
	{
		view.setBlock('Delete transactions [' + transactions.join() + ']', 3);

		view = await App.goToMainView(view);

		// Save accounts and persons before delete transactions
		App.beforeDeleteTransaction = {};

		App.beforeDeleteTransaction.accounts = App.copyObject(await view.global('accounts'));
		App.beforeDeleteTransaction.persons = App.copyObject(await view.global('persons'));
		App.notify();

		// Navigate to transactions view and filter by specified type of transaction
		view = await view.goToTransactions();
		view = await view.filterByType(type);

		let trCount = view.content.transList ? view.content.transList.items.length : 0;
		App.beforeDeleteTransaction.trCount = trCount;

		App.beforeDeleteTransaction.deleteList = [];
		for(let trPos of transactions)
		{
			if (trPos < 0 || trPos >= trCount)
				throw new Error('Wrong transaction position: ' + trPos);

			let trObj = await view.getTransactionObject(view.content.transList.items[trPos].id);
			if (!trObj)
				throw new Error('Transaction not found');

			App.beforeDeleteTransaction.deleteList.push(trObj);
		}

		App.notify();

		// Request view to select and delete transactions and wait for navigation
		view = await view.deleteTransactions(transactions);

		// Check count of transactions
		var state = { value : { transList : { items : { length : App.transactions.length - transactions.length } } } };		// TODO use max and calculate proper

		await test('Transactions list update', async () => {}, view, state);

		App.transactions = view.content.transList.items;
		App.notify();


		// Navigate to main view and check changes in affected accounts and persons
		view = await App.goToMainView(view);

		let origAccounts = App.beforeDeleteTransaction.accounts;
		let origPersons = App.beforeDeleteTransaction.persons;

		// Widget changes
		var personsWidget = { infoTiles : { items : { length : App.persons.length } } };
		var accWidget = { tiles : { items : { length : App.accounts.length } } };

		let affectedAccounts = [];
		let affectedPersons = [];

		for(let tr of App.beforeDeleteTransaction.deleteList)
		{
			if (tr.type == App.EXPENSE)
			{
				let srcAccPos = App.getPosById(origAccounts, tr.src_id);
				if (srcAccPos === -1)
					throw new Error('Account ' + tr.src_id + ' not found');

				if (!(srcAccPos in affectedAccounts))
				{
					let acc = origAccounts[srcAccPos];

					affectedAccounts[srcAccPos] = { balance : acc.balance,
													name : acc.name,
													curr_id : acc.curr_id };
				}

				affectedAccounts[srcAccPos].balance += tr.src_amount;
			}
			else if (tr.type == App.INCOME)
			{
				let destAccPos = App.getPosById(origAccounts, tr.dest_id);
				if (destAccPos === -1)
					throw new Error('Account ' + tr.dest_id + ' not found');

				if (!(destAccPos in affectedAccounts))
				{
					let acc = origAccounts[destAccPos];

					affectedAccounts[destAccPos] = { balance : acc.balance,
													name : acc.name,
													curr_id : acc.curr_id };
				}

				affectedAccounts[destAccPos].balance -= tr.dest_amount;
			}
			else if (tr.type == App.TRANSFER)
			{
				let srcAccPos = App.getPosById(origAccounts, tr.src_id);
				if (srcAccPos === -1)
					throw new Error('Account ' + tr.src_id + ' not found');

				if (!(srcAccPos in affectedAccounts))
				{
					let acc = origAccounts[srcAccPos];

					affectedAccounts[srcAccPos] = { balance : acc.balance,
													name : acc.name,
													curr_id : acc.curr_id };
				}

				let destAccPos = App.getPosById(origAccounts, tr.dest_id);
				if (destAccPos === -1)
					throw new Error('Account ' + tr.dest_id + ' not found');

				if (!(destAccPos in affectedAccounts))
				{
					let acc = origAccounts[destAccPos];

					affectedAccounts[destAccPos] = { balance : acc.balance,
													name : acc.name,
													curr_id : acc.curr_id };
				}

				affectedAccounts[srcAccPos].balance += tr.src_amount;
				affectedAccounts[destAccPos].balance -= tr.dest_amount;
			}
			else if (tr.type == App.DEBT)
			{
				let personAcc_id = (tr.debtType == 1) ? tr.src_id : tr.dest_id;
				let person = App.getPersonByAcc(origPersons, personAcc_id);
				if (!person)
					throw new Error('Not found person with account ' + personAcc_id);

				if (!person.accounts)
					person.accounts = [];

				let personPos = App.getPosById(origPersons, person.id);

				if (!(personPos in affectedPersons))
				{
					affectedPersons[personPos] = { name : person.name,
													accounts : App.copyObject(person.accounts) };
				}

				let personAcc = affectedPersons[personPos].accounts.find(a => a.id == personAcc_id);
				if (!personAcc)
					throw new Error('Not found account of person');

				personAcc.balance += (tr.debtType == 1) ? tr.src_amount : -tr.dest_amount;

				let acc_id = (tr.debtType == 1) ? tr.dest_id : tr.src_id;
				if (acc_id)
				{
					let accPos = App.getPosById(origAccounts, acc_id);
					if (accPos === -1)
						throw new Error('Account ' + acc_id + ' not found');

					if (!(accPos in affectedAccounts))
					{
						let acc = origAccounts[accPos];

						affectedAccounts[accPos] = { balance : acc.balance,
														name : acc.name,
														curr_id : acc.curr_id };
					}

					affectedAccounts[accPos].balance += (tr.debtType == 1) ? -tr.dest_amount : tr.src_amount;
				}
			}
		}


		for(let accPos in affectedAccounts)
		{
			let acc = affectedAccounts[accPos];
			fmtBal = App.formatCurrency(acc.balance, acc.curr_id);

			accWidget.tiles.items[accPos] = { balance : fmtBal, name : acc.name };
		}

		for(let personPos in affectedPersons)
		{
			let person = affectedPersons[personPos];

			let debtAccounts = person.accounts.reduce((val, pacc) =>
			{
				if (pacc.balance == 0)
					return val;

				let fmtBal = App.formatCurrency(pacc.balance, pacc.curr_id);
				return val.concat(fmtBal);
			}, []);

			let debtSubtitle = debtAccounts.length ? debtAccounts.join('\n') : 'No debts';

			personsWidget.infoTiles.items[personPos] = { title : person.name, subtitle : debtSubtitle };
		}

		var state = { values : { widgets : { length : 5, 0 : accWidget, 3 : personsWidget } } };

		await test('Acounts and persons update', async () => {}, view, state);

		App.transactions = view.content.widgets[2].transList.items;
		App.accounts = view.content.widgets[0].tiles.items;
		App.persons = view.content.widgets[3].infoTiles.items;
		App.notify();

		return view;
	}


 	return { onAppUpdate : onAppUpdate,
				del : deleteTransactions };
})();



if (typeof module !== 'undefined' && module.exports)
{
	module.exports = runTransactions;
}
