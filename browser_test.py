from bottle import default_app, route, static_file, request

@route('/')
def hello_world():
    return 'Hello from Bottle!'
    #return static_file('index.html', root=absolute_path)

#@route('/recalculate/<which>', method='POST')
#def recalcuate(which):
#
#@route('/static/<filepath:path>')
#def server_static(filepath):
#    return static_file(filepath, root=absolute_path)


application = default_app()
application.run()
