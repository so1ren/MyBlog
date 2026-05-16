// ===== State =====
    const files = new Map(); // name -> { file, data, error, checked }
    const charts = new Map(); // name -> Chart instance
    let overlayChart = null;

    const COLORS = [
      '#3b82f6', '#ef4444', '#22c55e', '#f97316',
      '#a855f7', '#06b6d4', '#ec4899', '#eab308',
    ];

    function getPointRadius(count) {
      if (count <= 50) return 3;
      if (count <= 200) return 2;
      return 0;
    }

    function getPointHoverRadius(count) {
      if (count <= 200) return 5;
      return 4;
    }

    function getMaxTicksLimit(count) {
      if (count <= 20) return count;
      if (count <= 100) return 10;
      if (count <= 500) return 8;
      return 6;
    }

    // ===== DOM =====
    const uploadZone = document.getElementById('uploadZone');
    const fileInput = document.getElementById('fileInput');
    const fileListSection = document.getElementById('fileListSection');
    const fileItems = document.getElementById('fileItems');
    const fileCount = document.getElementById('fileCount');
    const clearAllBtn = document.getElementById('clearAll');
    const errorContainer = document.getElementById('errorContainer');
    const chartContainer = document.getElementById('chartContainer');
    const emptyState = document.getElementById('emptyState');

    // ===== Upload Events =====
    uploadZone.addEventListener('click', () => fileInput.click());

    uploadZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadZone.classList.add('drag-over');
    });

    uploadZone.addEventListener('dragleave', () => {
      uploadZone.classList.remove('drag-over');
    });

    uploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadZone.classList.remove('drag-over');
      handleFiles(e.dataTransfer.files);
    });

    fileInput.addEventListener('change', (e) => {
      handleFiles(e.target.files);
      fileInput.value = '';
    });

    clearAllBtn.addEventListener('click', clearAll);

    // ===== File Handling =====
    function handleFiles(fileList) {
      const newFiles = Array.from(fileList).filter(f => f.name.endsWith('.txt'));
      const rejected = Array.from(fileList).filter(f => !f.name.endsWith('.txt'));

      if (rejected.length > 0) {
        showError(`已跳过 ${rejected.length} 个非 TXT 文件`);
      }

      for (const file of newFiles) {
        if (files.has(file.name)) continue;
        files.set(file.name, { file, data: null, error: null, checked: false });
        parseFile(file);
      }

      updateUI();
    }

    function parseFile(file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        const result = parseData(text, file.name);
        const entry = files.get(file.name);
        if (result.error) {
          entry.error = result.error;
        } else {
          entry.data = result.data;
        }
        updateUI();
      };
      reader.onerror = () => {
        files.get(file.name).error = '读取文件失败';
        updateUI();
      };
      reader.readAsText(file);
    }

    function parseData(text, filename) {
      const lines = text.split(/\r?\n/);
      const data = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.startsWith('#')) continue;

        // Split by spaces or tabs
        const parts = line.split(/\s+/).filter(p => p.length > 0);
        if (parts.length < 2) {
          return { error: `${filename} 第 ${i + 1} 行格式错误：需要至少两个数值` };
        }

        const nums = parts.map(p => parseFloat(p));
        if (nums.some(isNaN)) {
          return { error: `${filename} 第 ${i + 1} 行包含非数值内容` };
        }

        data.push(nums);
      }

      if (data.length === 0) {
        return { error: `${filename} 不包含有效数据行` };
      }

      return { data };
    }

    // ===== UI Updates =====
    function updateUI() {
      // File list
      const entries = Array.from(files.entries());
      if (entries.length === 0) {
        fileListSection.style.display = 'none';
      } else {
        fileListSection.style.display = 'block';
        fileCount.textContent = `(${entries.length})`;
        fileItems.innerHTML = entries.map(([name, entry]) => `
          <div class="file-item">
            <input type="checkbox" class="file-check" data-name="${escapeHtml(name)}" ${entry.checked ? 'checked' : ''} ${entry.data ? '' : 'disabled'} title="选中以叠加绘图">
            <div class="file-icon">TXT</div>
            <div class="file-info">
              <div class="file-name">${escapeHtml(name)}</div>
              <div class="file-meta">${formatSize(entry.file.size)}${entry.data ? ` · ${entry.data.length} 行数据` : ''}</div>
            </div>
            <span class="file-status ${entry.error ? 'error' : 'ok'}">${entry.error ? '解析失败' : '已解析'}</span>
            <button class="file-remove" data-name="${escapeHtml(name)}" title="删除">×</button>
          </div>
        `).join('');

        // Bind remove buttons
        fileItems.querySelectorAll('.file-remove').forEach(btn => {
          btn.addEventListener('click', () => removeFile(btn.dataset.name));
        });
        // Bind checkboxes
        fileItems.querySelectorAll('.file-check').forEach(cb => {
          cb.addEventListener('change', () => {
            const entry = files.get(cb.dataset.name);
            if (entry) entry.checked = cb.checked;
            updateOverlayButton();
          });
        });
      }

      // Charts
      const validEntries = entries.filter(([, e]) => e.data);
      if (validEntries.length === 0) {
        chartContainer.innerHTML = '';
        chartContainer.appendChild(emptyState);
        emptyState.style.display = 'block';
      } else {
        emptyState.style.display = 'none';
        // Only create/update chart cards for valid entries
        const existingCards = new Set();
        for (const [name, entry] of validEntries) {
          existingCards.add(name);
          let card = document.getElementById(`chart-${name}`);
          if (!card) {
            card = createChartCard(name, entry.data);
            chartContainer.appendChild(card);
          }
        }
        // Remove cards for deleted/invalid files
        Array.from(chartContainer.children).forEach(child => {
          if (child.id && child.id.startsWith('chart-')) {
            const name = child.id.slice(6);
            if (!existingCards.has(name)) {
              const chart = charts.get(name);
              if (chart) chart.destroy();
              charts.delete(name);
              child.remove();
            }
          }
        });
      }
    }

    function createChartCard(name, data) {
      const cardId = `chart-${name}`;
      const canvasId = `canvas-${name}`;
      const div = document.createElement('div');
      div.className = 'chart-grid';
      div.id = cardId;

      // Each column after first becomes a separate chart
      const colCount = data[0].length - 1;
      for (let col = 1; col <= colCount; col++) {
        const singleCanvasId = `${canvasId}-${col}`;
        const title = colCount === 1 ? name.replace(/\.txt$/i, '') : `${name.replace(/\.txt$/i, '')} — 第 ${col} 列`;

        const cardId2 = 'card-' + singleCanvasId;
        div.innerHTML += `
          <div class="chart-card" id="${cardId2}">
            <div class="chart-header">
              <span class="chart-title">${escapeHtml(title)}</span>
              <div class="chart-actions">
                <button class="btn-icon restore-data" data-chart="${singleCanvasId}" style="display:none;">↩ 恢复原始数据</button>
                <button class="btn-icon" data-canvas="${singleCanvasId}" data-name="${escapeHtml(title)}">⬇ 下载 PNG</button>
              </div>
            </div>
            <div class="chart-canvas-wrap" id="wrap-${singleCanvasId}">
              <canvas id="${singleCanvasId}"></canvas>
            </div>
            <div class="minimap-wrap" id="minimap-${singleCanvasId}" data-chart="${singleCanvasId}">
              <canvas id="minimap-canvas-${singleCanvasId}"></canvas>
              <div class="minimap-ticks" id="minimap-ticks-${singleCanvasId}"></div>
              <div class="minimap-range" id="minimap-range-${singleCanvasId}" style="left:0%;width:100%;">
                <div class="minimap-handle left" id="minimap-handle-left-${singleCanvasId}"></div>
                <div class="minimap-handle right" id="minimap-handle-right-${singleCanvasId}"></div>
                <div class="minimap-label-left" id="minimap-label-left-${singleCanvasId}"></div>
                <div class="minimap-label-right" id="minimap-label-right-${singleCanvasId}"></div>
              </div>
            </div>
            <div class="chart-hint">拖动两端选择数据范围 · 自动裁剪</div>
        `;

        // Defer chart creation to next tick so canvas is in DOM
        setTimeout(() => {
          const ctx = document.getElementById(singleCanvasId)?.getContext('2d');
          if (!ctx) return;

          const xLabels = data.map(row => row[0]);
          const yData = data.map(row => row[col]);

          const dlen = data.length;
          const chart = new Chart(ctx, {
            type: 'line',
            data: {
              labels: xLabels,
              datasets: [{
                label: '数值',
                data: yData,
                borderColor: 'var(--accent)',
                backgroundColor: 'oklch(70% 0.05 240 / 0.15)',
                borderWidth: 2,
                pointRadius: getPointRadius(dlen),
                pointHoverRadius: getPointHoverRadius(dlen),
                pointBackgroundColor: 'var(--accent)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                tension: dlen > 500 ? 0.1 : 0.3,
                fill: true
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              interaction: {
                mode: 'index',
                intersect: false
              },
              scales: {
                x: {
                  grid: { display: false },
                  ticks: {
                    font: { size: 11 },
                    color: 'var(--text-faint)',
                    maxTicksLimit: getMaxTicksLimit(dlen)
                  },
                  border: { display: false }
                },
                y: {
                  grid: {
                    color: 'oklch(0% 0 0 / 0.04)',
                    drawBorder: false
                  },
                  ticks: {
                    font: { size: 11 },
                    color: '#9ca3af'
                  },
                  border: { display: false }
                }
              },
              plugins: {
                legend: { display: false },
                tooltip: {
                  backgroundColor: 'oklch(20% 0.02 250 / 0.9)',
                  titleFont: { size: 12 },
                  bodyFont: { size: 13 },
                  padding: 10,
                  cornerRadius: 8,
                  displayColors: false,
                  callbacks: {
                    title: () => '',
                    label: (ctx) => `数值: ${ctx.parsed.y}`
                  }
                }
              }
            }
          });

          // Store original data for restore
          chart._originalData = {
            labels: [...xLabels],
            data: [...yData],
            fullLength: data.length
          };
          chart._chartId = singleCanvasId;

          charts.set(singleCanvasId, chart);
        }, 0);
      }

      // Bind download buttons
      setTimeout(() => {
        div.querySelectorAll('.btn-icon[data-canvas]').forEach(btn => {
          btn.addEventListener('click', () => {
            const canvas = document.getElementById(btn.dataset.canvas);
            if (canvas) downloadPNG(canvas, btn.dataset.name);
          });
        });
        div.querySelectorAll('.restore-data').forEach(btn => {
          btn.addEventListener('click', () => {
            restoreChartData(btn.dataset.chart);
          });
        });
        // Setup selection for each chart
        div.querySelectorAll('.chart-canvas-wrap').forEach(wrap => {
          // Bind chart zoom events if needed
        });
        div.querySelectorAll('.minimap-wrap').forEach(mm => {
          setupMinimap(mm);
        });
      }, 0);
      return div;
    }

    function removeFile(name) {
      const entry = files.get(name);
      if (entry?.data) {
        // Find and destroy charts
        for (const [key, chart] of charts.entries()) {
          if (key.includes(name)) {
            chart.destroy();
            charts.delete(key);
          }
        }
      }
      files.delete(name);
      updateUI();
    }

    function clearAll() {
      for (const [, chart] of charts) chart.destroy();
      charts.clear();
      files.clear();
      updateUI();
    }

    function downloadPNG(canvas, name) {
      const link = document.createElement('a');
      link.download = `${name}_chart.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }

    function showError(msg) {
      errorContainer.innerHTML = `<div class="error-banner">${escapeHtml(msg)}</div>`;
      setTimeout(() => { errorContainer.innerHTML = ''; }, 5000);
    }

    function escapeHtml(str) {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }

    function formatSize(bytes) {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    // ===== Nice Ticks Generator (D3-style) =====
    function generateNiceTicks(min, max, pixelWidth) {
      const span = max - min;
      if (!span || !pixelWidth) return [];
      // Target tick count based on pixel width (min 60px per tick label)
      const targetCount = Math.max(3, Math.min(8, Math.floor(pixelWidth / 70)));
      const rawStep = span / targetCount;
      // Round step to nice number (1, 2, 5 * 10^n)
      const pow10 = Math.pow(10, Math.floor(Math.log10(rawStep)));
      const mult = rawStep / pow10;
      let step;
      if (mult <= 1) step = pow10;
      else if (mult <= 2) step = 2 * pow10;
      else if (mult <= 5) step = 5 * pow10;
      else step = 10 * pow10;
      // Determine start and end
      const start = Math.ceil(min / step) * step;
      const end = Math.floor(max / step) * step;
      const ticks = [];
      for (let v = start; v <= end + 1e-9; v += step) {
        // Format: remove trailing zeros
        const label = parseFloat(v.toPrecision(12)).toString();
        ticks.push({ value: v, label });
      }
      return ticks;
    }

    function renderTicks(ticksContainer, ticks, minVal, maxVal) {
      ticksContainer.innerHTML = '';
      const span = maxVal - minVal;
      if (!span) return;
      for (const tick of ticks) {
        const pct = ((tick.value - minVal) / span) * 100;
        if (pct < 0 || pct > 100) continue;
        const tickEl = document.createElement('div');
        tickEl.className = 'minimap-tick';
        tickEl.style.left = pct + '%';
        ticksContainer.appendChild(tickEl);
        const labelEl = document.createElement('div');
        labelEl.className = 'minimap-tick-label';
        labelEl.style.left = pct + '%';
        labelEl.textContent = tick.label;
        ticksContainer.appendChild(labelEl);
      }
    }

    // ===== Selection & Crop Functions =====
    function setupMinimap(mmWrap, cropFn) {
      const chartId = mmWrap.dataset.chart;
      const chart = charts.get(chartId);
      console.log('[setupMinimap] chart found:', !!chart, 'origData:', !!(chart && chart._originalData));
      if (!chart || !chart._originalData) {
        console.warn('[setupMinimap] abort - chart invalid');
        return;
      }

      const orig = chart._originalData;
      const canvas = mmWrap.querySelector('canvas');
      const ctx = canvas ? canvas.getContext('2d') : null;
      const range = mmWrap.querySelector('.minimap-range');
      const labelLeft = mmWrap.querySelector('.minimap-label-left');
      const labelRight = mmWrap.querySelector('.minimap-label-right');
      const ticksContainer = mmWrap.querySelector('.minimap-ticks');

      function resizeCanvas() {
        const rect = mmWrap.getBoundingClientRect();
        if (canvas && ctx) {
          const dpr = window.devicePixelRatio || 1;
          canvas.width = rect.width * dpr;
          canvas.height = rect.height * dpr;
          canvas.style.width = rect.width + 'px';
          canvas.style.height = rect.height + 'px';
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
        // Regenerate ticks on resize
        const allMin = Math.min(...orig.labels);
        const allMax = Math.max(...orig.labels);
        const ticks = generateNiceTicks(allMin, allMax, rect.width);
        if (ticksContainer) renderTicks(ticksContainer, ticks, allMin, allMax);
      }
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);

      function drawMinimap() {
        if (!canvas || !ctx) return;
        console.log('[drawMinimap] datasetsMeta exists:', !!orig.datasetsMeta, 'length:', orig.datasetsMeta ? orig.datasetsMeta.length : 0);
        const w = canvas.width / (window.devicePixelRatio || 1);
        const h = canvas.height / (window.devicePixelRatio || 1);
        ctx.clearRect(0, 0, w, h);
        
        // Support both single-file (orig.data) and overlay (orig.datasetsMeta)
        const datasetsMeta = orig.datasetsMeta || [{ data: orig.data, color: null }];
        
        datasetsMeta.forEach((ds) => {
          let data = ds.data;
          if (orig.labels.length > 500) {
            const step = Math.ceil(orig.labels.length / w);
            const s = [];
            for (let i = 0; i < orig.labels.length; i += step) {
              let maxVal = -Infinity, minVal = Infinity;
              for (let j = i; j < Math.min(i + step, orig.labels.length); j++) {
                maxVal = Math.max(maxVal, data[j]);
                minVal = Math.min(minVal, data[j]);
              }
              s.push((maxVal + minVal) / 2);
            }
            data = s;
          }
          const minY = Math.min(...data);
          const maxY = Math.max(...data);
          const rangeY = maxY - minY || 1;
          
          ctx.beginPath();
          ctx.strokeStyle = ds.color ? ds.color + '30' : 'rgba(0,0,0,0.06)';
          ctx.lineWidth = 1;
          for (let i = 0; i < data.length; i++) {
            const x = (i / (data.length - 1 || 1)) * w;
            const y = h - ((data[i] - minY) / rangeY) * (h - 4) - 2;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        });

        // Get selection range
        const leftPct = parseFloat(range.style.left) / 100;
        const rightPct = leftPct + parseFloat(range.style.width) / 100;
        
        // Clip and draw selected region for each dataset in its color
        ctx.save();
        ctx.beginPath();
        ctx.rect(leftPct * w, 0, (rightPct - leftPct) * w, h);
        ctx.clip();
        
        datasetsMeta.forEach((ds) => {
          let data = ds.data;
          if (orig.labels.length > 500) {
            const step = Math.ceil(orig.labels.length / w);
            const s = [];
            for (let i = 0; i < orig.labels.length; i += step) {
              let maxVal = -Infinity, minVal = Infinity;
              for (let j = i; j < Math.min(i + step, orig.labels.length); j++) {
                maxVal = Math.max(maxVal, data[j]);
                minVal = Math.min(minVal, data[j]);
              }
              s.push((maxVal + minVal) / 2);
            }
            data = s;
          }
          const minY = Math.min(...data);
          const maxY = Math.max(...data);
          const rangeY = maxY - minY || 1;
          
          ctx.beginPath();
          const accent = ds.color || getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#3b82f6';
          ctx.strokeStyle = accent;
          ctx.lineWidth = 1.5;
          for (let i = 0; i < data.length; i++) {
            const x = (i / (data.length - 1 || 1)) * w;
            const y = h - ((data[i] - minY) / rangeY) * (h - 4) - 2;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        });
        ctx.restore();
      }
      drawMinimap();

      let mode = null;
      let startX = 0;
      let startLeftPct = 0;
      let startRightPct = 1;

      function updateFromPct(leftPct, rightPct) {
        leftPct = Math.max(0, Math.min(1, leftPct));
        rightPct = Math.max(0, Math.min(1, rightPct));
        if (rightPct - leftPct < 0.02) {
          if (mode === 'left') leftPct = rightPct - 0.02;
          else rightPct = leftPct + 0.02;
        }
        leftPct = Math.max(0, Math.min(1, leftPct));
        rightPct = Math.max(0, Math.min(1, rightPct));
        range.style.left = (leftPct * 100) + '%';
        range.style.width = ((rightPct - leftPct) * 100) + '%';
        const minIdx = Math.floor(leftPct * (orig.labels.length - 1));
        const maxIdx = Math.floor(rightPct * (orig.labels.length - 1));
        const xMin = orig.labels[minIdx];
        const xMax = orig.labels[maxIdx];
        if (labelLeft) labelLeft.textContent = xMin.toFixed(2);
        if (labelRight) labelRight.textContent = xMax.toFixed(2);
        return { leftPct, rightPct, xMin, xMax, minIdx, maxIdx };
      }

      function getPctFromEvent(e) {
        const rect = mmWrap.getBoundingClientRect();
        return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      }

      function onStart(e) {
        console.log('[onStart] mousedown on minimap');
        const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
        const rect = mmWrap.getBoundingClientRect();
        const x = clientX - rect.left;
        const w = rect.width;
        const leftPct = parseFloat(range.style.left) / 100;
        const rightPct = leftPct + parseFloat(range.style.width) / 100;
        const leftPx = leftPct * w;
        const rightPx = rightPct * w;
        const handleW = 16;
        if (Math.abs(x - leftPx) < handleW) mode = 'left';
        else if (Math.abs(x - rightPx) < handleW) mode = 'right';
        else if (x > leftPx && x < rightPx) {
          mode = 'move';
          startX = Math.max(0, Math.min(1, x / w));
          startLeftPct = leftPct;
          startRightPct = rightPct;
        }
        mmWrap.classList.add('dragging');
        e.preventDefault();
      }

      function onMove(e) {
        if (!mode) return;
        if (!chart || !chart.scales || !chart.scales.x) { console.warn('onMove: chart invalid'); return; }
        const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
        const pct = Math.max(0, Math.min(1, (clientX - mmWrap.getBoundingClientRect().left) / mmWrap.getBoundingClientRect().width));
        let leftPct = parseFloat(range.style.left) / 100;
        let rightPct = leftPct + parseFloat(range.style.width) / 100;
        if (mode === 'left') ({ leftPct, rightPct } = updateFromPct(pct, rightPct));
        else if (mode === 'right') ({ leftPct, rightPct } = updateFromPct(leftPct, pct));
        else if (mode === 'move') {
          const delta = pct - startX;
          ({ leftPct, rightPct } = updateFromPct(startLeftPct + delta, startRightPct + delta));
        }
        if (chart && chart.scales && chart.scales.x) {
          const minIdx = Math.floor(leftPct * (orig.labels.length - 1));
          const maxIdx = Math.floor(rightPct * (orig.labels.length - 1));
          chart.scales.x.min = orig.labels[minIdx];
          chart.scales.x.max = orig.labels[maxIdx];
          // Throttle update: only real-time for single-file charts (lightweight)
          // Overlay charts with many datasets skip real-time to avoid jank
          if (chart.data.datasets.length <= 1) {
            chart.update('none');
          }
        }
        drawMinimap();
      }

      function onEnd() {
        if (!mode) return;
        console.log('[onEnd] mouseup, mode:', mode);
        if (!chart || !chart.scales || !chart.scales.x) { console.warn('onEnd: chart invalid'); return; }
        mode = null;
        mmWrap.classList.remove('dragging');
        const leftPct = parseFloat(range.style.left) / 100;
        const rightPct = leftPct + parseFloat(range.style.width) / 100;
        const minIdx = Math.floor(leftPct * (orig.labels.length - 1));
        const maxIdx = Math.floor(rightPct * (orig.labels.length - 1));
        if (rightPct - leftPct < 0.03 || maxIdx - minIdx < 5) {
          if (chart && chart.scales && chart.scales.x) {
            chart.scales.x.min = undefined;
            chart.scales.x.max = undefined;
            chart.update('none');
          }
          return;
        }
        if (typeof cropFn === 'function') {
          cropFn(orig.labels[minIdx], orig.labels[maxIdx]);
        } else {
          cropChartData(chartId, orig.labels[minIdx], orig.labels[maxIdx]);
        }
      }

      mmWrap.addEventListener('mousedown', onStart);
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onEnd);
      mmWrap.addEventListener('touchstart', onStart, { passive: false });
      document.addEventListener('touchmove', onMove, { passive: false });
      document.addEventListener('touchend', onEnd);
      mmWrap._minimapCleanup = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onEnd);
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onEnd);
      };
    }

    function cropChartData(chartId, xMin, xMax) {
      const chart = charts.get(chartId);
      console.log('[setupMinimap] chart found:', !!chart, 'origData:', !!(chart && chart._originalData));
      if (!chart || !chart._originalData) {
        console.warn('[setupMinimap] abort - chart invalid');
        return;
      }
      const orig = chart._originalData;
      const newLabels = [];
      const newData = [];
      for (let i = 0; i < orig.labels.length; i++) {
        const v = orig.labels[i];
        if (v >= xMin && v <= xMax) {
          newLabels.push(v);
          newData.push(orig.data[i]);
        }
      }
      if (newLabels.length === 0) return;
      chart.data.labels = newLabels;
      chart.data.datasets[0].data = newData;
      chart.data.datasets[0].pointRadius = getPointRadius(newLabels.length);
      chart.data.datasets[0].pointHoverRadius = getPointHoverRadius(newLabels.length);
      chart.data.datasets[0].tension = newLabels.length > 500 ? 0.1 : 0.3;
      chart.update('none');
      const card = document.getElementById('card-' + chartId);
      if (card) {
        const restoreBtn = card.querySelector('.restore-data');
        if (restoreBtn) restoreBtn.style.display = 'inline-flex';
      }
    }

    function restoreChartData(chartId) {
      const chart = charts.get(chartId);
      console.log('[setupMinimap] chart found:', !!chart, 'origData:', !!(chart && chart._originalData));
      if (!chart || !chart._originalData) {
        console.warn('[setupMinimap] abort - chart invalid');
        return;
      }
      const orig = chart._originalData;
      chart.data.labels = [...orig.labels];
      chart.data.datasets[0].data = [...orig.data];
      chart.data.datasets[0].pointRadius = getPointRadius(orig.fullLength);
      chart.data.datasets[0].pointHoverRadius = getPointHoverRadius(orig.fullLength);
      chart.data.datasets[0].tension = orig.fullLength > 500 ? 0.1 : 0.3;
      chart.update('none');
      const card = document.getElementById('card-' + chartId);
      if (card) {
        const restoreBtn = card.querySelector('.restore-data');
        if (restoreBtn) restoreBtn.style.display = 'none';
      }
    }

    // ===== Overlay Functions =====
    const overlayBtn = document.getElementById('overlayBtn');
    const overlaySection = document.getElementById('overlaySection');
    const downloadOverlayBtn = document.getElementById('downloadOverlay');
    const clearOverlayBtn = document.getElementById('clearOverlay');

    overlayBtn.addEventListener('click', drawOverlay);
    downloadOverlayBtn.addEventListener('click', () => {
      const canvas = document.getElementById('overlayCanvas');
      if (canvas) downloadPNG(canvas, 'overlay_chart');
    });
    clearOverlayBtn.addEventListener('click', clearOverlay);
    const restoreOverlayBtn = document.getElementById('restoreOverlay');
    if (restoreOverlayBtn) restoreOverlayBtn.addEventListener('click', restoreOverlayData);


    function updateOverlayButton() {
      const checked = Array.from(files.values()).filter(e => e.checked && e.data).length;
      overlayBtn.disabled = checked < 2;
      overlayBtn.textContent = checked >= 2 ? `📊 叠加绘图 (${checked})` : '📊 叠加绘图';
    }

    function drawOverlay() {
      const selected = Array.from(files.entries())
        .filter(([, e]) => e.checked && e.data)
        .map(([name, e]) => ({ name: name.replace(/\.txt$/i, ''), data: e.data }));

      if (selected.length < 2) return;

      // Clear previous overlay
      if (overlayChart) { overlayChart.destroy(); overlayChart = null; }
      charts.delete('overlay');

      // Build datasets
      const datasets = selected.map((entry, idx) => {
        const color = COLORS[idx % COLORS.length];
        const dlen = entry.data.length;
        return {
          label: entry.name,
          data: entry.data.map(row => row[1]),
          borderColor: color,
          backgroundColor: color + '14',
          borderWidth: 2,
          pointRadius: getPointRadius(dlen),
          pointHoverRadius: getPointHoverRadius(dlen),
          pointBackgroundColor: color,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          tension: dlen > 500 ? 0.1 : 0.3,
          fill: false
        };
      });

      // Use first file's X labels
      const xLabels = selected[0].data.map(row => row[0]);

      const ctx = document.getElementById('overlayCanvas').getContext('2d');
      overlayChart = new Chart(ctx, {
        type: 'line',
        data: { labels: xLabels, datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          scales: {
            x: {
              grid: { display: false },
              ticks: {
                font: { size: 11 },
                color: 'var(--text-faint)',
                maxTicksLimit: getMaxTicksLimit(xLabels.length)
              },
              border: { display: false }
            },
            y: {
              grid: { color: 'oklch(0% 0 0 / 0.04)', drawBorder: false },
              ticks: { font: { size: 11 }, color: '#9ca3af' },
              border: { display: false }
            }
          },
          plugins: {
            legend: {
              display: true,
              position: 'top',
              labels: {
                usePointStyle: true,
                pointStyle: 'circle',
                padding: 16,
                font: { size: 12 }
              }
            },
            tooltip: {
              backgroundColor: 'oklch(20% 0.02 250 / 0.9)',
              titleFont: { size: 12 },
              bodyFont: { size: 12 },
              padding: 10,
              cornerRadius: 8,
              callbacks: {
                label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y}`
              }
            },
            zoom: {
              pan: { enabled: true, mode: 'xy' },
              zoom: {
                wheel: { enabled: true },
                drag: { enabled: true, modifierKey: 'shift' },
                pinch: { enabled: true },
                mode: 'xy'
              }
            }
          }
        }
      });

      // Store original data for crop/restore
      overlayChart._originalData = {
        labels: [...xLabels],
        data: [...datasets[0].data], // backward compat for single-file minimap
        fullLength: xLabels.length,
        datasets: selected.map(e => e.data.map(row => [...row])), // for crop/restore
        datasetsMeta: selected.map((e, idx) => ({
          data: e.data.map(row => row[1]),
          color: COLORS[idx % COLORS.length]
        }))
      };
      charts.set('overlay', overlayChart);

      overlaySection.style.display = 'block';
      overlaySection.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // Setup interactive minimap for overlay
      const overlayMm = document.getElementById('overlay-minimap');
      if (overlayMm) setupMinimap(overlayMm, cropOverlayData);
    }

    function cropOverlayData(xMin, xMax) {
      const chart = overlayChart;
      if (!chart || !chart._originalData) return;
      const orig = chart._originalData;
      const indices = [];
      for (let i = 0; i < orig.labels.length; i++) {
        if (orig.labels[i] >= xMin && orig.labels[i] <= xMax) indices.push(i);
      }
      if (indices.length === 0) return;
      const newLabels = indices.map(i => orig.labels[i]);
      // Update each dataset: filter data points to same X range
      chart.data.labels = newLabels;
      chart.data.datasets.forEach((ds, dsIdx) => {
        const fullData = orig.datasets[dsIdx];
        const newData = indices.map(i => fullData[i][1]);
        ds.data = newData;
        ds.pointRadius = getPointRadius(newLabels.length);
        ds.pointHoverRadius = getPointHoverRadius(newLabels.length);
        ds.tension = newLabels.length > 500 ? 0.1 : 0.3;
      });
      chart.update('none');
      const restoreBtn = document.getElementById('restoreOverlay');
      if (restoreBtn) restoreBtn.style.display = 'inline-flex';
    }

    function restoreOverlayData() {
      const chart = overlayChart;
      if (!chart || !chart._originalData) return;
      const orig = chart._originalData;
      chart.data.labels = [...orig.labels];
      chart.data.datasets.forEach((ds, dsIdx) => {
        ds.data = orig.datasets[dsIdx].map(row => row[1]);
        ds.pointRadius = getPointRadius(orig.fullLength);
        ds.pointHoverRadius = getPointHoverRadius(orig.fullLength);
        ds.tension = orig.fullLength > 500 ? 0.1 : 0.3;
      });
      chart.update('none');
      const restoreBtn = document.getElementById('restoreOverlay');
      if (restoreBtn) restoreBtn.style.display = 'none';
    }

    function clearOverlay() {
      const mmWrap = document.getElementById('overlay-minimap');
      if (mmWrap && mmWrap._minimapCleanup) {
        mmWrap._minimapCleanup();
        mmWrap._minimapCleanup = null;
      }
      if (overlayChart) { overlayChart.destroy(); overlayChart = null; }
      charts.delete('overlay');
      overlaySection.style.display = 'none';
      // Uncheck all
      for (const entry of files.values()) entry.checked = false;
      updateOverlayButton();
      updateUI();
    }