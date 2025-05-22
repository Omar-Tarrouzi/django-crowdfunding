# config/decorators.py
from django.core.exceptions import PermissionDenied

def role_required(role):
    def decorator(view_func):
        def _wrapped(request, *args, **kwargs):
            if not request.user.is_authenticated or request.user.userprofile.role != role:
                raise PermissionDenied
            return view_func(request, *args, **kwargs)
        return _wrapped
    return decorator

