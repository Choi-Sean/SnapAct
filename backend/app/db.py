import pymssql

from .config import settings

# Schema is idempotent (checked via sys.objects/sys.indexes) so init_db() is
# safe to call on every startup — no separate migration step to remember.
_SCHEMA_STATEMENTS = [
    """
    IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.users') AND type = N'U')
    CREATE TABLE dbo.users (
        id NVARCHAR(36) NOT NULL PRIMARY KEY,
        email NVARCHAR(255) NOT NULL,
        password_hash NVARCHAR(255) NULL,
        [plan] NVARCHAR(20) NOT NULL DEFAULT 'free',
        created_at BIGINT NOT NULL
    )
    """,
    """
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'ix_users_email' AND object_id = OBJECT_ID('dbo.users'))
    CREATE UNIQUE INDEX ix_users_email ON dbo.users(email)
    """,
    """
    IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.subscriptions') AND type = N'U')
    CREATE TABLE dbo.subscriptions (
        id NVARCHAR(36) NOT NULL PRIMARY KEY,
        user_id NVARCHAR(36) NOT NULL,
        status NVARCHAR(20) NOT NULL DEFAULT 'inactive',
        [plan] NVARCHAR(20) NOT NULL DEFAULT 'pro',
        provider NVARCHAR(20) NULL,
        provider_subscription_id NVARCHAR(255) NULL,
        current_period_start BIGINT NULL,
        current_period_end BIGINT NULL,
        cancel_at_period_end BIT NOT NULL DEFAULT 0,
        created_at BIGINT NOT NULL,
        updated_at BIGINT NOT NULL,
        CONSTRAINT fk_subscriptions_user FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE
    )
    """,
    """
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'ix_subscriptions_user_id' AND object_id = OBJECT_ID('dbo.subscriptions'))
    CREATE INDEX ix_subscriptions_user_id ON dbo.subscriptions(user_id)
    """,
    """
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'ix_subscriptions_status' AND object_id = OBJECT_ID('dbo.subscriptions'))
    CREATE INDEX ix_subscriptions_status ON dbo.subscriptions(status)
    """,
    """
    IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.history_entries') AND type = N'U')
    CREATE TABLE dbo.history_entries (
        id NVARCHAR(36) NOT NULL PRIMARY KEY,
        user_id NVARCHAR(36) NULL,
        type NVARCHAR(30) NOT NULL,
        title NVARCHAR(255) NOT NULL,
        detail NVARCHAR(1000) NULL,
        saved_to NVARCHAR(100) NULL,
        fields_json NVARCHAR(MAX) NULL,
        replay_json NVARCHAR(MAX) NULL,
        created_at BIGINT NOT NULL,
        CONSTRAINT fk_history_user FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE
    )
    """,
    """
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'ix_history_user_created' AND object_id = OBJECT_ID('dbo.history_entries'))
    CREATE INDEX ix_history_user_created ON dbo.history_entries(user_id, created_at DESC)
    """,
    """
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'ix_history_type' AND object_id = OBJECT_ID('dbo.history_entries'))
    CREATE INDEX ix_history_type ON dbo.history_entries(type)
    """,
    """
    IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.uploaded_images') AND type = N'U')
    CREATE TABLE dbo.uploaded_images (
        id NVARCHAR(36) NOT NULL PRIMARY KEY,
        user_id NVARCHAR(36) NULL,
        history_entry_id NVARCHAR(36) NULL,
        content_type NVARCHAR(50) NOT NULL DEFAULT 'image/jpeg',
        image_bytes VARBINARY(MAX) NOT NULL,
        size_bytes INT NOT NULL,
        created_at BIGINT NOT NULL
    )
    """,
    # No FK cascade here on purpose: uploaded_images is reachable from both users
    # and history_entries, and those already cascade into each other, so a third
    # cascading path would hit SQL Server's "multiple cascade paths" restriction.
    # Orphaned images are cleaned up explicitly in application code instead.
    """
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'ix_images_user_id' AND object_id = OBJECT_ID('dbo.uploaded_images'))
    CREATE INDEX ix_images_user_id ON dbo.uploaded_images(user_id)
    """,
    """
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'ix_images_history_entry_id' AND object_id = OBJECT_ID('dbo.uploaded_images'))
    CREATE INDEX ix_images_history_entry_id ON dbo.uploaded_images(history_entry_id)
    """,
    """
    IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.history_batch_items') AND type = N'U')
    CREATE TABLE dbo.history_batch_items (
        id NVARCHAR(36) NOT NULL PRIMARY KEY,
        history_entry_id NVARCHAR(36) NOT NULL,
        category NVARCHAR(30) NOT NULL,
        title NVARCHAR(255) NOT NULL,
        detail NVARCHAR(1000) NULL,
        saved_to NVARCHAR(100) NULL,
        replay_json NVARCHAR(MAX) NULL,
        image_id NVARCHAR(36) NULL,
        sort_order INT NOT NULL DEFAULT 0,
        CONSTRAINT fk_batch_items_entry FOREIGN KEY (history_entry_id) REFERENCES dbo.history_entries(id) ON DELETE CASCADE,
        CONSTRAINT fk_batch_items_image FOREIGN KEY (image_id) REFERENCES dbo.uploaded_images(id) ON DELETE SET NULL
    )
    """,
    """
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'ix_batch_items_entry_id' AND object_id = OBJECT_ID('dbo.history_batch_items'))
    CREATE INDEX ix_batch_items_entry_id ON dbo.history_batch_items(history_entry_id)
    """,
]


def get_connection():
    return pymssql.connect(
        server=settings.db_server,
        database=settings.db_name,
        user=settings.db_user,
        password=settings.db_password,
        login_timeout=15,
    )


def init_db() -> None:
    if not settings.db_enabled:
        return
    conn = get_connection()
    try:
        cur = conn.cursor()
        for statement in _SCHEMA_STATEMENTS:
            cur.execute(statement)
        conn.commit()
    finally:
        conn.close()
