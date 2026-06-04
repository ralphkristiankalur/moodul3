document.querySelectorAll(".cart-qty").forEach(qty => {
  const minus = qty.children[0];
  const value = qty.children[1];
  const plus = qty.children[2];

  plus.addEventListener("click", () => {
    value.textContent = Number(value.textContent) + 1;
  });

  minus.addEventListener("click", () => {
    if (Number(value.textContent) > 1) {
      value.textContent = Number(value.textContent) - 1;
    }
  });
});