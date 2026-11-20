-- Reduce the item image bucket limit from 5 MB to 3 MB per image.
-- Existing objects are unaffected; the limit applies to new uploads.

update storage.buckets
set file_size_limit = 3145728
where id = 'item-images';
