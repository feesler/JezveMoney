<div id="<?= e($id) ?>" class="tile-info-item" <?= hidden(isset($hidden) && $hidden) ?>>
    <span><?= e($title) ?></span>
    <button class="btn dashed-btn" type="button"><?= e($value) ?></button>
</div>