// Simple catalog used by /assets page

export type Asset = {
  name: string
  path: string
  desc?: string
}

// Backgrounds (16:9 friendly)
export const backgrounds: Asset[] = [
  { name: "Лесная опушка", path: "/images/backgrounds/forest-edge.png", desc: "forest edge, day" },
  { name: "Старое болото", path: "/images/backgrounds/old-swamp.png", desc: "old swamp, mist" },
  { name: "Горное озеро", path: "/images/backgrounds/mountain-lake.png", desc: "mountain lake" },
  { name: "Заповедник", path: "/images/backgrounds/reserve.png", desc: "reserve, sunset" },
]

// Emojis (64–128px)
export const emojis: Asset[] = [
  { name: "Бобёр — злой", path: "/images/emoji/beaver-angry.png", desc: "beaver angry" },
  { name: "Бинокль — эмодзи", path: "/images/emoji/binoculars.png", desc: "binoculars emoji" },
  { name: "Пуля", path: "/images/emoji/bullet.png", desc: "bullet" },
  { name: "Компас — эмодзи", path: "/images/emoji/compass.png", desc: "compass emoji" },
  { name: "Утка — довольная", path: "/images/emoji/duck-happy.png", desc: "duck happy" },
  { name: "Утка — хитрая", path: "/images/emoji/duck-sneaky.png", desc: "duck sneaky" },
  { name: "Перо", path: "/images/emoji/feather.png", desc: "feather" },
  { name: "Золотая пуля", path: "/images/emoji/golden-bullet.png", desc: "golden bullet" },
  { name: "Золотое перо", path: "/images/emoji/golden-feather.png", desc: "golden feather" },
  { name: "Охотник — ухмылка", path: "/images/emoji/hunter-grin.png", desc: "hunter grin" },
  { name: "Дождевое облако", path: "/images/emoji/rain-cloud.png", desc: "rain cloud" },
  { name: "Рейнджер", path: "/images/emoji/ranger.png", desc: "ranger emoji" },
  { name: "Капкан — эмодзи", path: "/images/emoji/trap.png", desc: "trap emoji" },
]

// UI icons (24–48px)
export const icons: Asset[] = [
  { name: "Патроны", path: "/images/ui/ammo.png", desc: "ammo" },
  { name: "Ставка", path: "/images/ui/bet.png", desc: "bet" },
  { name: "Банк игры", path: "/images/ui/bank.png", desc: "bank" },
  { name: "Сейф Бобра", path: "/images/ui/beaver-vault.png", desc: "beaver vault" },
  { name: "Бинокль", path: "/images/ui/binoculars.png", desc: "binoculars" },
  { name: "Компас", path: "/images/ui/compass.png", desc: "compass" },
  { name: "Опасность", path: "/images/ui/danger.png", desc: "danger" },
  { name: "Перелёт", path: "/images/ui/flight.png", desc: "flight" },
  { name: "Призрачный перелёт", path: "/images/ui/ghost-flight.png", desc: "ghost flight" },
  { name: "Трофей", path: "/images/ui/gold-trophy.png", desc: "trophy" },
  { name: "Повышение уровня", path: "/images/ui/level-up.png", desc: "level up" },
  { name: "Безопасный перелёт", path: "/images/ui/safe-flight.png", desc: "safe flight" },
  { name: "Щит-перо", path: "/images/ui/shield-feather.png", desc: "shield feather" },
  { name: "Капкан", path: "/images/ui/trap.png", desc: "trap" },
  { name: "Дождь (иконка)", path: "/images/ui/rain-cloud.png", desc: "rain cloud ui" },
  { name: "Смотритель", path: "/images/ui/ranger.png", desc: "warden" },
]
