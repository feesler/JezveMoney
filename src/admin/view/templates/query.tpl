<?php	include("./view/templates/commonhdr.tpl");	?>
</head>
<body>
<div class="page">
	<div class="page_wrapper">
<?php	include("./view/templates/header.tpl");	?>

		<div class="container">
			<div class="content">
				<div class="content_wrap admin_cont_wrap">
					<h2>DB queries</h2>

<?php	if ($query != "") {		?>
<?php		if ($qerr_num == 0) {		?>
					<table class="adm_tbl">
						<tr>
<?php			foreach($resArr[0] as $ind => $val) {		?>
							<th><?=$ind?></th>
<?php			}	?>
						</tr>
<?php			foreach($resArr as $row) {		?>
						<tr>
<?php				foreach($row as $val) {	?>
							<td><?=$val?></td>
<?php				}	?>
						</tr>
<?php			}		?>
						<tr><td colspan="<?=$cols?>">Rows: <?=$rows?></td></tr>
					</table>
<?php		} else {	?>
					<div style="color: red;">Error: <?=$qerr_num?><br><?=$qerror?></div><br>
<?php		}	?>
<?php	}	?>
					<form method="post" action="<?=BASEURL?>admin/query/">
					<label>Query type</label><br>
					<input name="qtype" type="radio" value="1" checked> Select
					<label>Query</label><br>
					<textarea id="query" name="query" rows="5" cols="80"><?=$query?></textarea><br>

					<div class="acc_controls">
						<input class="adm_act_btn" type="submit" value="Query">
					</div>
					</form>
				</div>
			</div>
		</div>
	</div>
</div>
</body>
</html>
