<?php	include(ADMIN_TPL_PATH."commonhdr.tpl");	?>
</head>
<body>
<div class="page">
    <div class="page_wrapper">
<?php	include(ADMIN_TPL_PATH."header.tpl");	?>

        <div class="container">
            <div class="content">
                <div class="content_wrap admin_cont_wrap">
                    <h2>DB Update</h2>

                    <div>
                        <div>Current DB version: <?=e($currentDBVersion)?></div>
                        <div>Latest DB version: <?=e($latestDBVersion)?></div>
<?php	if ($currentDBVersion == $latestDBVersion) {		?>
                        <div>Database is up to date</div>
<?php	} else {		?>
                        <div>Database update is required</div>
<?php	}		?>
                    </div>

                    <form method="POST" action="<?=BASEURL."admin/dbinstall/update"?>">
                    <div class="acc_controls">
<?php	if ($currentDBVersion == $latestDBVersion) {		?>
                        <input id="updbtn" class="adm_act_btn" type="submit" value="update" disabled>
<?php	} else {		?>
                        <input id="updbtn" class="adm_act_btn" type="submit" value="update">
<?php	}		?>
                    </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>

<?php	include(ADMIN_TPL_PATH."footer.tpl");	?>
</body>
</html>
