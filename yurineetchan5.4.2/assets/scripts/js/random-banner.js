(function() {
  const images = [
    'assets/images/entranceimgs/ENTRANCEIMG.png',
    'assets/images/entranceimgs/ENTRANCEIMG2.png',
    'assets/images/entranceimgs/ENTRANCEIMG3.png',
    'assets/images/entranceimgs/ENTRANCEIMG4.png'
  ];
  const randomImage = images[Math.floor(Math.random() * images.length)];
  const banner = document.getElementById('banner');
  if (banner) {
    banner.src = randomImage;
  }
})();
