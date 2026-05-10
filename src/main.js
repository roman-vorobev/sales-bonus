/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(item, _product) {
  // В ваших данных это quantity и sale_price
  return (item.quantity || 0) * (item.sale_price || 0);
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
  if (index < 3) {
    return profit * 0.1; // 10% топ-менеджерам
  }
  return profit * 0.05; // 5% всем остальным
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
  if (
    !data ||
    !data.customers ||
    !data.sellers ||
    !data.products ||
    !data.purchase_records
  ) {
    console.error("Недостаточно данных для анализа");
    return [];
  }

  const { calculateRevenue, calculateBonus } = options;

  const productsMap = data.products.reduce((acc, p) => {
    acc[p.sku] = p;
    return acc;
  }, {});

  const stats = data.sellers.reduce((acc, seller) => {
    acc[seller.id] = {
      seller_id: seller.id,
      name: `${seller.first_name} ${seller.last_name}`,
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
      receipt.items.forEach((item) => {
        const product = productsMap[item.sku];

        if (product) {
          const count = item.quantity || 0;

          const revenue = options.calculateRevenue(item, product);

          const cost = count * (product.purchase_price || 0);
          const profit = revenue - cost;

          seller.revenue += revenue;
          seller.profit += profit;
          seller.sales_count += count;
          seller.products_qty[product.name] =
            (seller.products_qty[product.name] || 0) + count;
        }
      });
    }
  });

  const sortedSellers = Object.values(stats).sort(
    (a, b) => b.profit - a.profit,
  );

  return sortedSellers.map((seller, index) => {
    const top_products = Object.entries(seller.products_qty)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name]) => name);
    const bonus = calculateBonus(index, sortedSellers.length, seller);

    return {
      seller_id: seller.seller_id,
      name: seller.name,
      revenue: Number(seller.revenue.toFixed(2)),
      profit: Number(seller.profit.toFixed(2)),
      sales_count: seller.sales_count,
      top_products: top_products,
      bonus: Number(bonus.toFixed(2)),
    };
  });
}
