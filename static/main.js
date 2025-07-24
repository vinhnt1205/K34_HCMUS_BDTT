// main.js
// Giao diện động, gửi dữ liệu lên API backend, nhận kết quả và hiển thị

const algoForm = document.getElementById('algo-form');
const algorithmSelect = document.getElementById('algorithm');
const inputSection = document.getElementById('input-section');
const stepsDiv = document.getElementById('steps');
const summaryDiv = document.getElementById('summary');
const graphDiv = document.getElementById('graph');

let network = null;

const COMPLEXITY_INFO = {
    bfs: {
        label: 'BFS',
        formula: 'O(V + E)',
        calc: (V, E) => `O(${V} + ${E})`,
        result: (V, E) => `O(${V + E})`
    },
    dfs: {
        label: 'DFS',
        formula: 'O(V + E)',
        calc: (V, E) => `O(${V} + ${E})`,
        result: (V, E) => `O(${V + E})`
    },
    dijkstra: {
        label: 'Dijkstra',
        formula: 'O((V + E) log V)',
        calc: (V, E) => `O((${V} + ${E}) × log₂${V})`,
        result: (V, E) => {
            const val = (V + E) * Math.log2(V > 0 ? V : 1);
            return `O(${val.toFixed(2)})`;
        }
    },
    bellmanford: {
        label: 'Bellman-Ford',
        formula: 'O(V × E)',
        calc: (V, E) => `O(${V} × ${E})`,
        result: (V, E) => `O(${V * E})`
    },
    astar: {
        label: 'A*',
        formula: 'O(E)',
        calc: (V, E) => `O(${E})`,
        result: (V, E) => `O(${E})`
    }
};

function showComplexity(algo, V, E) {
    const label = document.getElementById('complexity-label');
    const formula = document.getElementById('complexity-formula');
    const calc = document.getElementById('complexity-calc');
    const result = document.getElementById('complexity-result');
    if (!COMPLEXITY_INFO[algo] || !V || V <= 0) {
        label.textContent = '';
        formula.textContent = '';
        calc.textContent = '';
        result.textContent = '';
        return;
    }
    label.textContent = `Độ phức tạp thời gian:`;
    formula.textContent = COMPLEXITY_INFO[algo].formula;
    calc.textContent = COMPLEXITY_INFO[algo].calc(V, E);
    result.textContent = COMPLEXITY_INFO[algo].result(V, E);
}

function clearInputSection() {
    inputSection.innerHTML = '';
}

function createInput(label, id, type = 'number', min = null, max = null, value = '') {
    const labelEl = document.createElement('label');
    labelEl.htmlFor = id;
    labelEl.textContent = label;
    const inputEl = document.createElement('input');
    inputEl.type = type;
    inputEl.id = id;
    inputEl.name = id;
    if (min !== null) inputEl.min = min;
    if (max !== null) inputEl.max = max;
    if (value !== '') inputEl.value = value;
    inputSection.appendChild(labelEl);
    inputSection.appendChild(inputEl);
    return inputEl;
}

function createEdgeTable(numNodes, allowNegative, numEdges) {
    const wrapper = document.createElement('div');
    wrapper.id = 'edge-table-wrapper';
    wrapper.innerHTML = `<label>Nhập các cạnh (u, v, weight):</label>`;
    const table = document.createElement('table');
    table.className = 'edge-table';
    const thead = document.createElement('thead');
    thead.innerHTML = '<tr><th>#</th><th>u</th><th>v</th><th>weight</th><th></th></tr>';
    table.appendChild(thead);
    const tbody = document.createElement('tbody');
    table.appendChild(tbody);
    wrapper.appendChild(table);
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.textContent = 'Thêm cạnh';
    addBtn.onclick = () => addEdgeRow(tbody, numNodes, allowNegative);
    wrapper.appendChild(addBtn);
    inputSection.appendChild(wrapper);
    // Tạo đủ số dòng cạnh theo numEdges
    for (let i = 0; i < numEdges; ++i) {
        addEdgeRow(tbody, numNodes, allowNegative);
    }
}

function addEdgeRow(tbody, numNodes, allowNegative) {
    const row = document.createElement('tr');
    const idx = tbody.children.length + 1;
    row.innerHTML = `
        <td>${idx}</td>
        <td><input type="number" min="0" max="${numNodes-1}" required class="edge-input" /></td>
        <td><input type="number" min="0" max="${numNodes-1}" required class="edge-input" /></td>
        <td><input type="number" ${allowNegative ? '' : 'min="0"'} required class="edge-input" /></td>
        <td><button type="button" class="remove-btn">X</button></td>
    `;
    row.querySelector('button').onclick = () => row.remove();
    tbody.appendChild(row);

    // Bổ sung: Xử lý Enter để chuyển ô hoặc thêm dòng mới
    const inputs = row.querySelectorAll('input');
    inputs.forEach((input, i) => {
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (i < inputs.length - 1) {
                    // Sang ô tiếp theo trong dòng
                    inputs[i+1].focus();
                } else {
                    // Đang ở ô cuối cùng, thêm dòng mới nếu chưa đủ số dòng
                    const table = tbody.parentElement;
                    const numEdgesInput = document.getElementById('num-edges');
                    const maxRows = numEdgesInput ? parseInt(numEdgesInput.value) : null;
                    if (!maxRows || tbody.children.length < maxRows) {
                        addEdgeRow(tbody, numNodes, allowNegative);
                        // Focus vào ô đầu tiên của dòng mới
                        const newRow = tbody.lastElementChild;
                        if (newRow) {
                            const firstInput = newRow.querySelector('input');
                            if (firstInput) firstInput.focus();
                        }
                    } else {
                        // Nếu đã đủ số dòng, focus vào ô đầu tiên của dòng tiếp theo (nếu có)
                        const nextRow = row.nextElementSibling;
                        if (nextRow) {
                            const firstInput = nextRow.querySelector('input');
                            if (firstInput) firstInput.focus();
                        }
                    }
                }
            }
        });
    });
}

function createHeuristicInput(numNodes) {
    const labelEl = document.createElement('label');
    labelEl.textContent = `Nhập heuristic cho từng đỉnh, ${numNodes} số nguyên không âm):`;
    const inputEl = document.createElement('input');
    inputEl.type = 'text';
    inputEl.id = 'heuristic';
    inputEl.placeholder = 'Ví dụ: 7 6 2 0';
    inputSection.appendChild(labelEl);
    inputSection.appendChild(inputEl);
    return inputEl;
}

function getEdgeListFromTable() {
    const rows = inputSection.querySelectorAll('table.edge-table tbody tr');
    const edges = [];
    for (const row of rows) {
        const inputs = row.querySelectorAll('input');
        if (inputs.length === 3) {
            const u = parseInt(inputs[0].value);
            const v = parseInt(inputs[1].value);
            const w = parseInt(inputs[2].value);
            if (!isNaN(u) && !isNaN(v) && !isNaN(w)) {
                edges.push([u, v, w]);
            }
        }
    }
    return edges;
}

function showSteps(steps) {
    // Đánh số thứ tự cho từng bước, bỏ qua dòng trống
    let html = '';
    let stepNum = 1;
    for (let s of steps) {
        if (s.trim() === '') continue;
        // Nếu đã có 'Bước' ở đầu thì giữ nguyên, nếu không thì thêm số thứ tự
        if (/^Bước\s*\d+/.test(s.trim())) {
            html += `<div>${s}</div>`;
        } else {
            html += `<div><b>Bước ${stepNum}:</b> ${s}</div>`;
            stepNum++;
        }
    }
    stepsDiv.innerHTML = html;
}

function showSummary(text) {
    summaryDiv.textContent = text;
}

function showGraph(numNodes, edges, path=[]) {
    // Xóa nội dung cũ
    graphDiv.innerHTML = '';
    // Đảm bảo icon tooltip luôn có mặt nếu đã chọn thuật toán
    var tooltipIcon = document.getElementById('graphTooltipIcon');
    if (!tooltipIcon) {
        tooltipIcon = document.createElement('span');
        tooltipIcon.id = 'graphTooltipIcon';
        tooltipIcon.className = 'tooltip-icon';
        tooltipIcon.title = 'Hiển thị thông tin';
        tooltipIcon.innerHTML = '&#9432;';
        tooltipIcon.style.display = 'inline-block';
        graphDiv.appendChild(tooltipIcon);
        // Gắn lại sự kiện click cho icon
        var modal = document.getElementById('graphModal');
        var closeBtn = document.getElementById('closeGraphModal');
        if (modal && closeBtn) {
            tooltipIcon.addEventListener('click', function(event) {
                event.stopPropagation();
                modal.style.display = 'block';
            });
        }
    } else {
        tooltipIcon.style.display = 'inline-block';
        graphDiv.appendChild(tooltipIcon);
    }
    // Tạo node và edge cho Cytoscape
    const cyNodes = Array.from({length: numNodes}, (_, i) => ({ data: { id: i.toString(), label: i.toString() } }));
    const cyEdges = edges.map(([u, v, w], idx) => ({
        data: {
            id: `e${u}_${v}_${idx}`,
            source: u.toString(),
            target: v.toString(),
            label: w.toString(),
            weight: w
        },
        classes: ''
    }));
    // Highlight path
    if (path && path.length > 1) {
        for (let i = 0; i < path.length-1; ++i) {
            const u = path[i], v = path[i+1];
            // Tìm edge đúng chiều hoặc ngược chiều
            const edge = cyEdges.find(e =>
                (e.data.source === u.toString() && e.data.target === v.toString()) ||
                (e.data.source === v.toString() && e.data.target === u.toString())
            );
            if (edge) edge.classes = 'highlighted';
        }
    }
    // Khởi tạo Cytoscape
    const cy = cytoscape({
        container: graphDiv,
        elements: [ ...cyNodes, ...cyEdges ],
        style: [
            {
                selector: 'node',
                style: {
                    'background-color': '#1976d2',
                    'label': 'data(label)',
                    'color': '#fff',
                    'text-valign': 'center',
                    'text-halign': 'center',
                    'font-size': '18px',
                    'width': 40,
                    'height': 40,
                    'font-weight': 'bold',
                    'border-width': 2,
                    'border-color': '#fff'
                }
            },
            {
                selector: 'edge',
                style: {
                    'width': 3,
                    'line-color': '#b0bec5',
                    'target-arrow-color': '#b0bec5',
                    'target-arrow-shape': 'triangle',
                    'curve-style': 'bezier',
                    'label': 'data(label)',
                    'font-size': '14px',
                    'text-background-color': '#fff',
                    'text-background-opacity': 1,
                    'text-background-padding': 2
                }
            },
            {
                selector: 'edge.highlighted',
                style: {
                    'line-color': '#e53935',
                    'target-arrow-color': '#e53935',
                    'width': 5
                }
            }
        ],
        layout: {
            name: 'cose',
            animate: true,
            animationDuration: 700
        }
    });
    // Animation highlight path (nếu muốn hiệu ứng từng bước)
    if (path && path.length > 1) {
        let i = 0;
        function animateStep() {
            if (i >= path.length-1) return;
            const u = path[i], v = path[i+1];
            const edge = cy.edges().filter(e =>
                (e.data('source') === u.toString() && e.data('target') === v.toString()) ||
                (e.data('source') === v.toString() && e.data('target') === u.toString())
            );
            edge.addClass('highlighted');
            i++;
            setTimeout(animateStep, 400);
        }
        // Xóa highlight cũ
        cy.edges().removeClass('highlighted');
        setTimeout(animateStep, 500);
    }
}

function showGraphDict(numNodes, edges) {
    // Dựng graph_dict dạng {i: [(v, w), ...], ...}
    const dict = {};
    for (let i = 0; i < numNodes; ++i) dict[i] = [];
    for (const [u, v, w] of edges) {
        dict[u].push([v, w]);
        dict[v].push([u, w]);
    }
    // Format giống Python
    let s = 'graph = {\n';
    for (let k = 0; k < numNodes; ++k) {
        s += `    ${k}: [`;
        s += dict[k].map(pair => `(${pair[0]}, ${pair[1]})`).join(', ');
        s += '],\n';
    }
    s += '}';
    document.getElementById('graph-structure').textContent = s;
}

function calcPathCost(edges, path) {
    // Tính tổng trọng số các cạnh trên path
    let cost = 0;
    for (let i = 0; i < path.length-1; ++i) {
        const u = path[i], v = path[i+1];
        // Tìm cạnh đúng chiều hoặc ngược chiều
        const edge = edges.find(([a, b]) => (a === u && b === v) || (a === v && b === u));
        if (edge) cost += edge[2];
    }
    return cost;
}

function setupTabEnterNavigation() {
    // Lấy tất cả input trên form theo thứ tự xuấn hiện
    const form = document.getElementById('algo-form');
    const inputs = Array.from(form.querySelectorAll('input, select'));
    inputs.forEach((input, idx) => {
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                // Nếu là input cuối cùng, submit form
                if (idx === inputs.length - 1) {
                    form.requestSubmit();
                } else {
                    // Focus sang input tiếp theo
                    let nextIdx = idx + 1;
                    // Bỏ qua input bị disabled/ẩn
                    while (nextIdx < inputs.length && (inputs[nextIdx].disabled || inputs[nextIdx].offsetParent === null)) {
                        nextIdx++;
                    }
                    if (nextIdx < inputs.length) {
                        inputs[nextIdx].focus();
                    }
                }
            }
        });
    });
}

algorithmSelect.addEventListener('change', () => {
    clearInputSection();
    stepsDiv.innerHTML = '';
    summaryDiv.innerHTML = '';
    graphDiv.innerHTML = '';
    document.getElementById('graph-structure').textContent = '';
    if (network) network.destroy();
    const algo = algorithmSelect.value;
    showComplexity(algo, 0, 0);
    if (!algo) return;
    const numNodesInput = createInput('Số đỉnh (n > 0):', 'num-nodes', 'number', 1, null, 4);
    const numEdgesInput = createInput('Số cạnh (>= 0):', 'num-edges', 'number', 0, null, 4);
    // Khi nhập số đỉnh/cạnh thì cập nhật độ phức tạp
    function updateComplexity() {
        const V = parseInt(numNodesInput.value) || 0;
        const E = parseInt(numEdgesInput.value) || 0;
        showComplexity(algo, V, E);
    }
    numNodesInput.addEventListener('input', updateComplexity);
    numEdgesInput.addEventListener('input', updateComplexity);
    // Sửa lại updateEdgeTable để luôn gọi updateComplexity sau khi render
    function updateEdgeTable() {
        const old = document.getElementById('edge-table-wrapper');
        if (old) old.remove();
        const n = parseInt(numNodesInput.value) || 0;
        const m = parseInt(numEdgesInput.value) || 0;
        const allowNegative = (algo === 'bellmanford');
        if (n > 0 && m >= 0) createEdgeTable(n, allowNegative, m);
        // Sau khi tạo bảng cạnh, thiết lập lại navigation
        setupTabEnterNavigation();
        // Luôn cập nhật lại độ phức tạp
        updateComplexity();
    }
    numNodesInput.addEventListener('input', updateEdgeTable);
    numEdgesInput.addEventListener('input', updateEdgeTable);
    updateEdgeTable();
    let heuristicInput = null;
    if (algo === 'astar') {
        heuristicInput = createHeuristicInput(parseInt(numNodesInput.value) || 4);
        numNodesInput.addEventListener('input', () => {
            heuristicInput.value = '';
            heuristicInput.placeholder = `Ví dụ: ${Array.from({length: parseInt(numNodesInput.value)||4}, (_,i)=>i*2).join(' ')}`;
        });
    }
    let startInput = null, endInput = null;
    if (algo === 'bfs' || algo === 'dfs') {
        startInput = createInput('Đỉnh bắt đầu (0 <= start < n):', 'start', 'number', 0, null, 0);
    } else if (algo === 'dijkstra' || algo === 'bellmanford' || algo === 'astar') {
        startInput = createInput('Đỉnh bắt đầu (0 <= start < n):', 'start', 'number', 0, null, 0);
        endInput = createInput('Đỉnh kết thúc (0 <= end < n):', 'end', 'number', 0, null, 1);
    }
    // Thiết lập navigation cho tất cả input mới tạo
    setTimeout(setupTabEnterNavigation, 30);
});

algoForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    stepsDiv.innerHTML = '';
    summaryDiv.innerHTML = '';
    graphDiv.innerHTML = '';
    document.getElementById('graph-structure').textContent = '';
    if (network) network.destroy();
    const algo = algorithmSelect.value;
    const numNodes = parseInt(document.getElementById('num-nodes').value);
    const numEdges = parseInt(document.getElementById('num-edges').value);
    if (!algo || !numNodes || numNodes <= 0 || numEdges < 0) {
        alert('Vui lòng nhập đúng số đỉnh và số cạnh!');
        return;
    }
    let edges = getEdgeListFromTable();
    if (edges.length !== numEdges) {
        alert('Số cạnh nhập vào chưa đúng!');
        return;
    }
    // Hiển thị cấu trúc đồ thị
    showGraphDict(numNodes, edges);
    for (const [u, v, w] of edges) {
        if (u < 0 || u >= numNodes || v < 0 || v >= numNodes) {
            alert('Các đỉnh của cạnh phải nằm trong khoảng [0, n-1]!');
            return;
        }
        if ((algo === 'dijkstra' || algo === 'astar') && w < 0) {
            alert('Không được nhập cạnh có trọng số âm cho Dijkstra hoặc A*!');
            return;
        }
    }
    let heuristic = [];
    if (algo === 'astar') {
        const hStr = document.getElementById('heuristic').value.trim();
        heuristic = hStr.split(/\s+/).map(Number);
        if (heuristic.length !== numNodes || heuristic.some(h => isNaN(h) || h < 0)) {
            alert('Heuristic phải là dãy số nguyên không âm, đủ số lượng đỉnh!');
            return;
        }
    }
    let start = null, end = null;
    if (document.getElementById('start')) {
        start = parseInt(document.getElementById('start').value);
        if (isNaN(start) || start < 0 || start >= numNodes) {
            alert('Đỉnh bắt đầu không hợp lệ!');
            return;
        }
    }
    if (document.getElementById('end')) {
        end = parseInt(document.getElementById('end').value);
        if (isNaN(end) || end < 0 || end >= numNodes) {
            alert('Đỉnh kết thúc không hợp lệ!');
            return;
        }
    }
    // Gửi dữ liệu lên API backend
    try {
        const res = await fetch('/run-algorithm', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                algorithm: algo,
                num_nodes: numNodes,
                edges: edges,
                start: start,
                end: end,
                heuristic: heuristic
            })
        });
        const data = await res.json();
        if (!res.ok) {
            alert(data.error || 'Lỗi server!');
            return;
        }
        showSteps(data.steps || []);
        // Hiển thị summary rõ ràng hơn cho từng thuật toán
        if (algo === 'bfs' || algo === 'dfs') {
            const path = data.path || [];
            let summary = `Số đỉnh đã duyệt: ${path.length}`;
            if (path.length > 0) {
                summary += `\nThứ tự duyệt: [${path.join(', ')}]`;
                summary += `\nĐộ dài đường đi: ${path.length-1}`;
            }
            showSummary(summary);
            showGraph(numNodes, edges, path);
        } else if (algo === 'dijkstra' || algo === 'bellmanford') {
            const path = data.path || [];
            let summary = '';
            if (data.dist === null) {
                summary = 'Đồ thị có chu trình âm!';
            } else if (path.length) {
                const cost = calcPathCost(edges, path);
                summary = `Đường đi ngắn nhất từ ${start} đến ${end}: [${path.join(', ')}]`;
                summary += `\nĐộ dài đường đi: ${path.length-1}`;
                summary += `\nChi phí (tổng trọng số): ${cost}`;
            } else {
                summary = 'Không tồn tại đường đi.';
            }
            showSummary(summary);
            showGraph(numNodes, edges, path);
        } else if (algo === 'astar') {
            const path = data.path || [];
            let summary = '';
            if (path.length) {
                const cost = calcPathCost(edges, path);
                summary = `Đường đi ngắn nhất từ ${start} đến ${end}: [${path.join(', ')}]`;
                summary += `\nĐộ dài đường đi: ${path.length-1}`;
                summary += `\nChi phí (tổng trọng số): ${cost}`;
            } else {
                summary = 'Không tồn tại đường đi.';
            }
            showSummary(summary);
            showGraph(numNodes, edges, path);
        }
    } catch (err) {
        console.error('Lỗi khi gọi API:', err);
        alert('Không thể kết nối tới server backend!');
    }
});

document.addEventListener('DOMContentLoaded', function() {
    var tooltipIcon = document.getElementById('graphTooltipIcon');
    var modal = document.getElementById('graphModal');
    var closeBtn = document.getElementById('closeGraphModal');

    if (tooltipIcon && modal && closeBtn) {
        tooltipIcon.addEventListener('click', function(event) {
            event.stopPropagation(); // Ngăn click lan ra ngoài
            modal.style.display = 'block';
        });
        closeBtn.addEventListener('click', function() {
            modal.style.display = 'none';
        });
        // Đóng modal khi click ra ngoài nội dung modal
        window.addEventListener('click', function(event) {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
    var resultTooltipIcon = document.getElementById('resultTooltipIcon');
    var modalText = document.getElementById('modalTextContent');
    if (resultTooltipIcon && modal && closeBtn && modalText) {
        resultTooltipIcon.addEventListener('click', function(event) {
            event.stopPropagation();
            modalText.textContent = 'Khu vực này hiển thị kết quả và các bước thực hiện của thuật toán bạn đã chọn.';
            modal.style.display = 'block';
        });
    }
}); 