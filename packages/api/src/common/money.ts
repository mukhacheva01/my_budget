import { BadRequestException } from '@nestjs/common';

export const KOPECKS_PER_RUBLE = 100;

export function isKopecks(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}

export function assertKopecks(value: number, field: string): void {
  if (!isKopecks(value)) {
    throw new BadRequestException(
      `${field} должен быть целым неотрицательным числом (копейки)`,
    );
  }
}

export function toKopecks(rubles: number): number {
  return Math.round(rubles * KOPECKS_PER_RUBLE);
}

export function fromKopecks(kopecks: number): number {
  return kopecks / KOPECKS_PER_RUBLE;
}
