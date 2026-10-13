import en from '../locales/en.json';
import zh from '../locales/zh.json';
import cs from '../locales/cs.json';
import de from '../locales/de.json';
import fr from '../locales/fr.json';
import es from '../locales/es.json';
import itLocale from '../locales/it.json';
import pt from '../locales/pt.json';
import ru from '../locales/ru.json';
import ja from '../locales/ja.json';
import ko from '../locales/ko.json';
import ar from '../locales/ar.json';

const locales: Record<string, any> = {
  en,
  zh,
  cs,
  de,
  fr,
  es,
  it: itLocale,
  pt,
  ru,
  ja,
  ko,
  ar,
};

const getDeepKeys = (obj: Record<string, any>, prefix = ''): string[] => {
  return Object.keys(obj).reduce((res: string[], el: string) => {
    const key = prefix ? `${prefix}.${el}` : el;
    if (typeof obj[el] === 'object' && obj[el] !== null && !Array.isArray(obj[el])) {
      return [...res, ...getDeepKeys(obj[el], key)];
    }
    return [...res, key];
  }, []);
};

describe('i18n Locale Parity and Quality Audit', () => {
  const languageCodes = Object.keys(locales);

  test('contains all 12 supported languages', () => {
    expect(languageCodes.length).toBe(12);
    expect(languageCodes).toEqual(
      expect.arrayContaining(['en', 'zh', 'cs', 'de', 'fr', 'es', 'it', 'pt', 'ru', 'ja', 'ko', 'ar'])
    );
  });

  test('every locale has primary top-level namespaces', () => {
    const expectedTopLevels = ['app', 'pages', 'forms', 'common', 'stepper', 'navigation', 'footer', 'components'];
    languageCodes.forEach((lang) => {
      expectedTopLevels.forEach((ns) => {
        expect(locales[lang][ns]).toBeDefined();
      });
    });
  });

  test('all 12 languages have identical components.leadForm key structure', () => {
    const enLeadFormKeys = getDeepKeys(locales.en.components.leadForm).sort();
    expect(enLeadFormKeys.length).toBeGreaterThan(30);

    languageCodes.forEach((lang) => {
      const currentKeys = getDeepKeys(locales[lang].components.leadForm).sort();
      expect(currentKeys).toEqual(enLeadFormKeys);
    });
  });

  test('no translation values in components.leadForm are empty or null', () => {
    languageCodes.forEach((lang) => {
      const keys = getDeepKeys(locales[lang].components.leadForm);
      keys.forEach((keyPath) => {
        const parts = keyPath.split('.');
        let val = locales[lang].components.leadForm;
        for (const p of parts) {
          val = val?.[p];
        }
        expect(val).toBeDefined();
        expect(typeof val).toBe('string');
        expect(val.trim().length).toBeGreaterThan(0);
      });
    });
  });

  test('non-Chinese locales do not leak Chinese characters in leadForm core field labels', () => {
    const nonChineseLangs = ['en', 'cs', 'de', 'fr', 'es', 'it', 'pt', 'ru'];
    const chineseRegex = /[\u4e00-\u9fff]/;

    nonChineseLangs.forEach((lang) => {
      const fields = locales[lang].components.leadForm.fields;
      expect(fields.firstName).not.toMatch(chineseRegex);
      expect(fields.lastName).not.toMatch(chineseRegex);
      expect(fields.dateOfBirth).not.toMatch(chineseRegex);
      expect(fields.gender).not.toMatch(chineseRegex);
      expect(fields.nationality).not.toMatch(chineseRegex);
      expect(fields.startDate).not.toMatch(chineseRegex);
      expect(fields.duration).not.toMatch(chineseRegex);
      expect(fields.email).not.toMatch(chineseRegex);
      expect(fields.phone).not.toMatch(chineseRegex);
    });
  });

  test('no unfinished TODO or placeholder tokens exist in any locale', () => {
    languageCodes.forEach((lang) => {
      const jsonStr = JSON.stringify(locales[lang]);
      expect(jsonStr).not.toContain('TODO');
      expect(jsonStr).not.toContain('__MISSING__');
    });
  });
});
