(function() {
    const container = document.querySelector('.game-container');
    const designWidth = 800
    function applyScale() {
      const scalew = container.clientWidth / designWidth;
      container.style.transform = `scale(${scalew})`;
    }

    window.addEventListener('resize', applyScale);
    window.addEventListener('load', () => {
      applyScale();
      
    });
  })();
  