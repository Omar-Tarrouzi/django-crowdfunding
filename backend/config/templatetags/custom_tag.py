from django import template
register=template.Library()

def get_value(dictionary,key):
    return dictionary.get(key)
def addclass(value,arg):
    return value.as_widget(attrs={'class':arg})
register.filter('getval',get_value)
register.filter('addclass',addclass)