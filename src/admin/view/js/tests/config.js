var config =
{
/*	url : 'https://jezve.net/money/'	*/
	url : 'http://testsrv:8096/',
	testUser : { login : 'test', password : 'test' },
	testsExpected : 647
};


if (typeof module !== 'undefined' && module.exports)
{
	module.exports = config;
}
