from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    # Stock UserAdmin (password hashing, permissions, groups) plus the avatar field.
    fieldsets = BaseUserAdmin.fieldsets + (("Profile", {"fields": ("avatar",)}),)
