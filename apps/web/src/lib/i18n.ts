import type { Language } from '@/stores/language.store';

export type I18nKey =
  | 'nav.sports'
  | 'nav.results'
  | 'auth.login'
  | 'auth.register'
  | 'menu.account'
  | 'menu.wallet'
  | 'menu.admin'
  | 'menu.logout'
  | 'label.language';

const dictionaries: Record<Language, Record<I18nKey, string>> = {
  en: {
    'nav.sports': 'SPORTS',
    'nav.results': 'RESULTS',
    'auth.login': 'LOGIN',
    'auth.register': 'REGISTER',
    'menu.account': 'Account',
    'menu.wallet': 'Wallet / Deposit',
    'menu.admin': 'Admin',
    'menu.logout': 'Logout',
    'label.language': 'Language',
  },
  vi: {
    'nav.sports': 'THỂ THAO',
    'nav.results': 'KẾT QUẢ',
    'auth.login': 'ĐĂNG NHẬP',
    'auth.register': 'ĐĂNG KÝ',
    'menu.account': 'Tài khoản',
    'menu.wallet': 'Ví / Nạp tiền',
    'menu.admin': 'Quản trị Admin',
    'menu.logout': 'Đăng xuất',
    'label.language': 'Ngôn ngữ',
  },
};

export function t(language: Language, key: I18nKey): string {
  const dict = dictionaries[language] ?? dictionaries.en;
  return dict[key] ?? dictionaries.en[key];
}
