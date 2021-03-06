from django.conf.urls import patterns, include, url

# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
# admin.autodiscover()

urlpatterns = patterns('',
    # Examples:
    # url(r'^$', 'geonetviz.views.home', name='home'),
    # url(r'^geonetviz/', include('geonetviz.foo.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    # url(r'^admin/', include(admin.site.urls)),

    url(r'^upload/', 'server.views.upload'),
    url(r'^get/(?P<ds_id>[0-9\.]+)/?$', 'server.views.get_ds'),
    url(r'^/?$', 'server.views.index'),
    url(r'^view/(?P<ds_id>[0-9\.]*)/?$', 'server.views.view_ds'),
)
