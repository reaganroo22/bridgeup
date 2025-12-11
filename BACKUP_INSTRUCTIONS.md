# 🗄️ Wizzmo Database Backup Guide

## Quick Backup Command

```bash
# Complete database backup (run this now!)
pg_dump -h db.miygmdboiesbxwlqgnsx.supabase.co \
        -U postgres \
        -d postgres \
        --clean --if-exists --verbose \
        -f "wizzmo_complete_backup_$(date +%Y%m%d_%H%M%S).sql"
```

## 📊 Current Database Status
- **Total Users:** 29
- **Active Mentors:** 16 
- **Questions:** 25
- **Messages:** 16
- **Advice Sessions:** 26
- **Reports:** 1
- **Applications:** 9

## 🔑 Database Connection Info
- **Host:** db.miygmdboiesbxwlqgnsx.supabase.co
- **Port:** 5432
- **Database:** postgres
- **User:** postgres
- **Password:** *Get from Supabase Dashboard → Settings → Database*

## 🚀 Backup Methods

### 1. Manual Backup (Recommended)
```bash
# Full backup with all data
pg_dump -h db.miygmdboiesbxwlqgnsx.supabase.co \
        -U postgres \
        -d postgres \
        -f "wizzmo_backup_$(date +%Y%m%d).sql"

# Compress the backup
gzip "wizzmo_backup_$(date +%Y%m%d).sql"
```

### 2. Supabase Dashboard Backup
1. Go to: https://supabase.com/dashboard/project/miygmdboiesbxwlqgnsx
2. Settings → Database → Backups
3. Create manual backup
4. Download when complete

### 3. Critical Tables Only
```bash
# Users table
pg_dump -h db.miygmdboiesbxwlqgnsx.supabase.co \
        -U postgres \
        -d postgres \
        -t users \
        -f "users_backup_$(date +%Y%m%d).sql"

# Messages table  
pg_dump -h db.miygmdboiesbxwlqgnsx.supabase.co \
        -U postgres \
        -d postgres \
        -t messages \
        -f "messages_backup_$(date +%Y%m%d).sql"

# Questions table
pg_dump -h db.miygmdboiesbxwlqgnsx.supabase.co \
        -U postgres \
        -d postgres \
        -t questions \
        -f "questions_backup_$(date +%Y%m%d).sql"
```

## 📅 Automated Daily Backup Script

Create `/usr/local/bin/wizzmo_backup.sh`:
```bash
#!/bin/bash
BACKUP_DIR="/Users/$(whoami)/wizzmo_backups"
DATE=$(date +%Y%m%d_%H%M%S)
PROJECT="miygmdboiesbxwlqgnsx"

mkdir -p "$BACKUP_DIR"

echo "🗄️ Starting Wizzmo backup - $DATE"

# Full backup
pg_dump -h "db.$PROJECT.supabase.co" \
        -U postgres \
        -d postgres \
        -f "$BACKUP_DIR/wizzmo_$DATE.sql"

# Compress
gzip "$BACKUP_DIR/wizzmo_$DATE.sql"

# Keep only last 30 days
find "$BACKUP_DIR" -name "wizzmo_*.sql.gz" -mtime +30 -delete

echo "✅ Backup complete: $BACKUP_DIR/wizzmo_$DATE.sql.gz"

# Optional: Upload to cloud
# aws s3 cp "$BACKUP_DIR/wizzmo_$DATE.sql.gz" s3://your-bucket/
```

Make executable and run:
```bash
chmod +x /usr/local/bin/wizzmo_backup.sh
/usr/local/bin/wizzmo_backup.sh
```

## ⏰ Schedule Daily Backups

Add to crontab (run `crontab -e`):
```bash
# Daily backup at 2 AM
0 2 * * * /usr/local/bin/wizzmo_backup.sh
```

## 🔄 Restore Commands

### Full Database Restore:
```bash
# Drop and recreate (DANGER - only for emergencies!)
psql -h db.miygmdboiesbxwlqgnsx.supabase.co \
     -U postgres \
     -d postgres \
     -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Restore from backup
psql -h db.miygmdboiesbxwlqgnsx.supabase.co \
     -U postgres \
     -d postgres \
     -f "wizzmo_backup_YYYYMMDD.sql"
```

### Single Table Restore:
```bash
# Restore just users table
psql -h db.miygmdboiesbxwlqgnsx.supabase.co \
     -U postgres \
     -d postgres \
     -f "users_backup_YYYYMMDD.sql"
```

## ⚠️ Important Notes

1. **Get Database Password:**
   - Supabase Dashboard → Settings → Database → Connection pooling
   - Look for "Password" field

2. **Security:**
   - Database contains sensitive user data
   - Encrypt backup files
   - Store in secure location

3. **Test Restores:**
   - Test on development database first
   - Never restore directly to production without testing

4. **Legal Compliance:**
   - Users table has real emails (GDPR)
   - Messages contain private conversations
   - Handle according to privacy policy

## 🔗 Quick Links

- **Supabase Dashboard:** https://supabase.com/dashboard/project/miygmdboiesbxwlqgnsx
- **Database Settings:** https://supabase.com/dashboard/project/miygmdboiesbxwlqgnsx/settings/database
- **Backups Page:** https://supabase.com/dashboard/project/miygmdboiesbxwlqgnsx/settings/database?tab=backups

---

**RUN BACKUP NOW:** Copy and run the quick backup command at the top! ⬆️