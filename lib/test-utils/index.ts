/**
 * Test utilities for premium content enhancements
 * 
 * This module exports:
 * - Custom arbitraries for property-based testing with fast-check
 * - Test fixtures for consistent test data
 * - Helper functions for testing
 */

export * from './arbitraries';
export * from './fixtures';

// Helper function to wait for async operations in tests
export const waitFor = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper to create a mock Firestore timestamp from a date
export function mockTimestamp(date: Date = new Date()) {
  return {
    seconds: Math.floor(date.getTime() / 1000),
    nanoseconds: (date.getTime() % 1000) * 1000000,
  };
}

// Helper to compare Firestore timestamps
export function timestampsEqual(
  ts1: { seconds: number; nanoseconds: number },
  ts2: { seconds: number; nanoseconds: number }
): boolean {
  return ts1.seconds === ts2.seconds && ts1.nanoseconds === ts2.nanoseconds;
}

// Helper to generate random string
export function randomString(length: number = 10): string {
  return Math.random().toString(36).substring(2, 2 + length);
}

// Helper to generate random ID
export function randomId(): string {
  return `${Date.now()}-${randomString(8)}`;
}
