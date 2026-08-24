// src/utils/timeAgo.ts
import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';

// 1. Register the locale globally (this runs exactly once when the file is imported)
TimeAgo.addDefaultLocale(en);

// 2. Create a single, reusable instance
const timeAgo = new TimeAgo('en-US');

// 3. Export the configured instance
export default timeAgo;