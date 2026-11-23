import '@testing-library/jest-dom/vitest';
import {cleanup} from '@testing-library/react';
import {afterEach, vi} from 'vitest';

if (typeof window !== 'undefined' && typeof window.scrollTo !== 'function') {
  window.scrollTo = vi.fn();
}

afterEach(() => {
  cleanup();
});
