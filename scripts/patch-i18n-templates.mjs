import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const app = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'app')

/** [literal, key] — exact match replacements in .vue/.ts */
const REPLACEMENTS = [
  ['toast.show("Заказ отменён.",', 'toast.show(t("l_Order_cancelled"),'],
  ["toast.show('Заказ отменён.',", "toast.show(t('l_Order_cancelled'),"],
  ['toast.show("Мы получили ваш отзыв.",', 'toast.show(t("l_Feedback_received"),'],
  ['toast.show("Чат с поваром скоро будет доступен.",', 'toast.show(t("l_Chat_with_cook_soon"),'],
  ['toast.show("Корзина очищена.",', 'toast.show(t("l_Cart_cleared"),'],
  ['toast.show("Корзина пуста.",', 'toast.show(t("l_Basket_empty"),'],
  ['toast.show("Промокод применён.",', 'toast.show(t("l_Promo_applied"),'],
  ['toast.show("Промокод не найден.",', 'toast.show(t("l_Promo_not_found"),'],
  ['toast.show("Введите промокод.",', 'toast.show(t("l_Enter_promo"),'],
  ['toast.show("Укажите адрес доставки.",', 'toast.show(t("l_Enter_delivery_address"),'],
  ['toast.show("Укажите корректный номер телефона.",', 'toast.show(t("l_Enter_valid_phone"),'],
  ['toast.show("Заказ оформлен.",', 'toast.show(t("l_Order_placed"),'],
  ['toast.show("Блюдо обновлено.",', 'toast.show(t("l_Dish_updated"),'],
  ['toast.show("Блюдо удалено.",', 'toast.show(t("l_Dish_deleted"),'],
  ['rejectDishesError.value = "Опишите причину (не менее 3 символов)."', 'rejectDishesError.value = t("l_Reject_reason_min_length")'],
  ['return "Блюдо"', 'return t("l_Dish")'],
  ['return "Повар"', 'return t("l_Cook")'],
  ['return "П"', 'return t("l_Initial_fallback")'],
  ['|| "П"', '|| t("l_Initial_fallback")'],
  ['return "Домашнее блюдо"', 'return t("l_Homemade_dish")'],
  ['error.value = "Некорректная ссылка."', 'error.value = t("l_Invalid_link")'],
  ['error.value = "Блюдо не найдено."', 'error.value = t("l_Dish_not_found")'],
  ['formError.value = "Укажите название."', 'formError.value = t("l_Enter_title")'],
  ['formError.value = "Укажите описание."', 'formError.value = t("l_Enter_description")'],
  ['formError.value = "Укажите название блюда."', 'formError.value = t("l_Enter_dish_title")'],
  ['formError.value = "Время приготовления — не менее 1 минуты."', 'formError.value = t("l_Cooking_time_min_1")'],
  ['formError.value = "Цена не может быть отрицательной."', 'formError.value = t("l_Price_non_negative")'],
  ['formError.value = "Количество порций — не менее 1."', 'formError.value = t("l_Portion_min_1")'],
  ['formError.value = "Загрузите изображение."', 'formError.value = t("l_Upload_image")'],
  ['formError.value = "Выберите хотя бы одно блюдо."', 'formError.value = t("l_Select_at_least_one_dish")'],
  ['formError.value = "Меню на сегодня уже существует."', 'formError.value = t("l_Menu_today_exists")'],
  ['formError.value = "Заполните дату и оба времени."', 'formError.value = t("l_Fill_date_and_times")'],
  ['formError.value = "Время окончания должно быть позже времени начала."', 'formError.value = t("l_End_after_start")'],
  ['if (!confirm("Отменить изменения?"))', 'if (!confirm(t("l_Discard_changes_confirm")))'],
  ['if (!confirm("Отменить несохранённые изменения?"))', 'if (!confirm(t("l_Discard_unsaved_confirm")))'],
  ['listError.value ? "Не удалось загрузить данные. Попробуйте позже." : ""', 'listError.value ? t("l_Failed_load_data") : ""'],
  ['error.value = "Геопозиция недоступна. Используем центр Алматы."', 'error.value = t("l_Geo_unavailable_almaty")'],
  ['error.value = "Не удалось получить точные координаты. Используем центр Алматы."', 'error.value = t("l_Geo_failed_almaty")'],
  ['cookName.value = "Повар"', 'cookName.value = t("l_Cook")'],
]

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) walk(p)
    else if (/\.(vue|ts)$/.test(ent.name)) {
      let s = fs.readFileSync(p, 'utf8')
      let changed = false
      for (const [from, to] of REPLACEMENTS) {
        if (s.includes(from)) {
          s = s.split(from).join(to)
          changed = true
        }
      }
      if (changed) {
        if (!s.includes('useI18n') && /\.vue$/.test(p)) {
          if (s.includes('<script setup')) {
            s = s.replace(
              /<script setup([^>]*)>/,
              (m) => `${m}\nconst { t } = useI18n()`,
            )
          }
        }
        if (!s.includes('useI18n') && /pages|components|composables|layouts/.test(p) && /\.ts$/.test(p)) {
          s = `const { t } = useI18n()\n${s}`
        }
        fs.writeFileSync(p, s, 'utf8')
      }
    }
  }
}

walk(app)
console.log('Template/script literal patches applied')
