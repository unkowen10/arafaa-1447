#!/bin/bash
# =============================================================================
#  سكربت رفع موقع يوم عرفة 1447 على GitHub Pages
# =============================================================================
#  الطريقة 1 (موصى بها): باستخدام GitHub CLI (gh)
#    - تأكد من تثبيت gh وتسجيل الدخول: gh auth login
#    - شغّل السكربت: bash deploy.sh
#
#  الطريقة 2: يدوياً
#    - أنشئ مستودع على GitHub
#    - عدّل REPO_URL أدناه
#    - شغّل السكربت
# =============================================================================

set -e

REPO_NAME="arafah-1447"
REPO_URL=""  # اتركه فارغاً لو تستخدم GitHub CLI
               # أو اكتبه يدوياً: https://github.com/USERNAME/arafah-1447.git

# ---------- ألوان ----------
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ---------- Git init ----------
echo -e "${YELLOW}🚀 جاري إعداد Git...${NC}"
if [ ! -d ".git" ]; then
  git init
  git branch -M main
fi

# ---------- Commit ----------
git add .
git commit -m "Deploy: Arafah 1447 guide - $(date '+%Y-%m-%d %H:%M')" || true

# ---------- GitHub CLI method ----------
if command -v gh &> /dev/null && [ -z "$REPO_URL" ]; then
  echo -e "${YELLOW}🔄 GitHub CLI موجود. جاري إنشاء/الرفع...${NC}"
  
  # Check if already has remote
  if git remote | grep origin &> /dev/null; then
    echo -e "${GREEN}✅ Remote موجود، جاري الرفع...${NC}"
    git push origin main
  else
    # Create repo using gh
    echo -e "${YELLOW}📦 إنشاء مستودع جديد: ${REPO_NAME}${NC}"
    gh repo create "$REPO_NAME" --public --source=. --push || {
      echo -e "${RED}❌ فشل الإنشاء. قد يكون المستودع موجوداً.${NC}"
      echo -e "${YELLOW}جاري محاولة الربط والرفع...${NC}"
      git remote add origin "https://github.com/$(gh api user -q '.login')/${REPO_NAME}.git" 2>/dev/null || true
      git push -u origin main || true
    }
  fi

  # Enable Pages via gh
  echo -e "${YELLOW}🌐 تفعيل GitHub Pages...${NC}"
  gh repo edit "$REPO_NAME" --enable-pages --pages-source-branch=main --pages-source-path=/ 2>/dev/null || {
    echo -e "${YELLOW}⚠️ لم يُمكن تفعيل Pages تلقائياً. فعّلها يدوياً من Settings → Pages${NC}"
  }

  USERNAME=$(gh api user -q '.login' 2>/dev/null || echo "YOUR_USERNAME")
  echo -e "${GREEN}✅ تم الرفع! الموقع سيُتاح خلال دقيقتين على:${NC}"
  echo -e "${GREEN}   https://${USERNAME}.github.io/${REPO_NAME}/${NC}"
  exit 0
fi

# ---------- Manual method ----------
if [ -z "$REPO_URL" ]; then
  echo -e "${RED}❌ لم يُعثر على GitHub CLI ولم تُحدد REPO_URL${NC}"
  echo ""
  echo "يرجى إما:"
  echo "  1. تثبيت GitHub CLI: https://cli.github.com"
  echo "     ثم: gh auth login"
  echo "  2. أو تعديل REPO_URL في هذا الملف:"
  echo "     REPO_URL='https://github.com/YOUR_USERNAME/arafah-1447.git'"
  exit 1
fi

if ! git remote | grep origin &> /dev/null; then
  git remote add origin "$REPO_URL"
fi

echo -e "${YELLOW}📤 جاري الرفع إلى ${REPO_URL}...${NC}"
git push -u origin main

echo -e "${GREEN}✅ تم الرفع!${NC}"
echo -e "${YELLOW}⚠️ لا تنسَ تفعيل GitHub Pages يدوياً:${NC}"
echo -e "   GitHub → Settings → Pages → Source: main / (root)"
