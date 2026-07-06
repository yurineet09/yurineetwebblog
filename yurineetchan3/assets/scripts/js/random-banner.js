(() => {
    const banners = [
        "assets/images/ENTRANCEIMG.png",
        "assets/images/ENTRANCEIMG2.png",
        "assets/images/ENTRANCEIMG3.png",
        "assets/images/ENTRANCEIMG4.png"
    ];

    const banner = document.getElementById("banner");
    if (!banner) return;

    const random = Math.floor(Math.random() * banners.length);
    banner.src = banners[random];
})();