<?php	include(ADMIN_TPL_PATH."commonhdr.tpl");	?>
<script>
onReady(initControls);
</script>
</head>
<body>
<div class="page">
	<div class="page_wrapper">
<?php	include(ADMIN_TPL_PATH."header.tpl");	?>

		<div class="container">
			<div class="content">
				<div class="content_wrap admin_cont_wrap">
					<h1>API test</h1>

					<div class="left_column">
						<ul id="controllersList" class="cont_list">
							<li class="active">
								<button>Accounts</button>
								<ul class="sub_list">
									<li data-target="getAccForm" class="active">Get accounts</li>
									<li data-target="readAccForm">Read account</li>
									<li data-target="createAccForm">Create account</li>
									<li data-target="editAccForm">Edit account</li>
									<li data-target="delAccForm">Delete account</li>
									<li data-target="resetAccForm">Reset accounts</li>
								</ul>
							</li>

							<li>
								<button>Transactions</button>
								<ul class="sub_list">
									<li data-target="getTrForm">Get transactions</li>
									<li data-target="readTrForm">Read transaction</li>
									<li data-target="createTrForm">Create transaction</li>
									<li data-target="createDebtForm">Create debt</li>
									<li data-target="editTrForm">Edit transaction</li>
									<li data-target="editDebtForm">Edit debt</li>
									<li data-target="delTrForm">Delete transactions</li>
									<li data-target="setTrPosForm">Set position of transacction</li>
								</ul>
							</li>

							<li>
								<button>Persons</button>
								<ul class="sub_list">
									<li data-target="getPersonsForm">Get persons</li>
									<li data-target="readPersonForm">Read person</li>
									<li data-target="createPersonForm">Create person</li>
									<li data-target="editPersonForm">Edit person</li>
									<li data-target="delPersonForm">Delete persons</li>
								</ul>
							</li>

							<li>
								<button>Currency</button>
								<ul class="sub_list">
									<li data-target="getCurrForm">Get currencies</li>
									<li data-target="readCurrForm">Read currency</li>
								</ul>
							</li>

							<li>
								<button>User</button>
								<ul class="sub_list">
									<li data-target="loginForm">Login</li>
									<li data-target="logoutForm">Logout</li>
									<li data-target="registerForm">Register</li>
								</ul>
							</li>

							<li>
								<button>Profile</button>
								<ul class="sub_list">
									<li data-target="readProfileForm">Read profile</li>
									<li data-target="changeNameForm">Change name</li>
									<li data-target="changePwdForm">Change password</li>
									<li data-target="resetAllForm">Reset all data</li>
								</ul>
							</li>
						</ul>
					</div>

					<div class="center_column">
						<div id="getAccForm" class="test_form active">
						<h3>Get accounts</h3>
						<form action="<?=BASEURL?>api/account/list" method="get">
							<div class="acc_controls">
								<input class="adm_act_btn" type="submit" value="submit">
							</div>
						</form>
						</div>

						<div id="readAccForm" class="test_form">
						<h3>Read account</h3>
						<div class="std_margin"><label for="readaccid">Id</label><input id="readaccid" type="text"></div>
						<div class="acc_controls">
							<input id="readaccbtn" class="adm_act_btn" type="button" value="submit">
						</div>
						</div>

						<div id="createAccForm" class="test_form">
						<h3>Create account</h3>
						<div class="std_margin">
							<label for="accname">Name</label>
							<input id="accname" type="text">
						</div>
						<div class="std_margin">
							<label for="accbalance">Balance</label>
							<input id="accbalance" type="text">
						</div>
						<div class="std_margin">
							<label for="acccurrency">Currency (1-5, 10-22)</label>
							<input id="acccurrency" type="text">
						</div>
						<div class="std_margin">
							<label for="accicon">Icon (1-6; 0 - no icon)</label>
							<input id="accicon" type="text">
						</div>
						<div class="acc_controls">
							<input id="accbtn" class="adm_act_btn" type="button" value="submit">
						</div>
						</div>

						<div id="editAccForm" class="test_form">
						<h3>Edit account</h3>
						<div class="std_margin">
							<label for="updaccid">Id</label>
							<input id="updaccid" type="text">
						</div>
						<div class="std_margin">
							<label for="accname">Name</label>
							<input id="updaccname" type="text">
						</div>
						<div class="std_margin">
							<label for="balance">Balance</label>
							<input id="updaccbalance" type="text">
						</div>
						<div class="std_margin">
							<label for="currency">Currency (1-5, 10-22)</label>
							<input id="updacccurrency" type="text">
						</div>
						<div class="std_margin">
							<label for="icon">Icon (1-6; 0 - no icon)</label>
							<input id="updaccicon" type="text">
						</div>
						<div class="acc_controls">
							<input id="updaccbtn" class="adm_act_btn" type="button" value="submit">
						</div>
						</div>

						<div id="delAccForm" class="test_form">
						<h3>Delete account</h3>
						<div class="std_margin">
							<label for="delaccounts">Accounts (comma separated ids)</label>
							<input id="delaccounts" type="text">
						</div>
						<div class="acc_controls">
							<input id="delaccbtn" class="adm_act_btn" type="button" value="submit">
						</div>
						</div>

						<div id="resetAccForm" class="test_form">
						<h3>Reset accounts</h3>
						<form action="<?=BASEURL?>api/account/reset" method="post">
							<div class="acc_controls">
								<input class="adm_act_btn" type="submit" value="submit">
							</div>
						</form>
						</div>

						<div id="getTrForm" class="test_form">
						<h3>Get transactions</h3>
						<form action="<?=BASEURL?>api/transaction/list" method="get">
							<div class="std_margin">
								<input type="checkbox" onchange="onCheck(this, 'count');"><label for="count">Max. count</label>
								<input name="count" type="text" value="10" disabled>
							</div>
							<div class="std_margin">
								<input type="checkbox" onchange="onCheck(this, 'page');"><label for="page">Page number</label>
								<input name="page" type="text" value="0" disabled>
							</div>
							<div class="std_margin">
								<input type="checkbox" onchange="onCheck(this, 'acc_id');"><label for="acc_id">Account id (0 for all accounts)</label>
								<input name="acc_id" type="text" value="0" disabled>
							</div>
							<div class="std_margin">
								<input type="checkbox" onchange="onCheck(this, 'stdate');"><label for="stdate">Start date</label>
								<input name="stdate" type="text" value="" disabled>
							</div>
							<div class="std_margin">
								<input type="checkbox" onchange="onCheck(this, 'enddate');"><label for="enddate">End date</label>
								<input name="enddate" type="text" value="" disabled>
							</div>
							<div class="std_margin">
								<input type="checkbox" onchange="onCheck(this, 'search');"><label for="search">Search request</label>
								<input name="search" type="text" value="" disabled>
							</div>
							<div class="acc_controls">
								<input class="adm_act_btn" type="submit" value="submit">
							</div>
						</form>
						</div>

						<div id="readTrForm" class="test_form">
						<h3>Read transaction</h3>
						<div class="std_margin">
							<label for="readtransid">Id</label>
							<input id="readtransid" type="text">
						</div>
						<div class="acc_controls">
							<input id="readtransbtn" class="adm_act_btn" type="button" value="submit">
						</div>
						</div>

						<div id="createTrForm" class="test_form">
						<h3>Create transaction</h3>
						<form action="<?=BASEURL?>api/transaction/create" method="post">
							<div class="std_margin">
								<label for="transtype">Type (1-3)</label>
								<input name="transtype" type="text">
							</div>
							<div class="std_margin">
								<label for="src_id">Source account</label>
								<input name="src_id" type="text">
							</div>
							<div class="std_margin">
								<label for="dest_id">Destination account</label>
								<input name="dest_id" type="text">
							</div>
							<div class="std_margin">
								<label for="src_amount">Source amount</label>
								<input name="src_amount" type="text">
							</div>
							<div class="std_margin">
								<label for="dest_amount">Destination amount</label>
								<input name="dest_amount" type="text">
							</div>

							<div class="std_margin">
								<label for="src_curr">Source currency</label>
								<input name="src_curr" type="text">
							</div>
							<div class="std_margin">
								<label for="dest_curr">Destination currency</label>
								<input name="dest_curr" type="text">
							</div>

							<div class="std_margin">
								<label for="date">Date</label>
								<input name="date" type="text">
							</div>

							<div class="std_margin">
								<label for="comm">Comment</label>
								<input name="comm" type="text">
							</div>

							<div class="acc_controls">
								<input class="adm_act_btn" type="submit" value="submit">
							</div>
						</form>
						</div>

						<div id="createDebtForm" class="test_form">
						<h3>Create debt</h3>
						<form action="<?=BASEURL?>api/transaction/create" method="post">
							<input name="transtype" type="hidden" value="4">
							<div class="std_margin">
								<label for="person_id">Person id</label>
								<input name="person_id" type="text">
							</div>
							<div class="std_margin">
								<label for="acc_id">Account id</label>
								<input name="acc_id" type="text">
							</div>
							<div class="std_margin">
								<label for="debtop">Debt operation (1 or 2)</label>
								<input name="debtop" type="text">
							</div>

							<div class="std_margin">
								<label for="src_amount">Source amount</label>
								<input name="src_amount" type="text">
							</div>
							<div class="std_margin">
								<label for="dest_amount">Destination amount</label>
								<input name="dest_amount" type="text">
							</div>

							<div class="std_margin">
								<label for="src_curr">Source currency</label>
								<input name="src_curr" type="text">
							</div>
							<div class="std_margin">
								<label for="dest_curr">Destination currency</label>
								<input name="dest_curr" type="text">
							</div>

							<div class="std_margin">
								<label for="date">Date</label>
								<input name="date" type="text">
							</div>

							<div class="std_margin">
								<label for="comm">Comment</label>
								<input name="comm" type="text">
							</div>

							<div class="acc_controls">
								<input class="adm_act_btn" type="submit" value="submit">
							</div>
						</form>
						</div>

						<div id="editTrForm" class="test_form">
						<h3>Edit transaction</h3>
						<form action="<?=BASEURL?>api/transaction/update" method="post">
							<div class="std_margin">
								<label for="transid">Transaction id</label>
								<input name="transid" type="text">
							</div>
							<div class="std_margin">
								<label for="transtype">Type (1-3)</label>
								<input name="transtype" type="text">
							</div>

							<div class="std_margin">
								<label for="src_id">Source account</label>
								<input name="src_id" type="text">
							</div>
							<div class="std_margin">
								<label for="dest_id">Destination account</label>
								<input name="dest_id" type="text">
							</div>

							<div class="std_margin">
								<label for="src_amount">Source amount</label>
								<input name="src_amount" type="text">
							</div>
							<div class="std_margin">
								<label for="dest_amount">Destination amount</label>
								<input name="dest_amount" type="text">
							</div>

							<div class="std_margin">
								<label for="src_curr">Source currency</label>
								<input name="src_curr" type="text">
							</div>
							<div class="std_margin">
								<label for="dest_curr">Destination currency</label>
								<input name="dest_curr" type="text">
							</div>

							<div class="std_margin">
								<label for="date">Date</label>
								<input name="date" type="text">
							</div>

							<div class="std_margin">
								<label for="comm">Comment</label>
								<input name="comm" type="text">
							</div>

							<div class="acc_controls">
								<input class="adm_act_btn" type="submit" value="submit">
							</div>
						</form>
						</div>


						<div id="editDebtForm" class="test_form">
						<h3>Edit debt</h3>
						<form action="<?=BASEURL?>api/transaction/update" method="post">
							<input name="transtype" type="hidden" value="4">
							<div class="std_margin">
								<label for="transid">Transaction id</label>
								<input name="transid" type="text">
							</div>

							<div class="std_margin">
								<label for="person_id">Person id</label>
								<input name="person_id" type="text">
							</div>
							<div class="std_margin">
								<label for="acc_id">Account id</label>
								<input name="acc_id" type="text">
							</div>
							<div class="std_margin">
								<label for="debtop">Debt operation (1 or 2)</label>
								<input name="debtop" type="text">
							</div>

							<div class="std_margin">
								<label for="src_amount">Source amount</label>
								<input name="src_amount" type="text">
							</div>
							<div class="std_margin">
								<label for="dest_amount">Destination amount</label>
								<input name="dest_amount" type="text">
							</div>

							<div class="std_margin">
								<label for="src_curr">Source currency</label>
								<input name="src_curr" type="text">
							</div>
							<div class="std_margin">
								<label for="dest_curr">Destination currency</label>
								<input name="dest_curr" type="text">
							</div>

							<div class="std_margin">
								<label for="date">Date</label>
								<input name="date" type="text">
							</div>

							<div class="std_margin">
								<label for="comm">Comment</label>
								<input name="comm" type="text">
							</div>

							<div class="acc_controls">
								<input class="adm_act_btn" type="submit" value="submit">
							</div>
						</form>
						</div>

						<div id="delTrForm" class="test_form">
						<h3>Delete transactions</h3>
						<div class="std_margin">
							<label for="deltransactions">Transactions (comma separated ids)</label>
							<input id="deltransactions" type="text">
						</div>

						<div class="acc_controls">
							<input id="deltransbtn" class="adm_act_btn" type="button" value="submit">
						</div>
						</div>

						<div id="setTrPosForm" class="test_form">
						<h3>Set position of transacction</h3>
						<form action="<?=BASEURL?>api/transaction/setpos" method="post">
							<div class="std_margin">
								<label for="id">Id</label>
								<input name="id" type="text">
							</div>
							<div class="std_margin">
								<label for="pos">Position</label>
								<input name="pos" type="text">
							</div>
							<div class="acc_controls">
								<input class="adm_act_btn" type="submit" value="submit">
							</div>
						</form>
						</div>

						<div id="getPersonsForm" class="test_form">
						<h3>Get persons</h3>
						<form action="<?=BASEURL?>api/person/list" method="get">
							<div class="acc_controls">
								<input class="adm_act_btn" type="submit" value="submit">
							</div>
						</form>
						</div>

						<div id="readPersonForm" class="test_form">
						<h3>Read person</h3>
						<div class="std_margin">
							<label for="readpid">Id</label>
							<input id="readpid" type="text">
						</div>
						<div class="acc_controls">
							<input id="readpersonbtn" class="adm_act_btn" type="button" value="submit">
						</div>
						</div>

						<div id="createPersonForm" class="test_form">
						<h3>Create person</h3>
						<form action="<?=BASEURL?>api/person/create" method="post">
							<div class="std_margin">
								<label for="pname">Name</label>
								<input id="pname" name="name" type="text">
							</div>
							<div class="acc_controls">
								<input class="adm_act_btn" type="submit" value="submit">
							</div>
						</form>
						</div>

						<div id="editPersonForm" class="test_form">
						<h3>Edit person</h3>
						<form action="<?=BASEURL?>api/person/update" method="post">
							<div class="std_margin">
								<label for="updpid">Id</label>
								<input id="updpid" name="id" type="text">
							</div>
							<div class="std_margin">
								<label for="updpname">Name</label>
								<input id="updpname" name="name" type="text">
							</div>
							<div class="acc_controls">
								<input class="adm_act_btn" type="submit" value="submit">
							</div>
						</form>
						</div>

						<div id="delPersonForm" class="test_form">
						<h3>Delete persons</h3>
						<div class="std_margin">
							<label for="delpersons">Persons (comma separated ids)</label>
							<input id="delpersons" type="text">
						</div>
						<div class="acc_controls">
							<input id="delpersonbtn" class="adm_act_btn" type="submit" value="submit">
						</div>
						</div>

						<div id="getCurrForm" class="test_form">
						<h3>Get currencies</h3>
						<form action="<?=BASEURL?>api/currency/list" method="get">
							<div class="acc_controls">
								<input class="adm_act_btn" type="submit" value="submit">
							</div>
						</form>
						</div>

						<div id="readCurrForm" class="test_form">
						<h3>Read currency</h3>
						<div class="std_margin">
							<label for="curr_id">Id</label>
							<input id="curr_id" type="text">
						</div>
						<div class="acc_controls">
							<input class="adm_act_btn" type="button" value="submit" onclick="onCurrencyReadSubmit();">
						</div>
						</div>

						<div id="loginForm" class="test_form">
						<h3>Login</h3>
						<form action="<?=BASEURL?>api/login/" method="post">
							<div class="std_margin">
								<label for="login">Login</label>
								<input name="login" type="text"><br>
							</div>
							<div class="std_margin">
								<label for="password">Password</label>
								<input name="pwd" type="text"><br>
							</div>

							<div class="acc_controls">
								<input class="adm_act_btn" type="submit" value="submit">
							</div>
						</form>
						</div>

						<div id="logoutForm" class="test_form">
							<h3>Login</h3>
							<form action="<?=BASEURL?>api/logout/" method="post">
								<div class="acc_controls">
									<input class="adm_act_btn" type="submit" value="submit">
								</div>
							</form>
						</div>

						<div id="registerForm" class="test_form">
						<h3>Register</h3>
						<form action="<?=BASEURL?>api/register/" method="post">
							<div class="std_margin">
								<label for="login">Login</label>
								<input name="login" type="text"><br>
							</div>
							<div class="std_margin">
								<label for="password">Password</label>
								<input name="password" type="text"><br>
							</div>
							<div class="std_margin">
								<label for="name">Name</label>
								<input name="name" type="text">
							</div>

							<div class="acc_controls">
								<input class="adm_act_btn" type="submit" value="submit">
							</div>
						</form>
						</div>

						<div id="readProfileForm" class="test_form">
						<h3>Read profile</h3>
						<form action="<?=BASEURL?>api/profile/read" method="get">
							<div class="acc_controls">
								<input class="adm_act_btn" type="submit" value="submit">
							</div>
						</form>
						</div>

						<div id="changeNameForm" class="test_form">
						<h3>Change name</h3>
						<form action="<?=BASEURL?>api/profile/changename" method="post">
							<div class="std_margin">
								<label for="chname">Name</label>
								<input id="chname" name="name" type="text"><br>
							</div>

							<div class="acc_controls">
								<input class="adm_act_btn" type="submit" value="submit">
							</div>
						</form>
						</div>

						<div id="changePwdForm" class="test_form">
						<h3>Change password</h3>
						<form action="<?=BASEURL?>api/profile/changepass" method="post">
							<div class="std_margin">
								<label for="oldpwd">Old password</label>
								<input id="oldpwd" name="oldpwd" type="text"><br>
							</div>
							<div class="std_margin">
								<label for="newpwd">New password</label>
								<input id="newpwd" name="newpwd" type="text"><br>
							</div>

							<div class="acc_controls">
								<input class="adm_act_btn" type="submit" value="submit">
							</div>
						</form>
						</div>

						<div id="resetAllForm" class="test_form">
						<h3>Reset all data</h3>
						<form action="<?=BASEURL?>api/profile/reset" method="post">
							<div class="acc_controls">
								<input class="adm_act_btn" type="submit" value="submit">
							</div>
						</form>
						</div>
					</div>

					<div class="right_column">
						<div class="req_log clearfix">
							<h2>Request log</h2><input id="clearResultsBtn" class="adm_act_btn" type="button" value="clear" disabled>
						</div>
						<div id="results"></div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
</body>
</html>
