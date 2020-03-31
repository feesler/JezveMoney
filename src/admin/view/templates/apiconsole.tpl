<?php	include(ADMIN_TPL_PATH."commonhdr.tpl");	?>
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
									<li data-target="createCurrForm">Create currency</li>
									<li data-target="editCurrForm">Edit currency</li>
									<li data-target="delCurrForm">Delete currencies</li>
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
							<label for="create_account_name">Name</label>
							<input id="create_account_name" type="text">
						</div>
						<div class="std_margin">
							<label for="create_account_balance">Balance</label>
							<input id="create_account_balance" type="text">
						</div>
						<div class="std_margin">
							<label for="create_account_curr">Currency (1-5, 10-22)</label>
							<input id="create_account_curr" type="text">
						</div>
						<div class="std_margin">
							<label for="create_account_icon">Icon (1-6; 0 - no icon)</label>
							<input id="create_account_icon" type="text">
						</div>
						<div class="acc_controls">
							<input id="accbtn" class="adm_act_btn" type="button" value="submit">
						</div>
						</div>

						<div id="editAccForm" class="test_form">
						<h3>Edit account</h3>
						<div class="std_margin">
							<label for="update_account_id">Id</label>
							<input id="update_account_id" type="text">
						</div>
						<div class="std_margin">
							<label for="update_account_name">Name</label>
							<input id="update_account_name" type="text">
						</div>
						<div class="std_margin">
							<label for="update_account_balance">Balance</label>
							<input id="update_account_balance" type="text">
						</div>
						<div class="std_margin">
							<label for="update_account_curr">Currency (1-5, 10-22)</label>
							<input id="update_account_curr" type="text">
						</div>
						<div class="std_margin">
							<label for="update_account_icon">Icon (1-6; 0 - no icon)</label>
							<input id="update_account_icon" type="text">
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
							<label for="read_trans_id">Id</label>
							<input id="read_trans_id" type="text">
						</div>
						<div class="acc_controls">
							<input id="readtransbtn" class="adm_act_btn" type="button" value="submit">
						</div>
						</div>

						<div id="createTrForm" class="test_form">
						<h3>Create transaction</h3>
						<form action="<?=BASEURL?>api/transaction/create" method="post">
							<div class="std_margin">
								<label for="create_trans_type">Type (1-3)</label>
								<input id="create_trans_type" name="type" type="text">
							</div>
							<div class="std_margin">
								<label for="create_trans_src_id">Source account</label>
								<input id="create_trans_src_id" name="src_id" type="text">
							</div>
							<div class="std_margin">
								<label for="create_trans_dest_id">Destination account</label>
								<input id="create_trans_dest_id" name="dest_id" type="text">
							</div>
							<div class="std_margin">
								<label for="create_trans_src_amount">Source amount</label>
								<input id="create_trans_src_amount" name="src_amount" type="text">
							</div>
							<div class="std_margin">
								<label for="create_trans_dest_amount">Destination amount</label>
								<input id="create_trans_dest_amount" name="dest_amount" type="text">
							</div>

							<div class="std_margin">
								<label for="create_trans_src_curr">Source currency</label>
								<input id="create_trans_src_curr" name="src_curr" type="text">
							</div>
							<div class="std_margin">
								<label for="create_trans_dest_curr">Destination currency</label>
								<input id="create_trans_dest_curr" name="dest_curr" type="text">
							</div>

							<div class="std_margin">
								<label for="create_trans_date">Date</label>
								<input id="create_trans_date" name="date" type="text">
							</div>

							<div class="std_margin">
								<label for="create_trans_comment">Comment</label>
								<input id="create_trans_comment" name="comment" type="text">
							</div>

							<div class="acc_controls">
								<input class="adm_act_btn" type="submit" value="submit">
							</div>
						</form>
						</div>

						<div id="createDebtForm" class="test_form">
						<h3>Create debt</h3>
						<form action="<?=BASEURL?>api/transaction/create" method="post">
							<input name="type" type="hidden" value="4">
							<div class="std_margin">
								<label for="create_debt_person_id">Person id</label>
								<input id="create_debt_person_id" name="person_id" type="text">
							</div>
							<div class="std_margin">
								<label for="create_debt_acc_id">Account id</label>
								<input id="create_debt_acc_id" name="acc_id" type="text">
							</div>
							<div class="std_margin">
								<label for="create_debt_op">Debt operation (1 or 2)</label>
								<input id="create_debt_op" name="op" type="text">
							</div>

							<div class="std_margin">
								<label for="create_debt_src_amount">Source amount</label>
								<input id="create_debt_src_amount" name="src_amount" type="text">
							</div>
							<div class="std_margin">
								<label for="create_debt_dest_amount">Destination amount</label>
								<input id="create_debt_dest_amount" name="dest_amount" type="text">
							</div>

							<div class="std_margin">
								<label for="create_debt_src_curr">Source currency</label>
								<input id="create_debt_src_curr" name="src_curr" type="text">
							</div>
							<div class="std_margin">
								<label for="create_debt_dest_curr">Destination currency</label>
								<input id="create_debt_dest_curr" name="dest_curr" type="text">
							</div>

							<div class="std_margin">
								<label for="create_debt_date">Date</label>
								<input id="create_debt_date" name="date" type="text">
							</div>

							<div class="std_margin">
								<label for="create_debt_comment">Comment</label>
								<input id="create_debt_comment" name="comment" type="text">
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
								<label for="update_trans_id">Transaction id</label>
								<input id="update_trans_id" name="id" type="text">
							</div>
							<div class="std_margin">
								<label for="update_trans_type">Type (1-3)</label>
								<input id="update_trans_type" name="type" type="text">
							</div>

							<div class="std_margin">
								<label for="update_trans_src_id">Source account</label>
								<input id="update_trans_src_id" name="src_id" type="text">
							</div>
							<div class="std_margin">
								<label for="update_trans_dest_id">Destination account</label>
								<input id="update_trans_dest_id" name="dest_id" type="text">
							</div>

							<div class="std_margin">
								<label for="update_trans_src_amount">Source amount</label>
								<input id="update_trans_src_amount" name="src_amount" type="text">
							</div>
							<div class="std_margin">
								<label for="update_trans_dest_amount">Destination amount</label>
								<input id="update_trans_dest_amount" name="dest_amount" type="text">
							</div>

							<div class="std_margin">
								<label for="update_trans_src_curr">Source currency</label>
								<input id="update_trans_src_curr" name="src_curr" type="text">
							</div>
							<div class="std_margin">
								<label for="update_trans_dest_curr">Destination currency</label>
								<input id="update_trans_dest_curr" name="dest_curr" type="text">
							</div>

							<div class="std_margin">
								<label for="update_trans_date">Date</label>
								<input id="update_trans_date" name="date" type="text">
							</div>

							<div class="std_margin">
								<label for="update_trans_comment">Comment</label>
								<input id="update_trans_comment" name="comment" type="text">
							</div>

							<div class="acc_controls">
								<input class="adm_act_btn" type="submit" value="submit">
							</div>
						</form>
						</div>


						<div id="editDebtForm" class="test_form">
						<h3>Edit debt</h3>
						<form action="<?=BASEURL?>api/transaction/update" method="post">
							<input name="type" type="hidden" value="4">
							<div class="std_margin">
								<label for="update_debt_id">Transaction id</label>
								<input id="update_debt_id" name="id" type="text">
							</div>

							<div class="std_margin">
								<label for="update_debt_person_id">Person id</label>
								<input id="update_debt_person_id" name="person_id" type="text">
							</div>
							<div class="std_margin">
								<label for="update_debt_acc_id">Account id</label>
								<input id="update_debt_acc_id" name="acc_id" type="text">
							</div>
							<div class="std_margin">
								<label for="update_debt_op">Debt operation (1 or 2)</label>
								<input id="update_debt_op" name="op" type="text">
							</div>

							<div class="std_margin">
								<label for="update_debt_src_amount">Source amount</label>
								<input id="update_debt_src_amount" name="src_amount" type="text">
							</div>
							<div class="std_margin">
								<label for="update_debt_dest_amount">Destination amount</label>
								<input id="update_debt_dest_amount" name="dest_amount" type="text">
							</div>

							<div class="std_margin">
								<label for="update_debt_src_curr">Source currency</label>
								<input id="update_debt_src_curr" name="src_curr" type="text">
							</div>
							<div class="std_margin">
								<label for="update_debt_dest_curr">Destination currency</label>
								<input id="update_debt_dest_curr" name="dest_curr" type="text">
							</div>

							<div class="std_margin">
								<label for="update_debt_date">Date</label>
								<input id="update_debt_date" name="date" type="text">
							</div>

							<div class="std_margin">
								<label for="update_debt_comment">Comment</label>
								<input id="update_debt_comment" name="comment" type="text">
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
								<label for="trans_pos_id">Id</label>
								<input id="trans_pos_id" name="id" type="text">
							</div>
							<div class="std_margin">
								<label for="trans_pos_pos">Position</label>
								<input id="trans_pos_pos" name="pos" type="text">
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
							<label for="read_person_id">Id</label>
							<input id="read_person_id" type="text">
						</div>
						<div class="acc_controls">
							<input id="readpersonbtn" class="adm_act_btn" type="button" value="submit">
						</div>
						</div>

						<div id="createPersonForm" class="test_form">
						<h3>Create person</h3>
						<form action="<?=BASEURL?>api/person/create" method="post">
							<div class="std_margin">
								<label for="create_person_name">Name</label>
								<input id="create_person_name" name="name" type="text">
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
								<label for="update_person_id">Id</label>
								<input id="update_person_id" name="id" type="text">
							</div>
							<div class="std_margin">
								<label for="update_person_name">Name</label>
								<input id="update_person_name" name="name" type="text">
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
							<label for="read_curr_id">Id</label>
							<input id="read_curr_id" type="text">
						</div>
						<div class="acc_controls">
							<input id="readcurrbtn" class="adm_act_btn" type="button" value="submit">
						</div>
						</div>

						<div id="createCurrForm" class="test_form">
						<h3>Create currency</h3>
						<form action="<?=BASEURL?>api/currency/create" method="post">
							<div class="std_margin">
								<label for="create_currency_name">Name</label>
								<input id="create_currency_name" name="name" type="text">
							</div>
							<div class="std_margin">
								<label for="create_currency_sign">Sign</label>
								<input id="create_currency_sign" name="sign" type="text">
							</div>
							<div class="std_margin">
								<label for="create_currency_format">Format(0 - sign on right, 1 - sign on left)</label>
								<input id="create_currency_format" name="format" type="text">
							</div>
							<div class="acc_controls">
								<input class="adm_act_btn" type="submit" value="submit">
							</div>
						</form>
						</div>

						<div id="editCurrForm" class="test_form">
						<h3>Edit currency</h3>
						<form action="<?=BASEURL?>api/currency/update" method="post">
							<div class="std_margin">
								<label for="update_currency_id">Id</label>
								<input id="update_currency_id" name="id" type="text">
							</div>
							<div class="std_margin">
								<label for="update_currency_name">Name</label>
								<input id="update_currency_name" name="name" type="text">
							</div>
							<div class="std_margin">
								<label for="update_currency_sign">Sign</label>
								<input id="update_currency_sign" name="sign" type="text">
							</div>
							<div class="std_margin">
								<label for="update_currency_format">Format(0 - sign on right, 1 - sign on left)</label>
								<input id="update_currency_format" name="format" type="text">
							</div>
							<div class="acc_controls">
								<input class="adm_act_btn" type="submit" value="submit">
							</div>
						</form>
						</div>

						<div id="delCurrForm" class="test_form">
						<h3>Delete currency</h3>
						<div class="std_margin">
							<label for="delcurrencies">Currencies (comma separated ids)</label>
							<input id="delcurrencies" type="text">
						</div>
						<div class="acc_controls">
							<input id="delcurrbtn" class="adm_act_btn" type="button" value="submit">
						</div>
						</div>

						<div id="loginForm" class="test_form">
						<h3>Login</h3>
						<form action="<?=BASEURL?>api/login/" method="post">
							<div class="std_margin">
								<label for="login_login">Login</label>
								<input id="login_login" name="login" type="text"><br>
							</div>
							<div class="std_margin">
								<label for="login_password">Password</label>
								<input id="login_password" name="password" type="text"><br>
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
								<label for="reg_login">Login</label>
								<input id="reg_login" name="login" type="text"><br>
							</div>
							<div class="std_margin">
								<label for="reg_password">Password</label>
								<input id="reg_password" name="password" type="text"><br>
							</div>
							<div class="std_margin">
								<label for="reg_name">Name</label>
								<input id="reg_name" name="name" type="text">
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
								<label for="change_name">Name</label>
								<input id="change_name" name="name" type="text"><br>
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
								<label for="change_pass_current">Current password</label>
								<input id="change_pass_current" name="current" type="text"><br>
							</div>
							<div class="std_margin">
								<label for="change_pass_new">New password</label>
								<input id="change_pass_new" name="new" type="text"><br>
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
<?php	include(ADMIN_TPL_PATH."footer.tpl");	?>
<script>
	onReady(initControls);
</script>
</body>
</html>
