from django.contrib.auth.models import AbstractUser, UserManager
from django.db import models
from django.db.models import Q
from django.db.models.functions import Lower


class CaseInsensitiveUserManager(UserManager):
    # Usernames are unique ignoring case (see User.Meta), so look them up the
    # same way: this is what `authenticate()` and `createsuperuser` call.
    # Not serialized into migrations so they don't depend on this class.
    use_in_migrations = False

    def get_by_natural_key(self, username):
        return self.get(**{f"{self.model.USERNAME_FIELD}__iexact": username})


class User(AbstractUser):
    """
    This model extends AbstractUser (Django's default user model)
    Model is schema of the DB, this model just adds avatar Image to the AbstractUser
    """
    avatar = models.ImageField(
        upload_to="avatars/",
        blank=True,
        null=True,
    )

    objects = CaseInsensitiveUserManager()

    class Meta(AbstractUser.Meta):
        constraints = [
            models.UniqueConstraint(Lower("username"), name="user_username_ci_unique"),
            # Email is optional, so any number of users may leave it blank.
            models.UniqueConstraint(
                Lower("email"),
                condition=~Q(email=""),
                name="user_email_ci_unique",
            ),
        ]
