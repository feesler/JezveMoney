<?php	include("./view/templates/commonhdr.tpl");	?>
</head>
<body>
<div class="page">
	<div class="page_wrapper">
<?php	include("./view/templates/header.tpl");	?>

		<div class="container">
			<div class="content">
				<div class="content_wrap admin_cont_wrap">
					<h2>Transactions result balance</h2>


					<table class="adm_tbl">
						<tr>
							<th>ID</th>
							<th>Type</th>
							<th>src_id</th>
							<th>dest_id</th>
							<th>src_amount</th>
							<th>dest_amount</th>
							<th>src_result</th>
							<th>exp_src_result</th>
							<th>dest_result</th>
							<th>exp_dest_result</th>
							<th>pos</th>
						</tr>
<?php			if (is_array($transactions) && count($transactions) > 0) {	?>
<?php				foreach($transactions as $tr) {		?>
						<tr>
							<td><?=($tr->id)?></td>
							<td><?=($tr->type)?></td>
							<td><?=($tr->src_id)?></td>
							<td><?=($tr->dest_id)?></td>
							<td><?=($tr->src_amount)?></td>
							<td><?=($tr->dest_amount)?></td>
<?php		if ($tr->src_result != $tr->exp_src_result) {		?>
							<td style="background-color: red;"><?=($tr->src_result)?></td>
							<td style="background-color: green;"><?=($tr->exp_src_result)?></td>
<?php		} else {		?>
							<td><?=($tr->src_result)?></td>
							<td><?=($tr->exp_src_result)?></td>
<?php		}		?>
<?php		if ($tr->dest_result != $tr->exp_dest_result) {		?>
							<td style="background-color: red;"><?=($tr->dest_result)?></td>
							<td style="background-color: green;"><?=($tr->exp_dest_result)?></td>
<?php		} else {		?>
							<td><?=($tr->dest_result)?></td>
							<td><?=($tr->exp_dest_result)?></td>
<?php		}		?>
							<td><?=($tr->pos)?></td>
						</tr>
<?php				}		?>
<?php			}	?>
					</table>
				</div>
			</div>
		</div>
	</div>
</div>
</body>
</html>
