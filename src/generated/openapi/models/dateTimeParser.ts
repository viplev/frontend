// @ts-nocheck - Auto-generated file, TypeScript strict checks disabled intentionally
/* tslint:disable */
/* eslint-disable */

const HAS_TIMEZONE_SUFFIX = /(z|[+-]\d{2}:\d{2}|[+-]\d{4})$/i

export function parseApiDateTime(value: string): Date {
  const trimmed = value.trim()
  if (!trimmed) {
    return new Date(Number.NaN)
  }

  const normalized = HAS_TIMEZONE_SUFFIX.test(trimmed) ? trimmed : `${trimmed}Z`
  return new Date(normalized)
}
