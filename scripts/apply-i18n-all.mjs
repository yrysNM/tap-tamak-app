import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const appDir = path.join(root, 'app')
const ru = JSON.parse(fs.readFileSync(path.join(root, 'locales', 'ru.json'), 'utf8'))

/** Exact [from, to] replacements in .vue / .ts (longest first). */
const EXACT = [
  // profile.vue template
  ['>Профиль</h1>', '>{{ $t("l_Profile") }}</h1>'],
  ['Здесь можно управлять адресами и языком интерфейса.', '{{ $t("l_Profile_settings_hint") }}'],
  ['>Настройки</h2>', '>{{ $t("l_Profile_settings") }}</h2>'],
  ['>Адреса доставки</p>', '>{{ $t("l_Delivery_addresses") }}</p>'],
  ['>Дом, школа, другое…</p>', '>{{ $t("l_Delivery_addresses_hint") }}</p>'],
  ['>Помощь</h2>', '>{{ $t("l_Help") }}</h2>'],
  ['>Поддержка</p>', '>{{ $t("l_Support") }}</p>'],
  ['>Чат, вопросы, помощь</p>', '>{{ $t("l_Support_hint") }}</p>'],
  ['>Выйти</p>', '>{{ $t("l_Log_out") }}</p>'],
  ['>Завершить сеанс</p>', '>{{ $t("l_End_session") }}</p>'],
  ['            Выйти\n          </button>', '            {{ $t("l_Log_out") }}\n          </button>'],
  ['return "Гость";', 'return t("l_Guest");'],

  // cook profile
  ['{{ uploadingAvatar ? "Загрузка..." : "Изменить" }}', '{{ uploadingAvatar ? t("l_Loading") : t("l_Change") }}'],
  ['        Повар\n      </h2>', '        {{ t("l_Cook_profile_section") }}\n      </h2>'],
  ['>Среднее время готовки</p>', '>{{ $t("l_Avg_cook_time") }}</p>'],
  ['>Показывается клиентам</p>', '>{{ $t("l_Shown_to_clients") }}</p>'],
  ['>Радиус доставки</p>', '>{{ $t("l_Delivery_radius") }}</p>'],
  ['>Максимальная зона</p>', '>{{ $t("l_Max_zone") }}</p>'],
  ['>Всего блюд</p>', '>{{ $t("l_Total_dishes") }}</p>'],
  ['>В вашем меню</p>', '>{{ $t("l_In_your_menu") }}</p>'],
  ['        Аккаунт\n      </h2>', '        {{ t("l_Account") }}\n      </h2>'],
  ['>Телефон</p>', '>{{ t("l_Phone") }}</p>'],
  ['          Выйти\n        </button>', '          {{ t("l_Log_out") }}\n        </button>'],
  ['|| "Без имени";', '|| t("l_No_name");'],
  ['|| "Контакт не указан",', '|| t("l_Contact_not_set"),'],
  ['`Домашняя кухня ${user.value?.firstName ?? ""}`.trim(),', 't("l_Homemade_kitchen", { name: user.value?.firstName ?? "" }).trim(),'],
  ['() => `${cook.value?.preparationTimeMin ?? 45} мин`,', '() => t("l_Cooking_time_single", { min: cook.value?.preparationTimeMin ?? 45 }),'],
  ['() => `${cook.value?.deliveryRadius ?? 4} км`,', '() => t("l_Radius_km", { km: cook.value?.deliveryRadius ?? 4 }),'],

  // orders.vue
  ['|| "Блюдо";', '|| t("l_Dish");'],
  ['        Мои заказы\n', '        {{ t("l_My_orders") }}\n'],
  ['        <p>Не удалось загрузить заказы.</p>', '        <p>{{ t("l_Failed_load_orders") }}</p>'],
  ['          Повторить\n', '          {{ t("l_Retry") }}\n'],
  ['        <p class="text-base font-bold text-body">Здесь будут ваши заказы</p>', '        <p class="text-base font-bold text-body">{{ t("l_Orders_empty_title") }}</p>'],
  ['          Когда вы оформите заказ, он появится в этом списке.\n', '          {{ t("l_Orders_empty_hint") }}\n'],
  ['          К поварам\n', '          {{ t("l_To_cooks") }}\n'],
  ['{{ order.cook?.businessName || "Повар" }}', '{{ order.cook?.businessName || t("l_Cook") }}'],
  ['{{ formatOrderDate(order.createdAt) || "Дата уточняется" }}', '{{ formatOrderDate(order.createdAt) || t("l_Date_pending") }}'],
  ['aria-label="Меню заказа"', ':aria-label="t(\'l_Order_menu\')"'],
  ['                Осталось {{ order.estimatedMinutes }} мин', '                {{ t("l_Minutes_left", { minutes: order.estimatedMinutes }) }}'],
  ['                Переведите\n', '                {{ t("l_Transfer_to_kaspi") }}\n'],
  ['                на Kaspi в течение 5 минут.\n', '                {{ t("l_Kaspi_payment_hint") }}\n'],
  ['                Номер для оплаты:\n', '                {{ t("l_Payment_number") }}\n'],
  ['                  Нет фото\n', '                  {{ t("l_No_photo") }}\n'],
  ['{{ deliverySubmitting && deliveryModalOrder?.id === order.id ? "Отправка…" : "Принять" }}', '{{ deliverySubmitting && deliveryModalOrder?.id === order.id ? t("l_Submitting") : t("l_Accept") }}'],
  ['                  Отклонить\n', '                  {{ t("l_Reject") }}\n'],
  ['{{ isCancelling(order.id) ? "Отмена…" : "Отменить" }}', '{{ isCancelling(order.id) ? t("l_Cancelling") : t("l_Cancel_order") }}'],
  ['                Написать\n', '                {{ t("l_Write") }}\n'],
  ['                Подтверждаем доставку…\n', '                {{ t("l_Confirming_delivery") }}\n'],
  ['                Спасибо, что заказали у нас. Приятного аппетита!\n', '                {{ t("l_Thanks_for_order") }}\n'],
  ['                Почему вы отклонили блюда?\n', '                {{ t("l_Reject_dishes_title") }}\n'],
  ['                Расскажите, что пошло не так — это поможет нам стать лучше.\n', '                {{ t("l_Reject_dishes_hint") }}\n'],
  ['                  Причина\n', '                  {{ t("l_Reason") }}\n'],
  ['placeholder="Например: блюдо пришло холодным"', ':placeholder="t(\'l_Reject_reason_placeholder\')"'],
  ['                  Отмена\n', '                  {{ t("l_Cancel") }}\n'],
  ['{{ deliverySubmitting ? "Отправка…" : "Отправить" }}', '{{ deliverySubmitting ? t("l_Submitting") : t("l_Submit") }}'],

  // role.vue page
  ['        Кдиен\n', '        {{ $t("l_Role_page_tagline") }}\n'],
  ['        Роль и аккаунт\n', '        {{ $t("l_Role_and_account") }}\n'],
  ['        Сначала выбираем роль, потом вводим пару данных — и можно пользоваться.\n', '        {{ $t("l_Role_intro") }}\n'],
  ['              Заказывать\n', '              {{ $t("l_Order_food") }}\n'],
  ['              <h3 class="text-[17px] font-bold leading-none">Клиент</h3>', '              <h3 class="text-[17px] font-bold leading-none">{{ $t("l_Client") }}</h3>'],
  ['                Выбор блюд и отслеживание заказа.\n', '                {{ $t("l_Client_desc") }}\n'],
  ['                <span>Карта поваров</span>', '                <span>{{ $t("l_Cook_map") }}</span>'],
  ['                <span>Избранное</span>', '                <span>{{ $t("l_Favorites") }}</span>'],
  ['              Готовить\n', '              {{ $t("l_Cook_food") }}\n'],
  ['              <h3 class="text-[17px] font-bold leading-none">Повар</h3>', '              <h3 class="text-[17px] font-bold leading-none">{{ $t("l_Cook_role") }}</h3>'],
  ['                Меню, заказы и чат с клиентом.\n', '                {{ $t("l_Cook_desc") }}\n'],
  ['                <span>Принимать заказы</span>', '                <span>{{ $t("l_Accept_orders") }}</span>'],
  ['                <span>Управлять меню</span>', '                <span>{{ $t("l_Manage_menu") }}</span>'],
  ['        Далее\n', '        {{ $t("l_Next") }}\n'],

  // common cook menu / dish
  ['← К меню', '{{ t("l_Back_to_menu") }}'],
  ['<h2 class="text-lg font-bold text-dark">Редактирование</h2>', '<h2 class="text-lg font-bold text-dark">{{ t("l_Edit_dish") }}</h2>'],
  ['<span class="text-[13px] font-medium text-dark">Новое фото</span>', '<span class="text-[13px] font-medium text-dark">{{ t("l_New_photo") }}</span>'],
  ['Необязательно — оставьте пустым, чтобы сохранить текущее\n              изображение.', '{{ t("l_New_photo_hint") }}'],
  ['<span class="text-[13px] font-medium text-dark">Название *</span>', '<span class="text-[13px] font-medium text-dark">{{ t("l_Title_required") }}</span>'],
  ['<span class="text-[13px] font-medium text-dark">Описание *</span>', '<span class="text-[13px] font-medium text-dark">{{ t("l_Description_required") }}</span>'],
  ['<span class="text-[13px] font-medium text-dark">Время (мин) *</span>', '<span class="text-[13px] font-medium text-dark">{{ t("l_Time_min_required") }}</span>'],
  ['<span class="text-[13px] font-medium text-dark">Тип *</span>', '<span class="text-[13px] font-medium text-dark">{{ t("l_Type_required") }}</span>'],
  ['aria-label="Тип приготовления"', ':aria-label="t(\'l_Prep_type\')"'],
  ['<span class="text-[13px] font-medium text-dark">Калории</span>', '<span class="text-[13px] font-medium text-dark">{{ t("l_Calories") }}</span>'],
  ['placeholder="Необязательно"', ':placeholder="t(\'l_Optional\')"'],
  ['<span class="text-[13px] font-medium text-dark">Цена *</span>', '<span class="text-[13px] font-medium text-dark">{{ t("l_Price_required") }}</span>'],
  ['<span class="text-[13px] font-medium text-dark">Количество порций *</span>', '<span class="text-[13px] font-medium text-dark">{{ t("l_Portion_count_required") }}</span>'],
  ['<span class="text-[13px] font-medium text-dark">В наличии</span>', '<span class="text-[13px] font-medium text-dark">{{ t("l_In_stock") }}</span>'],
  ['              Отмена\n', '              {{ t("l_Cancel") }}\n'],
  ['{{ saving ? "Сохранение…" : "Сохранить" }}', '{{ saving ? t("l_Saving") : t("l_Save") }}'],
  ['{ value: "FAST", label: "Быстрое" }', '{ value: "FAST", label: t("l_Fast_prep") }'],
  ['{ value: "LONG", label: "Долгое" }', '{ value: "LONG", label: t("l_Long_prep") }'],
  ['    "Выберите тип"', '    t("l_Select_type")'],
  ['if (!confirm("Отменить изменения?"))', 'if (!confirm(t("l_Discard_changes_confirm")))'],
  ['if (!confirm(`Удалить «${dish.value.name}»? Действие необратимо.`))', 'if (!confirm(t("l_Delete_confirm", { name: dish.value.name })))'],
  ['if (!confirm(`Удалить «${name}»? Действие необратимо.`))', 'if (!confirm(t("l_Delete_confirm", { name })))'],
  ['if (!confirm("Удалить это меню? Действие необратимо."))', 'if (!confirm(t("l_Delete_menu_confirm")))'],

  ['toast.show("Расписание сохранено.",', 'toast.show(t("l_Schedule_saved"),'],
  ['toast.show("Меню удалено.",', 'toast.show(t("l_Menu_deleted"),'],
  ['toast.show("Меню успешно создано.",', 'toast.show(t("l_Menu_created"),'],
  ['toast.show("Блюдо создано.",', 'toast.show(t("l_Dish_created"),'],
  ['toast.show("Меню обновлено.",', 'toast.show(t("l_Menu_updated"),'],
  ['        "Не удалось проверить меню на сегодня.",', '        t("l_Failed_check_menu_today"),'],
  ['error.value = "Меню не найдено.";', 'error.value = t("l_Menu_not_found");'],
  ['formError.value = "Укажите дату в формате ГГГГ-ММ-ДД.";', 'formError.value = t("l_Enter_date_yyyy_mm_dd");'],

  ['          Блюда\n', '          {{ t("l_Dishes") }}\n'],
  ['          Меню\n', '          {{ t("l_Menu") }}\n'],
  ['          Назад\n', '          {{ t("l_Back") }}\n'],
  ['        <span class="text-sm text-muted">Стр. {{ dishPage }}</span>', '        <span class="text-sm text-muted">{{ t("l_Page_short", { page: dishPage }) }}</span>'],
  ['          Далее\n', '          {{ t("l_Next") }}\n'],

  ['                Расписание работы\n', '                {{ t("l_Work_schedule_modal") }}\n'],
  ['              <p class="mt-1 text-[13px] text-caption">Время сохраняется в UTC.</p>', '              <p class="mt-1 text-[13px] text-caption">{{ t("l_Schedule_utc_hint") }}</p>'],
  ['              aria-label="Закрыть"', '              :aria-label="t(\'l_Close\')"'],
  ['            <span class="text-[13px] font-medium text-dark">Дата (UTC)</span>', '            <span class="text-[13px] font-medium text-dark">{{ t("l_Date_utc") }}</span>'],
  ['              <span class="text-[13px] font-medium text-dark">Начало</span>', '              <span class="text-[13px] font-medium text-dark">{{ t("l_Start") }}</span>'],
  ['              <span class="text-[13px] font-medium text-dark">Окончание</span>', '              <span class="text-[13px] font-medium text-dark">{{ t("l_End") }}</span>'],

  ['            Создать блюдо\n', '            {{ t("l_Create_dish") }}\n'],
  ['              <span class="text-[13px] font-medium text-dark">Фото *</span>', '              <span class="text-[13px] font-medium text-dark">{{ t("l_Photo_required") }}</span>'],
  ['{{ submitting ? "Создание…" : "Создать блюдо" }}', '{{ submitting ? t("l_Creating") : t("l_Create_dish") }}'],

  ['        Заказы\n', '        {{ t("l_Orders") }}\n'],
  ['        Сначала новые запросы, затем остальные активные заказы\n', '        {{ t("l_Cook_orders_subtitle") }}\n'],
  ["return 'Заказ в работе на кухне.'", "return t('l_Order_in_kitchen')"],
  ["return 'Заказ подтверждён, ожидает начала готовки.'", "return t('l_Order_awaiting_prep')"],
  ["return 'Заказ в пути к клиенту.'", "return t('l_Order_in_progress_client')"],
  ["return 'Готов к передаче курьеру или клиенту.'", "return t('l_Ready_for_courier')"],
  ["return 'Заказ доставлен.'", "return t('l_Order_awaiting_accept')"],
  ["return item.dish?.name?.trim() || item.name?.trim() || 'Блюдо'", "return item.dish?.name?.trim() || item.name?.trim() || t('l_Dish')"],
  ["acceptError.value = 'Укажите время от 1 до 1440 минут.'", "acceptError.value = t('l_Accept_time_range')"],
  ["rejectError.value = 'Опишите причину (не менее 3 символов).'", "rejectError.value = t('l_Reject_reason_min_length')"],
  ["toast.show('Заказ принят.',", "toast.show(t('l_Order_accepted'),"],
  ["toast.show('Заказ отклонён.',", "toast.show(t('l_Order_rejected'),"],

  // cooks index
  ['          Карта поваров\n', '          {{ t("l_Cooks_map_title") }}\n'],
  ['              placeholder="Поиск по району или имени"', '              :placeholder="t(\'l_Search_area_or_name\')"'],
  ['          Поблизости не найдено поваров с координатами.\n', '          {{ t("l_No_cooks_with_coords") }}\n'],
  ['            Смотреть блюда\n', '            {{ t("l_View_dishes") }}\n'],
  ['const categories = ["Все", "Закуски", "Десерты", "Горячее", "Детское", "Супы"];', 'const categories = computed(() => [t("l_Category_all"), t("l_Category_snacks"), t("l_Category_desserts"), t("l_Category_hot"), t("l_Category_kids"), t("l_Category_soups")]);'],
  ['const activeCategory = ref("Все");', 'const activeCategory = ref("");'],
  ['    return "Не удалось загрузить поваров. Попробуйте позже.";', '    return t("l_Failed_load_cooks");'],
  ['  if (activeCategory.value === "Все") return true;', '  if (!activeCategory.value || activeCategory.value === categories.value[0]) return true;'],
  ['  if (!specialties?.length) return "Разные блюда";', '  if (!specialties?.length) return t("l_Various_dishes");'],
  ['  if (!Number.isFinite(lat2) || !Number.isFinite(lng2)) return "без координат";', '  if (!Number.isFinite(lat2) || !Number.isFinite(lng2)) return t("l_No_coords");'],
  ['  if (km < 1) return `${Math.round(km * 1000)} м от вас`;', '  if (km < 1) return t("l_Meters_from_you", { meters: Math.round(km * 1000) });'],
  ['  return `${km.toFixed(1).replace(".", ",")} км от вас`;', '  return t("l_Km_from_you", { km: km.toFixed(1).replace(".", ",") });'],

  // cook menu page
  ['throw new Error("Некорректный идентификатор повара.");', 'throw new Error(t("l_Invalid_cook_id"));'],
  ['  return min === max ? `${min} мин` : `${min}-${max} мин`;', '  return min === max ? t("l_Cooking_time_single", { min }) : t("l_Cooking_time_range", { min, max });'],
  ['      "В корзине нет позиций для этого повара. Добавьте блюда.",', '      t("l_No_cart_items_for_cook"),'],
  ['        aria-label="Назад"', ':aria-label="t(\'l_Back\')"'],
  ['      <p>Не удалось загрузить меню повара.</p>', '      <p>{{ t("l_Failed_load_cook_menu") }}</p>'],
  ['        Повторить\n', '        {{ t("l_Retry") }}\n'],
  ['              {{ cook.isAvailable ? "Онлайн" : "Оффлайн" }}', '              {{ cook.isAvailable ? t("l_Online") : t("l_Offline") }}'],
  ['      Как {{ cook?.businessName || "повар" }} готовит?', '      {{ t("l_How_cook_prepares", { name: cook?.businessName || t("l_Cook_name_fallback") }) }}'],
  ['            Свежие продукты - только под заказ\n', '            {{ t("l_Fresh_products") }}\n'],
  ['            Готовка начинается только после подтверждения заказа.\n', '            {{ t("l_Cook_after_confirm") }}\n'],
  ['          <p class="text-sm font-bold text-dark">Тайминг: готовка + доставка</p>', '          <p class="text-sm font-bold text-dark">{{ t("l_Timing_cook_delivery") }}</p>'],
  ['            В карточке блюда указан срок готовки; доставка считается отдельно.\n', '            {{ t("l_Timing_hint") }}\n'],
  ['          <p class="text-sm font-bold text-dark">Упаковка как в кафе</p>', '          <p class="text-sm font-bold text-dark">{{ t("l_Packaging_cafe") }}</p>'],
  ['            Плотные контейнеры и соусы отдельно для аккуратной доставки.\n', '            {{ t("l_Packaging_containers_hint") }}\n'],
  ['    <h2 class="mt-7 text-[28px] font-bold text-dark">Меню</h2>', '    <h2 class="mt-7 text-[28px] font-bold text-dark">{{ t("l_Menu") }}</h2>'],
  ['    <p class="mt-1 text-xs font-semibold text-muted">Дата: {{ todayYmd }}</p>', '    <p class="mt-1 text-xs font-semibold text-muted">{{ t("l_Menu_date_label") }} {{ todayYmd }}</p>'],
  ['      <p class="text-sm font-semibold text-dark">На сегодня блюд нет</p>', '      <p class="text-sm font-semibold text-dark">{{ t("l_No_dishes_today") }}</p>'],
  ['      <p class="mt-1 text-xs text-muted">Попробуйте открыть меню позже.</p>', '      <p class="mt-1 text-xs text-muted">{{ t("l_Try_menu_later") }}</p>'],
  ['            {{ dish.description || "Домашнее блюдо" }}', '            {{ dish.description || t("l_Homemade_dish") }}'],
  ['                Нет порций (0 шт)\n', '                {{ t("l_No_portions_zero") }}\n'],
  ['                Максимум {{ maxPortionsFor(dish) }} шт\n', '                {{ t("l_Max_portions", { count: maxPortionsFor(dish) }) }}\n'],
  ['            Корзина: {{ totalItems }} шт\n', '            {{ t("l_Cart_summary", { count: totalItems }) }}\n'],
  ['            Итого: {{ formatPrice(totalAmount) }}\n', '            {{ t("l_Total_amount", { amount: formatPrice(totalAmount) }) }}\n'],
  ['          {{ checkoutSubmitting ? "Отправка…" : "Оформить" }}', '          {{ checkoutSubmitting ? t("l_Submitting") : t("l_Checkout_btn") }}'],

  // edit menu
  ['        ← К списку меню\n', '        {{ t("l_Back_to_menu_list") }}\n'],
  ['            Редактирование меню\n', '            {{ t("l_Edit_menu") }}\n'],
  ['            <span class="text-caption"> (UTC, было при загрузке)</span>', '            <span class="text-caption"> {{ t("l_UTC_on_load") }}</span>'],
  ['            <span class="text-[13px] font-medium text-dark">Дата меню (UTC)</span>', '            <span class="text-[13px] font-medium text-dark">{{ t("l_Menu_date_field") }}</span>'],
  ['              <span class="text-[13px] font-medium text-dark">Поиск блюд</span>', '              <span class="text-[13px] font-medium text-dark">{{ t("l_Search_dishes") }}</span>'],
  ['                  placeholder="Название или ингредиент…"', '                  :placeholder="t(\'l_Search_name_ingredient\')"'],
  ['                      · {{ caloriesOf(dish) }} ккал', '                      {{ t("l_Calories_kcal", { calories: caloriesOf(dish) }) }}'],
  ['              {{ deleting ? "Удаление…" : "Удалить меню" }}', '              {{ deleting ? t("l_Deleting") : t("l_Delete_menu_btn") }}'],

  // prepare-order (large block)
  ['    { value: "card", label: "Банковская карта" },', '    { value: "card", label: t("l_Payment_card") },'],
  ['    { value: "cash", label: "Наличные курьеру" },', '    { value: "cash", label: t("l_Payment_cash") },'],
  ['    if (d.length <= 1) return "Укажите номер телефона.";', '    if (d.length <= 1) return t("l_Enter_phone_number");'],
  ['    return "Введите 10 цифр после +7.";', '    return t("l_Enter_10_digits_after_7");'],
  ['            count > 1 ? `Оформлено заказов: ${count}.` : "Заказ оформлен.",', '            count > 1 ? t("l_Orders_placed_count", { count }) : t("l_Orders_placed_single"),'],
  ['                    aria-label="Назад"', ':aria-label="t(\'l_Back\')"'],
  ['                    Оформление заказа\n', '                    {{ t("l_Checkout") }}\n'],
  ['                <p>Не удалось загрузить корзину.</p>', '                <p>{{ t("l_Failed_load_cart") }}</p>'],
  ['                        Сумма\n', '                        {{ t("l_Amount") }}\n'],
  ['                            <span>Блюда</span>', '                            <span>{{ t("l_Dish_amount") }}</span>'],
  ['                            <span>Доставка</span>', '                            <span>{{ t("l_Delivery") }}</span>'],
  ['                            <span>Скидка</span>', '                            <span>{{ t("l_Discount") }}</span>'],
  ['                        <span class="text-[15px] font-bold text-body">Итого</span>', '                        <span class="text-[15px] font-bold text-body">{{ t("l_Total") }}</span>'],
  ['                        Укажите адрес и телефон — рассчитаем доставку.\n', '                        {{ t("l_Checkout_address_hint") }}\n'],
  ['                        Адрес доставки\n', '                        {{ t("l_Delivery_address") }}\n'],
  ['                        <label class="block text-[13px] text-[#555555]">Адрес</label>', '                        <label class="block text-[13px] text-[#555555]">{{ t("l_Address") }}</label>'],
  ['                            placeholder="Город, улица, дом"', '                            :placeholder="t(\'l_Address_placeholder\')"'],
  ['                            <label class="block text-[12px] font-semibold text-[#5a5a5a]">Подъезд</label>', '                            <label class="block text-[12px] font-semibold text-[#5a5a5a]">{{ t("l_Entrance") }}</label>'],
  ['                            <label class="block text-[12px] font-semibold text-[#5a5a5a]">Домофон</label>', '                            <label class="block text-[12px] font-semibold text-[#5a5a5a]">{{ t("l_Intercom") }}</label>'],
  ['                            <label class="block text-[12px] font-semibold text-[#5a5a5a]">Этаж</label>', '                            <label class="block text-[12px] font-semibold text-[#5a5a5a]">{{ t("l_Floor") }}</label>'],
  ['                        <label class="block text-[13px] text-[#555555]">Офис / Квартира</label>', '                        <label class="block text-[13px] text-[#555555]">{{ t("l_Apartment_office") }}</label>'],
  ['                        <label class="block text-[13px] text-[#555555]">Телефон</label>', '                        <label class="block text-[13px] text-[#555555]">{{ t("l_Phone") }}</label>'],
  ['                        <label class="block text-[13px] text-[#555555]">Комментарий курьеру</label>', '                        <label class="block text-[13px] text-[#555555]">{{ t("l_Courier_comment") }}</label>'],
  ['                        <textarea v-model="form.courierComment" rows="3" placeholder="Например: позвонить заранее"', '                        <textarea v-model="form.courierComment" rows="3" :placeholder="t(\'l_Courier_comment_placeholder\')"'],
  ['                        <span class="text-[13px] leading-snug text-[#555555]">Сохранить адрес для следующих\n                            заказов</span>', '                        <span class="text-[13px] leading-snug text-[#555555]">{{ t("l_Save_address_for_next") }}</span>'],
  ['                        Выберите способ оплаты\n', '                        {{ t("l_Payment_method") }}\n'],
  ['                    Корзина пуста\n', '                    {{ t("l_Basket_empty") }}\n'],
  ['                    В корзину\n', '                    {{ t("l_To_cart") }}\n'],
  ['                    {{ submitting ? "Отправка…" : "Оформить заказ" }}', '                    {{ submitting ? t("l_Submitting") : t("l_Place_order") }}'],

  // DishSection
  ['  if (t === "FAST" || t === "Fast") return "Быстрое";', '  if (t === "FAST" || t === "Fast") return appT("l_Fast_prep");'],
  ['  if (t === "LONG" || t === "Long") return "Долгое";', '  if (t === "LONG" || t === "Long") return appT("l_Long_prep");'],
  ['      <h2 class="text-lg font-bold text-dark">Блюда</h2>', '      <h2 class="text-lg font-bold text-dark">{{ t("l_Dishes") }}</h2>'],
  ['        Создать блюдо\n', '        {{ t("l_Create_dish") }}\n'],
  ['        <span class="text-[13px] font-medium text-dark">Поиск</span>', '        <span class="text-[13px] font-medium text-dark">{{ t("l_Dish_search") }}</span>'],
  ['            placeholder="Поиск блюд…"', '            :placeholder="t(\'l_Dish_search_placeholder\')"'],
]

function ensureUseI18n(s, isVue) {
  if (s.includes('useI18n') || s.includes('$t(') || s.includes('appT(')) {
    if (!s.includes('const { t } = useI18n') && (s.includes('t(') || s.includes('$t('))) {
      if (isVue && s.includes('<script setup')) {
        if (!s.match(/const\s*\{\s*t\s*\}\s*=\s*useI18n/)) {
          s = s.replace(/<script setup([^>]*)>/, (m) => `${m}\nconst { t } = useI18n()`)
        }
      }
    }
    return s
  }
  if (isVue && s.includes('<script setup')) {
    s = s.replace(/<script setup([^>]*)>/, (m) => `${m}\nconst { t } = useI18n()`)
  }
  return s
}

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) walk(p)
    else if (/\.(vue|ts)$/.test(ent.name)) {
      let s = fs.readFileSync(p, 'utf8')
      let changed = false
      for (const [from, to] of EXACT) {
        if (s.includes(from)) {
          s = s.split(from).join(to)
          changed = true
        }
      }
      if (changed) {
        s = ensureUseI18n(s, /\.vue$/.test(p))
        if (/DishSection/.test(p) && !s.includes("appT")) {
          s = s.replace('<script setup', '<script setup\nimport { appT } from "~/composables/useAppT"')
        }
        if (/cooks\/index/.test(p) && s.includes('const categories = computed') && !s.includes('onMounted')) {
          s = s.replace(
            'const activeCategory = ref("");',
            'const activeCategory = ref("");\nonMounted(() => { activeCategory.value = categories.value[0] ?? "" })',
          )
        }
        fs.writeFileSync(p, s, 'utf8')
        console.log('patched', path.relative(root, p))
      }
    }
  }
}

walk(appDir)
console.log('done')
