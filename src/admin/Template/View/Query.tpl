<?php	include(ADMIN_TPL_PATH . "Header.tpl");	?>

<div class="page">
    <div class="page_wrapper">
<?php	include(ADMIN_TPL_PATH . "Component/tpl/Header.tpl");	?>

        <div class="container">
            <div class="content">
                <div class="content_wrap admin_cont_wrap">
                    <div class="heading">
                        <h1>DB queries</h1>
                    </div>

                    <div>
<?php	if ($query != "") {		?>
<?php		if ($qerr_num == 0) {		?>
                        <table class="admin-tbl">
<?php			if (is_array($resArr) && count($resArr) > 0) {	?>
                            <tr>
<?php				foreach($resArr[0] as $ind => $val) {		?>
                                <th><?=e($ind)?></th>
<?php				}	?>
                            </tr>
<?php				foreach($resArr as $row) {		?>
                            <tr>
<?php					foreach($row as $val) {	?>
                                <td><?=e($val)?></td>
<?php				}	?>
                                </tr>
<?php				}		?>
<?php			}	?>
                            <tr><td colspan="<?=e($cols)?>">Rows: <?=e($rows)?></td></tr>
                        </table>
<?php		} else {	?>
                        <div class="query-error">Error: <?=e($qerr_num)?><br><?=e($qerror)?></div><br>
<?php		}	?>
<?php	}	?>
                    </div>
                    <div class="row-container">
                        <div class="query-form">
                            <form method="post" action="<?=BASEURL?>admin/query/">
                            <label>Query type</label><br>
                            <input name="qtype" type="radio" value="1" checked> Select
                            <label>Query</label><br>
                            <textarea id="query" name="query" rows="5" cols="80"><?=e($query)?></textarea><br>

                            <div class="form-controls">
                                <input class="adm_act_btn" type="submit" value="Query">
                            </div>
                            </form>
                        </div>
                        <div class="query-history">
                            <table class="admin-tbl">
<?php	foreach($latestQueries as $item) {		?>
                                <tr><td><?=e($item)?></td></tr>
<?php	}	?>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<?php	include(ADMIN_TPL_PATH . "Footer.tpl");	?>
