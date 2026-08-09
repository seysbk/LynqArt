from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdminOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        return request.method in SAFE_METHODS or bool(request.user and request.user.is_authenticated and request.user.is_staff)


class IsSelfOrAdmin(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return bool(
            request.user
            and request.user.is_authenticated
            and (request.user.is_staff or getattr(obj, 'id', None) == request.user.id)
        )


class IsArtistOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        return request.method in SAFE_METHODS or bool(request.user and request.user.is_authenticated and request.user.is_artist)


class IsExpertOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        return request.method in SAFE_METHODS or bool(request.user and request.user.is_authenticated and request.user.is_expert)


class IsOwnerOrReadOnly(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        owner = getattr(obj, 'user', None) or getattr(obj, 'artist', None) or getattr(obj, 'organizer', None)
        return bool(request.user and request.user.is_authenticated and owner == request.user)


class IsCanManageExhibitions(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (request.user.can_manage_exhibitions or request.user.is_staff or request.user.is_superuser)
        )


class IsCanManageExhibitionsOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return bool(
            request.user
            and request.user.is_authenticated
            and (request.user.can_manage_exhibitions or request.user.is_staff or request.user.is_superuser)
        )


class IsArtistProfileOwnerOrAdmin(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return bool(
            request.user
            and request.user.is_authenticated
            and (request.user.is_staff or obj.user == request.user)
        )
