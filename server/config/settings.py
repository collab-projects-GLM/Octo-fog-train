from pathlib import Path
from dotenv import load_dotenv
import dj_database_url
import os

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

SECRET_KEY = os.environ["DJANGO_SECRET_KEY"]
DEBUG = os.getenv("DJANGO_DEBUG", "False").lower() == "true"
ALLOWED_HOSTS = [
    host.strip()
    for host in os.getenv(
        "DJANGO_ALLOWED_HOSTS",
        "localhost,127.0.0.1",
    ).split(",")
    if host.strip()
]


# Application definition
INSTALLED_APPS = [
    'jazzmin',

    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',

    'drf_spectacular',
    'corsheaders',

    'api', 
    'authentication'
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

#Jazzmin settings
JAZZMIN_SETTINGS = {
    "site_title": "Octo-travel Admin",
    "site_header": "Octo-travel",
    "site_brand": "Octo-travel",
    "site_logo": None,
    "welcome_sign": "Welcome to Octo-travel Management",
    "copyright": "Octo-travel",

    "search_model": [
        "authentication.User",
    ],

    "topmenu_links": [
        {"name": "API Docs", "url": "/api/docs/", "new_window": True},
        {"model": "auth.User"},
    ],

    "show_ui_builder": True,
    "navigation_expanded": True,

    "icons": {
        "auth": "fas fa-users-cog",
        "auth.user": "fas fa-user",
        "authentication.user": "fas fa-user-astronaut",
        "api": "fas fa-code",
    },
}

JAZZMIN_UI_TWEAKS = {
    "navbar_small_text": False,
    "footer_small_text": False,
    "body_small_text": False,
    "brand_small_text": False,
    "brand_colour": "navbar-dark",
    "accent": "accent-primary",
    "navbar": "navbar-dark",
    "no_navbar_border": False,
    "sidebar": "sidebar-dark-primary",
    "sidebar_nav_small_text": False,
    "sidebar_disable_expand": False,
    "sidebar_nav_child_indent": True,
    "theme": "default",
    "dark_mode_theme": "darkly",
}

#URL Config
ROOT_URLCONF = 'config.urls'

#Models
AUTH_USER_MODEL = "authentication.User"

#S3 setup
STORAGES = {
    "default": {"BACKEND": "storages.backends.s3.S3Storage"},
    "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
}

AWS_S3_ENDPOINT_URL = os.environ["S3_ENDPOINT_URL"]
AWS_ACCESS_KEY_ID = os.environ["S3_ACCESS_KEY"]
AWS_SECRET_ACCESS_KEY = os.environ["S3_SECRET_KEY"]
AWS_STORAGE_BUCKET_NAME = os.environ["S3_BUCKET_NAME"]
AWS_S3_REGION_NAME = os.environ["S3_REGION"]
AWS_S3_SIGNATURE_VERSION = "s3v4"
AWS_QUERYSTRING_AUTH = True   # signed URLs for a private bucket
AWS_DEFAULT_ACL = None        # B2 doesn't support per-object ACLs

#Templates
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

#WSGI application
WSGI_APPLICATION = 'config.wsgi.application'


# Database

# DATABASES = {
#     'default': {
#         'ENGINE': 'django.db.backends.sqlite3',
#         'NAME': BASE_DIR / 'db.sqlite3',
#     }
# }

# DATABASE_URL (e.g. Neon) wins when set; otherwise fall back to POSTGRES_* (docker compose).
# sslmode comes from the URL query string. Neon's pooler is PgBouncer in transaction mode,
# which can't hold server-side cursors, hence disable_server_side_cursors.
if os.getenv("DATABASE_URL"):
    DATABASES = {
        "default": dj_database_url.config(
            conn_max_age=60,
            conn_health_checks=True,
            disable_server_side_cursors=True,
        )
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.getenv("POSTGRES_DB", "octo_travel"),
            "USER": os.getenv("POSTGRES_USER", "octo"),
            "PASSWORD": os.environ["POSTGRES_PASSWORD"],
            "HOST": os.getenv("POSTGRES_HOST", "localhost"),
            "PORT": os.getenv("POSTGRES_PORT", "5432"),
            "CONN_MAX_AGE": 60,
        }
    }

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

#Rest frame work and swagger docs
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_RENDERER_CLASSES": [
        "config.renderers.EnvelopeJSONRenderer",
    ],
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "EXCEPTION_HANDLER": "config.exception_handlers.custom_exception_handler",
    # Baseline for every DRF view. The auth endpoints override it with a
    # stricter scoped throttle (see authentication/views.py).
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    # Throttle counters live in Django's cache, which defaults to a per-process
    # LocMemCache. Point CACHES at a shared backend (Redis, DatabaseCache)
    # before running more than one worker, or each worker counts separately.
    "DEFAULT_THROTTLE_RATES": {
        "anon": "100/min",
        "user": "300/min",
        "login": "5/min",
        "register": "10/hour",
        "token_refresh": "30/min",
        "logout": "30/min",
    },
}

# Refresh tokens rotate on every use and the spent one is blacklisted, so a
# stolen refresh token stops working as soon as the real client refreshes.
# Access (5 min) and refresh (1 day) lifetimes stay at SimpleJWT's defaults.
SIMPLE_JWT = {
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
}

SPECTACULAR_SETTINGS = {
    "TITLE": "Octo-travel API",
    "DESCRIPTION": "API documentation for Octo-travel.",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "SWAGGER_UI_SETTINGS": {
        "persistAuthorization": True,
    },
}

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True


# Static files (CSS, JavaScript, Images)
STATIC_URL = 'static/'

# Serverless hosts (Vercel) have no web server in front of Django, and Django only serves
# /static/ itself when DEBUG=True. WhiteNoise serves it from inside the app; USE_FINDERS makes
# it read admin/Jazzmin assets straight from the installed packages, so no collectstatic
# build step (and no STATIC_ROOT) is needed. Trade-off: no compression or cache-busting hashes.
WHITENOISE_USE_FINDERS = True


# Email
EMAIL_BACKEND = (
    "django.core.mail.backends.console.EmailBackend"
)