// 阅读进度条
document.addEventListener('DOMContentLoaded', function () {
  var progressBar = document.querySelector('.reading-progress-bar');
  if (!progressBar) return;

  function updateProgress() {
    var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    var scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    var progress = (scrollTop / scrollHeight) * 100;
    progressBar.style.width = progress + '%';
  }

  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();
});
