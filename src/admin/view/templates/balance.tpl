<?php	include(ADMIN_TPL_PATH."commonhdr.tpl");	?>
</head>
<body>
<div class="page">
	<div class="page_wrapper">
<?php	include(ADMIN_TPL_PATH."header.tpl");	?>

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
							<th>date</th>
							<th>pos</th>
						</tr>
<?php			if (is_array($transactions) && count($transactions) > 0) {	?>
<?php				foreach($transactions as $tr) {		?>
						<tr>
							<td><?=e($tr->id)?></td>
							<td><?=e($tr->typeStr)?></td>
							<td><?=e($tr->src_id)?></td>
							<td><?=e($tr->dest_id)?></td>
							<td><?=e($tr->src_amount)?></td>
							<td><?=e($tr->dest_amount)?></td>
<?php		if ($tr->src_result != $tr->exp_src_result) {		?>
							<td style="background-color: red;"><?=e($tr->src_result)?></td>
							<td style="background-color: green;"><?=e($tr->exp_src_result)?></td>
<?php		} else {		?>
							<td><?=e($tr->src_result)?></td>
							<td><?=e($tr->exp_src_result)?></td>
<?php		}		?>
<?php		if ($tr->dest_result != $tr->exp_dest_result) {		?>
							<td style="background-color: red;"><?=e($tr->dest_result)?></td>
							<td style="background-color: green;"><?=e($tr->exp_dest_result)?></td>
<?php		} else {		?>
							<td><?=e($tr->dest_result)?></td>
							<td><?=e($tr->exp_dest_result)?></td>
<?php		}		?>
							<td><?=e($tr->dateStr)?></td>
							<td><?=e($tr->pos)?></td>
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
