# Wizzmo Database Backup Report
Generated: $(date)
Project ID: miygmdboiesbxwlqgnsx
Database: db.miygmdboiesbxwlqgnsx.supabase.co

## Current Data Summary
- **Users:** 29 total users
- **Mentor Profiles:** 16 active mentors  
- **Questions:** 25 questions submitted
- **Messages:** 16 chat messages
- **Advice Sessions:** 26 active sessions
- **Reports:** 1 content report
- **Mentor Applications:** 9 pending/processed applications

## 🗄️ Complete Backup Commands

### 1. Full Database Backup (Recommended)
```bash
# Using pg_dump (requires database password)
pg_dump -h db.miygmdboiesbxwlqgnsx.supabase.co \
        -U postgres \
        -d postgres \
        --clean --if-exists --verbose \
        -f "wizzmo_full_backup_$(date +%Y%m%d).sql"

# Or using Supabase CLI
supabase db dump --project-ref miygmdboiesbxwlqgnsx \
        --db-url "postgresql://postgres:[PASSWORD]@db.miygmdboiesbxwlqgnsx.supabase.co:5432/postgres" \
        -f "wizzmo_backup_$(date +%Y%m%d).sql"
```

### 2. Schema-Only Backup
```bash
pg_dump --schema-only \
        -h db.miygmdboiesbxwlqgnsx.supabase.co \
        -U postgres \
        -d postgres \
        -f "wizzmo_schema_$(date +%Y%m%d).sql"
```

### 3. Critical Tables Export (CSV)
```bash
# Export users table
psql -h db.miygmdboiesbxwlqgnsx.supabase.co -U postgres -d postgres \
     -c "COPY users TO STDOUT WITH CSV HEADER;" > users_backup.csv

# Export questions
psql -h db.miygmdboiesbxwlqgnsx.supabase.co -U postgres -d postgres \
     -c "COPY questions TO STDOUT WITH CSV HEADER;" > questions_backup.csv

# Export mentor profiles  
psql -h db.miygmdboiesbxwlqgnsx.supabase.co -U postgres -d postgres \
     -c "COPY mentor_profiles TO STDOUT WITH CSV HEADER;" > mentor_profiles_backup.csv
```

## 🔄 Automated Backup Script

Create a cron job for daily backups:

```bash
#!/bin/bash
# File: /usr/local/bin/wizzmo_daily_backup.sh

BACKUP_DIR="/path/to/backups"
DATE=$(date +%Y%m%d)
PROJECT_ID="miygmdboiesbxwlqgnsx"

# Create backup
pg_dump -h db.$PROJECT_ID.supabase.co \
        -U postgres \
        -d postgres \
        -f "$BACKUP_DIR/wizzmo_backup_$DATE.sql"

# Compress backup
gzip "$BACKUP_DIR/wizzmo_backup_$DATE.sql"

# Upload to cloud storage (optional)
# aws s3 cp "$BACKUP_DIR/wizzmo_backup_$DATE.sql.gz" s3://your-backup-bucket/

# Keep only last 30 days of backups
find $BACKUP_DIR -name "wizzmo_backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: wizzmo_backup_$DATE.sql.gz"
```

### Add to crontab for daily 2 AM backups:
```bash
crontab -e
# Add this line:
0 2 * * * /usr/local/bin/wizzmo_daily_backup.sh
```

## 💾 Supabase Dashboard Backup

### Manual Backup via Dashboard:
1. Go to: https://supabase.com/dashboard/project/miygmdboiesbxwlqgnsx
2. Settings → Database → Backups
3. Enable Point-in-Time Recovery (PITR)
4. Download manual snapshots as needed

### Restoration Commands:
```bash
# Restore from backup file
psql -h db.miygmdboiesbxwlqgnsx.supabase.co \
     -U postgres \
     -d postgres \
     -f "wizzmo_backup_YYYYMMDD.sql"

# Or using Supabase CLI
supabase db push --db-url "postgresql://postgres:[PASSWORD]@db.miygmdboiesbxwlqgnsx.supabase.co:5432/postgres"
```

## 🛡️ Best Practices

1. **Daily automated backups** (recommended)
2. **Before major updates** - always backup first
3. **Test restore process** monthly 
4. **Store backups offsite** (AWS S3, Google Drive, etc.)
5. **Keep multiple versions** (at least 30 days worth)
6. **Monitor backup success** via logs/alerts

## ⚠️ Critical Notes

- Database contains **sensitive user data** - encrypt backups
- Password required: Found in Supabase dashboard → Settings → Database → Connection pooling
- Test restoration on staging environment first
- Users table contains real email addresses - handle with care
- Messages table contains private conversations - GDPR compliance required

## 🔗 Quick Access Links

- **Supabase Dashboard:** https://supabase.com/dashboard/project/miygmdboiesbxwlqgnsx
- **Database URL:** db.miygmdboiesbxwlqgnsx.supabase.co:5432
- **API URL:** https://miygmdboiesbxwlqgnsx.supabase.co

---
*This backup report generated automatically. Update regularly as database grows.*