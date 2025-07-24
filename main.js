// main.js
// Giao diện động, gửi dữ liệu lên API backend, nhận kết quả và hiển thị

const algoForm = document.getElementById('algo-form');
const algorithmSelect = document.getElementById('algorithm');
const inputSection = document.getElementById('input-section');
const stepsDiv = document.getElementById('steps');
const summaryDiv = document.getElementById('summary');
const graphDiv = document.getElementById('graph');

let network = null;

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

function createEdgeTable(numNodes, allowNegative) {
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
    addEdgeRow(tbody, numNodes, allowNegative);
}

function addEdgeRow(tbody, numNodes, allowNegative) {
    const row = document.createElement('tr');
    const idx = tbody.children.length + 1;
    row.innerHTML = `
        <td>${idx}</td>
        <td><input type="number" min="0" max="${numNodes-1}" required style="width:60px"></td>
        <td><input type="number" min="0" max="${numNodes-1}" required style="width:60px"></td>
        <td><input type="number" ${allowNegative ? '' : 'min="0"'} required style="width:80px"></td>
        <td><button type="button">X</button></td>
    `;
    row.querySelector('button').onclick = () => row.remove();
    tbody.appendChild(row);
}

function createHeuristicInput(numNodes) {
    const labelEl = document.createElement('label');
    labelEl.textContent = `Nhập heuristic cho từng đỉnh (cách nhau bởi dấu cách, ${numNodes} số nguyên không âm):`;
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
    stepsDiv.innerHTML = steps.map(s => `<div>${s}</div>`).join('');
}

function showSummary(text) {
    summaryDiv.textContent = text;
}

function showGraph(numNodes, edges, path=[]) {
    const nodes = Array.from({length: numNodes}, (_, i) => ({id: i, label: i.toString()}));
    const edgeList = edges.map(([u, v, w]) => ({from: u, to: v, label: w.toString(), color: {color: '#b0bec5'}}));
    if (path && path.length > 1) {
        for (let i = 0; i < path.length-1; ++i) {
            const u = path[i], v = path[i+1];
            const e = edgeList.find(e => (e.from === u && e.to === v) || (e.from === v && e.to === u));
            if (e) e.color = {color: '#e53935'};
        }
    }
    const data = {nodes: new vis.DataSet(nodes), edges: new vis.DataSet(edgeList)};
    const options = {
        nodes: {shape: 'circle', size: 30, font: {size: 18}},
        edges: {font: {align: 'top'}, width: 2},
        physics: {enabled: true},
    };
    if (network) network.destroy();
    network = new vis.Network(graphDiv, data, options);
}

algorithmSelect.addEventListener('change', () => {
    clearInputSection();
    stepsDiv.innerHTML = '';
    summaryDiv.innerHTML = '';
    graphDiv.innerHTML = '';
    const algo = algorithmSelect.value;
    if (!algo) return;
    const numNodesInput = createInput('Số đỉnh (n > 0):', 'num-nodes', 'number', 1, null, 4);
    const numEdgesInput = createInput('Số cạnh (>= 0):', 'num-edges', 'number', 0, null, 4);
    function updateEdgeTable() {
        const old = document.getElementById('edge-table-wrapper');
        if (old) old.remove();
        const n = parseInt(numNodesInput.value) || 0;
        const allowNegative = (algo === 'bellmanford');
        if (n > 0) createEdgeTable(n, allowNegative);
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
});

algoForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    stepsDiv.innerHTML = '';
    summaryDiv.innerHTML = '';
    graphDiv.innerHTML = '';
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
        const res = await fetch('http://localhost:5000/run-algorithm', {
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
        if (algo === 'bfs' || algo === 'dfs') {
            showSummary(`Số bước duyệt: ${(data.path||[]).length}. Thứ tự duyệt: [${(data.path||[]).join(', ')}]`);
            showGraph(numNodes, edges, data.path);
        } else if (algo === 'dijkstra' || algo === 'bellmanford') {
            if (data.path && data.path.length) {
                showSummary(`Độ dài đường đi ngắn nhất từ ${start} đến ${end}: ${data.dist ? data.dist[end] : ''}. Đường đi: [${data.path.join(', ')}]`);
            } else if (data.dist === null) {
                showSummary('Đồ thị có chu trình âm!');
            } else {
                showSummary('Không tồn tại đường đi.');
            }
            showGraph(numNodes, edges, data.path);
        } else if (algo === 'astar') {
            if (data.path && data.path.length) {
                showSummary(`Độ dài đường đi ngắn nhất từ ${start} đến ${end}: ${data.path.length-1}. Đường đi: [${data.path.join(', ')}]`);
            } else {
                showSummary('Không tồn tại đường đi.');
            }
            showGraph(numNodes, edges, data.path);
        }
    } catch (err) {
        alert('Không thể kết nối tới server backend!');
    }
}); 