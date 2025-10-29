---
description: Translation Implementation
auto_execution_mode: 1
---

STEP 1
Check the @en.json as reference for the proper and correct text keys definitions

STEP 2
Import - Add useTranslation import and hook for the tagged file:

import { useTranslation } from 'react-i18next';

const { t } = useTranslation();

STEP 3
Replace - Change hardcoded text to t() calls:
typescript
// Before:
<Text>Goals Hub</Text>

// After:
<Text>{t('goals.hub.title')}</Text>

