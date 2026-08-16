import pymssql

from .config import settings

# Schema is idempotent (checked via sys.objects/sys.indexes) so init_db() is
# safe to call on every startup — no separate migration step to remember.
_SCHEMA_STATEMENTS = [
    """
    IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.Users') AND type = N'U')
    CREATE TABLE dbo.Users (
        UserId NVARCHAR(36) NOT NULL PRIMARY KEY,
        Email NVARCHAR(255) NOT NULL,
        PasswordHash NVARCHAR(255) NULL,
        [Plan] NVARCHAR(20) NOT NULL DEFAULT 'free',
        CreateDate BIGINT NOT NULL
    )
    """,
    """
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Users_Email' AND object_id = OBJECT_ID('dbo.Users'))
    CREATE UNIQUE INDEX IX_Users_Email ON dbo.Users(Email)
    """,
    """
    IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.Subscriptions') AND type = N'U')
    CREATE TABLE dbo.Subscriptions (
        SubscriptionId NVARCHAR(36) NOT NULL PRIMARY KEY,
        UserId NVARCHAR(36) NOT NULL,
        Status NVARCHAR(20) NOT NULL DEFAULT 'inactive',
        [Plan] NVARCHAR(20) NOT NULL DEFAULT 'pro',
        Provider NVARCHAR(20) NULL,
        ProviderSubscriptionId NVARCHAR(255) NULL,
        CurrentPeriodStart BIGINT NULL,
        CurrentPeriodEnd BIGINT NULL,
        CancelAtPeriodEnd BIT NOT NULL DEFAULT 0,
        CreateDate BIGINT NOT NULL,
        UpdateDate BIGINT NOT NULL,
        CONSTRAINT FK_Subscriptions_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(UserId) ON DELETE CASCADE
    )
    """,
    """
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Subscriptions_UserId' AND object_id = OBJECT_ID('dbo.Subscriptions'))
    CREATE INDEX IX_Subscriptions_UserId ON dbo.Subscriptions(UserId)
    """,
    """
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Subscriptions_Status' AND object_id = OBJECT_ID('dbo.Subscriptions'))
    CREATE INDEX IX_Subscriptions_Status ON dbo.Subscriptions(Status)
    """,
    """
    IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.HistoryEntries') AND type = N'U')
    CREATE TABLE dbo.HistoryEntries (
        HistoryEntryId NVARCHAR(36) NOT NULL PRIMARY KEY,
        UserId NVARCHAR(36) NULL,
        [Type] NVARCHAR(30) NOT NULL,
        Title NVARCHAR(255) NOT NULL,
        Detail NVARCHAR(1000) NULL,
        SavedTo NVARCHAR(100) NULL,
        FieldsJson NVARCHAR(MAX) NULL,
        ReplayJson NVARCHAR(MAX) NULL,
        CreateDate BIGINT NOT NULL,
        CONSTRAINT FK_HistoryEntries_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(UserId) ON DELETE CASCADE
    )
    """,
    """
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_HistoryEntries_UserId_CreateDate' AND object_id = OBJECT_ID('dbo.HistoryEntries'))
    CREATE INDEX IX_HistoryEntries_UserId_CreateDate ON dbo.HistoryEntries(UserId, CreateDate DESC)
    """,
    """
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_HistoryEntries_Type' AND object_id = OBJECT_ID('dbo.HistoryEntries'))
    CREATE INDEX IX_HistoryEntries_Type ON dbo.HistoryEntries([Type])
    """,
    """
    IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.UploadedImages') AND type = N'U')
    CREATE TABLE dbo.UploadedImages (
        UploadedImageId NVARCHAR(36) NOT NULL PRIMARY KEY,
        UserId NVARCHAR(36) NULL,
        HistoryEntryId NVARCHAR(36) NULL,
        ContentType NVARCHAR(50) NOT NULL DEFAULT 'image/jpeg',
        ImageBytes VARBINARY(MAX) NOT NULL,
        SizeBytes INT NOT NULL,
        CreateDate BIGINT NOT NULL
    )
    """,
    # No FK cascade here on purpose: UploadedImages is reachable from both Users
    # and HistoryEntries, and those already cascade into each other, so a third
    # cascading path would hit SQL Server's "multiple cascade paths" restriction.
    # Orphaned images are cleaned up explicitly in application code instead.
    """
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_UploadedImages_UserId' AND object_id = OBJECT_ID('dbo.UploadedImages'))
    CREATE INDEX IX_UploadedImages_UserId ON dbo.UploadedImages(UserId)
    """,
    """
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_UploadedImages_HistoryEntryId' AND object_id = OBJECT_ID('dbo.UploadedImages'))
    CREATE INDEX IX_UploadedImages_HistoryEntryId ON dbo.UploadedImages(HistoryEntryId)
    """,
    """
    IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.HistoryBatchItems') AND type = N'U')
    CREATE TABLE dbo.HistoryBatchItems (
        HistoryBatchItemId NVARCHAR(36) NOT NULL PRIMARY KEY,
        HistoryEntryId NVARCHAR(36) NOT NULL,
        Category NVARCHAR(30) NOT NULL,
        Title NVARCHAR(255) NOT NULL,
        Detail NVARCHAR(1000) NULL,
        SavedTo NVARCHAR(100) NULL,
        ReplayJson NVARCHAR(MAX) NULL,
        UploadedImageId NVARCHAR(36) NULL,
        SortOrder INT NOT NULL DEFAULT 0,
        CONSTRAINT FK_HistoryBatchItems_HistoryEntries FOREIGN KEY (HistoryEntryId) REFERENCES dbo.HistoryEntries(HistoryEntryId) ON DELETE CASCADE,
        CONSTRAINT FK_HistoryBatchItems_UploadedImages FOREIGN KEY (UploadedImageId) REFERENCES dbo.UploadedImages(UploadedImageId) ON DELETE SET NULL
    )
    """,
    """
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_HistoryBatchItems_HistoryEntryId' AND object_id = OBJECT_ID('dbo.HistoryBatchItems'))
    CREATE INDEX IX_HistoryBatchItems_HistoryEntryId ON dbo.HistoryBatchItems(HistoryEntryId)
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
