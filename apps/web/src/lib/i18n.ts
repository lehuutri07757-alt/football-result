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
  | 'label.language'
  // Sidebar
  | 'sidebar.sports'
  | 'sidebar.football'
  | 'sidebar.vipClub'
  | 'sidebar.vipDesc'
  | 'sidebar.viewStatus'
  // Match detail
  | 'match.changeMatch'
  | 'match.loadError'
  | 'match.noData'
  | 'match.back'
  | 'match.retry'
  // Tabs
  | 'tab.popular'
  | 'tab.custom'
  | 'tab.handicapOU'
  | 'tab.goals'
  | 'tab.intervals'
  | 'tab.corners'
  | 'tab.all'
  // Markets
  | 'market.main'
  | 'market.over'
  | 'market.under'
  | 'market.1x2'
  | 'market.teamOU'
  | 'market.bothScore'
  | 'market.yes'
  | 'market.no'
  | 'market.updating'
  | 'market.checkBack'
  | 'market.noOdds'
  // Results page
  | 'results.title'
  | 'results.subtitle'
  | 'results.standings'
  | 'results.matchResults'
  | 'results.noResults'
  | 'results.loading'
  | 'results.team'
  | 'results.played'
  | 'results.won'
  | 'results.drawn'
  | 'results.lost'
  | 'results.goalsFor'
  | 'results.goalsAgainst'
  | 'results.goalDiff'
  | 'results.points'
  | 'results.selectLeague'
  | 'results.allLeagues'
  | 'results.selectLeagueForStandings'
  | 'results.ft'
  | 'results.searchLeagues'
  | 'results.loadMore'
  | 'results.noLeaguesFound'
  | 'results.form'
  | 'common.loading';

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
    // Sidebar
    'sidebar.sports': 'Sports',
    'sidebar.football': 'Football',
    'sidebar.vipClub': 'VIP Club',
    'sidebar.vipDesc': 'Unlock exclusive bonuses',
    'sidebar.viewStatus': 'View Status',
    // Match detail
    'match.changeMatch': 'Change Match',
    'match.loadError': 'Failed to load match',
    'match.noData': 'No data found',
    'match.back': 'Go Back',
    'match.retry': 'Retry',
    // Tabs
    'tab.popular': 'Popular',
    'tab.custom': 'Custom',
    'tab.handicapOU': 'Handicap & O/U',
    'tab.goals': 'Goals',
    'tab.intervals': 'Intervals',
    'tab.corners': 'Corners',
    'tab.all': 'All',
    // Markets
    'market.main': 'Main Odds',
    'market.over': 'Over',
    'market.under': 'Under',
    'market.1x2': '1 X 2 (European Odds)',
    'market.teamOU': 'Over/Under',
    'market.bothScore': 'Both Teams to Score',
    'market.yes': 'Yes',
    'market.no': 'No',
    'market.updating': 'Markets updating',
    'market.checkBack': 'Please check back later',
    'market.noOdds': 'No odds available',
    // Results page
    'results.title': 'Results & Standings',
    'results.subtitle': 'Match results and league standings',
    'results.standings': 'Standings',
    'results.matchResults': 'Match Results',
    'results.noResults': 'No results found',
    'results.loading': 'Loading results...',
    'results.team': 'Team',
    'results.played': 'P',
    'results.won': 'W',
    'results.drawn': 'D',
    'results.lost': 'L',
    'results.goalsFor': 'GF',
    'results.goalsAgainst': 'GA',
    'results.goalDiff': 'GD',
    'results.points': 'Pts',
    'results.selectLeague': 'Select League',
    'results.allLeagues': 'All Leagues',
    'results.selectLeagueForStandings': 'Select a league to view standings',
    'results.ft': 'FT',
    'results.searchLeagues': 'Search leagues...',
    'results.loadMore': 'Load more',
    'results.noLeaguesFound': 'No leagues found',
    'results.form': 'Form',
    'common.loading': 'Loading...',
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
    // Sidebar
    'sidebar.sports': 'Thể thao',
    'sidebar.football': 'Bóng đá',
    'sidebar.vipClub': 'VIP Club',
    'sidebar.vipDesc': 'Mở khóa ưu đãi độc quyền',
    'sidebar.viewStatus': 'Xem trạng thái',
    // Match detail
    'match.changeMatch': 'Đổi trận đấu',
    'match.loadError': 'Không tải được trận đấu',
    'match.noData': 'Không tìm thấy dữ liệu',
    'match.back': 'Quay lại',
    'match.retry': 'Thử lại',
    // Tabs
    'tab.popular': 'Phổ biến',
    'tab.custom': 'Tùy chọn',
    'tab.handicapOU': 'Chấp & T/X',
    'tab.goals': 'Bàn thắng',
    'tab.intervals': 'Intervals',
    'tab.corners': 'Phạt góc',
    'tab.all': 'Tất cả',
    // Markets
    'market.main': 'Kèo Chính',
    'market.over': 'Tài (Over)',
    'market.under': 'Xỉu (Under)',
    'market.1x2': '1 X 2 (Kèo Châu Âu)',
    'market.teamOU': 'Tài/Xỉu',
    'market.bothScore': 'Hai đội ghi bàn',
    'market.yes': 'Có',
    'market.no': 'Không',
    'market.updating': 'Thị trường đang được cập nhật',
    'market.checkBack': 'Vui lòng quay lại sau',
    'market.noOdds': 'Chưa có kèo',
    // Results page
    'results.title': 'Kết quả & Bảng xếp hạng',
    'results.subtitle': 'Kết quả trận đấu và bảng xếp hạng giải đấu',
    'results.standings': 'Bảng xếp hạng',
    'results.matchResults': 'Kết quả trận đấu',
    'results.noResults': 'Không tìm thấy kết quả',
    'results.loading': 'Đang tải kết quả...',
    'results.team': 'Đội',
    'results.played': 'Tr',
    'results.won': 'Th',
    'results.drawn': 'H',
    'results.lost': 'Thua',
    'results.goalsFor': 'BT',
    'results.goalsAgainst': 'BN',
    'results.goalDiff': 'HS',
    'results.points': 'Đ',
    'results.selectLeague': 'Chọn giải đấu',
    'results.allLeagues': 'Tất cả giải đấu',
    'results.selectLeagueForStandings': 'Chọn một giải đấu để xem bảng xếp hạng',
    'results.ft': 'KT',
    'results.searchLeagues': 'Tìm giải đấu...',
    'results.loadMore': 'Xem thêm',
    'results.noLeaguesFound': 'Không tìm thấy giải đấu',
    'results.form': 'Phong độ',
    'common.loading': 'Đang tải...',
  },
};

export function t(language: Language, key: I18nKey): string {
  const dict = dictionaries[language] ?? dictionaries.en;
  return dict[key] ?? dictionaries.en[key];
}
