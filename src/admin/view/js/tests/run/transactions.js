if (typeof module !== 'undefined' && module.exports)
{
	const common = require('../common.js');
	var test = common.test;
	var formatCurrency = common.formatCurrency;
	var copyObject = common.copyObject;
	var getPosById = common.getPosById;
	var getPersonByAcc = common.getPersonByAcc;

	var EXPENSE = common.EXPENSE;
	var INCOME = common.INCOME;
	var TRANSFER = common.TRANSFER;
	var DEBT = common.DEBT;

	var App = null;
}


var runTransactions = (function()
{


function onAppUpdate(props)
{
	props = props || {};

	if ('App' in props)
		App = props.App;
}



function deleteTransactions(view, type, transactions)
{
	return App.goToMainView(view)
			.then(async view =>
			{
				App.beforeDeleteTransaction = {};

				App.beforeDeleteTransaction.accounts = copyObject(await view.global('accounts'));
				App.beforeDeleteTransaction.persons = copyObject(await view.global('persons'));
				App.notify();

				return view.goToTransactions();
			})
			.then(view => view.filterByType(type))
			.then(async view =>
			{
				let trCount = view.content.transList ? view.content.transList.items.length : 0;
				App.beforeDeleteTransaction.trCount = trCount;
				App.beforeDeleteTransaction.deleteList = await Promise.all(transactions.map(trPos =>
				{
					if (trPos < 0 || trPos >= trCount)
						throw new Error('Wrong transaction position: ' + trPos);

					return view.getTransactionObject(view.content.transList.items[trPos].id);
				}));

				App.beforeDeleteTransaction.deleteList.forEach(trObj =>
				{
					if (!trObj)
						throw new Error('Transaction not found');
				});
				App.notify();

				return view.deleteTransactions(transactions);
			})
			.then(async view =>
			{
				var state = { value : { transList : { items : { length : App.transactions.length - transactions.length } } } };

				await test('Delete transactions [' + transactions.join() + ']', async () => {}, view, state);

				App.transactions = view.content.transList.items;
				App.notify();

				return view;
			})
			.then(App.goToMainView)
			.then(async view =>
			{
				let origAccounts = App.beforeDeleteTransaction.accounts;
				let origPersons = App.beforeDeleteTransaction.persons;

				// Widget changes
				var personsWidget = { infoTiles : { items : { length : App.persons.length } } };
				var accWidget = { tiles : { items : { length : App.accounts.length } } };

				let affectedAccounts = [];
				let affectedPersons = [];

				App.beforeDeleteTransaction.deleteList.forEach(tr =>
				{
					let srcAccPos, destAccPos;

					if (tr.type == EXPENSE)
					{
						let srcAccPos = getPosById(origAccounts, tr.src_id);
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
					else if (tr.type == INCOME)
					{
						let destAccPos = getPosById(origAccounts, tr.dest_id);
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
					else if (tr.type == TRANSFER)
					{
						let srcAccPos = getPosById(origAccounts, tr.src_id);
						if (srcAccPos === -1)
							throw new Error('Account ' + tr.src_id + ' not found');

						if (!(srcAccPos in affectedAccounts))
						{
							let acc = origAccounts[srcAccPos];

							affectedAccounts[srcAccPos] = { balance : acc.balance,
															name : acc.name,
															curr_id : acc.curr_id };
						}

						let destAccPos = getPosById(origAccounts, tr.dest_id);
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
					else if (tr.type == DEBT)
					{
						let personAcc_id = (tr.debtType == 1) ? tr.src_id : tr.dest_id;
						let person = getPersonByAcc(origPersons, personAcc_id);
						if (!person)
							throw new Error('Not found person with account ' + personAcc_id);

						if (!person.accounts)
							person.accounts = [];

						let personPos = getPosById(origPersons, person.id);

						if (!(personPos in affectedPersons))
						{
							affectedPersons[personPos] = { name : person.name,
															accounts : copyObject(person.accounts) };
						}

						let personAcc = affectedPersons[personPos].accounts.find(a => a.id == personAcc_id);
						if (!personAcc)
							throw new Error('Not found account of person');

						personAcc.balance += (tr.debtType == 1) ? tr.src_amount : -tr.dest_amount;

						let acc_id = (tr.debtType == 1) ? tr.dest_id : tr.src_id;
						if (acc_id)
						{
							let accPos = getPosById(origAccounts, acc_id);
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
				});


				for(let accPos in affectedAccounts)
				{
					let acc = affectedAccounts[accPos];
					fmtBal = formatCurrency(acc.balance, acc.curr_id);

					accWidget.tiles.items[accPos] = { balance : fmtBal, name : acc.name };
				}

				for(let personPos in affectedPersons)
				{
					let person = affectedPersons[personPos];

					let debtAccounts = person.accounts.reduce((val, pacc) =>
					{
						if (pacc.balance == 0)
							return val;

						let fmtBal = formatCurrency(pacc.balance, pacc.curr_id);
						return val.concat(fmtBal);
					}, []);

					let debtSubtitle = debtAccounts.length ? debtAccounts.join('\n') : 'No debts';

					personsWidget.infoTiles.items[personPos] = { title : person.name, subtitle : debtSubtitle };
				}

				var state = { values : { widgets : { length : 5, 0 : accWidget, 3 : personsWidget } } };

				await test('Delete transactions [' + transactions.join() + ']', async () => {}, view, state);

				App.transactions = view.content.widgets[2].transList.items;
				App.accounts = view.content.widgets[0].tiles.items;
				App.persons = view.content.widgets[3].infoTiles.items;
				App.notify();

				return view;
			});
}


 	return { onAppUpdate : onAppUpdate,
				del : deleteTransactions };
})();



if (typeof module !== 'undefined' && module.exports)
{
	module.exports = runTransactions;
}
