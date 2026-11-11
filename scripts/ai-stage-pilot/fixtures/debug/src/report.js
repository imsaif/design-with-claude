const orders = require("./orders.json");
function totals(data) {
  return data.items.map((o) => o.qty * o.price);
}
console.log(totals(orders).reduce((a, b) => a + b, 0));
