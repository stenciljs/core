import { describe, expect, it } from 'vitest';

import { getRulesForVersionUpgrade } from '../index';

describe('migrations/index', () => {
  describe('getRulesForVersionUpgrade', () => {
    it('should return rules for 4.x to 5.x upgrade', () => {
      const rules = getRulesForVersionUpgrade('4', '5');

      expect(rules.length).toBeGreaterThan(0);
      expect(rules.every((r) => r.fromVersion.startsWith('4'))).toBe(true);
      expect(rules.every((r) => r.toVersion.startsWith('5'))).toBe(true);
    });

    it('should include encapsulation-api rule for v4 to v5', () => {
      const rules = getRulesForVersionUpgrade('4', '5');
      const encapsulationRule = rules.find((r) => r.id === 'encapsulation-api');

      expect(encapsulationRule).toBeDefined();
      expect(encapsulationRule!.name).toBe('Encapsulation API');
    });

    it('should include form-associated rule for v4 to v5', () => {
      const rules = getRulesForVersionUpgrade('4', '5');
      const formAssociatedRule = rules.find((r) => r.id === 'form-associated');

      expect(formAssociatedRule).toBeDefined();
      expect(formAssociatedRule!.name).toBe('Form Associated');
    });

    it('should return empty array for non-existent version upgrade', () => {
      const rules = getRulesForVersionUpgrade('99', '100');

      expect(rules).toEqual([]);
    });

    it('should return empty array for downgrade', () => {
      const rules = getRulesForVersionUpgrade('5', '4');

      expect(rules).toEqual([]);
    });

    it('should handle partial version matching', () => {
      // Rules have fromVersion: '4.x', toVersion: '5.x'
      // Should match when we pass just '4' and '5'
      const rules = getRulesForVersionUpgrade('4', '5');

      expect(rules.length).toBeGreaterThan(0);
    });
  });
});
