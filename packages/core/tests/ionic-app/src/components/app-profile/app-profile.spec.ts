import { AppProfile } from './app-profile';

describe('app-profile', () => {
  it('builds', () => {
    expect(new AppProfile()).toBeTruthy();
  });

  describe('normalization', () => {
    it('returns a blank string if the name is undefined', () => {
      const component = new AppProfile();
      expect(component.formattedName()).toEqual('');
    });

    it('capitalizes the first letter', () => {
      const component = new AppProfile();
      component.name = 'quincy';
      expect(component.formattedName()).toEqual('Quincy');
    });

    it('lower-cases the following letters', () => {
      const component = new AppProfile();
      component.name = 'JOSEPH';
      expect(component.formattedName()).toEqual('Joseph');
    });

    it('handles single letter names', () => {
      const component = new AppProfile();
      component.name = 'q';
      expect(component.formattedName()).toEqual('Q');
    });
  });
});
