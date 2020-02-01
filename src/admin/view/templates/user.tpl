<?php	include("./view/templates/commonhdr.tpl");	?>
<script>
	var users = <?=JSON::encode($uArr)?>;

	onReady(initControls);
</script>
</head>
<body>
<div class="page">
	<div class="page_wrapper">
<?php	include("./view/templates/header.tpl");	?>

		<div class="container">
			<div class="content">
				<div class="content_wrap admin_cont_wrap">
					<h2>Users</h2>

					<table id="users_tbl" class="adm_tbl">
						<thead>
							<tr><th>id</th><th>login</th><th>owner</th><th>access</th><th>accounts</th><th>transactions</th><th>persons</th></tr>
						</thead>
						<tbody>
<?php	foreach($uArr as $userInfo) {		?>
							<tr>
								<td><?=$userInfo->id?></td>
								<td><?=$userInfo->login?></td>
								<td><?=$userInfo->owner?></td>
								<td><?=$userInfo->access?></td>
								<td><?=$userInfo->accCount?></td>
								<td><?=$userInfo->trCount?></td>
								<td><?=$userInfo->pCount?></td>
							</tr>
<?php	}	?>
						</tbody>
					</table>

					<div class="acc_controls">
						<input class="adm_act_btn" type="button" value="new" onclick="newUser()">
						<input id="updbtn" class="adm_act_btn" type="button" value="update" onclick="updateUser()" style="display: none;">
						<input id="passbtn" class="adm_act_btn" type="button" value="set password" onclick="setUserPass()" style="display: none;">
						<input id="del_btn" class="adm_act_btn" type="button" value="delete" onclick="deleteUser()" style="display: none;">
					</div>

					<form id="delfrm" method="post" action="<?=BASEURL?>admin/user/del" onsubmit="return onDeleteSubmit(this);">
						<input id="del_user_id" name="user_id" type="hidden">
					</form>
				</div>
			</div>
		</div>
	</div>
</div>

<form id="user_frm" method="post" action="<?=BASEURL?>admin/user/new" style="display: none;">
<input id="user_id" name="user_id" type="hidden">
<div id="login_block" class="non_float">
	<label for="user_login">Login</label>
	<div class="stretch_input"><input id="user_login" name="user_login" type="text"></div>
</div>
<div id="name_block" class="non_float">
	<label for="user_name">Name</label>
	<div class="stretch_input"><input id="user_name" name="user_name" type="text"></div>
</div>
<div id="pwd_block" class="non_float">
	<label for="user_pass">Password</label>
	<div class="stretch_input"><input id="user_pass" name="user_pass" type="password"></div>
</div>
<div id="admin_block" class="check_wr"><input id="isadmin" name="isadmin" type="checkbox"><label for="isadmin">Admin access level</label></div>
</form>

<form>
</body>
</html>
