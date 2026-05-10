/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
  const price = purchase.sale_price || 0;
  const quantity = purchase.quantity || 0;
  const discount = purchase.discount || 0; // Скидка в процентах (например, 20)

  // Формула: цена * кол-во * (1 - скидка / 100)
  return price * quantity * (1 - discount / 100);
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
  const profit = seller.profit;
  if (profit <= 0) return 0;
  if (index === 0) {
    return profit * 0.15;
  }
  if (index === 1 || index === 2) {
    return profit * 0.1;
  }
  if (index === total - 1) {
    return 0;
  }
  return profit * 0.05;
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
// @TODO: Проверка входных данных
// @TODO: Проверка наличия опций
// @TODO: Подготовка промежуточных данных для сбора статистики
// @TODO: Индексация продавцов и товаров для быстрого доступа
// @TODO: Расчет выручки и прибыли для каждого продавца
// @TODO: Сортировка продавцов по прибыли
// @TODO: Назначение премий на основе ранжирования
// @TODO: Подготовка итоговой коллекции с нужными полями
function analyzeSalesData(data, options) {
  if (!data || !data.sellers || !data.products || !data.purchase_records) {
    throw new Error("Incorrect data");
  }
  if (
    data.sellers.length === 0 ||
    data.products.length === 0 ||
    data.purchase_records.length === 0
  ) {
    throw new Error("Empty data");
  }
  if (
    !options ||
    typeof options.calculateRevenue !== "function" ||
    typeof options.calculateBonus !== "function"
  ) {
    throw new Error("Incorrect options");
  }

  const { calculateRevenue, calculateBonus } = options;
  const productsMap = data.products.reduce((acc, p) => {
    acc[p.sku] = p;
    return acc;
  }, {});

  const stats = data.sellers.reduce((acc, s) => {
    acc[s.id] = {
      seller_id: s.id,
      name: `${s.first_name} ${s.last_name}`,
      revenue: 0,
      profit: 0,
      sales_count: 0,
      products_qty: {},
    };
    return acc;
  }, {});

  data.purchase_records.forEach((receipt) => {
    const seller = stats[receipt.seller_id];
    if (seller) {
      seller.sales_count += 1;

      receipt.items.forEach((item) => {
        const product = productsMap[item.sku];
        if (product) {
          // ВАЖНО: Тесты используют sale_price из самого айтема чека
          const revenue = calculateRevenue(item, product);
          const cost = (item.quantity || 0) * (product.purchase_price || 0);

          seller.revenue += revenue;
          seller.profit += revenue - cost;

          seller.products_qty[item.sku] =
            (seller.products_qty[item.sku] || 0) + (item.quantity || 0);
        }
      });
    }
  });

  const sortedSellers = Object.values(stats).sort(
    (a, b) => b.profit - a.profit,
  );

  return sortedSellers.map((seller, index) => {
    const top_products = Object.entries(seller.products_qty)
      .map(([sku, quantity]) => ({ quantity, sku }))
      .sort((a, b) => {
        if (b.quantity !== a.quantity) return b.quantity - a.quantity;
        // ВАЖНО: Обратная сортировка по SKU (Z-A) при равном количестве
        return b.sku.localeCompare(a.sku);
      })
      .slice(0, 10);

    const bonus = calculateBonus(index, sortedSellers.length, seller);

    return {
      bonus: Number(bonus.toFixed(2)),
      name: seller.name,
      profit: Number(seller.profit.toFixed(2)),
      revenue: Number(seller.revenue.toFixed(2)),
      sales_count: seller.sales_count,
      seller_id: seller.seller_id,
      top_products: top_products,
    };
  });
}
