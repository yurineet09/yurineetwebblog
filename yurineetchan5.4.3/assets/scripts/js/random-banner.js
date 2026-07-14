(function() {
  const images = [
    'ENTRANCEIMG.png',
    'ENTRANCEIMG2.png',
    'ENTRANCEIMG3.png',
    'ENTRANCEIMG4.png'
  ];
  const randomImage = images[Math.floor(Math.random() * images.length)];
  const banner = document.getElementById('banner');
  if (banner) {
    banner.src = 'assets/images/entranceimgs/' + randomImage;
  }
})();
