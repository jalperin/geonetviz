geonetviz
=========

finally a way to easily visualize networks with a geographic dimension


--- for django project ---

edit geonetviz/geonetviz/settings.py and change the TEMPLATES directory (it's the one that has "primer" in the path)

to get things started, just try:
$ cd geonetviz
$ python manage.py runserver

if all works well and you have all dependencies, you can then open "post_upload_example.html" in the root to add a data set....then, use:

http://127.0.0.1:8000/get/ID

where ID is what the POST will return.
