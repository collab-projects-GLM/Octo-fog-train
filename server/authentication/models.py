
from django.contrib.auth.models import AbstractUser
from django.db import models

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