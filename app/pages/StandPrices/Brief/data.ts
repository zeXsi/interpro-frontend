import type { FC, SVGProps } from 'react';

import TypeCorner from 'assets/icons/brief/type-corner.svg?react';
import TypeIsland from 'assets/icons/brief/type-island.svg?react';
import TypeLinear from 'assets/icons/brief/type-linear.svg?react';
import TypePeninsula from 'assets/icons/brief/type-peninsula.svg?react';
import TypeThrough from 'assets/icons/brief/type-through.svg?react';
import ZoneCeiling from 'assets/icons/brief/zone-ceiling.svg?react';
import ZoneDemo from 'assets/icons/brief/zone-demo.svg?react';
import ZoneKitchen from 'assets/icons/brief/zone-kitchen.svg?react';
import ZoneMedia from 'assets/icons/brief/zone-media.svg?react';
import ZoneMeetingClosed from 'assets/icons/brief/zone-meeting-closed.svg?react';
import ZoneMeetingOpen from 'assets/icons/brief/zone-meeting-open.svg?react';
import ZonePhoto from 'assets/icons/brief/zone-photo.svg?react';
import ZoneReception from 'assets/icons/brief/zone-reception.svg?react';
import ZoneWardrobe from 'assets/icons/brief/zone-wardrobe.svg?react';

type Icon = FC<SVGProps<SVGSVGElement>>;

export const STAND_TYPES: { title: string; description: string; Icon?: Icon }[] = [
  { title: 'Линейный', description: 'открыт с одной стороны', Icon: TypeLinear },
  { title: 'Угловой', description: 'открыт с двух сторон', Icon: TypeCorner },
  { title: 'Полуостровной', description: 'открыт с трёх сторон', Icon: TypePeninsula },
  { title: 'Островной', description: 'открыт со всех сторон', Icon: TypeIsland },
  { title: 'Проходной', description: 'открыт с двух противоположных сторон', Icon: TypeThrough },
  { title: 'Пока не знаю', description: 'помогите выбрать' },
];

export const STAND_ZONES: { title: string; Icon: Icon }[] = [
  { title: 'Ресепшн / информационная стойка', Icon: ZoneReception },
  { title: 'Переговорная зона (открытая)', Icon: ZoneMeetingOpen },
  { title: 'Переговорная зона (закрытая)', Icon: ZoneMeetingClosed },
  { title: 'Демонстрационная зона / витрина', Icon: ZoneDemo },
  { title: 'Кухня / зона угощений', Icon: ZoneKitchen },
  { title: 'Гардероб / зона хранения', Icon: ZoneWardrobe },
  { title: 'Фотозона', Icon: ZonePhoto },
  { title: 'Мультимедиа (экраны, LED, интерактив)', Icon: ZoneMedia },
  { title: 'Подвесная конструкция', Icon: ZoneCeiling },
];

export const STAND_STYLES = [
  { title: 'Минимализм', description: 'чистые линии, нейтральные цвета', image: '/images/brief/minimalism.webp' },
  { title: 'Технологичный', description: 'металл, подсветка, хай-тек', image: '/images/brief/technology.webp' },
  { title: 'Натуральный', description: 'дерево, живые растения, тепло', image: '/images/brief/natural.webp' },
  { title: 'Яркий', description: 'насыщенные цвета, графика, акценты', image: '/images/brief/bright.webp' },
  { title: 'Корпоративный', description: 'строго в фирменном стиле компании', image: '/images/brief/corporate.webp' },
];

export const BUDGETS = [
  500_000, 1_000_000, 2_000_000, 3_000_000, 5_000_000, 7_000_000, 10_000_000, 15_000_000, 20_000_000,
];

export const EXHIBITIONS = ['Металлообработка', 'Иннопром', 'WorldFood', 'Нефтегаз', 'MITT'];

export const AREA_MIN = 9;
export const AREA_MAX = 500;

/** Лимиты совпадают с проверкой на бэкенде (POST /send с файлами). */
export const FILE_MAX_SIZE = 10 * 1024 * 1024;
export const FILE_MAX_TOTAL_SIZE = 25 * 1024 * 1024;
/** Больше пяти файлов не принимаем — кнопка «Прикрепить файл» становится неактивной. */
export const FILE_MAX_COUNT = 5;
export const FILE_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip'];
export const FILE_ACCEPT = FILE_EXTENSIONS.map((extension) => `.${extension}`).join(',');

/** Шагов с вопросами — по ним считается прогресс. Контакты идут восьмым экраном. */
export const QUESTION_STEPS = 7;

export const formatRub = (value: number) => `${value.toLocaleString('ru-RU')} ₽`;
