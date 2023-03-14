<?php	include(ADMIN_TPL_PATH . "Header.tpl");	?>

<div class="page">
    <div class="page_wrapper">
<?php	include(ADMIN_TPL_PATH . "Component/Header.tpl");	?>

        <div class="container">
            <div class="content">
                <div class="content_wrap admin_cont_wrap">
                    <h2>Log</h2>

                    <form method="post" action="<?=BASEURL?>admin/log/clean/">
                    <input name="clean" type="hidden" value="1">
                    <div class="form-controls">
                        <input class="btn submit-btn" type="submit" value="Clean log">
                    </div>
                    </form>
                    <textarea rows="30" cols="150"><?=$contents?></textarea>
                </div>
            </div>
        </div>
    </div>
</div>

<?php	include(ADMIN_TPL_PATH . "Footer.tpl");	?>
