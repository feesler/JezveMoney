// Return object for specified person
function getPerson(person_id)
{
	return idSearch(persons, person_id);
}


function isVisiblePerson(person)
{
	if (!person || !('flags' in person))
		throw new Error('Invalid person');

	return (person.flags & PERSON_HIDDEN) == 0;
}


function isHiddenPerson(person)
{
	if (!person || !('flags' in person))
		throw new Error('Invalid person');

	return (person.flags & PERSON_HIDDEN) == PERSON_HIDDEN;
}


// Return person account object by id
function findPersonAccountById(account_id)
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
