// Decompress array of persons
function decompressPersons()
{
	var decPersons = [];

	if (!persons)
		return;

	persons.forEach(function(person)
	{
		var decAcc = [];

		person[2].forEach(function(pAcc)
		{
			decAcc.push({
				id : pAcc[0],
				curr_id : pAcc[1],
				balance : pAcc[2]
			});
		});

		decPersons.push({
			id : person[0],
			name : person[1],
			accounts : decAcc
		});
	});

	persons = decPersons;
}


// Return object for specified person
function getPerson(person_id)
{
	var pObj = null, p_id;

	p_id = parseInt(person_id);
	if (!persons || !p_id)
		return null;

	persons.some(function(person)
	{
		var cond = (person.id == p_id);

		if (cond)
			pObj = person;

		return cond;
	});

	return pObj;
}


// Return person account object by id
function findPersonAccountById()
{
	var resAcc = null;

	account_id = parseInt(account_id);
	if (!account_id)
		return resAcc;

	persons.some(function(p)
	{
		return p.accounts.some(function(acc)
		{
			var cond = (acc.id == account_id);

			if (cond)
				resAcc = acc;

			return cond;
		});
	});

	return resAcc;
}


// Return balance of current person in specified currency
function getPersonAccount(person_id, curr_id)
{
	var person, resAcc = null;

	person = getPerson(person_id);
	if (!person || !person.accounts || !curr_id)
		return resAcc;

	// check person have account in specified currency
	person.accounts.some(function(acc)
	{
		var cond = (acc.curr_id == curr_id);

		if (cond)
			resAcc = acc;

		return cond;
	});

	return resAcc;
}
