'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Timer,
  Layers,
  Repeat,
  Trash2,
  Clock,
  BookmarkPlus,
  Crown,
  ChevronRight,
} from 'lucide-react';
import { useLibraryStore } from '@/lib/library-store';
import { useSettingsStore } from '@/lib/settings-store';
import { useTimerStore } from '@/lib/timer-store';
import { SavedTimer, MAX_FREE_SAVED_TIMERS } from '@/lib/types';
import { getTotalDurationLabel } from '@/lib/format';