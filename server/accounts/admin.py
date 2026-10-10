from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.forms import AdminUserCreationForm

from .models import User


class UserCreationForm(AdminUserCreationForm):
    class Meta(AdminUserCreationForm.Meta):
        model = User
        fields = ("username", "email")


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    add_form = UserCreationForm

    fieldsets = UserAdmin.fieldsets + (
        (
            "Profile",
            {"fields": ("avatar",)},
        ),
    )

    # Email is unique and used to log in, so it can't be left blank here.
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("username", "email", "usable_password", "password1", "password2"),
            },
        ),
    )
