from django.contrib.auth.models import AbstractUser
from django.db import models
from django.db.models.functions import Lower


class User(AbstractUser):
    # AbstractUser already provides:
    # username, email, password, permissions, etc.

    # Login accepts an email, so it has to identify exactly one account.
    email = models.EmailField("email address", unique=True)

    avatar = models.URLField(
        blank=True,
        max_length=2048,
    )

    class Meta(AbstractUser.Meta):
        constraints = [
            # Login matches the username case-insensitively, so "Bob" and "bob"
            # must not be two different accounts.
            models.UniqueConstraint(
                Lower("username"),
                name="accounts_user_username_ci_unique",
            ),
        ]

    def __str__(self):
        return self.username
