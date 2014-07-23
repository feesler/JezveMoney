<?php	include("./templates/commonhdr.tpl");	?>
<script>
	var p_name = <?=json_encode($person_name)?>;
<?php	if (isMessageSet()) {	?>
	onReady(initMessage);
<?php	}	?>
</script>
</head>
<body>
<div class="page">
	<div class="page_wrapper">
<?php	require_once("./templates/header.tpl");		?>
		<div class="container centered">
			<div class="content">
				<div class="content_wrap profile_summary">
					<h1>User profile</h1>
					<div>
						<h2>Account name</h2>
						<span><?=$user_login;?></span>
					</div>

					<div>
						<h2>User name</h2>
						<span><?=$person_name?></span>
<?php	if ($action != "changename") {	?>
						<div><a href="./profile.php?act=changename">Change</a></div>
<?php	}	?>
					</div>

<?php	if ($action != "changepassword") {	?>
					<div>
						<h2>Security</h2>
						<div><a href="./profile.php?act=changepassword">Change password</a></div>
					</div>
<?php	}	?>

					<div>
						<h2>Reset data</h2>
						<div>
							<form id="resetacc_form" method="post" action="./modules/resetaccounts.php">
							</form>
							<span>You also may reset all your accounts data.<br>
							<input class="btn ok_btn" type="button" onclick="showResetAccountsPopup();" value="Reset"></span>
						</div>
						<div style="margin-top: 15px;">
							<form id="resetall_form" method="post" action="./modules/resetall.php">
							</form>
							<span>You may also reset all your data and start from the scratch.<br>
							<input class="btn ok_btn" type="button" onclick="showResetAllPopup();" value="Reset all"></span>
						</div>
					</div>
<?php	if ($action == "changepassword") {		?>
					<form method="post" action="./modules/changepassword.php" onsubmit="return onChangePassSubmit(this);">
						<h2>Change password</h2>
						<div>
							<div class="non_float">
								<label for="oldpwd">Current password</label>
								<div class="stretch_input std_input"><div><input id="oldpwd" name="oldpwd" type="password"></div></div>
							</div>

							<div class="non_float">
								<label for="newpwd">New password</label>
								<div class="stretch_input std_input"><div><input id="newpwd" name="newpwd" type="password"></div></div>
							</div>

							<div class="acc_controls"><input class="btn ok_btn" type="submit" value="ok"><a class="btn cancel_btn" href="./profile.php">cancel</a></div>
						</div>
					</form>
<?php	} else if ($action == "changename") {		?>
					<form method="post" action="./modules/changename.php" onsubmit="return onChangeNameSubmit(this);">
					<h2>Change name</h2>
					<div>
						<div class="non_float">
							<label for="newname">New name</label>
							<div class="stretch_input std_input"><div><input id="newname" name="newname" type="text"></div></div>
						</div>

						<div class="acc_controls"><input class="btn ok_btn" type="submit" value="ok"><a class="btn cancel_btn" href="./profile.php">cancel</a></div>
					</div>
					</form>
<?php	}	?>
				</div>
			</div>
		</div>
	</div>
</div>
</body>
</html>
