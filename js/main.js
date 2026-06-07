document.addEventListener("DOMContentLoaded", () => {
  const sliderTrack = document.querySelector(".slider-track");
  const prevBtn = document.querySelector(".slider-btn.prev");
  const nextBtn = document.querySelector(".slider-btn.next");

  if (!sliderTrack || !prevBtn || !nextBtn) return;

  let currentIndex = 0;
  const slideStep = 136;
  const visibleCards = 4;
  const totalCards = sliderTrack.children.length;
  const maxIndex = totalCards - visibleCards;

  nextBtn.addEventListener("click", () => {
    currentIndex++;

    if (currentIndex > maxIndex) {
      currentIndex = 0;
    }

    sliderTrack.style.transform = `translateX(-${currentIndex * slideStep}px)`;
  });

  prevBtn.addEventListener("click", () => {
    currentIndex--;

    if (currentIndex < 0) {
      currentIndex = maxIndex;
    }

    sliderTrack.style.transform = `translateX(-${currentIndex * slideStep}px)`;
  });
});

document.querySelectorAll(".filters").forEach((filterBlock) => {
  filterBlock.addEventListener("change", (event) => {
    const clicked = event.target;

    if (clicked.tagName !== "INPUT") return;

    const groupName = clicked.name;
    const groupInputs = filterBlock.querySelectorAll(`input[name="${groupName}"]`);

    groupInputs.forEach((input) => {
      if (input !== clicked) {
        input.checked = false;
      }
    });

    clicked.checked = true;
  });
});

document.querySelectorAll(".filters").forEach((filterBlock) => {
  filterBlock.addEventListener("change", (event) => {
    const clicked = event.target;

    if (clicked.tagName !== "INPUT") return;

    const groupName = clicked.name;
    const groupInputs = filterBlock.querySelectorAll(`input[name="${groupName}"]`);

    groupInputs.forEach((input) => {
      if (input !== clicked) {
        input.checked = false;
      }
    });

    clicked.checked = true;
  });
});