import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'app')

const MAP = [
  ['"Не удалось обновить корзину."', "'l_Failed_update_cart'"],
  ['"Не удалось загрузить это меню."', "'l_Failed_load_menu'"],
  ['"Не удалось сохранить изменения."', "'l_Failed_save_changes'"],
  ['"Не удалось удалить блюдо."', "'l_Failed_delete_dish'"],
  ['"Не удалось загрузить блюдо."', "'l_Failed_load_dish'"],
  ['"Не удалось очистить корзину."', "'l_Failed_clear_cart'"],
  ['"Не удалось оформить заказ."', "'l_Failed_place_order'"],
  ['"Не удалось отменить заказ."', "'l_Failed_cancel_order'"],
  ['"Не удалось подтвердить доставку."', "'l_Failed_confirm_delivery'"],
  ['"Не удалось отправить отзыв."', "'l_Failed_send_feedback'"],
  ['"Не удалось отправить заказ в корзину. Попробуйте ещё раз."', "'l_Failed_add_to_cart'"],
  ['"Не удалось загрузить историю меню."', "'l_Failed_load_menu_history'"],
  ['"Не удалось загрузить блюда."', "'l_Failed_load_dishes'"],
  ["'Не удалось загрузить блюда.'", "'l_Failed_load_dishes'"],
  ['"Не удалось загрузить расписание."', "'l_Failed_load_schedule'"],
  ['"Не удалось сохранить расписание."', "'l_Failed_save_schedule'"],
  ['"Не удалось удалить меню."', "'l_Failed_delete_menu'"],
  ["'Не удалось принять заказ.'", "'l_Failed_accept_order'"],
  ["'Не удалось отклонить заказ.'", "'l_Failed_reject_order'"],
  ['"Не удалось загрузить меню."', "'l_Failed_load_menu'"],
  ['"Не удалось сохранить меню."', "'l_Failed_save_changes'"],
  ['"Не удалось загрузить профиль повара."', "'l_Failed_load_cook_profile'"],
  ['"Не удалось обновить фото профиля."', "'l_Failed_update_avatar'"],
  ['"Не удалось создать блюдо."', "'l_Failed_create_dish'"],
  ['"Не удалось отправить документы."', "'l_Failed_send_documents'"],
  ["'Не удалось создать меню.'", "'l_Failed_create_menu'"],
]

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) walk(p)
    else if (/\.(vue|ts)$/.test(ent.name)) {
      let s = fs.readFileSync(p, 'utf8')
      let changed = false
      for (const [from, to] of MAP) {
        if (s.includes(from)) {
          s = s.split(from).join(to)
          changed = true
        }
      }
      if (changed) fs.writeFileSync(p, s, 'utf8')
    }
  }
}

walk(root)
console.log('Patched apiMessage fallbacks')
