<?php	include("./templates/commonhdr.tpl");	?>
<script>
var currency = <?=f_json_encode($currArr)?>;
var acc_name = <?=json_encode($acc_name)?>;
var acc_currency = <?=$accInfo["curr"]?>;
var acc_balance = <?=$accInfo["balance"]?>;

onReady(initControls);
</script>
</head>
<body>
<form method="post" action="./modules/createaccount.php" onsubmit="return onNewAccountSubmit(this);">
<div class="page">
	<div class="page_wrapper">
<?php	require_once("./templates/header.tpl");		?>
		<div class="container centered">
			<div class="content">
				<div class="content_wrap">
					<h2><?=$headString?></h2>
					<div>
						<div class="non_float std_margin">
							<div id="acc_tile" class="tile"><button class="tilelink" type="button"><span><span class="acc_bal"><?=$accInfo["balfmt"]?></span><span class="acc_name">New account</span></span></button></div>
						</div>
						<div class="non_float std_margin">
							<label for="icon">Icon</label>
							<div class="std_input">
								<div>
									<select id="icon" name="icon" onchange="onChangeIcon(this);">
<?php	foreach($icons as $icon_id => $icon_name) {		?>
										<option value="<?=$icon_id?>"><?=$icon_name?></option>
<?php	}	?>
									</select>
								</div>
							</div>
						</div>
						<div class="non_float std_margin">
							<label for="accname">Account name</label>
							<div class="stretch_input std_input"><div><input id="accname" name="accname" type="text" oninput="return onAccNameInput(this);"></div></div>
						</div>
						<div class="non_float std_margin">
							<label for="currency">Currency</label>
							<div class="std_input">
								<div>
									<select id="currency" name="currency" onchange="onChangeAccountCurrency(this);">
<?php	foreach($currArr as $currInfo) {
			if ($currInfo[0] == $accInfo["curr"]) {	?>
										<option value="<?=$currInfo[0]?>" selected><?=$currInfo[1]?></option>
<?php		} else {	?>
										<option value="<?=$currInfo[0]?>"><?=$currInfo[1]?></option>
<?php		}
		}		?>
									</select>
								</div>
							</div>
						</div>
						<div class="non_float std_margin">
							<label for="balance">Initial balance</label>
							<div>
								<div class="curr_container"><div class="btn rcurr_btn inact_rbtn"><div id="currsign"><?=$accInfo["sign"]?></div></div></div>
								<div class="stretch_input std_input">
									<div>
										<input class="summ_text" id="balance" name="balance" type="text" value="0" oninput="return onAccBalanceInput(this);">
									</div>
								</div>
							</div>
						</div>
						<div class="acc_controls"><input class="btn ok_btn" type="submit" value="ok"><a class="btn cancel_btn" href="./accounts.php">cancel</a></div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
</form>
</body>
</html>
