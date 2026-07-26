import type { DeepPartial } from '../merge';
import type { en } from './en';
import type { Language } from '../types';

type LocaleOverride = DeepPartial<typeof en>;

const pt: LocaleOverride = {
  nav: {
    home: 'Calculadora',
    jobs: 'Intel de vagas',
    market: 'Mercado',
    deals: 'Ofertas',
    docs: 'Docs SWT',
    chat: 'Chat IA',
    admin: 'Admin',
  },
  home: {
    pageTitle: 'Calculadora de vagas',
    pageSubtitle: 'Sandbox privado de ofertas — não é lista oficial nem sincroniza com intel automaticamente.',
    pageHint: 'Preencha manualmente ou importe da intel; compare até 3 vagas pelo líquido.',
    title: 'Minhas vagas',
    subtitle: 'Ferramenta inteligente de escolha',
    addJob: 'Nova vaga',
    noJobs: 'Nenhuma vaga salva',
    noJobsDescription: 'Use o formulário à esquerda ou importe da biblioteca de intel.',
    browseJobIntel: 'Ver intel de vagas',
    compare: 'Comparar',
    addToCompare: 'Adicionar',
    removeFromCompare: 'Remover',
    maxCompare: 'Máximo 3 vagas',
  },
  income: {
    heroLabel: 'Líquido estimado do projeto (após impostos)',
    heroWeekly: 'Cerca de ${weekly}/sem · {weeks} semanas',
    heroHint: 'Ajuste os controles abaixo — o valor atualiza em tempo real',
    heroDetails: 'Impostos e mais',
    cycleCurrency: 'Trocar moeda (atual: {currency})',
    cycleCurrencyHint: 'Toque no valor para alternar para USD',
    federalTaxLabel: 'Imposto federal (Fed 10%)',
    stateTaxLabel: 'Imposto estadual ({rate}%)',
    totalHousing: 'Moradia total',
    footerNote: '*Total aproximado em {weeks} semanas; J-1 isento de FICA, impostos simplificados',
  },
  compare: { title: 'Comparar vagas', compareJobs: 'Comparar' },
  jobForm: { saveJob: 'Salvar', hourlyWage: 'Salário/hora ($)', state: 'Estado' },
  language: { switch: 'Idioma' },
  theme: {
    light: 'Claro',
    dark: 'Escuro',
    switchToLight: 'Modo claro',
    switchToDark: 'Modo escuro',
    toggle: 'Tema',
  },
};

const tr: LocaleOverride = {
  nav: {
    home: 'Hesaplayıcı',
    jobs: 'İş istihbaratı',
    market: 'Pazar',
    deals: 'Fırsatlar',
    docs: 'SWT Doküman',
    chat: 'AI Sohbet',
    admin: 'Admin',
  },
  home: {
    pageTitle: 'İş hesaplayıcı',
    pageSubtitle: 'Özel teklif sandbox — resmi ilan listesi değildir.',
    pageHint: 'Elle doldurun veya intel\'den içe aktarın; net gelire göre 3 işe kadar karşılaştırın.',
    title: 'İşlerim',
    addJob: 'Yeni iş',
    noJobs: 'Kayıtlı iş yok',
    compare: 'Karşılaştır',
    addToCompare: 'Karşılaştırmaya ekle',
  },
  income: {
    heroLabel: 'Tahmini proje net geliri (vergi sonrası)',
    heroWeekly: 'Yaklaşık ${weekly}/hf · {weeks} hafta',
    heroHint: 'Kaydırıcıları ayarlayın — tutar anında güncellenir',
    heroDetails: 'Vergi ve diğer',
    cycleCurrency: 'Para birimi ({currency})',
    cycleCurrencyHint: 'USD için tutara dokunun',
    federalTaxLabel: 'Federal vergi (Fed %10)',
    stateTaxLabel: 'Eyalet vergisi (%{rate})',
    totalHousing: 'Toplam konaklama',
    footerNote: '*Yaklaşık {weeks} hafta; J-1 FICA muaf, basitleştirilmiş vergi',
  },
  language: { switch: 'Dil' },
  theme: { light: 'Açık', dark: 'Koyu', switchToLight: 'Açık mod', switchToDark: 'Koyu mod', toggle: 'Tema' },
};

const ru: LocaleOverride = {
  nav: {
    home: 'Калькулятор',
    jobs: 'База вакансий',
    market: 'Маркет',
    deals: 'Акции',
    docs: 'Документы SWT',
    chat: 'AI-чат',
    admin: 'Админ',
  },
  home: {
    pageTitle: 'Калькулятор работы',
    pageSubtitle: 'Личная песочница офферов — не официальный список вакансий.',
    pageHint: 'Заполните вручную или импортируйте; сравните до 3 работ по чистому доходу.',
    title: 'Мои работы',
    addJob: 'Новая работа',
    compare: 'Сравнить',
    addToCompare: 'В сравнение',
  },
  income: {
    heroLabel: 'Оценка чистого дохода за проект (после налогов)',
    heroWeekly: 'Около ${weekly}/нед · {weeks} нед.',
    heroHint: 'Двигайте ползунки — сумма обновляется сразу',
    heroDetails: 'Налоги и прочее',
    cycleCurrency: 'Валюта ({currency})',
    cycleCurrencyHint: 'Нажмите сумму для USD',
    federalTaxLabel: 'Федеральный налог (Fed 10%)',
    stateTaxLabel: 'Налог штата ({rate}%)',
    totalHousing: 'Жильё всего',
    footerNote: '*Примерно {weeks} нед.; J-1 без FICA, упрощённый расчёт',
  },
  language: { switch: 'Язык' },
  theme: { light: 'Светлая', dark: 'Тёмная', switchToLight: 'Светлая тема', switchToDark: 'Тёмная тема', toggle: 'Тема' },
};

const uk: LocaleOverride = {
  nav: {
    home: 'Калькулятор',
    jobs: 'База вакансій',
    deals: 'Пропозиції',
    docs: 'Документи SWT',
    chat: 'AI-чат',
    admin: 'Адмін',
  },
  home: {
    pageTitle: 'Калькулятор роботи',
    pageHint: 'Заповніть або імпортуйте; порівняйте до 3 пропозицій за чистим доходом.',
    compare: 'Порівняти',
    addToCompare: 'Додати до порівняння',
  },
  income: {
    heroLabel: 'Орієнтовний чистий дохід за проєкт',
    heroWeekly: 'Близько ${weekly}/тиж · {weeks} тиж.',
    heroHint: 'Рухайте повзунки — сума оновлюється',
    cycleCurrencyHint: 'Натисніть суму для USD',
    federalTaxLabel: 'Федеральний податок (Fed 10%)',
    stateTaxLabel: 'Податок штату ({rate}%)',
    totalHousing: 'Житло',
  },
  language: { switch: 'Мова' },
};

const ro: LocaleOverride = {
  nav: { home: 'Calculator', jobs: 'Intel joburi', deals: 'Oferte', docs: 'Docs SWT', chat: 'Chat AI' },
  home: {
    pageTitle: 'Calculator joburi',
    pageHint: 'Completați manual sau importați; comparați până la 3 oferte.',
    compare: 'Compară',
  },
  income: {
    heroLabel: 'Venit net estimat al proiectului',
    heroWeekly: 'Circa ${weekly}/săpt · {weeks} săpt.',
    cycleCurrencyHint: 'Atingeți suma pentru USD',
  },
  language: { switch: 'Limbă' },
};

const pl: LocaleOverride = {
  nav: { home: 'Kalkulator', jobs: 'Intel ofert', deals: 'Promocje', docs: 'Docs SWT', chat: 'Czat AI' },
  home: {
    pageTitle: 'Kalkulator ofert',
    pageHint: 'Wypełnij ręcznie lub importuj; porównaj do 3 ofert.',
    compare: 'Porównaj',
  },
  income: {
    heroLabel: 'Szacunkowy dochód netto projektu',
    heroWeekly: 'Około ${weekly}/tyg · {weeks} tyg.',
    cycleCurrencyHint: 'Kliknij kwotę, aby przełączyć na USD',
  },
  language: { switch: 'Język' },
};

const es: LocaleOverride = {
  nav: { home: 'Calculadora', jobs: 'Intel de empleos', deals: 'Ofertas', docs: 'Docs SWT', chat: 'Chat IA' },
  home: {
    pageTitle: 'Calculadora de empleo',
    pageHint: 'Completa o importa; compara hasta 3 ofertas por ingreso neto.',
    compare: 'Comparar',
    addToCompare: 'Añadir',
  },
  income: {
    heroLabel: 'Ingreso neto estimado del proyecto',
    heroWeekly: 'Unos ${weekly}/sem · {weeks} semanas',
    cycleCurrencyHint: 'Toca el monto para ver USD',
    federalTaxLabel: 'Impuesto federal (Fed 10%)',
    stateTaxLabel: 'Impuesto estatal ({rate}%)',
    totalHousing: 'Vivienda total',
  },
  language: { switch: 'Idioma' },
};

const kk: LocaleOverride = {
  nav: { home: 'Калькулятор', jobs: 'Жумыс базасы', deals: 'Акциялар', docs: 'SWT құжат', chat: 'AI чат' },
  home: { pageTitle: 'Жумыс калькуляторы', compare: 'Салыстыру' },
  income: {
    heroLabel: 'Жобаның болжамды таза табысы',
    cycleCurrencyHint: 'USD үшін соманы басыңыз',
  },
  language: { switch: 'Тіл' },
};

const th: LocaleOverride = {
  nav: { home: 'เครื่องคำนวณ', jobs: 'ข้อมูลงาน', deals: 'ดีล', docs: 'เอกสาร SWT', chat: 'แชท AI' },
  home: { pageTitle: 'เครื่องคำนวณงาน', compare: 'เปรียบเทียบ' },
  income: {
    heroLabel: 'รายได้สุทธิโดยประมาณของโปรเจกต์',
    cycleCurrencyHint: 'แตะจำนวนเงินเพื่อสลับเป็น USD',
  },
  language: { switch: 'ภาษา' },
};

const vi: LocaleOverride = {
  nav: { home: 'Máy tính', jobs: 'Tình báo việc', deals: 'Ưu đãi', docs: 'Tài liệu SWT', chat: 'Chat AI' },
  home: { pageTitle: 'Máy tính chọn việc', compare: 'So sánh' },
  income: {
    heroLabel: 'Thu nhập ròng ước tính của dự án',
    cycleCurrencyHint: 'Chạm số tiền để chuyển USD',
  },
  language: { switch: 'Ngôn ngữ' },
};

const fil: LocaleOverride = {
  nav: { home: 'Calculator', jobs: 'Job intel', deals: 'Deals', docs: 'SWT Docs', chat: 'AI Chat' },
  home: { pageTitle: 'Job calculator', compare: 'Ihambing' },
  income: {
    heroLabel: 'Tantiyang netong kita ng proyekto',
    cycleCurrencyHint: 'I-tap ang halaga para sa USD',
  },
  language: { switch: 'Wika' },
};

const cs: LocaleOverride = {
  nav: { home: 'Kalkulačka', jobs: 'Intel práce', deals: 'Akce', docs: 'SWT docs', chat: 'AI chat' },
  home: { pageTitle: 'Kalkulačka práce', compare: 'Porovnat' },
  income: {
    heroLabel: 'Odhad čistého příjmu projektu',
    cycleCurrencyHint: 'Klepněte na částku pro USD',
  },
  language: { switch: 'Jazyk' },
};

const hu: LocaleOverride = {
  nav: { home: 'Kalkulátor', jobs: 'Állás infó', deals: 'Ajánlatok', docs: 'SWT docs', chat: 'AI chat' },
  home: { pageTitle: 'Álláskalkulátor', compare: 'Összehasonlítás' },
  income: {
    heroLabel: 'Becsült nettó projektjövedelem',
    cycleCurrencyHint: 'Koppintson az összegre USD-hez',
  },
  language: { switch: 'Nyelv' },
};

const sr: LocaleOverride = {
  nav: { home: 'Kalkulator', jobs: 'Intel poslova', deals: 'Ponude', docs: 'SWT docs', chat: 'AI chat' },
  home: { pageTitle: 'Kalkulator posla', compare: 'Uporedi' },
  income: {
    heroLabel: 'Procena neto prihoda projekta',
    cycleCurrencyHint: 'Dodirnite iznos za USD',
  },
  language: { switch: 'Jezik' },
};

const bg: LocaleOverride = {
  nav: { home: 'Калкулатор', jobs: 'Инфо за работа', deals: 'Оферти', docs: 'SWT docs', chat: 'AI чат' },
  home: { pageTitle: 'Калкулатор за работа', compare: 'Сравни' },
  income: {
    heroLabel: 'Очакван нетен доход от проекта',
    cycleCurrencyHint: 'Докоснете сумата за USD',
  },
  language: { switch: 'Език' },
};

const az: LocaleOverride = {
  nav: { home: 'Kalkulyator', jobs: 'İş məlumatı', deals: 'Təkliflər', docs: 'SWT sənədlər', chat: 'AI chat' },
  home: { pageTitle: 'İş kalkulyatoru', compare: 'Müqayisə' },
  income: {
    heroLabel: 'Layihənin təxmini xalis gəliri',
    cycleCurrencyHint: 'USD üçün məbləğə toxunun',
  },
  language: { switch: 'Dil' },
};

const ka: LocaleOverride = {
  nav: { home: 'კალკულატორი', jobs: 'სამუშაო ინფო', deals: 'შეთავაზებები', docs: 'SWT docs', chat: 'AI ჩატი' },
  home: { pageTitle: 'სამუშაო კალკულატორი', compare: 'შედარება' },
  income: {
    heroLabel: 'პროექტის სავარაუდო ხელფასი (წმინდა)',
    cycleCurrencyHint: 'USD-ზე გადასართავად შეეხეთ თანხას',
  },
  language: { switch: 'ენა' },
};

const hy: LocaleOverride = {
  nav: { home: 'Հաշվիչ', jobs: 'Աշխատանքի ինֆո', deals: 'Ակցիաներ', docs: 'SWT docs', chat: 'AI չատ' },
  home: { pageTitle: 'Աշխատանքի հաշվիչ', compare: 'Համեմատել' },
  income: {
    heroLabel: 'Նախագծի մոտավոր զուտ եկամուտ',
    cycleCurrencyHint: 'USD-ի համար հպեք գումարին',
  },
  language: { switch: 'Լեզու' },
};

export const LOCALE_OVERRIDES: Partial<Record<Language, LocaleOverride>> = {
  pt,
  tr,
  ru,
  uk,
  ro,
  pl,
  es,
  kk,
  th,
  vi,
  fil,
  cs,
  hu,
  sr,
  bg,
  az,
  ka,
  hy,
};
