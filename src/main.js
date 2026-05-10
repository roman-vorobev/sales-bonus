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
  if (
    !data ||
    !data.customers ||
    !data.sellers ||
    !data.products ||
    !data.purchase_records
  ) {
    throw new Error("Переданы некорректные данные");
  }

  if (
    !options ||
    typeof options.calculateRevenue !== "function" ||
    typeof options.calculateBonus !== "function"
  ) {
    throw new Error("Некорректные опции");
  }

  if (
    data.sellers.length === 0 ||
    data.products.length === 0 ||
    data.purchase_records.length === 0
  ) {
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
    const bonus = calculateBonus(index, sortedSellers.length, seller);

    const top_products = Object.entries(seller.products_qty)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name]) => name);

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
